import { Alert, Snackbar } from '@mui/material';
import { ToastProps } from '../../consultant/types';

export const Toast = ({ open, message, severity, onClose }: ToastProps) => {
  return (
    <Snackbar
      open={open}
      autoHideDuration={3000}
      onClose={onClose}
      anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      sx={{ marginTop: '54px' }}
    >
      <Alert
        onClose={onClose}
        severity={severity}
        sx={{ maxWidth: '80%', boxShadow: '0 0 38px #000', minWidth: '300px' }}
      >
        <div dangerouslySetInnerHTML={{ __html: message }} />
      </Alert>
    </Snackbar>
  );
};
