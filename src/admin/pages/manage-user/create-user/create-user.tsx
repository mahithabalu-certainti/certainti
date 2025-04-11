import React, { useEffect, useMemo } from 'react';
import { ManageUserIcon } from '../../../../assets/icons';
import { FormBuilder } from '../../../../components';
import { useToast } from '../../../../hooks';
import { FormData } from './form-data';
import TextButton from '../../../../components/button/text-button';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useGetAllCountries } from '../../../../common-service';
import { UserDetail, UserRole } from '../../../types/manage-user';
import {
  useCreateUserDetails,
  useManageUserDetail,
  useManageUserProfile,
  useManageUserRole,
  useUpdateUserDetails,
} from '../../../service/manage-user/manage-user-service';
import { SelectOption } from '../../../../consultant/types';
import { ADMIN_MANAGE_USER } from '../../../../routes';

export const CreateUser: React.FC = () => {
  const formRef = React.useRef<HTMLFormElement>(null);
  const { successToast, errorToast } = useToast();
  const location = useLocation();
  const { userid } = useParams();
  const navigate = useNavigate();

  const userDetails = useManageUserDetail(userid as string);
  const userDatas = userDetails.data?.data?.users[0];

  const userProfiles = useManageUserProfile();
  const allCountries = useGetAllCountries();
  const userRoles = useManageUserRole();
  const updateUser = useUpdateUserDetails();
  const createUser = useCreateUserDetails();

  const isEditView = location.pathname.split('/').slice(-2, -1)[0] === 'edit';

  useEffect(() => {
    // Hook Error Handling
    if (
      userDetails.isError ||
      userProfiles.isError ||
      userRoles.isError ||
      allCountries.isError ||
      updateUser.isError ||
      createUser.isError
    ) {
      errorToast(
        userDetails.error?.message ||
          userProfiles.error?.message ||
          userRoles.error?.message ||
          allCountries.error?.message ||
          updateUser.error?.message ||
          createUser.error?.message ||
          'An error occurred'
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    userDetails.isError,
    userDetails.error?.message,
    userProfiles.isError,
    userProfiles.error?.message,
    userRoles.isError,
    userRoles.error?.message,
    allCountries.isError,
    allCountries.error?.message,
    updateUser.isError,
    updateUser.error?.message,
    createUser.isError,
    createUser.error?.message,
  ]);

  useEffect(() => {
    if (updateUser.isSuccess || createUser.isSuccess) {
      successToast(
        isEditView ? 'User update successfully' : 'User created successfully'
      );
      navigate(ADMIN_MANAGE_USER);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [updateUser.isSuccess, createUser.isSuccess]);

  const memoizedContry: SelectOption[] = useMemo(
    () =>
      allCountries.data?.data.country.map((country) => ({
        label: country.country_name,
        value: country.rid,
      })) || [],
    [allCountries.data?.data.country]
  );

  const memoizeProfiles: SelectOption[] = useMemo(
    () =>
      userProfiles.data?.data.profiles.map((profile) => ({
        label: profile.profile_name,
        value: profile.rid,
      })) || [],
    [userProfiles.data?.data.profiles]
  );

  const memoizeRole: SelectOption[] = useMemo(
    () =>
      userRoles.data?.data.roles.map((role) => ({
        label: role.business_teams,
        value: role.rid,
      })) || [],
    [userRoles.data?.data.roles]
  );

  const submitData = (data: Partial<UserDetail>) => {
    if (isEditView) {
      const constructData = {
        ...data,
        role: data?.role_rid,
        rid: userDatas?.rid,
        azure_id: userDatas?.azure_id,
        updated_by: UserRole.Admin,
        profile_id: data.profile_rid,
      } as Partial<UserDetail>;
      delete constructData.profile_rid;
      delete constructData.email;
      delete constructData.role_rid;
      updateUser.mutate(constructData);
    } else {
      const constructData = {
        ...data,
        role: data.role_rid,
        profile_id: data.profile_rid,
        created_by: UserRole.Admin,
      } as Partial<UserDetail>;
      delete constructData.profile_rid;
      delete constructData.role_rid;
      createUser.mutate(constructData);
    }
  };

  const handleExternalSubmit = () => {
    formRef.current?.requestSubmit(); // This will trigger the form's onSubmit
  };

  const goBack = () => {
    window.history.back();
  };

  return (
    <>
      <div className='flex flex-col p-4 gap-3'>
        {/* Header Section */}
        <div className='flex h-[12%] w-full p-4 items-center justify-between border border-gray-300 rounded'>
          <div className='flex items-center gap-2'>
            <img src={ManageUserIcon} alt='manage user' />
            <div className='flex flex-col'>
              <div className='font-semibold text-[#7D98B6] text-xs'>
                Admin Permission
              </div>
              <div className='font-semibold text-2xl'>Manage User</div>
            </div>
          </div>
          <div className='flex gap-2 items-center'>
            <TextButton
              label='Back'
              variant='outlined'
              color='inherit'
              onClick={goBack}
            />
          </div>
        </div>

        <div className='border border-gray-300 rounded'>
          <div className='flex justify-between items-center border-b border-gray-300 p-4'>
            <div className='font-semibold text-xl'>
              {isEditView ? 'Edit User' : 'Create User'}
            </div>
            <div className='flex gap-2 m-2'>
              <TextButton
                label='Cancel'
                variant='outlined'
                color='inherit'
                onClick={goBack}
              />
              <TextButton
                label='Save'
                variant='filled'
                loading={updateUser.isPending || createUser.isPending}
                onClick={handleExternalSubmit}
              />
              {isEditView && <TextButton label='Delete' variant='outlined' />}
            </div>
          </div>
          <div className='p-5'>
            <FormBuilder
              loading={
                userProfiles.isLoading ||
                allCountries.isLoading ||
                userRoles.isLoading
              }
              data={FormData(
                memoizedContry,
                memoizeProfiles,
                memoizeRole,
                isEditView
              )}
              values={isEditView && userDatas ? { ...userDatas } : undefined}
              outData={submitData}
              formRef={formRef}
            />
          </div>
        </div>
      </div>
    </>
  );
};
