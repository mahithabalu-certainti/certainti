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
  checklistData: Array<{ id: string; name: string }>;
  availableTags: Array<{ id: string; name: string; color: string }>;
  availableUsers?: Array<{
    id: string;
    name: string;
    initials: string;
    color: string;
  }>;
  connectorTypesData?: Array<{ id: string; name: string }>;
  taskTemplatesData?: Array<{ id: string; name: string }>;
  weightageData?: Array<{ id: string; name: string }>;
  categoryData?: Array<{ id: string; name: string }>;
  selectedChecklist: string;
  selectedPriority?: string;
  selectedTags?: string[];
  selectedAssignee?: string;
  selectedLinkedType?: string;
  selectedLinkTaskTypes?: string[];
  selectedWeightage?: string;
  selectedCategory?: string;
  userRole?: string;
  onStatusChange: (statusName: string) => void;
  onPriorityChange: (priorityName: string) => void;
  onChecklistChange: (value: string) => void;
  onTagsChange: (newValue: string[]) => void;
  onAssigneeChange?: (userId: string) => void;
  onLinkedTypeChange?: (value: string) => void;
  onLinkTaskTypesChange?: (values: string[]) => void;
  onWeightageChange?: (value: string) => void;
  onCategoryChange?: (value: string) => void;
  onUserRoleChange?: (value: string) => void;
  onAddCustomTag: (
    tags: Array<{
      id: string;
      name: string;
      color: string;
      is_new_tag?: boolean;
    }>
  ) => void;
  onSetEditedTask: (task: Task | null) => void;
  mode?: 'view' | 'create';
  selectedStatus?: string;
  onStatusChangeCreate?: (statusName: string, statusId: string) => void;
  errors?: Record<string, string | undefined>;
}

const TaskFieldsSection: React.FC<TaskFieldsSectionProps> = ({
  fieldVisibility,
  fieldDisabled,
  editedTask,
  statusData,
  priorityData,
  checklistData,
  availableTags,
  availableUsers = [],
  connectorTypesData = [],
  taskTemplatesData = [],
  weightageData = [],
  categoryData = [],
  selectedChecklist,
  selectedPriority,
  selectedTags,
  selectedAssignee,
  selectedLinkedType,
  selectedLinkTaskTypes,
  selectedWeightage,
  selectedCategory,
  userRole,
  onStatusChange,
  onPriorityChange,
  onChecklistChange,
  onTagsChange,
  onAssigneeChange,
  onLinkedTypeChange,
  onLinkTaskTypesChange,
  onWeightageChange,
  onCategoryChange,
  onUserRoleChange,
  onAddCustomTag,
  onSetEditedTask,
  mode = 'view',
  selectedStatus,
  onStatusChangeCreate,
  errors = {},
}) => {
  const shouldPrepopulate = mode === 'view';

  const uniqueConnectorTypes = React.useMemo(() => {
    const seen = new Set();
    return connectorTypesData.filter((item) => {
      const duplicate = seen.has(item.id);
      seen.add(item.id);
      return !duplicate;
    });
  }, [connectorTypesData]);

  const uniqueTaskTemplates = React.useMemo(() => {
    const seen = new Set();
    return taskTemplatesData.filter((item) => {
      const duplicate = seen.has(item.id);
      seen.add(item.id);
      return !duplicate;
    });
  }, [taskTemplatesData]);

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
                {mode === 'create' && <span className='text-red-500'> * </span>}
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
              error={errors.status}
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
                Choose Status
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
                  {mode === 'create' && (
                    <span className='text-red-500'> * </span>
                  )}
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
                error={errors.priority}
                renderValue={(selected) => {
                  const value = Array.isArray(selected)
                    ? selected.join(', ')
                    : (selected as string);
                  if (!value) {
                    return (
                      <span style={{ color: '#7D98B6', fontSize: '13px' }}>
                        Choose Priority
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
                  Choose Priority
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

        {mode === 'create' &&
          !fieldVisibility.assignee &&
          availableUsers &&
          availableUsers.length > 0 && (
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
                <span className='text-sm text-gray-700'>Assignee</span>
              </div>
              <StyledSelect
                name='assignee'
                value={selectedAssignee || ''}
                onChange={(e) => onAssigneeChange?.(e.target.value as string)}
                disabled={fieldDisabled.assignee}
                width='200px'
                error={errors.assignee}
                renderValue={(selected) => {
                  const value = Array.isArray(selected)
                    ? selected.join(', ')
                    : (selected as string);
                  if (!value) {
                    return (
                      <span style={{ color: '#7D98B6', fontSize: '13px' }}>
                        Choose User
                      </span>
                    );
                  }
                  const user = availableUsers.find((u) => u.id === value);
                  if (user) {
                    return (
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          minWidth: 0,
                          maxWidth: 'calc(100% - 24px)',
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
                  Choose User
                </MenuItem>
                {availableUsers.map((user) => (
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
                          flexShrink: 0,
                        }}
                      >
                        {user.initials}
                      </div>
                      {user.name}
                    </div>
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
                <span className='text-sm text-gray-700'>Tags</span>
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
                            id: '',
                            name: tagName,
                            color: '#3B82F6',
                            is_new_tag: true,
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
                        '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline':
                        {
                          border: '2px solid #60A5FA',
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
                  Checklist
                  {mode === 'create' && (
                    <span className='text-red-500'> * </span>
                  )}
                </span>
              </div>
              <StyledSelect
                name='checklistTemplate'
                value={selectedChecklist}
                onChange={(e) => onChecklistChange(e.target.value as string)}
                disabled={fieldDisabled.checklistTemplate}
                width='200px'
                error={errors.checklistTemplate}
                renderValue={(selected) => {
                  const value = Array.isArray(selected)
                    ? selected.join(', ')
                    : (selected as string);
                  if (!value) {
                    return (
                      <span style={{ color: '#7D98B6', fontSize: '13px' }}>
                        Choose Checklist
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
                  Choose Checklist
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

        {/* Linked Type - Single Select (Create + Edit) */}
        {uniqueConnectorTypes && uniqueConnectorTypes.length > 0 && (
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
                <path d='M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71'></path>
                <path d='M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71'></path>
              </svg>
              <span className='text-sm text-gray-700'>Linked Type</span>
            </div>
            <StyledSelect
              name='linkedType'
              value={
                shouldPrepopulate
                  ? editedTask?.linkedType || selectedLinkedType || ''
                  : selectedLinkedType || ''
              }
              onChange={(e) => onLinkedTypeChange?.(e.target.value as string)}
              disabled={fieldDisabled.linkedType}
              width='200px'
              error={errors.linkedType}
              renderValue={(selected) => {
                const value = Array.isArray(selected)
                  ? selected.join(', ')
                  : (selected as string);
                if (!value) {
                  return (
                    <span style={{ color: '#7D98B6', fontSize: '13px' }}>
                      Choose Linked Type
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
                Choose Linked Type
              </MenuItem>
              {uniqueConnectorTypes.map((connector) => (
                <MenuItem
                  sx={{
                    color: '#425A76',
                    fontSize: '13px',
                    fontWeight: '500',
                  }}
                  key={connector.id}
                  value={connector.name}
                  title={connector.name}
                >
                  {connector.name}
                </MenuItem>
              ))}
            </StyledSelect>
          </div>
        )}

        {/* Link Task Type - Multi-Select with Checkboxes (Create + Edit) */}
        {uniqueTaskTemplates && uniqueTaskTemplates.length > 0 && (
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
                <path d='M9 11l3 3L22 4'></path>
                <path d='M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11'></path>
              </svg>
              <span className='text-sm text-gray-700'>Link Task Type</span>
            </div>
            <StyledSelect
              name='linkTaskType'
              multiple
              value={
                shouldPrepopulate
                  ? editedTask?.linkTaskTypes || selectedLinkTaskTypes || []
                  : selectedLinkTaskTypes || []
              }
              onChange={(e) => {
                const value = e.target.value as string[];
                onLinkTaskTypesChange?.(value);
              }}
              disabled={fieldDisabled.linkTaskType}
              width='200px'
              error={errors.linkTaskType}
              renderValue={(selected) => {
                const values = Array.isArray(selected) ? selected : [];
                if (values.length === 0) {
                  return (
                    <span style={{ color: '#7D98B6', fontSize: '13px' }}>
                      Choose Link Task Types
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
                    title={values.join(', ')}
                  >
                    {values.join(', ')}
                  </span>
                );
              }}
            >
              {uniqueTaskTemplates.map((template) => {
                const selectedValues = shouldPrepopulate
                  ? editedTask?.linkTaskTypes || selectedLinkTaskTypes || []
                  : selectedLinkTaskTypes || [];
                const isSelected = selectedValues.includes(template.name);

                return (
                  <MenuItem
                    sx={{
                      color: '#425A76',
                      fontSize: '13px',
                      fontWeight: '500',
                    }}
                    key={template.id}
                    value={template.name}
                  >
                    <input
                      type='checkbox'
                      checked={isSelected}
                      readOnly
                      style={{
                        marginRight: '8px',
                        cursor: 'pointer',
                      }}
                    />
                    {template.name}
                  </MenuItem>
                );
              })}
            </StyledSelect>
          </div>
        )}

        {/* User Role - Single Select (Create Only) */}
        {mode !== 'view' && userRole && (
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
                <path d='M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2'></path>
                <circle cx='9' cy='7' r='4'></circle>
                <path d='M23 21v-2a4 4 0 0 0-3-3.87'></path>
                <path d='M16 3.13a4 4 0 0 1 0 7.75'></path>
              </svg>
              <span className='text-sm text-gray-700'>User Role</span>
            </div>
            <StyledSelect
              name='userRole'
              value={userRole || ''}
              onChange={(e) => onUserRoleChange?.(e.target.value as string)}
              disabled={fieldDisabled.userRole}
              width='200px'
              error={errors.userRole}
              renderValue={(selected) => {
                const value = Array.isArray(selected)
                  ? selected.join(', ')
                  : (selected as string);
                if (!value) {
                  return (
                    <span style={{ color: '#7D98B6', fontSize: '13px' }}>
                      Choose User Role
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
                Choose User Role
              </MenuItem>
              {/* Role options would come from props if needed */}
            </StyledSelect>
          </div>
        )}

        {/* Weightage - Single Select (Create + Edit) */}
        {weightageData && weightageData.length > 0 && (
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
                <circle cx='12' cy='12' r='10'></circle>
                <line x1='12' y1='8' x2='12' y2='12'></line>
                <line x1='12' y1='16' x2='12.01' y2='16'></line>
              </svg>
              <span className='text-sm text-gray-700'>Weightage</span>
            </div>
            <StyledSelect
              name='weightage'
              value={
                shouldPrepopulate
                  ? editedTask?.weightage || selectedWeightage || ''
                  : selectedWeightage || ''
              }
              onChange={(e) => onWeightageChange?.(e.target.value as string)}
              disabled={fieldDisabled.weightage}
              width='200px'
              error={errors.weightage}
              renderValue={(selected) => {
                const value = Array.isArray(selected)
                  ? selected.join(', ')
                  : (selected as string);
                if (!value) {
                  return (
                    <span style={{ color: '#7D98B6', fontSize: '13px' }}>
                      Choose Weightage
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
                Choose Weightage
              </MenuItem>
              {weightageData.map((item) => (
                <MenuItem
                  sx={{
                    color: '#425A76',
                    fontSize: '13px',
                    fontWeight: '500',
                  }}
                  key={item.id}
                  value={item.name}
                  title={item.name}
                >
                  {item.name}
                </MenuItem>
              ))}
            </StyledSelect>
          </div>
        )}

        {/* Category - Single Select (Create + Edit) */}
        {categoryData && categoryData.length > 0 && (
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
                <rect x='3' y='3' width='7' height='7'></rect>
                <rect x='14' y='3' width='7' height='7'></rect>
                <rect x='14' y='14' width='7' height='7'></rect>
                <rect x='3' y='14' width='7' height='7'></rect>
              </svg>
              <span className='text-sm text-gray-700'>Task Category</span>
            </div>
            <StyledSelect
              name='category'
              value={
                shouldPrepopulate
                  ? editedTask?.category || selectedCategory || ''
                  : selectedCategory || ''
              }
              onChange={(e) => onCategoryChange?.(e.target.value as string)}
              disabled={fieldDisabled.category}
              width='200px'
              error={errors.category}
              renderValue={(selected) => {
                const value = Array.isArray(selected)
                  ? selected.join(', ')
                  : (selected as string);
                if (!value) {
                  return (
                    <span style={{ color: '#7D98B6', fontSize: '13px' }}>
                      Choose Category
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
                Choose Category
              </MenuItem>
              {categoryData.map((item) => (
                <MenuItem
                  sx={{
                    color: '#425A76',
                    fontSize: '13px',
                    fontWeight: '500',
                  }}
                  key={item.id}
                  value={item.name}
                  title={item.name}
                >
                  {item.name}
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
