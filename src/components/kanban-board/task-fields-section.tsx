import React, { useRef, useState } from 'react';
import { MenuItem, Autocomplete, TextField, Tooltip } from '@mui/material';
import { ErrorInfoIcon } from '../../assets';
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
  fiscalYear?: string | null;
  fiscalYears?: string[];
  onFiscalYearChange?: (value: string) => void;
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
  onStatusChange,
  onPriorityChange,
  onChecklistChange,
  onTagsChange,
  onAssigneeChange,
  onLinkedTypeChange,
  onLinkTaskTypesChange,
  onWeightageChange,
  onCategoryChange,
  onAddCustomTag,
  onSetEditedTask,
  mode = 'view',
  selectedStatus,
  onStatusChangeCreate,
  errors = {},
  fiscalYear,
  fiscalYears,
  onFiscalYearChange,
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

  const linkedTypeRef = useRef<HTMLDivElement>(null);
  const linkTaskTypeRef = useRef<HTMLDivElement>(null);
  const [tagInputValue, setTagInputValue] = useState('');
  const [localTagError, setLocalTagError] = useState<string | null>(null);

  return (
    <div className='border border-gray-200 rounded-lg p-4'>
      <div className='grid grid-cols-2 gap-4'>
        {/* Status Field */}
        {!fieldVisibility.status && (
          <div className='flex flex-col gap-2'>
            <label className='text-sm font-medium text-gray-700'>
              Status <span className='text-red-500'> *</span>
            </label>
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
              width='100%'
              error={errors.status}
              renderValue={(selected) => {
                const value = Array.isArray(selected)
                  ? selected.join(', ')
                  : selected;
                if (!value) {
                  return (
                    <span style={{ color: '#7D98B6', fontSize: '13px' }}>
                      Choose Status
                    </span>
                  );
                }
                return (
                  <span
                    style={{
                      display: 'flex',
                      alignItems: 'center',
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
                sx={{ color: '#425A76', fontSize: '13px', fontWeight: '500' }}
              >
                Choose Status
              </MenuItem>
              {statusData.map((status) => (
                <MenuItem
                  sx={{ color: '#425A76', fontSize: '13px', fontWeight: '500' }}
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

        {/* Priority Field */}
        {!fieldVisibility.priority && (
          <div className='flex flex-col gap-2'>
            <label className='text-sm font-medium text-gray-700'>
              Priority <span className='text-red-500'> *</span>
            </label>
            <StyledSelect
              name='priority'
              value={
                shouldPrepopulate
                  ? editedTask?.priority || ''
                  : selectedPriority || ''
              }
              onChange={(e) => onPriorityChange(e.target.value as string)}
              disabled={fieldDisabled.priority}
              width='100%'
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
                sx={{ color: '#425A76', fontSize: '13px', fontWeight: '500' }}
              >
                Choose Priority
              </MenuItem>
              {priorityData.map((priority) => (
                <MenuItem
                  sx={{ color: '#425A76', fontSize: '13px', fontWeight: '500' }}
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

        {/* Fiscal Year Field */}
        {!fieldVisibility.fiscalYear && (
          <div className='flex flex-col gap-2'>
            <label className='text-sm font-medium text-gray-700'>
              Fiscal Year
            </label>
            <StyledSelect
              name='fiscalYear'
              value={
                shouldPrepopulate
                  ? editedTask?.fiscal_year || fiscalYear || ''
                  : fiscalYear || ''
              }
              onChange={(e) => onFiscalYearChange?.(e.target.value as string)}
              disabled={fieldDisabled.fiscalYear}
              width='100%'
              error={errors.fiscalYear}
              renderValue={(selected) => {
                const value = Array.isArray(selected)
                  ? selected.join(', ')
                  : (selected as string);
                if (!value) {
                  return (
                    <span style={{ color: '#7D98B6', fontSize: '13px' }}>
                      Choose Fiscal Year
                    </span>
                  );
                }
                return (
                  <span
                    style={{
                      display: 'flex',
                      alignItems: 'center',
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
                sx={{ color: '#425A76', fontSize: '13px', fontWeight: '500' }}
              >
                Choose Fiscal Year
              </MenuItem>
              {fiscalYears?.map((year) => (
                <MenuItem
                  sx={{ color: '#425A76', fontSize: '13px', fontWeight: '500' }}
                  key={year}
                  value={year}
                  title={year}
                >
                  {year}
                </MenuItem>
              ))}
            </StyledSelect>
          </div>
        )}

        {/* Assignee Field (Create Mode Only) */}
        {mode === 'create' && !fieldVisibility.assignee && (
          <div className='flex flex-col gap-2'>
            <label className='text-sm font-medium text-gray-700'>
              Assignee
            </label>
            <StyledSelect
              name='assignee'
              value={selectedAssignee || ''}
              onChange={(e) => onAssigneeChange?.(e.target.value as string)}
              disabled={fieldDisabled.assignee}
              width='100%'
              error={errors.assignee}
              renderValue={(selected) => {
                const value = Array.isArray(selected)
                  ? selected.join(', ')
                  : (selected as string);
                if (!value) {
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
                          backgroundColor: '#9CA3AF',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '9px',
                          fontWeight: '600',
                          color: 'white',
                          flexShrink: 0,
                        }}
                      >
                        UA
                      </div>
                      <span style={{ color: '#7D98B6', fontSize: '13px' }}>
                        Unassigned
                      </span>
                    </div>
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
                        }}
                      >
                        {user.name}
                      </span>
                    </div>
                  );
                }
                return <span>{value}</span>;
              }}
            >
              <MenuItem
                value=''
                sx={{ color: '#425A76', fontSize: '13px', fontWeight: '500' }}
              >
                <div
                  style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  <div
                    style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      backgroundColor: '#9CA3AF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '8px',
                      fontWeight: '600',
                      color: 'white',
                      flexShrink: 0,
                    }}
                  >
                    UA
                  </div>
                  Unassigned
                </div>
              </MenuItem>
              {availableUsers.map((user) => (
                <MenuItem
                  sx={{ color: '#425A76', fontSize: '13px', fontWeight: '500' }}
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

        {/* Checklist Template Field */}
        {!fieldVisibility.checklistTemplate && (
          <div className='flex flex-col gap-2'>
            <label className='text-sm font-medium text-gray-700'>
              Checklist
            </label>
            <StyledSelect
              name='checklistTemplate'
              value={selectedChecklist}
              onChange={(e) => onChecklistChange(e.target.value as string)}
              disabled={fieldDisabled.checklistTemplate}
              width='100%'
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
                sx={{ color: '#425A76', fontSize: '13px', fontWeight: '500' }}
              >
                Choose Checklist
              </MenuItem>
              {checklistData.map((template: { id: string; name: string }) => (
                <MenuItem
                  sx={{ color: '#425A76', fontSize: '13px', fontWeight: '500' }}
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

        {/* Linked Type Field */}
        {!fieldVisibility.linkedType && (
          <div className='flex flex-col gap-2'>
            <label className='text-sm font-medium text-gray-700'>
              Linked Type
            </label>
            <StyledSelect
              name='linkedType'
              ref={linkedTypeRef}
              value={
                shouldPrepopulate
                  ? editedTask?.linkedType || selectedLinkedType || ''
                  : selectedLinkedType || ''
              }
              onChange={(e) => {
                onLinkedTypeChange?.(e.target.value as string);
                setTimeout(() => {
                  linkTaskTypeRef.current?.focus();
                }, 100);
              }}
              disabled={fieldDisabled.linkedType}
              width='100%'
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
                sx={{ color: '#425A76', fontSize: '13px', fontWeight: '500' }}
              >
                Choose Linked Type
              </MenuItem>
              {uniqueConnectorTypes.map((connector) => (
                <MenuItem
                  sx={{ color: '#425A76', fontSize: '13px', fontWeight: '500' }}
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

        {/* Link Task Type Field */}
        {!fieldVisibility.linkTaskType && (
          <div className='flex flex-col gap-2'>
            <label className='text-sm font-medium text-gray-700'>
              Link Task Type
            </label>
            <StyledSelect
              name='linkTaskType'
              ref={linkTaskTypeRef}
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
              width='100%'
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
                      style={{ marginRight: '8px', cursor: 'pointer' }}
                    />
                    {template.name}
                  </MenuItem>
                );
              })}
            </StyledSelect>
          </div>
        )}

        {/* Weightage Field */}
        {!fieldVisibility.weightage && (
          <div className='flex flex-col gap-2'>
            <label className='text-sm font-medium text-gray-700'>
              Weightage
            </label>
            <StyledSelect
              name='weightage'
              value={
                shouldPrepopulate
                  ? editedTask?.weightage || selectedWeightage || ''
                  : selectedWeightage || ''
              }
              onChange={(e) => onWeightageChange?.(e.target.value as string)}
              disabled={fieldDisabled.weightage}
              width='100%'
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
                sx={{ color: '#425A76', fontSize: '13px', fontWeight: '500' }}
              >
                Choose Weightage
              </MenuItem>
              {weightageData.map((item) => (
                <MenuItem
                  sx={{ color: '#425A76', fontSize: '13px', fontWeight: '500' }}
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

        {/* Category Field */}
        {!fieldVisibility.category && (
          <div className='flex flex-col gap-2'>
            <label className='text-sm font-medium text-gray-700'>
              Task Category
            </label>
            <StyledSelect
              name='category'
              value={
                shouldPrepopulate
                  ? editedTask?.category || selectedCategory || ''
                  : selectedCategory || ''
              }
              onChange={(e) => onCategoryChange?.(e.target.value as string)}
              disabled={fieldDisabled.category}
              width='100%'
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
                sx={{ color: '#425A76', fontSize: '13px', fontWeight: '500' }}
              >
                Choose Category
              </MenuItem>
              {categoryData.map((item) => (
                <MenuItem
                  sx={{ color: '#425A76', fontSize: '13px', fontWeight: '500' }}
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

        {/* Tags Field */}
        {!fieldVisibility.tags && (
          <div className='flex flex-col gap-2'>
            <label className='text-sm font-medium text-gray-700'>Tags</label>
            <Autocomplete
              multiple
              freeSolo
              fullWidth
              disabled={fieldDisabled.tags}
              options={availableTags
                .map((tag) => tag.name)
                .filter((tagName) => {
                  const currentTags = shouldPrepopulate
                    ? editedTask?.tags || []
                    : selectedTags || [];
                  return !currentTags.includes(tagName);
                })}
              value={
                shouldPrepopulate ? editedTask?.tags || [] : selectedTags || []
              }
              inputValue={tagInputValue}
              onInputChange={(_, newInputValue) => {
                setTagInputValue(newInputValue);
                if (newInputValue.length > 50) {
                  setLocalTagError('Maximum 50 characters allowed');
                } else {
                  if (localTagError) setLocalTagError(null);
                }
              }}
              onKeyDown={(e) => {
                const val = (e.target as HTMLInputElement).value;
                if (e.key === 'Enter' && val.length > 50) {
                  e.preventDefault();
                  e.stopPropagation();
                  setLocalTagError('Maximum 50 characters allowed');
                }
              }}
              onChange={(_, newValue) => {
                const validValues = newValue.filter(
                  (v) => v.trim().length <= 50
                );

                if (validValues.length !== newValue.length) {
                  setLocalTagError('Maximum 50 characters allowed');
                }

                const cleanedValues = Array.from(
                  new Set(validValues.filter((v) => v.trim()))
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
                      ...(localTagError || errors.tags
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
                        {localTagError || errors.tags ? (
                          <Tooltip
                            title={localTagError || errors.tags}
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
                            <span className='cursor-pointer mr-2 flex items-center'>
                              <ErrorInfoIcon className='w-5 h-3.5' />
                            </span>
                          </Tooltip>
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

            {(shouldPrepopulate ? editedTask?.tags || [] : selectedTags || [])
              ?.length > 0 && (
                <div className='flex flex-wrap items-center gap-2 mt-1'>
                  {(shouldPrepopulate
                    ? editedTask?.tags || []
                    : selectedTags || []
                  )?.map((tag, index) => (
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
      </div>
    </div>
  );
};

export default TaskFieldsSection;
