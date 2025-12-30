import React from 'react';
import TextButton from '../../../../components/button/text-button';
import { useManageUserProfile } from '../../../service';
import { ProfileHeaderData } from '../../../types';
import { ManageProfileIcon } from '../../../../assets';
import { colorCode } from '../../../../consultant/types';

interface ProfileHeaderProps {
  extendedPermission?: boolean;
  userName?: string;
  profileHeaderData?: ProfileHeaderData;
  onSave?: () => void;
  loading?: boolean;
  isEditView?: boolean;
  viewProfileId?: string;
  viewProfile?: boolean;
  profileLoading?: boolean;
}
export const ProfileHeaderDetail: React.FC<ProfileHeaderProps> = ({
  profileHeaderData,
  onSave,
  loading,
  isEditView,
  extendedPermission,
  userName,
  viewProfileId,
  viewProfile,
  profileLoading,
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

  const viewProfileName =
    userProfiles.data?.data.profiles.find(
      (profile) => profile.rid === viewProfileId
    )?.profile_name || '';

  const goBack = () => {
    window.history.back();
  };
  return (
    <>
      <div className='h-[50px] border-box flex items-center justify-between px-10 border-b-2 border-gray-200 sticky top-0 z-10 bg-white'>
        <div className='flex items-center gap-2 w-[80%] max-w-[80%]'>
        <ManageProfileIcon
           alt='manage-profile' 
          className={`h-7 w-7 p-1.5 rounded [&>path]:stroke-[${colorCode.manageAccountTextColor}] bg-[${colorCode.manageAccountBgcolor}]`}
          />
          <div className='w-[90%]'>
            <div className='font-medium text-[#7D98B6] text-[11px] leading-5 tracking-normal'>
              {`Admin Permission > Manage Profile ${editProfileName ? `> ${editProfileName}` : ''}`}
            </div>
            <div className='text-[16px] font-bold text-[#2D3E4F] -mt-0.5'>
              {extendedPermission
                ? userName
                  ? `Assign permission to ${userName}`
                  : 'Assign permission'
                : isEditView
                  ? 'Edit Profile'
                  : viewProfile
                    ? 'View Profile'
                    : 'Create Profile'}
            </div>
          </div>
        </div>
        <div className='flex gap-3'>
          {!viewProfile && (
            <div className='flex gap-2'>
              <TextButton
                label='Save'
                loading={loading}
                onClick={onSave}
                sx={{
                  width: '64px',
                  minWidth: '64px',
                  fontWeight: 400,
                  fontSize: '13px',
                }}
              />
              <TextButton
                label='Cancel'
                color='inherit'
                onClick={goBack}
                sx={{
                  width: '75px',
                  minWidth: '75px',
                  fontSize: '12px',
                  fontWeight: 400,
                }}
              />
            </div>
          )}
        </div>
      </div>
      {!profileLoading && !extendedPermission && (
        <div className='px-10 py-2'>
          <div className='border border-[#CBD6E2] rounded-[4px]'>
            <div className='flex items-center p-4'>
              {!isEditView && !viewProfile && (
                <>
                  <div className='flex gap-2 items-center'>
                    <div className='text-[14px] font-bold text-[#65686F]'>
                      Exiting profile:
                    </div>
                    <div className='text-[13px] font-normal text-[#2D3E4F] pl-0 pr-5'>
                      {sourceProfileName || 'Exiting profile'}
                    </div>
                  </div>
                </>
              )}
              <div className='flex gap-2 items-center'>
                <div
                  className={`text-[14px] font-bold text-[#65686F] ${isEditView || viewProfile ? 'pl-0' : 'pl-8'}`}
                >
                  Profile Name:
                </div>
                <div className='text-[13px] font-normal text-[#2D3E4F] pl-0 pr-4'>
                  {isEditView
                    ? editProfileName
                    : viewProfile
                      ? viewProfileName
                      : profileHeaderData?.profile_name}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
