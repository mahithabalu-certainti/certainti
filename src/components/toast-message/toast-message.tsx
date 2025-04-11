import { Alert, Snackbar } from '@mui/material';
import { ToastProps } from '../../consultant/types';

export const Toast = ({ open, message, severity, onClose }: ToastProps) => {
  return (
    <Snackbar
      open={open}
      autoHideDuration={3000}
      onClose={onClose}
      anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      sx={{
        boxShadow: '0 0 38px #000',
        marginTop: '54px' // Changed from top to marginTop for better positioning
      }}
    >
      <Alert onClose={onClose} severity={severity}>
        {message}
      </Alert>
    </Snackbar>
  );
};
