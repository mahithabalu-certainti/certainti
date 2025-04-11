import { useDispatch } from 'react-redux';
import { showToast, hideToast } from '../store/slices/toast-slice';
import { AlertColor } from '@mui/material';

export const useToast = () => {
  const dispatch = useDispatch();

  return {
    showToast: (message: string, severity?: string) =>
      dispatch(showToast({ message, severity: severity as AlertColor })),
    hideToast: () => dispatch(hideToast()),
    successToast: (message: string) =>
      dispatch(showToast({ message, severity: 'success' })),
    errorToast: (message: string) =>
      dispatch(showToast({ message, severity: 'error' })),
  };
};
