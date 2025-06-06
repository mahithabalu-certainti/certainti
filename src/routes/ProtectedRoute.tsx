import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthHook } from '../hooks/use-auth';
import { LOGIN, MAIN_ROUTE } from './routes';
import { useSelector } from 'react-redux';
import { RootState } from '../store/store';

interface ProtectedRouteProps {
  requireAdmin?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  requireAdmin = false,
}) => {
  const { isAuthenticated } = useAuthHook();
  const isAuth = isAuthenticated();
  const { isAdminEnable } = useSelector((state: RootState) => state.permission);
  const location = useLocation();

  if (!isAuth) {
    return <Navigate to={LOGIN} replace />;
  }

  if (requireAdmin && !isAdminEnable) {
    //Restrict Admin pages from Consultant Role
    return <Navigate to={MAIN_ROUTE} replace state={{ from: location }} />;
  }

  return <Outlet />;
};
