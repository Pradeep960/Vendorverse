export interface Vendor {
    id: string;
    name: string;
    description: string;
    certifications: string[];
    location: string;
    category: string;
    contactEmail: string;
    phone: string;
    matchScore?: number;
    pricingMin?: number;
    pricingMax?: number;
    availableQuantity?: number;
    yearEstablished?: number;
    isIsoCertified?: boolean;
}
