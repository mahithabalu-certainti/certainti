import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { setUserId } from '../store/slices/account-slice';
import { clearAuthDetail, setAuthDetail } from '../store/slices/auth-slice';
import { clearWebSocketState } from '../store/slices/websocket-slice';
import { IAuthDetails } from '../store/type';

const DEFAULT_AUTH_DETAIL: IAuthDetails = {
  authToken: null,
  email: null,
  isAuthenticated: false,
  userId: null,
  azureId: null,
  name: null,
  role: null,
};

export const useAuthHook = () => {
  const dispatch = useDispatch();
  const [authDetails, setAuthDetails] = useState<IAuthDetails>(() => {
    const auth = localStorage.getItem('auth');
    if (!auth) return DEFAULT_AUTH_DETAIL;

    const parsedAuth = JSON.parse(auth);
    dispatch(setAuthDetail(parsedAuth));
    dispatch(setUserId(parsedAuth.userId));
    return parsedAuth;
  });

  const isAuthenticated = (): boolean => {
    return authDetails.isAuthenticated ?? false;
  };

  const login = (authDetail: IAuthDetails) => {
    localStorage.setItem('auth', JSON.stringify(authDetail));
    setAuthDetails(authDetail);
    dispatch(setAuthDetail(authDetail));
  };

  const logout = () => {
    localStorage.removeItem('auth');
    localStorage.removeItem('FILTER_STATE');
    localStorage.removeItem('showAdminSidebar');
    localStorage.removeItem('resetPassword');
    dispatch(clearAuthDetail());
    dispatch(clearWebSocketState()); // Clear WebSocket state to trigger disconnection
    setAuthDetails(DEFAULT_AUTH_DETAIL);
  };

  return {
    authDetails,
    isAuthenticated,
    login,
    logout,
  };
};
