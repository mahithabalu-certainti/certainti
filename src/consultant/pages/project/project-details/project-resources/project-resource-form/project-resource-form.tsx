import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useParams, useSearchParams } from 'react-router-dom';
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

const ProjectResourceForm: React.FC = () => {
  const formRef = React.useRef<HTMLFormElement>(null);
  const [currentCountry, setCurrentCountry] = useState('');
  const { successToast } = useToast();
  const location = useLocation();
  const [showSkillRoleOthersField, setShowSkillRoleOthersField] =
    useState(false);
  const [isResourceType, setIsResourceType] = useState(false);
  const { resourceId } = useParams();

  const [searchParams] = useSearchParams();
  const account_Id = searchParams.get('account_Id');
  const project_Id = searchParams.get('project_Id');
  const currency_rid = searchParams.get('currency_rid');
  const projectPFY = searchParams.get('PFY');
  const projectCode = searchParams.get('projectCode');
  const fiscalDate: FormFiscalDateType = projectPFY
    ? JSON.parse(projectPFY)
    : undefined;

  const getProjectResource = useProjectResourceDetail(
    account_Id as string,
    resourceId as string
  );

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
    window.history.back();
  };

  const onChangeField = (data: OnChange) => {
    if (data.fieldName === 'country_rid') {
      setCurrentCountry(data.fieldValue as string);
    }
    if (data.fieldName === 'resource_code') {
      const selectedResource = memoizedProjectResourceCode.find(
        (option) => String(option.value) === String(data.fieldValue)
      );

      setIsResourceType(
        selectedResource?.resource_type_name?.toLowerCase() ===
          ResourceType.full_time
      );
    }
    if (data.fieldName === 'assigned_skill_role_type_rid') {
      const selectedSkillSubType = memoizedProjectResourceSkillType.find(
        (option) => String(option.value) === String(data.fieldValue)
      );
      setShowSkillRoleOthersField(
        selectedSkillSubType?.label.toLowerCase() === OthersEnum.Other
      );
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
              : { currency_rid: currency_rid }
          }
          outData={submitData}
          formRef={formRef}
          layout={Layout.TYPE_1}
          onChange={onChangeField}
          keyStart='start_date'
          keyEnd='end_date'
        />
      </div>
    </>
  );
};

export default ProjectResourceForm;
