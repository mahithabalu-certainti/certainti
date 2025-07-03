import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Import language files
import {
  default as enCore,
  default as enInvoice,
  default as enSopedia,
} from '../constants/en.json';

const DEFAULT_LANGUAGE = 'en';

i18n.use(initReactI18next).init({
  resources: {
    [DEFAULT_LANGUAGE]: {
      sop: enSopedia,
      invoice: enInvoice,
      core: enCore,
    },
  },
  lng: DEFAULT_LANGUAGE,
  fallbackLng: DEFAULT_LANGUAGE,
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
