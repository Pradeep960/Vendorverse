export interface Quote {
    id: string;
    rfqId: string;
    vendorId: string;
    price: number;
    deliveryTimeDays: number;
    submittedAt: string;
    features: string[];
}
