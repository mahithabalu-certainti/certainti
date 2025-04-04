import { useState } from 'react';
import { AlertColor } from '@mui/material';

interface ToastState {
  open: boolean;
  message: string;
  severity: AlertColor;
}

export const useToast = () => {
  const [toast, setToast] = useState<ToastState>({
    open: false,
    message: '',
    severity: 'info',
  });

  const showToast = (message: string, severity: AlertColor = 'info') => {
    setToast({ open: true, message, severity });
  };

  const hideToast = () => {
    setToast((prev) => ({ ...prev, open: false }));
  };

  const successToast = (message: string) => showToast(message, 'success');
  const errorToast = (message: string) => showToast(message, 'error');
  const warningToast = (message: string) => showToast(message, 'warning');
  const infoToast = (message: string) => showToast(message, 'info');

  return {
    toast,
    showToast,
    hideToast,
    successToast,
    errorToast,
    warningToast,
    infoToast,
  };
};
