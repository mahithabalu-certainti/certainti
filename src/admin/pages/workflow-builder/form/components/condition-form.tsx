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
import { useWorkflowContext } from '../workflow-context';

interface ConditionFormProps {
  condition: Condition;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onChange: (condition: Condition) => void;
  onDelete: () => void;
  showValidationErrors?: boolean;
  isDuplicate?: boolean;
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
  isDuplicate = false,
}) => {
  const [fieldInputValue, setFieldInputValue] = useState(
    condition.field ? condition.fieldName || condition.field : ''
  );
  const [showFieldSuggestions, setShowFieldSuggestions] = useState(false);
  const [selectedFieldRid, setSelectedFieldRid] = useState<string>(
    condition.field || ''
  );
  // Track if the current field input is from a valid selection
  const [isFieldFromValidSelection, setIsFieldFromValidSelection] = useState(
    !!condition.field
  );

  const { validatedFieldErrors } = useWorkflowContext();

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
    const allSuggestions = getAllFieldSuggestions();

    // If input starts with @, remove it for filtering
    const query = inputValue.startsWith('@')
      ? inputValue.slice(1).toLowerCase()
      : inputValue.toLowerCase();

    // If query is empty (just @ or empty string), return all suggestions
    if (query === '') {
      return allSuggestions;
    }

    // Filter based on query
    return allSuggestions.filter(
      (s) =>
        s.display.toLowerCase().includes(query) ||
        s.description?.toLowerCase().includes(query)
    );
  };

  const handleFieldInputChange = (value: string) => {
    // If there's a valid selection and user is trying to add characters (not delete), prevent it
    if (isFieldFromValidSelection && value.length > fieldInputValue.length) {
      // User is trying to type more characters after selection - prevent it
      return;
    }

    setFieldInputValue(value);

    // Show suggestions when user starts typing (with or without @)
    if (value.trim() !== '') {
      setShowFieldSuggestions(true);
    } else {
      setShowFieldSuggestions(false);
    }

    // If user deletes/modifies the selected value, mark as invalid and clear
    if (isFieldFromValidSelection && value !== (condition.fieldName || '')) {
      setIsFieldFromValidSelection(false);
      onChange({
        ...condition,
        field: '',
        fieldName: '',
        operator: '',
        operatorName: '',
        value: '',
        valueName: '',
      });
      setSelectedFieldRid('');
    }

    // Clear the field if input is empty
    if (value.trim() === '') {
      onChange({
        ...condition,
        field: '',
        fieldName: '',
        operator: '',
        operatorName: '',
        value: '',
        valueName: '',
      });
      setSelectedFieldRid('');
      setIsFieldFromValidSelection(false);
    }
  };

  const handleFieldSuggestionSelect = (suggestion: FieldSuggestion | null) => {
    if (!suggestion) return;
    // Display without @ symbol after selection
    setFieldInputValue(suggestion.display);

    const selectedField = availableFields.find(
      (field) => field.id === suggestion.fullPath
    );
    if (selectedField) {
      // Set the field RID to trigger operators and values fetch
      setSelectedFieldRid(selectedField.id);
      // Mark as valid selection
      setIsFieldFromValidSelection(true);

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
    // Show suggestions on focus if there's any input or field is empty
    if (fieldInputValue.trim() !== '' || !condition.field) {
      setShowFieldSuggestions(true);
    }
  };

  const handleFieldInputBlur = () => {
    setTimeout(() => setShowFieldSuggestions(false), 200);
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

  // Check if field input is invalid (user typed text but didn't select from dropdown)
  const isFieldInputInvalid =
    fieldInputValue.trim() !== '' &&
    fieldInputValue !== '@' &&
    !isFieldFromValidSelection;

  // Get field errors from context for this specific condition
  const conditionFieldErrors = validatedFieldErrors.get(condition.id) || {
    field: false,
    operator: false,
    value: false,
  };

  // Individual field validation checks - only show errors for fields that were invalid at validation time
  const isFieldError = showValidationErrors && conditionFieldErrors.field;
  const isOperatorError = showValidationErrors && conditionFieldErrors.operator;
  const isValueError = showValidationErrors && conditionFieldErrors.value;

  // Check if condition is complete
  const isConditionComplete =
    condition.field &&
    isFieldFromValidSelection &&
    condition.operator &&
    condition.value !== '' &&
    condition.value !== null &&
    condition.value !== undefined;

  // Only show validation errors when explicitly requested
  const shouldShowError =
    showValidationErrors && (!isConditionComplete || isFieldInputInvalid);

  // Show duplicate error
  const shouldShowDuplicateError = isDuplicate && isConditionComplete;

  return (
    <div
      className={`rounded-lg border ${shouldShowError || shouldShowDuplicateError ? 'border-red-300' : 'border-[#CBD6E2]'} overflow-hidden`}
    >
      {/* Header */}
      <div
        className={`flex items-center justify-between h-[50px] px-4 ${shouldShowError || shouldShowDuplicateError ? 'bg-[#FEF2F2]' : 'bg-gray-50 hover:bg-gray-50'} cursor-pointer`}
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
          {(shouldShowError || shouldShowDuplicateError) && (
            <Tooltip
              title={
                shouldShowDuplicateError
                  ? 'This condition already exists. Please change the field, operator, or value.'
                  : 'Please fill all fields: Field, Operator, and Value'
              }
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
          className={`p-4 border-t ${shouldShowError || shouldShowDuplicateError ? 'border-red-300' : 'border-[#CBD6E2]'}`}
        >
          <div className='space-y-4'>
            {/* Field Input */}
            <div className='relative'>
              <label className='block text-xs font-medium text-[#2D3E4F] mb-1'>
                Field <span className='text-red-500'> *</span>
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
                    // Show suggestions when dropdown is opened
                    setShowFieldSuggestions(true);
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
                      placeholder='Start typing to search fields (@ optional)'
                      autoComplete='off'
                      onFocus={handleFieldInputFocus}
                      onBlur={handleFieldInputBlur}
                      error={isFieldError}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          padding: '5px',
                          height: '32px',
                          borderRadius: '2px',
                          fontSize: '13px',
                          background: isFieldError ? '#FEF2F2' : 'transparent',
                          '& input': {
                            padding: '0px 12px',
                            height: '32px',
                            boxSizing: 'border-box',
                            color: condition.field ? '#1976d2' : '#425A76',
                            fontWeight: condition.field ? 600 : 400,
                          },
                          '& fieldset': {
                            borderColor: isFieldError ? '#f44336' : '#CBD6E2',
                          },
                          '&:hover fieldset': {
                            borderColor: isFieldError ? '#f44336' : '#CBD6E2',
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
              {isFieldError && (
                <p className='text-xs text-red-600 mt-1'>
                  {isFieldInputInvalid
                    ? 'Invalid field input. Please select a field from the dropdown.'
                    : 'Field is required'}
                </p>
              )}
            </div>

            {/* Operator */}
            <div>
              <label className='block text-xs font-medium text-[#2D3E4F] mb-1'>
                Operator <span className='text-red-500'> *</span>
              </label>
              {isLoadingOperators ? (
                <Skeleton
                  variant='rectangular'
                  width='100%'
                  height={32}
                  sx={{ borderRadius: '2px' }}
                />
              ) : (
                <FormControl fullWidth size='small' error={isOperatorError}>
                  <Select
                    value={condition.operator || ''}
                    onChange={(e) => handleOperatorChange(e.target.value)}
                    displayEmpty
                    MenuProps={COMMON_MENU_PROPS}
                    disabled={isFieldEmpty || isLoadingOperators}
                    className={`${isOperatorError ? 'border-red-500 bg-[#FEF2F2]' : ''}`}
                    sx={getSelectStyles(
                      isOperatorError,
                      condition.operator === ''
                    )}
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
              {isOperatorError && (
                <p className='text-xs text-red-500 mt-1'>Field is required</p>
              )}
            </div>

            {/* Value */}
            <div>
              <label className='block text-xs font-medium text-[#2D3E4F] mb-1'>
                Value <span className='text-red-500'> *</span>
              </label>
              {isLoadingValues ? (
                <Skeleton
                  variant='rectangular'
                  width='100%'
                  height={32}
                  sx={{ borderRadius: '2px' }}
                />
              ) : (
                <FormControl fullWidth size='small' error={isValueError}>
                  <Select
                    value={condition.value || ''}
                    onChange={(e) => handleValueChange(e.target.value)}
                    displayEmpty
                    MenuProps={COMMON_MENU_PROPS}
                    disabled={isFieldEmpty || isLoadingValues}
                    className={`${isValueError ? 'border-red-500 bg-[#FEF2F2]' : ''}`}
                    sx={getSelectStyles(isValueError, condition.value === '')}
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
              {isValueError && (
                <p className='text-xs text-red-500 mt-1'>Field is required</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConditionForm;
