export interface Vendor {
    id: string;
    name: string;
    email: string;
    description: string;
    certifications: string[];
    location: string;
    category: string;
    phone: string;
    matchScore?: number;
    pricingMin?: number;
    pricingMax?: number;
    availableQuantity?: number;
    yearEstablished?: number;
    isIsoCertified?: boolean;
}
