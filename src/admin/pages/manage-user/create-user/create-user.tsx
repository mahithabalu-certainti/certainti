import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { ManageUserIcon } from '../../../../assets/icons';
import {
  AllModules,
  AllPermissions,
  Layout,
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
import SkeletonForm from '../../../../components/form-builder/skeleton-form';

const HEADER_STYLES = {
  adminPermission:
    'font-semibold text-[#7D98B6] text-[12px] leading-5 tracking-normal',
  manageUser: 'text-[16px] font-bold text-[#2D3E4F] -mt-0.5',
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
  const userFullName =
    `${userDatas?.first_name || ''} ${userDatas?.last_name || ''}`.trim();

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
  // const isUserDeleteEnable = checkPermission(
  //   permission,
  //   AllPermissions.USER_DELETE
  // );

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

  const formConfig = FormData(
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
  );

  const formLoading =
    userDetails.isLoading ||
    userProfiles.isLoading ||
    allCountries.isLoading ||
    userRoles.isLoading;

  if (!userIsEnable || (isEditView ? !isUserEditEnable : !isUserCreateEnable))
    return <AccessRestricted />;

  return (
    <>
      {/* Header Section */}
      <div className='h-[50px] border-box flex items-center justify-between px-10 border-b-2 border-gray-200 sticky top-0 z-10 bg-white'>
        <div className='flex items-center gap-2 w-[80%] max-w-[80%]'>
          <img
            src={ManageUserIcon}
            alt='manage user'
            className='h-6 w-6 rounded'
          />
          <div className='w-[90%]'>
            <div className={HEADER_STYLES.adminPermission}>
              {isEditView
                ? `Admin Permission > ${userDatas?.full_name ?? userFullName}`
                : 'Admin Permission'}
            </div>
            <div className={HEADER_STYLES.manageUser}>
              {isEditView ? 'Edit User' : 'Create User'}
            </div>
          </div>
        </div>
        <div className='flex gap-3'>
          <TextButton
            label='Save'
            loading={updateUser.isPending || createUser.isPending}
            onClick={handleExternalSubmit}
            sx={{
              width: '64px',
              minWidth: '64px',
              fontSize: '13px',
              fontWeight: 400,
            }}
          />
          <TextButton
            label='Cancel'
            onClick={goBack}
            sx={{
              width: '75px',
              minWidth: '75px',
              fontSize: '12px',
              fontWeight: 400,
            }}
          />
        </div>
      </div>

      <div className={`${isEditView ? 'pb-10' : 'pb-4'}`}>
        {formLoading ? (
          <SkeletonForm />
        ) : (
          <FormBuilder
            loading={false}
            data={formConfig}
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
            layout={Layout.TYPE_1}
          />
        )}
      </div>
    </>
  );
};
