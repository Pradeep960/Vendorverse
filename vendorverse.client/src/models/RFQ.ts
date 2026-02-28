export interface RFQ {
    id: string;
    title: string;
    description: string; // Maps to Product Details
    quantity: number;
    budget: number;
    attachedFile?: { name: string, data: string }; // name + base64
    status: 'Pending' | 'Responses Received' | 'Completed';
    createdAt: string;
    deadline?: string;
    vendorsTargeted: string[]; // Vendor IDs
}
