from models import (
    Vendor, VendorSearchRequest, VendorResult,
    VendorSearchResponse, score_vendor, ComplianceResult, ComplianceBadges
)
from services import (
    extract_text, extract_vendor_data,
    run_planning_agent, analyze_vendor_with_llm, run_synthesis_agent,
)
from crawlers import crawl_serpapi, check_website_live, scrape_vendor_signals, crawl_contact_info


# ─────────────────────────────────────────────────────────────────────────────
# AGENTIC VENDOR SEARCH PIPELINE
#
# Stage 1 — PLANNING AGENT (Perplexity / web-aware LLM)
#   → Corrects product terminology
#   → Injects regional market knowledge
#   → Fixes certifications (e.g. "FCC on passive racks" → UL/TIA-310)
#   → Segments market (hyperscale / enterprise / regional / budget)
#   → Generates 4 targeted search queries
#
# Stage 2 — CRAWL
#   → SerpAPI runs all 4 queries in parallel, deduplicates by URL
#   → HEAD check + homepage scrape per result
#
# Stage 3 — PRE-FILTER
#   → Remove dead sites, free hosts, sanctioned domains
#
# Stage 4 — ENRICHMENT AGENT (Groq, per-vendor loop)
#   → Relevance scoring against corrected product/certs
#   → Compliance badge evaluation
#   → Market segment classification
#   → Structured data extraction (name, location, certs, contact)
#
# Stage 5 — CONTACT FALLBACK CRAWLER
#   → If contact_email is null after LLM: crawl /contact, /about pages
#   → Regex + mailto extraction
#
# Stage 6 — FINAL FILTER + RANK
#   → Remove blacklisted or low compliance-score vendors
#   → Score = 55% relevance + 45% compliance
#
# Stage 7 — SYNTHESIS AGENT (Perplexity)
#   → Tiered market analysis
#   → Expert procurement note with regional context
#   → Top 3 recommendations with rationale
# ─────────────────────────────────────────────────────────────────────────────

def run_vendor_search(req: VendorSearchRequest) -> VendorSearchResponse:

    # ── Stage 1: Planning Agent ───────────────────────────────────────────────
    print("\n[1/7] 🧠 Running Planning Agent...")
    plan = run_planning_agent(req)
    queries = plan.get("search_queries", [])
    if not queries:
        queries = [f"{req.part} vendor {req.location}"]
    print(f"       → {len(queries)} queries: {queries}")

    # ── Stage 2: Crawl ───────────────────────────────────────────────────────
    print("\n[2/7] 🌐 Crawling SerpAPI...")
    raw: list[dict] = []
    seen: set[str] = set()
    for query in queries:
        for r in crawl_serpapi(query, num=8):
            if r["url"] not in seen:
                seen.add(r["url"])
                raw.append({**r, "query_used": query})
    total_raw = len(raw)
    print(f"       → {total_raw} unique results across {len(queries)} queries")

    # Live check + scrape in parallel
    print("\n[3/7] 🔍 Checking websites & scraping signals...")
    from concurrent.futures import ThreadPoolExecutor

    def check_and_scrape(r):
        live = check_website_live(r["url"])
        r["signals"] = scrape_vendor_signals(r["url"]) if live else {}
        r["signals"]["website_live"] = live
        return r

    with ThreadPoolExecutor(max_workers=6) as executor:
        raw = list(executor.map(check_and_scrape, raw))

    # ── Stage 3: Pre-filter ───────────────────────────────────────────────────
    print("\n[4/7] 🚫 Pre-filtering junk...")
    # URL path patterns that indicate listicles/blogs — never vendor product pages
    LISTICLE_URL_PATTERNS = [
        "/blog/", "/blogs/", "/news/", "/press/", "/press-release/",
        "/article/", "/articles/", "/post/", "/posts/",
        "/insights/", "/resources/", "/research/", "/reports/",
        "/whitepaper/", "/case-study/", "/case-studies/",
        "/top-", "/best-", "/guide/", "/guides/",
        "/showroom/",   # Alibaba showroom pages
        "/wiki/",
    ]

    # Domains that are aggregators/research firms/marketplaces — never a direct vendor
    AGGREGATOR_DOMAINS = [
        "abiresearch.com", "gartner.com", "idc.com", "forrester.com",
        "marketsandmarkets.com", "grandviewresearch.com", "mordorintelligence.com",
        "researchandmarkets.com", "globenewswire.com", "businesswire.com",
        "prnewswire.com", "statista.com", "techradar.com", "zdnet.com",
        "cnet.com", "tomsguide.com", "tomshardware.com", "anandtech.com",
        "theregister.com", "datacenterknowledge.com", "datacenterfrontier.com",
        "crunchbase.com", "linkedin.com", "reddit.com", "quora.com",
        "youtube.com", "twitter.com", "facebook.com",
        "thomasnet.com", "indiamart.com", "alibaba.com",
    ]

    # Title keywords that indicate a listicle rather than a vendor page
    LISTICLE_TITLE_PATTERNS = [
        "top 10", "top 5", "top 7", "top 15", "top 20",
        "best 10", "best 5", "best 7",
        " companies", " vendors", " manufacturers", " providers",
        "revolutionizing", "most innovative",
        "market report", "market size", "market share", "market overview",
        "industry report", "global market",
    ]

    passed = []
    filtered_count = 0

    for r in raw:
        url   = r["url"].lower()
        title = r["title"].lower()
        reason = None

        if not r["signals"].get("website_live"):
            reason = "dead site"
        elif r["signals"].get("is_free_host"):
            reason = "free host"
        elif r["signals"].get("is_sanctioned_domain"):
            reason = "sanctioned domain"
        elif any(d in url for d in AGGREGATOR_DOMAINS):
            reason = "aggregator domain"
        elif any(p in url for p in LISTICLE_URL_PATTERNS):
            reason = "listicle/blog URL"
        elif any(p in title for p in LISTICLE_TITLE_PATTERNS):
            reason = "listicle title"

        if reason:
            print(f"       ✗ Pre-filtered ({reason}): {r['title'][:60]}")
            filtered_count += 1
        else:
            passed.append(r)

    print(f"       → {len(passed)} passed, {filtered_count} pre-filtered out")

    # ── Stage 4: Enrichment Agent ─────────────────────────────────────────────
    print("\n[5/7] 🤖 Enriching vendors with LLM...")
    results: list[VendorResult] = []

    for r in passed:
        print(f"       Analyzing: {r['title'][:55]}...")
        analysis = analyze_vendor_with_llm(
            vendor_name=r["title"],
            url=r["url"],
            snippet=r["snippet"],
            scraped_text=r["signals"].get("raw_text", ""),
            req=req,
            website_live=r["signals"].get("website_live", False),
            plan=plan,
        )
        if not analysis:
            print(f"       ✗ LLM analysis failed")
            filtered_count += 1
            continue

        extracted = analysis.get("extracted", {})
        vendor_name_llm = extracted.get("vendor_name_llm", "").strip()
        if vendor_name_llm:
            r["title"] = vendor_name_llm

        # Not a real vendor — skip
        if not extracted.get("is_vendor", False):
            print(f"       ✗ Not a product vendor (directory/blog/service): {r['title'][:50]}")
            filtered_count += 1
            continue

        compliance_data = analysis.get("compliance", {})
        badges_data = compliance_data.get("badges", {})

        badges = ComplianceBadges(
            website_live=r["signals"].get("website_live", False),
            company_legitimate=badges_data.get("company_legitimate") or False,
            not_blacklisted=badges_data.get("not_blacklisted") or True,
            reviews_positive=badges_data.get("reviews_positive") or False,
            certifications_verified=badges_data.get("certifications_verified") or False,
        )

        compliance = ComplianceResult(
            badges=badges,
            certifications_found=compliance_data.get("certifications_found") or [],
            blacklist_reason=compliance_data.get("blacklist_reason"),
            reputation_summary=compliance_data.get("reputation_summary") or "",
            legitimacy_summary=compliance_data.get("legitimacy_summary") or "",
            compliance_score=compliance_data.get("compliance_score") or 0,
        )

        # Final compliance filter
        if not badges.not_blacklisted or compliance.compliance_score < 40:
            print(f"       ✗ Compliance fail: {r['title'][:50]} (score={compliance.compliance_score})")
            filtered_count += 1
            continue

        relevance = analysis.get("relevance_score", 50)
        final = round(relevance * 0.55 + compliance.compliance_score * 0.45, 1)

        # Extract contact info from LLM analysis
        contact_email = extracted.get("contact_email")
        contact_phone = extracted.get("contact_phone")

        # ── Stage 5: Contact Fallback Crawler ─────────────────────────────────
        # If LLM couldn't find contact info, send the crawler to /contact and /about
        if not contact_email and not contact_phone:
            print(f"       → No contact info from LLM, triggering contact crawler for {r['url'][:50]}...")
            fallback_contact = crawl_contact_info(r["url"])
            contact_email = fallback_contact.get("email")
            contact_phone = fallback_contact.get("phone")
            if contact_email or contact_phone:
                print(f"       ✓ Contact crawler found: email={contact_email}, phone={contact_phone}")

        results.append(VendorResult(
            rank=0,
            vendor_name=r["title"],
            url=r["url"],
            snippet=r["snippet"],
            query_used=r["query_used"],
            compliance=compliance,
            relevance_score=relevance,
            final_score=final,
            recommendation=analysis.get("recommendation", "Manual review recommended."),
            budget_fit=analysis.get("budget_fit", "Unknown"),
            description=extracted.get("description"),
            location_exact=extracted.get("location_exact"),
            contact_email=contact_email,
            contact_phone=contact_phone,
            all_certifications=extracted.get("certifications_list") or [],
            market_segment=analysis.get("market_segment"),
        ))

        print(f"       ✓ {r['title'][:50]} | relevance={relevance} | compliance={compliance.compliance_score} | final={final}")

    # ── Stage 6: Sort + rank ──────────────────────────────────────────────────
    results.sort(key=lambda v: v.final_score, reverse=True)
    for i, v in enumerate(results):
        v.rank = i + 1

    # ── Stage 7: Synthesis Agent ──────────────────────────────────────────────
    print(f"\n[7/7] 📝 Running Synthesis Agent ({len(results)} vendors passed)...")
    procurement_note = run_synthesis_agent(results, req, plan)

    return VendorSearchResponse(
        request_summary={
            "part": req.part,
            "certifications": req.certifications,
            "location": req.location,
            "budget": req.budget,
        },
        planning=plan,
        queries_generated=queries,
        total_raw_results=total_raw,
        vendors_filtered_out=filtered_count,
        vendors=results,
        procurement_note=procurement_note,
    )


# ─────────────────────────────────────────────────────────────────────────────
# STAGE 4 — Quotation Intake (Multi-file Upload)
# Accepts: PDF, image (jpg/png/etc), Excel (.xlsx/.xls), CSV
# Returns: one card per file + best_pick highlighting the top-scored vendor
# ─────────────────────────────────────────────────────────────────────────────
def _format_vendor_card(vendor: Vendor, score: float, filename: str) -> dict:
    """Formats a single vendor into the shape the front-end expects."""
    # Build a readable description from category + portfolio
    parts = []
    if vendor.category:
        parts.append(vendor.category)
    if vendor.portfolio:
        parts.append("Products: " + ", ".join(vendor.portfolio[:5]))
    description = " | ".join(parts) if parts else None

    return {
        "source_file": filename,
        "vendor_name": vendor.vendor_name,
        "description": description,
        "location_exact": vendor.location,
        "certifications": vendor.iso_certifications,
        "contact": {
            "email": getattr(vendor, "contact_email", None),
            "phone": getattr(vendor, "contact_phone", None),
        },
        "score": score,
        # Extra fields useful for comparison but optional for UI
        "price": vendor.price,
        "moq": vendor.moq,
        "payment_terms": vendor.payment_terms,
        "on_time_delivery": vendor.on_time_delivery,
        "quality_score": vendor.quality_score,
        "risk_score": vendor.risk_score,
    }


def process_vendor_files(paths: list[tuple[str, str]]) -> dict:
    """
    Process multiple uploaded vendor files and return a structured response.

    Args:
        paths: list of (saved_path, original_filename) tuples

    Returns:
        {
          "vendors": [ ...one card per successfully parsed file... ],
          "failed":  [ ...filenames that could not be parsed... ],
          "best_pick": { ...card of highest-scored vendor... } | null
        }
    """
    vendors = []
    failed = []

    for saved_path, original_name in paths:
        print(f"  Processing: {original_name}")
        try:
            text = extract_text(saved_path)
            if not text.strip():
                print(f"    ✗ No text extracted from {original_name}")
                failed.append({"file": original_name, "reason": "No text could be extracted"})
                continue

            vendor = extract_vendor_data(text)
            if not vendor:
                print(f"    ✗ Could not parse vendor data from {original_name}")
                failed.append({"file": original_name, "reason": "LLM could not extract vendor fields"})
                continue

            score = score_vendor(vendor)
            card = _format_vendor_card(vendor, score, original_name)
            vendors.append(card)
            print(f"    ✓ {vendor.vendor_name} | score={score}")

        except Exception as e:
            print(f"    ✗ Error processing {original_name}: {e}")
            failed.append({"file": original_name, "reason": str(e)})

    # Pick the highest-scored vendor
    best_pick = None
    if vendors:
        best_pick = max(vendors, key=lambda v: v["score"])

    return {
        "vendors": vendors,
        "failed": failed,
        "best_pick": best_pick,
    }


# Keep old single-file function as a thin wrapper (backward compat)
def process_vendor_file(path: str) -> dict:
    result = process_vendor_files([(path, path.split("/")[-1])])
    if result["vendors"]:
        return result["vendors"][0]
    return {"error": result["failed"][0]["reason"] if result["failed"] else "Unknown error"}