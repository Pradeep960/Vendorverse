import type { VendorSearchRequest, VendorSearchResult } from '../models/VendorSearchResult';
import { httpService } from './httpService';

// =====================================================
// Use HTTP Service to fetch vendors from API
// =====================================================
export const searchVendorsPost = async (request: VendorSearchRequest): Promise<VendorSearchResult> => {
    try {
        // Call the actual API endpoint
        const response = await httpService.post<VendorSearchResult>('/vendor-search', request);
        return response;
    } catch (error) {
        console.error('Error fetching vendors from API:', error);
        throw error;
    }
};

// Export for direct use in components
export default {
    searchVendorsPost
};
