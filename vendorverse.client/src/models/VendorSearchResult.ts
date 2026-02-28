export interface VendorSearchRequest {
    part: string;
    certifications: string[];
    location: string;
    budget: number;
    quantity: number;
}

export interface ComplianceBadges {
    website_live: boolean;
    company_legitimate: boolean;
    not_blacklisted: boolean;
    reviews_positive: boolean;
    certifications_verified: boolean;
}

export interface Compliance {
    badges: ComplianceBadges;
    certifications_found: string[];
    blacklist_reason: string;
    reputation_summary: string;
    legitimacy_summary: string;
    compliance_score: number;
}

export interface VendorSearchItem {
    rank: number;
    vendor_name: string;
    url: string;
    snippet: string;
    query_used: string;
    compliance: Compliance;
    relevance_score: number;
    final_score: number;
    recommendation: string;
    budget_fit: string;
    description: string;
    location_exact: string;
    contact_email: string;
    contact_phone: string;
    all_certifications: string[];
}

export interface RequestSummary {
    additionalProp1: Record<string, unknown>;
}

export interface VendorSearchResult {
    request_summary: RequestSummary;
    queries_generated: string[];
    total_raw_results: number;
    vendors_filtered_out: number;
    vendors: VendorSearchItem[];
    procurement_note: string;
}
