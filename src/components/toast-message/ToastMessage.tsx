import { Alert, Snackbar } from '@mui/material';
import { ToastProps } from '../../consultant/types';

export const Toast = ({ open, message, severity, onClose }: ToastProps) => {
  return (
    <Snackbar
      open={open}
      autoHideDuration={3000}
      onClose={onClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
    >
      <Alert onClose={onClose} severity={severity}>
        {message}
      </Alert>
    </Snackbar>
  );
};
