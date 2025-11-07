import React, { useEffect, useMemo, useState } from 'react';
import { TaskTemplateIcon } from '../../../../assets';
import SingleSkeleton from '../../../../components/skeleton-component/singleskeleton';
import { useToast } from '../../../../hooks';
import { useLocation, useParams } from 'react-router-dom';
import {
  useCreateTaskTemplate,
  useGetTaskAssigneRoleTypes,
  useGetTaskCheckListTypes,
  useGetTaskMilestoneTypes,
  useGetTaskPriorityTypes,
  useGetTaskTemplateTypes,
  useTaskTemplateDetails,
  useUpdateTaskTemplateDetails,
} from '../../../service/task-template/task-template-service';
import { formatDateToYYYYMMDDWithTime } from '../../../../common-utils';
import { TaskTemplateFormData } from '../../../types';
import SkeletonForm from '../../../../components/form-builder/skeleton-form';
import { FormBuilder } from '../../../../components';
import { Layout, OnChange, useGetStatus } from '../../../../common-service';
import TextButton from '../../../../components/button/text-button';
import { transformTaskTemplatePayload } from './utils';
import { TaskTemplateFormFieldsData } from './form-data';
import { SelectOption } from '../../../../consultant/types';

const TaskTemplateForm: React.FC = () => {
  const formRef = React.useRef<HTMLFormElement>(null);
  const [taskType, setTaskType] = useState(false);
  const { successToast } = useToast();
  const location = useLocation();
  const { templateId } = useParams();
  const isEditView = location.pathname.split('/').slice(-2, -1)[0] === 'edit';
  const statusOptions = useGetStatus();
  const taskTemplateTypes = useGetTaskTemplateTypes();
  const taskMilestoneTypes = useGetTaskMilestoneTypes();
  const taskPrioritytTypes = useGetTaskPriorityTypes();
  const taskCheckListTypes = useGetTaskCheckListTypes();
  const taskAssigneRoleTypes = useGetTaskAssigneRoleTypes();
  const createTaskTemplate = useCreateTaskTemplate();
  const updateTaskTemplate = useUpdateTaskTemplateDetails();

  const { data: taskTemplateData, isLoading } = useTaskTemplateDetails(
    templateId || ''
  );

  const commonSuccess =
    createTaskTemplate.isSuccess || updateTaskTemplate.isSuccess;

  useEffect(() => {
    if (commonSuccess) {
      successToast(
        isEditView
          ? 'Task Template updated successfully'
          : 'Task Template created successfully'
      );
      goBack();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [commonSuccess, isEditView]);

  const taskTemplateFormData = useMemo(
    () => ({
      ...taskTemplateData,
      ...(taskTemplateData && {
        task_name: taskTemplateData.task_name || '',
        task_type: taskTemplateData.task_type_rid || '',
        efforts: taskTemplateData.efforts || '',
        task_description: taskTemplateData.task_description || '',
        record_id: taskTemplateData.rid || '',
        created_on: formatDateToYYYYMMDDWithTime(
          taskTemplateData.created_datetime
        ),
        created_by: taskTemplateData.created_by || '',
        template_id: taskTemplateData.r_number || '',
        updated_on: taskTemplateData.modified_datetime
          ? formatDateToYYYYMMDDWithTime(taskTemplateData.modified_datetime)
          : '-',
        updated_by: taskTemplateData.modified_by || '-',
      }),
    }),
    [taskTemplateData]
  );

  const taskTemplateTypesOptions = useMemo(() => {
    return (
      taskTemplateTypes?.data?.data?.map((item) => ({
        value: item.rid,
        label: item.task_type_name,
      })) || []
    );
  }, [taskTemplateTypes]);

  const taskMilestoneTypesOptions = useMemo(() => {
    return (
      taskMilestoneTypes?.data?.data?.map((item) => ({
        value: item.rid,
        label: item.milestone_name,
      })) || []
    );
  }, [taskMilestoneTypes]);
  const taskPrioritytTypesTypesOptions = useMemo(() => {
    return (
      taskPrioritytTypes?.data?.data?.map((item) => ({
        value: item.rid,
        label: item.priority_name,
      })) || []
    );
  }, [taskPrioritytTypes]);
  const taskCheckListTypesTypesOptions = useMemo(() => {
    return (
      taskCheckListTypes?.data?.data?.map((item) => ({
        value: item.rid,
        label: item.checklist_name,
      })) || []
    );
  }, [taskCheckListTypes]);
  const taskAssigneRoleTypesTypesOptions = useMemo(() => {
    return (
      taskAssigneRoleTypes?.data?.data?.caseRoles?.map((item) => ({
        value: item.rid,
        label: item.role_name,
      })) || []
    );
  }, [taskAssigneRoleTypes]);
  const memoizedStatus: SelectOption[] = useMemo(
    () =>
      statusOptions?.data?.data?.status.map((status) => ({
        label: status?.status_name,
        value: status?.rid,
        desc: status?.status_description,
      })) || [],
    [statusOptions?.data?.data?.status]
  );

  const submitData = (formValues: Partial<TaskTemplateFormData>) => {
    const payload = transformTaskTemplatePayload(
      formValues,
      isEditView,
      taskTemplateData
    );
    if (isEditView) {
      updateTaskTemplate.mutate(payload);
    } else {
      createTaskTemplate.mutate(payload);
    }
  };

  const handleExternalSubmit = () => {
    formRef.current?.requestSubmit();
  };
  const onChangeField = (data: OnChange) => {
    if (data.fieldName === 'task_type_rid') {
      const targetId = 'D001-43aaca8b-0c9a-4165-bf6a-93cada5c11d1';
      const isMatch = data.fieldValue === targetId;
      setTaskType(isMatch);
    }
  };

  const goBack = () => {
    window.history.back();
  };
  const defaultActiveValue = useMemo(() => {
    const activeOption = memoizedStatus.find(
      (option) => option?.label?.toLowerCase() === 'active'
    );
    return activeOption?.value || '';
  }, [memoizedStatus]);
  const formConfig = TaskTemplateFormFieldsData(
    isEditView,
    taskTemplateTypesOptions,
    taskMilestoneTypesOptions,
    taskPrioritytTypesTypesOptions,
    taskCheckListTypesTypesOptions,
    taskAssigneRoleTypesTypesOptions,
    memoizedStatus,
    taskType
  );

  const formLoading = isLoading || taskTemplateTypes.isPending;

  return (
    <div>
      <div className='h-[50px] flex items-center justify-between px-10 sticky top-0 z-10 bg-white'>
        <div className='flex items-center w-[80%] max-w-[80%]'>
          <TaskTemplateIcon
            alt='task-template-icon'
            className='h-7 w-7 p-1.5 rounded [&>path]:stroke-[#fff] bg-[#9747FF]'
          />
          <div className='w-[90%]'>
            {isLoading ? (
              <div className='ml-2'>
                <SingleSkeleton width={150} height={12} />
              </div>
            ) : (
              <div className='font-semibold text-[12px] leading-[20px] ml-2 mb-[-6px] text-[#7D98B6]'>
                {`Task Template ${isEditView ? `> ${taskTemplateData?.r_number}` : ''}`}
              </div>
            )}
            <h5 className='text-[16px] font-bold ml-2 mt-0.5 text-[#2D3E4F]'>
              {isEditView ? 'Edit Template' : 'Create Template'}
            </h5>
          </div>
        </div>
        <div className='flex gap-3'>
          <TextButton
            label='Save'
            loading={
              createTaskTemplate.isPending || updateTaskTemplate.isPending
            }
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
            disabled={
              createTaskTemplate.isPending || updateTaskTemplate.isPending
            }
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
              isEditView && taskTemplateFormData
                ? {
                    ...taskTemplateFormData,
                  }
                : {
                    status: defaultActiveValue,
                    reminder_interval: 2,
                  }
            }
            outData={submitData}
            formRef={formRef}
            onChange={onChangeField}
            layout={Layout.TYPE_1}
          />
        )}
      </div>
    </div>
  );
};

export default TaskTemplateForm;
