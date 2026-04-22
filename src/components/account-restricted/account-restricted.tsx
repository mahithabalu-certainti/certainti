import { Alert } from '@mui/material';
import { DONT_HAVE_ACCESS } from '../../common-utils';

export const AccessRestricted: React.FC = () => {
  return (
    <h2 className='p-10 flex justify-center items-center'>
      <Alert severity='warning'>{DONT_HAVE_ACCESS}</Alert>
    </h2>
  );
};
