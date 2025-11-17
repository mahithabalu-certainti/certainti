import type React from 'react';
import { useEffect, useRef, useState } from 'react';
import type { KanbanColumnProps, TaskCard } from './types';
import { useDroppable } from '@dnd-kit/core';
import { AddIcon, CloseIcon, CalendarIcon } from '../../assets';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { MenuItem, Select, type SelectChangeEvent } from '@mui/material';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import TextButton from '../button/text-button';
import TaskCardComponent from './task-card';
import type { RoleOption } from '../../consultant/services/case-team/case-team-service';

interface ExtendedKanbanColumnProps extends KanbanColumnProps {
  isDragable?: boolean;
  isDragablebetweenBoards?: boolean;
  roleOptions?: RoleOption[];
}

const KanbanColumn: React.FC<ExtendedKanbanColumnProps> = ({
  column,
  showTaskCount,
  showCommentCount,
  showProfileIndicator,
  isCreateTaskDisabled,
  isCreateTaskHide,
  onAddTask,
  onTaskClick,
  isDragable = false,
  isDragablebetweenBoards = false,
  statusData,
  statusOptions,
  priorityData,
  onTaskUpdate,
  onCreateTask,
  roleOptions = [],
}) => {
  const [isAddingTaskAtBottom, setIsAddingTaskAtBottom] = useState(false);
  const [newBottomTaskTitle, setNewBottomTaskTitle] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedStatusRid, setSelectedStatusRid] = useState('');
  const [selectedPriority, setSelectedPriority] = useState('');
  const [selectedPriorityRid, setSelectedPriorityRid] = useState('');
  const [startDate, setStartDate] = useState<dayjs.Dayjs | null>(null);
  const [endDate, setEndDate] = useState<dayjs.Dayjs | null>(null);
  const [effortInDays, setEffortInDays] = useState<number>(0);
  const [reminderInterval, setReminderInterval] = useState<number>(0);
  const [taskDescription, setTaskDescription] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [selectedRoleRid, setSelectedRoleRid] = useState('');
  const bottomInputRef = useRef<HTMLInputElement>(null);

  const { setNodeRef } = useDroppable({
    id: column.rid,
    data: { type: 'Column', column },
  });

  useEffect(() => {
    if (isAddingTaskAtBottom && bottomInputRef.current) {
      bottomInputRef.current.focus();

      // Set default status to "To Do"
      const toDoStatus = statusData?.find((s) => s.name === 'To Do');
      if (toDoStatus) {
        setSelectedStatus('To Do');
        setSelectedStatusRid(toDoStatus.id);
      }
    }
  }, [isAddingTaskAtBottom, statusData]);

  const handleAddTaskAtBottom = async () => {
    if (
      newBottomTaskTitle.trim() &&
      selectedStatus &&
      selectedStatusRid &&
      selectedPriority &&
      selectedPriorityRid &&
      startDate &&
      endDate
    ) {
      const newTask: TaskCard = {
        rid: `task-${Date.now()}`,
        r_number: `T-${Date.now()}`,
        task_name: newBottomTaskTitle.trim(),
        created_by: '',
        status_rid: selectedStatusRid,
        assigned_to: null,
        sequence_no: column.tasks.length + 1,
        priority_rid: selectedPriorityRid,
        task_type_rid: '',
        effort_in_days: effortInDays,
        checklists_count: 0,
        task_description: taskDescription,
        reminder_interval: reminderInterval,
        effective_end_datetime: endDate ? endDate.format('YYYY-MM-DD') : '',
        effective_start_datetime: startDate
          ? startDate.format('YYYY-MM-DD')
          : '',
        case_team_member_role_rid: selectedRoleRid,
        milestone_template_rid: column.rid,
        priority_name: selectedPriority,
        assigned_to_name: null,
        case_team_member_role_name: selectedRole,
        task_type_name: '',
        status_name: selectedStatus,
        task_status_name: selectedStatus,
      };

      try {
        if (onCreateTask) {
          await onCreateTask(column.rid, newTask);
        }
        onAddTask(column.rid, newTask, 'bottom');
        setNewBottomTaskTitle('');
        setSelectedStatus('');
        setSelectedStatusRid('');
        setSelectedPriority('');
        setSelectedPriorityRid('');
        setStartDate(null);
        setEndDate(null);
        setEffortInDays(0);
        setReminderInterval(0);
        setTaskDescription('');
        setSelectedRole('');
        setSelectedRoleRid('');
        setIsAddingTaskAtBottom(false);
      } catch (error) {
        console.error('Failed to create task:', error);
      }
    }
  };

  const handleBottomKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddTaskAtBottom();
    } else if (e.key === 'Escape') {
      handleCancelAddTask();
    }
  };

  const handleCancelAddTask = () => {
    setIsAddingTaskAtBottom(false);
    setNewBottomTaskTitle('');
    setSelectedStatus('');
    setSelectedStatusRid('');
    setSelectedPriority('');
    setSelectedPriorityRid('');
    setStartDate(null);
    setEndDate(null);
    setEffortInDays(0);
    setReminderInterval(0);
    setTaskDescription('');
    setSelectedRole('');
    setSelectedRoleRid('');
  };

  const handleStatusChange = (event: SelectChangeEvent<string>) => {
    const selectedName = event.target.value;
    setSelectedStatus(selectedName);

    // Find the corresponding ID from statusData
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

  return (
    <div
      ref={setNodeRef}
      className='bg-[#f5f5f5] rounded-lg p-4 w-80 flex-shrink-0'
      style={{ fontFamily: "'Mulish', 'Lexend', sans-serif" }}
    >
      <div className='bg-white border border-slate-200 rounded-lg p-3 mb-2'>
        <div className='flex items-center gap-2'>
          <h2
            className='text-slate-800 text-[13px] font-semibold'
            style={{ fontFamily: "'Mulish', 'Lexend', sans-serif" }}
          >
            {column.milestone_name}
          </h2>
          {showTaskCount && (
            <span
              className='bg-slate-100 text-slate-600 px-2 py-1 rounded-full text-[13px]'
              style={{ fontFamily: "'Mulish', 'Lexend', sans-serif" }}
            >
              {column.task_count}
            </span>
          )}
        </div>
      </div>

      <SortableContext
        items={column.tasks.map((t) => t.rid)}
        strategy={verticalListSortingStrategy}
        disabled={!isDragable && !isDragablebetweenBoards}
      >
        <div className='space-y-2 mb-2'>
          {column.tasks.map((taskCard) => (
            <TaskCardComponent
              key={taskCard.rid}
              taskId={taskCard.rid}
              taskData={taskCard}
              showCommentCount={showCommentCount}
              showProfileIndicator={showProfileIndicator}
              onTaskClick={onTaskClick}
              isDragable={isDragable}
              isDragablebetweenBoards={isDragablebetweenBoards}
              statusData={statusData}
              statusOptions={statusOptions}
              priorityData={priorityData}
              onTaskUpdate={onTaskUpdate}
            />
          ))}
        </div>
      </SortableContext>

      {isAddingTaskAtBottom && (
        <div className='mb-2 bg-white border border-slate-300 rounded-lg p-3'>
          <input
            ref={bottomInputRef}
            type='text'
            value={newBottomTaskTitle}
            onChange={(e) => setNewBottomTaskTitle(e.target.value)}
            onKeyDown={handleBottomKeyPress}
            placeholder='Enter task name'
            className='w-full p-2 bg-white text-slate-800 rounded text-[13px] placeholder-slate-500 mb-3'
            style={{
              fontFamily: "'Mulish', 'Lexend', sans-serif",
              fontSize: '13px',
              border: '1px solid #CBD6E2',
            }}
          />

          <div className='space-y-3 mb-3'>
            <div className='flex gap-2'>
              <div className='flex-1'>
                <label
                  className='text-[13px] text-gray-600 block mb-1'
                  style={{ fontFamily: "'Mulish', 'Lexend', sans-serif" }}
                >
                  Status
                </label>
                <Select
                  value={selectedStatus}
                  onChange={handleStatusChange}
                  displayEmpty
                  disabled
                  fullWidth
                  size='small'
                  sx={{
                    height: '32px',
                    fontSize: '13px',
                    fontFamily: "'Mulish', 'Lexend', sans-serif",
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
                      <span style={{ color: '#7D98B6' }}>To Do</span>
                    )
                  }
                >
                  {statusData?.map((status) => (
                    <MenuItem
                      key={status.id}
                      value={status.name}
                      sx={{
                        fontSize: '13px',
                        fontFamily: "'Mulish', 'Lexend', sans-serif",
                      }}
                    >
                      {status.name}
                    </MenuItem>
                  ))}
                </Select>
              </div>

              <div className='flex-1'>
                <label
                  className='text-[13px] text-gray-600 block mb-1'
                  style={{ fontFamily: "'Mulish', 'Lexend', sans-serif" }}
                >
                  Priority
                </label>
                <Select
                  value={selectedPriority}
                  onChange={handlePriorityChange}
                  displayEmpty
                  fullWidth
                  size='small'
                  sx={{
                    height: '32px',
                    fontSize: '13px',
                    fontFamily: "'Mulish', 'Lexend', sans-serif",
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
                      color: selectedPriority ? 'black' : '#7D98B6',
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
                      <span style={{ color: '#7D98B6' }}>Choose Priority</span>
                    )
                  }
                >
                  {priorityData?.map((priority) => (
                    <MenuItem
                      key={priority.id}
                      value={priority.name}
                      sx={{
                        fontSize: '13px',
                        fontFamily: "'Mulish', 'Lexend', sans-serif",
                      }}
                    >
                      {priority.name}
                    </MenuItem>
                  ))}
                </Select>
              </div>
            </div>

            <div className='flex gap-2'>
              <div className='flex-1'>
                <label
                  className='text-[13px] text-gray-600 block mb-1'
                  style={{ fontFamily: "'Mulish', 'Lexend', sans-serif" }}
                >
                  User Role
                </label>
                <Select
                  value={selectedRole}
                  onChange={handleRoleChange}
                  displayEmpty
                  fullWidth
                  size='small'
                  sx={{
                    height: '32px',
                    fontSize: '13px',
                    fontFamily: "'Mulish', 'Lexend', sans-serif",
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
                      color: selectedRole ? 'black' : '#7D98B6',
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
                      <span style={{ color: '#7D98B6' }}>Choose User Role</span>
                    )
                  }
                >
                  {roleOptions?.map((role) => (
                    <MenuItem
                      key={role.rid}
                      value={role.role_name}
                      sx={{
                        fontSize: '13px',
                        fontFamily: "'Mulish', 'Lexend', sans-serif",
                      }}
                    >
                      {role.role_name}
                    </MenuItem>
                  ))}
                </Select>
              </div>
            </div>

            {/* Start Date in one row */}
            <div className='flex gap-2'>
              <div className='flex-1'>
                <label
                  className='text-[13px] text-gray-600 block mb-1'
                  style={{ fontFamily: "'Mulish', 'Lexend', sans-serif" }}
                >
                  Start Date
                </label>
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                  <DatePicker
                    value={startDate}
                    onChange={(newValue) => setStartDate(newValue)}
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
                              fontFamily: "'Mulish', 'Lexend', sans-serif",
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
                      },
                    }}
                  />
                </LocalizationProvider>
              </div>
            </div>

            {/* End Date in one row */}
            <div className='flex gap-2'>
              <div className='flex-1'>
                <label
                  className='text-[13px] text-gray-600 block mb-1'
                  style={{ fontFamily: "'Mulish', 'Lexend', sans-serif" }}
                >
                  End Date
                </label>
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                  <DatePicker
                    value={endDate}
                    onChange={(newValue) => setEndDate(newValue)}
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
                              fontFamily: "'Mulish', 'Lexend', sans-serif",
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
                      },
                    }}
                  />
                </LocalizationProvider>
              </div>
            </div>

            {/* Effort in Days and Reminder Interval */}
            <div className='flex gap-2'>
              <div className='flex-1'>
                <label
                  className='text-[13px] text-gray-600 block mb-1'
                  style={{ fontFamily: "'Mulish', 'Lexend', sans-serif" }}
                >
                  Effort (Days)
                </label>
                <input
                  type='number'
                  value={effortInDays}
                  onChange={(e) =>
                    setEffortInDays(parseInt(e.target.value) || 0)
                  }
                  placeholder='0'
                  min='0'
                  className='w-full p-2 bg-white text-slate-800 rounded text-[13px] placeholder-slate-500'
                  style={{
                    fontFamily: "'Mulish', 'Lexend', sans-serif",
                    fontSize: '13px',
                    border: '1px solid #CBD6E2',
                    height: '32px',
                  }}
                />
              </div>

              <div className='flex-1'>
                <label
                  className='text-[13px] text-gray-600 block mb-1'
                  style={{ fontFamily: "'Mulish', 'Lexend', sans-serif" }}
                >
                  Reminder (Days)
                </label>
                <input
                  type='number'
                  value={reminderInterval}
                  onChange={(e) =>
                    setReminderInterval(parseInt(e.target.value) || 0)
                  }
                  placeholder='0'
                  min='0'
                  className='w-full p-2 bg-white text-slate-800 rounded text-[13px] placeholder-slate-500'
                  style={{
                    fontFamily: "'Mulish', 'Lexend', sans-serif",
                    fontSize: '13px',
                    border: '1px solid #CBD6E2',
                    height: '32px',
                  }}
                />
              </div>
            </div>

            <div>
              <label
                className='text-[13px] text-gray-600 block mb-1'
                style={{ fontFamily: "'Mulish', 'Lexend', sans-serif" }}
              >
                Description
              </label>
              <textarea
                value={taskDescription}
                onChange={(e) => setTaskDescription(e.target.value)}
                placeholder='Enter task description'
                className='w-full p-2 bg-white text-slate-800 rounded text-[13px] placeholder-slate-500'
                style={{
                  fontFamily: "'Mulish', 'Lexend', sans-serif",
                  fontSize: '13px',
                  border: '1px solid #CBD6E2',
                  minHeight: '60px',
                  resize: 'vertical',
                }}
              />
            </div>
          </div>

          <div className='flex gap-2 justify-end'>
            <TextButton
              onClick={handleCancelAddTask}
              label='Cancel'
              sx={{
                fontFamily: "'Mulish', 'Lexend', sans-serif",
                fontSize: '13px',
              }}
            />
            <TextButton
              onClick={handleAddTaskAtBottom}
              disabled={
                !newBottomTaskTitle.trim() ||
                !selectedStatus ||
                !selectedPriority ||
                !startDate ||
                !endDate
              }
              label='Save Task'
              sx={{
                fontFamily: "'Mulish', 'Lexend', sans-serif",
                fontSize: '13px',
                backgroundColor:
                  newBottomTaskTitle.trim() &&
                  selectedStatus &&
                  selectedPriority &&
                  startDate &&
                  endDate
                    ? '#2563EB'
                    : '#9CA3AF',
                paddingX: '10px',
                '&:hover': {
                  backgroundColor:
                    newBottomTaskTitle.trim() &&
                    selectedStatus &&
                    selectedPriority &&
                    startDate &&
                    endDate
                      ? '#1D4ED8'
                      : '#9CA3AF',
                },
              }}
            />
          </div>
        </div>
      )}

      {!isCreateTaskHide && (
        <button
          onClick={() => setIsAddingTaskAtBottom(true)}
          disabled={isCreateTaskDisabled}
          className={`w-full flex items-center gap-2 p-3 rounded-lg border-2 border-dashed transition-colors duration-200 ${
            isCreateTaskDisabled
              ? 'border-slate-300 text-slate-400 cursor-not-allowed'
              : 'border-slate-300 text-slate-500 hover:border-slate-400 hover:text-slate-600'
          }`}
          style={{ fontFamily: "'Mulish', 'Lexend', sans-serif" }}
        >
          <AddIcon size={18} />
          <span className='text-[13px] font-medium'>Add Task</span>
        </button>
      )}
    </div>
  );
};

export default KanbanColumn;
