import { MsalProvider } from '@azure/msal-react';
import React, { Suspense, lazy } from 'react';
import { useSelector } from 'react-redux';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout, Toast } from './components';
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
  MANAGE_USER_GROUP,
  MANAGE_USER_GROUP_CREATE,
  MANAGE_USER_GROUP_EDIT,
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
import { RootState } from './store/store';

// Lazy load all page components
const ExtendedPermission = lazy(
  () =>
    import('./admin/pages/manage-user/extended-permission/extended-permission')
);
const Resource = lazy(
  () =>
    import(
      './consultant/pages/account-details-sidebar/sidebar-pages/resources/resources'
    )
);
const Login = lazy(() => import('./pages/login/login'));
const Profile = lazy(() => import('./pages/profile/profile'));
const HomePage = lazy(() => import('./consultant/pages/home/Home'));
const NotFound = lazy(() => import('./pages/not-found/NotFound'));
const Accounts = lazy(() => import('./consultant/pages/account-list/accounts'));
const AccountForm = lazy(
  () => import('./consultant/pages/account-create/account-create')
);
const AccountDetails = lazy(
  () => import('./consultant/pages/account-details/account-details')
);
const Projects = lazy(
  () => import('./consultant/pages/project/project-list/projects')
);
const ProjectDetails = lazy(
  () => import('./consultant/pages/project/project-details/project-details')
);
const ProjectForm = lazy(
  () => import('./consultant/pages/project-form/project-form')
);
const ResourceForm = lazy(
  () => import('./consultant/pages/resource-form/resource-form')
);
const UserList = lazy(
  () => import('./admin/pages/manage-user/user-list/user-list')
);
const ManageUserDetails = lazy(
  () => import('./admin/pages/manage-user-detail/manage-user-detail')
);
const CreateUser = lazy(
  () => import('./admin/pages/manage-user/create-user/create-user')
);
const ProfileList = lazy(
  () => import('./admin/pages/manage-profile/profile-list/profile-list')
);
const CreateProfile = lazy(
  () => import('./admin/pages/manage-profile/create-profile/create-profile')
);
const UserGroupList = lazy(
  () => import('./admin/pages/manage-user-group/user-group-list/user-group-list')
);
const CreateUserGroup = lazy(
  () => import('./admin/pages/manage-user-group/create-user-group/create-user-group')
);

// Loading component for Suspense fallback
const Loading = () => (
  <div className='flex h-screen w-full items-center justify-center'>
    Loading...
  </div>
);

export const App: React.FC<IApp> = ({ instance }) => {
  const { isAuthenticated } = useAuthHook();
  const _isAuthenticated = isAuthenticated();
  const { hideToast } = useToast();
  const toastProps = useSelector((state: RootState) => state.toast);

  return (
    <MsalProvider instance={instance}>
      <Suspense fallback={<Loading />}>
        <BrowserRouter>
          <Routes>
            <Route
              path={LOGIN}
              element={
                _isAuthenticated ? (
                  <Navigate to={MAIN_ROUTE} replace />
                ) : (
                  <Login />
                )
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
                <Route
                  path={MANAGE_PROFILE_CREATE}
                  element={<CreateProfile />}
                />
                <Route path={MANAGE_PROFILE_EDIT} element={<CreateProfile />} />
                <Route path={MANAGE_USER_GROUP} element={<UserGroupList />} />
                <Route path={MANAGE_USER_GROUP_CREATE} element={<CreateUserGroup />} />
                <Route path={MANAGE_USER_GROUP_EDIT} element={<CreateUserGroup />} />
              </Route>
              {/* Page not found */}
              <Route path={NOT_MATCH} element={<NotFound />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </Suspense>
      <Toast onClose={hideToast} {...toastProps} />
    </MsalProvider>
  );
};
