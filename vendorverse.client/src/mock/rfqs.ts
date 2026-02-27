import type { RFQ } from '../models/RFQ';

export const mockRFQs: RFQ[] = [
    {
        id: "rfq-1001",
        title: "Quarterly Server Lifecycle Replacement",
        description: "Looking for vendors to supply 50 rack servers and networking equipment.",
        status: "Sent",
        createdAt: "2026-02-10T08:00:00Z",
        deadline: "2026-03-01T23:59:59Z",
        vendorsTargeted: ["v2", "v3"]
    },
    {
        id: "rfq-1002",
        title: "Cloud Infrastructure Setup",
        description: "Provide multi-cloud deployment plan and basic infrastructure.",
        status: "Closed",
        createdAt: "2026-01-15T10:30:00Z",
        deadline: "2026-01-30T23:59:59Z",
        vendorsTargeted: ["v1", "v3"]
    },
    {
        id: "rfq-1003",
        title: "Employee Laptops Resupply",
        description: "Purchase order for 100 enterprise grade laptops.",
        status: "Draft",
        createdAt: "2026-02-20T14:15:00Z",
        deadline: "2026-03-10T23:59:59Z",
        vendorsTargeted: ["v1", "v2"]
    }
];
