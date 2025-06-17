import { EventType, PublicClientApplication } from '@azure/msal-browser';
import { ThemeProvider } from '@mui/material';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';

import { App } from './App.tsx';
import { msalConfig } from './config/msalConfig.ts';
import { theme } from './config/theme.ts';
import { store } from './store/store.ts';
import { PersistGate } from 'redux-persist/integration/react';
import { persistor } from './store/store';

import './config/i18n.ts';
import './index.css';

const msalInstance = new PublicClientApplication(msalConfig);
const queryClient = new QueryClient();

// Account selection logic
msalInstance.addEventCallback((event) => {
  if (
    event.eventType === EventType.LOGIN_SUCCESS &&
    event.payload &&
    "account" in event.payload
  ) {
    msalInstance.setActiveAccount(event.payload.account || null);
  }
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider store={store}>
    <PersistGate loading={null} persistor={persistor}>
      <QueryClientProvider client={queryClient}>
          <ThemeProvider theme={theme}>
            <App instance={msalInstance} />
          </ThemeProvider>
      </QueryClientProvider>
      </PersistGate>
    </Provider>
  </StrictMode>
);
