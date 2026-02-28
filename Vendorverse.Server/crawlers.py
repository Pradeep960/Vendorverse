import re
import requests
from bs4 import BeautifulSoup
from dotenv import load_dotenv
import os

load_dotenv()
SERPAPI_KEY = os.getenv("SERPAPI_KEY")

# ─── Known sanctions / blacklist domains ─────────────────────────────────────
SANCTIONS_DOMAINS = {
    "huawei.com", "zte.com", "kaspersky.com",
}
SANCTIONS_KEYWORDS = [
    "sanctioned", "ofac listed", "blacklisted supplier",
    "debarred vendor", "restricted entity", "denied party",
]
FREE_HOST_SIGNALS = ["blogspot", "wordpress.com", "wix.com", "weebly", "squarespace.com/"]

CERT_KEYWORDS = [
    "ISO 9001", "ISO 14001", "ISO 45001", "ISO 27001", "ISO 13485",
    "ISO 50001", "TL 9000", "UL Listed", "UL 2200", "CE Marking", "CE Mark",
    "RoHS", "LSZH", "ENERGY STAR", "EPEAT", "TAA Compliant", "NDAA",
    "FCC Part 15", "ANSI", "NFPA 110", "ASHRAE", "ETL", "CSA", "BIS",
    "CDSCO", "EPA Tier 4", "REACH", "EIA-310", "TIA-310", "NEBS",
    "UL 60950", "UL 62368", "IEC 62368",
]

REVIEW_PLATFORMS = [
    "trustpilot.com", "g2.com", "capterra.com", "glassdoor.com",
    "google.com/maps", "yelp.com", "sitejabber.com",
]

# Contact page paths to try when homepage has no contact info
CONTACT_PATHS = [
    "/contact", "/contact-us", "/contact-us/", "/about/contact",
    "/about", "/about-us", "/company/contact", "/support/contact",
    "/en/contact", "/us/contact",
]


# ─── SerpAPI ─────────────────────────────────────────────────────────────────
def crawl_serpapi(query: str, num: int = 8) -> list[dict]:
    try:
        resp = requests.get(
            "https://serpapi.com/search",
            params={"q": query, "api_key": SERPAPI_KEY, "num": num, "engine": "google"},
            timeout=10,
        )
        resp.raise_for_status()
        results = []
        for r in resp.json().get("organic_results", []):
            results.append({
                "title": r.get("title", ""),
                "url": r.get("link", ""),
                "snippet": r.get("snippet", ""),
            })
        return results
    except Exception as e:
        print(f"SerpAPI error: {e} — using mock")
        return _mock_results(query)


# ─── Website live check ───────────────────────────────────────────────────────
def check_website_live(url: str) -> bool:
    try:
        r = requests.head(url, timeout=6, allow_redirects=True,
                          headers={"User-Agent": "Mozilla/5.0"})
        return r.status_code < 400
    except Exception:
        return False


# ─── Scrape vendor homepage for compliance signals ───────────────────────────
def scrape_vendor_signals(url: str) -> dict:
    signals = {
        "certs_found": [],
        "has_about_page": False,
        "has_contact_info": False,
        "uses_https": url.startswith("https://"),
        "is_free_host": any(x in url for x in FREE_HOST_SIGNALS),
        "is_sanctioned_domain": any(d in url for d in SANCTIONS_DOMAINS),
        "sanctions_keyword_hit": False,
        "sanctions_keyword": None,
        "review_platform_linked": False,
        "review_platform": None,
        "registration_signals": [],
        "raw_text": "",
    }

    try:
        r = requests.get(url, timeout=8, headers={"User-Agent": "Mozilla/5.0"})
        soup = BeautifulSoup(r.text, "html.parser")
        text = soup.get_text(separator=" ", strip=True)
        signals["raw_text"] = text[:1200]  # increased from 800

        signals["certs_found"] = [k for k in CERT_KEYWORDS if k.lower() in text.lower()]

        links = [a.get("href", "").lower() for a in soup.find_all("a", href=True)]
        link_text = [a.get_text().lower() for a in soup.find_all("a")]
        signals["has_about_page"] = any(
            "/about" in l or "about us" in t for l, t in zip(links, link_text)
        )
        signals["has_contact_info"] = any(
            w in text.lower() for w in ["contact us", "email", "tel:", "phone", "+1-", "+91-", "@"]
        )

        for kw in SANCTIONS_KEYWORDS:
            if kw in text.lower():
                signals["sanctions_keyword_hit"] = True
                signals["sanctions_keyword"] = kw
                break

        for platform in REVIEW_PLATFORMS:
            if platform in text.lower() or any(platform in l for l in links):
                signals["review_platform_linked"] = True
                signals["review_platform"] = platform
                break

        reg_phrases = ["incorporated", "registered in", "company no.", "ein:", "duns:", "llc", "ltd", "inc.", "pvt. ltd", "gmbh"]
        signals["registration_signals"] = [p for p in reg_phrases if p in text.lower()]

    except Exception as e:
        print(f"Scrape failed for {url}: {e}")

    return signals


# ─── NEW: Contact Page Fallback Crawler ──────────────────────────────────────
def crawl_contact_info(base_url: str) -> dict:
    """
    Triggered when homepage scrape yields no contact info.
    Tries /contact, /about, /contact-us pages to extract email and phone.
    Returns dict with 'email' and 'phone' keys (None if not found).
    """
    contact = {"email": None, "phone": None}
    base = base_url.rstrip("/")

    for path in CONTACT_PATHS:
        try:
            url = base + path
            r = requests.get(url, timeout=6, headers={"User-Agent": "Mozilla/5.0"})
            if r.status_code >= 400:
                continue

            soup = BeautifulSoup(r.text, "html.parser")
            text = soup.get_text(separator=" ", strip=True)

            # Try mailto links first (most reliable)
            for a in soup.find_all("a", href=True):
                href = a["href"]
                if href.startswith("mailto:"):
                    email = href.replace("mailto:", "").split("?")[0].strip()
                    if email:
                        contact["email"] = email
                        break

            # Regex fallback for email
            if not contact["email"]:
                emails = re.findall(r'[\w.+\-]+@[\w\-]+\.[\w.]+', text)
                # Filter out image/asset extensions
                emails = [e for e in emails if not e.endswith((".png", ".jpg", ".svg", ".gif"))]
                if emails:
                    contact["email"] = emails[0]

            # Try tel: links first
            for a in soup.find_all("a", href=True):
                href = a["href"]
                if href.startswith("tel:"):
                    phone = href.replace("tel:", "").strip()
                    if phone:
                        contact["phone"] = phone
                        break

            # Regex fallback for phone
            if not contact["phone"]:
                phones = re.findall(
                    r'(?:\+?1[\s\-.]?)?\(?\d{3}\)?[\s\-.]?\d{3}[\s\-.]?\d{4}', text
                )
                if phones:
                    contact["phone"] = phones[0].strip()

            # Stop as soon as we find something
            if contact["email"] or contact["phone"]:
                print(f"       → Contact found via {path}: {contact}")
                break

        except Exception as e:
            print(f"Contact crawl failed for {base}{path}: {e}")
            continue

    return contact


# ─── Mock results (fallback when no SerpAPI key / quota exceeded) ─────────────
def _mock_results(query: str) -> list[dict]:
    q = query.lower()

    if any(w in q for w in ["cable", "fiber", "patch", "mtp", "dac", "cabling", "ethernet"]):
        return [
            {"title": "Belden – Data Center Cabling Solutions", "url": "https://www.belden.com", "snippet": "Global manufacturer of high-performance Cat8, fiber and structured cabling. ISO 9001 certified, RoHS, UL Listed, ANSI/TIA-568 compliant. Incorporated in Richmond, IN. Est. 1902."},
            {"title": "Panduit – Structured Cabling & Connectivity", "url": "https://www.panduit.com", "snippet": "End-to-end cabling infrastructure for hyperscale data centers. UL Listed, ISO 9001:2015, TAA compliant. Company No. EIN 36-2615804."},
            {"title": "CommScope – Enterprise Network Cabling", "url": "https://www.commscope.com", "snippet": "Cat6A, OM5 fiber and MTP/MPO assemblies for mission-critical data centers. TAA, NDAA Section 889 compliant. Nasdaq: COMM."},
            {"title": "Molex – Data Center Connectivity", "url": "https://www.molex.com", "snippet": "MTP/MPO fiber assemblies, 400G DAC/AOC solutions. RoHS, CE, UL Listed. Subsidiary of Koch Industries, registered in Delaware."},
            {"title": "FS.com – Fiber Optic & Networking Products", "url": "https://www.fs.com", "snippet": "Cost-effective OM4/OM5, DAC and structured cabling globally. RoHS compliant. Trustpilot rated 4.6/5 from 2,800+ reviews."},
            {"title": "Generic Cables Co – Cheap Cables", "url": "http://genericsupplier.blogspot.com", "snippet": "We sell cables cheap. No returns."},
        ]
    elif any(w in q for w in ["cooling", "hvac", "thermal", "crac", "chiller", "airflow"]):
        return [
            {"title": "Vertiv – Precision Cooling Systems", "url": "https://www.vertiv.com", "snippet": "Liebert CRAC/CRAH, in-row and liquid cooling for high-density data centers. ISO 9001, UL 1995, CE. NYSE: VRT. Est. 1965."},
            {"title": "Schneider Electric – Data Center Cooling", "url": "https://www.se.com", "snippet": "APC InRow cooling, chilled water and economizers. ENERGY STAR, ASHRAE A2. Registered in France, operations in 100+ countries."},
            {"title": "Stulz – Precision Air Conditioning", "url": "https://www.stulz.com", "snippet": "Precision air conditioning for critical IT environments. ISO 9001:2015, ENERGY STAR. German GmbH, DUNS 315-049-878."},
            {"title": "Airedale International Cooling", "url": "https://www.airedale.com", "snippet": "Cooling solutions for data centers and critical facilities. ISO 9001, ISO 14001. UK Ltd registered at Companies House No. 00671069."},
            {"title": "Rittal – IT Cooling Infrastructure", "url": "https://www.rittal.com", "snippet": "Rack cooling, IT cooling. CE, UL Listed, ISO 9001. German GmbH, G2 reviewed supplier."},
        ]
    elif any(w in q for w in ["router", "switch", "network", "spine", "leaf", "bgp", "sd-wan", "networking"]):
        return [
            {"title": "Cisco Systems – Data Center Networking", "url": "https://www.cisco.com", "snippet": "Nexus spine-leaf switches, ASR routers and ACI fabric. TAA, NDAA 889, FCC, CE. Nasdaq: CSCO. EIN 94-2956427."},
            {"title": "Arista Networks – Cloud Networking", "url": "https://www.arista.com", "snippet": "7000-series 400G/800G switches for hyperscale. TAA, FCC, CE, ISO 9001. NYSE: ANET. DUNS 188-539-397."},
            {"title": "Juniper Networks – Routing & Switching", "url": "https://www.juniper.net", "snippet": "QFX switches and PTX routers for DC fabrics. ISO 9001, FCC, CE. NYSE: JNPR. Incorporated in Delaware."},
            {"title": "Nokia – IP Routing & Optical", "url": "https://www.nokia.com", "snippet": "7750 SR routers for DC interconnect. CE, FCC, TAA. Helsinki Stock Exchange: NOKIA. Glassdoor 3.9/5."},
            {"title": "H3C – Data Center Switching", "url": "https://www.h3c.com", "snippet": "High-performance switches for cloud DCs. CE, FCC, ISO 9001:2015."},
        ]
    elif any(w in q for w in ["generator", "genset", "power", "ups", "ats", "diesel", "transfer"]):
        return [
            {"title": "Caterpillar – Data Center Power", "url": "https://www.cat.com", "snippet": "Diesel and gas GenSets for critical facilities. EPA Tier 4 Final, ISO 9001, NFPA 110, UL 2200. NYSE: CAT. EIN 37-0602744."},
            {"title": "Cummins – Standby & Prime Power", "url": "https://www.cummins.com", "snippet": "Industrial diesel generators 20kW–3.5MW. ISO 9001, EPA certified, UL 2200. NYSE: CMI. DUNS 006-277-287."},
            {"title": "Kohler Power – Critical Power Systems", "url": "https://kohlerpower.com", "snippet": "Industrial GenSets and ATS for data centers. UL 2200, NFPA 110, ISO 9001:2015. Trustpilot 4.4/5."},
            {"title": "Eaton – Power Management", "url": "https://www.eaton.com", "snippet": "UPS systems, ATS and PDUs for data centers. UL, CE, ISO 9001. NYSE: ETN. Incorporated in Ireland."},
            {"title": "Aggreko – Temporary & Permanent Power", "url": "https://www.aggreko.com", "snippet": "Rental and permanent power for data centers. ISO 9001, ISO 14001. LSE: AGK. DUNS 212-936-441."},
        ]
    elif any(w in q for w in ["rack", "cabinet", "enclosure", "pdu", "aisle", "containment", "server rack"]):
        return [
            {"title": "Vertiv – Server Racks & Enclosures", "url": "https://www.vertiv.com", "snippet": "SmartCabinets, open-frame racks and hot/cold aisle containment. UL, CE, ISO 9001. NYSE: VRT."},
            {"title": "Schneider Electric APC – Racks & PDUs", "url": "https://www.apc.com", "snippet": "NetShelter racks, PDUs and aisle containment. UL Listed, CE, EIA-310. CAC 40: SU. EIN 04-2698281."},
            {"title": "Rittal – IT Server Racks", "url": "https://www.rittal.com", "snippet": "TS IT server cabinets and accessories. CE, UL, ISO 9001:2015. German GmbH. G2 rated supplier."},
            {"title": "Chatsworth Products – CPI Racks", "url": "https://www.chatsworth.com", "snippet": "Open-frame racks and aisle containment. UL Listed, TAA compliant. California-based LLC. DUNS 788-144-023."},
            {"title": "Legrand – Data Center Racks", "url": "https://www.legrand.us", "snippet": "Racks, cable trays and containment. CE, UL, RoHS. NYSE: LR. Registered in France, US subsidiary incorporated in Delaware."},
        ]
    else:
        return [
            {"title": "Thomasnet – Industrial Supplier Directory", "url": "https://www.thomasnet.com", "snippet": "North America's largest verified manufacturer and supplier directory. BBB accredited."},
            {"title": "IndiaMART – B2B Vendor Directory", "url": "https://www.indiamart.com", "snippet": "India's largest B2B marketplace with verified suppliers. NSE: INDIAMART."},
            {"title": "Alibaba – Global Supplier Network", "url": "https://www.alibaba.com", "snippet": "Sourcing platform with millions of verified global vendors. NYSE: BABA."},
        ]