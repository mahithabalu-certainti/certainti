export const msalConfig = {
  auth: {
    clientId: import.meta.env.VITE_CLIENT_ID,
    authority: import.meta.env.VITE_AUTHORITY,
    knownAuthorities: [import.meta.env.VITE_KNOWN_AUTHORITIES],
    redirectUri: import.meta.env.VITE_REDIRECT_URL,
    postLogoutRedirectUri: import.meta.env.VITE_POST_LOGOUT_REDIRECT_URL,
    navigateToLoginRequestUrl: true,
  },
  cache: {
    cacheLocation: 'sessionStorage',
    storeAuthStateInCookie: true, // Set this to 'true' for IE11/Edge
  },
};
