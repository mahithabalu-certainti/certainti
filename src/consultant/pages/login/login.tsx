import { useMsal } from '@azure/msal-react';
import Box from '@mui/material/Box';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LeftPane, RightPane } from '.';
import { fetchCurrentUserRole } from '../../../common-service/common-service';
import { useAuthHook, useToast } from '../../../hooks';
import { useAppTranslation } from '../../../hooks/use-app-translation';
import { useAppDispatch } from '../../../store/store';
import { IAuthDetails } from '../../../store/type';
import {
  setUserId,
  UpdateOrgLogo,
  updatePermissions,
} from '../../../store/slices';
import { checkPermission, reShapePermissionData } from '../../../common-utils';
import { AllModules } from '../../../common-service';
import { NOT_FOUND } from '../../../routes';
import { accountNavItems } from '../../../components/sidebar/accounts-menu';
import { InteractionStatus } from '@azure/msal-browser';

/**
 * Login component handles the user authentication process.
 * It uses MSAL for authentication and navigates to the home page upon successful login.
 */
export const Login: React.FC = () => {
  const { instance, inProgress } = useMsal();
  const allAccount = instance.getAllAccounts();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { login } = useAuthHook();
  const { errorToast } = useToast();
  const t = useAppTranslation();

  useEffect(() => {
    if (allAccount.length > 0) {
      setIsLoading(true);
      const getResponse = async () => {
        const { localAccountId, idToken, username, name, idTokenClaims } =
          allAccount[0];
        const userRole = await fetchCurrentUserRole(
          localAccountId,
          idToken as string
        );
        const reShapeData = reShapePermissionData(userRole.data.permissions);
        const isAdminEnable = checkPermission(reShapeData.modules, [
          AllModules.USER_MANAGEMENT,
          AllModules.PROFILE_MANAGEMENT,
        ]);
        const authDetail = {
          isAuthenticated: true,
          authToken: idToken,
          azureId: localAccountId,
          email: username,
          name: name,
          role: userRole.data.user_role,
          userId: userRole.data.user_id,
          exp: idTokenClaims?.exp,
        };
        login(authDetail as IAuthDetails);
        dispatch(setUserId(localAccountId));
        dispatch(updatePermissions({ ...reShapeData, isAdminEnable }));
        dispatch(
          UpdateOrgLogo({
            orgName: userRole.data.organisation_name,
            logoUrl: userRole.data.logo_url,
          })
        );
        const currentActiveRoute = accountNavItems.find(
          (menu) =>
            !menu.noRedirect &&
            reShapeData.menus.find((item) => item.name === menu.id)?.is_enabled
        );
        localStorage.removeItem('loginInitiated');
        navigate(currentActiveRoute?.link || NOT_FOUND);
      };
      getResponse();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allAccount]);

  const handleLogin = () => {
    setIsLoading(true);
    instance.loginRedirect().catch((e) => {
      localStorage.removeItem('loginInitiated');
      setIsLoading(false);
      const err = e as Error;
      if (err?.message !== 'user_cancelled: User cancelled the flow.') {
        errorToast(
          `<strong>${err?.message}</strong><p>${t('core', 'login.signInError')}</p>`
        );
      }
    });
  };
  return (
    <Box className='min-h-screen flex'>
      <Box className='flex-1 grid md:grid-cols-2'>
        <LeftPane
          handleLogin={handleLogin}
          isLoading={
            inProgress === InteractionStatus.HandleRedirect || isLoading
          }
        />
        <RightPane />
      </Box>
    </Box>
  );
};

export default Login;
