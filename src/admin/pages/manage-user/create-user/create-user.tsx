import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { ManageUserIcon } from '../../../../assets/icons';
import {
  OnChange,
  useGetAllCountries,
} from '../../../../common-service';
import { FormBuilder } from '../../../../components';
import TextButton from '../../../../components/button/text-button';
import {
  useFetchCity,
  useFetchState,
} from '../../../../consultant/services/account';
import { SelectOption } from '../../../../consultant/types';
import { useToast } from '../../../../hooks';
import { ADMIN_MANAGE_USER } from '../../../../routes';
import {
  useCreateUserDetails,
  useManageUserDetail,
  useManageUserProfile,
  useManageUserRole,
  useUpdateUserDetails,
} from '../../../service/manage-user/manage-user-service';
import { UserDetail, UserRole } from '../../../types/manage-user';
import { FormData } from './form-data';

export const CreateUser: React.FC = () => {
  const formRef = React.useRef<HTMLFormElement>(null);
  const [currentCountry, setCurrentCountry] = useState({
    country: '',
    state: '',
  });
  const { successToast } = useToast();
  const location = useLocation();
  const { userid } = useParams();
  const navigate = useNavigate();

  const userDetails = useManageUserDetail(userid as string);
  const userDatas = userDetails.data?.data?.users;

  const userProfiles = useManageUserProfile();
  const allCountries = useGetAllCountries();
  const userRoles = useManageUserRole();
  const states = useFetchState(currentCountry.country);
  const city = useFetchCity(currentCountry.state);
  const updateUser = useUpdateUserDetails();
  const createUser = useCreateUserDetails();

  const isEditView = location.pathname.split('/').slice(-2, -1)[0] === 'edit';

  const commonSuccess = updateUser.isSuccess || createUser.isSuccess;
  useEffect(() => {
    if (commonSuccess) {
      successToast(
        isEditView ? 'User update successfully' : 'User created successfully'
      );
      navigate(ADMIN_MANAGE_USER);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [commonSuccess, isEditView]);

  useEffect(() => {
    if (userDatas?.country || userDatas?.state) {
      setCurrentCountry((prev) => ({
        ...prev,
        country: userDatas?.country,
        state: userDatas?.state,
      }));
    }
  }, [userDatas?.country, userDatas?.state]);

  const memoizedCountry: SelectOption[] = useMemo(() => {
    const countries = allCountries.data?.data.country || [];
    return countries
      .slice() // create a shallow copy to avoid mutating original data
      .sort((a, b) => a.country_name.localeCompare(b.country_name))
      .map((country) => ({
        label: country.country_name,
        value: country.rid,
      }));
  }, [allCountries.data?.data.country]);

  const memoizedState: SelectOption[] = useMemo(
    () =>
      states.data?.data.states.map((role) => ({
        label: role.state_name,
        value: role.rid,
      })) || [],
    [states.data?.data.states]
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

  const memoizeCity: SelectOption[] = useMemo(
    () =>
      city.data?.data.cities.map((role) => ({
        label: role.city_name,
        value: role.rid,
      })) || [],
    [city.data?.data.cities]
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
      if (!constructData.phone) {
        delete constructData.phone;
      }
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
      if (!constructData.phone) {
        delete constructData.phone;
      }
      createUser.mutate(constructData);
    }
  };

  const handleExternalSubmit = () => {
    formRef.current?.requestSubmit(); // This will trigger the form's onSubmit
  };

  const onChangeField = ({ fieldName, fieldValue }: OnChange) => {
    if (fieldName === 'country' || fieldName === 'state') {
      setCurrentCountry((prev) => ({
        ...prev,
        [fieldName]: fieldValue as string,
      }));
    }
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
                memoizedCountry,
                memoizeProfiles,
                memoizeRole,
                memoizedState,
                memoizeCity,
                isEditView,
                states.isLoading,
                city.isLoading
              )}
              values={isEditView && userDatas ? { ...userDatas } : undefined}
              outData={submitData}
              formRef={formRef}
              onChange={onChangeField}
            />
          </div>
        </div>
      </div>
    </>
  );
};
