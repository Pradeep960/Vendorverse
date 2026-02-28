import type { RFQ } from '../models/RFQ';

const STORAGE_KEY = 'vendorverse_rfqs';

// Get RFQs from localStorage
export const getStoredRFQs = (): RFQ[] => {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            return JSON.parse(stored);
        }
    } catch (error) {
        console.error('Error reading RFQs from localStorage:', error);
    }
    return [];
};

// Save RFQs to localStorage
export const saveRFQs = (rfqs: RFQ[]): void => {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(rfqs));
    } catch (error) {
        console.error('Error saving RFQs to localStorage:', error);
    }
};

// Add a new RFQ
export const addRFQ = (rfq: RFQ): void => {
    const existingRFQs = getStoredRFQs();
    const updatedRFQs = [rfq, ...existingRFQs];
    saveRFQs(updatedRFQs);
};

// Delete an RFQ
export const deleteRFQ = (id: string): void => {
    const existingRFQs = getStoredRFQs();
    const updatedRFQs = existingRFQs.filter(r => r.id !== id);
    saveRFQs(updatedRFQs);
};

// Get single RFQ by ID
export const getRFQById = (id: string): RFQ | undefined => {
    const rfqs = getStoredRFQs();
    return rfqs.find(r => r.id === id);
};

export default {
    getStoredRFQs,
    saveRFQs,
    addRFQ,
    deleteRFQ,
    getRFQById
};
