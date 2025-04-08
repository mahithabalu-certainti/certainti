// api.ts
import axios, { AxiosError, AxiosResponse } from 'axios';
import { LOGIN } from '../routes';

// Type for standard error response
type ErrorResponse = {
  message?: string;
  errors?: Record<string, string[]>;
};

// Create User Service Axios instance
const userServiceApi = axios.create({
  baseURL: import.meta.env.VITE_BASE_URL + import.meta.env.VITE_USER_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Create Account Service Axios instance
const accountServiceApi = axios.create({
  baseURL: import.meta.env.VITE_BASE_URL + import.meta.env.VITE_ACCOUNT_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Common error handler for both services
const errorHandler = (error: AxiosError<ErrorResponse>) => {
  if (!error.response) {
    console.error('Network error - Please check your internet connection.');
    throw new Error('Network error');
  }

  const { status, data } = error.response;
  const errorMessage = data?.message || error.message;

  console.error(`API Error: ${status} - ${errorMessage}`);

  if (status === 401) {
    console.warn('Unauthorized - Redirecting to login...');
    window.location.href = LOGIN;
  }

  throw new Error(errorMessage);
};

// Apply interceptors to both services
[accountServiceApi, userServiceApi].forEach((api) => {
  api.interceptors.response.use(
    (response: AxiosResponse) => response,
    errorHandler
  );
});

export { userServiceApi, accountServiceApi };
