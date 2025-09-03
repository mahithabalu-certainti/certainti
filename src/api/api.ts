// api.ts
import axios, { AxiosError, AxiosResponse } from 'axios';
import { LOGIN } from '../routes';
import { PublicClientApplication } from '@azure/msal-browser';
import { msalConfig } from '../config/msalConfig';
import { AxiosErrorMsg, FailedQueueItem } from '../common-service';
import { errorHandling } from '../common-utils';
import { showToast } from '../utils/toast';

// Initialize MSAL instance
const msalSigninInstance = new PublicClientApplication(msalConfig);
let msalInitialized = false;

(async () => {
  await msalSigninInstance.initialize();
  msalInitialized = true;
})().catch(console.error);

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
  // headers: { 'Content-Type': 'application/json' },
});

// Create Resource Service Axios instance
const resourceServiceApi = axios.create({
  baseURL: import.meta.env.VITE_BASE_URL + import.meta.env.VITE_RESOURCE_URL,
  headers: { 'Content-Type': 'application/json' },
});

const interactionServiceApi = axios.create({
  baseURL: import.meta.env.VITE_BASE_URL + import.meta.env.VITE_INTERACTION_URL,
  headers: { 'Content-Type': 'application/json' },
});

const exInteractionServiceApi = axios.create({
  baseURL:
    import.meta.env.VITE_BASE_URL + import.meta.env.VITE_EXT_INTERACTION_URL,
  headers: { 'Content-Type': 'application/json' },
});

const api = axios.create({
  baseURL: import.meta.env.VITE_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Apply interceptors to both services
[
  accountServiceApi,
  userServiceApi,
  resourceServiceApi,
  interactionServiceApi,
  exInteractionServiceApi,
  api,
].forEach((api) => {
  api.interceptors.request.use(
    (config) => {
      const auth = localStorage.getItem('auth');
      const { authToken, userId } = auth ? JSON.parse(auth) : {};
      if (authToken) {
        config.headers.Authorization = `Bearer ${authToken}`;
      }
      if (userId) {
        config.headers['x-user-id'] = userId;
      }
      return config;
    },
    (error: unknown) => {
      return Promise.reject(error);
    }
  );
});

// Create a flag to prevent multiple refresh attempts
let isRefreshing = false;
let failedQueue: FailedQueueItem[] = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token!);
    }
  });
  failedQueue = [];
};

// Modify the response interceptor
[
  accountServiceApi,
  userServiceApi,
  resourceServiceApi,
  interactionServiceApi,
  exInteractionServiceApi,
  api,
].forEach((api) => {
  api.interceptors.response.use(
    (response: AxiosResponse) => {
      return response;
    },
    async (error: AxiosError) => {
      const originalRequest = error.config!;

      // Check if error is due to token expiration
      if (
        error.response?.status === 401 &&
        !(originalRequest as { _retry?: boolean })._retry
      ) {
        if (isRefreshing) {
          // If already refreshing, add to queue
          return new Promise<string>((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          })
            .then((token: string) => {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              return api(originalRequest);
            })
            .catch((err: unknown) => Promise.reject(err));
        }

        (originalRequest as { _retry?: boolean })._retry = true;
        isRefreshing = true;

        try {
          // Get the active account (no need to initialize again)
          if (!msalInitialized) {
            await msalSigninInstance.initialize();
            msalInitialized = true;
          }

          const accounts = msalSigninInstance.getAllAccounts();
          if (!accounts || accounts.length === 0) {
            throw new Error('No active account! Please sign in first.');
          }

          const account = accounts[0];
          const { idToken } = await msalSigninInstance.acquireTokenSilent({
            account,
            scopes: ['openid', 'profile'],
          });

          // Update localStorage
          const auth = localStorage.getItem('auth');
          if (auth) {
            const authData: { authToken: string } = JSON.parse(auth);
            authData.authToken = idToken;
            localStorage.setItem('auth', JSON.stringify(authData));
          }

          // Update the failed request with new token
          originalRequest.headers.Authorization = `Bearer ${idToken}`;

          // Process queue with new token
          processQueue(null, idToken);
          isRefreshing = false;

          // Retry the original request
          return api(originalRequest);
        } catch (refreshError: unknown) {
          // If refresh fails, clear queue and redirect to login
          processQueue(refreshError, null);
          isRefreshing = false;
          console.error('refreshError', refreshError);
          // Show error toast
          showToast('Session expired. Please login again.', 'error');
          setTimeout(() => {
            localStorage.removeItem('auth');
            localStorage.removeItem('showAdminSidebar');
            localStorage.removeItem('resetPassword');
            if (window.location.pathname !== LOGIN) {
              window.location.href = LOGIN;
            }
          }, 3000);
          return Promise.reject(refreshError);
        }
      } else if (error.response?.status === 403) {
        const errorMsg = errorHandling(error as AxiosErrorMsg);
        //If Account was In-active or API permission denied, then redirect to login page
        showToast(errorMsg, 'error');

        setTimeout(() => {
          msalSigninInstance.logoutRedirect().catch((e) => {
            console.error('Error logging out:', e);
          });
          localStorage.removeItem('auth');
          localStorage.removeItem('showAdminSidebar');
          localStorage.removeItem('resetPassword');
        }, 3000);
        return Promise.reject(error);
      } else {
        //common error handling
        const errorMsg = errorHandling(error as AxiosErrorMsg);
        showToast(errorMsg, 'error');
        return Promise.reject(error);
      }
    }
  );
});

export {
  accountServiceApi,
  userServiceApi,
  resourceServiceApi,
  interactionServiceApi,
  exInteractionServiceApi,
  api,
};
