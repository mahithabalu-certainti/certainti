import { MsalProvider } from '@azure/msal-react';
import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Navigate, Route, Routes } from 'react-router-dom';
import {
  CreateUser,
  ManageUserDetails,
  ProfileList,
  CreateProfile,
  UserList,
  ExtendedPermission,
} from './admin/pages';
import { AppLayout, Toast } from './components';
import {
  AccountDetails,
  AccountForm,
  Accounts,
  HomePage,
  Login,
  NotFound,
  Profile,
  ProjectDetails,
  ProjectForm,
  Projects,
  ResourceForm,
} from './consultant/pages';
import Resource from './consultant/pages/account-details-sidebar/sidebar-pages/resources/resources';
import { IApp } from './consultant/types';
import { useToast } from './hooks';
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
  MANAGE_PROFILE,
  MANAGE_PROFILE_CREATE,
  MANAGE_PROFILE_EDIT,
  NOT_MATCH,
  PROFILE,
  PROJECT,
  PROJECT_CREATE,
  PROJECT_DETAILS,
  PROJECT_EDIT,
  ProtectedRoute,
  RESOURCE,
  RESOURCE_CREATE,
  RESOURCE_EDIT,
  RESOURCECOST_CREATE,
  RESOURCECOST_EDIT,
  RESOURCESKILL_CREATE,
  RESOURCESKILL_EDIT,
  USER_EXTENDED_PERMISSION,
} from './routes';
import { RootState, useAppDispatch } from './store/store';
import { mockCurrentUserRole } from './common-service';
import { updatePermissions } from './store/slices';
import { reShapePermissionData } from './common-utils';

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
  const dispatch = useAppDispatch();
  const toastProps = useSelector((state: RootState) => state.toast);

  // temporary solution
  useEffect(() => {
    const cloneData = JSON.parse(JSON.stringify(mockCurrentUserRole.data.permissions))
    dispatch(
      updatePermissions(
        reShapePermissionData(cloneData)
      )
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <MsalProvider instance={instance}>
      <Routes>
        <Route
          path={LOGIN}
          element={
            _isAuthenticated ? <Navigate to={MAIN_ROUTE} replace /> : <Login />
          }
        />
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route index element={<HomePage />} />
            <Route index path={ACCOUNT} element={<Accounts />} />
            <Route path={ACCOUNT_CREATE} element={<AccountForm />} />
            <Route path={ACCOUNT_EDIT} element={<AccountForm />} />
            <Route path={ACCOUNT_DETAILS} element={<AccountDetails />} />
            <Route path={PROJECT} element={<Projects />} />
            <Route path={PROJECT_DETAILS} element={<ProjectDetails />} />
            <Route path={PROJECT_CREATE} element={<ProjectForm />} />
            <Route path={PROJECT_EDIT} element={<ProjectForm />} />
            <Route path={RESOURCE_CREATE} element={<ResourceForm />} />
            <Route path={RESOURCE_EDIT} element={<ResourceForm />} />
            <Route path={RESOURCECOST_CREATE} element={<ResourceForm />} />
            <Route path={RESOURCESKILL_CREATE} element={<ResourceForm />} />
            <Route path={RESOURCECOST_EDIT} element={<ResourceForm />} />
            <Route path={RESOURCESKILL_EDIT} element={<ResourceForm />} />
            <Route path={RESOURCE} element={<Resource />} />
            <Route path={PROFILE} element={<Profile />} />
            {/* Page not found */}
            <Route path={NOT_MATCH} element={<NotFound />} />
          </Route>
        </Route>

        {/* Admin protected routes */}
        <Route element={<ProtectedRoute requireAdmin />}>
          <Route element={<AppLayout />}>
            <Route path={ADMIN_MANAGE_USER} element={<UserList />} />
            <Route
              path={ADMIN_MANAGE_USER_DETAILS}
              element={<ManageUserDetails />}
            />
            <Route path={ADMIN_CREATE_USER} element={<CreateUser />} />
            <Route path={ADMIN_EDIT_USER} element={<CreateUser />} />
            <Route
              path={USER_EXTENDED_PERMISSION}
              element={<ExtendedPermission />}
            />
            <Route path={MANAGE_PROFILE} element={<ProfileList />} />
            <Route path={MANAGE_PROFILE_CREATE} element={<CreateProfile />} />
            <Route path={MANAGE_PROFILE_EDIT} element={<CreateProfile />} />
          </Route>
          {/* Page not found */}
          <Route path={NOT_MATCH} element={<NotFound />} />
        </Route>
      </Routes>
      <Toast onClose={hideToast} {...toastProps} />
    </MsalProvider>
  );
};
