import React from 'react';
import { MenuItem, Autocomplete, TextField } from '@mui/material';
import StyledSelect from './styled-select';
import { Task } from './types';

interface TaskFieldsSectionProps {
  fieldVisibility: Record<string, boolean | undefined>;
  fieldDisabled: Record<string, boolean | undefined>;
  editedTask: Task | null;
  statusData: Array<{ id: string; name: string; color: string }>;
  priorityData: Array<{ id: string; name: string; color: string }>;
  roleOptions: Array<{
    rid: string;
    role_name: string;
    role_description?: string;
    status?: string;
  }>;
  checklistData: Array<{ id: string; name: string }>;
  availableTags: Array<{ id: string; name: string; color: string }>;
  selectedRole: string;
  selectedChecklist: string;
  selectedPriority?: string;
  selectedTags?: string[];
  onStatusChange: (statusName: string) => void;
  onPriorityChange: (priorityName: string) => void;
  onRoleChange: (value: string) => void;
  onChecklistChange: (value: string) => void;
  onTagsChange: (newValue: string[]) => void;
  onAddCustomTag: (
    tags: Array<{ id: string; name: string; color: string }>
  ) => void;
  onSetEditedTask: (task: Task | null) => void;
  mode?: 'view' | 'create';
  selectedStatus?: string;
  onStatusChangeCreate?: (statusName: string, statusId: string) => void;
}

// Custom User Icon SVG
const UserIconSvg = ({ className = 'w-4 h-4 text-gray-500' }) => (
  <svg
    viewBox='0 0 24 24'
    fill='none'
    stroke='currentColor'
    strokeWidth='2'
    className={className}
  >
    <path d='M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2'></path>
    <circle cx='12' cy='7' r='4'></circle>
  </svg>
);

const TaskFieldsSection: React.FC<TaskFieldsSectionProps> = ({
  fieldVisibility,
  fieldDisabled,
  editedTask,
  statusData,
  priorityData,
  roleOptions,
  checklistData,
  availableTags,
  selectedRole,
  selectedChecklist,
  selectedPriority,
  selectedTags,
  onStatusChange,
  onPriorityChange,
  onRoleChange,
  onChecklistChange,
  onTagsChange,
  onAddCustomTag,
  onSetEditedTask,
  mode = 'view',
  selectedStatus,
  onStatusChangeCreate,
}) => {
  const shouldPrepopulate = mode === 'view';

  return (
    <div>
      <h3 className='text-sm font-semibold text-gray-700 mb-3'>Fields</h3>
      <div className='border border-gray-200 rounded-lg divide-y divide-gray-200'>
        {!fieldVisibility.status && statusData && statusData.length > 0 && (
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
              <span className='text-sm text-gray-700'>
                Status
                {mode === 'create' && <span className='text-red-500'>*</span>}
              </span>
            </div>
            <StyledSelect
              name='status'
              value={
                shouldPrepopulate
                  ? editedTask?.status || ''
                  : selectedStatus || ''
              }
              onChange={
                mode === 'view'
                  ? (e) => onStatusChange(e.target.value as string)
                  : (e) => {
                      const selectedName = e.target.value as string;
                      const statusItem = statusData?.find(
                        (s) => s.name === selectedName
                      );
                      onStatusChangeCreate?.(
                        selectedName,
                        statusItem?.id || ''
                      );
                    }
              }
              disabled={fieldDisabled.status || mode === 'create'}
              width='200px'
              renderValue={(selected) => {
                const value = Array.isArray(selected)
                  ? selected.join(', ')
                  : selected;
                return (
                  <span
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      minWidth: 0,
                      maxWidth: 'calc(100% - 24px)', // leave space for icon
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                    title={typeof value === 'string' ? value : String(value)}
                  >
                    {typeof value === 'string' ? value : String(value)}
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
            </StyledSelect>
          </div>
        )}

        {!fieldVisibility.priority &&
          priorityData &&
          priorityData.length > 0 && (
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
                <span className='text-sm text-gray-700'>
                  Priority
                  {mode === 'create' && <span className='text-red-500'>*</span>}
                </span>
              </div>
              <StyledSelect
                name='priority'
                value={
                  shouldPrepopulate
                    ? editedTask?.priority || ''
                    : selectedPriority || ''
                }
                onChange={(e) => onPriorityChange(e.target.value as string)}
                disabled={fieldDisabled.priority}
                width='200px'
                renderValue={(selected) => {
                  const value = Array.isArray(selected)
                    ? selected.join(', ')
                    : (selected as string);
                  if (!value) {
                    return (
                      <span style={{ color: '#7D98B6', fontSize: '13px' }}>
                        Select Priority
                      </span>
                    );
                  }
                  return (
                    <span
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        minWidth: 0,
                        maxWidth: 'calc(100% - 24px)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                      title={typeof value === 'string' ? value : String(value)}
                    >
                      {typeof value === 'string' ? value : String(value)}
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
              </StyledSelect>
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
                <span className='text-sm text-gray-700'>
                  Tags
                  {mode === 'create' && <span className='text-red-500'>*</span>}
                </span>
              </div>
              <div className='w-[200px]'>
                <Autocomplete
                  multiple
                  freeSolo
                  disabled={fieldDisabled.tags}
                  options={availableTags.map((tag) => tag.name)}
                  value={
                    shouldPrepopulate
                      ? editedTask?.tags || []
                      : selectedTags || []
                  }
                  onChange={(_, newValue) => {
                    const cleanedValues = Array.from(
                      new Set(newValue.filter((v) => v.trim()))
                    );

                    cleanedValues.forEach((tagName) => {
                      if (!availableTags.find((t) => t.name === tagName)) {
                        onAddCustomTag([
                          ...availableTags,
                          {
                            id: `custom-${Date.now()}-${Math.random()}`,
                            name: tagName,
                            color: '#3B82F6',
                          },
                        ]);
                      }
                    });

                    onTagsChange(cleanedValues);
                  }}
                  renderTags={() => null}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      size='small'
                      placeholder={mode === 'create' ? 'Add Tags' : 'Add Tags'}
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
                        },
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#CBD6E2',
                          borderWidth: '1px',
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#60A5FA',
                          borderWidth: '2px',
                        },
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
              </div>
            </div>

            {(shouldPrepopulate ? editedTask?.tags || [] : selectedTags || [])
              ?.length > 0 && (
              <div className='flex flex-wrap items-center gap-2 mt-2'>
                {(shouldPrepopulate
                  ? editedTask?.tags || []
                  : selectedTags || []
                )?.map((tag, index) => (
                  <div
                    key={index}
                    className='inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium hover:bg-blue-200 transition-colors group'
                  >
                    <span>{tag}</span>
                    <button
                      onClick={() => {
                        const newTags =
                          (shouldPrepopulate
                            ? editedTask?.tags || []
                            : selectedTags || []
                          )?.filter((t) => t !== tag) || [];
                        if (shouldPrepopulate) {
                          onSetEditedTask(
                            editedTask ? { ...editedTask, tags: newTags } : null
                          );
                        } else {
                          onTagsChange(newTags);
                        }
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

        {!fieldVisibility.role && roleOptions && roleOptions.length > 0 && (
          <div className='flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors'>
            <div className='flex items-center gap-2'>
              <UserIconSvg className='w-4 h-4 text-gray-500' />
              <span className='text-sm text-gray-700'>
                User Role
                {mode === 'create' && <span className='text-red-500'>*</span>}
              </span>
            </div>
            <StyledSelect
              name='role'
              value={selectedRole}
              onChange={(e) => onRoleChange(e.target.value as string)}
              disabled={fieldDisabled.role}
              width='200px'
              renderValue={(selected) => {
                const value = Array.isArray(selected)
                  ? selected.join(', ')
                  : (selected as string);
                if (!value) {
                  return (
                    <span style={{ color: '#7D98B6', fontSize: '13px' }}>
                      Select Role
                    </span>
                  );
                }
                return (
                  <span
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      minWidth: 0,
                      maxWidth: 'calc(100% - 24px)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                    title={typeof value === 'string' ? value : String(value)}
                  >
                    {typeof value === 'string' ? value : String(value)}
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
                Select Role
              </MenuItem>
              {roleOptions.map((role: { rid: string; role_name: string }) => (
                <MenuItem
                  sx={{
                    color: '#425A76',
                    fontSize: '13px',
                    fontWeight: '500',
                  }}
                  key={role.rid}
                  value={role.role_name}
                  title={role.role_name}
                >
                  {role.role_name}
                </MenuItem>
              ))}
            </StyledSelect>
          </div>
        )}

        {!fieldVisibility.checklistTemplate &&
          checklistData &&
          checklistData.length > 0 && (
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
                  <path d='M3 3h18v18H3z'></path>
                  <path d='M3 9h18'></path>
                  <path d='M9 21V9'></path>
                </svg>
                <span className='text-sm text-gray-700'>
                  Checklist Template
                </span>
              </div>
              <StyledSelect
                name='checklistTemplate'
                value={selectedChecklist}
                onChange={(e) => onChecklistChange(e.target.value as string)}
                disabled={fieldDisabled.checklistTemplate}
                width='200px'
                renderValue={(selected) => {
                  const value = Array.isArray(selected)
                    ? selected.join(', ')
                    : (selected as string);
                  if (!value) {
                    return (
                      <span style={{ color: '#7D98B6', fontSize: '13px' }}>
                        Select Template
                      </span>
                    );
                  }
                  return (
                    <span
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        minWidth: 0,
                        maxWidth: 'calc(100% - 24px)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                      title={typeof value === 'string' ? value : String(value)}
                    >
                      {typeof value === 'string' ? value : String(value)}
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
                  Select Template
                </MenuItem>
                {checklistData.map((template: { id: string; name: string }) => (
                  <MenuItem
                    sx={{
                      color: '#425A76',
                      fontSize: '13px',
                      fontWeight: '500',
                    }}
                    key={template.id}
                    value={template.name}
                    title={template.name}
                  >
                    {template.name}
                  </MenuItem>
                ))}
              </StyledSelect>
            </div>
          )}
      </div>
    </div>
  );
};

export default TaskFieldsSection;
