import os
from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from worker import process_vendor_file, process_vendor_files, run_vendor_search
from models import Vendor, VendorSearchRequest, VendorSearchResponse

app = FastAPI(
    title="VendorVerse API",
    version="3.1.0",
    description="Agentic vendor procurement: Plan → Crawl → Enrich → Contact Fallback → Synthesize",
)

# # ─── CORS ─────────────────────────────────────────────────────────────────────
# origins = [
#     "http://localhost:3000",      # React dev server
#     "http://localhost:5173",      # Vite dev server
#     "http://localhost:8080",      # Vue / other
#     # "https://yourfrontend.com", # add production domain here
# ]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = "temp"
os.makedirs(UPLOAD_DIR, exist_ok=True)

ALLOWED_EXTENSIONS = {
    "pdf", "jpg", "jpeg", "png", "bmp", "tiff", "tif", "webp",
    "xlsx", "xls", "xlsm", "ods", "csv",
}


# ─── STAGE 1: Vendor Search ───────────────────────────────────────────────────
@app.post(
    "/vendor-search",
    summary="Full agentic vendor search: planning agent → web crawl → enrichment → contact fallback → synthesis"
)
def vendor_search(req: VendorSearchRequest) -> VendorSearchResponse:
    return run_vendor_search(req)


# ─── Simplified endpoint ──────────────────────────────────────────────────────
class SimpleVendorRequest(BaseModel):
    item: str
    quantity: Optional[int] = None
    location: str
    certifications: List[str] = []
    budget: Optional[float] = None


@app.post("/find-vendors", summary="Simplified vendor search returning key fields + contact info")
def find_vendors(req: SimpleVendorRequest):
    internal_req = VendorSearchRequest(
        part=req.item,
        certifications=req.certifications,
        location=req.location,
        budget=req.budget,
        quantity=req.quantity,
    )
    full_response = run_vendor_search(internal_req)
    return {
        "planning_note": full_response.planning.get("certification_note"),
        "regional_context": full_response.planning.get("regional_context"),
        "domain_knowledge": full_response.planning.get("domain_knowledge"),
        "vendors": [
            {
                "rank": v.rank,
                "vendor_name": v.vendor_name,
                "url": v.url,
                "description": v.description,
                "market_segment": v.market_segment,
                "location_exact": v.location_exact,
                "certifications": v.all_certifications,
                "final_score": v.final_score,
                "recommendation": v.recommendation,
                "budget_fit": v.budget_fit,
                "contact": {"email": v.contact_email, "phone": v.contact_phone},
            }
            for v in full_response.vendors
        ],
        "procurement_note": full_response.procurement_note,
    }


# ─── STAGE 4: Quotation Intake — Multi-file Upload ────────────────────────────
@app.post("/upload", summary="Upload a single vendor quote file (PDF, image, Excel, CSV) → extract + score")
async def upload(file: UploadFile = File(...)):
    ext = (file.filename or "").rsplit(".", 1)[-1].lower()

    if ext not in ALLOWED_EXTENSIONS:
        return {
            "error": f"Unsupported file type '.{ext}'. Accepted: {', '.join(sorted(ALLOWED_EXTENSIONS))}"
        }

    safe_name = file.filename.replace(" ", "_")
    path = os.path.join(UPLOAD_DIR, safe_name)
    with open(path, "wb") as fh:
        fh.write(await file.read())

    return process_vendor_file(path)

# ─── STAGE 4b: Quote Comparison ───────────────────────────────────────────────
# Frontend calls /upload once per vendor to get individual JSON cards,
# then sends all cards together here when user clicks "Compare".
# Returns the same array ranked by score + highlights the best_pick.
class VendorCard(BaseModel):
    source_file: Optional[str] = None
    vendor_name: str
    description: Optional[str] = None
    location_exact: Optional[str] = None
    certifications: List[str] = []
    contact: Optional[dict] = None
    score: float = 0.0
    price: Optional[float] = None
    moq: Optional[int] = None
    payment_terms: Optional[str] = None
    on_time_delivery: Optional[float] = None
    quality_score: Optional[float] = None
    risk_score: Optional[float] = None


class CompareRequest(BaseModel):
    vendors: List[VendorCard]


@app.post("/compare", summary="Send uploaded vendor cards → returns only the best pick by score")
def compare_vendors(req: CompareRequest):
    if not req.vendors:
        return {"error": "No vendors provided"}

    best = max(req.vendors, key=lambda v: v.score)
    return {"best_pick": best.dict()}