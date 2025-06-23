import React, { Suspense, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ProfileForm } from './profile-form';
import { SelectOption } from '../../../../consultant/types';
import {
  useCreateProfileDetails,
  useCreateProfilePermission,
  useGetProfileDetails,
  useManageUserProfile,
  useUpdateProfilePermission,
} from '../../../service';
import { useToast } from '../../../../hooks';
import { Privilege, ProfileDetail } from '../../../types';
import { ProfilePermissions } from './profile-permissions';
import { ProfileHeaderDetail } from './profile-header-details';
import { MANAGE_PROFILE } from '../../../../routes';
import { AccessRestricted } from '../../../../components/account-restricted';
import { useSelector } from 'react-redux';
import { checkPermission } from '../../../../common-utils';
import { RootState } from '../../../../store/store';
import { AllModules, AllPermissions } from '../../../../common-service';

export const CreateProfile: React.FC = () => {
  const [privileges, setPrivileges] = useState<Privilege[]>([]);
  const { profileId } = useParams();
  const { successToast, errorToast } = useToast();
  const navigate = useNavigate();

  const userProfiles = useManageUserProfile();
  const createProfile = useCreateProfileDetails();
  const createProfilePermission = useCreateProfilePermission();
  const getProfileDetails = useGetProfileDetails(profileId as string);
  const updateProfilePermission = useUpdateProfilePermission();

  const isEditView = Boolean(profileId);

  const editProfileName =
    userProfiles.data?.data.profiles.find(
      (profile) => profile.rid === getProfileDetails?.data?.data.profile_id
    )?.profile_name || '';

  const commonSuccess = createProfile.isSuccess;
  const ProfilePermissionSuccess = createProfilePermission.isSuccess;
  const editSuccess = updateProfilePermission.isSuccess;
  const [initialPrivileges, setInitialPrivileges] = useState<Privilege[]>([]);

  useEffect(() => {
    if (isEditView && getProfileDetails?.data?.data?.privileges) {
      setPrivileges(getProfileDetails.data.data.privileges);
      setInitialPrivileges(getProfileDetails.data.data.privileges);
    } else if (createProfile?.data?.data?.privileges) {
      setPrivileges(createProfile.data.data.privileges);
      setInitialPrivileges(createProfile.data.data.privileges);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [getProfileDetails?.data?.data, createProfile?.data?.data]);
  const { modules, permission } = useSelector(
    (state: RootState) => state.permission
  );
  const isProfileEnable = checkPermission(
    modules,
    AllModules.PROFILE_MANAGEMENT
  );
  const isProfileCreateEnable = checkPermission(
    permission,
    AllPermissions.PROFILE_CREATE
  );
  const isProfileEditEnable = checkPermission(
    permission,
    AllPermissions.PROFILE_EDIT
  );

  useEffect(() => {
    if (commonSuccess) {
      successToast('Profile created successfully');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [commonSuccess]);
  useEffect(() => {
    if (ProfilePermissionSuccess) {
      successToast('Profile permissions created successfully.');
      navigate(MANAGE_PROFILE);
    } else if (editSuccess) {
      successToast('Profile permissions updated successfully.');
      navigate(MANAGE_PROFILE);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ProfilePermissionSuccess, editSuccess]);

  const memoizeProfiles: SelectOption[] = useMemo(
    () =>
      userProfiles.data?.data.profiles.map((profile) => ({
        label: profile.profile_name,
        value: profile.rid,
      })) || [],
    [userProfiles.data?.data.profiles]
  );

  const handleSubmit = (data: {
    existingProfile: string;
    profileName: string;
    description: string;
  }) => {
    const constructData = {
      source_profile_id: data.existingProfile || null,
      profile_name: data.profileName,
      profile_description: data.description,
      profile_type: 'default',
    } as Partial<ProfileDetail>;
    createProfile.mutate(constructData);
  };

  const handlePrivilegesChange = (updatedPrivileges: Privilege[]) => {
    setPrivileges(updatedPrivileges);
  };
  const handleSaveProfile = () => {
    const hasChanges =
      JSON.stringify(privileges) !== JSON.stringify(initialPrivileges);

    if (!hasChanges) {
      errorToast('No modifications detected');
      return;
    }
    if (isEditView) {
      const payload = {
        profile_id: getProfileDetails.data?.data?.profile_id,
        profile_name: editProfileName,
        privileges: privileges,
      };
      updateProfilePermission.mutate(payload);
    } else {
      const payload = {
        profile_id: createProfile?.data?.data?.profile_id,
        profile_name: createProfile?.data?.data?.profile_name,
        privileges: privileges,
      };
      createProfilePermission.mutate(payload);
    }
  };

  if (
    !isProfileEnable ||
    (isEditView ? !isProfileEditEnable : !isProfileCreateEnable)
  )
    return <AccessRestricted />;

  return (
    <>
      {!commonSuccess && !isEditView ? (
        <div className='w-full h-full'>
          <ProfileForm
            profileOptions={memoizeProfiles}
            loading={createProfile.isPending}
            onSubmit={handleSubmit}
          />
        </div>
      ) : (
        <>
          <ProfileHeaderDetail
            profileHeaderData={
              !isEditView
                ? createProfile.data?.data
                : getProfileDetails.data?.data
            }
            onSave={handleSaveProfile}
            loading={
              createProfilePermission.isPending ||
              updateProfilePermission.isPending
            }
            isEditView={isEditView}
            profileLoading={getProfileDetails.isLoading}
          />
          <Suspense fallback={null}>
            <ProfilePermissions
              createProfilePermissionsData={
                isEditView
                  ? getProfileDetails?.data?.data.privileges
                  : createProfile?.data?.data.privileges
              }
              loading={getProfileDetails.isLoading}
              onPrivilegesChange={handlePrivilegesChange}
            />
          </Suspense>
        </>
      )}
    </>
  );
};

export default CreateProfile;
