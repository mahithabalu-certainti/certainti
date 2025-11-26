
import React, { useEffect, useMemo, useState, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Autocomplete, TextField, Chip } from '@mui/material';
import { FormBuilder } from '../../../../components';
import { Layout } from '../../../../common-service';
import { TaskFormData } from './task-form-data';
import {
  useGetTaskPriorities,
  useGetTaskStatuses,
} from '../../../services/work-breakdown/work-breakdown-service';
import {
  useCreateActivityTask,
} from '../../../services/activities/activities-service';
import {
  useGetTagOptions,
  useGetUserOptions,
} from '../../../services/case-team/case-team-service';
import {
  useGetTaskCategoryTypes,
  useGetTaskCheckListTypes,
} from '../../../../admin/service/task-template/task-template-service';
import {
  transformTagData,
} from '../../case/case-details/work-breakdown/helper';
import { getFiscalYears } from '../../../../common-utils';
import { useToast } from '../../../../hooks';
import TextButton from '../../../../components/button/text-button';
import { TaskCreateIcon } from '../../../../assets';

const TaskForm: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const accountId = searchParams.get('accountId');
  const entityLevel = searchParams.get('entityLevel') || '';
  const entityId = searchParams.get('entityId') || '';
  const { successToast, errorToast } = useToast();

  // Determine attachment context
  const attachmentLevel = entityLevel || 'account';
  const attachTo = entityId || accountId || '';
  const showFiscalYear = attachmentLevel === 'account'; // Only show for account-level

  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [availableTags, setAvailableTags] = useState<Array<{ id: string; name: string; color: string; is_new_tag?: boolean }>>([]);
  const [tagInputValue, setTagInputValue] = useState('');
  const [tagError, setTagError] = useState<string | null>(null);

  const prioritiesQuery = useGetTaskPriorities();
  const statusesQuery = useGetTaskStatuses();
  const checklistQuery = useGetTaskCheckListTypes();
  const categoryListQuery = useGetTaskCategoryTypes();
  const caseTeamMembersQuery = useGetUserOptions(
    accountId || '',
    !!accountId,
    'all'
  );
  const tagOptionsQuery = useGetTagOptions(
    {
      task_rid: '',
      account_rid: accountId || '',
      action: 'create',
    },
    !!accountId
  );

  // Mutations
  const createTaskMutation = useCreateActivityTask();

  const statusOptions = useMemo(() => {
    return statusesQuery.data?.map(s => ({ label: s.task_status_name, value: s.rid })) || [];
  }, [statusesQuery.data]);

  const priorityOptions = useMemo(() => {
    return prioritiesQuery.data?.map(p => ({ label: p.priority_name, value: p.rid })) || [];
  }, [prioritiesQuery.data]);

  const assigneeOptions = useMemo(() => {
    return caseTeamMembersQuery.data?.map(m => ({ label: m.name, value: m.rid })) || [];
  }, [caseTeamMembersQuery.data]);

  const checklistOptions = useMemo(() => {
    return checklistQuery.data?.data?.map((c: any) => ({ label: c.checklist_name, value: c.rid })) || [];
  }, [checklistQuery.data]);

  const categoryOptions = useMemo(() => {
    const data = categoryListQuery.data as any;
    const list = data?.data || [];
    return list.map((c: any) => ({ label: c.category_name, value: c.rid })) || [];
  }, [categoryListQuery.data]);

  const fiscalYearOptions = useMemo(() => {
    return getFiscalYears(76);
  }, []);

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
    categoryOptions,
    fiscalYearOptions,
    false, // isEditView
    showFiscalYear // Show fiscal year only for account-level
  );

  const initialValues: Record<string, any> = useMemo(() => {
    return {};
  }, []);

  const handleAddCustomTag = (newTags: any[]) => {
    setAvailableTags(newTags);
  };

  const handleTagsChange = (newValue: string[]) => {
    setSelectedTags(newValue);
  };

  const submitData = async (formValues: any) => {
    if (!accountId) return;

    const tagsArray: any[] = [];
    selectedTags.forEach(tagName => {
      const existingTag = availableTags.find(t => t.name === tagName);
      if (existingTag && !existingTag.is_new_tag) {
        tagsArray.push({ tag_rid: existingTag.id, is_new_tag: false });
      } else {
        tagsArray.push({ tag_rid: tagName, is_new_tag: true });
      }
    });

    const payload: any = {
      account_rid: accountId,
      attach_to: attachTo,
      attachment_level: attachmentLevel as 'account' | 'project' | 'case',
      task_name: formValues.task_name,
      description: formValues.task_description,
      status_rid: formValues.status_rid,
      priority_rid: formValues.priority_rid,
      effective_start_datetime: formValues.effective_start_datetime,
      effective_end_datetime: formValues.effective_end_datetime,
      checklist_rid: formValues.checklist_template_rid,
      tags: "",
      assigned_to: formValues.assigned_to,
    };

    // Only include fiscal_year for account-level
    if (showFiscalYear && formValues.fiscal_year) {
      payload.fiscal_year = formValues.fiscal_year;
    }

    try {
      await createTaskMutation.mutateAsync(payload);
      successToast('Task created successfully');
      navigate(-1);
    } catch (e: any) {
      errorToast(e.message || 'Failed to create task');
    }
  };

  const formRef1 = useRef<HTMLFormElement>(null);
  const formRef2 = useRef<HTMLFormElement>(null);
  const [part1Data, setPart1Data] = useState<any>(null);
  const [part2Data, setPart2Data] = useState<any>(null);

  useEffect(() => {
    if (part1Data && part2Data) {
      submitData({ ...part1Data, ...part2Data });
      setPart1Data(null);
      setPart2Data(null);
    }
  }, [part1Data, part2Data]);

  const handleExternalSubmit = () => {
    setPart1Data(null);
    setPart2Data(null);
    if (formRef1.current) formRef1.current.requestSubmit();
    if (formRef2.current) formRef2.current.requestSubmit();
  };

  return (
    <div className="bg-white min-h-screen">
      <div className='h-[50px] flex items-center justify-between px-10 sticky top-0 z-10 bg-white border-b border-[#CBD6E2]'>
        <div className='flex items-center w-[80%] max-w-[80%]'>
          <TaskCreateIcon
            alt='task-icon'
            className='w-7 h-7 p-1.5 [&>path]:stroke-white bg-[#FF73C3] rounded-[2px]'
          />
          <div className='w-[90%]'>
            <div className='font-semibold text-[12px] leading-[20px] ml-2 mb-[-6px] text-[#7D98B6]'>
              Task
            </div>
            <h5 className='text-[16px] font-bold ml-2 text-[#2D3E4F]'>
              Create Task
            </h5>
          </div>
        </div>
        <div className='flex gap-3'>
          <TextButton
            label="Save"
            onClick={handleExternalSubmit}
            loading={createTaskMutation.isPending}
            sx={{
              width: '64px',
              minWidth: '64px',
              fontSize: '13px',
              fontWeight: 400,
            }}
          />
          <TextButton
            label="Cancel"
            onClick={() => navigate(-1)}
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
        <div>
          <FormBuilder
            data={[formConfig[0]]}
            values={initialValues}
            outData={setPart1Data}
            formRef={formRef1}
            layout={Layout.TYPE_1}
          />
        </div>
        <div className="px-10 mt-2 mb-4">
          <div style={{ width: 'calc(32% + 5px)' }}>
            <label className="text-[13px] text-[#2D3E4F] font-semibold leading-[21px] tracking-[0] md:text-left block">Tags</label>
            <Autocomplete
              multiple
              freeSolo
              options={availableTags.map((tag) => tag.name)}
              value={selectedTags}
              inputValue={tagInputValue}
              onInputChange={(_, newInputValue) => {
                setTagInputValue(newInputValue);
                if (tagError) setTagError(null);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && tagInputValue.length > 50) {
                  e.preventDefault();
                  e.stopPropagation();
                  setTagError('Tags too long (max 50 characters)');
                }
              }}
              onChange={(_, newValue) => {
                const cleanedValues = Array.from(new Set(newValue.filter((v) => v.trim())));
                cleanedValues.forEach((tagName) => {
                  if (!availableTags.find((t) => t.name === tagName)) {
                    handleAddCustomTag([
                      ...availableTags,
                      { id: '', name: tagName, color: '#3B82F6', is_new_tag: true },
                    ]);
                  }
                });
                handleTagsChange(cleanedValues);
              }}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => {
                  const { key, ...chipProps } = getTagProps({ index });
                  return (
                    <Chip
                      key={key}
                      label={option}
                      {...chipProps}
                      size="small"
                      sx={{
                        backgroundColor: '#DBEAFE',
                        color: '#1E40AF',
                        fontSize: '12px',
                        fontWeight: 600,
                        height: '24px',
                        margin: '2px',
                        '& .MuiChip-deleteIcon': {
                          color: '#1E40AF',
                          fontSize: '16px',
                          '&:hover': {
                            color: '#1E3A8A',
                          },
                        },
                      }}
                    />
                  );
                })
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  size="small"
                  placeholder={selectedTags.length === 0 ? "Add Tags" : ""}
                  error={!!tagError}
                  helperText={tagError}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      padding: '1px 6px !important',
                      minHeight: '32px',
                      fontSize: '13px',
                      fontFamily: "'Mulish', 'Lexend', sans-serif",
                      backgroundColor: '#fff',
                      color: '#425A76',
                      fontWeight: '500',
                      '& .MuiOutlinedInput-notchedOutline': {
                        border: tagError ? '1px solid #ef4444' : '1px solid #CBD6E2',
                        borderRadius: '2px',
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        border: tagError ? '1px solid #ef4444' : '1px solid #CBD6E2',
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        border: '2px solid #60A5FA',
                      },
                      '& input::placeholder': {
                        color: '#7D98B6',
                        opacity: 1,
                      },
                    },
                    '& .MuiFormHelperText-root': {
                      marginLeft: 0,
                      color: '#ef4444',
                    }
                  }}
                />
              )}
              componentsProps={{
                popper: {
                  sx: {
                    '& .MuiAutocomplete-listbox': {
                      fontSize: '13px',
                      fontFamily: "'Mulish', 'Lexend', sans-serif",
                      '& .MuiAutocomplete-option': {
                        fontSize: '13px',
                        fontFamily: "'Mulish', 'Lexend', sans-serif",
                      },
                    },
                  },
                },
              }}
            />
          </div>
        </div>

        <div>
          <FormBuilder
            data={[formConfig[1]]}
            values={initialValues}
            outData={setPart2Data}
            formRef={formRef2}
            layout={Layout.TYPE_1}
          />
        </div>
      </div>
    </div>
  );
};

export default TaskForm;
