import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { useToast } from '../../../../hooks';
import { useManageUserDetail } from '../../../../admin/service';
import { useSelector } from 'react-redux';
import { RootState } from '../../../../store/store';
import {
  AllPermissions,
  Layout,
  OnChange,
  useGetAllCountries,
} from '../../../../common-service';
import { FormData } from './form-data';
import { ManageUserIcon } from '../../../../assets';
import TextButton from '../../../../components/button/text-button';
import SkeletonForm from '../../../../components/form-builder/skeleton-form';
import { FormBuilder } from '../../../../components';
import { SelectOption } from '../../../types';
import { useGetResourceType } from '../../../services/resource-list';
import { useFetchState } from '../../../services/account';
import {
  useCreateCases,
  useUpdateCases,
} from '../../../services/cases/cases-form/case-form-service';
import { transFormPayload } from './utils';
import { caseformPayload } from '../../../types/cases-details';

const HEADER_STYLES = {
  adminPermission:
    'font-semibold text-[#7D98B6] text-[12px] leading-5 tracking-normal',
  manageUser: 'text-[16px] font-bold text-[#2D3E4F] -mt-0.5',
};

export const CreateCases: React.FC = () => {
  const formRef = React.useRef<HTMLFormElement>(null);

  const { successToast } = useToast();
  const location = useLocation();
  const { userid } = useParams();
  // const navigate = useNavigate();
  const [currentCountry, setCurrentCountry] = useState({
    country: '',
    state: '',
  });
  const userDetails = useManageUserDetail(userid as string);
  const resourceTypeOptions = useGetResourceType();
  const allCountries = useGetAllCountries();
  const states = useFetchState(currentCountry.country);
  const userData = userDetails.data?.data?.users;
  const userFullName =
    `${userData?.first_name || ''} ${userData?.last_name || ''}`.trim();

  const updatCases = useUpdateCases();
  const creatCases = useCreateCases();
  const commonSuccess = creatCases.isSuccess || updatCases.isSuccess;
  const isEditView = location.pathname.split('/').slice(-2, -1)[0] === 'edit';
  useEffect(() => {
    if (commonSuccess) {
      successToast(
        isEditView
          ? 'Project Task updated successfully'
          : 'Project Task created successfully'
      );
      goBack();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [commonSuccess, isEditView]);
  // Permission Mangement
  const { permission } = useSelector((state: RootState) => state.permission);

  const userViewEditFields = useMemo(
    () =>
      permission.find((item) => item.name === AllPermissions.USER_VIEW_EDIT)
        ?.fields ?? [],
    [permission]
  );

  const permissionMap = useMemo(() => {
    const map: Record<string, { read: boolean; edit: boolean }> = {};
    userViewEditFields.forEach((item) => {
      map[item.name] = { read: item.read ?? false, edit: item.edit ?? false };
    });
    return map;
  }, [userViewEditFields]);

  // Memoized Options

  const submitData = (formValues: Partial<caseformPayload>) => {
    const payload = transFormPayload(formValues);
    if (isEditView && userData) {
      updatCases.mutate(payload);
    } else {
      creatCases.mutate(payload);
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
  };

  const goBack = () => {
    window.history.back();
  };
  const memoizedResourceType: SelectOption[] = useMemo(
    () =>
      resourceTypeOptions?.data?.data?.resouceType.map((item) => ({
        label: item.resource_type_name,
        value: item.rid,
      })) || [],
    [resourceTypeOptions?.data?.data?.resouceType]
  );
  const memoizedCountry: SelectOption[] = useMemo(() => {
    const countries = allCountries.data?.data.country || [];
    return countries
      .slice()
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

  const formConfig = FormData(
    isEditView,
    permissionMap,
    memoizedResourceType,
    memoizedCountry,
    memoizedState,
    states.isLoading
  );

  const formLoading = userDetails.isLoading;

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
                : `Account > Certainti Account  ${isEditView ? ' > 50005003' : ''}  `}
            </div>
            <div className={HEADER_STYLES.manageUser}>
              {isEditView ? 'Edit Case' : 'New Case'}
            </div>
          </div>
        </div>
        <div className='flex gap-3'>
          <TextButton
            label='Save'
            // loading={updateUser.isPending || createUser.isPending}
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
                  }
                : {}
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

export default CreateCases;
