import axios from 'axios';
import { storageService } from './storageService';
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
    await delay(500);
    let vendors = storageService.getVendors();
    if (vendors.length === 0) {
        vendors = mockVendors;
        storageService.saveVendors(vendors);
    }
    return vendors;
};

export const searchVendors = async (query?: { category?: string; location?: string }): Promise<Vendor[]> => {
    await delay(500);
    let results = [...(await getVendors())];
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
    await delay(500);
    let rfqs = storageService.getRFQs();
    if (rfqs.length === 0) {
        //rfqs = mockRFQs;
        //storageService.saveRFQs(rfqs);
    }
    return rfqs;
};

export const getQuotes = async (): Promise<Quote[]> => {
    await delay(500);
    let quotes = storageService.getQuotations();
    if (quotes.length === 0) {
        quotes = mockQuotes;
        storageService.saveQuotations(quotes);
    }
    return quotes;
};

export const saveRFQ = async (rfq: RFQ): Promise<void> => {
    await delay(500);
    const rfqs = await getRFQs();
    rfqs.push(rfq);
    storageService.saveRFQs(rfqs);
};

export const updateRFQ = async (rfq: RFQ): Promise<void> => {
    await delay(500);
    const rfqs = await getRFQs();
    const index = rfqs.findIndex(r => r.id === rfq.id);
    if (index !== -1) {
        rfqs[index] = rfq;
        storageService.saveRFQs(rfqs);
    }
};

export const saveQuote = async (quote: Quote): Promise<void> => {
    await delay(500);
    const quotes = await getQuotes();
    quotes.push(quote);
    storageService.saveQuotations(quotes);
};

export const addVendor = async (vendor: Vendor): Promise<void> => {
    await delay(500);
    const vendors = await getVendors();
    vendors.push(vendor);
    storageService.saveVendors(vendors);
};

export const updateVendor = async (vendor: Vendor): Promise<void> => {
    await delay(500);
    const vendors = await getVendors();
    const index = vendors.findIndex(v => v.id === vendor.id);
    if (index !== -1) {
        vendors[index] = vendor;
        storageService.saveVendors(vendors);
    }
};

export const deleteVendors = async (ids: string[]): Promise<void> => {
    await delay(500);
    let vendors = await getVendors();
    vendors = vendors.filter(v => !ids.includes(v.id));
    storageService.saveVendors(vendors);
};

export const getVendorScores = async (): Promise<VendorScore[]> => {
    await delay(500);
    return mockScores;
};

export default apiClient;
