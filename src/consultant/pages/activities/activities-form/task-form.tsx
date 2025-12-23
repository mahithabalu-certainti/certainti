import React, { useEffect, useMemo, useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FormBuilder, TagsInput } from '../../../../components';
import { Layout } from '../../../../common-service';
import { TaskFormData } from './task-form-data';
import {
  useGetTaskPriorities,
  useGetTaskStatuses,
} from '../../../services/work-breakdown/work-breakdown-service';
import {
  useCreateActivityTask,
  useGetActivityStatus,
} from '../../../services/activities/activities-service';
import {
  useGetTagOptions,
  useGetUserOptions,
} from '../../../services/case-team/case-team-service';
import { useGetTaskCheckListTypes } from '../../../../admin/service/task-template/task-template-service';
import { transformTagData } from '../../case/case-details/work-breakdown/helper';
import { useToast } from '../../../../hooks';
import TextButton from '../../../../components/button/text-button';
import { TaskCreateIcon } from '../../../../assets';
import { ActivitySourceDetails } from '../../../types';

// Types
interface TagOption {
  id: string;
  name: string;
  color: string;
  is_new_tag?: boolean;
}

interface FormValues {
  task_name: string;
  description: string;
  task_description: string;
  status_rid: string;
  priority_rid: string;
  effective_start_datetime: string;
  effective_end_datetime: string;
  checklist_template_rid: string;
  assigned_to: string;
  fiscal_year?: string;
}

interface TaskFormProps {
  isFrom?: string;
  onCloseModal?: () => void;
  sourceDetails?: ActivitySourceDetails;
}

const TaskForm: React.FC<TaskFormProps> = ({
  isFrom,
  onCloseModal,
  sourceDetails,
}) => {
  const [searchParams] = useSearchParams();
  const { successToast } = useToast();

  const isEditView = location.pathname.split('/').includes('edit');
  const sourcePath = sourceDetails?.source
    ? sourceDetails?.source
    : searchParams.get('source') || '';
  const accountId = sourceDetails?.accountId
    ? sourceDetails?.accountId
    : searchParams.get('accountId') || '';
  const entityLevel = sourceDetails?.entityLevel
    ? sourceDetails?.entityLevel
    : searchParams.get('entityLevel') || '';
  const entityId = sourceDetails?.entityId
    ? sourceDetails?.entityId
    : searchParams.get('entityId') || '';
  const showFiscalYear = entityLevel === 'account';
  const entityFiscalYear = sourceDetails?.caseFiscalYear
    ? sourceDetails?.caseFiscalYear
    : searchParams.get('projectFiscalYear') ||
      searchParams.get('caseFiscalYear') ||
      '';

  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [availableTags, setAvailableTags] = useState<TagOption[]>([]);

  // Mutations
  const createTaskMutation = useCreateActivityTask();
  const prioritiesData = useGetTaskPriorities();
  const statusData = useGetTaskStatuses();
  const activityStatusData = useGetActivityStatus('Task');
  const checklistData = useGetTaskCheckListTypes();
  const userListOptions = useGetUserOptions(accountId || '', !!accountId);
  const tagOptionsQuery = useGetTagOptions(
    {
      task_rid: '',
      account_rid: accountId || '',
      action: 'create',
    },
    !!accountId
  );

  const commonSuccess = createTaskMutation.isSuccess;

  useEffect(() => {
    if (commonSuccess) {
      successToast(
        isEditView ? 'Task updated successfully' : 'Task created successfully'
      );
      goBack();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [commonSuccess, isEditView]);

  const statusOptions = useMemo(() => {
    if (sourcePath && activityStatusData.data?.data?.activityStatus) {
      return (
        activityStatusData.data.data.activityStatus.map((status) => ({
          label: status.status_name,
          value: status.rid || '',
        })) || []
      );
    }
    return (
      statusData.data?.map((status) => ({
        label: status.task_status_name,
        value: status.rid,
      })) || []
    );
  }, [statusData.data, activityStatusData.data, sourcePath]);

  const priorityOptions = useMemo(() => {
    return (
      prioritiesData.data?.map((priority) => ({
        label: priority.priority_name,
        value: priority.rid,
      })) || []
    );
  }, [prioritiesData.data]);

  const assigneeOptions = useMemo(() => {
    return (
      userListOptions.data?.map((user) => ({
        label: user.name,
        value: user.rid,
      })) || []
    );
  }, [userListOptions.data]);

  const checklistOptions = useMemo(() => {
    return (
      checklistData.data?.data?.map((item) => ({
        label: item.checklist_name,
        value: item.rid,
      })) || []
    );
  }, [checklistData.data]);

  useEffect(() => {
    if (tagOptionsQuery.data) {
      setAvailableTags(transformTagData(tagOptionsQuery.data));
    }
  }, [tagOptionsQuery.data]);

  const formConfig = TaskFormData(
    statusOptions,
    priorityOptions,
    assigneeOptions,
    checklistOptions,
    showFiscalYear
  );

  const handleAddCustomTag = (newTags: TagOption[]) => {
    setAvailableTags(newTags);
  };

  const handleTagsChange = (newValue: string[]) => {
    setSelectedTags(newValue);
  };

  const submitData = (formValues: Partial<FormValues>) => {
    if (!accountId) return;

    if (!formValues.task_name) {
      return;
    }

    const tagsArray: Array<{ tag_rid: string; is_new_tag: boolean }> = [];
    selectedTags.forEach((tagName) => {
      const existingTag = availableTags.find((t) => t.name === tagName);
      if (existingTag && !existingTag.is_new_tag) {
        tagsArray.push({ tag_rid: existingTag.id, is_new_tag: false });
      } else {
        tagsArray.push({ tag_rid: tagName, is_new_tag: true });
      }
    });

    const payload = {
      account_rid: accountId,
      attach_to: entityId,
      attachment_level: entityLevel,
      task_name: formValues.task_name || '',
      description: formValues.task_description,
      status_rid: formValues.status_rid,
      priority_rid: formValues.priority_rid,
      effective_start_datetime: formValues.effective_start_datetime,
      effective_end_datetime: formValues.effective_end_datetime,
      checklist_rid: formValues.checklist_template_rid,
      tags: tagsArray,
      assigned_to: formValues.assigned_to,
      fiscal_year: Number(formValues.fiscal_year || entityFiscalYear),
    };

    createTaskMutation.mutate(payload);
  };

  const formRef = useRef<HTMLFormElement>(null);

  const handleExternalSubmit = () => {
    formRef.current?.requestSubmit();
  };

  const goBack = () => {
    if (isFrom === 'modal') {
      onCloseModal?.();
    } else {
      window.history.back();
    }
  };

  return (
    <div>
      <div
        className={`h-[50px] flex items-center justify-between ${isFrom === 'modal' ? 'px-4 rounded-t-2xl' : 'px-10'} sticky top-0 z-10 bg-white border-b border-[#CBD6E2]`}
      >
        <div className='flex items-center w-[80%] max-w-[80%]'>
          <TaskCreateIcon
            alt='call-icon'
            className='w-7 h-7 p-1.5 [&>path]:stroke-white bg-[#0B5CAB] rounded-[2px]'
          />
          <div className='w-[90%]'>
            <div className='font-semibold text-[12px] leading-[20px] ml-2 mb-[-6px] text-[#7D98B6]'>
              {sourcePath ? sourcePath : ''}
            </div>
            <h5 className='text-[16px] font-bold ml-2 text-[#2D3E4F]'>
              {isEditView ? 'Edit Task' : 'Create Task'}
            </h5>
          </div>
        </div>
        <div className='flex gap-3'>
          <TextButton
            label='Save'
            onClick={handleExternalSubmit}
            loading={createTaskMutation.isPending}
            sx={{
              width: '75px',
              minWidth: '75px',
              fontSize: '13px',
              fontWeight: 400,
            }}
          />
          <TextButton
            label='Cancel'
            onClick={goBack}
            disabled={createTaskMutation.isPending}
            sx={{
              width: '75px',
              minWidth: '75px',
              fontSize: '12px',
              fontWeight: 400,
            }}
          />
        </div>
      </div>
      <div
        className={`${isFrom === 'modal' ? 'min-h-[500px] max-h-[550px] overflow-y-auto pb-2 scrollbar-transparent' : ''}`}
      >
        <FormBuilder
          loading={false}
          data={formConfig}
          values={{}}
          outData={submitData}
          formRef={formRef}
          layout={isFrom !== 'modal' ? Layout.TYPE_1 : undefined}
          keyStart='effective_start_datetime'
          keyEnd='effective_end_datetime'
        />

        <div className={`${isFrom === 'modal' ? 'px-6' : 'px-10'}`}>
          <TagsInput
            label='Tags'
            values={selectedTags}
            availableTags={availableTags}
            onTagsChange={handleTagsChange}
            onAddCustomTag={handleAddCustomTag}
          />
        </div>
      </div>
    </div>
  );
};

export default TaskForm;
