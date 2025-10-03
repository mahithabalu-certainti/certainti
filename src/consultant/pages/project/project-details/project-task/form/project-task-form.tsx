/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useMemo } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { EditIcon, CreateResourceIcon } from '../../../../../../assets';
import { useToast } from '../../../../../../hooks';
import {
  AllPermissions,
  Layout,
  OnChange,
} from '../../../../../../common-service';
import { FormFiscalDateType, SelectResourceOption } from '../../../../../types';
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
import {
  useGetProjectResourceTaskCode,
  useGetProjectResourceTaskType,
} from '../../../../../services/project-resources/project-resources-form-service';
import { useSelector } from 'react-redux';
import { RootState } from '../../../../../../store/store';
import {
  formatDateToYYYYMMDDWithTime,
  getDateFormatYYYYMMDD,
} from '../../../../../../common-utils';
import { PROJECT_RESOURCE_CREATE } from '../../../../../../routes';
import ConfirmationPopup from '../../../../../../common-utils/confirmation-popup';
import SkeletonForm from '../../../../../../components/form-builder/skeleton-form';

const ProjectTaskForm: React.FC = () => {
  const formRef = React.useRef<HTMLFormElement>(null);
  const { successToast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const { taskId } = useParams();
  const queryParams = new URLSearchParams(location.search);
  const account_Id = queryParams.get('account_Id');
  const account_name = queryParams.get('account_name');
  const account_number = queryParams.get('account_number');
  const project_Id = queryParams.get('project_Id');
  const projectPFY = queryParams.get('PFY');
  const projectCode = queryParams.get('projectCode');
  const currency_rid = queryParams.get('currency_rid');
  const createdNewResourceCode = queryParams.get('created_resource_code') || '';
  const pathCount = queryParams.get('path_count') || '';
  const [confirmationState, setConfirmationState] = React.useState<{
    isOpen: boolean;
    message: string;
    onConfirm: () => void;
  }>({ isOpen: false, message: '', onConfirm: () => {} });
  const [costResourceForceSuccess, setCostResourceForceSuccess] =
    React.useState(false);
  const [currentResourceCode, setCurrentResourceCode] =
    React.useState<string>('');
  const fiscalDate: FormFiscalDateType = projectPFY
    ? JSON.parse(projectPFY)
    : undefined;
  const getProjectTask = useProjectTaskDetail(
    taskId as string,
    account_Id as string
  );
  const projectTask = getProjectTask.data;
  const projectTaskDetailsData = useMemo(
    () => ({
      ...projectTask?.data,
      ...(projectTask?.data && {
        start_date: getDateFormatYYYYMMDD(projectTask?.data.start_date),
        end_date: getDateFormatYYYYMMDD(projectTask?.data.end_date),
        created_datetime:
          formatDateToYYYYMMDDWithTime(projectTask?.data.created_datetime) ||
          '-',
        created_by: projectTask?.data.created_by || '-',
        modified_datetime:
          formatDateToYYYYMMDDWithTime(projectTask?.data.modified_datetime) ||
          '-',
        modified_by: projectTask?.data.modified_by || '-',
      }),
    }),
    [projectTask]
  );

  const createProjectTask = useCreateProjectTask();
  const updateProjectTask = useUpdateProjectTask();
  const isEditView = location.pathname.split('/').slice(-2, -1)[0] === 'edit';
  const payload = {
    account_rid: account_Id || undefined,
    search: '',
    project_fiscal_rid: project_Id || undefined,
  };

  const { data: projectResourceCodeOptions, isLoading: resCodeLoading } =
    useGetProjectResourceTaskCode(payload);
  const type = 'type';
  const { data: projectResourceTypeOptions, isLoading: taskTypeLoading } =
    useGetProjectResourceTaskType(type);
  const classification = 'classification';
  const {
    data: projectResourceClassificationOptions,
    isLoading: classificationLoading,
  } = useGetProjectResourceTaskType(classification);
  const commonSuccess = costResourceForceSuccess;
  useEffect(() => {
    if (commonSuccess) {
      successToast(
        isEditView
          ? 'Project Task updated successfully'
          : 'Project Task created successfully'
      );
      goBack();
    }
  }, [commonSuccess, isEditView]);

  useEffect(() => {
    if (isEditView) {
      setCurrentResourceCode(projectTaskDetailsData?.resource_code || '');
    }
  }, [isEditView, projectTaskDetailsData?.resource_code]);

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
      projectResourceCodeOptions?.data?.map((item) => ({
        label: `${item.resource_code}${item.project_resource_role ? ` (${item.project_resource_role})` : ''}`,
        value: item.rid,
      })) || [],
    [projectResourceCodeOptions?.data]
  );
  const memoizedProjectResourceType: SelectResourceOption[] = useMemo(
    () =>
      projectResourceTypeOptions?.data?.projectTaskTypes?.map((item) => ({
        label: item.project_task_type_name,
        value: item.rid,
      })) || [],
    [projectResourceTypeOptions?.data?.projectTaskTypes]
  );
  const memoizedProjectResourceClassification: SelectResourceOption[] = useMemo(
    () =>
      projectResourceClassificationOptions?.data?.projectTaskClassification?.map(
        (item) => ({
          label: item.classification_name ?? '',
          value: item.rid,
        })
      ) || [],
    [projectResourceClassificationOptions?.data?.projectTaskClassification]
  );
  useEffect(() => {
    if (createdNewResourceCode) {
      const selectedResource = projectResourceCodeOptions?.data?.find(
        (item) => String(item.rid) === String(createdNewResourceCode)
      );
      setCurrentResourceCode(selectedResource?.resource_code || '');
    }
  }, [createdNewResourceCode, projectResourceCodeOptions?.data]);

  const submitData = (formValues: Partial<ProjectTaskInput>) => {
    const project_task_rid = isEditView ? (taskId as string) : '';
    const projectTaskData = projectTaskPayloadData(
      {
        ...formValues,
        account_rid: account_Id || undefined,
        project_fiscal_rid: isEditView
          ? projectTaskDetailsData?.project_fiscal_rid
          : project_Id || undefined,
        user_preference: confirmationState.message ? 'accept' : '',
      },
      project_task_rid,
      isEditView,
      currentResourceCode
    );

    if (isEditView) {
      updateProjectTask.mutate(projectTaskData, {
        onSuccess: (response) => {
          if (response?.statusCode === 210) {
            setConfirmationState({
              isOpen: true,
              message:
                response.statusMessage ||
                'Compensation details already exists for the resource',
              onConfirm: () => {
                const updatedFormValues = {
                  ...projectTaskData,
                  user_preference: 'accept',
                };
                updateProjectTask.mutate(updatedFormValues, {
                  onSuccess: () => {
                    setCostResourceForceSuccess(true);
                  },
                });
                setConfirmationState((prev) => ({
                  ...prev,
                  isOpen: false,
                  message: '',
                }));
              },
            });
          } else if (response?.statusCode === 200) {
            setCostResourceForceSuccess(true);
          }
        },
        onError: (error) => {
          console.error('Update failed:', error);
        },
      });
    } else {
      createProjectTask.mutate(projectTaskData, {
        onSuccess: (response) => {
          if (response?.statusCode === 210) {
            setConfirmationState({
              isOpen: true,
              message:
                response.statusMessage ||
                'Compensation details already exists for the resource',
              onConfirm: () => {
                const updatedFormValues = {
                  ...projectTaskData,
                  user_preference: 'accept',
                };
                createProjectTask.mutate(updatedFormValues, {
                  onSuccess: () => {
                    setCostResourceForceSuccess(true);
                  },
                });
                setConfirmationState((prev) => ({
                  ...prev,
                  isOpen: false,
                  message: '',
                }));
              },
            });
          } else if (response?.statusCode === 200) {
            setCostResourceForceSuccess(true);
          }
        },
        onError: (error) => {
          console.error('Update failed:', error);
        },
      });
    }
  };

  const handleCreateNewProjectResource = (resCode?: string) => {
    const queryParams = new URLSearchParams({
      account_Id: account_Id || '',
      project_Id: project_Id || '',
      account_name: account_name || '',
      account_number: account_number || '',
      PFY: JSON.stringify(projectPFY),
      source: 'createProjectResource',
      currency_rid: currency_rid ?? '',
      projectCode: projectCode ?? '',
      new_project_res_name: resCode || '',
    });
    navigate(`${PROJECT_RESOURCE_CREATE}?${queryParams.toString()}`, {
      state: { from: location },
    });
  };

  const onChangeField = (data: OnChange) => {
    if (data.fieldName === 'project_resource_rid') {
      const selectedResource = projectResourceCodeOptions?.data?.find(
        (item) => String(item.rid) === String(data.fieldValue)
      );
      if (selectedResource) {
        setCurrentResourceCode(selectedResource.resource_code);
      } else if (!selectedResource && data.isCreate) {
        handleCreateNewProjectResource(data.fieldValue as string);
      }
    }
  };

  const handleExternalSubmit = () => {
    formRef.current?.requestSubmit();
  };

  const goBack = () => {
    if (createdNewResourceCode) {
      navigate(pathCount ? -3 : -2);
    } else {
      window.history.back();
    }
  };

  const isFormLoading =
    resCodeLoading || taskTypeLoading || classificationLoading;

  const formConfig = ProjectTaskFormData(
    memoizedProjectResourceCode,
    memoizedProjectResourceType,
    memoizedProjectResourceClassification,
    isEditView,
    fiscalDate,
    permissionMapTaskForm
  );

  return (
    <>
      <div className='h-[50px] border-box flex items-center justify-between px-10 border-b-2 border-gray-200 sticky top-0 z-10 bg-white'>
        <div className='flex items-center w-[80%] max-w-[80%]'>
          {isEditView ? (
            <EditIcon
              alt='projrct-resource-icon'
              className='h-8 w-8 mt-1.5 bg-[#7D98B6] p-2 border-box rounded'
            />
          ) : (
            <CreateResourceIcon
              alt='projrct-resource-icon'
              className='h-8 w-8 [&>path:first-child]:fill-[#7D98B6] mt-1.5 border-box rounded'
            />
          )}

          <div>
            <div className='font-semibold text-[11px] leading-[20px] ml-2 text-[#7D98B6]'>
              Project &gt; {projectCode || ''}{' '}
              {isEditView && `> ${projectTaskDetailsData.resource_code || ''}`}
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
        {isFormLoading ? (
          <SkeletonForm />
        ) : (
          <FormBuilder
            data={formConfig}
            values={
              isEditView && projectTaskDetailsData
                ? { ...projectTaskDetailsData }
                : !isEditView
                  ? { project_resource_rid: createdNewResourceCode }
                  : {}
            }
            outData={submitData}
            formRef={formRef}
            layout={Layout.TYPE_1}
            onChange={onChangeField}
            keyStart='start_date'
            keyEnd='end_date'
          />
        )}
      </div>
      <div>
        <ConfirmationPopup
          isOpen={confirmationState.isOpen}
          message={confirmationState.message}
          onConfirm={() => {
            confirmationState.onConfirm();
            setConfirmationState((prev) => ({
              ...prev,
              isOpen: false,
              message: '',
            }));
          }}
          onCancel={() => {
            setConfirmationState((prev) => ({
              ...prev,
              isOpen: false,
              message: '',
            }));
          }}
        />
      </div>
    </>
  );
};

export default ProjectTaskForm;
