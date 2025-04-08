// import { useMsal } from '@azure/msal-react';
import Box from '@mui/material/Box';
import { PublicClientApplication } from '@azure/msal-browser';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { LeftPane, RightPane } from '.';
import { useAuthHook, useToast } from '../../../hooks';
import { IAuthDetails } from '../../../store/type/auth-slice-type';
import { msalConfig } from '../../../config/msalConfig';
import { Toast } from '../../../components';
import { useAppTranslation } from '../../../hooks/use-app-translation';
import { fetchCurrentUserRole } from '../../../common-service/common-service';

const msalSigninInstance = new PublicClientApplication(msalConfig);

/**
 * Login component handles the user authentication process.
 * It uses MSAL for authentication and navigates to the home page upon successful login.
 */
export const Login: React.FC = () => {
  // const { instance } = useMsal();

  const navigate = useNavigate();
  const { login } = useAuthHook();
  const { toast, hideToast, errorToast } = useToast();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const t = useAppTranslation();

  const handleLogin = async () => {
    try {
      setIsLoading(true);
      await msalSigninInstance.initialize();
      const { idToken, account } = await msalSigninInstance.loginPopup();

      const userRole = await fetchCurrentUserRole(account?.localAccountId);
      const authDetail = {
        isAuthenticated: true,
        authToken: idToken,
        userId: account?.localAccountId,
        email: account?.username,
        name: account?.name,
        role: userRole.data.user_role,
      };
      login(authDetail as IAuthDetails);
      setIsLoading(false);
      navigate('/');
    } catch (error) {
      setIsLoading(false);
      const err = error as Error;
      if (err?.message !== 'user_cancelled: User cancelled the flow.') {
        errorToast(t('core', 'login.signInError'));
      }
    }
  };

  return (
    <>
      <Toast {...toast} onClose={hideToast} />
      <Box className='min-h-screen flex'>
        <Box className='flex-1 grid md:grid-cols-2'>
          <LeftPane handleLogin={handleLogin} isLoading={isLoading} />
          <RightPane />
        </Box>
      </Box>
    </>
  );
};
