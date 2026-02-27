import axios from 'axios';
import type { Vendor } from '../models/Vendor';
import type { RFQ } from '../models/RFQ';
import type { Quote } from '../models/Quote';
import type { VendorScore } from '../models/Score';

// Mock data
import { mockVendors } from '../mock/vendors';
import { mockRFQs } from '../mock/rfqs';
import { mockQuotes } from '../mock/quotes';
import { mockScores } from '../mock/scores';

const apiClient = axios.create({
    baseURL: import.meta.env.VITE_API_URL || '/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

// Helper to simulate API delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const getVendors = async (): Promise<Vendor[]> => {
    await delay(800);
    return mockVendors;
};

export const searchVendors = async (query?: { category?: string; location?: string }): Promise<Vendor[]> => {
    await delay(800);
    let results = [...mockVendors];
    if (query) {
        if (query.category) {
            results = results.filter(v => v.category.toLowerCase().includes(query.category!.toLowerCase()));
        }
        if (query.location) {
            results = results.filter(v => v.location.toLowerCase().includes(query.location!.toLowerCase()));
        }
    }
    return results;
};

export const getRFQs = async (): Promise<RFQ[]> => {
    await delay(800);
    return mockRFQs;
};

export const getQuotes = async (): Promise<Quote[]> => {
    await delay(800);
    return mockQuotes;
};

export const getVendorScores = async (): Promise<VendorScore[]> => {
    await delay(800);
    return mockScores;
};

export default apiClient;
