import React, { useEffect, useMemo } from 'react';
import { TaskTemplateIcon } from '../../../../assets';
import SingleSkeleton from '../../../../components/skeleton-component/singleskeleton';
import { useToast } from '../../../../hooks';
import { useLocation, useParams } from 'react-router-dom';
import {
  useCreateTaskTemplate,
  useGetTaskTemplateTypes,
  useTaskTemplateDetails,
  useUpdateTaskTemplateDetails,
} from '../../../service/task-template/task-template-service';
import { formatDateToYYYYMMDDWithTime } from '../../../../common-utils';
import { TaskTemplateFormData } from '../../../types';
import SkeletonForm from '../../../../components/form-builder/skeleton-form';
import { FormBuilder } from '../../../../components';
import { Layout } from '../../../../common-service';
import TextButton from '../../../../components/button/text-button';
import { transformTaskTemplatePayload } from './utils';
import { TaskTemplateFormFieldsData } from './form-data';

const TaskTemplateForm: React.FC = () => {
  const formRef = React.useRef<HTMLFormElement>(null);

  const { successToast } = useToast();
  const location = useLocation();
  const { templateId } = useParams();
  const isEditView = location.pathname.split('/').slice(-2, -1)[0] === 'edit';

  const taskTemplateTypes = useGetTaskTemplateTypes();
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
      taskTemplateTypes?.data?.data?.taskTemplateType?.map((item) => ({
        value: item.rid,
        label: item.task_type_name,
      })) || []
    );
  }, [taskTemplateTypes]);

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

  const goBack = () => {
    window.history.back();
  };

  const formConfig = TaskTemplateFormFieldsData(
    isEditView,
    taskTemplateTypesOptions
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
                : {}
            }
            outData={submitData}
            formRef={formRef}
            // onChange={onChangeField}
            layout={Layout.TYPE_1}
          />
        )}
      </div>
    </div>
  );
};

export default TaskTemplateForm;
