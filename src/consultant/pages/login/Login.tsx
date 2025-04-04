import { useMsal } from '@azure/msal-react';
import Box from '@mui/material/Box';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LeftPane, RightPane } from '.';
import { useAuthHook } from '../../../hooks';
import { MAIN_ROUTE } from '../../../routes';
import { IAuthDetails } from '../../../store/type/auth-slice-type';

/**
 * Login component handles the user authentication process.
 * It uses MSAL for authentication and navigates to the home page upon successful login.
 */
export const Login: React.FC = () => {
  const { instance } = useMsal();
  const navigate = useNavigate();
  const { login } = useAuthHook();

  /**
   * Handles the login process using MSAL.
   * On successful login, it updates the authentication details and navigates to the home page.
   */
  const handleLogin = async () => {
    try {
      const { idToken, account } = await instance.loginPopup();
      const authDetail = {
        isAuthenticated: true,
        authToken: idToken,
        userId: account?.localAccountId,
        email: account?.username,
        name: account?.name,
      };
      login(authDetail as IAuthDetails);
      navigate(MAIN_ROUTE);
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <Box className='min-h-screen flex'>
      <Box className='flex-1 grid md:grid-cols-2'>
        <LeftPane handleLogin={handleLogin} />
        <RightPane />
      </Box>
    </Box>
  );
};
