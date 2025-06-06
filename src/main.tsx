import { PublicClientApplication } from '@azure/msal-browser';
import { ThemeProvider } from '@mui/material';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';

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

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider store={store}>
    <PersistGate loading={null} persistor={persistor}>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <ThemeProvider theme={theme}>
            <App instance={msalInstance} />
          </ThemeProvider>
        </BrowserRouter>
      </QueryClientProvider>
      </PersistGate>
    </Provider>
  </StrictMode>
);
