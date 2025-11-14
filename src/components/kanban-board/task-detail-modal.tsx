import { useEffect, useState } from 'react';
import { TaskDetailModalProps, Task } from './types';
import { MenuItem, Select, SelectChangeEvent } from '@mui/material';
import dayjs from 'dayjs';
import { CalendarIcon, CloseIcon } from '../../assets';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { enrichTask, enrichUserOption } from './helper';

const TaskDetailModal: React.FC<TaskDetailModalProps> = ({
  taskId,
  isOpen,
  onClose,
  onTaskUpdate,
  statusData = [],
  priorityData = [],
  tagData = [],
  availableUsers = [],
  onFetchTaskDetails,
  fieldVisibility = {},
  fieldDisabled = {},
}) => {
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedTask, setEditedTask] = useState<Task | null>(null);
  const [comment, setComment] = useState('');
  const [activeTab, setActiveTab] = useState<'comments' | 'activity'>(
    'comments'
  );
  const [hideCheckedItems, setHideCheckedItems] = useState(false);

  const enrichedUsers = availableUsers.map(enrichUserOption);

  useEffect(() => {
    const fetchTask = async () => {
      if (!taskId || !onFetchTaskDetails) {
        setTask(null);
        setEditedTask(null);
        return;
      }

      setLoading(true);
      try {
        const fetchedTask = await onFetchTaskDetails(taskId);
        if (fetchedTask) {
          const enrichedTask = enrichTask(fetchedTask);
          setTask(enrichedTask);
          setEditedTask(enrichedTask);
        } else {
          setTask(null);
          setEditedTask(null);
        }
      } catch (error) {
        console.error('Error fetching task details:', error);
        setTask(null);
        setEditedTask(null);
      } finally {
        setLoading(false);
      }
    };

    if (isOpen) {
      fetchTask();
    }
  }, [taskId, isOpen, onFetchTaskDetails]);

  if (!isOpen || !taskId) return null;

  if (loading) {
    return (
      <div
        className='fixed right-0 bottom-0 w-[650px] bg-white text-gray-900 shadow-2xl z-50 flex items-center justify-center'
        style={{ top: '38.1px' }}
      >
        <div className='animate-pulse text-center'>
          <div className='h-8 w-48 bg-slate-200 rounded mx-auto mb-4'></div>
          <div className='h-4 w-32 bg-slate-200 rounded mx-auto'></div>
        </div>
      </div>
    );
  }

  if (!task || !editedTask) {
    return (
      <div
        className='fixed right-0 bottom-0 w-[650px] bg-white text-gray-900 shadow-2xl z-50 flex items-center justify-center'
        style={{ top: '38.1px' }}
      >
        <div className='text-center text-gray-500'>
          <p>Task not found</p>
          <button
            onClick={onClose}
            className='mt-4 px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded text-sm'
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  const handleSave = () => {
    if (editedTask && taskId) {
      onTaskUpdate(taskId, editedTask);
      setIsEditing(false);
    }
  };

  const handleMarkComplete = () => {
    if (editedTask && taskId) {
      const updatedTask = { ...editedTask, status: 'Done' as const };
      setEditedTask(updatedTask);
      onTaskUpdate(taskId, { status: 'Done' });
    }
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

  const handleStartDateChange = (date: string) => {
    const newStartDate = date ? new Date(date) : undefined;
    setEditedTask((prev) => {
      if (!prev) return null;
      const updatedTask = { ...prev, startDate: newStartDate };
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
      if (newEndDate && prev.startDate && newEndDate <= prev.startDate) {
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

  const handleRemoveAttachment = (indexToRemove: number) => {
    setEditedTask((prev) =>
      prev
        ? {
            ...prev,
            attachments:
              prev.attachments?.filter((_, index) => index !== indexToRemove) ||
              [],
          }
        : null
    );
  };

  const handleRemoveCommentAttachment = (indexToRemove: number) => {
    setEditedTask((prev) =>
      prev
        ? {
            ...prev,
            commentAttachments:
              prev.commentAttachments?.filter(
                (_, index) => index !== indexToRemove
              ) || [],
          }
        : null
    );
  };

  const handleAssigneeChange = (event: SelectChangeEvent<string>) => {
    const selectedUser = enrichedUsers.find(
      (user) => user.id === event.target.value
    );
    if (selectedUser) {
      setEditedTask((prev) =>
        prev
          ? {
              ...prev,
              assignee: {
                name: selectedUser.name,
                initials: selectedUser.initials,
                color: selectedUser.color,
              },
            }
          : null
      );
    }
  };

  const getAssigneeForSelect = () => {
    if (!editedTask?.assignee) return '';
    const foundUser = enrichedUsers.find(
      (u) => u.name === editedTask.assignee.name
    );
    return foundUser?.id || '';
  };

  const getMinEndDate = () => {
    if (editedTask?.startDate) {
      const minDate = new Date(editedTask.startDate);
      minDate.setDate(minDate.getDate() + 1);
      return dayjs(minDate);
    }
    return undefined;
  };

  const formatDateForInput = (date: Date | undefined) => {
    if (!date) return null;
    return date instanceof Date ? dayjs(date) : dayjs(date);
  };

  const handleChecklistToggle = (itemId: string) => {
    const updatedChecklist = (editedTask.checklist || []).map((item) =>
      item.id === itemId ? { ...item, completed: !item.completed } : item
    );

    setEditedTask((prev) =>
      prev ? { ...prev, checklist: updatedChecklist } : null
    );
    if (taskId) {
      onTaskUpdate(taskId, { checklist: updatedChecklist });
    }
  };

  const getCompletionPercentage = () => {
    const checklist = editedTask.checklist || [];
    if (checklist.length === 0) return 0;
    const completedItems = checklist.filter((item) => item.completed).length;
    return Math.round((completedItems / checklist.length) * 100);
  };

  const getFilteredChecklistItems = () => {
    const checklist = editedTask.checklist || [];
    return hideCheckedItems
      ? checklist.filter((item) => !item.completed)
      : checklist;
  };

  const handleCollaboratorsChange = (event: SelectChangeEvent<string[]>) => {
    const selectedUserIds = event.target.value as string[];
    const selectedUsers = enrichedUsers.filter((user) =>
      selectedUserIds.includes(user.id)
    );
    const collaborators = selectedUsers.map((user) => ({
      name: user.name,
      initials: user.initials,
      color: user.color,
    }));
    setEditedTask((prev) => (prev ? { ...prev, collaborators } : null));
  };

  const getCollaboratorsForSelect = () => {
    const collaborators = editedTask.collaborators || [];
    return collaborators
      .map((collab) => {
        const user = enrichedUsers.find((u) => u.name === collab.name);
        return user?.id || '';
      })
      .filter((id) => id !== '');
  };

  return (
    <>
      <div
        className={`fixed right-0 bottom-0 w-[650px] bg-white text-gray-900 shadow-2xl transform transition-transform duration-300 ease-in-out z-50 overflow-y-auto ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        style={{ top: '38.1px' }}
      >
        <div className='sticky top-0 flex items-center justify-between p-4 border-b border-gray-200 bg-white z-50 shadow-sm'>
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

        <div className='p-6 space-y-6'>
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
                  value={getAssigneeForSelect()}
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
                      color: !editedTask?.assignee ? '#7D98B6' : 'black',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
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
                  renderValue={() => {
                    if (editedTask?.assignee) {
                      return (
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
                              backgroundColor: editedTask.assignee.color,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '9px',
                              fontWeight: '600',
                              color: 'white',
                            }}
                          >
                            {editedTask.assignee.initials}
                          </div>
                          <span style={{ fontSize: '13px', color: 'black' }}>
                            {editedTask.assignee.name}
                          </span>
                        </div>
                      );
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
                    Start Date
                  </label>
                  <DatePicker
                    disabled={fieldDisabled.startDate}
                    value={formatDateForInput(editedTask?.startDate)}
                    onChange={(newValue) =>
                      handleStartDateChange(
                        newValue ? dayjs(newValue).format('YYYY-MM-DD') : ''
                      )
                    }
                    format='YYYY-MMM-DD'
                    slots={{
                      openPickerIcon: () => (
                        <CalendarIcon className='w-4 h-4' />
                      ),
                      clearIcon: () => <CloseIcon className='w-2.5 h-2.5' />,
                    }}
                    slotProps={{
                      field: { clearable: true },
                      clearButton: { tabIndex: -1 },
                      openPickerButton: { tabIndex: -1 },
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
                          { name: 'offset', options: { offset: [0, 4] } },
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
              )}
              {!fieldVisibility.endDate && (
                <div>
                  <label className='block text-xs font-medium text-gray-600 mb-1'>
                    Due Date
                  </label>
                  <DatePicker
                    disabled={fieldDisabled.endDate}
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
                        <CalendarIcon className='w-4 h-4' />
                      ),
                      clearIcon: () => <CloseIcon className='w-2.5 h-2.5' />,
                    }}
                    slotProps={{
                      field: { clearable: true },
                      clearButton: { tabIndex: -1 },
                      openPickerButton: { tabIndex: -1 },
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
                          { name: 'offset', options: { offset: [0, 4] } },
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
                    <span className='text-sm text-gray-700'>Status</span>
                  </div>
                  <div className='w-[140px]'>
                    <Select
                      name='status'
                      disabled={fieldDisabled.status}
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
                      {statusData.map((status) => (
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
                    <span className='text-sm text-gray-700'>Priority</span>
                  </div>
                  <div className='w-[140px]'>
                    <Select
                      name='priority'
                      disabled={fieldDisabled.priority}
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
                      {priorityData.map((priority) => (
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
                    <div className='w-[140px]'>
                      <Select
                        name='tags'
                        disabled={fieldDisabled.tags}
                        className='custom-select-no-arrow w-full h-full sm:text-sm px-1.5 py-[7px]'
                        onChange={(event: SelectChangeEvent<string[]>) => {
                          const selectedTags = event.target.value as string[];
                          setEditedTask((prev) =>
                            prev ? { ...prev, tags: selectedTags } : null
                          );
                        }}
                        value={editedTask?.tags || []}
                        displayEmpty
                        fullWidth
                        size='small'
                        multiple
                        renderValue={() => (
                          <span style={{ color: '#7D98B6', fontSize: '13px' }}>
                            Add Tags
                          </span>
                        )}
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
                            color: '#7D98B6',
                            display: 'flex',
                            alignItems: 'center',
                            minHeight: '20px',
                            overflow: 'hidden',
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
                        {tagData.map((tag) => (
                          <MenuItem
                            sx={{
                              color: '#425A76',
                              fontSize: '13px',
                              fontWeight: '500',
                              backgroundColor: editedTask?.tags?.includes(
                                tag.name
                              )
                                ? '#EBF8FF'
                                : 'inherit',
                            }}
                            key={tag.id}
                            value={tag.name}
                            title={tag.name}
                          >
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                width: '100%',
                              }}
                            >
                              <input
                                type='checkbox'
                                checked={
                                  editedTask?.tags?.includes(tag.name) || false
                                }
                                onChange={() => {}}
                                style={{ margin: 0, pointerEvents: 'none' }}
                              />
                              <span style={{ flex: 1 }}>{tag.name}</span>
                            </div>
                          </MenuItem>
                        ))}
                      </Select>
                    </div>
                  </div>

                  {editedTask?.tags && editedTask.tags.length > 0 && (
                    <div className='flex flex-wrap items-center gap-2 mt-2'>
                      {editedTask.tags.map((tag, index) => (
                        <div
                          key={index}
                          className='inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium hover:bg-blue-200 transition-colors group'
                        >
                          <span>{tag}</span>
                          <button
                            onClick={() => {
                              const newTags =
                                editedTask.tags?.filter((t) => t !== tag) || [];
                              setEditedTask((prev) =>
                                prev ? { ...prev, tags: newTags } : null
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

          {!fieldVisibility.checklist &&
            editedTask.checklist &&
            editedTask.checklist.length > 0 && (
              <div>
                <div className='flex items-center justify-between mb-3'>
                  <h3 className='text-sm font-semibold text-gray-700'>
                    TC Checklist
                  </h3>
                  <div className='flex items-center gap-2'>
                    <button
                      onClick={() => setHideCheckedItems(!hideCheckedItems)}
                      style={{
                        height: '24px !important',
                        color: '#425A76',
                        border: '1px solid #CBD6E2',
                        boxShadow: '0px 1px 2px 0px rgba(42, 54, 71, 0.05)',
                        background:
                          'linear-gradient(180deg, #FFFFFF 0%, #E4E6E7 100%)',
                        textTransform: 'none',
                        fontSize: '13px',
                        fontWeight: 400,
                        padding: '0px 8px',
                        borderRadius: '2px',
                        cursor: 'pointer',
                      }}
                      className='transition-colors hover:text-[#425A76]'
                    >
                      {hideCheckedItems
                        ? 'Show Checked Items'
                        : 'Hide Checked Items'}
                    </button>
                  </div>
                </div>

                <div className='mb-4'>
                  <div className='flex items-center justify-between text-xs text-gray-600 mb-1'>
                    <span>Progress</span>
                    <span>{getCompletionPercentage()}% Complete</span>
                  </div>
                  <div className='w-full bg-gray-200 rounded-full h-2'>
                    <div
                      className='bg-emerald-500 h-2 rounded-full transition-all duration-300 ease-in-out'
                      style={{ width: `${getCompletionPercentage()}%` }}
                    ></div>
                  </div>
                  <div className='text-xs text-gray-500 mt-1'>
                    {
                      editedTask.checklist.filter((item) => item.completed)
                        .length
                    }{' '}
                    of {editedTask.checklist.length} items completed
                  </div>
                </div>

                <div className='border border-gray-200 rounded-lg'>
                  <div
                    className={`space-y-0 ${
                      getFilteredChecklistItems().length > 6
                        ? 'max-h-64 overflow-y-auto'
                        : ''
                    }`}
                  >
                    {getFilteredChecklistItems().map((item, index) => (
                      <div
                        key={item.id}
                        className={`flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors ${
                          index !== getFilteredChecklistItems().length - 1
                            ? 'border-b border-gray-200'
                            : ''
                        }`}
                      >
                        <input
                          type='checkbox'
                          checked={item.completed}
                          onChange={() => handleChecklistToggle(item.id)}
                          className='w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500 focus:ring-2 cursor-pointer'
                          disabled={fieldDisabled.checklist}
                        />
                        <span
                          className={`flex-1 text-sm transition-all duration-200 cursor-pointer ${
                            item.completed
                              ? 'line-through text-gray-500'
                              : 'text-gray-700'
                          }`}
                          style={{ fontSize: '13px' }}
                          onClick={() =>
                            !fieldDisabled.checklist &&
                            handleChecklistToggle(item.id)
                          }
                        >
                          {item.text}
                        </span>
                        {item.completed && (
                          <svg
                            className='w-4 h-4 text-emerald-500'
                            fill='currentColor'
                            viewBox='0 0 20 20'
                          >
                            <path
                              fillRule='evenodd'
                              d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z'
                              clipRule='evenodd'
                            />
                          </svg>
                        )}
                      </div>
                    ))}

                    {getFilteredChecklistItems().length === 0 &&
                      hideCheckedItems && (
                        <div className='px-4 py-6 text-center text-gray-500 text-sm'>
                          All items are completed
                        </div>
                      )}
                  </div>
                </div>
              </div>
            )}

          {!fieldVisibility.description && (
            <div>
              <h3 className='text-sm font-semibold text-gray-700 mb-3'>
                Description
              </h3>
              <textarea
                value={editedTask?.description || ''}
                onChange={handleDescriptionChange}
                placeholder=''
                className='w-full bg-white border border-gray-300 rounded-lg p-3 text-sm resize-none focus:border-blue-500 focus:outline-none text-gray-900 placeholder-gray-500 min-h-[100px]'
                disabled={fieldDisabled.description}
              />
            </div>
          )}

          {!fieldVisibility.attachments && (
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
                  disabled={fieldDisabled.attachments}
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
                      <button
                        onClick={() => handleRemoveAttachment(idx)}
                        className='ml-auto text-red-500 hover:text-red-700 transition-colors'
                        disabled={fieldDisabled.attachments}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {!fieldVisibility.comments && (
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

              {activeTab === 'comments' && (
                <div className='space-y-4'>
                  <div className='flex items-start gap-3 mt-6 pt-4 border-t border-gray-200'>
                    <div
                      className='w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 text-white'
                      style={{
                        backgroundColor: task.assignee?.color || '#999',
                        fontSize: '8px',
                      }}
                    >
                      {task.assignee?.initials || '?'}
                    </div>
                    <div className='flex-1 space-y-3'>
                      <textarea
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder='Add a comment'
                        className='w-full bg-white border border-gray-300 rounded-lg p-3 text-sm resize-none focus:border-blue-500 focus:outline-none text-gray-900 placeholder-gray-500 min-h-[80px]'
                        disabled={fieldDisabled.comments}
                      />
                      <div className='border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-gray-400 transition-colors cursor-pointer bg-gray-50'>
                        <input
                          type='file'
                          multiple
                          onChange={handleCommentAttachmentChange}
                          className='hidden'
                          id='comment-attachments-input'
                          disabled={fieldDisabled.comments}
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
                                <button
                                  onClick={() =>
                                    handleRemoveCommentAttachment(idx)
                                  }
                                  className='ml-auto text-red-500 hover:text-red-700 transition-colors'
                                  disabled={fieldDisabled.comments}
                                >
                                  Remove
                                </button>
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
                  {(task?.activities || []).length > 0 ? (
                    (task?.activities || []).map((activity, idx) => (
                      <div
                        key={activity.id || idx}
                        className='flex gap-3 pb-3 border-b border-gray-200 last:border-b-0'
                      >
                        <div
                          className='w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 bg-amber-500 text-white'
                          style={{ fontSize: '8px' }}
                        >
                          {activity.user
                            .split(' ')
                            .map((n) => n[0])
                            .join('')}
                        </div>
                        <div className='flex-1'>
                          <p className='text-sm text-gray-700'>
                            <span className='font-semibold'>
                              {activity.user}
                            </span>{' '}
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
                    ))
                  ) : (
                    <div className='text-center py-4'>
                      <p className='text-sm text-gray-500'>No activities yet</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {!fieldVisibility.collaborators && (
            <div className='border-t border-gray-200 pt-6 relative'>
              <div className='flex items-center justify-between mb-3'>
                <h3 className='text-sm font-semibold text-gray-700'>
                  Collaborators
                </h3>
                <div className='w-[200px] relative'>
                  <Select
                    name='collaborators'
                    className='custom-select-no-arrow w-full h-full sm:text-sm px-1.5 py-[7px]'
                    onChange={handleCollaboratorsChange}
                    value={getCollaboratorsForSelect()}
                    displayEmpty
                    fullWidth
                    size='small'
                    multiple
                    renderValue={() => (
                      <span
                        style={{
                          color: '#7D98B6',
                          fontSize: '13px',
                          fontWeight: '400',
                        }}
                      >
                        Add Collaborators
                      </span>
                    )}
                    MenuProps={{
                      anchorOrigin: {
                        vertical: 'top',
                        horizontal: 'left',
                      },
                      transformOrigin: {
                        vertical: 'bottom',
                        horizontal: 'left',
                      },
                      PaperProps: {
                        sx: {
                          maxWidth: 300,
                          maxHeight: 300,
                          marginBottom: '8px',
                          zIndex: 9999,
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
                      slotProps: {
                        paper: {
                          style: {
                            marginBottom: '8px',
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
                        color: '#7D98B6',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        minHeight: '20px',
                        overflow: 'hidden',
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
                    {enrichedUsers.map((user) => {
                      const isSelected =
                        editedTask.collaborators?.find(
                          (c) => c.name === user.name
                        ) !== undefined;
                      return (
                        <MenuItem
                          sx={{
                            color: '#425A76',
                            fontSize: '13px',
                            fontWeight: '500',
                            backgroundColor: isSelected ? '#EBF8FF' : 'inherit',
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
                              width: '100%',
                            }}
                          >
                            <input
                              type='checkbox'
                              checked={isSelected}
                              onChange={() => {}}
                              style={{ margin: 0, pointerEvents: 'none' }}
                            />
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
                            <span style={{ flex: 1 }}>{user.name}</span>
                          </div>
                        </MenuItem>
                      );
                    })}
                  </Select>
                </div>
              </div>

              <div className='flex items-center -space-x-2'>
                {(editedTask.collaborators || []).map((collab, index) => (
                  <div
                    key={collab.name}
                    className={`relative group transition-transform duration-200 hover:scale-110 hover:z-10 hover:-translate-y-2 ${
                      index < (editedTask.collaborators?.length || 0) - 1
                        ? 'peer'
                        : ''
                    }`}
                    title={collab.name}
                    onMouseEnter={() => {
                      const nextProfile = document.querySelector(
                        `[data-profile-index="${index + 1}"]`
                      ) as HTMLElement;
                      if (nextProfile) {
                        nextProfile.style.transform = 'translateX(8px)';
                      }
                    }}
                    onMouseLeave={() => {
                      const nextProfile = document.querySelector(
                        `[data-profile-index="${index + 1}"]`
                      ) as HTMLElement;
                      if (nextProfile) {
                        nextProfile.style.transform = 'translateX(0)';
                      }
                    }}
                    data-profile-index={index}
                  >
                    <div
                      className='w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold cursor-pointer text-white border-2 border-white shadow-md transition-all duration-300 ease-in-out group-hover:shadow-xl group-hover:border-blue-200'
                      style={{ backgroundColor: collab.color, fontSize: '8px' }}
                    >
                      {collab.initials}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const updatedCollabs =
                            editedTask.collaborators?.filter(
                              (c) => c.name !== collab.name
                            ) || [];
                          setEditedTask((prev) =>
                            prev
                              ? { ...prev, collaborators: updatedCollabs }
                              : null
                          );
                        }}
                        className='absolute -top-1 -right-1 w-4 h-4 bg-red-500 hover:bg-red-600 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 ease-in-out scale-0 group-hover:scale-100 shadow-sm'
                        title={`Remove ${collab.name}`}
                      >
                        ×
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default TaskDetailModal;
