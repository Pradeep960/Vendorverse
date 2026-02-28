import axios, { type AxiosInstance, type AxiosRequestConfig } from 'axios';

// Base API URL from environment or use the provided endpoint
const BASE_URL = import.meta.env.VITE_API_URL || 'https://tenant-connecting-moms-caribbean.trycloudflare.com/';

class HttpService {
    private client: AxiosInstance;

    constructor(baseURL: string = BASE_URL) {
        this.client = axios.create({
            baseURL,
            headers: {
                'Content-Type': 'application/json',
            },
            timeout: 30000,
        });

        // Request interceptor
        this.client.interceptors.request.use(
            (config) => {
                console.log(`📤 ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
                return config;
            },
            (error) => {
                console.error('Request error:', error);
                return Promise.reject(error);
            }
        );

        // Response interceptor
        this.client.interceptors.response.use(
            (response) => {
                console.log(`📥 Response ${response.status}:`, response.data);
                return response;
            },
            (error) => {
                console.error('Response error:', error.response || error.message);
                return Promise.reject(error);
            }
        );
    }

    async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
        const response = await this.client.get<T>(url, config);
        return response.data;
    }

    async post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
        const response = await this.client.post<T>(url, data, config);
        return response.data;
    }

    async put<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
        const response = await this.client.put<T>(url, data, config);
        return response.data;
    }

    async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
        const response = await this.client.delete<T>(url, config);
        return response.data;
    }

    // Set auth token for authenticated requests
    setAuthToken(token: string): void {
        this.client.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }

    // Remove auth token
    clearAuthToken(): void {
        delete this.client.defaults.headers.common['Authorization'];
    }
}

// Export a singleton instance
export const httpService = new HttpService();

// Export the class for custom instances
export default HttpService;
