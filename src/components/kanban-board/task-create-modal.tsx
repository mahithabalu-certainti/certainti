import { useState } from 'react';
import {
  MenuItem,
  Select,
  SelectChangeEvent,
  Autocomplete,
  TextField,
} from '@mui/material';
import dayjs from 'dayjs';
import { CalendarIcon, CloseIcon } from '../../assets';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import {
  enrichUserOption,
  generateInitials,
  generateColorFromName,
} from './helper';
import type { TaskCard, UserOption } from './types';
import type { RoleOption } from '../../consultant/services/case-team/case-team-service';

interface TaskCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateTask: (columnId: string, task: TaskCard) => Promise<void>;
  columnId: string;
  columnName: string;
  statusData?: Array<{ id: string; name: string; color?: string }>;
  priorityData?: Array<{ id: string; name: string; color?: string }>;
  tagData?: Array<{ id: string; name: string }>;
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
    description?: boolean;
    collaborators?: boolean;
  };
}

const TaskCreateModal: React.FC<TaskCreateModalProps> = ({
  isOpen,
  onClose,
  onCreateTask,
  columnId,
  statusData = [],
  priorityData = [],
  tagData = [],
  collaboratorData = [],
  availableUsers = [],
  roleOptions = [],
  fieldVisibility = {},
  fieldDisabled = {},
}) => {
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
  const [isSubmitting, setIsSubmitting] = useState(false);

  const collaborators =
    collaboratorData && collaboratorData.length > 0
      ? collaboratorData.map((collab) => ({
          id: collab.rid,
          name: collab.name,
          email: collab.email,
          initials: generateInitials(collab.name),
          color: generateColorFromName(collab.name),
        }))
      : availableUsers.map(enrichUserOption);

  const enrichedUsers = collaborators;

  useState(() => {
    const toDoStatus = statusData?.find((s) => s.name === 'To Do');
    if (toDoStatus) {
      setSelectedStatus('To Do');
      setSelectedStatusRid(toDoStatus.id);
    }
  });

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
    onClose();
  };

  const handleSubmit = async () => {
    if (!taskTitle.trim()) return;
    if (!selectedStatus || !selectedStatusRid) return;
    if (!selectedPriority || !selectedPriorityRid) return;
    if (!startDate || !endDate) return;

    setIsSubmitting(true);
    try {
      const assigneeUser = enrichedUsers.find((u) => u.id === selectedAssignee);
      const newTask: TaskCard = {
        rid: `task-${Date.now()}`,
        r_number: `T-${Date.now()}`,
        task_name: taskTitle.trim(),
        created_by: '',
        status_rid: selectedStatusRid,
        assigned_to: assigneeUser?.id || null,
        sequence_no: 0,
        priority_rid: selectedPriorityRid,
        task_type_rid: '',
        effort_in_days: 0,
        checklists_count: 0,
        task_description: description,
        reminder_interval: 0,
        effective_end_datetime: endDate ? endDate.format('YYYY-MM-DD') : '',
        effective_start_datetime: startDate
          ? startDate.format('YYYY-MM-DD')
          : '',
        case_team_member_role_rid: selectedRoleRid,
        milestone_template_rid: columnId,
        priority_name: selectedPriority,
        assigned_to_name: assigneeUser?.name || null,
        case_team_member_role_name: selectedRole,
        task_type_name: '',
        status_name: selectedStatus,
        task_status_name: selectedStatus,
      };

      await onCreateTask(columnId, newTask);
      handleClose();
    } catch (error) {
      console.error('Failed to create task:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusChange = (event: SelectChangeEvent<string>) => {
    const selectedName = event.target.value;
    setSelectedStatus(selectedName);
    const statusItem = statusData?.find((s) => s.name === selectedName);
    if (statusItem) {
      setSelectedStatusRid(statusItem.id);
    }
  };

  const handlePriorityChange = (event: SelectChangeEvent<string>) => {
    const selectedName = event.target.value;
    setSelectedPriority(selectedName);
    const priorityItem = priorityData?.find((p) => p.name === selectedName);
    if (priorityItem) {
      setSelectedPriorityRid(priorityItem.id);
    }
  };

  const handleRoleChange = (event: SelectChangeEvent<string>) => {
    const selectedName = event.target.value;
    setSelectedRole(selectedName);
    const roleItem = roleOptions?.find((r) => r.role_name === selectedName);
    if (roleItem) {
      setSelectedRoleRid(roleItem.rid);
    }
  };

  const handleAssigneeChange = (event: SelectChangeEvent<string>) => {
    setSelectedAssignee(event.target.value);
  };

  const handleStartDateChange = (newValue: dayjs.Dayjs | null) => {
    setStartDate(newValue);
    if (endDate && newValue && endDate <= newValue) {
      setEndDate(null);
    }
  };

  const handleEndDateChange = (newValue: dayjs.Dayjs | null) => {
    if (newValue && startDate && newValue <= startDate) {
      return;
    }
    setEndDate(newValue);
  };

  const getMinEndDate = () => {
    if (startDate) {
      return startDate.add(1, 'day');
    }
    return undefined;
  };

  const isFormValid = () => {
    return (
      taskTitle.trim() &&
      selectedStatus &&
      selectedStatusRid &&
      selectedPriority &&
      selectedPriorityRid &&
      startDate &&
      endDate
    );
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
        style={{ top: '38.1px' }}
      >
        <div className='sticky top-0 flex items-center justify-between p-[17.5px] border-b border-[#CBD6E2] bg-white z-50'>
          <h2 className='text-lg font-semibold text-gray-800'></h2>
          <button
            onClick={handleClose}
            className='p-2 hover:bg-gray-100 rounded transition-colors'
          >
            <CloseIcon size={16} className='text-gray-600' />
          </button>
        </div>

        <div className='p-6 space-y-6'>
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>
              Task Name *
            </label>
            <input
              type='text'
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
              placeholder='Enter task name'
              className='w-full text-2xl font-bold bg-transparent border-b-2 border-gray-300 focus:border-blue-500 outline-none text-gray-900 placeholder-gray-400 pb-2'
              autoFocus
            />
          </div>

          {!fieldVisibility.assignee && (
            <div className='flex items-center justify-between'>
              <span className='text-sm font-medium text-gray-600'>
                Assignee
              </span>
              <div className='w-[200px]'>
                <Select
                  name='assignee'
                  disabled={fieldDisabled.assignee}
                  className='custom-select-no-arrow w-full h-full sm:text-sm px-1.5 py-[7px]'
                  onChange={handleAssigneeChange}
                  value={selectedAssignee}
                  displayEmpty
                  fullWidth
                  size='small'
                  MenuProps={{
                    PaperProps: {
                      sx: {
                        maxWidth: 300,
                        maxHeight: 300,
                        marginTop: '4px',
                        zIndex: 40,
                        boxShadow:
                          'rgba(50, 50, 93, 0.25) 0px 2px 5px -1px, rgba(0, 0, 0, 0.3) 0px 1px 3px -1px',
                        '& .MuiMenuItem-root': {
                          fontSize: '13px',
                          padding: '6px 12px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        },
                      },
                    },
                  }}
                  sx={{
                    height: '32px',
                    fontSize: '13px',
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      border: '2px solid #60A5FA',
                    },
                    '& .MuiOutlinedInput-root': {
                      '&.Mui-focused': {
                        boxShadow: 'none',
                      },
                    },
                    '.MuiSelect-select': {
                      padding: '6px 6px',
                      color: !selectedAssignee ? '#7D98B6' : 'black',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      width: '100%',
                      overflow: 'auto',
                      overflowY: 'hidden',
                      scrollBehavior: 'smooth',
                      '&::-webkit-scrollbar': {
                        height: '4px',
                      },
                      '&::-webkit-scrollbar-track': {
                        background: 'transparent',
                      },
                      '&::-webkit-scrollbar-thumb': {
                        background: '#CBD6E2',
                        borderRadius: '2px',
                      },
                    },
                    '& .MuiOutlinedInput-notchedOutline': {
                      border: '1px solid #CBD6E2',
                      borderRadius: '2px',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      border: '1px solid #CBD6E2',
                    },
                    '& svg': {
                      color: '#7D98B6',
                      flexShrink: 0,
                    },
                  }}
                  renderValue={(value) => {
                    if (value) {
                      const user = enrichedUsers.find((u) => u.id === value);
                      if (user) {
                        return (
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              width: '100%',
                              minWidth: 0,
                            }}
                          >
                            <div
                              style={{
                                width: '20px',
                                height: '20px',
                                borderRadius: '50%',
                                backgroundColor: user.color,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '9px',
                                fontWeight: '600',
                                color: 'white',
                                flexShrink: 0,
                              }}
                            >
                              {user.initials}
                            </div>
                            <span
                              style={{
                                fontSize: '13px',
                                color: 'black',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                minWidth: 0,
                              }}
                            >
                              {user.name}
                            </span>
                          </div>
                        );
                      }
                    }
                    return (
                      <span
                        style={{
                          color: '#7D98B6',
                          fontSize: '13px',
                          fontWeight: '400',
                        }}
                      >
                        Select User
                      </span>
                    );
                  }}
                >
                  <MenuItem
                    value=''
                    sx={{
                      color: '#425A76',
                      fontSize: '13px',
                      fontWeight: '500',
                    }}
                  >
                    Select User
                  </MenuItem>
                  {enrichedUsers.map((user) => (
                    <MenuItem
                      sx={{
                        color: '#425A76',
                        fontSize: '13px',
                        fontWeight: '500',
                      }}
                      key={user.id}
                      value={user.id}
                      title={user.name}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                        }}
                      >
                        <div
                          style={{
                            width: '20px',
                            height: '20px',
                            borderRadius: '50%',
                            backgroundColor: user.color,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '8px',
                            fontWeight: '600',
                            color: 'white',
                          }}
                        >
                          {user.initials}
                        </div>
                        {user.name}
                      </div>
                    </MenuItem>
                  ))}
                </Select>
              </div>
            </div>
          )}

          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <div className='grid grid-cols-2 gap-4'>
              {!fieldVisibility.startDate && (
                <div>
                  <label className='block text-xs font-medium text-gray-600 mb-1'>
                    Start Date *
                  </label>
                  <DatePicker
                    disabled={fieldDisabled.startDate}
                    value={startDate}
                    onChange={handleStartDateChange}
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
                            },
                            '&:hover .MuiOutlinedInput-notchedOutline': {
                              border: '1px solid #CBD6E2',
                            },
                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                              border: '2px solid #60A5FA',
                            },
                          },
                          '& .MuiOutlinedInput-notchedOutline': {
                            border: '1px solid #CBD6E2',
                            borderRadius: '2px',
                          },
                        },
                        placeholder: 'Select start date',
                      },
                    }}
                  />
                </div>
              )}
              {!fieldVisibility.endDate && (
                <div>
                  <label className='block text-xs font-medium text-gray-600 mb-1'>
                    Due Date *
                  </label>
                  <DatePicker
                    disabled={fieldDisabled.endDate}
                    value={endDate}
                    onChange={handleEndDateChange}
                    minDate={getMinEndDate()}
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
                            },
                            '&:hover .MuiOutlinedInput-notchedOutline': {
                              border: '1px solid #CBD6E2',
                            },
                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                              border: '2px solid #60A5FA',
                            },
                          },
                          '& .MuiOutlinedInput-notchedOutline': {
                            border: '1px solid #CBD6E2',
                            borderRadius: '2px',
                          },
                        },
                        placeholder: 'Select end date',
                      },
                    }}
                  />
                </div>
              )}
            </div>
          </LocalizationProvider>

          <div>
            <h3 className='text-sm font-semibold text-gray-700 mb-3'>Fields</h3>
            <div className='border border-gray-200 rounded-lg divide-y divide-gray-200'>
              {!fieldVisibility.status && (
                <div className='flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors'>
                  <div className='flex items-center gap-2'>
                    <svg
                      width='16'
                      height='16'
                      viewBox='0 0 24 24'
                      fill='none'
                      stroke='currentColor'
                      strokeWidth='2'
                      className='text-gray-500'
                    >
                      <polyline points='22 12 18 12 15 21 9 3 6 12 2 12'></polyline>
                    </svg>
                    <span className='text-sm text-gray-700'>Status *</span>
                  </div>
                  <div className='w-[200px]'>
                    <Select
                      name='status'
                      disabled={fieldDisabled.status || true}
                      className='custom-select-no-arrow w-full h-full sm:text-sm px-1.5 py-[7px]'
                      onChange={handleStatusChange}
                      value={selectedStatus}
                      displayEmpty
                      fullWidth
                      size='small'
                      sx={{
                        height: '32px',
                        fontSize: '13px',
                        '.MuiSelect-select': {
                          padding: '6px 6px',
                          color: selectedStatus ? 'black' : '#7D98B6',
                        },
                        '&.Mui-disabled': {
                          backgroundColor: '#f3f4f6',
                          '& .MuiOutlinedInput-notchedOutline': {
                            border: '1px solid #CBD6E2 !important',
                            opacity: 1,
                          },
                          '& .MuiSelect-select': {
                            color: '#7D98B6',
                            WebkitTextFillColor: '#7D98B6',
                          },
                        },
                        '& .MuiOutlinedInput-notchedOutline': {
                          border: '1px solid #CBD6E2',
                          borderRadius: '2px',
                        },
                        '& svg': {
                          color: '#7D98B6',
                        },
                      }}
                    >
                      {statusData.map((status) => (
                        <MenuItem
                          sx={{
                            color: '#425A76',
                            fontSize: '13px',
                            fontWeight: '500',
                          }}
                          key={status.id}
                          value={status.name}
                        >
                          {status.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </div>
                </div>
              )}

              {!fieldVisibility.priority && (
                <div className='flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors'>
                  <div className='flex items-center gap-2'>
                    <svg
                      width='16'
                      height='16'
                      viewBox='0 0 24 24'
                      fill='none'
                      stroke='currentColor'
                      strokeWidth='2'
                      className='text-gray-500'
                    >
                      <path d='M3 13h2v8H3z'></path>
                      <path d='M9 3h2v18H9z'></path>
                      <path d='M15 8h2v13h-2z'></path>
                    </svg>
                    <span className='text-sm text-gray-700'>Priority *</span>
                  </div>
                  <div className='w-[200px]'>
                    <Select
                      name='priority'
                      disabled={fieldDisabled.priority}
                      className='custom-select-no-arrow w-full h-full sm:text-sm px-1.5 py-[7px]'
                      onChange={handlePriorityChange}
                      value={selectedPriority}
                      displayEmpty
                      fullWidth
                      size='small'
                      sx={{
                        height: '32px',
                        fontSize: '13px',
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          border: '2px solid #60A5FA',
                        },
                        '.MuiSelect-select': {
                          padding: '6px 6px',
                          color: !selectedPriority ? '#7D98B6' : 'black',
                        },
                        '& .MuiOutlinedInput-notchedOutline': {
                          border: '1px solid #CBD6E2',
                          borderRadius: '2px',
                        },
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          border: '1px solid #CBD6E2',
                        },
                        '& svg': {
                          color: '#7D98B6',
                        },
                      }}
                      renderValue={(value) =>
                        value ? (
                          value
                        ) : (
                          <span style={{ color: '#7D98B6' }}>
                            Choose Priority
                          </span>
                        )
                      }
                    >
                      {priorityData.map((priority) => (
                        <MenuItem
                          sx={{
                            color: '#425A76',
                            fontSize: '13px',
                            fontWeight: '500',
                          }}
                          key={priority.id}
                          value={priority.name}
                        >
                          {priority.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </div>
                </div>
              )}

              {roleOptions && roleOptions.length > 0 && (
                <div className='flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors'>
                  <div className='flex items-center gap-2'>
                    <svg
                      width='16'
                      height='16'
                      viewBox='0 0 24 24'
                      fill='none'
                      stroke='currentColor'
                      strokeWidth='2'
                      className='text-gray-500'
                    >
                      <path d='M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2'></path>
                      <circle cx='12' cy='7' r='4'></circle>
                    </svg>
                    <span className='text-sm text-gray-700'>User Role</span>
                  </div>
                  <div className='w-[200px]'>
                    <Select
                      name='role'
                      className='custom-select-no-arrow w-full h-full sm:text-sm px-1.5 py-[7px]'
                      onChange={handleRoleChange}
                      value={selectedRole}
                      displayEmpty
                      fullWidth
                      size='small'
                      sx={{
                        height: '32px',
                        fontSize: '13px',
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          border: '2px solid #60A5FA',
                        },
                        '.MuiSelect-select': {
                          padding: '6px 6px',
                          color: !selectedRole ? '#7D98B6' : 'black',
                        },
                        '& .MuiOutlinedInput-notchedOutline': {
                          border: '1px solid #CBD6E2',
                          borderRadius: '2px',
                        },
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          border: '1px solid #CBD6E2',
                        },
                        '& svg': {
                          color: '#7D98B6',
                        },
                      }}
                      renderValue={(value) =>
                        value ? (
                          value
                        ) : (
                          <span style={{ color: '#7D98B6' }}>
                            Choose User Role
                          </span>
                        )
                      }
                    >
                      {roleOptions.map((role) => (
                        <MenuItem
                          sx={{
                            color: '#425A76',
                            fontSize: '13px',
                            fontWeight: '500',
                          }}
                          key={role.rid}
                          value={role.role_name}
                        >
                          {role.role_name}
                        </MenuItem>
                      ))}
                    </Select>
                  </div>
                </div>
              )}

              {!fieldVisibility.tags && (
                <div className='px-4 py-3 hover:bg-gray-50 transition-colors'>
                  <div className='flex items-center justify-between mb-3'>
                    <div className='flex items-center gap-2'>
                      <svg
                        width='16'
                        height='16'
                        viewBox='0 0 24 24'
                        fill='none'
                        stroke='currentColor'
                        strokeWidth='2'
                        className='text-gray-500'
                      >
                        <path d='M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z'></path>
                        <line x1='7' y1='7' x2='7.01' y2='7'></line>
                      </svg>
                      <span className='text-sm text-gray-700'>Tags</span>
                    </div>
                    <div className='w-[200px]'>
                      <Autocomplete
                        multiple
                        freeSolo
                        disabled={fieldDisabled.tags}
                        options={tagData.map((tag) => tag.name)}
                        value={selectedTags}
                        onChange={(_, newValue) => {
                          setSelectedTags(newValue);
                        }}
                        renderTags={() => null}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            size='small'
                            placeholder='Add Tags'
                            sx={{
                              '& .MuiOutlinedInput-root': {
                                padding: '6px',
                                minHeight: '32px',
                                '& input': {
                                  fontSize: '13px',
                                  padding: '0 !important',
                                  color: '#7D98B6',
                                },
                              },
                              '& .MuiOutlinedInput-notchedOutline': {
                                borderColor: '#CBD6E2',
                                borderWidth: '1px',
                                borderRadius: '2px',
                              },
                              '&:hover .MuiOutlinedInput-notchedOutline': {
                                borderColor: '#CBD6E2',
                                borderWidth: '1px',
                              },
                              '&.Mui-focused .MuiOutlinedInput-notchedOutline':
                                {
                                  borderColor: '#60A5FA',
                                  borderWidth: '2px',
                                },
                            }}
                          />
                        )}
                        ListboxProps={{
                          style: {
                            maxHeight: '200px',
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
                    </div>
                  </div>

                  {selectedTags.length > 0 && (
                    <div className='flex flex-wrap items-center gap-2 mt-3'>
                      {selectedTags.map((tag, index) => (
                        <div
                          key={index}
                          className='inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium hover:bg-blue-200 transition-colors group'
                        >
                          <span>{tag}</span>
                          <button
                            onClick={() => {
                              setSelectedTags(
                                selectedTags.filter((_, i) => i !== index)
                              );
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
              )}
            </div>
          </div>

          {!fieldVisibility.description && (
            <div>
              <h3 className='text-sm font-semibold text-gray-700 mb-3'>
                Description
              </h3>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder='Add a description...'
                className='w-full bg-white border border-gray-300 rounded-lg p-3 text-sm resize-none focus:border-blue-500 focus:outline-none text-gray-900 placeholder-gray-500 min-h-[100px]'
                disabled={fieldDisabled.description}
              />
            </div>
          )}
        </div>

        <div className='sticky bottom-0 flex items-center justify-end gap-3 p-4 border-t border-gray-200 bg-white z-50 shadow-sm'>
          <button
            onClick={handleClose}
            className='px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors'
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!isFormValid() || isSubmitting}
            className={`px-4 py-2 text-sm font-medium text-white rounded transition-colors ${
              isFormValid() && !isSubmitting
                ? 'bg-blue-600 hover:bg-blue-700'
                : 'bg-gray-400 cursor-not-allowed'
            }`}
          >
            {isSubmitting ? 'Creating...' : 'Create Task'}
          </button>
        </div>
      </div>
    </>
  );
};

export default TaskCreateModal;
