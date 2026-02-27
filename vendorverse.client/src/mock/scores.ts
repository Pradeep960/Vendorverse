import type { VendorScore } from '../models/Score';

export const mockScores: VendorScore[] = [
    {
        vendorId: "v1",
        vendorName: "Tech Solutions Inc.",
        reliabilityScore: 92,
        qualityScore: 95,
        priceScore: 80,
        overallScore: 89,
        totalProjects: 24
    },
    {
        vendorId: "v2",
        vendorName: "Global Hardware Corp",
        reliabilityScore: 88,
        qualityScore: 85,
        priceScore: 90,
        overallScore: 87,
        totalProjects: 15
    },
    {
        vendorId: "v3",
        vendorName: "CloudNexus Systems",
        reliabilityScore: 96,
        qualityScore: 94,
        priceScore: 82,
        overallScore: 91,
        totalProjects: 31
    }
];
