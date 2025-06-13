import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { ManageUserIcon } from '../../../../assets/icons';
import {
  AllModules,
  AllPermissions,
  OnChange,
  useGetAllCountries,
} from '../../../../common-service';
import { FormBuilder } from '../../../../components';
import TextButton from '../../../../components/button/text-button';
import {
  useFetchCity,
  useFetchState,
} from '../../../../consultant/services/account';
import { SelectOption, YesNo } from '../../../../consultant/types';
import { useToast } from '../../../../hooks';
import { ADMIN_MANAGE_USER } from '../../../../routes';
import {
  useCreateUserDetails,
  useFetchOrgNames,
  useManageUserDetail,
  useManageUserProfile,
  useManageUserRole,
  useUpdateUserDetails,
} from '../../../service/manage-user/manage-user-service';
import { UserDetail, UserRole } from '../../../types/manage-user';
import { FormData } from './form-data';
import { useSelector } from 'react-redux';
import { RootState } from '../../../../store/store';
import { checkPermission } from '../../../../common-utils';
import { AccessRestricted } from '../../../../components/account-restricted';

const HEADER_STYLES = {
  adminPermission:
    'font-semibold text-[#7D98B6] text-[12px] leading-5 tracking-normal',
  manageUser: 'font-bold text-[16px] text-[#2D3E4F] leading-5 tracking-normal',
};

export const CreateUser: React.FC = () => {
  const formRef = React.useRef<HTMLFormElement>(null);
  const [currentCountry, setCurrentCountry] = useState({
    country: '',
    state: '',
  });
  const [isConsultantFirm, setIsConsultantFirm] = useState({
    isConsultantFirm: '',
    org_id: '',
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
  const orgName = useFetchOrgNames();
  const updateUser = useUpdateUserDetails();
  const createUser = useCreateUserDetails();

  // Permission Mangement
  const { modules, permission } = useSelector(
    (state: RootState) => state.permission
  );
  const userIsEnable = checkPermission(modules, AllModules.USER_MANAGEMENT);
  const isUserCreateEnable = checkPermission(
    permission,
    AllPermissions.USER_CREATE
  );
  const isUserEditEnable = checkPermission(
    permission,
    AllPermissions.USER_EDIT_UPDATE
  );
  const isUserActivateEnable = checkPermission(
    permission,
    AllPermissions.USER_ACTIVATE
  );
  const isUserDeleteEnable = checkPermission(
    permission,
    AllPermissions.USER_DELETE
  );

  const isEditView = location.pathname.split('/').slice(-2, -1)[0] === 'edit';
  const commonSuccess = updateUser.isSuccess || createUser.isSuccess;
  useEffect(() => {
    if (commonSuccess) {
      successToast(
        isEditView ? 'User updated successfully' : 'User created successfully'
      );
      navigate(ADMIN_MANAGE_USER);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [commonSuccess, isEditView]);

  useEffect(() => {
    if (userDatas && isEditView) {
      setIsConsultantFirm((prev) => ({
        ...prev,
        isConsultantFirm: userDatas?.is_consultant_firm ? YesNo.Yes : YesNo.No,
      }));
    }
  }, [userDatas?.is_consultant_firm]);

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
  const memoizeOrgNames: SelectOption[] = useMemo(() => {
    let orgNameOptions: SelectOption[] = [];
    if (
      isConsultantFirm.isConsultantFirm === YesNo.No &&
      orgName.data?.data?.accountData
    ) {
      orgNameOptions = orgName.data?.data?.accountData.map((org) => ({
        label: org.organisation_name,
        value: org.rid,
      }));
    } else if (
      isConsultantFirm.isConsultantFirm === YesNo.Yes &&
      orgName.data?.data?.orgData
    ) {
      orgNameOptions = [
        {
          label: orgName.data?.data?.orgData?.firm_name,
          value: orgName.data?.data?.orgData?.firm_name, // You might want a unique ID here if available
        },
      ];
    }
    return orgNameOptions;
  }, [isConsultantFirm.isConsultantFirm, orgName.data?.data]);

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
    if (isEditView && userDatas) {
      const constructData = {
        ...data,
        role: data?.role_rid,
        rid: userDatas?.rid,
        azure_id: userDatas?.azure_id,
        profile_id: data.profile_rid,
        country: data.country || null,
        is_consultant_firm:
          isConsultantFirm.isConsultantFirm === YesNo.Yes ? true : false,
        org_id: data.org_id,
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
        country: data.country || null,
        role: data.role_rid,
        profile_id: data.profile_rid,
        created_by: UserRole.Admin,
        is_consultant_firm:
          isConsultantFirm.isConsultantFirm === YesNo.Yes ? true : false,
        org_id: data.org_id,
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
    if (fieldName === 'country') {
      setCurrentCountry({
        country: fieldValue as string,
        state: '',
      });
    }
    if (fieldName === 'state') {
      setCurrentCountry((prev) => ({
        ...prev,
        state: fieldValue as string,
      }));
    }
    if (fieldName === 'is_consultant_firm') {
      setIsConsultantFirm({
        isConsultantFirm: fieldValue as string,
        org_id: '',
      });
    }
  };

  const goBack = () => {
    window.history.back();
  };

  if (!userIsEnable || (isEditView ? !isUserEditEnable : !isUserCreateEnable))
    return <AccessRestricted />;

  return (
    <>
      <div className='flex flex-col gap-3'>
        {/* Header Section */}
        <div className='w-full min-h-[50px] h-[50px] border-box py-1 px-4 flex items-center justify-between border border-[#CBD6E2] rounded-[4px]'>
          <div className='flex items-center gap-3'>
            <img
              src={ManageUserIcon}
              alt='manage user'
              className='h-6 w-6 rounded'
            />
            <div className='flex flex-col mb-1'>
              <div className={HEADER_STYLES.adminPermission}>
                Admin Permissions
              </div>
              <div className={HEADER_STYLES.manageUser}>Manage User</div>
            </div>
          </div>
          <div className='flex gap-2 items-center'>
            <TextButton
              label='Back'
              onClick={goBack}
              sx={{
                width: '49px',
                minWidth: '49px',
                fontWeight: 700,
                fontSize: '13px',
                height: '32px',
              }}
            />
          </div>
        </div>
        <div className='p-4'>
          <div className='border border-[#CBD6E2] rounded-[4px]'>
            <div className='flex justify-between items-center bg-[#FCFCFC] border-b border-[#CBD6E2] h-[38px] pl-4 pr-1'>
              <div className='font-semibold text-base leading-[32px] tracking-[0%] align-middle text-[#2D3E4F]'>
                {isEditView ? 'Edit User' : 'Create User'}
              </div>
              <div className='flex gap-2'>
                <TextButton
                  label='Save'
                  loading={updateUser.isPending || createUser.isPending}
                  onClick={handleExternalSubmit}
                  sx={{
                    width: '64px',
                    minWidth: '64px',
                    fontWeight: 400,
                    fontSize: '13px',
                  }}
                />
                {isEditView && isUserDeleteEnable && (
                  <TextButton
                    label='Delete'
                    sx={{
                      width: '75px',
                      minWidth: '75px',
                      fontWeight: 400,
                      fontSize: '13px',
                    }}
                  />
                )}
                <TextButton
                  label='Cancel'
                  onClick={goBack}
                  sx={{
                    width: '75px',
                    minWidth: '75px',
                    fontWeight: 400,
                    fontSize: '13px',
                  }}
                />
              </div>
            </div>
            <FormBuilder
              loading={
                userDetails.isLoading ||
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
                memoizeOrgNames,
                isEditView,
                states.isLoading,
                city.isLoading,
                isEditView ? !isUserActivateEnable : false,
                isConsultantFirm.isConsultantFirm,
                isConsultantFirm.org_id
              )}
              values={
                isEditView && userDatas
                  ? {
                      ...userDatas,
                      is_consultant_firm:
                        userDatas?.is_consultant_firm === true
                          ? YesNo.Yes
                          : YesNo.No,
                    }
                  : //   ? { org_id: isConsultantFirm === 'yes' ? memoizeOrgNames[0].value : '' }
                    {}
              }
              outData={submitData}
              formRef={formRef}
              onChange={onChangeField}
              admin={true}
            />
          </div>
        </div>
      </div>
    </>
  );
};
