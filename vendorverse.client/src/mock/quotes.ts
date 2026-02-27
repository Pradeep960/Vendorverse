import type { Quote } from '../models/Quote';

export const mockQuotes: Quote[] = [
    {
        id: "q-001",
        rfqId: "rfq-1001",
        vendorId: "v2",
        price: 45000,
        deliveryTimeDays: 14,
        submittedAt: "2026-02-12T11:00:00Z",
        features: ["Include 3-year warranty", "Free shipping", "Installation included"]
    },
    {
        id: "q-002",
        rfqId: "rfq-1001",
        vendorId: "v3",
        price: 42000,
        deliveryTimeDays: 21,
        submittedAt: "2026-02-14T09:30:00Z",
        features: ["Standard 1-year warranty", "Expedited shipping available", "Remote setup guide"]
    },
    {
        id: "q-003",
        rfqId: "rfq-1002",
        vendorId: "v1",
        price: 120000,
        deliveryTimeDays: 30,
        submittedAt: "2026-01-20T14:00:00Z",
        features: ["24/7 Support", "Dedicated account manager", "Custom dashboard"]
    }
];
