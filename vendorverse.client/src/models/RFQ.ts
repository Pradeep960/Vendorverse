export interface RFQ {
    id: string;
    title: string;
    description: string;
    status: 'Draft' | 'Sent' | 'Closed';
    createdAt: string;
    deadline: string;
    vendorsTargeted: string[];
}
