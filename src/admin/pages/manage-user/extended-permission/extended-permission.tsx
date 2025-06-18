import { useNavigate, useParams } from 'react-router-dom';
import { ManageUserIcon } from '../../../../assets/icons';
import TextButton from '../../../../components/button/text-button';
import {
  useExtendedPermissionToUser,
  useUpdateExtendedPermission,
} from '../../../service';
import { ProfileHeaderDetail, ProfilePermissions } from '../../manage-profile';
import { Skeleton } from '@mui/material';
import { Privilege } from '../../../types';
import { useEffect, useState } from 'react';
import { useToast } from '../../../../hooks';
import { ADMIN_MANAGE_USER } from '../../../../routes';

const HEADER_STYLES = {
  adminPermission:
    'font-medium text-[#7D98B6] text-[11px] leading-5 tracking-normal',
  manageProfile:
    'font-semibold text-[20px] text-[#2D3E4F] leading-5 tracking-normal',
};

export const ExtendedPermission: React.FC = () => {
  const [privileges, setPrivileges] = useState<Privilege[]>([]);
  const { userid } = useParams();
  const { successToast } = useToast();
  const navigate = useNavigate();
  const { data, isPending } = useExtendedPermissionToUser(userid as string);
  const updateExtendedPermission = useUpdateExtendedPermission();

  const goBack = () => {
    window.history.back();
  };
  const handlePrivilegesChange = (updatedPrivileges: Privilege[]) => {
    setPrivileges(updatedPrivileges);
  };
 
  const handleSaveProfile = () => {
    const payload = {
      user_id: data?.data.user_id,
      privileges,
    };
    updateExtendedPermission.mutate(payload);
  };

  useEffect(() => {
    if (updateExtendedPermission.isSuccess) {
      successToast('User permissions updated successfully.');
      navigate(ADMIN_MANAGE_USER);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [updateExtendedPermission.isSuccess]);

  return (
    <>
      <div className='flex flex-col gap-3'>
        {/* Header Section */}
        <div className='w-full min-h-[50px] h-[50px] px-4 flex items-center justify-between border-b-1 border-[#CBD6E2]'>
          <div className='flex items-center gap-2'>
            <ManageUserIcon
              alt='manage user'
              className='w-8 h-8 rounded'
            />
            <div className='flex flex-col mb-1'>
              <div className={HEADER_STYLES.adminPermission}>
                Admin Permission
              </div>
              <div className={HEADER_STYLES.manageProfile}>Manage User</div>
            </div>
          </div>
          <div className='flex items-center gap-2'>
            <TextButton
              label='Back'
              onClick={goBack}
              sx={{
                width: '45px',
                minWidth: '45px',
                fontWeight: 700,
                fontSize: '13px',
                height: '20px',
              }}
            />
          </div>
        </div>
        <ProfileHeaderDetail
          extendedPermission
          userName={data?.data.user_name}
          onSave={handleSaveProfile}
          loading={updateExtendedPermission.isPending}
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
              createProfilePermissionsData={data?.data.permissions}
              onPrivilegesChange={handlePrivilegesChange}
            />
          )}
        </div>
      </div>
    </>
  );
};
export default ExtendedPermission;