import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AlertColor } from '@mui/material';
import { ToastState } from '../type';

const initialState: ToastState = {
  open: false,
  message: '',
  severity: 'info',
};

export const toastSlice = createSlice({
  name: 'toast',
  initialState,
  reducers: {
    showToast: (
      state,
      action: PayloadAction<{ message: string; severity?: AlertColor }>
    ) => {
      state.open = true;
      state.message = action.payload.message;
      state.severity = action.payload.severity || 'info';
    },
    hideToast: (state) => {
      state.open = false;
      state.message = '';
    },
  },
});

export const { showToast, hideToast } = toastSlice.actions;
