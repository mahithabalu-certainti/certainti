import React, { useEffect, useMemo } from 'react';
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
import { ProfileDetail } from '../../../types';
import { ProfileHeaderDetail } from './profile-header-details';
import { MANAGE_PROFILE } from '../../../../routes';
import {
  ManageProfileResponse,
  ProfileResponse,
} from '../../../../common-service';
import { ProfilePermissionForm } from './profile-permission-form';

export const CreateProfile: React.FC = () => {
  const formRef = React.useRef<HTMLFormElement>(null);
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

  const handleSaveProfile = () => {
    formRef.current?.requestSubmit(); // This will trigger the form's onSubmit
  };

  const outData = (data: ProfileResponse[]) => {
    if (data.length === 0) {
      errorToast('No modifications detected');
    } else {
      if (isEditView) {
        const payload = {
          profile_id: getProfileDetails.data?.data?.profile_id,
          profile_name: editProfileName,
          privileges: data,
        };
        updateProfilePermission.mutate(payload as ManageProfileResponse);
      } else {
        const payload = {
          profile_id: createProfile?.data?.data?.profile_id,
          profile_name: createProfile?.data?.data?.profile_name,
          privileges: data,
        };
        createProfilePermission.mutate(payload as ManageProfileResponse);
      }
    }
  };

  const formData = isEditView
    ? getProfileDetails.data?.data.privileges || []
    : createProfile.data?.data.privileges || [];

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
          <ProfilePermissionForm
            formData={formData}
            loading={getProfileDetails.isLoading}
            formRef={formRef}
            outData={outData}
            oldData={JSON.parse(JSON.stringify(formData))}
          />
        </>
      )}
    </>
  );
};

export default CreateProfile;
