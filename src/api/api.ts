// api.ts
import axios, { AxiosError, AxiosResponse } from 'axios';
import { LOGIN } from '../routes';

export const BASE_URL = 'https://frank-mastiff-merry.ngrok-free.app';
export const ORGANIZATION = 'PF2.0';

// Create Axios instance
const api = axios.create({
  baseURL: BASE_URL, // Replace with your API base URL
  headers: {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': '1',
  },
});

// Type for standard error response
type ErrorResponse = {
  message?: string;
  errors?: Record<string, string[]>;
};

// Axios Interceptors for Error Handling
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError<ErrorResponse>) => {
    if (!error.response) {
      console.error('Network error - Please check your internet connection.');
      throw new Error('Network error');
    }

    const { status, data } = error.response;
    const errorMessage = data?.message || error.message;

    console.error(`API Error: ${status} - ${errorMessage}`);

    // Handle 401 Unauthorized globally
    if (status === 401) {
      console.warn('Unauthorized - Redirecting to login...');
      window.location.href = LOGIN;
    }

    // You can transform the error here if needed
    throw new Error(errorMessage);
  }
);

export default api;
