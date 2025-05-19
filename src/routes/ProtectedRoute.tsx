import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthHook } from '../hooks/use-auth';
import { ACCOUNT, LOGIN } from './routes';
import { useSelector } from 'react-redux';
import { RootState } from '../store/store';
import { UserRoles } from '../common-service';

interface ProtectedRouteProps {
  requireAdmin?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  requireAdmin = false,
}) => {
  const { isAuthenticated } = useAuthHook();
  const isAuth = isAuthenticated();
  const userRole = useSelector((state: RootState) => state.auth.role);
  const location = useLocation();

  if (!isAuth) {
    return <Navigate to={LOGIN} replace />;
  }

  if (requireAdmin && userRole !== UserRoles.Admin) {
    //Restrict Admin pages from Consultant Role
    return <Navigate to={ACCOUNT} replace state={{ from: location }} />;
  }

  return <Outlet />;
};
