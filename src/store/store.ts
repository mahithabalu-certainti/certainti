import { configureStore } from '@reduxjs/toolkit';
import { useDispatch } from 'react-redux';
import accountSlice from './slices/account-slice';
import authSlice from './slices/auth-slice';
import languageSlice from './slices/language-slice';
import toastReducer from './slices/toast-slice';

export const store = configureStore({
  reducer: {
    language: languageSlice,
    auth: authSlice,
    toast: toastReducer,
    account: accountSlice,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export const useAppDispatch = () => useDispatch<AppDispatch>();
