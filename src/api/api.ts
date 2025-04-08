// api.ts
import axios, { AxiosError, AxiosResponse } from 'axios';
import { LOGIN } from '../routes';

// Create User Service Axios instance
const userServiceApi = axios.create({
  baseURL: import.meta.env.VITE_BASE_URL + import.meta.env.VITE_USER_URL, // Replace with your API base URL
  headers: {
    'Content-Type': 'application/json',
  },
});

// Type for standard error response
type ErrorResponse = {
  message?: string;
  errors?: Record<string, string[]>;
};

// Create Account Service Axios instance
const accountServiceApi = axios.create({
  baseURL: import.meta.env.VITE_BASE_URL + import.meta.env.VITE_ACCOUNT_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Axios Interceptors for Error Handling
userServiceApi.interceptors.response.use(
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

// Axios Interceptors for Error Handling
accountServiceApi.interceptors.response.use(
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

export { userServiceApi, accountServiceApi };
