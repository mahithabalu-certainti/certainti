/* eslint-disable @typescript-eslint/no-explicit-any */
import React, {
  useEffect, useMemo,
  // useState
} from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { EditIcon, CreateResourceIcon } from '../../../../../../assets';
import { useToast } from '../../../../../../hooks';
import {
  AllPermissions,
  Layout,
  OnChange,
  // useGetAllCountries 
} from '../../../../../../common-service';
// import {
// useFetchCurrency,
// useFetchState,
// } from '../../../../../services/account';
import {
  // SelectOption, 
  SelectResourceOption
} from '../../../../../types';
import TextButton from '../../../../../../components/button/text-button';
import { FormBuilder } from '../../../../../../components';
import { ProjectTaskFormData } from './form-data';
import {
  useCreateProjectTask,
  useProjectTaskDetail,
  useUpdateProjectTask,
} from '../../../../../services/project/project-task-service';
import { projectTaskPayloadData } from './utils';
import { ProjectTaskInput } from '../../../../../types/project-task';
import { useGetProjectResourceCode } from '../../../../../services/project-resources/project-resources-form-service';
import { useSelector } from 'react-redux';
import { RootState } from '../../../../../../store/store';
import { FiscalYearType } from '../../../../../types/project';

const ProjectTaskForm: React.FC = () => {
  const formRef = React.useRef<HTMLFormElement>(null);

  // const [currentCountry, setCurrentCountry] = useState('');
  const { successToast } = useToast();
  const location = useLocation();
  const { taskId } = useParams();
  const queryParams = new URLSearchParams(location.search);
  const account_Id = queryParams.get('account_Id');
  const project_Id = queryParams.get('project_Id');
  const projectPFY = queryParams.get('PFY');
  const fiscalYear: FiscalYearType | undefined = projectPFY
    ? JSON.parse(projectPFY)
    : undefined;
  const getProjectTask = useProjectTaskDetail(taskId as string, account_Id as string);
  const projectTask = getProjectTask.data;
  const projectTaskDetailsData = useMemo(
    () => ({
      ...projectTask?.data,
    }),
    [projectTask]
  );

  // const allCountries = useGetAllCountries();
  // const currency = useFetchCurrency();
  // const state = useFetchState(currentCountry);
  // const city = useFetchCity(currentCountry.state);
  const createProjectTask = useCreateProjectTask();
  const updateProjectTask = useUpdateProjectTask();
  const isEditView = location.pathname.split('/').slice(-2, -1)[0] === 'edit';
  const { data: projectResourceCodeOptions } = useGetProjectResourceCode(
    account_Id as string
  );
  const commonSuccess =
    createProjectTask.isSuccess || updateProjectTask.isSuccess;
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
  const projectViewEditFields = useMemo(
    () =>
      permission.find(
        (item) => item.name === AllPermissions.PROJECTS_TASK_VIEW_EDIT
      )?.fields ?? [],
    [permission]
  );
  const permissionMapTaskForm = useMemo(() => {
    const map: Record<string, { read: boolean; edit: boolean }> = {};
    projectViewEditFields.forEach((item) => {
      map[item.name] = { read: item.read ?? true, edit: item.edit ?? true };
    });
    return map;
  }, [projectViewEditFields]);

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
  // const memoizedCountry: SelectOption[] = useMemo(
  //   () =>
  //     allCountries.data?.data.country.map((country) => ({
  //       label: country.country_name,
  //       value: country.rid,
  //     })) || [],
  //   [allCountries.data?.data.country]
  // );

  // const memoizedCurrency: SelectOption[] = useMemo(
  //   () =>
  //     currency.data?.data.currency.map((account) => ({
  //       label: account.currency_name,
  //       value: account.rid,
  //     })) || [],
  //   [currency.data?.data.currency]
  // );

  // const memoizedState: SelectOption[] = useMemo(
  //   () =>
  //     state.data?.data.states.map((state) => ({
  //       label: state.state_name,
  //       value: state.rid,
  //     })) || [],
  //   [state.data?.data.states]
  // );

  //   const memoizeCity: SelectOption[] = useMemo(
  //     () =>
  //       city.data?.data.cities.map((role) => ({
  //         label: role.city_name,
  //         value: role.rid,
  //       })) || [],
  //     [city.data?.data.cities]
  //   );

  const submitData = (formValues: Partial<ProjectTaskInput>) => {
    const project_task_rid = isEditView ? (taskId as string) : '';
    const projectTaskData = projectTaskPayloadData(
      {
        ...formValues,
        account_rid: account_Id || undefined,
        project_fiscal_rid: isEditView ? projectTaskDetailsData?.project_fiscal_rid : project_Id || undefined,
      },
      project_task_rid,
      isEditView
    );

    if (isEditView) {
      updateProjectTask.mutate(projectTaskData);
    } else {
      createProjectTask.mutate(projectTaskData);
    }
  };

  const handleExternalSubmit = () => {
    formRef.current?.requestSubmit();
  };

  const goBack = () => {
    window.history.back();
  };

  const onChangeField = (data: OnChange) => {
    console.log("data", data)
    // if (data.fieldName === 'country_rid') {
    //   setCurrentCountry(data.fieldValue as string);
    // }
  };

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
              Project {'>'} {projectTaskDetailsData?.resource_code}
            </div>
            {isEditView && (
              <h4 className='font-bold text-lg ml-2 leading-4'>
                Edit Project Task
              </h4>
            )}
            {!isEditView && (
              <h4 className='font-bold text-lg ml-2 leading-4'>
                New Project Task
              </h4>
            )}
          </div>
        </div>
        <div className='flex gap-3'>
          <TextButton
            label='Save'
            loading={createProjectTask.isPending || updateProjectTask.isPending}
            onClick={handleExternalSubmit}
          />
          <TextButton label='Cancel' color='inherit' onClick={goBack} />
        </div>
      </div>
      <div className='pb-4'>
        <FormBuilder
          data={ProjectTaskFormData(
            memoizedProjectResourceCode,
            // memoizedCountry,
            // memoizedState,
            // memoizeCity,
            // memoizedCurrency,
            // state.isLoading
            // city.isLoading,
            // currency.isLoading,
            // disableFields,
            isEditView,
            fiscalYear,
            permissionMapTaskForm
          )}
          // loading={allCountries.isLoading || state.isLoading}
          values={
            isEditView && projectTaskDetailsData ? { ...projectTaskDetailsData } : undefined
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

export default ProjectTaskForm;
