import React, { useState, useMemo } from 'react';
import {
  Autocomplete,
  Box,
  FormControl,
  MenuItem,
  Select,
  Skeleton,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { ArrowRightIcon } from '@mui/x-date-pickers/icons';
import { CloseIcon, ErrorInfoIcon } from '../../../../../assets';
import {
  COMMON_MENU_PROPS,
  Condition,
  getDynamicSvgIcon,
  getSelectStyles,
} from '../helper';
import {
  useGetRuleCategoryFields,
  useGetRuleFieldOperators,
  useGetRuleFieldValues,
} from '../../../../service/workflow-builder/workflow-builder-service';
import { TruncateWithTooltip } from '../../../../../components';

interface ConditionFormProps {
  condition: Condition;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onChange: (condition: Condition) => void;
  onDelete: () => void;
  showValidationErrors?: boolean;
}

interface FieldSuggestion {
  id: string;
  display: string;
  fullPath: string;
  description?: string;
}

const ConditionForm: React.FC<ConditionFormProps> = ({
  condition,
  isExpanded,
  onToggleExpand,
  onChange,
  onDelete,
  showValidationErrors = false,
}) => {
  const [fieldInputValue, setFieldInputValue] = useState(
    condition.field ? `@${condition.fieldName || condition.field}` : ''
  );
  const [showFieldSuggestions, setShowFieldSuggestions] = useState(false);
  const [selectedFieldRid, setSelectedFieldRid] = useState<string>(
    condition.field || ''
  );

  // Fetch fields based on selected category
  const { data: fieldsData, isLoading: isLoadingFields } =
    useGetRuleCategoryFields({
      category_rid: condition.category || '',
      status_rid: '',
    });

  // Fetch operators based on selected field
  const { data: operatorsData, isLoading: isLoadingOperators } =
    useGetRuleFieldOperators({
      field_rid: selectedFieldRid,
      status_rid: '',
    });

  // Fetch values based on selected field
  const { data: valuesData, isLoading: isLoadingValues } =
    useGetRuleFieldValues({
      field_rid: selectedFieldRid,
      status_rid: '',
    });

  // Transform API data to local format
  const availableFields = useMemo(() => {
    return (
      fieldsData?.data?.map((field) => ({
        id: field.rid,
        name: field.name,
      })) || []
    );
  }, [fieldsData]);

  const availableOperators = useMemo(() => {
    return (
      operatorsData?.data?.map((operator) => ({
        value: operator.rid,
        label: operator.name,
      })) || []
    );
  }, [operatorsData]);

  const fieldOptions = useMemo(() => {
    if (!valuesData?.data || valuesData.data.length === 0) return null;

    return valuesData.data.map((value) => ({
      label: value.name,
      value: value.rid,
    }));
  }, [valuesData]);

  const isFieldEmpty = !condition.field;

  const getAllFieldSuggestions = (): FieldSuggestion[] => {
    return availableFields.map((field) => ({
      id: field.id,
      display: field.name,
      fullPath: field.id,
      description: field.name,
    }));
  };

  const filterFieldSuggestions = (inputValue: string): FieldSuggestion[] => {
    if (!inputValue.startsWith('@')) {
      return [];
    }

    const query = inputValue.replace('@', '').toLowerCase();
    const allSuggestions = getAllFieldSuggestions();

    return allSuggestions.filter(
      (s) =>
        s.display.toLowerCase().includes(query) ||
        s.description?.toLowerCase().includes(query)
    );
  };

  const handleFieldInputChange = (value: string) => {
    setFieldInputValue(value);

    if (value.startsWith('@')) {
      setShowFieldSuggestions(true);
    } else {
      setShowFieldSuggestions(false);
    }

    if (value.trim() === '' || value === '@') {
      onChange({
        ...condition,
        field: '',
        operator: '',
        value: '',
      });
      setSelectedFieldRid('');
    }
  };

  const handleFieldSuggestionSelect = (suggestion: FieldSuggestion | null) => {
    if (!suggestion) return;
    const fullValue = `@${suggestion.display}`;
    setFieldInputValue(fullValue);

    const selectedField = availableFields.find(
      (field) => field.id === suggestion.fullPath
    );
    if (selectedField) {
      // Set the field RID to trigger operators and values fetch
      setSelectedFieldRid(selectedField.id);

      onChange({
        ...condition,
        field: selectedField.id,
        fieldName: selectedField.name, // Store display name
        operator: '',
        operatorName: '',
        value: '',
        valueName: '',
      });
    }

    setShowFieldSuggestions(false);
  };

  const handleFieldInputFocus = () => {
    if (fieldInputValue.startsWith('@')) {
      setShowFieldSuggestions(true);
    }
  };

  const handleFieldInputBlur = () => {
    setTimeout(() => setShowFieldSuggestions(false), 200);
  };

  const handleFieldInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === '@') {
      setShowFieldSuggestions(true);
    }
  };

  const handleOperatorChange = (operatorId: string) => {
    const selectedOperator = availableOperators.find(
      (op) => op.value === operatorId
    );

    onChange({
      ...condition,
      operator: operatorId,
      operatorName: selectedOperator?.label || '',
    });
  };

  const handleValueChange = (valueId: string | string[]) => {
    let valueName = '';

    if (typeof valueId === 'string' && fieldOptions) {
      const selectedValue = fieldOptions.find((opt) => opt.value === valueId);
      valueName = selectedValue?.label || valueId;
    }

    onChange({
      ...condition,
      value: valueId,
      valueName: valueName,
    });
  };

  // Check if condition is complete
  const isConditionComplete =
    condition.field &&
    condition.operator &&
    condition.value !== '' &&
    condition.value !== null &&
    condition.value !== undefined;

  // Only show validation errors when explicitly requested
  const shouldShowError = showValidationErrors && !isConditionComplete;

  return (
    <div
      className={`rounded-lg border ${shouldShowError ? 'border-red-300' : 'border-[#CBD6E2]'} overflow-hidden`}
    >
      {/* Header */}
      <div
        className={`flex items-center justify-between h-[50px] px-4 ${shouldShowError ? 'bg-red-50' : 'bg-gray-50 hover:bg-gray-50'} cursor-pointer`}
        onClick={onToggleExpand}
      >
        <div className='flex items-center gap-2 flex-1'>
          <React.Suspense fallback={null}>
            <ArrowRightIcon
              className={`text-gray-400 w-4 h-4 transition-transform ${
                isExpanded ? 'rotate-90' : 'rotate-0'
              }`}
            />
          </React.Suspense>
          <div className='w-8 h-8 p-1.5 rounded-full bg-[#ffe4b3] flex items-center justify-center'>
            {getDynamicSvgIcon(condition.name || 'condition')}
          </div>
          <div className='flex-1'>
            <div className='text-sm font-medium text-gray-900'>
              {condition.name || 'Condition'}
            </div>
            {!isExpanded && condition.field && (
              <div className='text-xs text-gray-500 mt-1 flex flex-wrap gap-3'>
                {/* FIELD */}
                <span className='flex items-center gap-1 max-w-[150px] truncate'>
                  <strong className='text-[#2D3E4F]'>Field:</strong>
                  <TruncateWithTooltip>
                    <span className='text-[#1976d2] truncate'>
                      {condition.fieldName || condition.field || '-'}
                    </span>
                  </TruncateWithTooltip>
                </span>

                {/* OPERATOR */}
                <span className='flex items-center gap-1 max-w-[150px] truncate'>
                  <strong className='text-[#2D3E4F]'>Operator:</strong>
                  <TruncateWithTooltip>
                    <span className='text-[#1976d2] truncate'>
                      {condition.operatorName || condition.operator || '-'}
                    </span>
                  </TruncateWithTooltip>
                </span>

                {/* VALUE */}
                <span className='flex items-center gap-1 max-w-[150px] truncate'>
                  <strong className='text-[#2D3E4F]'>Value:</strong>
                  <TruncateWithTooltip>
                    <span className='text-[#1976d2] truncate'>
                      {condition.valueName || condition.value || '-'}
                    </span>
                  </TruncateWithTooltip>
                </span>
              </div>
            )}
          </div>
        </div>

        <div className='flex items-center gap-2'>
          {shouldShowError && (
            <Tooltip
              title={'Please fill all fields: Field, Operator, and Value'}
              arrow
              placement='top'
              slotProps={{
                tooltip: {
                  sx: {
                    backgroundColor: '#FEF2F2',
                    mr: 1,
                  },
                },
              }}
            >
              <span className='h-[28px] w-5 flex items-center justify-center cursor-pointer'>
                <React.Suspense fallback={null}>
                  <ErrorInfoIcon alt='error' className='w-5 h-4' />
                </React.Suspense>
              </span>
            </Tooltip>
          )}
          <Tooltip
            placement='top'
            title='Remove Condition'
            arrow
            slotProps={{
              tooltip: {
                sx: {
                  mr: 1,
                },
              },
            }}
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className='h-8 w-8 flex items-center justify-center hover:bg-gray-200 rounded-full transition-colors cursor-pointer'
            >
              <React.Suspense fallback={null}>
                <CloseIcon className='w-3 h-3' />
              </React.Suspense>
            </button>
          </Tooltip>
        </div>
      </div>

      {/* Expanded Fields */}
      {isExpanded && (
        <div
          className={`p-4 border-t ${shouldShowError ? 'border-red-300' : 'border-[#CBD6E2]'}`}
        >
          <div className='space-y-4'>
            {/* Field Input */}
            <div className='relative'>
              <label className='block text-xs font-medium text-[#2D3E4F] mb-1'>
                Field
              </label>
              {isLoadingFields ? (
                <Skeleton
                  variant='rectangular'
                  width='100%'
                  height={32}
                  sx={{ borderRadius: '2px' }}
                />
              ) : (
                <Autocomplete
                  freeSolo
                  open={showFieldSuggestions}
                  onOpen={() => {
                    if (fieldInputValue.startsWith('@')) {
                      setShowFieldSuggestions(true);
                    }
                  }}
                  onClose={() => setShowFieldSuggestions(false)}
                  inputValue={fieldInputValue}
                  onInputChange={(_event, newInputValue) => {
                    handleFieldInputChange(newInputValue);
                  }}
                  onChange={(_event, newValue) => {
                    if (typeof newValue === 'string') {
                      handleFieldInputChange(newValue);
                    } else {
                      handleFieldSuggestionSelect(newValue);
                    }
                  }}
                  options={filterFieldSuggestions(fieldInputValue)}
                  getOptionLabel={(option) => {
                    if (typeof option === 'string') {
                      return option;
                    }
                    return `${option.display}`;
                  }}
                  renderOption={(props, option) => {
                    const { key, ...otherProps } = props;
                    return (
                      <li key={key} {...otherProps}>
                        <Box
                          sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            width: '100%',
                          }}
                        >
                          <Typography
                            variant='body2'
                            fontWeight='medium'
                            color='#425A76'
                          >
                            {option.display}
                          </Typography>
                        </Box>
                      </li>
                    );
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      placeholder='Type @ to see available fields'
                      autoComplete='off'
                      onFocus={handleFieldInputFocus}
                      onBlur={handleFieldInputBlur}
                      onKeyDown={handleFieldInputKeyDown}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          padding: '5px',
                          height: '32px',
                          borderRadius: '2px',
                          fontSize: '13px',
                          '& input': {
                            padding: '0px 12px',
                            height: '32px',
                            boxSizing: 'border-box',
                            color: condition.field ? '#1976d2' : '#425A76',
                            fontWeight: condition.field ? 600 : 400,
                          },
                          '& fieldset': {
                            borderColor: '#CBD6E2',
                          },
                          '&:hover fieldset': {
                            borderColor: '#CBD6E2',
                          },
                          '&.Mui-focused fieldset': {
                            borderColor: '#1976d2',
                            borderWidth: '2px',
                          },
                        },
                      }}
                    />
                  )}
                  filterOptions={(options) => options}
                  clearOnBlur={false}
                  handleHomeEndKeys
                  selectOnFocus={false}
                />
              )}
            </div>

            {/* Operator */}
            <div>
              <label className='block text-xs font-medium text-[#2D3E4F] mb-1'>
                Operator
              </label>
              {isLoadingOperators ? (
                <Skeleton
                  variant='rectangular'
                  width='100%'
                  height={32}
                  sx={{ borderRadius: '2px' }}
                />
              ) : (
                <FormControl fullWidth size='small'>
                  <Select
                    value={condition.operator || ''}
                    onChange={(e) => handleOperatorChange(e.target.value)}
                    displayEmpty
                    MenuProps={COMMON_MENU_PROPS}
                    disabled={isFieldEmpty || isLoadingOperators}
                    sx={getSelectStyles(false, condition.operator === '')}
                  >
                    <MenuItem
                      value=''
                      sx={{
                        color: '#425A76',
                        fontSize: '13px',
                        fontWeight: 500,
                      }}
                    >
                      Choose Operator
                    </MenuItem>
                    {availableOperators.map((op) => (
                      <MenuItem
                        key={op.value}
                        value={op.value}
                        sx={{
                          color: '#425A76',
                          fontSize: '13px',
                          fontWeight: 500,
                        }}
                      >
                        {op.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
            </div>

            {/* Value */}
            <div>
              <label className='block text-xs font-medium text-[#2D3E4F] mb-1'>
                Value
              </label>
              {isLoadingValues ? (
                <Skeleton
                  variant='rectangular'
                  width='100%'
                  height={32}
                  sx={{ borderRadius: '2px' }}
                />
              ) : (
                <FormControl fullWidth size='small'>
                  <Select
                    value={condition.value || ''}
                    onChange={(e) => handleValueChange(e.target.value)}
                    displayEmpty
                    MenuProps={COMMON_MENU_PROPS}
                    disabled={isFieldEmpty || isLoadingValues}
                    sx={getSelectStyles(false, condition.value === '')}
                  >
                    <MenuItem
                      value=''
                      sx={{
                        color: '#425A76',
                        fontSize: '13px',
                        fontWeight: 500,
                      }}
                    >
                      Choose Value
                    </MenuItem>
                    {fieldOptions && fieldOptions.length > 0
                      ? fieldOptions.map((opt) => (
                          <MenuItem
                            key={opt.value}
                            value={opt.value}
                            sx={{
                              color: '#425A76',
                              fontSize: '13px',
                              fontWeight: 500,
                            }}
                          >
                            {opt.label}
                          </MenuItem>
                        ))
                      : !isLoadingValues && (
                          <MenuItem
                            disabled
                            sx={{
                              color: '#9CA3AF',
                              fontSize: '13px',
                              fontWeight: 500,
                            }}
                          >
                            No values available
                          </MenuItem>
                        )}
                  </Select>
                </FormControl>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConditionForm;
