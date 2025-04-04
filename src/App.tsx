import { MsalProvider } from '@azure/msal-react';
import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { CreateUser, ManageUser, ManageUserDetails } from './admin/pages';
import { AppLayout } from './components';
import {
  AccountDetails,
  AccountForm,
  Accounts,
  HomePage,
  Login,
  NotFound,
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
  NOT_FOUND,
  ProtectedRoute,
} from './routes';

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

  return (
    <MsalProvider instance={instance}>
      <Routes>
        {/* Route for the login page */}
        <Route
          path={LOGIN}
          element={
            _isAuthenticated ? <Navigate to={MAIN_ROUTE} replace /> : <Login />
          }
        />

        {/* Protected routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            {/* Route for the home page */}
            <Route index element={<HomePage />} />
            <Route path={ACCOUNT} element={<Accounts />} />
            <Route path={ACCOUNT_CREATE} element={<AccountForm />} />
            <Route path={ACCOUNT_EDIT} element={<AccountForm />} />
            <Route path={ACCOUNT_DETAILS} element={<AccountDetails />} />

            {/* Route for the Admin */}

            <Route path={ADMIN_MANAGE_USER} element={<ManageUser />} />
            <Route
              path={ADMIN_MANAGE_USER_DETAILS}
              element={<ManageUserDetails />}
            />
            <Route path={ADMIN_CREATE_USER} element={<CreateUser />} />
            <Route path={ADMIN_EDIT_USER} element={<CreateUser />} />
          </Route>
        </Route>

        {/* Route for the 404 Not Found page */}
        <Route path={NOT_FOUND} element={<NotFound />} />
      </Routes>
    </MsalProvider>
  );
};
