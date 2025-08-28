import React, { useEffect, useMemo, useState } from 'react';
import {
  useLocation,
  useNavigate,
  useParams,
  useSearchParams,
} from 'react-router-dom';
import { EditIcon, CreateResourceIcon } from '../../../../../../assets';
import { useToast } from '../../../../../../hooks';
import {
  AllPermissions,
  Layout,
  OnChange,
  useGetAllCountries,
  useGetStatus,
} from '../../../../../../common-service';
import {
  useFetchCurrency,
  useFetchState,
} from '../../../../../services/account';
import {
  OthersEnum,
  SelectOption,
  ResourceType,
  ProjectResourceNewPayload,
  SelectResourceOption,
  FormFiscalDateType,
} from '../../../../../types';
import TextButton from '../../../../../../components/button/text-button';
import { FormBuilder } from '../../../../../../components';
import {
  useCreateProjectResource,
  useProjectResourceDetail,
  useUpdateProjectResource,
} from '../../../../../services/project-resources/project-resource-service';
import { ProjectResourceFormData } from './form-data';
// import { useGetResourceType } from '../../../../../services/resource-list';
import {
  useGetProjectResourceCode,
  // useGetProjectResourceRollSkill,
  useGetProjectResourceSkillType,
} from '../../../../../services/project-resources/project-resources-form-service';
import { projectResourcesPayloadData } from './utils';
import { useSelector } from 'react-redux';
import { RootState } from '../../../../../../store/store';
import { formatDateToYYYYMMDDWithTime } from '../../../../../../common-utils';
import { RESOURCE_CREATE } from '../../../../../../routes';

const ProjectResourceForm: React.FC = () => {
  const formRef = React.useRef<HTMLFormElement>(null);
  const [currentCountry, setCurrentCountry] = useState('');
  const { successToast } = useToast();
  const location = useLocation();
  const [showSkillRoleOthersField, setShowSkillRoleOthersField] =
    useState(false);
  const [isResourceType, setIsResourceType] = useState(false);
  const [isSalaryRequired, setIsSalaryRequired] = useState(true);
  const [autoCalculatedValue, setAutoCalculatedValue] = useState<number>(0);
  const [, setResourceFinancials] = useState({
    salary: '',
    bonus: '',
    insurance: '',
    total_cost_pro_res: '',
    deductions: '',
  });
  const { resourceId } = useParams();
  const navigate = useNavigate();

  const [searchParams] = useSearchParams();
  const account_Id = searchParams.get('account_Id');
  const account_name = searchParams.get('account_name');
  const account_number = searchParams.get('account_number');
  const project_Id = searchParams.get('project_Id');
  const currency_rid = searchParams.get('currency_rid');
  const projectPFY = searchParams.get('PFY');
  const projectCode = searchParams.get('projectCode');
  const createdNewResourceCode =
    searchParams.get('created_resource_code') || '';
  const fiscalDate: FormFiscalDateType = projectPFY
    ? JSON.parse(projectPFY)
    : undefined;

  const getProjectResource = useProjectResourceDetail(
    account_Id as string,
    resourceId as string
  );
  const calculateAutoValue = ({
    salary = '0',
    bonus = '0',
    insurance = '0',
    total_cost_pro_res = '0',
    deductions = '0',
  }: {
    salary?: string;
    bonus?: string;
    insurance?: string;
    total_cost_pro_res?: string;
    deductions?: string;
  }) => {
    const s = parseFloat(salary) || 0;
    const b = parseFloat(bonus) || 0;
    const i = parseFloat(insurance) || 0;
    const r = parseFloat(total_cost_pro_res) || 0;
    const d = parseFloat(deductions) || 0;
    return s + b + i + r - d;
  };

  const projectResource = getProjectResource.data?.data;

  const projectResourceData = useMemo(
    () => ({
      ...projectResource?.projectResource,
      ...(projectResource?.projectResource && {
        updated_on: projectResource?.projectResource?.modified_datetime
          ? formatDateToYYYYMMDDWithTime(
              projectResource?.projectResource?.modified_datetime
            )
          : '-',
        created_on: projectResource?.projectResource?.created_datetime
          ? formatDateToYYYYMMDDWithTime(
              projectResource?.projectResource?.created_datetime
            )
          : null,
        created_by: projectResource?.projectResource?.created_name || null,
        modified_name: projectResource?.projectResource?.modified_name || '-',
      }),
    }),

    [projectResource]
  );

  // Permission Mangement
  const { permission } = useSelector((state: RootState) => state.permission);
  const projectViewEditFields = useMemo(
    () =>
      permission.find(
        (item) => item.name === AllPermissions.PROJECTS_RESOURCES_VIEW_EDIT
      )?.fields ?? [],
    [permission]
  );
  const permissionMap = useMemo(() => {
    const map: Record<string, { read: boolean; edit: boolean }> = {};
    projectViewEditFields.forEach((item) => {
      map[item.name] = { read: item.read ?? true, edit: item.edit ?? true };
    });
    return map;
  }, [projectViewEditFields]);

  const { data: projectResourceCodeOptions } = useGetProjectResourceCode(
    account_Id as string
  );
  // const projectResourceTypeOptions = useGetResourceType();
  const projectResourceSkillTypeOptions = useGetProjectResourceSkillType();
  // const projectResourceRollSkillOptions = useGetProjectResourceRollSkill();
  const statusOptions = useGetStatus();
  const allCountries = useGetAllCountries();
  const currency = useFetchCurrency();
  const states = useFetchState(currentCountry);
  // const city = useFetchCity(currentCountry.state);
  const createProjectResource = useCreateProjectResource();
  const updateProjectResource = useUpdateProjectResource();

  const isEditView = location.pathname.split('/').slice(-2, -1)[0] === 'edit';

  const commonSuccess =
    createProjectResource.isSuccess || updateProjectResource.isSuccess;
  useEffect(() => {
    if (commonSuccess) {
      successToast(
        isEditView
          ? 'Project Resource updated successfully'
          : 'Project Resource created successfully'
      );
      setShowSkillRoleOthersField(false);
      setIsResourceType(false);
      goBack();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [commonSuccess, isEditView]);

  const memoizedProjectResourceCode: SelectResourceOption[] = useMemo(
    () =>
      projectResourceCodeOptions?.data?.resourceCodes.map((item) => ({
        label: item.resource_code,
        value: item.resource_code,
        resource_type_rid: item.resource_type_rid,
        resource_type_name: item.resource_type_name,
      })) || [],
    [projectResourceCodeOptions?.data?.resourceCodes]
  );

  const memoizedProjectResourceSkillType: SelectOption[] = useMemo(
    () =>
      projectResourceSkillTypeOptions?.data?.data?.resourceRolesSubType.map(
        (item) => ({
          label: item.sub_type_name,
          value: item.rid,
        })
      ) || [],
    [projectResourceSkillTypeOptions?.data?.data?.resourceRolesSubType]
  );
  const memoizedStatus: SelectOption[] = useMemo(
    () =>
      statusOptions?.data?.data?.status.map((status) => ({
        label: status.status_name,
        value: status.rid,
      })) || [],
    [statusOptions?.data?.data?.status]
  );
  const memoizedCountry: SelectOption[] = useMemo(
    () =>
      allCountries.data?.data.country.map((country) => ({
        label: country.country_name,
        value: country.rid,
      })) || [],
    [allCountries.data?.data.country]
  );

  const memoizedCurrency: SelectOption[] = useMemo(
    () =>
      currency.data?.data.currency.map((account) => ({
        label: account.currency_name,
        value: account.rid,
      })) || [],
    [currency.data?.data.currency]
  );

  const memoizedState: SelectOption[] = useMemo(
    () =>
      states.data?.data.states.map((state) => ({
        label: state.state_name,
        value: state.rid,
      })) || [],
    [states.data?.data.states]
  );

  const submitData = (formValues: Partial<ProjectResourceNewPayload>) => {
    const updated_resource_rid = isEditView ? (resourceId as string) : '';
    const projectResourceFormData = projectResourcesPayloadData(
      {
        ...formValues,
        project_fiscal_rid: project_Id ?? '',
        account_rid: account_Id ?? '',
      },
      updated_resource_rid,
      isEditView,
      showSkillRoleOthersField,
      isResourceType
    );
    if (isEditView) {
      updateProjectResource.mutate(projectResourceFormData);
    } else {
      createProjectResource.mutate(projectResourceFormData);
    }
  };

  const handleExternalSubmit = () => {
    formRef.current?.requestSubmit();
  };

  const goBack = () => {
    if (createdNewResourceCode) {
      navigate(-2);
    } else {
      window.history.back();
    }
  };

  const defaultActiveValue = useMemo(() => {
    const activeOption = memoizedStatus.find(
      (option) => option.label.toLowerCase() === 'active'
    );
    return activeOption?.value || '';
  }, [memoizedStatus]);

  const handleCreateNewResource = (resCode?: string) => {
    const queryParams = new URLSearchParams({
      account_id: account_Id || '',
      account_name: account_name || '',
      acc_number: account_number || '',
      new_res_code: resCode || '',
    });
    navigate(`${RESOURCE_CREATE}?${queryParams.toString()}`, {
      state: { from: location },
    });
  };

  const onChangeField = (data: OnChange) => {
    if (data.fieldName === 'country_rid') {
      setCurrentCountry(data.fieldValue as string);
    }
    if (data.fieldName === 'resource_code') {
      const selectedResource = memoizedProjectResourceCode.find(
        (option) => String(option.value) === String(data.fieldValue)
      );
      if (selectedResource) {
        setIsResourceType(
          selectedResource?.resource_type_name?.toLowerCase() ===
            ResourceType.full_time
        );
      } else {
        handleCreateNewResource(data.fieldValue as string);
      }
    }

    if (data.fieldName === 'assigned_skill_role_type_rid') {
      const selectedSkillSubType = memoizedProjectResourceSkillType.find(
        (option) => String(option.value) === String(data.fieldValue)
      );
      setShowSkillRoleOthersField(
        selectedSkillSubType?.label.toLowerCase() === OthersEnum.Other
      );
    }
    if (
      [
        'salary',
        'bonus',
        'insurance',
        'total_cost_pro_res',
        'deductions',
      ].includes(data.fieldName)
    ) {
      setResourceFinancials((prev) => {
        const updated = {
          ...prev,
          [data.fieldName]: data.fieldValue as string,
        };

        const salary = parseFloat(updated.salary) || 0;
        const bonus = parseFloat(updated.bonus) || 0;
        const insurance = parseFloat(updated.insurance) || 0;
        const resourceCost = parseFloat(updated.total_cost_pro_res) || 0;
        const deductions = parseFloat(updated.deductions) || 0;

        const total = salary + bonus + insurance + resourceCost - deductions;
        setAutoCalculatedValue(parseFloat(total.toFixed(2)));

        return updated;
      });
    }
    if (data.fieldName === 'salary') {
      const salaryValue = (data.fieldValue as string).trim();
      setIsSalaryRequired(salaryValue === '');
    }
  };
  useEffect(() => {
    if (projectResourceData?.country_rid) {
      setCurrentCountry(projectResourceData?.country_rid);
    }
  }, [projectResourceData?.country_rid]);

  useEffect(() => {
    const selectedProjectResourceType = memoizedProjectResourceCode.find(
      (option) =>
        String(option.value) === String(projectResourceData?.resource_code)
    );

    setIsResourceType(
      selectedProjectResourceType?.resource_type_name?.toLowerCase() ===
        ResourceType.full_time
    );
  }, [
    memoizedProjectResourceCode,
    projectResourceData,
    projectResourceData.resource_type_name,
  ]);

  useEffect(() => {
    const selectedSkillSubType = memoizedProjectResourceSkillType.find(
      (option) =>
        String(option.value) ===
        String(projectResourceData?.assigned_skill_role_type_rid)
    );

    setShowSkillRoleOthersField(
      selectedSkillSubType?.label.toLowerCase() === OthersEnum.Other
    );
  }, [
    memoizedProjectResourceSkillType,
    projectResourceData?.assigned_skill_role_type_rid,
  ]);
  useEffect(() => {
    const financials = {
      salary: projectResource?.projectResource?.salary || '',
      bonus: projectResource?.projectResource?.bonus || '',
      insurance: projectResource?.projectResource?.insurance || '',
      total_cost_pro_res:
        projectResource?.projectResource?.total_cost_pro_res || '',
      deductions: projectResource?.projectResource?.deductions || '',
    };
    setResourceFinancials({
      salary: String(financials.salary),
      bonus: String(financials.bonus),
      insurance: String(financials.insurance),
      total_cost_pro_res: String(financials.total_cost_pro_res),
      deductions: String(financials.deductions),
    });
    const total = calculateAutoValue({
      salary: String(financials.salary),
      bonus: String(financials.bonus),
      insurance: String(financials.insurance),
      total_cost_pro_res: String(financials.total_cost_pro_res),
      deductions: String(financials.deductions),
    });
    setAutoCalculatedValue(parseFloat(total.toFixed(2)));

    setIsSalaryRequired(
      projectResource?.projectResource?.salary === null ||
        projectResource?.projectResource?.salary === undefined ||
        projectResource?.projectResource?.salary === 0
    );
  }, [projectResource]);
  const formConfig = ProjectResourceFormData(
    memoizedProjectResourceCode,
    // memoizedProjectTypes,
    // memoizedProjectResourceSkillType,
    // memoizedProjectResourceRollSkill,
    memoizedStatus,
    memoizedCountry,
    memoizedState,
    memoizedCurrency,
    // showSkillRoleOthersField,
    isResourceType,
    states.isLoading,
    autoCalculatedValue,
    isSalaryRequired,
    isEditView,
    fiscalDate,
    permissionMap
  );

  return (
    <>
      <div className='h-[50px] border-box flex items-center justify-between px-10 border-b-2 border-gray-200 sticky top-0 z-10 bg-white'>
        <div className='flex items-center w-[80%] max-w-[80%]'>
          {isEditView ? (
            <EditIcon
              alt='projrct-resource-icon'
              className='h-6 w-6 bg-[#7D98B6] p-1.5 border-box rounded'
            />
          ) : (
            <CreateResourceIcon
              alt='projrct-resource-icon'
              className='h-6 w-6 bg-[#7D98B6] p-1.5 border-box rounded'
            />
          )}

          <div>
            <div className='font-semibold text-[11px] leading-[20px] ml-2 text-[#7D98B6]'>
              Project &gt; {projectCode || ''}{' '}
              {isEditView && `> ${projectResourceData.resource_code || ''}`}
            </div>
            {isEditView && (
              <h4 className='font-bold text-lg ml-2 leading-4'>
                Edit Project Resource
              </h4>
            )}
            {!isEditView && (
              <h4 className='font-bold text-lg ml-2 leading-4'>
                New Project Resource
              </h4>
            )}
          </div>
        </div>
        <div className='flex gap-3'>
          <TextButton
            label='Save'
            loading={
              createProjectResource.isPending || updateProjectResource.isPending
            }
            onClick={handleExternalSubmit}
          />
          <TextButton label='Cancel' color='inherit' onClick={goBack} />
        </div>
      </div>
      <div className='pb-4'>
        <FormBuilder
          data={formConfig}
          loading={allCountries.isLoading || currency.isLoading}
          values={
            isEditView && projectResourceData
              ? { ...projectResourceData }
              : !isEditView
                ? {
                    currency_rid: currency_rid,
                    status_rid: defaultActiveValue,
                    resource_code: createdNewResourceCode,
                  }
                : {}
          }
          outData={submitData}
          formRef={formRef}
          layout={Layout.TYPE_1}
          onChange={onChangeField}
          keyStart='start_date'
          keyEnd='end_date'
          isFrom='project_resource'
        />
      </div>
    </>
  );
};

export default ProjectResourceForm;
