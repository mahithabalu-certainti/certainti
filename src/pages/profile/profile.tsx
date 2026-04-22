import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store/store';
import { AllPermissions } from '../../common-service';
import { checkPermission } from '../../common-utils';
import { AccessRestricted } from '../../components/account-restricted';
import { ProfileUserDetailComponent } from '../../components';
import TextButton from '../../components/button/text-button';
import { useManageUserDetail } from '../../admin/service/manage-user-detail/manage-user-detail-service';
import { AvatarIcon } from '../../assets';

export const Profile: React.FC = () => {
  const { userId } = useSelector((state: RootState) => state.auth);
  const userDetails = useManageUserDetail(userId as string);
  const userData = userDetails.data?.data?.users;
  const userDetail = userDetails.data?.data?.users;
  const userFullName =
    `${userDetail?.first_name || ''} ${userDetail?.last_name || ''}`.trim();

  // Permission Management
  const { permission } = useSelector((state: RootState) => state.permission);
  const isViewProfileEnable = checkPermission(
    permission,
    AllPermissions.PROFILE_VIEW_EDIT
  );

  const goBack = () => {
    window.history.back();
  };

  if (!isViewProfileEnable) return <AccessRestricted />;

  return (
    <div className='flex flex-col w-full overflow-y-auto p-4 gap-3'>
      <div className='w-full h-[55px] min-h-[50px] px-4 flex items-center justify-between border border-[#CBD6E2] rounded-[4px]'>
        <div className='flex items-center justify-center'>
          <React.Suspense fallback={null}>
            <AvatarIcon
              alt='avatar-user'
              className='h-8 w-8 bg-gray-300 p-1.5 rounded'
            />
          </React.Suspense>
          <div className='flex flex-col mx-2.5 pb-1'>
            <div className='font-semibold text-[#7D98B6] text-[12px] pt-1'>
              {`Profile > ${userDetail?.full_name ?? userFullName}`}
            </div>
            <div className='font-bold text-[16px] text-[#2D3E4F] -mt-1'>
              My Information
            </div>
          </div>
        </div>
        <div className='flex gap-2 items-center'>
          <TextButton
            label='Back'
            onClick={goBack}
            sx={{
              width: '49px',
              minWidth: '49px',
              fontWeight: 400,
              fontSize: '13px',
            }}
          />
        </div>
      </div>
      <ProfileUserDetailComponent
        data={userData}
        loading={userDetails.isLoading}
      />
    </div>
  );
};

export default Profile;
