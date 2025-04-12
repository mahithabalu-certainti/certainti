import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { clearAuthDetail, setAuthDetail } from '../store/slices/auth-slice';
import { IAuthDetails } from '../store/type/auth-slice-type';
import { setUserId } from '../store/slices/account-slice';

const DEFAULT_AUTH_DETAIL: IAuthDetails = {
  authToken: null,
  email: null,
  isAuthenticated: false,
  userId: null,
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
    // return true;
  };

  const login = (authDetail: IAuthDetails) => {
    localStorage.setItem('auth', JSON.stringify(authDetail));
    setAuthDetails(authDetail);
    dispatch(setAuthDetail(authDetail));
  };

  const logout = () => {
    localStorage.removeItem('auth');
    dispatch(clearAuthDetail());
    setAuthDetails(DEFAULT_AUTH_DETAIL);
  };

  return {
    authDetails,
    isAuthenticated,
    login,
    logout,
  };
};
