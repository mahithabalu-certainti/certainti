import { useNavigate, useParams } from 'react-router-dom';
import { ProfileIcon } from '../../../../assets/icons';
import TextButton from '../../../../components/button/text-button';
import { useGetProfileDetails } from '../../../service';
import { ProfileHeaderDetail, ProfilePermissions } from '../../manage-profile';
import { Skeleton } from '@mui/material';
import { Privilege } from '../../../types';
import { useEffect, useState } from 'react';
import { useToast } from '../../../../hooks';
import { MANAGE_PROFILE } from '../../../../routes';

const HEADER_STYLES = {
  adminPermission:
    'font-medium text-[#7D98B6] text-[11px] leading-5 tracking-normal',
  manageProfile:
    'font-semibold text-[20px] text-[#2D3E4F] leading-5 tracking-normal',
};

export const ViewProfile: React.FC = () => {
  const [, setPrivileges] = useState<Privilege[]>([]);
  const { profileId } = useParams();
  const { successToast } = useToast();
  const navigate = useNavigate();
  const { data, isPending, isSuccess } = useGetProfileDetails(
    profileId as string
  );

  const goBack = () => {
    window.history.back();
  };
  const handlePrivilegesChange = (updatedPrivileges: Privilege[]) => {
    setPrivileges(updatedPrivileges);
  };
  const handleEditProfile = () => {
    navigate(MANAGE_PROFILE + '/edit/' + data?.data.profile_id, {
      state: { user: data },
    });
  };

  useEffect(() => {
    if (isSuccess) {
      successToast('Profile fetched successfully');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSuccess]);

  return (
    <>
      <div className='flex flex-col gap-3'>
        {/* Header Section */}
        <div className='w-full min-h-[50px] h-[50px] px-4 flex items-center justify-between border-b-1 border-[#CBD6E2]'>
          <div className='flex items-center gap-2'>
            <ProfileIcon alt='create profile' className='h-8 w-8 rounded' />
            <div className='flex flex-col mb-1'>
              <div className={HEADER_STYLES.adminPermission}>
                Admin Permission
              </div>
              <div className={HEADER_STYLES.manageProfile}>Manage Profile</div>
            </div>
          </div>
          <div className='flex gap-2 items-center'>
            <TextButton
              label='Back'
              onClick={goBack}
              sx={{
                width: '64px',
                minWidth: '64px',
                fontWeight: 400,
                fontSize: '13px',
                height: '32px',
              }}
            />
          </div>
        </div>
        <ProfileHeaderDetail
          viewProfile
          viewProfileId={data?.data.profile_id}
          onSave={handleEditProfile}
          loading={isPending}
        />
        <div className='pb-2'>
          {isPending ? (
            <div className='px-4 py-1'>
              {[...Array(20)].map((_, index) => (
                <Skeleton
                  variant='rounded'
                  key={index}
                  className='mb-1'
                  height={28}
                />
              ))}
            </div>
          ) : (
            <ProfilePermissions
              createProfilePermissionsData={data?.data.privileges}
              onPrivilegesChange={handlePrivilegesChange}
              viewProfileDisabled
            />
          )}
        </div>
      </div>
    </>
  );
};

export default ViewProfile;
