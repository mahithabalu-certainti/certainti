import React, { useEffect, useMemo, useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FormBuilder } from '../../../../components';
import { Autocomplete, TextField, Tooltip } from '@mui/material';
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
import { TaskCreateIcon, ErrorInfoIcon } from '../../../../assets';

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

const TaskForm: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { successToast } = useToast();

  const isEditView = location.pathname.split('/').includes('edit');
  const sourcePath = searchParams.get('source') || '';
  const accountId = searchParams.get('accountId') || '';
  const entityLevel = searchParams.get('entityLevel') || '';
  const entityId = searchParams.get('entityId') || '';
  const showFiscalYear = entityLevel === 'account';
  const entityFiscalYear =
    searchParams.get('projectFiscalYear') ||
    searchParams.get('caseFiscalYear') ||
    '';

  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [availableTags, setAvailableTags] = useState<TagOption[]>([]);
  const ErrorIconTooltip = ({ error }: { error: string }) => (
    <Tooltip
      title={error}
      placement='top'
      arrow
      slotProps={{
        tooltip: {
          sx: {
            backgroundColor: '#FEF2F2',
            color: '#EF4444',
            border: '1px solid #EF4444',
            fontSize: '12px',
          },
        },
        arrow: {
          sx: {
            color: '#FEF2F2',
            '&:before': {
              border: '1px solid #EF4444',
            },
          },
        },
      }}
    >
      <span className='cursor-pointer ml-2 inline-flex align-middle'>
        <ErrorInfoIcon className='w-4 h-4 text-red-500' />
      </span>
    </Tooltip>
  );

  const [tagInputValue, setTagInputValue] = useState('');
  const [localTagError, setLocalTagError] = useState<string | null>(null);

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
      task_description: formValues.description,
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
    window.history.back();
  };

  return (
    <div>
      <div className='h-[50px] flex items-center justify-between px-10 sticky top-0 z-10 bg-white border-b border-[#CBD6E2]'>
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

      <div>
        <FormBuilder
          loading={false}
          data={formConfig}
          values={{}}
          outData={submitData}
          formRef={formRef}
          layout={Layout.TYPE_1}
          keyStart='effective_start_datetime'
          keyEnd='effective_end_datetime'
          customFields={{
            tags: (
              <div className='flex flex-col gap-2'>
                <Autocomplete
                  multiple
                  freeSolo
                  fullWidth
                  options={availableTags
                    .map((tag) => tag.name)
                    .filter((tagName) => !selectedTags.includes(tagName))}
                  value={selectedTags}
                  inputValue={tagInputValue}
                  onInputChange={(_, newInputValue) => {
                    setTagInputValue(newInputValue);
                    if (localTagError && newInputValue.length <= 50) {
                      setLocalTagError(null);
                    }
                  }}
                  onKeyDown={(e) => {
                    const val = (e.target as HTMLInputElement).value;
                    if (val.length >= 50 && e.key !== 'Backspace' && e.key !== 'Delete') {
                      e.preventDefault();
                      e.stopPropagation();
                      setLocalTagError('Maximum 50 characters allowed');
                    }
                  }}
                  onChange={(_, newValue) => {
                    const validValues = newValue.filter(
                      (tag) => tag.length <= 50
                    );

                    if (validValues.length !== newValue.length) {
                      setLocalTagError('Maximum 50 characters allowed');
                    }

                    const cleanedValues = Array.from(
                      new Set(validValues.filter((v) => v.trim()))
                    );

                    const newTagsToAdd: TagOption[] = [];
                    cleanedValues.forEach((tagName) => {
                      if (!availableTags.find((t) => t.name === tagName)) {
                        newTagsToAdd.push({
                          id: '',
                          name: tagName,
                          color: '#3B82F6',
                          is_new_tag: true,
                        });
                      }
                    });

                    if (newTagsToAdd.length > 0) {
                      handleAddCustomTag([...availableTags, ...newTagsToAdd]);
                    }

                    handleTagsChange(cleanedValues);
                  }}
                  renderTags={() => null}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      size='small'
                      placeholder='Add Tags'
                      inputProps={{
                        ...params.inputProps,
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          padding: '6px',
                          minHeight: '32px',
                          width: '100%',
                          maxWidth: '100%',
                          '& input': {
                            fontSize: '13px',
                            padding: '0 !important',
                            color: '#7D98B6',
                          },
                          ...(localTagError
                            ? {
                              '& .MuiOutlinedInput-notchedOutline': {
                                borderColor: '#EF4444 !important',
                                borderWidth: '1px !important',
                              },
                              backgroundColor: '#FEF2F2',
                            }
                            : {}),
                        },
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#CBD6E2',
                          borderWidth: '1px',
                        },
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#CBD6E2',
                          borderWidth: '1px',
                        },
                        '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline':
                        {
                          border: '2px solid #60A5FA',
                        },
                      }}
                      InputProps={{
                        ...params.InputProps,
                        endAdornment: (
                          <>
                            {localTagError ? (
                              <ErrorIconTooltip error={localTagError} />
                            ) : null}
                            {params.InputProps.endAdornment}
                          </>
                        ),
                      }}
                    />
                  )}
                  ListboxProps={{
                    style: {
                      maxHeight: '300px',
                      fontSize: '13px',
                    },
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      padding: '6px',
                      fontSize: '13px',
                    },
                  }}
                />

                {selectedTags.length > 0 && (
                  <div className='flex flex-wrap items-center gap-2 mt-1'>
                    {selectedTags.map((tag, index) => (
                      <div
                        key={index}
                        className='inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium hover:bg-blue-200 transition-colors group'
                      >
                        <Tooltip title={tag} placement='top' arrow>
                          <span className='truncate max-w-[200px] block'>
                            {tag}
                          </span>
                        </Tooltip>
                        <button
                          onClick={() => {
                            const newTags = selectedTags.filter((t) => t !== tag);
                            handleTagsChange(newTags);
                          }}
                          className='ml-1 text-blue-600 hover:text-red-600 transition-colors'
                          title={`Remove ${tag}`}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ),
          }}
        />
      </div>
    </div>
  );
};

export default TaskForm;
