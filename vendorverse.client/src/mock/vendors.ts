import type { Vendor } from '../models/Vendor';

export const mockVendors: Vendor[] = [
    {
        id: "v1",
        name: "Tech Solutions Inc.",
        description: "Leading provider of software services and IT infrastructure.",
        certifications: ["ISO 9001", "SOC 2 Type II"],
        location: "New York, USA",
        category: "Software Development",
        contactEmail: "contact@techsol.com",
        phone: "+1-212-555-0199",
        matchScore: 92
    },
    {
        id: "v2",
        name: "Global Hardware Corp",
        description: "Supplier of enterprise grade server and networking equipment.",
        certifications: ["ISO 9001", "ISO 14001"],
        location: "London, UK",
        category: "Hardware",
        contactEmail: "sales@globalhardware.uk",
        phone: "+44-20-7946-0958",
        matchScore: 85
    },
    {
        id: "v3",
        name: "CloudNexus Systems",
        description: "Cloud infrastructure and DevOps pipeline automation tools.",
        certifications: ["AWS Advanced Partner", "ISO 27001"],
        location: "San Francisco, USA",
        category: "Cloud Services",
        contactEmail: "hello@cloudnexus.io",
        phone: "+1-415-555-0123",
        matchScore: 96
    }
];
