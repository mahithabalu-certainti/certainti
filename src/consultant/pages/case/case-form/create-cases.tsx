import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useParams, useSearchParams } from 'react-router-dom';
import { useToast } from '../../../../hooks';
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
import {
  CaseFormFields,
  CaseFormPayload,
  ColorCode,
  FinancialWorkingCountries,
  ParentChildSelectOption,
} from '../../../types';
import {
  useCaseDetails,
  useClosedCaseList,
  useCreateCase,
  useGetCaseFilingTypes,
  useGetCaseOwners,
  useGetCaseStatuses,
  useGetCaseSubmissionDate,
  useUpdateCaseDetails,
} from '../../../services/cases/case-service';
import { CaseIcon, EditIcon } from '../../../../assets';
import SingleSkeleton from '../../../../components/skeleton-component/singleskeleton';
import {
  formatDateToYYYYMMDDWithTime,
  getDateFormatYYYYMMDD,
  REGEX_PATTERNS,
} from '../../../../common-utils';
import { generateCaseNamePrefix, transformCaseFormPayload } from './utils';
import { useSelector } from 'react-redux';
import { RootState, useAppDispatch } from '../../../../store/store';
import { fetchAccountsThunk } from '../../../../store/slices';
import { useFetchState } from '../../../services/account';
import {
  ErrorInfoIcon,
  KeyContactAddIcon,
  KeyContactRemoveIcon,
} from '../../../../assets';
import {
  Select,
  MenuItem,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Tooltip,
} from '@mui/material';

type AmendmentInfo = {
  fiscal_year?: number;
  country_rid: string;
  country_name?: string; // UI only
  is_federal: boolean;
  state_rid: string;
  state_name: string; // UI only
  total_fte_cost: string;
  total_subcon_cost: string;
  total_nonlabor_cost: string;
  total_project_cost: string;
  total_qre: string;
  total_rd_credits: string;
  annual_gross_receipts: string;
  action_type: 'add' | 'edit' | 'delete';
};

export const CreateCases: React.FC = () => {
  const formRef = React.useRef<HTMLFormElement>(null);

  const { successToast } = useToast();
  const currentYear = new Date().getFullYear();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const { caseId } = useParams();
  const [caseNamePrefix, setCaseNamePrefix] = useState<string>('');
  const [selectedFiscalYear, setSelectedFiscalYear] = useState<string>(
    currentYear.toString()
  );
  const [selectedAccountName, setSelectedAccountName] = useState<string>('');
  const [selectedAccountNumber, setSelectedAccountNumber] =
    useState<string>('');
  const [selectedCountryCode, setSelectedCountryCode] = useState<string>('');
  const [selectedCountryRid, setSelectedCountryRid] = useState<string>('');
  const [selectedAccountRid, setSelectedAccountRid] = useState<string>('');
  const [isAmendmentType, setIsAmendmentType] = useState<boolean>(false);
  const [hasParentCase, setHasParentCase] = useState<boolean>(false);
  const [parentCaseFiscalYear, setParentCaseFiscalYear] = useState<string>('');
  const [isCaseClosed, setIsCaseClosed] = useState<boolean>(false);
  const [calculatedStatutoryDate, setCalculatedStatutoryDate] =
    useState<string>('');
  const [dateConstraints, setDateConstraints] = useState<{
    planned_min: string;
    planned_max: string;
    statutory_min: string;
    statutory_max: string;
    start_date_max: string;
    start_date_min: string;
  }>({
    planned_min: '',
    planned_max: '',
    statutory_min: '',
    statutory_max: '',
    start_date_max: '',
    start_date_min: '',
  });

  const [amendmentCaseInfo, setAmendmentCaseInfo] = useState<AmendmentInfo[]>(
    []
  );
  const [amendmentErrors, setAmendmentErrors] = useState<
    Record<number, Record<string, string>>
  >({});

  const { userId } = useSelector<RootState, { userId: unknown }>(
    (state: RootState) => state.auth
  );
  const { permission } = useSelector((state: RootState) => state.permission);
  const { accounts, loading } = useSelector(
    (state: RootState) => state.account
  );

  const isEditView = location.pathname.split('/').slice(-2, -1)[0] === 'edit';
  const accountId = searchParams.get('accountId') || '';
  const accountNumber = searchParams.get('account_number') || '';
  const accountName = searchParams.get('account_name') || '';
  const sourcePath = searchParams.get('source') || '';
  const countryRid = searchParams.get('country_rid') || '';
  const countryCode = searchParams.get('country_code') || '';
  const globalType = searchParams.get('sourceType') === 'global';
  const countryName = searchParams.get('country_name');

  const { data: caseData, isLoading } = useCaseDetails(caseId || '', accountId);

  const updateCase = useUpdateCaseDetails();
  const createCase = useCreateCase();
  const caseFillingTypes = useGetCaseFilingTypes();
  const allCountries = useGetAllCountries();
  const caseOwners = useGetCaseOwners();
  const caseStatuses = useGetCaseStatuses();
  const closedCaseList = useClosedCaseList(
    accountId || selectedAccountRid || ''
  );

  const effectiveCountryRid = isEditView
    ? caseData?.country_rid || countryRid || selectedCountryRid
    : selectedCountryRid || countryRid;

  const effectiveAccountRid = isEditView
    ? caseData?.account_rid || accountId || selectedAccountRid
    : selectedAccountRid || accountId;

  const { data: submissionDateData, isFetching: isSubmissionDateFetching } =
    useGetCaseSubmissionDate(
      effectiveCountryRid,
      Number(selectedFiscalYear),
      effectiveAccountRid
    );

  const regionList = useFetchState(effectiveCountryRid, 'active');

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

  useEffect(() => {
    if (globalType) {
      dispatch(fetchAccountsThunk());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [globalType]);

  const caseFormData = useMemo(
    () => ({
      ...caseData,
      ...(caseData && {
        account_name: accountName || caseData.account_name || '',
        account_rid: accountId || caseData.account_rid || '',
        account_id: accountNumber || caseData.account_rnumber || '',
        filing_type: caseData.filing_type_rid || '',
        case_name: caseData.case_name || '',
        case_owner: caseData.case_owner_rid || '',
        parent_case_rid: caseData.parent_case_rid || '',
        fiscal_year: caseData.fiscal_year || '',
        country: caseData.country_rid || countryRid || '',
        status_rid: caseData.status_rid || '',
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
    [caseData, accountName, accountId, accountNumber, countryRid]
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

  useEffect(() => {
    if (isEditView) return;

    if (!effectiveCountryRid) {
      setCalculatedStatutoryDate('');
      return;
    }

    if (submissionDateData?.data && selectedFiscalYear) {
      const { caseSubmissionDate } = submissionDateData.data;
      if (caseSubmissionDate) {
        const statutoryDate = caseSubmissionDate;
        setCalculatedStatutoryDate(statutoryDate);
        setDateConstraints((prev) => ({
          ...prev,
          planned_max: statutoryDate,
          start_date_max: statutoryDate,
        }));
      } else {
        setCalculatedStatutoryDate('');
      }
    } else if (!isSubmissionDateFetching) {
      setCalculatedStatutoryDate('');
    }
  }, [
    submissionDateData,
    selectedFiscalYear,
    isEditView,
    effectiveCountryRid,
    isSubmissionDateFetching,
  ]);

  useEffect(() => {
    if (selectedFiscalYear) {
      const year = Number(selectedFiscalYear);
      const startDateMin = `${year - 1}-04-01`;

      setDateConstraints((prev) => ({
        ...prev,
        start_date_min: startDateMin,
        planned_min: startDateMin,
      }));
    }
  }, [selectedFiscalYear]);

  const caseOwnersOptions = useMemo(() => {
    return (
      caseOwners?.data?.data?.caseOwners?.map((item) => ({
        value: item.rid,
        label: item.name || '',
      })) || []
    );
  }, [caseOwners]);

  const parentCaseOptions = useMemo(() => {
    return (
      closedCaseList?.data?.data?.cases?.map((item) => ({
        value: item.rid,
        label: item.case_full_name || '',
      })) || []
    );
  }, [closedCaseList]);

  const caseStatusOptions = useMemo(() => {
    return (
      caseStatuses?.data?.data?.caseStatus?.map((item) => ({
        value: item.rid,
        label: item.status_name || '',
        disabled: item.status_name?.toLowerCase() === 'closed',
      })) || []
    );
  }, [caseStatuses]);

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

  const regionOptions = useMemo(() => {
    return (
      regionList?.data?.data.states.map((item) => ({
        value: item.rid,
        label: item.state_name || '',
      })) || []
    );
  }, [regionList]);

  useEffect(() => {
    if (isAmendmentType && !isEditView && !hasParentCase) {
      if (amendmentCaseInfo.length === 0) {
        const country = countryOptions.find(
          (c) => c.value === effectiveCountryRid
        );
        setAmendmentCaseInfo([
          {
            country_rid: effectiveCountryRid,
            country_name: country?.label || '',
            is_federal: true,
            state_rid: '',
            state_name: '',
            total_fte_cost: '',
            total_subcon_cost: '',
            total_nonlabor_cost: '',
            total_project_cost: '',
            total_qre: '',
            total_rd_credits: '',
            annual_gross_receipts: '',
            action_type: 'add' as const,
          },
        ]);
      }
    } else {
      if (!isEditView) {
        setAmendmentCaseInfo([]);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAmendmentType, isEditView, hasParentCase, effectiveCountryRid]);

  const memoizedAccounts: ParentChildSelectOption[] = useMemo(() => {
    if (!accounts) return [];

    return accounts.map((account) => ({
      parent_value: account.rid,
      parent_label: account.account_name,
      childList:
        account.child_accounts?.map((child) => ({
          child_value: child.rid,
          child_label: child.account_name,
          currency_rid: child.currency_rid,
          country_rid: child.country_rid,
          country_code: child.country_code,
          r_number: child.r_number,
        })) || [],
    }));
  }, [accounts]);

  useEffect(() => {
    if (isEditView) {
      const selectedFilingType = caseFilingTypesOptions.find(
        (option) => String(option.value) === String(caseFormData.filing_type)
      );

      setIsAmendmentType(
        selectedFilingType?.label.toLowerCase() === 'amendment'
      );
    }
  }, [caseFilingTypesOptions, caseFormData, isEditView]);

  useEffect(() => {
    if (isEditView) {
      setIsCaseClosed(caseData?.status_name?.toLowerCase() === 'closed');
    }
  }, [caseData, isEditView]);

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

  const isAustralianCountry = useMemo(() => {
    if (globalType) {
      const selectedCountry = countryOptions.find(
        (country) => country.value === effectiveCountryRid
      );
      return selectedCountry?.label === FinancialWorkingCountries.Australia;
    } else {
      const countryNameFromUrl = searchParams.get('country_name');
      return countryNameFromUrl === FinancialWorkingCountries.Australia;
    }
  }, [globalType, countryOptions, effectiveCountryRid, searchParams]);

  const onChangeField = ({ fieldName, fieldValue }: OnChange) => {
    if (fieldName === 'case_startdate') {
      const startDate = fieldValue as string;
      const year = Number(selectedFiscalYear);
      const basePlannedMin = `${year - 1}-04-01`;
      const newPlannedMin =
        startDate > basePlannedMin ? startDate : basePlannedMin;

      setDateConstraints((prev) => ({
        ...prev,
        planned_min: newPlannedMin,
        statutory_min: startDate,
      }));
    }

    if (fieldName === 'planned_submission_date') {
      // When Planned Submission Date changes:
      // - Statutory Submission Date must be ≥ Planned Submission Date
      setDateConstraints((prev) => ({
        ...prev,
        statutory_min: fieldValue as string,
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

    if (fieldName === 'account_rid' && globalType) {
      const selectedRid = fieldValue as string;
      let accountName = '';
      let accountNumber = '';
      let countryCode = '';
      let countryRid = '';

      let foundChild = null;
      for (const acc of memoizedAccounts) {
        foundChild = acc.childList?.find(
          (childAcc) => childAcc.child_value === selectedRid
        );
        if (foundChild) break;
      }

      if (foundChild) {
        accountName = foundChild.child_label || '';
        accountNumber = foundChild.r_number || '';
        countryCode = foundChild.country_code || '';
        countryRid = foundChild.country_rid || '';
      }

      setSelectedAccountName(accountName);
      setSelectedAccountNumber(accountNumber);
      setSelectedCountryCode(countryCode);
      setSelectedCountryRid(countryRid);
      setSelectedAccountRid(selectedRid);

      // Update case name prefix
      const newPrefix = generateCaseNamePrefix(
        accountName,
        countryCode,
        selectedFiscalYear
      );
      setCaseNamePrefix(newPrefix);
      setCalculatedStatutoryDate('');
      setHasParentCase(false);
    }

    if (fieldName === 'fiscal_year') {
      const accName =
        caseData?.account_name || accountName || selectedAccountName;
      const country =
        caseData?.country_code || countryCode || selectedCountryCode;
      const year = fieldValue as string;
      // Update prefix when fiscal year changes
      const newPrefix = generateCaseNamePrefix(accName, country, year);
      setCaseNamePrefix(newPrefix);
      setSelectedFiscalYear(year);
    }

    if (fieldName === 'parent_case_rid') {
      if (isEditView) return;
      setHasParentCase(!!fieldValue);
      setAmendmentCaseInfo([]);
      const accName = accountName || selectedAccountName;
      const country = countryCode || selectedCountryCode;
      if (fieldValue) {
        const selectedParentCase = closedCaseList?.data?.data?.cases?.find(
          (option) => String(option.rid) === String(fieldValue)
        );
        const parentYear = selectedParentCase?.fiscal_year || '';
        setParentCaseFiscalYear(parentYear);
        setSelectedFiscalYear(parentYear);
        setCaseNamePrefix(generateCaseNamePrefix(accName, country, parentYear));
      } else {
        setParentCaseFiscalYear('');
        setSelectedFiscalYear(selectedFiscalYear);
        setCaseNamePrefix(
          generateCaseNamePrefix(accName, country, selectedFiscalYear)
        );
      }
    }

    if (fieldName === 'filing_type') {
      const selectedFilingType = caseFilingTypesOptions?.find(
        (option) => String(option.value) === String(fieldValue)
      );

      setIsAmendmentType(
        selectedFilingType?.label.toLowerCase() === 'amendment'
      );
      setAmendmentCaseInfo([]);
    }
  };

  const addNewAmendmentRow = () => {
    const country = countryOptions.find((c) => c.value === effectiveCountryRid);
    setAmendmentCaseInfo((prev) => [
      ...prev,
      {
        country_rid: effectiveCountryRid,
        country_name: country?.label || '',
        is_federal: false,
        state_rid: '',
        state_name: '',
        total_fte_cost: '',
        total_subcon_cost: '',
        total_nonlabor_cost: '',
        total_project_cost: '',
        total_qre: '',
        total_rd_credits: '',
        annual_gross_receipts: '',
        action_type: 'add' as const,
      },
    ]);
  };

  const removeAmendmentRow = (index: number) => {
    setAmendmentCaseInfo((prev) => prev.filter((_, i) => i !== index));
    // Re-align errors
    setAmendmentErrors((prev) => {
      const newErrors: Record<number, Record<string, string>> = {};
      Object.keys(prev).forEach((key) => {
        const k = parseInt(key);
        if (k < index) newErrors[k] = prev[k];
        if (k > index) newErrors[k - 1] = prev[k];
      });
      return newErrors;
    });
  };

  const handleRowChange = (
    index: number,
    field: string,
    value: string,
    updates: Partial<AmendmentInfo> = {}
  ) => {
    setAmendmentCaseInfo((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value, ...updates };
      return updated;
    });

    // Clear error for this field
    setAmendmentErrors((prev) => {
      if (!prev[index]) return prev;
      const updatedRow = { ...prev[index] };
      delete updatedRow[field];
      return { ...prev, [index]: updatedRow };
    });
  };

  const validateAmendmentInfo = (): boolean => {
    const newErrors: Record<number, Record<string, string>> = {};
    let isValid = true;
    const amountRegex = REGEX_PATTERNS.EFFORTS_NUMBER;

    amendmentCaseInfo.forEach((row, index) => {
      const rowErrors: Record<string, string> = {};

      // Validate Region for non-federal rows
      if (!row.is_federal && !row.state_rid) {
        rowErrors.state_rid = 'Field is required';
        isValid = false;
      }

      const fieldsToValidate = [
        'total_fte_cost',
        'total_subcon_cost',
        'total_nonlabor_cost',
        'total_project_cost',
        'total_qre',
        'total_rd_credits',
      ];

      fieldsToValidate.forEach((field) => {
        const value = String(row[field as keyof AmendmentInfo] || '');
        if (!value.trim()) {
          rowErrors[field] = 'Field is required';
          isValid = false;
        } else if (!amountRegex.test(value.replace(/,/g, ''))) {
          rowErrors[field] =
            'Only positive numbers allowed, up to 16 digits and 2 decimal places';
          isValid = false;
        }
      });

      // Optional validation for annual_gross_receipts
      const grossReceipts = String(row.annual_gross_receipts || '');
      if (
        grossReceipts.trim() &&
        !amountRegex.test(grossReceipts.replace(/,/g, ''))
      ) {
        rowErrors.annual_gross_receipts =
          'Only positive numbers allowed, up to 16 digits and 2 decimal places';
        isValid = false;
      }

      if (Object.keys(rowErrors).length > 0) {
        newErrors[index] = rowErrors;
      }
    });

    setAmendmentErrors(newErrors);
    return isValid;
  };

  const submitData = (formValues: Partial<CaseFormPayload>) => {
    if (isAmendmentType && !isEditView && !hasParentCase) {
      if (!validateAmendmentInfo()) {
        return;
      }
    }

    const payload = transformCaseFormPayload(
      accountId,
      formValues as CaseFormFields,
      isEditView,
      caseData,
      isAmendmentType,
      hasParentCase,
      amendmentCaseInfo.map((row) => ({
        fiscal_year: Number(formValues.fiscal_year || 0),
        country_rid: row.country_rid,
        state_rid: row.state_rid || '',
        state_name: row.state_name || '',
        is_federal: row.is_federal,
        total_project: 0,
        total_qualified_project: 0,
        total_qualified_project_cost: 0,
        total_fte_cost: Number(row.total_fte_cost || 0),
        total_subcon_cost: Number(row.total_subcon_cost || 0),
        total_nonlabor_cost: Number(row.total_nonlabor_cost || 0),
        total_project_cost: Number(row.total_project_cost || 0),
        total_qre: Number(row.total_qre || 0),
        total_rd_credits: Number(row.total_rd_credits || 0),
        annual_gross_receipts: Number(row.annual_gross_receipts || 0),
        action_type: row.action_type,
      }))
    );
    if (isEditView) {
      updateCase.mutate(payload);
    } else {
      createCase.mutate(payload);
    }
  };

  const handleExternalSubmit = () => {
    if (isAmendmentType && !isEditView && !hasParentCase) {
      validateAmendmentInfo();
    }
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
    caseOwnersOptions,
    parentCaseOptions,
    countryOptions,
    memoizedAccounts,
    dateConstraints,
    caseNamePrefix,
    selectedCountryRid,
    selectedAccountNumber,
    selectedFiscalYear,
    globalType,
    isEditView
      ? caseData?.statutory_submission_date || undefined
      : calculatedStatutoryDate,
    caseStatusOptions,
    isAustralianCountry,
    countryName ?? undefined,
    isAmendmentType,
    closedCaseList.isLoading,
    isCaseClosed,
    hasParentCase,
    parentCaseFiscalYear
  );

  const formLoading =
    caseOwners.isLoading || isLoading || caseFillingTypes.isPending || loading;

  return (
    <>
      <div className='h-[50px] flex items-center justify-between px-10 sticky top-0 z-10 bg-white border-b border-[#CBD6E2]'>
        <div className='flex items-center w-[80%] max-w-[80%]'>
          {isEditView ? (
            <EditIcon
              alt='projrct-icon'
              className={`h-7 w-7 p-1.5 rounded [&>path]:stroke-[${ColorCode.caseTextColor}] bg-[${ColorCode.caseBgColor}]`}
            />
          ) : (
            <CaseIcon
              alt='case-icon'
              className={`h-7 w-7 p-1.5 rounded [&>path]:stroke-[${ColorCode.caseTextColor}] bg-[${ColorCode.caseBgColor}]`}
            />
          )}
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
            disabled={isCaseClosed}
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
        {isCaseClosed && (
          <div className='flex items-center gap-2 h-8 sticky top-[50px] z-10 border-b border-[#B7EB8F] bg-[#F6FFED] text-[14px] text-[#2D3E4F] px-10 py-2'>
            <div className='text-[#52c41a] font-bold'>✔</div>
            <div>
              <span className='font-bold mr-2'>Case Closed:</span>
              <span className='font-medium'>
                This case has been finalized and closed. No further
                modifications are allowed.
              </span>
            </div>
          </div>
        )}
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
                    statutory_submission_date: calculatedStatutoryDate,
                  }
            }
            outData={submitData}
            formRef={formRef}
            onChange={onChangeField}
            layout={Layout.TYPE_1}
          />
        )}

        {isAmendmentType && !isEditView && !hasParentCase && (
          <div className='mt-4'>
            <div className='border capitalize h-[30px] border-box border-[#CBD6E2] font-bold text-[14px] text-[#2D3E4F] leading-[21px] tracking-[0%] align-middle py-1 bg-[#ECECEC] px-10'>
              Amendment Case Information
            </div>

            <div className='px-10 py-5 flex flex-col gap-4'>
              <div className='mb-4'>
                <TableContainer
                  sx={{
                    overflowX: 'auto',
                    overflowY: 'hidden',
                    border: '1px solid #CBD6E2',
                    position: 'relative',
                  }}
                >
                  <Table sx={{ borderCollapse: 'separate', borderSpacing: 0 }}>
                    <TableHead
                      sx={{
                        '& .MuiTableCell-root': {
                          fontWeight: 700,
                          fontSize: '13px',
                          color: '#2A2A2A',
                          padding: '0px 8px',
                          height: '29px',
                          boxSizing: 'border-box',
                          borderRight: '1px solid #CBD6E2',
                          borderBottom: '1px solid #CBD6E2',
                        },
                      }}
                    >
                      <TableRow sx={{ height: 29 }}>
                        <TableCell
                          sx={{
                            width: '150px',
                            minWidth: '150px',
                            position: 'sticky',
                            left: 0,
                            zIndex: 4,
                            backgroundColor: '#fff',
                          }}
                        >
                          Country
                        </TableCell>
                        <TableCell
                          sx={{
                            width: '100px',
                            minWidth: '100px',
                            position: 'sticky',
                            left: 150,
                            zIndex: 4,
                            backgroundColor: '#fff',
                          }}
                        >
                          Is Federal?
                        </TableCell>
                        <TableCell
                          sx={{
                            width: '180px',
                            minWidth: '180px',
                            position: 'sticky',
                            left: 250,
                            zIndex: 4,
                            backgroundColor: '#fff',
                          }}
                        >
                          Region
                        </TableCell>
                        {[
                          {
                            label: 'Total FTE Cost',
                            required: true,
                            width: '160px',
                          },
                          {
                            label: 'Total Subcon Cost',
                            required: true,
                            width: '160px',
                          },
                          {
                            label: 'Total Non-Labor Cost',
                            required: true,
                            width: '160px',
                          },
                          {
                            label: 'Total Project Cost',
                            required: true,
                            width: '160px',
                          },
                          {
                            label: 'Total QRE',
                            required: true,
                            width: '160px',
                          },
                          {
                            label: 'Total RD Credits',
                            required: true,
                            width: '160px',
                          },
                          {
                            label: 'Gross Receipts',
                            required: false,
                            width: '160px',
                            showTooltip: true,
                            tooltipMessage:
                              'Annual Gross Receipt is the total money received in a year.',
                          },
                        ].map((col) => (
                          <TableCell
                            key={col.label}
                            sx={{
                              width: col.width,
                              minWidth: col.width,
                            }}
                          >
                            <div className='flex items-center justify-between gap-1'>
                              <span>
                                {col.label}
                                {col.required && (
                                  <span className='text-red-500'> *</span>
                                )}
                              </span>
                              {col.showTooltip && (
                                <Tooltip
                                  title={col.tooltipMessage || ''}
                                  arrow
                                  placement='top'
                                  slotProps={{
                                    tooltip: {
                                      sx: {
                                        mr: 1,
                                      },
                                    },
                                  }}
                                >
                                  <span className='w-5 mt-1 inline-flex items-center justify-center cursor-pointer'>
                                    <React.Suspense fallback={null}>
                                      <ErrorInfoIcon className='w-5 h-3.5 [&>path]:fill-[#9fa0a1]' />
                                    </React.Suspense>
                                  </span>
                                </Tooltip>
                              )}
                            </div>
                          </TableCell>
                        ))}
                        <TableCell sx={{ minWidth: '80px', width: '80px' }}>
                          Action
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody
                      sx={{
                        '& .MuiTableCell-root': {
                          padding: '0px',
                          '& input': {
                            border: '1px solid transparent',
                            outline: 'none',
                            boxShadow: 'none',
                            background: 'transparent',
                            width: '100%',
                            height: '28px',
                            padding: '4px 8px',
                            fontSize: '13px',
                            '&:focus': {
                              border: '1px solid #60A5FA',
                            },
                          },
                        },
                      }}
                    >
                      {amendmentCaseInfo.length > 0 ? (
                        amendmentCaseInfo.map((row, index) => (
                          <TableRow key={index}>
                            {/* Country Column */}
                            <TableCell
                              sx={{
                                height: '28px',
                                width: '150px',
                                minWidth: '150px',
                                paddingLeft: '8px !important',
                                borderRight: '1px solid #CBD6E2',
                                borderBottom: '1px solid #CBD6E2',
                                fontWeight: 600,
                                color: '#1A3D6F',
                                fontSize: '12px',
                                backgroundColor: 'white',
                                position: 'sticky',
                                left: 0,
                                zIndex: 3,
                              }}
                            >
                              {row.country_name}
                            </TableCell>

                            {/* Is Federal Column */}
                            <TableCell
                              sx={{
                                height: '28px',
                                width: '100px',
                                minWidth: '100px',
                                paddingLeft: '8px !important',
                                borderRight: '1px solid #CBD6E2',
                                borderBottom: '1px solid #CBD6E2',
                                fontWeight: 600,
                                color: '#1A3D6F',
                                fontSize: '12px',
                                backgroundColor: 'white',
                                position: 'sticky',
                                left: 150,
                                zIndex: 3,
                              }}
                            >
                              {row.is_federal ? 'Yes' : 'No'}
                            </TableCell>

                            {/* Region Column */}
                            <TableCell
                              sx={{
                                height: '28px',
                                width: '180px',
                                minWidth: '180px',
                                padding: '0px !important',
                                borderRight: '1px solid #CBD6E2',
                                borderBottom: '1px solid #CBD6E2',
                                backgroundColor: row.is_federal
                                  ? '#F3F4F6'
                                  : amendmentErrors[index]?.state_rid
                                    ? '#FEF2F2'
                                    : 'white',
                                position: 'sticky',
                                left: 250,
                                zIndex: 3,
                              }}
                            >
                              {row.is_federal ? (
                                <div className='px-2 text-[#7D98B6] font-medium'>
                                  Choose Region
                                </div>
                              ) : (
                                <div className='flex items-center'>
                                  <Select
                                    fullWidth
                                    value={row.state_rid}
                                    onChange={(e) => {
                                      const selectedOption = regionOptions.find(
                                        (opt) => opt.value === e.target.value
                                      );
                                      handleRowChange(
                                        index,
                                        'state_rid',
                                        e.target.value as string,
                                        {
                                          state_name:
                                            selectedOption?.label || '',
                                        }
                                      );
                                    }}
                                    displayEmpty
                                    size='small'
                                    sx={{
                                      height: '28px',
                                      fontSize: '13px',
                                      borderRadius: '2px',
                                      '& .MuiSelect-select': {
                                        padding: '4px 8px',
                                        color: row.state_rid
                                          ? '#425A76'
                                          : '#7D98B6',
                                        fontWeight: 500,
                                      },
                                      '& .MuiOutlinedInput-notchedOutline': {
                                        border: 'none',
                                      },
                                      '&.Mui-focused .MuiOutlinedInput-notchedOutline':
                                        {
                                          border: '1px solid #60A5FA',
                                        },
                                    }}
                                    MenuProps={{
                                      PaperProps: {
                                        sx: {
                                          marginTop: '4px',
                                          maxHeight: '200px',
                                          borderRadius: '0px',
                                          boxShadow:
                                            'rgba(50, 50, 93, 0.25) 0px 2px 5px -1px, rgba(0, 0, 0, 0.3) 0px 1px 3px -1px',
                                          '& .MuiMenuItem-root': {
                                            fontSize: '13px',
                                            fontWeight: 500,
                                            padding: '6px 12px',
                                          },
                                        },
                                      },
                                    }}
                                  >
                                    <MenuItem
                                      value=''
                                      sx={{
                                        color: '#7D98B6',
                                        fontSize: '13px',
                                        fontWeight: 500,
                                      }}
                                    >
                                      Choose Region
                                    </MenuItem>
                                    {regionOptions
                                      .filter(
                                        (opt) =>
                                          !amendmentCaseInfo.some(
                                            (info, i) =>
                                              i !== index &&
                                              info.state_rid === opt.value
                                          )
                                      )
                                      .map((opt) => (
                                        <MenuItem
                                          key={opt.value}
                                          value={opt.value}
                                          sx={{ fontSize: '12px' }}
                                        >
                                          {opt.label}
                                        </MenuItem>
                                      ))}
                                  </Select>
                                  {amendmentErrors[index]?.state_rid && (
                                    <Tooltip
                                      title={amendmentErrors[index].state_rid}
                                      arrow
                                      placement='top'
                                      slotProps={{
                                        tooltip: {
                                          sx: {
                                            backgroundColor: '#FEF2F2',
                                            mr: 1,
                                          },
                                        },
                                      }}
                                    >
                                      <span className='absolute right-8 top-2.5 flex items-center cursor-pointer'>
                                        <React.Suspense fallback={null}>
                                          <ErrorInfoIcon className='w-4 h-3.5' />
                                        </React.Suspense>
                                      </span>
                                    </Tooltip>
                                  )}
                                </div>
                              )}
                            </TableCell>

                            {(
                              [
                                {
                                  key: 'total_fte_cost',
                                  label: 'Total FTE Cost',
                                  width: '180px',
                                },
                                {
                                  key: 'total_subcon_cost',
                                  label: 'Total Subcon Cost',
                                  width: '200px',
                                },
                                {
                                  key: 'total_nonlabor_cost',
                                  label: 'Total Non-Labor Cost',
                                  width: '210px',
                                },
                                {
                                  key: 'total_project_cost',
                                  label: 'Total Project Cost',
                                  width: '190px',
                                },
                                {
                                  key: 'total_qre',
                                  label: 'Total QRE',
                                  width: '180px',
                                },
                                {
                                  key: 'total_rd_credits',
                                  label: 'Total RD Credits',
                                  width: '180px',
                                },
                                {
                                  key: 'annual_gross_receipts',
                                  label: 'Gross Receipts',
                                  width: '180px',
                                },
                              ] as const
                            ).map((col) => (
                              <TableCell
                                key={col.key}
                                sx={{
                                  borderRight: '1px solid #CBD6E2',
                                  borderBottom: '1px solid #CBD6E2',
                                  width: col.width,
                                  minWidth: col.width,
                                  backgroundColor: amendmentErrors[index]?.[
                                    col.key
                                  ]
                                    ? '#FEF2F2'
                                    : 'white',
                                  position: 'relative',
                                  padding: '0px !important',
                                  '& input': {
                                    background: 'transparent',
                                    border: amendmentErrors[index]?.[col.key]
                                      ? '1px solid #EF4444'
                                      : '1px solid transparent',
                                    '&:focus': {
                                      border: '1px solid #60A5FA',
                                      backgroundColor: amendmentErrors[index]?.[
                                        col.key
                                      ]
                                        ? '#FEF2F2'
                                        : 'white',
                                    },
                                  },
                                }}
                              >
                                <input
                                  type='text'
                                  value={row[col.key]}
                                  onChange={(e) =>
                                    handleRowChange(
                                      index,
                                      col.key,
                                      e.target.value
                                    )
                                  }
                                  placeholder={`Enter ${col.label}`}
                                  className='placeholder-custom-color placeholder-[#7D98B6]'
                                />
                                {amendmentErrors[index]?.[col.key] && (
                                  <Tooltip
                                    title={amendmentErrors[index][col.key]}
                                    arrow
                                    placement='top'
                                    slotProps={{
                                      tooltip: {
                                        sx: {
                                          backgroundColor: '#FEF2F2',
                                          mr: 1,
                                        },
                                      },
                                    }}
                                  >
                                    <span className='h-[22px] w-5 flex items-center justify-center absolute top-[3px] bg-[#FEF2F2] right-[2px] cursor-pointer'>
                                      <React.Suspense fallback={null}>
                                        <ErrorInfoIcon
                                          alt='error'
                                          className='w-4 h-3.5'
                                        />
                                      </React.Suspense>
                                    </span>
                                  </Tooltip>
                                )}
                              </TableCell>
                            ))}
                            <TableCell
                              sx={{
                                height: '28px',
                                paddingLeft: '8px !important',
                                borderRight: '1px solid #CBD6E2',
                                borderBottom: '1px solid #CBD6E2',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                backgroundColor: 'white',
                              }}
                            >
                              {!row.is_federal ? (
                                <Tooltip
                                  title='Remove Entry'
                                  arrow
                                  placement='top'
                                >
                                  <button
                                    type='button'
                                    onClick={() => removeAmendmentRow(index)}
                                    style={{
                                      cursor: 'pointer',
                                      background: 'transparent',
                                      border: 'none',
                                      padding: 0,
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                    }}
                                    aria-label='Remove entry'
                                  >
                                    <React.Suspense fallback={null}>
                                      <KeyContactRemoveIcon
                                        style={{
                                          width: 20,
                                          height: 20,
                                        }}
                                      />
                                    </React.Suspense>
                                  </button>
                                </Tooltip>
                              ) : (
                                <span>-</span>
                              )}
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell
                            colSpan={11}
                            align='center'
                            sx={{
                              height: '32px',
                              color: '#7D98B6',
                              fontSize: '13px',
                              borderBottom: '1px solid #CBD6E2',
                            }}
                          >
                            No data available
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
                <div className='mt-2'>
                  <button
                    className='flex items-center cursor-pointer gap-1 bg-[#EAF0F5] h-[30px] text-[#2D3E4F] px-2 text-[12px] font-semibold border-none rounded-[2px] hover:bg-[#D9E2E9]'
                    type='button'
                    onClick={addNewAmendmentRow}
                  >
                    <span>
                      <React.Suspense fallback={null}>
                        <KeyContactAddIcon className='w-5 h-5' />
                      </React.Suspense>
                    </span>
                    Add New
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default CreateCases;
