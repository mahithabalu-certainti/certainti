import { store } from '../store/store';

export const showToast = (
  message: string,
  severity: 'error' | 'success' = 'error'
) => {
  store.dispatch({
    type: 'toast/showToast',
    payload: { message, severity },
  });
};
