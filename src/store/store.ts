import { configureStore } from '@reduxjs/toolkit';
import authSlice from './slices/auth-slice';
import languageSlice from './slices/language-slice';

export const store = configureStore({
  reducer: {
    language: languageSlice,
    auth: authSlice,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
