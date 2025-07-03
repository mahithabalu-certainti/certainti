import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../../store/store';
import { checkPermission } from '../../../common-utils';
import { MenuOption } from '../../../common-service';
import { AccessRestricted } from '../../../components/account-restricted';
import { ComingSoon } from '../../../assets';

export const HomePage: React.FC = () => {
  // Permission Mangement
  const { menus } = useSelector((state: RootState) => state.permission);
  const isDashboardEnable = checkPermission(menus, MenuOption.DASHBOARD);

  if (!isDashboardEnable) return <AccessRestricted />;
  return (
    <div className='flex items-center justify-center h-full'>
      <ComingSoon alt='comingSoon' />
    </div>
  );
};

export default HomePage;
