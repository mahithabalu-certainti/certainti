import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { ManageUserIcon } from '../../../../assets/icons';
import {
  AllPermissions,
  Layout,
  OnChange,
  useGetAllCountries,
  useGetStatus,
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
import { UserDetail } from '../../../types/manage-user';
import { FormData } from './form-data';
import { useSelector } from 'react-redux';
import { RootState } from '../../../../store/store';
import SkeletonForm from '../../../../components/form-builder/skeleton-form';
import { transFormPayload } from './utils';

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
  const userData = userDetails.data?.data?.users;
  const userFullName =
    `${userData?.first_name || ''} ${userData?.last_name || ''}`.trim();

  const statusOptions = useGetStatus();
  const userProfiles = useManageUserProfile();
  const allCountries = useGetAllCountries();
  const userRoles = useManageUserRole();
  const states = useFetchState(currentCountry.country);
  const city = useFetchCity(currentCountry.state);
  const orgName = useFetchOrgNames();
  const updateUser = useUpdateUserDetails();
  const createUser = useCreateUserDetails();

  // Permission Mangement
  const { permission } = useSelector(
    (state: RootState) => state.permission
  );

  const userViewEditFields = useMemo(
    () =>
      permission.find((item) => item.name === AllPermissions.USER_VIEW_EDIT)
        ?.fields ?? [],
    [permission]
  );

  // const isUserEditEnable = checkPermission(
  //   permission,
  //   AllPermissions.USER_EDIT_UPDATE
  // );
  // const isUserActivateEnable = checkPermission(
  //   permission,
  //   AllPermissions.USER_ACTIVATE
  // );
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
    if (userData && isEditView) {
      setIsConsultantFirm((prev) => ({
        ...prev,
        isConsultantFirm: userData?.is_consultant_firm ? YesNo.Yes : YesNo.No,
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditView, userData?.is_consultant_firm]);

  useEffect(() => {
    if (userData?.country_rid || userData?.region_rid) {
      setCurrentCountry((prev) => ({
        ...prev,
        country: userData?.country_rid || '',
        state: userData?.region_rid || '',
      }));
    }
  }, [userData?.country_rid, userData?.region_rid]);

  const permissionMap = useMemo(() => {
    const map: Record<string, { read: boolean; edit: boolean }> = {};
    userViewEditFields.forEach((item) => {
      map[item.name] = { read: item.read ?? false, edit: item.edit ?? false };
    });
    return map;
  }, [userViewEditFields]);

  // Memoized Options
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

  const memoizedStatus: SelectOption[] = useMemo(
    () =>
      statusOptions?.data?.data?.status.map((status) => ({
        label: status.status_name,
        value: status.rid,
      })) || [],
    [statusOptions?.data?.data?.status]
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
    const payload = transFormPayload(
      data,
      isEditView,
      userData,
      isConsultantFirm.isConsultantFirm
    );

    if (isEditView && userData) {
      updateUser.mutate(payload);
    } else {
      createUser.mutate(payload);
    }
  };

  const handleExternalSubmit = () => {
    formRef.current?.requestSubmit(); // This will trigger the form's onSubmit
  };

  const onChangeField = ({ fieldName, fieldValue }: OnChange) => {
    if (fieldName === 'country_rid') {
      setCurrentCountry({
        country: fieldValue as string,
        state: '',
      });
    }
    if (fieldName === 'region_rid') {
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
    memoizedStatus,
    memoizedCountry,
    memoizeProfiles,
    memoizeRole,
    memoizedState,
    memoizeCity,
    memoizeOrgNames,
    isEditView,
    states.isLoading,
    city.isLoading,
    // isEditView ? !isUserActivateEnable : false,
    isConsultantFirm.isConsultantFirm,
    isConsultantFirm.org_id,
    permissionMap
  );

  const formLoading =
    userDetails.isLoading ||
    userProfiles.isLoading ||
    allCountries.isLoading ||
    statusOptions.isLoading ||
    userRoles.isLoading;


  return (
    <>
      {/* Header Section */}
      <div className='h-[50px] border-box flex items-center justify-between px-10 border-b-2 border-gray-200 sticky top-0 z-10 bg-white'>
        <div className='flex items-center gap-2 w-[80%] max-w-[80%]'>
          <ManageUserIcon alt='manage user' className='h-6 w-6 rounded' />
          <div className='w-[90%]'>
            <div className={HEADER_STYLES.adminPermission}>
              {isEditView
                ? `Admin Permission > Manage User${(userData?.full_name ?? userFullName) ? ` > ${userData?.full_name ?? userFullName}` : ''}`
                : 'Admin Permission > Manage User'}
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
              isEditView && userData
                ? {
                    ...userData,
                    status: userData?.status_rid,
                    is_consultant_firm:
                      userData?.is_consultant_firm === true
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

export default CreateUser;
