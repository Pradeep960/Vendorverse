import pdfplumber
import easyocr
from PIL import Image
import numpy as np
import requests
import json
import re
import time
import os
from dotenv import load_dotenv

load_dotenv()

from models import Vendor, VendorSearchRequest, ComplianceResult, ComplianceBadges, PlanningResult

reader = easyocr.Reader(['en'], gpu=False)

# ─── LLM Provider Config ─────────────────────────────────────────────────────
# Switch providers via .env — no code changes needed:
#
#   LLM_PROVIDER=groq    → Groq free tier (llama-3.3-70b)  ← use for testing
#   LLM_PROVIDER=azure   → Azure OpenAI GPT-4.1 mini       ← use for production
#
# .env keys required:
#   Groq:  GROQ_API_KEY
#   Azure: AZURE_OPENAI_API_KEY  +  AZURE_OPENAI_BASE_URL

LLM_PROVIDER = os.getenv("LLM_PROVIDER", "azure").lower()

# Groq
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GROQ_URL     = "https://api.groq.com/openai/v1/chat/completions"
GROQ_MODEL   = "llama-3.3-70b-versatile"

# Azure OpenAI
AZURE_API_KEY  = os.getenv("AZURE_OPENAI_API_KEY")
AZURE_BASE_URL = os.getenv("AZURE_OPENAI_BASE_URL")

print(f"[LLM] Active provider: {LLM_PROVIDER.upper()}")


# ─── Groq backend ─────────────────────────────────────────────────────────────
def _call_groq(prompt: str, max_tokens: int, temperature: float, retries: int) -> str:
    for attempt in range(retries):
        try:
            response = requests.post(
                GROQ_URL,
                headers={"Authorization": f"Bearer {GROQ_API_KEY}", "Content-Type": "application/json"},
                json={"model": GROQ_MODEL, "messages": [{"role": "user", "content": prompt}],
                      "temperature": temperature, "max_tokens": max_tokens},
                timeout=45,
            )
            if response.status_code == 429:
                wait = 2 ** attempt
                print(f"[RATE LIMIT] Groq retrying in {wait}s...")
                time.sleep(wait)
                continue
            response.raise_for_status()
            return response.json()["choices"][0]["message"]["content"]
        except requests.exceptions.ConnectionError:
            raise RuntimeError("Cannot reach Groq API.")
        except requests.exceptions.HTTPError:
            raise RuntimeError(f"Groq error {response.status_code}: {response.text[:300]}")
    raise RuntimeError("Groq: Failed after all retries.")


# ─── Azure OpenAI backend ─────────────────────────────────────────────────────
def _call_azure(prompt: str, max_tokens: int, temperature: float, retries: int) -> str:
    for attempt in range(retries):
        try:
            response = requests.post(
                AZURE_BASE_URL,
                headers={"api-key": AZURE_API_KEY, "Content-Type": "application/json"},
                json={"messages": [{"role": "user", "content": prompt}],
                      "temperature": temperature, "max_tokens": max_tokens},
                timeout=45,
            )
            if response.status_code == 429:
                wait = 2 ** attempt
                print(f"[RATE LIMIT] Azure retrying in {wait}s...")
                time.sleep(wait)
                continue
            response.raise_for_status()
            return response.json()["choices"][0]["message"]["content"]
        except requests.exceptions.ConnectionError:
            raise RuntimeError("Cannot reach Azure OpenAI. Check network/VPN.")
        except requests.exceptions.HTTPError:
            raise RuntimeError(f"Azure error {response.status_code}: {response.text[:300]}")
    raise RuntimeError("Azure OpenAI: Failed after all retries.")


# ─── Single entrypoint — routes based on LLM_PROVIDER ────────────────────────
def call_llm(prompt: str, max_tokens: int = 800, temperature: float = 0.2, retries: int = 4) -> str:
    if LLM_PROVIDER == "groq":
        return _call_groq(prompt, max_tokens, temperature, retries)
    return _call_azure(prompt, max_tokens, temperature, retries)


# Aliases — nothing else in the codebase needs to change
call_groq   = call_llm
call_gemini = call_llm
call_ollama = call_llm


# ─── JSON parser ─────────────────────────────────────────────────────────────
def _parse_json(text: str, bracket: str = "{"):
    text = re.sub(r"```(?:json)?", "", text).replace("```", "").strip()
    close = "}" if bracket == "{" else "]"
    start = text.find(bracket)
    end = text.rfind(close) + 1
    if start == -1 or end == 0:
        return None
    try:
        return json.loads(text[start:end])
    except json.JSONDecodeError:
        return None


# ─── 1. PLANNING AGENT ───────────────────────────────────────────────────────
def run_planning_agent(req: VendorSearchRequest) -> dict:
    """
    Stage 1 of the agentic loop — runs once per search request.
    GPT-4.1 mini reasons about the buyer's request to:
      - Correct product terminology to exact industry terms
      - Fix/expand certifications (e.g. "FCC on passive racks" -> UL / TIA-310 / NEBS)
      - Inject regional market knowledge (e.g. Oregon -> Hillsboro, Boardman DC corridor)
      - Segment the market (hyperscale / enterprise / regional / budget)
      - Generate 4 targeted search queries covering different angles
    """
    certs = ", ".join(req.certifications) if req.certifications else "not specified"

    prompt = f"""You are a senior procurement analyst specializing in industrial equipment sourcing.

A buyer needs: "{req.part}"
Requested certifications: {certs}
Location: {req.location}
Budget: ${req.budget or 'not specified'}
Quantity: {req.quantity or 'not specified'}

Your tasks:
1. CORRECT the product name to the exact industry term (e.g. "racks" -> "server rack enclosures and cabinets EIA-310").
2. IDENTIFY the correct certifications for this product category — do not blindly accept what the buyer said.
3. PROVIDE specific regional market knowledge: name industrial zones, known supplier clusters, or dealer networks in {req.location}.
4. SEGMENT the market: enterprise (large deployments), regional (local suppliers/dealers), budget (cost-optimised or second-hand).

5. GENERATE exactly 3 search queries using this strict priority:
   - Query 1: CITY + product with "dealer" OR "distributor" OR "service center" (e.g. "precision AC dealer Hyderabad Telangana")
   - Query 2: STATE/REGION-level if city search may be thin — neighboring cities or state (e.g. "data center cooling supplier Telangana India")
   - Query 3: CERTIFIED supplier in the country matching the location (e.g. "ISO 9001 CRAC unit manufacturer India")

   RULES for queries:
   - NEVER generate "top 10", "best X", or global brand queries — these return listicles not vendors
   - ALWAYS include the city name in at least 2 of the 4 queries
   - Use terms like: supplier, dealer, distributor, manufacturer, service center, stockist
   - If budget is specified, one query can target "used" or "refurbished" locally

Return ONLY valid JSON — no markdown fences, no explanation outside the JSON:
{{
  "corrected_part": "exact industry product term",
  "correct_certifications": ["cert1", "cert2", "cert3"],
  "certification_note": "Clear explanation of why these certs apply and any buyer misconceptions corrected",
  "regional_context": "Specific regional knowledge: industrial zones, dealer networks, supplier clusters in {req.location}",
  "market_segments": {{
    "enterprise": ["vendor type or named examples"],
    "regional": ["vendor type or named examples"],
    "budget": ["vendor type or named examples"]
  }},
  "search_queries": [
    "city dealer/distributor query",
    "state/region level supplier query",
    "certified supplier in country query"
  ],
  "domain_knowledge": "2-3 sentence expert summary: typical lead times, pricing norms, local supply chain notes for this product in {req.location}"
}}"""

    print("  [Planning Agent] GPT-4.1 mini reasoning...")
    resp = call_llm(prompt, max_tokens=900, temperature=0.2)
    parsed = _parse_json(resp, "{")

    if not parsed:
        print("  [Planning Agent] JSON parse failed — using fallback plan")
        cert_str = " ".join(req.certifications or [])
        return {
            "corrected_part": req.part,
            "correct_certifications": req.certifications,
            "certification_note": "Using user-specified certifications (planning agent parse failed)",
            "regional_context": req.location,
            "market_segments": {},
            "search_queries": [
                f"{req.part} manufacturer {req.location} {cert_str}".strip(),
                f"top {req.part} vendors",
                f"{req.part} certified supplier {cert_str}".strip(),
                f"{req.part} distributor pricing",
            ],
            "domain_knowledge": "",
        }

    queries = parsed.get("search_queries", [])
    if not queries:
        queries = [f"{req.part} vendor {req.location}"]
    parsed["search_queries"] = queries[:3]

    print(f"  [Planning Agent] Corrected part : {parsed.get('corrected_part')}")
    print(f"  [Planning Agent] Certifications : {parsed.get('correct_certifications')}")
    print(f"  [Planning Agent] Queries        : {parsed['search_queries']}")
    return parsed


# ─── 2. Per-vendor enrichment agent ──────────────────────────────────────────
def analyze_vendor_with_llm(
    vendor_name: str,
    url: str,
    snippet: str,
    scraped_text: str,
    req: VendorSearchRequest,
    website_live: bool,
    plan: dict,
) -> dict:
    """
    Per-vendor LLM analysis — runs once per crawled result.
    Uses the planning agent's corrected product + cert context for accurate scoring.
    Also explicitly probes for compliance signals that the caller's filters require.
    Low temperature (0.1) for consistent structured JSON output.
    """
    max_text_len = 2000
    scraped_text = (scraped_text[:max_text_len] + "...") if len(scraped_text) > max_text_len else scraped_text

    corrected_part  = plan.get("corrected_part", req.part)
    correct_certs   = plan.get("correct_certifications", req.certifications)
    market_segments = plan.get("market_segments", {})

    prompt = f"""Analyze this vendor for a procurement decision.

Vendor: {vendor_name}
URL: {url}
Snippet: {snippet}
Website content (truncated): {scraped_text}

Buyer needs:
  Product: {corrected_part}
  Certifications: {correct_certs}
  Location: {req.location}
  Budget: ${req.budget or 'not specified'}

Market segment reference:
  Hyperscale-grade: {market_segments.get('hyperscale', [])}
  Enterprise: {market_segments.get('enterprise', [])}
  Regional: {market_segments.get('regional', [])}
  Budget: {market_segments.get('budget', [])}

Tasks:
1. Is this a REAL product vendor (manufacturer/distributor) for the requested product, or a marketplace/directory/blog/unrelated service?
2. Score relevance 0-100 for this exact product.
3. Which market segment fits this vendor best?
4. Evaluate ALL compliance signals below from the available evidence. Only mark true if the website text explicitly mentions or confirms it.

Compliance signals to check:
  - ISO certifications (ISO 9001, ISO 14001, ISO 27001, ISO 13485, etc.)
  - Safety/regulatory: CE marking, RoHS, OSHA compliance
  - Data security: GDPR compliance statement, SOC 2 certification
  - Ethics: Anti-bribery policy, FCPA, ABC compliance, code of conduct
  - ESG/Sustainability: sustainability report, CSR page, carbon targets (score 0-100, null if no mention)

Return ONLY valid JSON:
{{
  "relevance_score": 0-100,
  "recommendation": "one specific concrete sentence about this vendor for this product",
  "budget_fit": "Within budget / Exceeds budget / Unknown",
  "market_segment": "hyperscale / enterprise / regional / budget",
  "compliance": {{
    "badges": {{
      "company_legitimate": true/false,
      "not_blacklisted": true/false,
      "reviews_positive": true/false,
      "certifications_verified": true/false
    }},
    "certifications_found": ["cert1", "cert2"],
    "blacklist_reason": null,
    "reputation_summary": "one sentence on reputation or review signals",
    "legitimacy_summary": "one sentence on registration or legitimacy signals",
    "compliance_score": 0-100,
    "compliance_signals": {{
      "iso_certifications": ["ISO 9001", "ISO 14001"],
      "has_ce": true/false,
      "has_rohs": true/false,
      "has_osha": true/false,
      "has_gdpr": true/false,
      "has_soc2": true/false,
      "has_anti_bribery": true/false,
      "esg_score": null
    }}
  }},
  "extracted": {{
    "vendor_name_llm": "clean official company name",
    "description": "what this company manufactures or distributes",
    "location_exact": "city, state/country if determinable",
    "contact_email": null,
    "contact_phone": null,
    "certifications_list": ["cert1", "cert2"],
    "is_vendor": true/false
  }}
}}"""

    resp = call_llm(prompt, max_tokens=600, temperature=0.1)
    time.sleep(0.3)  # light buffer — Azure TPM limits are generous
    return _parse_json(resp, "{") or {}


# ─── 3. SYNTHESIS AGENT ──────────────────────────────────────────────────────
def run_synthesis_agent(vendors: list, req: VendorSearchRequest, plan: dict) -> str:
    """
    Final stage — runs once after all vendors are scored and ranked.
    GPT-4.1 mini writes a structured expert procurement note:
      - Regional market landscape with named operators and suppliers
      - Vendor tier breakdown with use-case guidance
      - Top 3 recommendations with specific rationale and caveats
      - Certification reality check if buyer had misconceptions
    """
    vendor_list = "\n".join([
        f"{v.rank}. {v.vendor_name} | Score: {v.final_score} | Segment: {v.market_segment or 'unknown'} | Certs: {', '.join(v.all_certifications[:3]) or 'none found'}"
        for v in vendors[:8]
    ]) or "No vendors passed compliance filters."

    prompt = f"""You are a senior data center procurement analyst writing a final vendor intelligence brief.

PROCUREMENT REQUEST:
  Product: {plan.get('corrected_part', req.part)}
  Location: {req.location}
  Budget: ${req.budget or 'unspecified'}
  Required certifications: {plan.get('correct_certifications', req.certifications)}

REGIONAL MARKET CONTEXT:
{plan.get('regional_context', 'No regional context available.')}

CERTIFICATION REALITY CHECK:
{plan.get('certification_note', '')}

EXPERT DOMAIN CONTEXT:
{plan.get('domain_knowledge', '')}

VENDORS FOUND (ranked by composite score):
{vendor_list}

Write a structured expert procurement note in exactly 3 paragraphs — no headers, no bullet points, flowing professional prose:

Paragraph 1 — MARKET LANDSCAPE: Describe the vendor landscape for this product in the target region. Name the major data center operators present there, which global vendors typically supply them, and any relevant supply chain or lead time context.

Paragraph 2 — VENDOR TIERS: Segment the found vendors into tiers. Specify which are hyperscale-grade, which suit enterprise builds, which are regional, and which are budget options. Be concrete about which vendor fits which use case and why.

Paragraph 3 — TOP RECOMMENDATIONS: Name your top 3 vendors with one specific rationale sentence each. Include important caveats such as MOQ, lead times, compliance gaps, or geographic availability."""

    print("  [Synthesis Agent] GPT-4.1 mini writing procurement report...")
    return call_llm(prompt, max_tokens=800, temperature=0.3).strip()


# ─── 4. File text extraction (PDF / Image / Excel / CSV) ────────────────────
def extract_text(file_path: str) -> str:
    """
    Extracts raw text from any supported file type:
      - PDF   → pdfplumber (text-layer first)
      - Image → EasyOCR (jpg, jpeg, png, bmp, tiff, webp)
      - Excel → openpyxl: dumps all sheets as tab-separated text
      - CSV   → plain read
    """
    ext = file_path.lower().rsplit(".", 1)[-1]

    if ext == "pdf":
        text = ""
        with pdfplumber.open(file_path) as pdf:
            for page in pdf.pages:
                text += page.extract_text() or ""
        return text

    elif ext in ("xls", "xlsx", "xlsm", "xlsb", "ods"):
        try:
            import openpyxl
            wb = openpyxl.load_workbook(file_path, data_only=True)
            rows = []
            for sheet in wb.worksheets:
                rows.append(f"[Sheet: {sheet.title}]")
                for row in sheet.iter_rows(values_only=True):
                    # Skip fully empty rows
                    if any(c is not None for c in row):
                        rows.append("\t".join(str(c) if c is not None else "" for c in row))
            return "\n".join(rows)
        except Exception as e:
            print(f"Excel read failed: {e}")
            return ""

    elif ext == "csv":
        try:
            import csv
            lines = []
            with open(file_path, newline="", encoding="utf-8-sig") as f:
                reader_csv = csv.reader(f)
                for row in reader_csv:
                    lines.append("\t".join(row))
            return "\n".join(lines)
        except Exception as e:
            print(f"CSV read failed: {e}")
            return ""

    else:
        # Treat as image (jpg, jpeg, png, bmp, tiff, webp, etc.)
        image = Image.open(file_path).convert("RGB")
        results = reader.readtext(np.array(image))
        return " ".join([res[1] for res in results])


# ─── 5. Extract structured vendor data from any file's text ──────────────────
def extract_vendor_data(text: str) -> Vendor | None:
    """
    Sends extracted text to GPT-4.1 mini and returns a structured Vendor object.
    The prompt targets exactly the fields the front-end needs:
      vendor_name, description (as category/portfolio summary), location,
      iso_certifications, contact_email, contact_phone, plus scoring fields.
    """
    prompt = f"""Extract vendor information from the text below and return it as JSON.

Required fields (use null if not found):
  vendor_name       (string)           — official company name
  category          (string)           — product/service category
  location          (string)           — city, state/country
  iso_certifications (array of strings) — all certifications mentioned
  contact_email     (string)           — vendor email if present
  contact_phone     (string)           — vendor phone if present
  portfolio         (array of strings) — products or services offered
  on_time_delivery  (number 0-100)     — delivery reliability score if stated
  quality_score     (number 0-100)     — quality rating if stated
  moq               (integer)          — minimum order quantity if stated
  payment_terms     (string)           — e.g. "Net 30", "50% upfront"
  risk_score        (number 0-100)     — supplier risk if stated
  price             (number)           — unit price if stated

Return ONLY valid JSON — no markdown, no explanation.

TEXT:
{text[:3000]}"""

    resp = call_llm(prompt, max_tokens=500, temperature=0.1)
    parsed = _parse_json(resp, "{")
    if not parsed:
        return None
    try:
        return Vendor(**parsed)
    except Exception as e:
        print(f"Vendor parse failed: {e}")
        return None