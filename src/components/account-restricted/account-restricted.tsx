import { Alert } from '@mui/material';

export const AccessRestricted: React.FC = () => {
  return (
    <h2 className='p-10 flex justify-center items-center'>
      <Alert severity='warning'>
        Access Restricted. Contact administrator to gain access.
      </Alert>
    </h2>
  );
};
