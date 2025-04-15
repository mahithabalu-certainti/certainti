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
import { IAuthDetails } from '../../../store/type/auth-slice-type';
import { setUserId } from '../../../store/slices/account-slice';

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
      const { idToken, account } = await msalSigninInstance.loginPopup();
      const userRole = await fetchCurrentUserRole(
        account?.localAccountId,
        idToken
      );
      const authDetail = {
        isAuthenticated: true,
        authToken: idToken,
        userId: account?.localAccountId,
        email: account?.username,
        name: account?.name,
        role: userRole.data.user_role,
      };
      login(authDetail as IAuthDetails);
      dispatch(setUserId(account?.localAccountId));
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
    <Box className='min-h-screen flex'>
      <Box className='flex-1 grid md:grid-cols-2'>
        <LeftPane handleLogin={handleLogin} isLoading={isLoading} />
        <RightPane />
      </Box>
    </Box>
  );
};
