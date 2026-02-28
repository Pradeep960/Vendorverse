export interface Vendor {
    // id: string;
    // name: string;
    // description: string;
    // certifications: string[];
    // location: string;
    // category: string;
    // contactEmail: string;
    // phone: string;
    // matchScore?: number;
    // pricingMin?: number;
    // pricingMax?: number;
    // availableQuantity?: number;
    // yearEstablished?: number;
    // isIsoCertified?: boolean;


    rank: number;
    url?: string;
    description?: string;
    certifications_found: string[];
    contact_phone: string;
    contact_email: string;
    vendor_name: string;
    location_exact: string;
    market_segment?: string;
}
