import { AlertColor } from '@mui/material';

export interface ToastProps {
  open: boolean;
  message: string;
  severity: AlertColor;
  onClose: () => void;
}
