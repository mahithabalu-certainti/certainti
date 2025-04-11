import { MsalProvider } from '@azure/msal-react';
import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { CreateUser, ManageUser, ManageUserDetails } from './admin/pages';
import { AppLayout, Toast } from './components';
import {
  AccountDetails,
  AccountForm,
  Accounts,
  HomePage,
  Login,
  NotFound,
  ProjectForm,
  ResourceForm,
} from './consultant/pages';
import { IApp } from './consultant/types';
import { useAuthHook } from './hooks/use-auth';
import {
  ACCOUNT,
  ACCOUNT_CREATE,
  ACCOUNT_DETAILS,
  ACCOUNT_EDIT,
  ADMIN_CREATE_USER,
  ADMIN_EDIT_USER,
  ADMIN_MANAGE_USER,
  ADMIN_MANAGE_USER_DETAILS,
  LOGIN,
  MAIN_ROUTE,
  NOT_MATCH,
  PROJECT_CREATE,
  ProtectedRoute,
  RESOURCE_CREATE,
} from './routes';
import { useToast } from './hooks';
import { useSelector } from 'react-redux';
import { RootState } from './store/store';

/**
 * App component serves as the root component of the application.
 * It sets up the MSAL provider and defines the routes for the application.
 *
 * @param {IApp} props - The props for the component.
 * @param {object} props.instance - The MSAL instance for authentication.
 */
export const App: React.FC<IApp> = ({ instance }) => {
  const { isAuthenticated } = useAuthHook();
  const _isAuthenticated = isAuthenticated();
  const { hideToast } = useToast();
  const toastProps = useSelector((state: RootState) => state.toast);

  return (
    <MsalProvider instance={instance}>
      <Routes>
        <Route
          path={LOGIN}
          element={
            _isAuthenticated ? <Navigate to={MAIN_ROUTE} replace /> : <Login />
          }
        />
        <Route element={<AppLayout />}>
          {/* Accounts protected routes */}
          <Route element={<ProtectedRoute requireConsultant />}>
            <Route index element={<HomePage />} />
            <Route index path={ACCOUNT} element={<Accounts />} />
            <Route path={ACCOUNT_CREATE} element={<AccountForm />} />
            <Route path={ACCOUNT_EDIT} element={<AccountForm />} />
            <Route path={ACCOUNT_DETAILS} element={<AccountDetails />} />
            <Route path={PROJECT_CREATE} element={<ProjectForm />} />
            <Route path={RESOURCE_CREATE} element={<ResourceForm />} />
          </Route>

          {/* Admin protected routes */}
          <Route element={<ProtectedRoute requireAdmin />}>
            <Route path={ADMIN_MANAGE_USER} element={<ManageUser />} />
            <Route
              path={ADMIN_MANAGE_USER_DETAILS}
              element={<ManageUserDetails />}
            />
            <Route path={ADMIN_CREATE_USER} element={<CreateUser />} />
            <Route path={ADMIN_EDIT_USER} element={<CreateUser />} />
          </Route>

          {/* Page not found */}
          <Route path={NOT_MATCH} element={<NotFound />} />
        </Route>
      </Routes>
      <Toast onClose={hideToast} {...toastProps} />
    </MsalProvider>
  );
};
