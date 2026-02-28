export interface Quote {
    id: string;
    rfqId: string;
    vendorId: string;
    price: number;
    deliveryTimeDays: number;
    delivery: number; // to map to requested 'delivery'
    notes?: string;
    files: string[];
    submittedAt: string;
    features?: string[];
}
