from pydantic import BaseModel, Field, field_validator
from typing import List, Optional


# ─── Vendor Search Input ─────────────────────────────────────────────────────
class VendorSearchRequest(BaseModel):
    part: str                           # e.g. "data center rack enclosures"
    certifications: List[str] = []      # e.g. ["UL", "TIA-310"]
    location: str                       # e.g. "Oregon, United States"
    budget: Optional[float] = None      # e.g. 50000.0
    quantity: Optional[int] = None      # e.g. 100


# ─── Planning Agent Output ────────────────────────────────────────────────────
class PlanningResult(BaseModel):
    corrected_part: str
    correct_certifications: List[str] = []
    certification_note: str = ""
    regional_context: str = ""
    market_segments: List[str] = []
    search_queries: List[str] = []
    domain_knowledge: str = ""


# ─── Compliance Badges ────────────────────────────────────────────────────────
class ComplianceBadges(BaseModel):
    website_live: bool = False
    company_legitimate: bool = False
    not_blacklisted: bool = False
    reviews_positive: bool = False
    certifications_verified: bool = False


# ─── Compliance Result per Vendor ─────────────────────────────────────────────
class ComplianceResult(BaseModel):
    badges: ComplianceBadges
    certifications_found: List[str] = []
    blacklist_reason: Optional[str] = None
    reputation_summary: str = ""
    legitimacy_summary: str = ""
    compliance_score: int = 0


# ─── Single Vendor in Final Ranked List ───────────────────────────────────────
class VendorResult(BaseModel):
    rank: int
    vendor_name: str
    url: str
    snippet: str
    query_used: str
    compliance: ComplianceResult
    relevance_score: float
    final_score: float
    recommendation: str
    budget_fit: Optional[str] = None
    description: Optional[str] = None
    location_exact: Optional[str] = None
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None
    all_certifications: List[str] = []
    market_segment: Optional[str] = None   # NEW: "hyperscale" / "enterprise" / "regional" / "budget"


# ─── Full Vendor Search Response ──────────────────────────────────────────────
class VendorSearchResponse(BaseModel):
    request_summary: dict
    planning: dict                      # NEW: planning agent output
    queries_generated: List[str]
    total_raw_results: int
    vendors_filtered_out: int
    vendors: List[VendorResult]
    procurement_note: str               # final synthesis agent output


# ─── Extracted Vendor (from uploaded quote PDF) ───────────────────────────────
class Vendor(BaseModel):
    vendor_name: str = "Unknown Vendor"
    category: Optional[str] = None
    location: Optional[str] = None
    iso_certifications: List[str] = []
    on_time_delivery: Optional[float] = None
    quality_score: Optional[float] = None
    portfolio: List[str] = []
    moq: Optional[int] = None
    payment_terms: Optional[str] = None
    risk_score: Optional[float] = None
    price: Optional[float] = None

    def __init__(self, **data):
        aliases = {
            "name": "vendor_name", "vendor": "vendor_name", "company_name": "vendor_name",
            "supplier_name": "vendor_name", "material_category": "category",
            "region": "location", "certifications": "iso_certifications",
            "on_time_delivery_%": "on_time_delivery", "quality": "quality_score",
            "products": "portfolio", "minimum_order_quantity": "moq",
            "min_order_qty": "moq", "terms": "payment_terms",
            "risk": "risk_score", "supplier_risk_rating": "risk_score",
            "unit_price": "price", "cost": "price",
        }
        for alias, canonical in aliases.items():
            if alias in data and canonical not in data:
                data[canonical] = data.pop(alias)

        moq_val = data.get("moq")
        if moq_val is not None and isinstance(moq_val, str):
            clean = moq_val.strip().replace(",", "")
            data["moq"] = int(clean) if clean.isdigit() else None

        for f in ("on_time_delivery", "quality_score", "risk_score", "price"):
            val = data.get(f)
            if val is not None and isinstance(val, str):
                val = val.strip().replace("%", "").replace(",", "")
                try:
                    data[f] = float(val)
                except ValueError:
                    data[f] = None

        if not data.get("vendor_name"):
            data["vendor_name"] = "Unknown Vendor"

        for f in ("iso_certifications", "portfolio"):
            val = data.get(f)
            if val is None:
                data[f] = []
            elif isinstance(val, str):
                data[f] = [v.strip() for v in val.split(",") if v.strip()]

        super().__init__(**data)


def score_vendor(v: Vendor) -> float:
    score = 0.0
    if v.on_time_delivery:
        score += v.on_time_delivery * 0.3
    if v.risk_score:
        score += (100 - v.risk_score) * 0.2
    if v.iso_certifications:
        score += 10
    if v.price:
        score += max(0, 1000 - v.price) * 0.01
    return round(score, 2)