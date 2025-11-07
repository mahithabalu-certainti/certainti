import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useParams, useSearchParams } from 'react-router-dom';
import { useToast } from '../../../../hooks';
import { useManageUserList } from '../../../../admin/service';
import {
  AllPermissions,
  Layout,
  OnChange,
  useGetAllCountries,
} from '../../../../common-service';
import { CaseFormData } from './form-data';
import TextButton from '../../../../components/button/text-button';
import SkeletonForm from '../../../../components/form-builder/skeleton-form';
import { FormBuilder } from '../../../../components';
import { CaseFormPayload } from '../../../types';
import {
  useCaseDetails,
  useCreateCase,
  useGetCaseFilingTypes,
  useUpdateCaseDetails,
} from '../../../services/cases/case-service';
import { CaseIcon } from '../../../../assets';
import SingleSkeleton from '../../../../components/skeleton-component/singleskeleton';
import {
  formatDateToYYYYMMDDWithTime,
  getDateFormatYYYYMMDD,
} from '../../../../common-utils';
import { generateCaseNamePrefix, transformCaseFormPayload } from './utils';
import { useSelector } from 'react-redux';
import { RootState } from '../../../../store/store';

export const CreateCases: React.FC = () => {
  const formRef = React.useRef<HTMLFormElement>(null);

  const { successToast } = useToast();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const { caseId } = useParams();
  const [caseNamePrefix, setCaseNamePrefix] = useState<string>('');
  const [dateConstraints, setDateConstraints] = useState<{
    planned_min: string;
    planned_max: string;
    statutory_min: string;
    statutory_max: string;
  }>({
    planned_min: '',
    planned_max: '',
    statutory_min: '',
    statutory_max: '',
  });

  const { userId } = useSelector<RootState, { userId: unknown }>(
    (state: RootState) => state.auth
  );
  const { permission } = useSelector((state: RootState) => state.permission);

  const currentYear = new Date().getFullYear();
  const isEditView = location.pathname.split('/').slice(-2, -1)[0] === 'edit';
  const accountId = searchParams.get('accountId') || '';
  const accountNumber = searchParams.get('account_number') || '';
  const accountName = searchParams.get('account_name') || '';
  const sourcePath = searchParams.get('source') || '';
  const countryRid = searchParams.get('country_rid') || '';
  const countryCode = searchParams.get('country_code') || '';

  // User List Api
  const { data: userListData, isLoading: userListLoading } = useManageUserList({
    page: 1,
    limit: 2000,
    sortBy: 'first_name',
    sortOrder: 'ASC',
  });

  const { data: caseData, isLoading } = useCaseDetails(caseId || '', accountId);

  const updateCase = useUpdateCaseDetails();
  const createCase = useCreateCase();
  const caseFillingTypes = useGetCaseFilingTypes();
  const allCountries = useGetAllCountries();

  const commonSuccess = createCase.isSuccess || updateCase.isSuccess;

  useEffect(() => {
    if (commonSuccess) {
      successToast(
        isEditView ? 'Case updated successfully' : 'Case created successfully'
      );
      goBack();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [commonSuccess, isEditView]);

  const caseFormData = useMemo(
    () => ({
      ...caseData,
      ...(caseData && {
        account_name: accountName || caseData.account_name || '',
        account_id: accountNumber || caseData.account_rnumber || '',
        filing_type: caseData.filing_type_rid || '',
        case_name: caseData.case_name || '',
        case_owner: caseData.case_owner_rid || '',
        fiscal_year: caseData.fiscal_year || '',
        country: caseData.country_rid || countryRid || '',
        case_startdate: caseData.case_startdate
          ? getDateFormatYYYYMMDD(caseData.case_startdate)
          : '',
        planned_submission_date: caseData.planned_submission_date
          ? getDateFormatYYYYMMDD(caseData.planned_submission_date)
          : '',
        statutory_submission_date: caseData.statutory_submission_date
          ? getDateFormatYYYYMMDD(caseData.statutory_submission_date)
          : '',
        description: caseData.description || '',
        record_id: caseData.rid || '',
        created_on: formatDateToYYYYMMDDWithTime(caseData.created_datetime),
        created_by: caseData.created_by_name || '',
        case_id: caseData.r_number || '',
        updated_on: caseData.modified_datetime
          ? formatDateToYYYYMMDDWithTime(caseData.modified_datetime)
          : '-',
        updated_by: caseData.modified_by_name || '-',
      }),
    }),
    [caseData, accountName, accountNumber, countryRid]
  );

  useEffect(() => {
    if (isEditView && caseData) {
      const accName = caseData?.account_name || accountName;
      const country = caseData?.country_code || countryCode;
      const year = caseData?.fiscal_year?.toString();
      const prefixValue = generateCaseNamePrefix(accName, country, year);
      setCaseNamePrefix(prefixValue);
    } else {
      const prefixValue = generateCaseNamePrefix(
        accountName,
        countryCode,
        currentYear.toString()
      );
      setCaseNamePrefix(prefixValue);
    }
  }, [accountName, caseData, countryCode, currentYear, isEditView]);

  const userListOptions = useMemo(() => {
    return (
      userListData?.data?.users?.map((item) => ({
        value: item.rid,
        label: `${item.first_name} ${item.last_name}`,
      })) || []
    );
  }, [userListData]);

  const caseFilingTypesOptions = useMemo(() => {
    return (
      caseFillingTypes?.data?.data?.caseFilingType?.map((item) => ({
        value: item.rid,
        label: item.filing_type_name,
      })) || []
    );
  }, [caseFillingTypes]);

  const countryOptions = useMemo(
    () =>
      allCountries.data?.data.country.map((country) => ({
        label: country.country_name,
        value: country.rid,
      })) || [],
    [allCountries.data?.data.country]
  );

  //Permission
  const casesEditFields = useMemo(
    () =>
      permission?.find((item) => item.name === AllPermissions.CASES_VIEW_EDIT)
        ?.fields ?? [],
    [permission]
  );

  const permissionMap = useMemo(() => {
    const map: Record<string, { read: boolean; edit: boolean }> = {};
    casesEditFields.forEach((item) => {
      map[item.name] = { read: item.read ?? false, edit: item.edit ?? false };
    });
    return map;
  }, [casesEditFields]);

  const accountViewEditFields = useMemo(
    () =>
      permission.find((item) => item.name === AllPermissions.ACCOUNTS_VIEW_EDIT)
        ?.fields ?? [],
    [permission]
  );
  const accountPermissionMap = useMemo(() => {
    const map: Record<string, { read: boolean; edit: boolean }> = {};
    accountViewEditFields.forEach((item) => {
      map[item.name] = { read: item.read ?? false, edit: item.edit ?? false };
    });
    return map;
  }, [accountViewEditFields]);

  const onChangeField = ({ fieldName, fieldValue }: OnChange) => {
    if (fieldName === 'case_startdate') {
      // When Start Date changes:
      // - Planned Submission Date must be ≥ Start Date
      // - Statutory Submission Date must be ≥ Start Date
      setDateConstraints((prev) => ({
        ...prev,
        planned_min: fieldValue as string,
        statutory_min: fieldValue as string,
        planned_max: '',
      }));
    }

    if (fieldName === 'planned_submission_date') {
      // When Planned Submission Date changes:
      // - Statutory Submission Date must be ≥ Planned Submission Date
      setDateConstraints((prev) => ({
        ...prev,
        statutory_min: fieldValue as string,
        planned_max: '',
      }));
    }

    if (fieldName === 'statutory_submission_date') {
      // When Statutory Submission Date changes:
      // - Planned Submission Date must be ≤ Statutory Submission Date
      setDateConstraints((prev) => ({
        ...prev,
        planned_max: fieldValue as string,
      }));
    }
    if (fieldName === 'fiscal_year') {
      const accName = caseData?.account_name || accountName;
      const country = caseData?.country_code || countryCode;
      const year = fieldValue as string;
      // Update prefix when fiscal year changes
      const newPrefix = generateCaseNamePrefix(accName, country, year);
      setCaseNamePrefix(newPrefix);
    }
  };

  const submitData = (formValues: Partial<CaseFormPayload>) => {
    const payload = transformCaseFormPayload(
      accountId,
      formValues,
      isEditView,
      caseData
    );
    if (isEditView) {
      updateCase.mutate(payload);
    } else {
      createCase.mutate(payload);
    }
  };

  const handleExternalSubmit = () => {
    formRef.current?.requestSubmit();
  };

  const goBack = () => {
    window.history.back();
  };

  const formConfig = CaseFormData(
    isEditView,
    permissionMap,
    accountPermissionMap,
    caseFilingTypesOptions,
    userListOptions,
    countryOptions,
    dateConstraints,
    caseNamePrefix
  );

  const formLoading =
    userListLoading || isLoading || caseFillingTypes.isPending;

  return (
    <>
      <div className='h-[50px] flex items-center justify-between px-10 sticky top-0 z-10 bg-white border-b border-[#CBD6E2]'>
        <div className='flex items-center w-[80%] max-w-[80%]'>
          <CaseIcon
            alt='case-icon'
            className={`w-7 h-7 p-[5px] [&>path]:stroke-[#4ce547] bg-[#D2FFE3] rounded`}
          />
          <div className='w-[90%]'>
            {isLoading ? (
              <div className='ml-2'>
                <SingleSkeleton width={150} height={12} />
              </div>
            ) : (
              <div className='font-semibold text-[12px] leading-[20px] ml-2 mb-[-6px] text-[#7D98B6]'>
                {sourcePath
                  ? `${sourcePath}${isEditView ? ` > ${caseData?.r_number}` : ''}`
                  : `Cases ${isEditView ? `> ${caseData?.r_number}` : ''}`}
              </div>
            )}
            <h5 className='text-[16px] font-bold ml-2 text-[#2D3E4F]'>
              {isEditView ? 'Edit Case' : 'Create Case'}
            </h5>
          </div>
        </div>
        <div className='flex gap-3'>
          <TextButton
            label='Save'
            loading={createCase.isPending || updateCase.isPending}
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
            disabled={createCase.isPending || updateCase.isPending}
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
              isEditView && caseFormData
                ? {
                    ...caseFormData,
                  }
                : {
                    account_name: accountName || '',
                    account_id: accountNumber || '',
                    case_owner: userId || '',
                    fiscal_year: currentYear.toString(),
                    country: countryRid || '',
                  }
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
