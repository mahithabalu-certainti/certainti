import { combineReducers } from '@reduxjs/toolkit';
import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import { useDispatch } from 'react-redux';
import {
  languageSlice,
  authSlice,
  toastSlice,
  accountSlice,
  permissionSlice,
  orgLogoSlice,
} from './slices';

const persistConfig = {
  key: 'root',
  storage,
  whitelist: ['permission', 'orgLogoInfo'],
};

const rootReducer = combineReducers({
  permission: permissionSlice.reducer,
  language: languageSlice.reducer,
  auth: authSlice.reducer,
  toast: toastSlice.reducer,
  account: accountSlice.reducer,
  orgLogoInfo: orgLogoSlice.reducer,
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REGISTER'],
      },
    }),
});

export const persistor = persistStore(store);
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export const useAppDispatch = () => useDispatch<AppDispatch>();
