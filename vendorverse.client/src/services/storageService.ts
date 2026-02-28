export const StorageKeys = {
    VENDORS: 'vendors',
    RFQS: 'rfqs',
    QUOTATIONS: 'quotations',
};

import type { Vendor } from '../models/Vendor';
import type { RFQ } from '../models/RFQ';
import type { Quote } from '../models/Quote';

export const storageService = {
    // Vendors
    getVendors: (): Vendor[] => {
        const data = localStorage.getItem(StorageKeys.VENDORS);
        return data ? JSON.parse(data) : [];
    },
    saveVendors: (vendors: Vendor[]) => {
        localStorage.setItem(StorageKeys.VENDORS, JSON.stringify(vendors));
    },

    // RFQs
    getRFQs: (): RFQ[] => {
        const data = localStorage.getItem(StorageKeys.RFQS);
        return data ? JSON.parse(data) : [];
    },
    saveRFQs: (rfqs: RFQ[]) => {
        localStorage.setItem(StorageKeys.RFQS, JSON.stringify(rfqs));
    },

    // Quotations
    getQuotations: (): Quote[] => {
        const data = localStorage.getItem(StorageKeys.QUOTATIONS);
        return data ? JSON.parse(data) : [];
    },
    saveQuotations: (quotes: Quote[]) => {
        localStorage.setItem(StorageKeys.QUOTATIONS, JSON.stringify(quotes));
    }
};
