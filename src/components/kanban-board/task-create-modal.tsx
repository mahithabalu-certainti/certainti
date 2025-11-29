import { useState, useEffect, useMemo } from 'react';
import { Tooltip } from '@mui/material';

import dayjs from 'dayjs';
import { CalendarIcon, CloseIcon, ErrorInfoIcon } from '../../assets';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import TextButton from '../button/text-button';
import {
  enrichUserOption,
  generateInitials,
  generateColorFromName,
} from './helper';
import TaskFieldsSection from './task-fields-section';
import type { UserOption } from './types';
import type { RoleOption } from '../../consultant/services/case-team/case-team-service';
import {
  useGetTaskConnectorTypes,
  useWeightageList,
  useGetTaskCategoryTypes,
} from '../../admin/service/task-template/task-template-service';
import { useGetTaskDropDownList } from '../../consultant/services/case-task/case-task-service';

// Form data interface
export interface TaskFormData {
  taskTitle: string;
  description: string;
  selectedStatusRid: string;
  selectedPriorityRid: string;
  selectedPriority: string;
  startDate: dayjs.Dayjs | null;
  endDate: dayjs.Dayjs | null;
  selectedAssignee: string;
  selectedTags: string[];
  selectedRole: string;
  selectedRoleRid: string;
  selectedChecklist: string;
  selectedChecklistRid: string;
  linkedType: string;
  linkedTypeRid: string;
  linkTaskTypes: string[];
  linkTaskTypeRids: string[];
  weightage: string;
  weightageRid: string;
  category: string;
  categoryRid: string;
}

interface TaskCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateTask: (columnId: string, formData: TaskFormData) => Promise<void>;
  columnId: string;
  columnName: string;
  statusData?: Array<{ id: string; name: string; color?: string }>;
  priorityData?: Array<{ id: string; name: string; color?: string }>;
  tagData?: Array<{ id: string; name: string }>;
  checklistData?: Array<{ id: string; name: string }>;
  collaboratorData?: Array<{ rid: string; name: string; email?: string }>;
  availableUsers?: UserOption[];
  roleOptions?: RoleOption[];
  fieldVisibility?: {
    assignee?: boolean;
    startDate?: boolean;
    endDate?: boolean;
    status?: boolean;
    priority?: boolean;
    tags?: boolean;
    checklist?: boolean;
    description?: boolean;
    collaborators?: boolean;
  };
  fieldDisabled?: {
    assignee?: boolean;
    startDate?: boolean;
    endDate?: boolean;
    status?: boolean;
    priority?: boolean;
    tags?: boolean;
    checklist?: boolean;
    description?: boolean;
    collaborators?: boolean;
  };
  accountId?: string;
  caseId?: string;
  caseStartDate?: string | null;
  caseEndDate?: string | null;
}

const TaskCreateModal: React.FC<TaskCreateModalProps> = ({
  isOpen,
  onClose,
  onCreateTask,
  columnId,
  columnName,
  statusData = [],
  priorityData = [],
  tagData = [],
  checklistData = [],
  collaboratorData = [],
  availableUsers = [],

  fieldVisibility = {},
  fieldDisabled = {},
  accountId,
  caseId,
  caseStartDate,
  caseEndDate,
}) => {
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

  const [taskTitle, setTaskTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('To Do');
  const [selectedStatusRid, setSelectedStatusRid] = useState('');
  const [selectedPriority, setSelectedPriority] = useState('');
  const [selectedPriorityRid, setSelectedPriorityRid] = useState('');
  const [startDate, setStartDate] = useState<dayjs.Dayjs | null>(null);
  const [endDate, setEndDate] = useState<dayjs.Dayjs | null>(null);
  const [selectedAssignee, setSelectedAssignee] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedRole, setSelectedRole] = useState('');
  const [selectedRoleRid, setSelectedRoleRid] = useState('');
  const [selectedChecklist, setSelectedChecklist] = useState('');
  const [selectedChecklistRid, setSelectedChecklistRid] = useState('');
  const [linkedType, setLinkedType] = useState('');
  const [linkedTypeRid, setLinkedTypeRid] = useState('');
  const [linkTaskTypes, setLinkTaskTypes] = useState<string[]>([]);
  const [linkTaskTypeRids, setLinkTaskTypeRids] = useState<string[]>([]);
  const [weightage, setWeightage] = useState('');
  const [weightageRid, setWeightageRid] = useState('');
  const [category, setCategory] = useState('');
  const [categoryRid, setCategoryRid] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const enrichedUsers = useMemo(() => {
    return collaboratorData && collaboratorData.length > 0
      ? collaboratorData.map((collab) => ({
        id: collab.rid,
        name: collab.name,
        email: collab.email,
        initials: generateInitials(collab.name),
        color: generateColorFromName(collab.name),
      }))
      : availableUsers.map(enrichUserOption);
  }, [collaboratorData, availableUsers]);

  // Fetch connector types and task templates
  const taskConnectorTypesQuery = useGetTaskConnectorTypes();
  const taskTemplatesQuery = useGetTaskDropDownList({
    case_rid: caseId || '',
    account_rid: accountId || '',
    search: '',
  }, { enabled: !!caseId && !!accountId });

  const connectorTypesData = useMemo(() => {
    if (
      taskConnectorTypesQuery.data?.data &&
      Array.isArray(taskConnectorTypesQuery.data.data)
    ) {
      return taskConnectorTypesQuery.data.data.map(
        (connector: { rid: string; relationship_type: string }) => ({
          id: connector.rid,
          name: connector.relationship_type,
        })
      );
    }
    return [];
  }, [taskConnectorTypesQuery.data]);

  const taskTemplatesData = useMemo(() => {
    if (
      taskTemplatesQuery.data?.data &&
      Array.isArray(taskTemplatesQuery.data.data)
    ) {
      return taskTemplatesQuery.data.data.map(
        (template: { rid: string; task_name: string }) => ({
          id: template.rid,
          name: template.task_name,
        })
      );
    }
    return [];
  }, [taskTemplatesQuery.data]);

  // Fetch weightage and category lists
  const weightageListQuery = useWeightageList();
  const categoryListQuery = useGetTaskCategoryTypes();

  const weightageData = useMemo(() => {
    // Handle nested data.data structure
    type WeightageResponse = {
      data?:
      | {
        data?: Array<{ rid: string; weightage_value: number }>;
      }
      | Array<{ rid: string; weightage_value: number }>;
    };

    const response = weightageListQuery.data as WeightageResponse;
    const dataArray = Array.isArray(response?.data)
      ? response.data
      : response?.data?.data;
    if (dataArray && Array.isArray(dataArray)) {
      return dataArray.map(
        (item: { rid: string; weightage_value: number }) => ({
          id: item.rid,
          name: String(item.weightage_value),
        })
      );
    }
    return [];
  }, [weightageListQuery.data]);

  type CategoryResponse = {
    data?: Array<{ rid: string; category_name: string }>;
  };

  const categoryData = useMemo(() => {
    const response = categoryListQuery.data as CategoryResponse;
    if (response?.data && Array.isArray(response.data)) {
      return response.data.map(
        (item: { rid: string; category_name: string }) => ({
          id: item.rid,
          name: item.category_name,
        })
      );
    }
    return [];
  }, [categoryListQuery.data]);

  const minDate = useMemo(() => {
    return caseStartDate ? dayjs(caseStartDate) : undefined;
  }, [caseStartDate]);

  const maxDate = useMemo(() => {
    return caseEndDate ? dayjs(caseEndDate) : undefined;
  }, [caseEndDate]);

  // Initialize status to "To Do" when statusData changes
  useEffect(() => {
    const toDoStatus = statusData?.find((s) => s.name === 'To Do');
    if (toDoStatus) {
      setSelectedStatus('To Do');
      setSelectedStatusRid(toDoStatus.id);
    }
  }, [statusData]);

  const handleClose = () => {
    setTaskTitle('');
    setDescription('');
    setSelectedStatus('To Do');
    setSelectedStatusRid('');
    setSelectedPriority('');
    setSelectedPriorityRid('');
    setStartDate(null);
    setEndDate(null);
    setSelectedAssignee('');
    setSelectedTags([]);
    setSelectedRole('');
    setSelectedRoleRid('');
    setSelectedChecklist('');
    setSelectedChecklistRid('');
    setLinkedType('');
    setLinkedTypeRid('');
    setLinkTaskTypes([]);
    setLinkTaskTypeRids([]);
    setWeightage('');
    setWeightageRid('');
    setCategory('');
    setCategoryRid('');
    setErrors({});
    onClose();
  };

  const handleSubmit = async () => {
    const newErrors: Record<string, string> = {};
    if (!taskTitle.trim()) newErrors.taskTitle = 'Field is required';
    if (!selectedPriority || !selectedPriorityRid)
      newErrors.priority = 'Field is required';
    if (!startDate && !fieldVisibility.startDate)
      newErrors.startDate = 'Field is required';
    if (!endDate && !fieldVisibility.endDate)
      newErrors.endDate = 'Field is required';

    if (startDate) {
      if (minDate && startDate.isBefore(minDate, 'day')) {
        newErrors.startDate = 'Invalid Date';
      }
      if (maxDate && startDate.isAfter(maxDate, 'day')) {
        newErrors.startDate = 'Invalid Date';
      }
    }

    if (endDate) {
      if (minDate && endDate.isBefore(minDate, 'day')) {
        newErrors.endDate = 'Invalid Date';
      }
      if (maxDate && endDate.isAfter(maxDate, 'day')) {
        newErrors.endDate = 'Invalid Date';
      }
      if (startDate && endDate.isBefore(startDate, 'day')) {
        newErrors.endDate = 'Invalid Date';
      }
    }

    if (linkedType && (!linkTaskTypes || linkTaskTypes.length === 0)) {
      newErrors.linkTaskType = 'Field is required';
    }
    if (!linkedType && linkTaskTypes && linkTaskTypes.length > 0) {
      newErrors.linkedType = 'Field is required';
    }

    if (taskTitle.length > 2000) {
      newErrors.taskTitle = 'Maximum 2000 characters allowed';
    }
    if (description.length > 2000) {
      newErrors.description = 'Maximum 2000 characters allowed';
    }
    const longTags = selectedTags.filter((tag) => tag.length > 50);
    if (longTags.length > 0) {
      newErrors.tags = 'Maximum 50 characters allowed';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      const formData: TaskFormData = {
        taskTitle: taskTitle.trim(),
        description,
        selectedStatusRid,
        selectedPriorityRid,
        selectedPriority,
        startDate,
        endDate,
        selectedAssignee,
        selectedTags,
        selectedRole,
        selectedRoleRid,
        selectedChecklist,
        selectedChecklistRid,
        linkedType,
        linkedTypeRid,
        linkTaskTypes,
        linkTaskTypeRids,
        weightage,
        weightageRid,
        category,
        categoryRid,
      };
      await onCreateTask(columnId, formData);
      handleClose();
    } catch (error) {
      console.error('Failed to create task:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartDateChange = (newValue: dayjs.Dayjs | null) => {
    setStartDate(newValue);
    if (newValue) {
      setErrors((prev) => ({ ...prev, startDate: '' }));
    }
    if (endDate && newValue && endDate <= newValue) {
      setEndDate(null);
    }
  };

  const handleEndDateChange = (newValue: dayjs.Dayjs | null) => {
    setEndDate(newValue);
    if (newValue) {
      setErrors((prev) => ({ ...prev, endDate: '' }));
    }
  };

  const getMinEndDate = () => {
    if (startDate) {
      return startDate.add(1, 'day');
    }
    return minDate;
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        className='fixed inset-0  bg-opacity-50 z-40'
        onClick={handleClose}
      />
      <div
        className='fixed right-0 bottom-0 w-[650px] bg-white text-gray-900 shadow-2xl transform transition-transform duration-300 ease-in-out z-50 overflow-y-auto'
        style={{ top: '38.1px', backgroundColor: '#fff' }}
      >
        <div className='sticky top-0 flex items-center justify-between p-3 border-b border-[#CBD6E2] bg-white z-50'>
          <h2
            className='text-[16px] font-semibold'
            style={{ color: '#2D3E4F' }}
          >
            Create New Task in {columnName}
          </h2>
          <button
            onClick={handleClose}
            className='p-2 hover:bg-gray-100 rounded transition-colors'
          >
            <CloseIcon size={16} className='text-gray-600' />
          </button>
        </div>

        <div className='px-4 pt-2 pb-4 space-y-3'>
          <div>
            <label className='block text-[13px] font-medium text-gray-700 mb-2'>
              Task Name <span className='text-red-500'>*</span>
            </label>
            <div className='relative'>
              <input
                type='text'
                value={taskTitle}
                onChange={(e) => {
                  setTaskTitle(e.target.value);
                  if (e.target.value.trim()) {
                    setErrors((prev) => ({ ...prev, taskTitle: '' }));
                  }
                }}
                placeholder='Enter task name'
                className={`w-full text-[13px] font-normal bg-transparent border-b ${errors.taskTitle ? 'border-red-500' : 'border-gray-300'} focus:border-blue-400 focus:border-b outline-none text-gray-900 placeholder-[#7D98B6] pb-2 pr-8`}
                autoFocus
              />
              {errors.taskTitle && (
                <div className='absolute right-0 top-0 bottom-2 flex items-center'>
                  <ErrorIconTooltip error={errors.taskTitle} />
                </div>
              )}
            </div>
          </div>

          <LocalizationProvider dateAdapter={AdapterDayjs} localeText={{
            fieldMonthPlaceholder: (params) =>
              params.contentType === 'digit' ? 'MM' : params.format,
          }}>
            <div className='grid grid-cols-2 gap-4'>
              {!fieldVisibility.startDate && (
                <div>
                  <label className='block text-[13px] font-medium text-gray-600 mb-1'>
                    Start Date <span className='text-red-500'>*</span>
                  </label>
                  <div className='relative'>
                    <DatePicker
                      disabled={fieldDisabled.startDate}
                      value={startDate}
                      onChange={handleStartDateChange}
                      format='YYYY-MMM-DD'
                      minDate={minDate}
                      maxDate={maxDate}
                      slots={{
                        openPickerIcon: () => (
                          <CalendarIcon className='w-4 h-4' />
                        ),
                        clearIcon: () => <CloseIcon className='w-2.5 h-2.5' />,
                      }}
                      slotProps={{
                        field: { clearable: true },
                        textField: {
                          fullWidth: true,
                          size: 'small',
                          error: !!errors.startDate,
                          sx: {
                            '& .MuiOutlinedInput-root': {
                              height: '32px',
                              borderRadius: '2px',
                              '& input': {
                                fontWeight: 400,
                                fontSize: '13px',
                                lineHeight: '21px',
                                pl: '11px',
                                color: 'black !important',
                                WebkitTextFillColor: 'black !important',
                                '&::placeholder': {
                                  color: '#7D98B6 !important',
                                  WebkitTextFillColor: '#7D98B6 !important',
                                  opacity: 1,
                                },
                              },
                              '&:hover .MuiOutlinedInput-notchedOutline': {
                                border: errors.startDate
                                  ? '1px solid #EF4444'
                                  : '1px solid #CBD6E2',
                              },
                              '&.Mui-focused .MuiOutlinedInput-notchedOutline':
                              {
                                border: errors.startDate
                                  ? '2px solid #EF4444'
                                  : '2px solid #60A5FA',
                              },
                            },
                            '& .MuiOutlinedInput-notchedOutline': {
                              border: errors.startDate
                                ? '1px solid #EF4444'
                                : '1px solid #CBD6E2',
                              borderRadius: '2px',
                            },
                          },
                          placeholder: 'YYYY-MMM-DD',
                          inputProps: {
                            placeholder: 'YYYY-MMM-DD',
                            readOnly: true,
                          },
                        },
                      }}
                    />
                    {errors.startDate && (
                      <p className='text-xs text-red-500 mt-1'>
                        {errors.startDate}
                      </p>
                    )}
                  </div>
                </div>
              )}
              {!fieldVisibility.endDate && (
                <div>
                  <label className='block text-[13px] font-medium text-gray-600 mb-1'>
                    Due Date <span className='text-red-500'>*</span>
                  </label>
                  <div className='relative'>
                    <DatePicker
                      disabled={fieldDisabled.endDate}
                      value={endDate}
                      onChange={handleEndDateChange}
                      minDate={getMinEndDate()}
                      maxDate={maxDate}
                      format='YYYY-MMM-DD'
                      slots={{
                        openPickerIcon: () => (
                          <CalendarIcon className='w-4 h-4' />
                        ),
                        clearIcon: () => <CloseIcon className='w-2.5 h-2.5' />,
                      }}
                      slotProps={{
                        field: { clearable: true },
                        textField: {
                          fullWidth: true,
                          size: 'small',
                          error: !!errors.endDate,
                          sx: {
                            '& .MuiOutlinedInput-root': {
                              height: '32px',
                              borderRadius: '2px',
                              '& input': {
                                fontWeight: 400,
                                fontSize: '13px',
                                lineHeight: '21px',
                                pl: '11px',
                                color: 'black !important',
                                WebkitTextFillColor: 'black !important',
                                '&::placeholder': {
                                  color: '#7D98B6 !important',
                                  WebkitTextFillColor: '#7D98B6 !important',
                                  opacity: 1,
                                },
                              },
                              '&:hover .MuiOutlinedInput-notchedOutline': {
                                border: errors.endDate
                                  ? '1px solid #EF4444'
                                  : '1px solid #CBD6E2',
                              },
                              '&.Mui-focused .MuiOutlinedInput-notchedOutline':
                              {
                                border: errors.endDate
                                  ? '2px solid #EF4444'
                                  : '2px solid #60A5FA',
                              },
                            },
                            '& .MuiOutlinedInput-notchedOutline': {
                              border: errors.endDate
                                ? '1px solid #EF4444'
                                : '1px solid #CBD6E2',
                              borderRadius: '2px',
                            },
                          },
                          placeholder: 'YYYY-MMM-DD',
                          inputProps: {
                            placeholder: 'YYYY-MMM-DD',
                            readOnly: true,
                          },
                        },
                      }}
                    />
                    {errors.endDate && (
                      <p className='text-xs text-red-500 mt-1'>
                        {errors.endDate}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </LocalizationProvider>

          <h3 className='text-sm font-semibold text-gray-700 mb-3'>Fields</h3>

          <TaskFieldsSection
            fieldVisibility={fieldVisibility}
            fieldDisabled={fieldDisabled}
            editedTask={null}
            statusData={(statusData || []).map((s) => ({
              id: s.id,
              name: s.name,
              color: s.color || '#3B82F6',
            }))}
            priorityData={(priorityData || []).map((p) => ({
              id: p.id,
              name: p.name,
              color: p.color || '#3B82F6',
            }))}
            checklistData={checklistData}
            availableTags={(tagData || []).map((tag) => ({
              id: tag.id || `tag-${tag.name}`,
              name: tag.name,
              color: '#3B82F6',
            }))}
            availableUsers={enrichedUsers}
            connectorTypesData={connectorTypesData}
            taskTemplatesData={taskTemplatesData}
            weightageData={weightageData}
            categoryData={categoryData}
            selectedChecklist={selectedChecklist}
            selectedPriority={selectedPriority}
            selectedTags={selectedTags}
            selectedAssignee={selectedAssignee}
            selectedLinkedType={linkedType}
            selectedLinkTaskTypes={linkTaskTypes}
            selectedWeightage={weightage}
            selectedCategory={category}
            onStatusChange={(statusName: string) => {
              setSelectedStatus(statusName);
              const statusItem = statusData?.find((s) => s.name === statusName);
              if (statusItem) {
                setSelectedStatusRid(statusItem.id);
              }
            }}
            onPriorityChange={(priorityName: string) => {
              setSelectedPriority(priorityName);
              const priorityItem = priorityData?.find(
                (p) => p.name === priorityName
              );
              if (priorityItem) {
                setSelectedPriorityRid(priorityItem.id);
                setErrors((prev) => ({ ...prev, priority: '' }));
              }
            }}
            onAssigneeChange={(userId: string) => {
              setSelectedAssignee(userId);
            }}
            onChecklistChange={(value) => {
              setSelectedChecklist(value);
              const checklistItem = checklistData?.find(
                (c) => c.name === value
              );
              if (checklistItem) {
                setSelectedChecklistRid(checklistItem.id);
                setErrors((prev) => ({ ...prev, checklistTemplate: '' }));
              }
            }}
            onLinkedTypeChange={(value) => {
              setLinkedType(value);
              const connectorItem = connectorTypesData?.find(
                (c) => c.name === value
              );
              setLinkedTypeRid(connectorItem?.id || '');
              if (value) {
                setErrors((prev) => ({ ...prev, linkedType: '' }));
              } else {
                if (!linkTaskTypes || linkTaskTypes.length === 0) {
                  setErrors((prev) => ({ ...prev, linkTaskType: '' }));
                }
              }
            }}
            onLinkTaskTypesChange={(values) => {
              setLinkTaskTypes(values);
              const rids = values
                .map((value) => {
                  const template = taskTemplatesData?.find(
                    (t) => t.name === value
                  );
                  return template?.id || '';
                })
                .filter((rid) => rid !== '');
              setLinkTaskTypeRids(rids);
              if (values.length > 0) {
                setErrors((prev) => ({ ...prev, linkTaskType: '' }));
              } else {
                if (!linkedType) {
                  setErrors((prev) => ({ ...prev, linkedType: '' }));
                }
              }
            }}
            onWeightageChange={(value) => {
              setWeightage(value);
              const weightageItem = weightageData?.find(
                (w) => w.name === value
              );
              setWeightageRid(weightageItem?.id || '');
            }}
            onCategoryChange={(value) => {
              setCategory(value);
              const categoryItem = categoryData?.find(
                (c: { id: string; name: string }) => c.name === value
              );
              setCategoryRid(categoryItem?.id || '');
            }}
            onTagsChange={setSelectedTags}
            onAddCustomTag={() => { }}
            onSetEditedTask={() => { }}
            mode='create'
            selectedStatus={selectedStatus}
            onStatusChangeCreate={(statusName, statusId) => {
              setSelectedStatus(statusName);
              setSelectedStatusRid(statusId);
            }}
            errors={errors}
          />

          {!fieldVisibility.description && (
            <div>
              <h3 className='text-[13px] font-semibold text-gray-700 mb-3'>
                Description
              </h3>
              <div className='relative'>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder='Add a description...'
                  className='w-full bg-white border border-gray-300 rounded-lg p-3 text-[13px] resize-none focus:border-blue-500 focus:outline-none text-gray-900 placeholder-[#7D98B6] min-h-[100px] pr-8'
                  disabled={fieldDisabled.description}
                />
                {errors.description && (
                  <div className='absolute right-2 top-3'>
                    <ErrorIconTooltip error={errors.description} />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className='sticky bottom-0 flex items-center justify-end gap-3 p-4 border-t border-gray-200 bg-white z-50 shadow-sm'>
          <TextButton
            label='Cancel'
            onClick={handleClose}
            disabled={isSubmitting}
          />
          <TextButton
            label={isSubmitting ? 'Creating...' : 'Create Task'}
            onClick={handleSubmit}
            disabled={isSubmitting}
            sx={{
              px: 1,
              py: 1,
              '&:hover': {
                background: 'linear-gradient(180deg, #FFFFFF 0%, #E4E6E7 100%)',
              },
            }}
          />
        </div>
      </div>
    </>
  );
};

export default TaskCreateModal;
