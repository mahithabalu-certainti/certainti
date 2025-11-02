import { useEffect, useState } from 'react';
import { TaskDetailModalProps } from './types';
import { CloseIcon, CalendarIcon } from '../../assets';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { MenuItem, Select, SelectChangeEvent } from '@mui/material';
import dayjs from 'dayjs';

const TaskDetailModal: React.FC<TaskDetailModalProps> = ({
  task,
  isOpen,
  onClose,
  onTaskUpdate,
  statusData,
  priorityData,
  tagData,
  availableUsers = [],
  activities = [],
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTask, setEditedTask] = useState(task);
  const [comment, setComment] = useState('');
  const [selectedCollaborators, setSelectedCollaborators] = useState<
    Array<{ name: string; initials: string; color: string }>
  >([]);
  const [activeTab, setActiveTab] = useState<'comments' | 'activity'>(
    'comments'
  );
  const [showCollaboratorModal, setShowCollaboratorModal] = useState(false);
  const [showAssigneeModal, setShowAssigneeModal] = useState(false);

  useEffect(() => {
    setEditedTask(task);
    if (task?.collaborators) {
      setSelectedCollaborators(task.collaborators);
    }
  }, [task]);

  if (!task) return null;

  const handleSave = () => {
    if (editedTask) {
      onTaskUpdate(task.id, editedTask);
      setIsEditing(false);
    }
  };

  const handleMarkComplete = () => {
    onTaskUpdate(task.id, { status: 'Done' });
  };

  const handleDescriptionChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    setEditedTask((prev) =>
      prev ? { ...prev, description: e.target.value } : null
    );
  };

  const handleStatusChange = (
    event: SelectChangeEvent<'Done' | 'In Progress' | 'To Do'>
  ) => {
    setEditedTask((prev) =>
      prev
        ? {
            ...prev,
            status: event.target.value as 'Done' | 'In Progress' | 'To Do',
          }
        : null
    );
  };

  const handlePriorityChange = (
    event: SelectChangeEvent<'Low' | 'Medium' | 'High'>
  ) => {
    setEditedTask((prev) =>
      prev
        ? { ...prev, priority: event.target.value as 'Low' | 'Medium' | 'High' }
        : null
    );
  };

  const handleTagsChange = (event: SelectChangeEvent<string>) => {
    const selected = event.target.value ? [event.target.value] : [];
    setEditedTask((prev) => (prev ? { ...prev, tags: selected } : null));
  };

  const handleStartDateChange = (date: string) => {
    const newStartDate = date ? new Date(date) : undefined;
    setEditedTask((prev) => {
      if (!prev) return null;

      const updatedTask = { ...prev, startDate: newStartDate };

      // If end date exists and is not greater than new start date, clear it
      if (
        updatedTask.endDate &&
        newStartDate &&
        updatedTask.endDate <= newStartDate
      ) {
        updatedTask.endDate = undefined;
      }

      return updatedTask;
    });
  };

  const handleEndDateChange = (date: string) => {
    const newEndDate = date ? new Date(date) : undefined;
    setEditedTask((prev) => {
      if (!prev) return null;

      // Validate that end date is greater than start date
      if (newEndDate && prev.startDate && newEndDate <= prev.startDate) {
        // Don't update if end date is not greater than start date
        return prev;
      }

      return { ...prev, endDate: newEndDate };
    });
  };

  const handleAttachmentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const fileNames = Array.from(files).map((f) => f.name);
      setEditedTask((prev) =>
        prev
          ? {
              ...prev,
              attachments: [...(prev.attachments || []), ...fileNames],
            }
          : null
      );
      e.target.value = '';
    }
  };

  const handleCommentAttachmentChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const fileNames = Array.from(files).map((f) => f.name);
      setEditedTask((prev) =>
        prev
          ? {
              ...prev,
              commentAttachments: [
                ...(prev.commentAttachments || []),
                ...fileNames,
              ],
            }
          : null
      );
      e.target.value = '';
    }
  };

  const handleAddCollaborator = (user: {
    name: string;
    initials: string;
    color: string;
  }) => {
    if (!selectedCollaborators.find((c) => c.name === user.name)) {
      setSelectedCollaborators([...selectedCollaborators, user]);
      setEditedTask((prev) =>
        prev
          ? { ...prev, collaborators: [...(prev.collaborators || []), user] }
          : null
      );
    }
  };

  const handleRemoveCollaborator = (userName: string) => {
    const updated = selectedCollaborators.filter((c) => c.name !== userName);
    setSelectedCollaborators(updated);
    setEditedTask((prev) =>
      prev ? { ...prev, collaborators: updated } : null
    );
  };

  const handleAssigneeChange = (user: {
    name: string;
    initials: string;
    color: string;
  }) => {
    setEditedTask((prev) => (prev ? { ...prev, assignee: user } : null));
    setShowAssigneeModal(false);
  };

  const getMinEndDate = () => {
    if (editedTask?.startDate) {
      const minDate = new Date(editedTask.startDate);
      minDate.setDate(minDate.getDate() + 1); // End date must be at least 1 day after start date
      return dayjs(minDate);
    }
    return undefined;
  };

  const formatDateForInput = (date: Date | undefined) => {
    if (!date) return null;
    return date instanceof Date ? dayjs(date) : dayjs(date);
  };

  return (
    <>
      <div
        className={`fixed right-0 bottom-0 w-[650px] bg-white text-gray-900 shadow-2xl transform transition-transform duration-300 ease-in-out z-50 overflow-y-auto ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        style={{ top: '38.8px' }}
      >
        {/* Header */}
        <div className='sticky top-0 flex items-center justify-between p-4 border-b border-gray-200 bg-white'>
          <button
            onClick={handleMarkComplete}
            className='flex items-center gap-2 px-3 py-1 bg-emerald-600 hover:bg-emerald-700 rounded text-sm font-medium transition-colors text-white'
          >
            <span className='text-xs'>✓</span>
            Mark complete
          </button>

          <div className='flex items-center gap-2'>
            <button
              onClick={onClose}
              className='p-2 hover:bg-gray-100 rounded transition-colors'
            >
              <CloseIcon size={16} className='text-gray-600' />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className='p-6 space-y-6'>
          {/* Task Title */}
          <div>
            {isEditing ? (
              <input
                type='text'
                value={editedTask?.title || ''}
                onChange={(e) =>
                  setEditedTask((prev) =>
                    prev ? { ...prev, title: e.target.value } : null
                  )
                }
                onBlur={handleSave}
                onKeyPress={(e) => e.key === 'Enter' && handleSave()}
                className='text-3xl font-bold bg-transparent border-b border-gray-300 focus:border-blue-500 outline-none w-full text-gray-900'
                autoFocus
              />
            ) : (
              <h1
                className='text-3xl font-bold cursor-pointer hover:bg-gray-50 rounded px-2 py-1 -mx-2 -my-1 transition-colors'
                onClick={() => setIsEditing(true)}
              >
                {task.title}
              </h1>
            )}
          </div>

          {/* Assignee */}
          <div className='flex items-center justify-between relative'>
            <span className='text-sm font-medium text-gray-600'>Assignee</span>
            <div className='flex items-center gap-2'>
              <div
                className='w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold text-white cursor-pointer'
                style={{ backgroundColor: task.assignee.color }}
                onClick={() => setShowAssigneeModal(!showAssigneeModal)}
              >
                {task.assignee.initials}
              </div>
              <span
                className='text-sm text-gray-900 cursor-pointer hover:text-blue-600 transition-colors'
                onClick={() => setShowAssigneeModal(!showAssigneeModal)}
              >
                {task.assignee.name}
              </span>
            </div>
            {showAssigneeModal && (
              <div className='absolute right-0 top-full mt-2 bg-white border border-gray-300 rounded-lg shadow-xl z-[60] w-64'>
                <div className='p-3 border-b border-gray-200'>
                  <h4 className='text-sm font-semibold text-gray-900'>
                    Change Assignee
                  </h4>
                </div>
                <div className='max-h-48 overflow-y-auto'>
                  {availableUsers.map((user) => (
                    <button
                      key={user.id}
                      onClick={() => handleAssigneeChange(user)}
                      className='w-full flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors text-left border-b border-gray-200 last:border-b-0'
                    >
                      <div
                        className='w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold text-white'
                        style={{ backgroundColor: user.color }}
                      >
                        {user.initials}
                      </div>
                      <div className='flex-1'>
                        <p className='text-sm text-gray-900'>{user.name}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Date Range */}
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <div className='grid grid-cols-2 gap-4'>
              <div>
                <label className='block text-xs font-medium text-gray-600 mb-1'>
                  Start Date
                </label>
                <DatePicker
                  value={formatDateForInput(editedTask?.startDate)}
                  onChange={(newValue) =>
                    handleStartDateChange(
                      newValue ? dayjs(newValue).format('YYYY-MM-DD') : ''
                    )
                  }
                  format='YYYY-MMM-DD'
                  slots={{
                    openPickerIcon: () => (
                      <CalendarIcon alt='calendar' className='w-4 h-4' />
                    ),
                    clearIcon: () => (
                      <CloseIcon alt='calendar' className='w-2.5 h-2.5' />
                    ),
                  }}
                  slotProps={{
                    field: { clearable: true },
                    clearButton: {
                      tabIndex: -1,
                    },
                    openPickerButton: {
                      tabIndex: -1,
                    },
                    popper: {
                      placement: 'bottom-start',
                      sx: {
                        '& .MuiPaper-root': {
                          width: 'auto !important',
                          minWidth: '280px !important',
                          maxWidth: '320px !important',
                        },
                      },
                      modifiers: [
                        {
                          name: 'flip',
                          enabled: true,
                          options: {
                            altBoundary: true,
                            rootBoundary: 'viewport',
                            padding: 8,
                          },
                        },
                        {
                          name: 'preventOverflow',
                          enabled: true,
                          options: {
                            altAxis: true,
                            altBoundary: true,
                            tether: true,
                            rootBoundary: 'viewport',
                            padding: 8,
                          },
                        },
                        {
                          name: 'offset',
                          options: {
                            offset: [0, 4],
                          },
                        },
                      ],
                    },
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
                            '& ::placeholder': {
                              color: '#7D98B6 !important',
                            },
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
                      },
                      placeholder: 'Select start date',
                    },
                  }}
                />
              </div>
              <div>
                <label className='block text-xs font-medium text-gray-600 mb-1'>
                  End Date
                </label>
                <DatePicker
                  value={formatDateForInput(editedTask?.endDate)}
                  onChange={(newValue) =>
                    handleEndDateChange(
                      newValue ? dayjs(newValue).format('YYYY-MM-DD') : ''
                    )
                  }
                  minDate={getMinEndDate()}
                  format='YYYY-MMM-DD'
                  slots={{
                    openPickerIcon: () => (
                      <CalendarIcon alt='calendar' className='w-4 h-4' />
                    ),
                    clearIcon: () => (
                      <CloseIcon alt='calendar' className='w-2.5 h-2.5' />
                    ),
                  }}
                  slotProps={{
                    field: { clearable: true },
                    clearButton: {
                      tabIndex: -1,
                    },
                    openPickerButton: {
                      tabIndex: -1,
                    },
                    popper: {
                      placement: 'bottom-start',
                      sx: {
                        '& .MuiPaper-root': {
                          width: 'auto !important',
                          minWidth: '280px !important',
                          maxWidth: '320px !important',
                        },
                      },
                      modifiers: [
                        {
                          name: 'flip',
                          enabled: true,
                          options: {
                            altBoundary: true,
                            rootBoundary: 'viewport',
                            padding: 8,
                          },
                        },
                        {
                          name: 'preventOverflow',
                          enabled: true,
                          options: {
                            altAxis: true,
                            altBoundary: true,
                            tether: true,
                            rootBoundary: 'viewport',
                            padding: 8,
                          },
                        },
                        {
                          name: 'offset',
                          options: {
                            offset: [0, 4],
                          },
                        },
                      ],
                    },
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
                            '& ::placeholder': {
                              color: '#7D98B6 !important',
                            },
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
                      },
                      placeholder: 'Select end date',
                    },
                  }}
                />
              </div>
            </div>
          </LocalizationProvider>

          <div>
            <h3 className='text-sm font-semibold text-gray-700 mb-3'>Fields</h3>
            <div className='border border-gray-200 rounded-lg divide-y divide-gray-200'>
              {/* Status Row */}
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
                  <span className='text-sm text-gray-700'>Status</span>
                </div>
                <div className='w-[140px]'>
                  <Select
                    name='status'
                    className='custom-select-no-arrow w-full h-full sm:text-sm px-1.5 py-[7px]'
                    onChange={handleStatusChange}
                    value={editedTask?.status || ''}
                    displayEmpty
                    fullWidth
                    size='small'
                    MenuProps={{
                      PaperProps: {
                        sx: {
                          maxWidth: 300,
                          maxHeight: 300,
                          marginTop: '4px',
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
                        color: !editedTask?.status ? '#7D98B6' : 'black',
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
                  >
                    <MenuItem
                      value=''
                      sx={{
                        color: '#425A76',
                        fontSize: '13px',
                        fontWeight: '500',
                      }}
                    >
                      Select Status
                    </MenuItem>
                    {(
                      statusData || [
                        { id: '1', name: 'To Do', color: '#gray' },
                        { id: '2', name: 'In Progress', color: '#blue' },
                        { id: '3', name: 'Done', color: '#green' },
                      ]
                    ).map((status) => (
                      <MenuItem
                        sx={{
                          color: '#425A76',
                          fontSize: '13px',
                          fontWeight: '500',
                        }}
                        key={status.id}
                        value={status.name}
                        title={status.name}
                      >
                        {status.name}
                      </MenuItem>
                    ))}
                  </Select>
                </div>
              </div>

              {/* Priority Row */}
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
                  <span className='text-sm text-gray-700'>Priority</span>
                </div>
                <div className='w-[140px]'>
                  <Select
                    name='priority'
                    className='custom-select-no-arrow w-full h-full sm:text-sm px-1.5 py-[7px]'
                    onChange={handlePriorityChange}
                    value={editedTask?.priority || ''}
                    displayEmpty
                    fullWidth
                    size='small'
                    MenuProps={{
                      PaperProps: {
                        sx: {
                          maxWidth: 300,
                          maxHeight: 300,
                          marginTop: '4px',
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
                        color: !editedTask?.priority ? '#7D98B6' : 'black',
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
                  >
                    <MenuItem
                      value=''
                      sx={{
                        color: '#425A76',
                        fontSize: '13px',
                        fontWeight: '500',
                      }}
                    >
                      Select Priority
                    </MenuItem>
                    {(
                      priorityData || [
                        { id: '1', name: 'Low', color: '#gray' },
                        { id: '2', name: 'Medium', color: '#yellow' },
                        { id: '3', name: 'High', color: '#red' },
                      ]
                    ).map((priority) => (
                      <MenuItem
                        sx={{
                          color: '#425A76',
                          fontSize: '13px',
                          fontWeight: '500',
                        }}
                        key={priority.id}
                        value={priority.name}
                        title={priority.name}
                      >
                        {priority.name}
                      </MenuItem>
                    ))}
                  </Select>
                </div>
              </div>

              {/* Tags Row */}
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
                    <path d='M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z'></path>
                    <line x1='7' y1='7' x2='7.01' y2='7'></line>
                  </svg>
                  <span className='text-sm text-gray-700'>Tags</span>
                </div>
                <div className='w-[140px]'>
                  <Select
                    name='tags'
                    className='custom-select-no-arrow w-full h-full sm:text-sm px-1.5 py-[7px]'
                    onChange={handleTagsChange}
                    value={editedTask?.tags?.[0] || ''}
                    displayEmpty
                    fullWidth
                    size='small'
                    MenuProps={{
                      PaperProps: {
                        sx: {
                          maxWidth: 300,
                          maxHeight: 300,
                          marginTop: '4px',
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
                        color: !editedTask?.tags?.[0] ? '#7D98B6' : 'black',
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
                  >
                    <MenuItem
                      value=''
                      sx={{
                        color: '#425A76',
                        fontSize: '13px',
                        fontWeight: '500',
                      }}
                    >
                      Select Tags
                    </MenuItem>
                    {(
                      tagData || [
                        { id: '1', name: 'Bug', color: '#red' },
                        { id: '2', name: 'Feature', color: '#blue' },
                        { id: '3', name: 'Enhancement', color: '#green' },
                      ]
                    ).map((tag) => (
                      <MenuItem
                        sx={{
                          color: '#425A76',
                          fontSize: '13px',
                          fontWeight: '500',
                        }}
                        key={tag.id}
                        value={tag.name}
                        title={tag.name}
                      >
                        {tag.name}
                      </MenuItem>
                    ))}
                  </Select>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h3 className='text-sm font-semibold text-gray-700 mb-3'>
              Description
            </h3>
            <textarea
              value={editedTask?.description || ''}
              onChange={handleDescriptionChange}
              placeholder='Ensure accuracy and completeness of Project IDs, project costs, FTE and subcontractor costs, and cost allocations.'
              className='w-full bg-white border border-gray-300 rounded-lg p-3 text-sm resize-none focus:border-blue-500 focus:outline-none text-gray-900 placeholder-gray-500 min-h-[100px]'
            />
          </div>

          <div>
            <h3 className='text-sm font-semibold text-gray-700 mb-3'>
              Attachments
            </h3>
            <div className='border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors cursor-pointer bg-gray-50'>
              <input
                type='file'
                multiple
                accept='*/*'
                onChange={handleAttachmentChange}
                className='hidden'
                id='attachments-input'
              />
              <label
                htmlFor='attachments-input'
                className='cursor-pointer block'
              >
                <p className='text-sm text-gray-600'>
                  📎 Click to upload attachments
                </p>
              </label>
            </div>
            {editedTask?.attachments && editedTask.attachments.length > 0 && (
              <div className='mt-3 space-y-2'>
                {editedTask.attachments.map((file, idx) => (
                  <div
                    key={idx}
                    className='text-xs text-gray-600 bg-gray-50 p-2 rounded flex items-center gap-2'
                  >
                    <span>📎</span> {file}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className='border-t border-gray-200 pt-6'>
            <div className='flex gap-6 mb-4 border-b border-gray-200'>
              <button
                onClick={() => setActiveTab('comments')}
                className={`text-sm font-medium pb-3 transition-colors ${
                  activeTab === 'comments'
                    ? 'text-gray-900 border-b-2 border-blue-500'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                Comments
              </button>
              <button
                onClick={() => setActiveTab('activity')}
                className={`text-sm font-medium pb-3 transition-colors ${
                  activeTab === 'activity'
                    ? 'text-gray-900 border-b-2 border-blue-500'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                All Activity
              </button>
            </div>

            {/* Comments Tab */}
            {activeTab === 'comments' && (
              <div className='space-y-4'>
                {/* Activity Feed in Comments */}
                <div className='space-y-3'>
                  {activities.map((activity, idx) => (
                    <div key={activity.id || idx} className='flex gap-3'>
                      <div className='w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 bg-amber-500 text-white'>
                        {activity.user
                          .split(' ')
                          .map((n) => n[0])
                          .join('')}
                      </div>
                      <div className='flex-1'>
                        <p className='text-sm text-gray-700'>
                          <span className='font-semibold'>{activity.user}</span>{' '}
                          {activity.action}
                          {activity.link && (
                            <span className='text-blue-600'>
                              {' '}
                              {activity.link}
                            </span>
                          )}
                          <span className='text-gray-500 text-xs ml-2'>·</span>
                          <span className='text-gray-500 text-xs ml-2'>
                            {activity.date}
                          </span>
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Comment Input */}
                <div className='flex items-start gap-3 mt-6 pt-4 border-t border-gray-200'>
                  <div
                    className='w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 text-white'
                    style={{ backgroundColor: task.assignee.color }}
                  >
                    {task.assignee.initials}
                  </div>
                  <div className='flex-1 space-y-3'>
                    <textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder='Add a comment'
                      className='w-full bg-white border border-gray-300 rounded-lg p-3 text-sm resize-none focus:border-blue-500 focus:outline-none text-gray-900 placeholder-gray-500 min-h-[80px]'
                    />
                    <div className='border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-gray-400 transition-colors cursor-pointer bg-gray-50'>
                      <input
                        type='file'
                        multiple
                        onChange={handleCommentAttachmentChange}
                        className='hidden'
                        id='comment-attachments-input'
                      />
                      <label
                        htmlFor='comment-attachments-input'
                        className='cursor-pointer block'
                      >
                        <p className='text-xs text-gray-600'>
                          📎 Click to upload attachments
                        </p>
                      </label>
                    </div>
                    {editedTask?.commentAttachments &&
                      editedTask.commentAttachments.length > 0 && (
                        <div className='space-y-1'>
                          {editedTask.commentAttachments.map((file, idx) => (
                            <div
                              key={idx}
                              className='text-xs text-gray-600 bg-gray-50 p-2 rounded flex items-center gap-2'
                            >
                              <span>📎</span> {file}
                            </div>
                          ))}
                        </div>
                      )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'activity' && (
              <div className='space-y-3'>
                {activities.map((activity, idx) => (
                  <div
                    key={activity.id || idx}
                    className='flex gap-3 pb-3 border-b border-gray-200 last:border-b-0'
                  >
                    <div className='w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 bg-amber-500 text-white'>
                      {activity.user
                        .split(' ')
                        .map((n) => n[0])
                        .join('')}
                    </div>
                    <div className='flex-1'>
                      <p className='text-sm text-gray-700'>
                        <span className='font-semibold'>{activity.user}</span>{' '}
                        {activity.action}
                        {activity.link && (
                          <span className='text-blue-600'>
                            {' '}
                            {activity.link}
                          </span>
                        )}
                      </p>
                      <p className='text-xs text-gray-500 mt-1'>
                        {activity.date}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className='border-t border-gray-200 pt-6'>
            <div className='flex items-center justify-between mb-3'>
              <h3 className='text-sm font-semibold text-gray-700'>
                Collaborators
              </h3>
              <button
                onClick={() => setShowCollaboratorModal(!showCollaboratorModal)}
                className='text-lg text-gray-600 hover:text-gray-900 transition-colors'
              >
                +
              </button>
            </div>
            <div className='flex items-center flex-wrap' style={{ gap: '2px' }}>
              {selectedCollaborators.map((collab, index) => (
                <div
                  key={collab.name}
                  className='relative group flex items-center'
                  title={collab.name}
                  style={{
                    marginRight:
                      index < selectedCollaborators.length - 1 ? '2px' : '0',
                  }}
                >
                  <div
                    className='w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold cursor-pointer text-white relative'
                    style={{ backgroundColor: collab.color }}
                  >
                    {collab.initials}
                    <button
                      onClick={() => handleRemoveCollaborator(collab.name)}
                      className='absolute -top-1 -right-1 w-4 h-4 bg-red-500 hover:bg-red-600 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity'
                      title={`Remove ${collab.name}`}
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {showCollaboratorModal && (
              <div className='absolute right-6 bottom-auto mb-2 bg-white border border-gray-300 rounded-lg shadow-xl z-[60] w-64 transform -translate-y-full'>
                <div className='p-3 border-b border-gray-200'>
                  <h4 className='text-sm font-semibold text-gray-900'>
                    Add Collaborators
                  </h4>
                </div>
                <div className='max-h-48 overflow-y-auto'>
                  {availableUsers.map((user) => (
                    <button
                      key={user.id}
                      onClick={() => {
                        handleAddCollaborator(user);
                        setShowCollaboratorModal(false);
                      }}
                      disabled={
                        !!selectedCollaborators.find(
                          (c) => c.name === user.name
                        )
                      }
                      className='w-full flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed border-b border-gray-200 last:border-b-0'
                    >
                      <div
                        className='w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold text-white'
                        style={{ backgroundColor: user.color }}
                      >
                        {user.initials}
                      </div>
                      <div className='flex-1'>
                        <p className='text-sm text-gray-900'>{user.name}</p>
                      </div>
                      {selectedCollaborators.find(
                        (c) => c.name === user.name
                      ) && <span className='text-xs text-green-600'>✓</span>}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default TaskDetailModal;
