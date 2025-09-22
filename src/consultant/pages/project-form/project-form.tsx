import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useParams, useSearchParams } from 'react-router-dom';
import { EditIcon, ProjectCreateIcon } from '../../../assets';
import {
  AllModules,
  AllPermissions,
  Layout,
  OnChange,
  useGetAllCountries,
  useGetStatus,
} from '../../../common-service';
import { FormBuilder } from '../../../components';
import TextButton from '../../../components/button/text-button';
import { useToast } from '../../../hooks';
import {
  useFetchClassification,
  useFetchCurrency,
  useFetchIndustrys,
  useFetchState,
  useKeyContactRoles,
} from '../../services/account';
import {
  enumValue,
  FieldType,
  KeyContactHeader,
  OthersEnum,
  ParentChildSelectOption,
  SelectOption,
} from '../../types';
import { transformFormData, transformKeyContactsFromAPI } from './utils';
import { NewProjectData } from '../../types/project';
import {
  useCreateProject,
  useUpdateProject,
} from '../../services/project/project-create-service';
import { useGetProjectType, useProjectDetail } from '../../services/project';
import {
  checkPermission,
  getDateFormatM,
  removeFormatCostValue,
} from '../../../common-utils';
import { FormData, newKeyContactFields } from './form-data';
import { formatDateToYYYYMMDDWithTime } from '../account-details-sidebar/sidebar-pages/resources/utils';
import SkeletonForm from '../../../components/form-builder/skeleton-form';
import SingleSkeleton from '../../../components/skeleton-component/singleskeleton';
import { useSelector } from 'react-redux';
import { RootState, useAppDispatch } from '../../../store/store';
import { AccessRestricted } from '../../../components/account-restricted';
import { fetchAccountsThunk } from '../../../store/slices';

const defaultKeyContactHeaders: KeyContactHeader[] = [
  { name: 'key_contact_name', label: 'Key Contact Name', width: '190px' },
  { name: 'key_contact_role', label: 'Key Contact Role', width: '180px' },
  { name: 'key_contact_email', label: 'Key Contact Email', width: '180px' },
  { name: 'is_primary_contact', label: 'Is Primary Contact?', width: '140px' },
  {
    name: 'include_in_communication',
    label: 'Interaction Recipient?',
    width: '200px',
  },
  {
    name: 'interaction_cc_recipient',
    label: 'Interaction CC Recipient?',
    width: '200px',
  },
  {
    name: 'key_contact_status',
    label: 'Key Contact Status',
    width: '140px',
  },
  { name: 'button', label: '', width: '35px' },
];

export interface Breadcrumb {
  label: string;
  path?: string;
}

const ProjectForm: React.FC = () => {
  const formRef = React.useRef<HTMLFormElement>(null);
  const [currentCountry, setCurrentCountry] = useState('');
  const [showOthersField, setShowOthersField] = useState(false);
  const [showClassifyOthersField, setShowClassifyOthersField] = useState(false);
  const [keyContacts, setKeyContacts] = useState<FieldType[]>([]);
  const { successToast } = useToast();
  const dispatch = useAppDispatch();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { projectid: projectID } = useParams();
  const accountID = searchParams.get('accountID') || '';
  const settings = JSON.parse(searchParams.get('settings') || '{}');
  const isEditView = location.pathname.split('/').slice(-2, -1)[0] === 'edit';
  const getProjectData = useProjectDetail(accountID, projectID || '');
  const account = getProjectData.data?.data?.project;

  const [isFormReadyForEdit, setIsFormReadyForEdit] = useState(!isEditView);

  const [effortFinancials, setEffortFinancials] = useState({
    total_effort_fte: '',
    total_effort_subcon: '',
    total_effort: '',
  });

  const [costFinancials, setCostFinancials] = useState({
    total_cost_fte: '',
    total_cost_subcon: '',
    total_cost_nonlabor: '',
    total_cost: '',
  });
  const [currencyValue, setCurrencyValue] = useState('');
  // State to track field edits for disabling logic
  const [isEffortFteEdited, setIsEffortFteEdited] = useState(false);
  const [isEffortSubconEdited, setIsEffortSubconEdited] = useState(false);
  const [isCostFteEdited, setIsCostFteEdited] = useState(false);
  const [isCostSubconEdited, setIsCostSubconEdited] = useState(false);
  const [isNonLaborCostEdited, setIsNonLaborCostEdited] = useState(false);
  const globalType = searchParams.get('type') === 'global';
  const accountName = account?.account_name;
  const projectCode = account?.project_code;
  const highlight = {
    field: location.state?.field,
    section: location.state?.section,
  };
  useEffect(() => {
    if (globalType) {
      dispatch(fetchAccountsThunk());
    }
  }, [globalType, dispatch]);
  const source = searchParams.get('source');
  const AccountNameValue = searchParams.get('AccountName');
  let breadcrumbLabel = '';

  switch (source) {
    case 'createAccount':
      breadcrumbLabel = `Account > ${AccountNameValue || ''}`;
      break;
    case 'account':
      breadcrumbLabel = `Account > ${accountName || ''} > ${projectCode || ''}`;
      break;
    case 'project':
      breadcrumbLabel = `Project > ${projectCode || ''}`;
      break;
    default:
      breadcrumbLabel = '';
      break;
  }

  const statusOptions = useGetStatus();
  const projectTypeOptions = useGetProjectType();
  const allCountries = useGetAllCountries();
  const currency = useFetchCurrency();
  const industry = useFetchIndustrys();
  const Classification = useFetchClassification();
  const keyContactRoles = useKeyContactRoles('Project');
  const states = useFetchState(currentCountry);
  const createProject = useCreateProject();
  const updateProject = useUpdateProject();
  // Permission Management
  const { modules, permission } = useSelector(
    (state: RootState) => state.permission
  );

  const projectViewEditFields = useMemo(
    () =>
      permission.find((item) => item.name === AllPermissions.PROJECTS_VIEW_EDIT)
        ?.fields ?? [],
    [permission]
  );
  const permissionMap = useMemo(() => {
    const map: Record<string, { read: boolean; edit: boolean }> = {};
    projectViewEditFields.forEach((item) => {
      map[item.name] = { read: item.read ?? false, edit: item.edit ?? false };
    });
    return map;
  }, [projectViewEditFields]);

  const memoizedStatus: SelectOption[] = useMemo(
    () =>
      statusOptions?.data?.data?.status.map((status) => ({
        label: status.status_name,
        value: status.rid,
        desc: status.status_description,
      })) || [],
    [statusOptions?.data?.data?.status]
  );
  const accountIsEnable = checkPermission(modules, AllModules.ACCOUNTS);
  const accountViewEnable = checkPermission(
    permission,
    AllPermissions.ACCOUNTS_VIEW_EDIT
  );

  const { accounts, loading } = useSelector(
    (state: RootState) => state.account
  );
  const defaultActiveValue = useMemo(() => {
    const activeOption = memoizedStatus.find(
      (option) => option.label.toLowerCase() === 'active'
    );
    return activeOption?.value || '';
  }, [memoizedStatus]);

  const projectData = useMemo(
    () => ({
      ...account,
      ...(account && {
        auto_send_ai_interaction: account?.auto_send_ai_interaction
          ? 'Yes'
          : 'No',
        auto_access_rd: account?.auto_access_rd ? 'Yes' : 'No',
        project_enddate: account?.project_enddate
          ? getDateFormatM(account.project_enddate)
          : '',
        project_startdate: account?.project_startdate
          ? getDateFormatM(account.project_startdate)
          : '',
        created_on: formatDateToYYYYMMDDWithTime(account?.created_datetime),
        updated_on: account?.modified_datetime
          ? formatDateToYYYYMMDDWithTime(account?.modified_datetime || '-')
          : '-',
        ...transformKeyContactsFromAPI(
          account?.keyContact || [],
          memoizedStatus
        ),
        region: account?.region,
        project_status: account?.status_rid,
        project_type: account?.project_type_rid,
      }),
    }),
    [account, memoizedStatus]
  );

  // Calculation functions
  const calculateTotalEffort = ({
    total_effort_fte = '0',
    total_effort_subcon = '0',
  }: {
    total_effort_fte?: string;
    total_effort_subcon?: string;
  }) => {
    const fte = parseFloat(total_effort_fte) || 0;
    const subcon = parseFloat(total_effort_subcon) || 0;
    return fte + subcon;
  };

  const calculateTotalCost = ({
    total_cost_fte = '0',
    total_cost_subcon = '0',
    total_cost_nonlabor = '0',
  }: {
    total_cost_fte?: string;
    total_cost_subcon?: string;
    total_cost_nonlabor?: string;
  }) => {
    const fte = parseFloat(total_cost_fte) || 0;
    const subcon = parseFloat(total_cost_subcon) || 0;
    const nonlabor = parseFloat(total_cost_nonlabor) || 0;
    return fte + subcon + nonlabor;
  };

  const commonSuccess = createProject.isSuccess || updateProject.isSuccess;
  useEffect(() => {
    if (commonSuccess) {
      successToast(
        isEditView
          ? 'Project updated successfully'
          : 'Project created successfully'
      );
      setShowOthersField(false);
      goBack();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [commonSuccess, isEditView]);

  const memoizedProjectTypes: SelectOption[] = useMemo(
    () =>
      projectTypeOptions?.data?.data?.projectType.map((item) => ({
        label: item.project_type_name,
        value: item.rid,
      })) || [],
    [projectTypeOptions?.data?.data?.projectType]
  );

  const memoizedCountry: SelectOption[] = useMemo(
    () =>
      allCountries.data?.data.country.map((country) => ({
        label: country.country_name,
        value: country.rid,
      })) || [],
    [allCountries.data?.data.country]
  );

  const memoizedClassification: SelectOption[] = useMemo(
    () =>
      Classification.data?.data.projectClassifications.map((data) => ({
        label: data.classification_name,
        value: data.rid,
      })) || [],
    [Classification.data?.data.projectClassifications]
  );

  const memoizedCurrency: SelectOption[] = useMemo(
    () =>
      currency.data?.data.currency.map((account) => ({
        label: account.currency_name,
        value: account.rid,
      })) || [],
    [currency.data?.data.currency]
  );

  const memoizedIndustry: SelectOption[] = useMemo(
    () =>
      industry.data?.data.industries.map((industries) => ({
        label: industries.industry_name,
        value: industries.rid,
      })) || [],
    [industry.data?.data.industries]
  );

  const memoizedState: SelectOption[] = useMemo(
    () =>
      states.data?.data.states.map((state) => ({
        label: state.state_name,
        value: state.rid,
      })) || [],
    [states.data?.data.states]
  );

  const memoizedRole: SelectOption[] = useMemo(
    () =>
      keyContactRoles.data?.data.keyContactRoles.map((role) => ({
        label: role.role_name,
        value: role.rid,
      })) || [],
    [keyContactRoles.data?.data.keyContactRoles]
  );
  const memoizedAccounts: ParentChildSelectOption[] = useMemo(() => {
    if (!accounts) return [];

    return accounts.map((account) => ({
      parent_value: account.rid,
      parent_label: account.account_name,
      childList:
        account.child_accounts?.map((child) => ({
          child_value: child.rid,
          child_label: child.account_name,
          currency_rid: child.currency_rid ?? undefined,
        })) || [],
    }));
  }, [accounts]);

  useEffect(() => {
    const existingContacts = account?.keyContact || [];
    const disabled =
      isEditView &&
      permissionMap?.['key_contacts']?.read &&
      !permissionMap?.['key_contacts']?.edit;
    const newKeyData = newKeyContactFields(memoizedRole, disabled);

    let fields: FieldType[] = [];

    if (isEditView && existingContacts.length) {
      existingContacts.forEach(() => {
        fields = [...fields, ...newKeyData];
      });
    }

    setKeyContacts(fields);
  }, [memoizedRole, account?.keyContact, isEditView, permissionMap]);
  useEffect(() => {
    if (isEditView && projectData?.project_rid) {
      // --- Effort Calculation Logic ---
      const initialEffortFte = projectData.total_effort_fte?.toString() || '';
      const initialEffortSubcon =
        projectData.total_effort_subcon?.toString() || '';
      let initialTotalEffort = projectData.total_effort?.toString() || '';

      if (!initialTotalEffort && (initialEffortFte || initialEffortSubcon)) {
        const calculatedEffort = calculateTotalEffort({
          total_effort_fte: initialEffortFte,
          total_effort_subcon: initialEffortSubcon,
        });
        initialTotalEffort =
          calculatedEffort % 1 === 0
            ? calculatedEffort.toString()
            : calculatedEffort.toFixed(2);
      }

      const efforts = {
        total_effort_fte: initialEffortFte,
        total_effort_subcon: initialEffortSubcon,
        total_effort: initialTotalEffort,
      };
      setEffortFinancials(efforts);

      setIsEffortFteEdited(!!initialEffortFte);
      setIsEffortSubconEdited(!!initialEffortSubcon);

      // --- Cost Calculation Logic ---
      const initialCostFte = projectData.total_cost_fte?.toString() || '';
      const initialCostSubcon = projectData.total_cost_subcon?.toString() || '';
      const initialCostNonLabor =
        projectData.total_cost_nonlabor?.toString() || '';
      let initialTotalCost = projectData.total_cost?.toString() || '';

      if (
        !initialTotalCost &&
        (initialCostFte || initialCostSubcon || initialCostNonLabor)
      ) {
        const calculatedCost = calculateTotalCost({
          total_cost_fte: initialCostFte,
          total_cost_subcon: initialCostSubcon,
          total_cost_nonlabor: initialCostNonLabor,
        });
        initialTotalCost =
          calculatedCost % 1 === 0
            ? calculatedCost.toString()
            : calculatedCost.toFixed(2);
      }

      const costs = {
        total_cost_fte: initialCostFte,
        total_cost_subcon: initialCostSubcon,
        total_cost_nonlabor: initialCostNonLabor,
        total_cost: initialTotalCost,
      };
      setCostFinancials(costs);

      setIsCostFteEdited(!!initialCostFte);
      setIsCostSubconEdited(!!initialCostSubcon);
      setIsNonLaborCostEdited(!!initialCostNonLabor);

      setIsFormReadyForEdit(true);
    }
  }, [projectData, isEditView]);

  const removeKeyContactInfo = (fieldIndex: number) => {
    const contactsArr = [...keyContacts];
    const groupSize = 9;
    const groupIndex = Math.floor(fieldIndex / groupSize);
    const startIndex = groupIndex * groupSize;
    if (contactsArr.length <= groupSize) {
      setKeyContacts([]);
    } else {
      contactsArr.splice(startIndex, groupSize);
      setKeyContacts(contactsArr);
    }
  };

  const addKeyContactInfo = () => {
    const newKeyData = newKeyContactFields(memoizedRole);
    setKeyContacts((prev) => [...prev, ...newKeyData]);
  };

  const submitData = (formValues: Partial<NewProjectData>) => {
    const finalPayload = {
      ...formValues,
      ...effortFinancials,
      ...costFinancials,
      ...(globalType ? {} : { account_rid: accountID }),
      project_id: isEditView ? account?.project_rid : projectID,
    };

    const projectPayload = transformFormData(
      finalPayload,
      isEditView,
      memoizedStatus,
      defaultActiveValue,
      account?.keyContact,
      showOthersField,
      showClassifyOthersField
    );

    if (isEditView) {
      updateProject.mutate(projectPayload);
    } else {
      createProject.mutate(projectPayload);
    }
  };

  const handleExternalSubmit = () => {
    formRef.current?.requestSubmit();
  };

  const goBack = () => {
    window.history.back();
  };

  const formatNumber = (value: string): string => {
    const num = parseFloat(value);
    if (isNaN(num)) return '';
    return num % 1 === 0 ? num.toString() : num.toFixed(2);
  };

  const onChangeField = (data: OnChange) => {
    if (data.fieldName === 'country') {
      setCurrentCountry(data.fieldValue as string);
    }
    if (data.fieldName === 'industry_rid') {
      const selectedIndustry = memoizedIndustry.find(
        (option) => String(option.value) === String(data.fieldValue)
      );
      setShowOthersField(
        selectedIndustry?.label.toLowerCase() === OthersEnum.Other
      );
    }
    if (data.fieldName === 'project_classification_rid') {
      const selectedClassification = memoizedClassification.find(
        (option) => String(option.value) === String(data.fieldValue)
      );
      setShowClassifyOthersField(
        selectedClassification?.label.toLowerCase() === OthersEnum.Other
      );
    }
    if (data.fieldName === 'account_rid') {
      const selectedRid = data.fieldValue;
      let currencyValue = '';

      // Step 1: Check children first
      let foundChild = null;
      for (const acc of accounts) {
        foundChild = acc.child_accounts?.find(
          (childAcc) => childAcc.rid === selectedRid
        );
        if (foundChild) break;
      }

      if (foundChild) {
        // Child currency
        currencyValue = foundChild.currency_rid || '';
      }
      setCurrencyValue(currencyValue);
    }
    // Handle effort fields
    if (
      data.fieldName === 'total_effort_fte' ||
      data.fieldName === 'total_effort_subcon'
    ) {
      const isFte = data.fieldName === 'total_effort_fte';
      setIsEffortFteEdited(isFte ? !!data.fieldValue : isEffortFteEdited);
      setIsEffortSubconEdited(
        !isFte ? !!data.fieldValue : isEffortSubconEdited
      );
      setEffortFinancials((prev) => {
        const updated = {
          ...prev,
          [data.fieldName]: formatNumber(data.fieldValue as string),
        };

        if (!updated.total_effort_fte && !updated.total_effort_subcon) {
          updated.total_effort = '';
        } else {
          const sum = calculateTotalEffort(updated);
          updated.total_effort =
            sum % 1 === 0 ? sum.toString() : sum.toFixed(2);
        }

        return updated;
      });
    } else if (data.fieldName === 'total_effort') {
      setEffortFinancials((prev) => ({
        ...prev,
        [data.fieldName]: formatNumber(data.fieldValue as string),
      }));
    }

    // Handle cost fields
    if (
      data.fieldName === 'total_cost_fte' ||
      data.fieldName === 'total_cost_subcon' ||
      data.fieldName === 'total_cost_nonlabor'
    ) {
      if (data.fieldName === 'total_cost_fte')
        setIsCostFteEdited(!!data.fieldValue);
      if (data.fieldName === 'total_cost_subcon')
        setIsCostSubconEdited(!!data.fieldValue);
      if (data.fieldName === 'total_cost_nonlabor')
        setIsNonLaborCostEdited(!!data.fieldValue);

      setCostFinancials((prev) => {
        const updated = {
          ...prev,
          [data.fieldName]: removeFormatCostValue(data.fieldValue as string),
        };

        if (
          !updated.total_cost_fte &&
          !updated.total_cost_subcon &&
          !updated.total_cost_nonlabor
        ) {
          updated.total_cost = '';
        } else {
          const total = calculateTotalCost(updated);
          updated.total_cost =
            total % 1 === 0 ? total.toString() : total.toFixed(2);
        }

        return updated;
      });
    } else if (data.fieldName === 'total_cost') {
      setCostFinancials((prev) => ({
        ...prev,
        [data.fieldName]: formatNumber(data.fieldValue as string),
      }));
    }
  };

  useEffect(() => {
    if (account?.country) {
      setCurrentCountry(account?.country);
    }
  }, [account?.country]);

  useEffect(() => {
    const selectedIndustry = memoizedIndustry.find(
      (option) => String(option.value) === String(account?.industry_rid)
    );
    setShowOthersField(
      selectedIndustry?.label.toLowerCase() === OthersEnum.Other
    );
  }, [account?.industry_rid, memoizedIndustry]);

  useEffect(() => {
    const selectedClassification = memoizedClassification.find(
      (option) =>
        String(option.value) === String(account?.project_classification_rid)
    );
    setShowClassifyOthersField(
      selectedClassification?.label.toLowerCase() === OthersEnum.Other
    );
  }, [account?.project_classification_rid, memoizedClassification]);

  const disableTotalEffort = isEffortFteEdited || isEffortSubconEdited;
  const disableTotalCost =
    isCostFteEdited || isCostSubconEdited || isNonLaborCostEdited;

  const finalTotalCost =
    costFinancials.total_cost && costFinancials.total_cost !== '0'
      ? costFinancials.total_cost
      : '';

  const formConfig = FormData(
    memoizedStatus,
    memoizedProjectTypes,
    memoizedCountry,
    memoizedCurrency,
    memoizedState,
    memoizedIndustry,
    memoizedClassification,
    memoizedAccounts,
    // memoizedRole,
    keyContacts,
    addKeyContactInfo,
    removeKeyContactInfo,
    isEditView,
    showOthersField,
    showClassifyOthersField,
    states.isLoading,
    permissionMap,
    effortFinancials.total_effort || '',
    finalTotalCost,
    currencyValue,
    disableTotalEffort,
    disableTotalCost,
    globalType
  );

  const formLoading =
    allCountries.isLoading ||
    currency.isLoading ||
    industry.isLoading ||
    Classification.isLoading ||
    statusOptions.isLoading ||
    projectTypeOptions.isLoading ||
    keyContactRoles.isLoading ||
    loading;

  if (!accountIsEnable || !accountViewEnable) return <AccessRestricted />;

  const showSkeleton = formLoading || !isFormReadyForEdit;

  return (
    <>
      <div className='h-[50px] border-box flex items-center justify-between px-10 border-b-2 border-gray-200 sticky top-0 z-10 bg-white'>
        <div className='flex items-center w-[80%] max-w-[80%]'>
          {isEditView ? (
            <EditIcon
              alt='projrct-icon'
              className='h-6 w-6 bg-[#7D98B6] p-1.5 border-box rounded'
            />
          ) : (
            <ProjectCreateIcon
              alt='projrct-icon'
              className='h-6 w-6 bg-[#7D98B6] p-1.5 border-box rounded'
            />
          )}
          <div className='w-[90%]'>
            {isEditView && getProjectData?.isPending ? (
              <div className='ml-2'>
                <SingleSkeleton width={150} height={12} />
              </div>
            ) : (
              <div className='font-semibold text-[12px] leading-[20px] ml-2 text-[#7D98B6]'>
                {breadcrumbLabel}
              </div>
            )}
            <h4 className='ml-2 font-bold text-[16px] leading-[20px] tracking-[0] text-[#2D3E4F]'>
              {isEditView ? 'Edit Project' : 'Create Project'}
            </h4>
          </div>
        </div>
        <div className='flex gap-3'>
          <TextButton
            label='Save'
            loading={createProject.isPending || updateProject.isPending}
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
        {showSkeleton ? (
          <SkeletonForm />
        ) : (
          <FormBuilder
            data={formConfig}
            loading={false}
            values={
              isEditView
                ? {
                    ...projectData,
                    ...effortFinancials,
                    ...costFinancials,
                  }
                : {
                    project_status: defaultActiveValue,
                    status: defaultActiveValue,
                    auto_send_ai_interaction:
                      settings?.auto_send_interaction || enumValue.No,
                    auto_access_rd: settings?.auto_access_rd || enumValue.Yes,
                    max_ai_interaction: settings?.max_ai_interactions,
                    currency: settings?.currency_rid,
                    ...effortFinancials,
                    ...costFinancials,
                  }
            }
            outData={submitData}
            formRef={formRef}
            onChange={onChangeField}
            keyStart='project_startdate'
            keyEnd='project_enddate'
            layout={Layout.TYPE_1}
            newContactLength={9}
            keyContactHeaders={defaultKeyContactHeaders}
            highlight={highlight}
          />
        )}
      </div>
    </>
  );
};

export default ProjectForm;
