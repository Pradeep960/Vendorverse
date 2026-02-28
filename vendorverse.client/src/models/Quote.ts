export interface Quote {
    id: string;
    rfqId: string;
    vendorId: string;
    price: number;
    deliveryTimeDays: number;
    delivery: number; // to map to requested 'delivery'
    notes?: string;
    files: string[];
    attachedFile?: { name: string, data: string }; // name + base64
    submittedAt: string;
    features?: string[];
}
