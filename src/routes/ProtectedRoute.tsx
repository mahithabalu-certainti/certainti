import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthHook } from '../hooks/use-auth';
import { LOGIN } from './routes';

export const ProtectedRoute: React.FC = () => {
  const { isAuthenticated } = useAuthHook();
  const isAuth = isAuthenticated();
  if (!isAuth) {
    return <Navigate to={LOGIN} replace />;
  }

  return <Outlet />;
};
