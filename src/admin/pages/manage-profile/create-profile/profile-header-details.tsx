import React from 'react';
import TextButton from '../../../../components/button/text-button';
import { useManageUserProfile } from '../../../service';
import { ProfileHeaderData } from '../../../types';

interface ProfileHeaderProps {
  extendedPermission?: boolean;
  profileHeaderData?: ProfileHeaderData;
  onSave?: () => void;
  loading?: boolean;
  isEditView?: boolean;
}
export const ProfileHeaderDetail: React.FC<ProfileHeaderProps> = ({
  profileHeaderData,
  onSave,
  loading,
  isEditView,
  extendedPermission,
}) => {
  const userProfiles = useManageUserProfile();

  const editProfileName =
    userProfiles.data?.data.profiles.find(
      (profile) => profile.rid === profileHeaderData?.profile_id
    )?.profile_name || '';

  const sourceProfileName =
    userProfiles.data?.data.profiles.find(
      (profile) => profile.rid === profileHeaderData?.source_profile_id
    )?.profile_name || '';

  const goBack = () => {
    window.history.back();
  };
  return (
    <>
      <div className='px-4'>
        <div className='border border-[#CBD6E2] rounded-[4px]'>
          <div
            className={`flex justify-between items-center bg-[#FCFCFC] h-[38px] ${extendedPermission ? '' : 'border-b border-[#CBD6E2]'}`}
          >
            <div className='px-4 font-semibold text-[14px] leading-[32px] tracking-[0%] align-middle text-[#2D3E4F]'>
              {extendedPermission
                ? 'Assign permission to user'
                : isEditView
                  ? 'Edit Profile'
                  : 'Create Profile'}
            </div>
            <div className='flex gap-2 m-2'>
              <TextButton
                label='Save'
                loading={loading}
                onClick={onSave}
                sx={{
                  width: '64px',
                  minWidth: '64px',
                  fontWeight: 400,
                  fontSize: '13px',
                  height: '32px',
                }}
              />
              <TextButton
                label='Cancel'
                color='inherit'
                onClick={goBack}
                sx={{
                  width: '56px',
                  minWidth: '56px',
                  fontWeight: 400,
                  fontSize: '12px',
                  height: '32px',
                }}
              />
            </div>
          </div>
          {!extendedPermission && (
            <div className='flex items-center p-4'>
              {!isEditView && (
                <div className='flex gap-2 items-center'>
                  <div className='text-[14px] font-semibold text-[#65686F]'>
                    Exiting profile
                  </div>
                  <div className='text-[13px] font-normal text-[#2D3E4F] px-4'>
                    {sourceProfileName}
                  </div>
                </div>
              )}
              <div className='flex gap-2 items-center'>
                <div
                  className={`text-[14px] font-semibold text-[#65686F] ${isEditView ? 'pl-0' : 'pl-8'}`}
                >
                  Profile Name
                </div>
                <div className='text-[13px] font-normal text-[#2D3E4F] px-4'>
                  {isEditView
                    ? editProfileName
                    : profileHeaderData?.profile_name}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};
