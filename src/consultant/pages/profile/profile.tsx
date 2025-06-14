import React from 'react';
import { useSelector } from 'react-redux';
import { useManageUserDetail } from '../../../admin/service/manage-user-detail/manage-user-detail-service';
import { AccountHomeIcon } from '../../../assets/icons';
import TextButton from '../../../components/button/text-button';
import { RootState } from '../../../store/store';
import { UserDetailComponent } from '../../../components';
import { AccessRestricted } from '../../../components/account-restricted';
import { checkPermission } from '../../../common-utils';
import { AllPermissions } from '../../../common-service';

export const Profile: React.FC = () => {
  const { userId } = useSelector((state: RootState) => state.auth);
  const userDetails = useManageUserDetail(userId as string);
  const userDatas = userDetails.data?.data?.users;

  // Permission Mangement
  const { permission } = useSelector((state: RootState) => state.permission);
  const isViewProfileEnable = checkPermission(
    permission,
    AllPermissions.PROFILE_VIEW
  );

  const goBack = () => {
    window.history.back();
  };

  if (!isViewProfileEnable) return <AccessRestricted />;

  return (
    <>
      <div className='flex justify-between items-center border-b-2 border-gray-200 px-10 py-6'>
        <div className='flex items-center'>
          <AccountHomeIcon className='h-10 w-10 bg-[#7D98B6] p-2.5 rounded' />
          <div>
            <h4 className='font-bold text-lg ml-2 leading-4'>My Information</h4>
          </div>
        </div>
        <div className='flex gap-3'>
          <TextButton
            label='Back'
            sx={{
              fontSize: '13px',
              fontWeight: '700',
              width: '49px',
            }}
            // variant='outlined'
            // color='inherit'
            onClick={goBack}
          />
        </div>
      </div>
      <div className='m-4 border border-gray-200'>
        <UserDetailComponent data={userDatas} loading={userDetails.isLoading} />
      </div>
    </>
  );
};

export default Profile;
