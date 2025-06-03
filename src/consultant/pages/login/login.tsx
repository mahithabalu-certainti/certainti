// import { useMsal } from '@azure/msal-react';
import Box from '@mui/material/Box';
import { PublicClientApplication } from '@azure/msal-browser';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LeftPane, RightPane } from '.';
import { fetchCurrentUserRole } from '../../../common-service/common-service';
import { msalConfig } from '../../../config/msalConfig';
import { useAuthHook, useToast } from '../../../hooks';
import { useAppTranslation } from '../../../hooks/use-app-translation';
import { useAppDispatch } from '../../../store/store';
import { IAuthDetails } from '../../../store/type';
import { setUserId, updatePermissions } from '../../../store/slices';
import { checkPermission, reShapePermissionData } from '../../../common-utils';
import { AllModules } from '../../../common-service';
import { NOT_FOUND } from '../../../routes';
import { accountNavItems } from '../../../components/sidebar/accounts-menu';

const msalSigninInstance = new PublicClientApplication(msalConfig);

/**
 * Login component handles the user authentication process.
 * It uses MSAL for authentication and navigates to the home page upon successful login.
 */
export const Login: React.FC = () => {
  // const { instance } = useMsal();

  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { login } = useAuthHook();
  const { errorToast } = useToast();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const t = useAppTranslation();

  const handleLogin = async () => {
    try {
      setIsLoading(true);
      await msalSigninInstance.initialize();

      // Add redirect handling
      const loginRequest = {
        scopes: ['openid', 'profile'],
        redirectUri: import.meta.env.VITE_REDIRECT_URL,
      };

      const { idToken, account } =
        await msalSigninInstance.loginPopup(loginRequest);
      const userRole = await fetchCurrentUserRole(
        account?.localAccountId,
        idToken
      );
      const reShapeData = reShapePermissionData(userRole.data.permissions);
      const isAdminEnable = checkPermission(reShapeData.modules, [
        AllModules.USER_MANAGEMENT,
        AllModules.PROFILE_MANAGEMENT,
      ]);
      const authDetail = {
        isAuthenticated: true,
        authToken: idToken,
        azureId: account?.localAccountId,
        email: account?.username,
        name: account?.name,
        role: userRole.data.user_role,
        userId: userRole.data.user_id,
      };
      login(authDetail as IAuthDetails);
      dispatch(setUserId(account?.localAccountId));
      dispatch(updatePermissions({ ...reShapeData, isAdminEnable }));
      setIsLoading(false);
      const currentActiveRoute = accountNavItems.find(
        (menu) =>
          reShapeData.menus.find((item) => item.name === menu.id)?.is_enabled
      );
      navigate(currentActiveRoute?.link || NOT_FOUND);
    } catch (error) {
      setIsLoading(false);
      const err = error as Error;
      if (err?.message !== 'user_cancelled: User cancelled the flow.') {
        errorToast(
          `<strong>${err?.message}</strong><p>${t('core', 'login.signInError')}</p>`
        );
      }
    }
  };
  return (
    <Box className='min-h-screen flex'>
      <Box className='flex-1 grid md:grid-cols-2'>
        <LeftPane handleLogin={handleLogin} isLoading={isLoading} />
        <RightPane />
      </Box>
    </Box>
  );
};
