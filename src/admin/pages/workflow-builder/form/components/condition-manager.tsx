import { useEffect, useState, useMemo } from 'react';
import {
  COMMON_MENU_PROPS,
  Condition,
  ConditionType,
  getDynamicSvgIcon,
  getSelectStyles,
} from '../helper';
import { ArrowRightIcon } from '@mui/x-date-pickers/icons';
import { AddIcon, SwapIcon, CloseIcon } from '../../../../../assets';
import {
  Autocomplete,
  Box,
  Button,
  FormControl,
  MenuItem,
  Select,
  TextField,
  Typography,
} from '@mui/material';
import { useWorkflowContext } from '../workflow-context';
import { ConditionListResponse } from '../../../../types';
import { useGetConditionCategoryList } from '../../../../service/workflow-builder/workflow-builder-service';

interface ConditionManagerProps {
  conditionListData?: ConditionListResponse;
  isLoadingConditionTypes?: boolean;
}

const ConditionManager: React.FC<ConditionManagerProps> = ({
  conditionListData,
  isLoadingConditionTypes,
}) => {
  const [showConditionTypeSelector, setShowConditionTypeSelector] =
    useState(false);
  const [showCategorySelector, setShowCategorySelector] = useState(false);
  const [selectedConditionRid, setSelectedConditionRid] = useState<
    string | null
  >(null);
  const [expandedConditionIds, setExpandedConditionIds] = useState<Set<string>>(
    new Set()
  );

  const {
    rule,
    addCondition,
    updateCondition,
    deleteCondition,
    updateLogicalOperator,
    setConditionType,
  } = useWorkflowContext();

  // Dynamically fetch condition categories based on selected condition type
  const categoryListParams = useMemo(
    () => ({
      condition_rid: selectedConditionRid || '',
      status_rid: '',
    }),
    [selectedConditionRid]
  );

  const { data: categoryListData, isLoading: isLoadingCategories } =
    useGetConditionCategoryList(categoryListParams, !!selectedConditionRid);

  useEffect(() => {
    // Initialize expanded IDs with the last condition
    if (rule.conditions.length > 0) {
      setExpandedConditionIds(
        new Set([rule.conditions[rule.conditions.length - 1].id])
      );
    }
  }, [rule.conditions]);

  useEffect(() => {
    // Show condition type selector only for the first condition
    if (
      rule.conditions.length === 0 &&
      rule.trigger?.id &&
      !rule.conditionType
    ) {
      setShowConditionTypeSelector(true);
    }
  }, [rule.conditions.length, rule.trigger?.id, rule.conditionType]);

  const handleAddConditionClick = () => {
    if (rule.conditions.length === 0 && !rule.conditionType) {
      // First condition - show condition type selector
      setShowConditionTypeSelector(true);
    } else {
      // Subsequent conditions - directly show category selector using the already selected condition type
      if (rule.conditionType) {
        // Only set if it's different to avoid unnecessary re-render
        if (selectedConditionRid !== rule.conditionType.rid) {
          setSelectedConditionRid(rule.conditionType.rid);
        }
        setShowCategorySelector(true);
      }
    }
    setExpandedConditionIds(new Set());
  };

  const handleConditionTypeSelect = (conditionType: ConditionType) => {
    // Update the rule with the selected condition type
    setConditionType(conditionType);
    setSelectedConditionRid(conditionType.rid);
    setShowConditionTypeSelector(false);
    setShowCategorySelector(true);
  };

  const handleCategorySelect = (category: {
    rid: string;
    category_name: string;
    description: string;
  }) => {
    const newCondition: Condition = {
      id: crypto.randomUUID(),
      name: category.category_name,
      category: category.rid,
      field: '',
      operator: '',
      value: '',
      fieldType: 'text',
      conditionTypeId: rule.conditionType?.rid || '',
      logicalOperator: rule.conditions.length > 0 ? 'AND' : undefined,
    };
    addCondition(newCondition);
    setShowCategorySelector(false);
    // Don't reset selectedConditionRid - keep it for caching!
    setExpandedConditionIds(new Set([newCondition.id]));
  };

  const handleCancelCategorySelection = () => {
    setShowCategorySelector(false);
    if (rule.conditions.length === 0) {
      // If no conditions added yet, show condition type selector again
      setSelectedConditionRid(null);
      setShowConditionTypeSelector(true);
    }
  };

  const handleToggleExpand = (conditionId: string) => {
    setExpandedConditionIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(conditionId)) {
        newSet.delete(conditionId);
      } else {
        newSet.add(conditionId);
      }
      return newSet;
    });
  };

  const handleDeleteCondition = (conditionId: string) => {
    deleteCondition(conditionId);

    // Check if this is the last condition being deleted
    const remainingConditions = rule.conditions.filter(
      (c) => c.id !== conditionId
    );
    if (remainingConditions.length === 0) {
      // Reset selectedConditionRid when all conditions are deleted
      setSelectedConditionRid(null);
    }

    setExpandedConditionIds((prev) => {
      const newSet = new Set(prev);
      newSet.delete(conditionId);

      if (newSet.size === 0 && rule.conditions.length > 1) {
        if (remainingConditions.length > 0) {
          newSet.add(remainingConditions[remainingConditions.length - 1].id);
        }
      }

      return newSet;
    });
  };

  const isExpanded = (conditionId: string) => {
    return expandedConditionIds.has(conditionId);
  };

  // Transform API data to condition types
  const conditionTypes: ConditionType[] =
    conditionListData?.data?.map((conditionType) => ({
      rid: conditionType.rid,
      name: conditionType.condition_name,
      description: conditionType.description || '',
      condition_type: conditionType.condition_type,
    })) || [];

  // Transform API data to categories
  const categories =
    categoryListData?.data?.map((category) => ({
      id: category.rid,
      name: category.category_name,
      description: category.description || '',
    })) || [];

  return (
    <div>
      {/* Existing Conditions */}
      {rule.conditions.map((condition, index) => (
        <div key={condition.id}>
          {index > 0 && (
            <div className='relative flex justify-center'>
              <div className='w-[1px] bg-gray-400 h-18 relative'>
                <div className='absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2'>
                  <Button
                    variant='contained'
                    size='small'
                    onClick={() => {
                      const newOperator =
                        condition.logicalOperator === 'OR' ? 'AND' : 'OR';
                      updateLogicalOperator(condition.id, newOperator);
                    }}
                    sx={{
                      textTransform: 'none',
                      fontWeight: 500,
                      fontSize: '12px',
                      width: 70,
                      height: 28,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px',
                      borderRadius: '3px',
                      color:
                        condition.logicalOperator === 'OR'
                          ? '#0B5ED7'
                          : '#374151',
                      backgroundColor:
                        condition.logicalOperator === 'OR'
                          ? '#E8F0FE'
                          : '#F3F4F6',
                      border: '1px solid #D1D5DB',
                      boxShadow: 'none',
                      '&:hover': {
                        backgroundColor:
                          condition.logicalOperator === 'OR'
                            ? '#DDE7FC'
                            : '#E5E7EB',
                        boxShadow: 'none',
                      },
                      transition: 'background-color 0.2s ease, color 0.2s ease',
                    }}
                  >
                    <SwapIcon
                      className={`w-4 h-4 transition-transform duration-300 ${
                        condition.logicalOperator === 'OR'
                          ? 'rotate-180 [&>path]:fill-[#0B5ED7]'
                          : '[&>path]:fill-[#374151]'
                      }`}
                    />
                    {condition.logicalOperator === 'OR' ? 'OR' : 'AND'}
                  </Button>
                </div>
              </div>
            </div>
          )}
          <ConditionForm
            key={condition.id}
            condition={condition}
            isExpanded={isExpanded(condition.id)}
            onToggleExpand={() => handleToggleExpand(condition.id)}
            onChange={(updated) => updateCondition(condition.id, updated)}
            onDelete={() => handleDeleteCondition(condition.id)}
          />
        </div>
      ))}

      {/* Show connector line when adding new condition (CategorySelector is shown) */}
      {rule.conditions.length > 0 && showCategorySelector && (
        <div className='relative flex justify-center'>
          <div className='w-[1px] bg-gray-400 h-18 relative'>
            <div className='absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2'>
              <button
                className='flex items-center justify-center gap-[4px] w-[70px] h-[28px] text-[12px] font-medium rounded-[3px] bg-[#F3F4F6] border border-[#D1D5DB] text-[#9CA3AF] shadow-none cursor-default'
                disabled
              >
                <SwapIcon className='w-4 h-4 [&>path]:fill-[#9CA3AF]' /> AND
              </button>
            </div>
          </div>
        </div>
      )}

      {showConditionTypeSelector && (
        <div className='space-y-4'>
          {isLoadingConditionTypes ? (
            <SelectorSkeleton title='Choose how to add conditions' />
          ) : (
            <ConditionTypeSelector
              conditionTypes={conditionTypes}
              selectedConditionType={rule.conditionType}
              onSelect={handleConditionTypeSelect}
            />
          )}
        </div>
      )}

      {showCategorySelector && (
        <div className='space-y-4'>
          {isLoadingCategories ? (
            <SelectorSkeleton title='Select condition category' />
          ) : (
            <CategorySelector
              categories={categories}
              onSelect={handleCategorySelect}
              onCancel={handleCancelCategorySelection}
            />
          )}
        </div>
      )}

      {(rule.conditions.length > 0 || !showConditionTypeSelector) &&
        rule.trigger?.id && (
          <button
            onClick={handleAddConditionClick}
            disabled={
              showConditionTypeSelector ||
              showCategorySelector ||
              isLoadingConditionTypes ||
              isLoadingCategories
            }
            className={`w-auto h-[28px] px-2.5 text-[13px] font-semibold flex items-center mt-4 rounded-[2px] border border-[#CBD6E2] text-[#425A76] hover:bg-gray-100 transition-all cursor-pointer disabled:cursor-default disabled:opacity-60 disabled:bg-gray-100 ${
              rule.conditions.length === 0 ? 'mt-2' : 'mt-4'
            }`}
          >
            <div className='flex items-center justify-center gap-2'>
              <AddIcon className='w-4 h-3' />
              Add condition
            </div>
          </button>
        )}

      {!rule.trigger?.id && rule.conditions.length === 0 && (
        <div className='text-center py-4 text-sm text-gray-500'>
          Please select a trigger first to add conditions
        </div>
      )}
    </div>
  );
};

interface CategorySelectorProps {
  categories: Array<{
    id: string;
    name: string;
    description: string;
  }>;
  onSelect: (category: {
    rid: string;
    category_name: string;
    description: string;
  }) => void;
  onCancel?: () => void;
}

function CategorySelector({
  categories,
  onSelect,
  onCancel,
}: CategorySelectorProps) {
  return (
    <div className='bg-gray-50 rounded-lg border border-[#CBD6E2] overflow-hidden'>
      <div className='bg-gray-50 px-4 py-3 border-b border-[#CBD6E2]'>
        <div className='flex justify-between items-center'>
          <h3 className='text-sm font-semibold text-[#425A76]'>
            Select condition category
          </h3>
          {onCancel && (
            <button
              onClick={onCancel}
              className='text-xs text-gray-700 px-2 py-1 rounded-[2px] hover:bg-gray-200 transition-colors cursor-pointer'
            >
              Cancel
            </button>
          )}
        </div>
      </div>

      <div className='p-2 space-y-1 max-h-[250px] overflow-auto'>
        {categories.length > 0 ? (
          categories.map((category) => {
            return (
              <button
                key={category.id}
                onClick={() =>
                  onSelect({
                    rid: category.id,
                    category_name: category.name,
                    description: category.description,
                  })
                }
                className='w-full flex items-center gap-3 p-2 rounded-lg hover:bg-[#ffe4b32e] transition-colors text-left cursor-pointer border border-transparent hover:border-[#ffe4b3]'
              >
                <div className='w-8 h-8 p-1.5 rounded-full bg-[#ffe4b3] flex items-center justify-center flex-shrink-0'>
                  {getDynamicSvgIcon(category.name)}
                </div>
                <div className='flex-1'>
                  <span className='text-sm font-medium text-[#425A76] block'>
                    {category.name}
                  </span>
                  <span className='text-xs text-gray-500 block mt-1'>
                    {category.description}
                  </span>
                </div>
              </button>
            );
          })
        ) : (
          <div className='text-center py-4 text-sm text-gray-500'>
            No categories found
          </div>
        )}
      </div>
    </div>
  );
}

interface SelectorSkeletonProps {
  title?: string;
  itemCount?: number;
}

function SelectorSkeleton({ title, itemCount = 3 }: SelectorSkeletonProps) {
  return (
    <div className='bg-gray-50 rounded-lg border border-[#CBD6E2] overflow-hidden'>
      <div className='bg-gray-50 px-4 py-3 border-b border-[#CBD6E2]'>
        <div className='flex justify-between items-center'>
          {title ? (
            <h3 className='text-sm font-semibold text-[#425A76]'>{title}</h3>
          ) : (
            <div className='h-4 bg-gray-200 rounded w-1/3 animate-pulse'></div>
          )}
          <div className='h-6 bg-gray-200 rounded w-16 animate-pulse'></div>
        </div>
      </div>
      <div className='p-2 space-y-1'>
        {[...Array(itemCount)].map((_, i) => (
          <div
            key={i}
            className='w-full flex items-center gap-3 p-3 rounded-lg border border-[#CBD6E2] animate-pulse'
          >
            <div className='w-8 h-8 rounded-full bg-gray-200'></div>
            <div className='flex-1 space-y-2'>
              <div className='h-3 bg-gray-200 rounded w-3/4'></div>
              <div className='h-2 bg-gray-200 rounded w-full'></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

interface ConditionFormProps {
  condition: Condition;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onChange: (condition: Condition) => void;
  onDelete: () => void;
}

interface FieldSuggestion {
  id: string;
  display: string;
  fullPath: string;
  description?: string;
}

function ConditionForm({
  condition,
  isExpanded,
  onToggleExpand,
  onChange,
  onDelete,
}: ConditionFormProps) {
  // Mock data - you'll need to replace this with API calls for field data
  const availableFields = [
    {
      id: 'task.status',
      name: 'Status',
      type: 'text',
      operators: ['==', '!=', 'contains'],
    },
    {
      id: 'task.priority',
      name: 'Priority',
      type: 'text',
      operators: ['==', '!=', 'in'],
    },
    {
      id: 'task.due_date',
      name: 'Due Date',
      type: 'date',
      operators: ['>', '<', '=='],
    },
    {
      id: 'task.assigned_to',
      name: 'Assigned To',
      type: 'text',
      operators: ['==', '!='],
    },
    {
      id: 'task.completed',
      name: 'Completed',
      type: 'boolean',
      operators: ['=='],
    },
  ];

  const fieldOptions = {
    'task.status': [
      { label: 'Pending', value: 'pending' },
      { label: 'In Progress', value: 'in_progress' },
      { label: 'Completed', value: 'completed' },
      { label: 'Cancelled', value: 'cancelled' },
    ],
    'task.priority': [
      { label: 'Low', value: 'low' },
      { label: 'Medium', value: 'medium' },
      { label: 'High', value: 'high' },
      { label: 'Critical', value: 'critical' },
    ],
    'task.completed': [
      { label: 'Yes', value: 'true' },
      { label: 'No', value: 'false' },
    ],
  };

  const availableOperators = [
    { value: '==', label: 'Equals' },
    { value: '!=', label: 'Not Equals' },
    { value: '>', label: 'Greater Than' },
    { value: '<', label: 'Less Than' },
    { value: '>=', label: 'Greater Than or Equal' },
    { value: '<=', label: 'Less Than or Equal' },
    { value: 'contains', label: 'Contains' },
    { value: 'in', label: 'In' },
  ];

  const [fieldInputValue, setFieldInputValue] = useState(
    condition.field ? `@${condition.field}` : ''
  );
  const [showFieldSuggestions, setShowFieldSuggestions] = useState(false);

  const isFieldEmpty = !condition.field;

  const getAllFieldSuggestions = (): FieldSuggestion[] => {
    return availableFields.map((field) => ({
      id: field.id,
      display: field.id,
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
        fieldType: null,
        operator: '',
        value: '',
      });
    }
  };

  const handleFieldSuggestionSelect = (suggestion: FieldSuggestion | null) => {
    if (!suggestion) return;
    const fullValue = `@${suggestion.fullPath}`;
    setFieldInputValue(fullValue);

    const selectedField = availableFields.find(
      (field) => field.id === suggestion.fullPath
    );
    if (selectedField) {
      onChange({
        ...condition,
        field: suggestion.fullPath,
        fieldType: selectedField.type as
          | 'number'
          | 'boolean'
          | 'text'
          | 'date'
          | 'select'
          | 'multiselect'
          | 'logical'
          | null,
        operator: '',
        value: '',
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

  const handleOperatorChange = (operator: string) => {
    onChange({
      ...condition,
      operator,
    });
  };

  const handleValueChange = (value: string | string[]) => {
    onChange({
      ...condition,
      value,
    });
  };

  const selectedField = availableFields.find((f) => f.id === condition.field);

  return (
    <div className='rounded-lg border border-[#CBD6E2] overflow-hidden'>
      {/* Header */}
      <div
        className='flex items-center justify-between h-[50px] px-4 bg-gray-50 cursor-pointer hover:bg-gray-50'
        onClick={onToggleExpand}
      >
        <div className='flex items-center gap-2 flex-1'>
          <ArrowRightIcon
            className={`text-gray-400 w-4 h-4 transition-transform ${
              isExpanded ? 'rotate-90' : 'rotate-0'
            }`}
          />
          <div className='w-8 h-8 p-1.5 rounded-full bg-[#ffe4b3] flex items-center justify-center'>
            {getDynamicSvgIcon('condition')}
          </div>
          <div className='flex-1'>
            <div className='text-sm font-medium text-gray-900'>
              {condition.name || 'Condition'}
            </div>
            {!isExpanded && condition.field && (
              <div className='text-xs text-gray-500 mt-1 flex flex-wrap gap-3 truncate'>
                <span>
                  <strong className='text-gray-700'>Field:</strong>{' '}
                  <span className='text-[#1976d2]'>
                    {condition.field || '-'}
                  </span>
                </span>
                <span>
                  <strong className='text-gray-700'>Operator:</strong>{' '}
                  {condition.operator || '-'}
                </span>
                <span>
                  <strong className='text-gray-700'>Value:</strong>{' '}
                  {condition.value || '-'}
                </span>
              </div>
            )}
          </div>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className='h-8 w-8 flex items-center justify-center hover:bg-gray-200 rounded-full transition-colors cursor-pointer'
          title='Remove Condition'
        >
          <CloseIcon className='w-3 h-3' />
        </button>
      </div>

      {/* Expanded Fields */}
      {isExpanded && (
        <div className='p-4 border-t border-[#CBD6E2]'>
          <div className='space-y-4'>
            {/* Field Input */}
            <div className='relative'>
              <label className='block text-xs font-medium text-gray-700 mb-2'>
                Field
              </label>
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
                renderOption={(props, option) => (
                  <li {...props}>
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
                )}
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
            </div>

            {/* Operator */}
            <div>
              <label className='block text-xs font-medium text-gray-700 mb-2'>
                Operator
              </label>
              <FormControl fullWidth size='small'>
                <Select
                  value={condition.operator || ''}
                  onChange={(e) => handleOperatorChange(e.target.value)}
                  displayEmpty
                  MenuProps={COMMON_MENU_PROPS}
                  disabled={isFieldEmpty}
                  sx={getSelectStyles(false, condition.operator === '')}
                >
                  <MenuItem
                    value=''
                    sx={{ color: '#425A76', fontSize: '13px', fontWeight: 500 }}
                  >
                    Choose operator
                  </MenuItem>
                  {(selectedField?.operators || []).map((opSymbol) => {
                    const op = availableOperators.find(
                      (o) => o.value === opSymbol
                    );
                    if (!op) return null;
                    return (
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
                    );
                  })}
                </Select>
              </FormControl>
            </div>

            {/* Value */}
            {selectedField && (
              <div>
                <label className='block text-xs font-medium text-gray-700 mb-2'>
                  Value
                </label>
                {fieldOptions[condition.field as keyof typeof fieldOptions] ? (
                  <FormControl fullWidth size='small'>
                    <Select
                      value={condition.value || ''}
                      onChange={(e) => handleValueChange(e.target.value)}
                      displayEmpty
                      MenuProps={COMMON_MENU_PROPS}
                      disabled={isFieldEmpty || !condition.operator}
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
                        Choose value
                      </MenuItem>
                      {fieldOptions[
                        condition.field as keyof typeof fieldOptions
                      ].map((opt) => (
                        <MenuItem
                          key={opt.label}
                          value={opt.value}
                          sx={{
                            color: '#425A76',
                            fontSize: '13px',
                            fontWeight: 500,
                          }}
                        >
                          {opt.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                ) : (
                  <input
                    type={selectedField.type === 'number' ? 'text' : 'text'}
                    inputMode={
                      selectedField.type === 'number' ? 'numeric' : 'text'
                    }
                    pattern={
                      selectedField.type === 'number' ? '[0-9]*' : undefined
                    }
                    value={(condition.value as string) || ''}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (selectedField.type === 'number') {
                        if (/^\d*$/.test(value)) handleValueChange(value);
                      } else {
                        handleValueChange(value);
                      }
                    }}
                    disabled={isFieldEmpty || !condition.operator}
                    className='placeholder-[#7D98B6] w-full sm:text-sm px-3 h-[32px] border border-[#CBD6E2] rounded-xs outline-none focus:border-2 focus:border-blue-400 disabled:bg-gray-100'
                    placeholder={`Enter ${selectedField.name.toLowerCase()}`}
                  />
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

interface ConditionTypeSelectorProps {
  conditionTypes: ConditionType[];
  selectedConditionType?: ConditionType | null;
  onSelect: (conditionType: ConditionType) => void;
  onCancel?: () => void;
}

function ConditionTypeSelector({
  conditionTypes,
  selectedConditionType,
  onSelect,
  onCancel,
}: ConditionTypeSelectorProps) {
  const getConditionTypeIcon = (conditionType: string) => {
    const iconMap: { [key: string]: string } = {
      if: 'M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
      then: 'M13 10V3L4 14h7v7l9-11h-7z',
      for_each:
        'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
    };

    return iconMap[conditionType] || iconMap.if;
  };

  return (
    <div className='bg-gray-50 rounded-lg border border-[#CBD6E2] overflow-hidden'>
      <div className='bg-gray-50 px-4 py-3 border-b border-[#CBD6E2]'>
        <div className='flex justify-between items-center'>
          <h3 className='text-sm font-semibold text-[#425A76]'>
            Choose how to add conditions
          </h3>
          {onCancel && (
            <button
              onClick={onCancel}
              className='text-xs text-gray-700 px-2 py-1 rounded-[2px] hover:bg-gray-200 transition-colors cursor-pointer'
            >
              Cancel
            </button>
          )}
        </div>
      </div>

      <div className='p-2 space-y-1'>
        {conditionTypes.length > 0 ? (
          conditionTypes.map((conditionType) => {
            const isSelected = selectedConditionType?.rid === conditionType.rid;
            return (
              <button
                key={conditionType.rid}
                onClick={() => onSelect(conditionType)}
                className={`w-full flex items-center gap-3 p-2 rounded-lg transition-colors text-left cursor-pointer group ${
                  isSelected
                    ? 'bg-blue-50 border border-blue-400'
                    : 'border border-transparent hover:border-blue-200 hover:bg-blue-50'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
                    isSelected
                      ? 'bg-blue-200'
                      : 'bg-blue-100 group-hover:bg-blue-200'
                  }`}
                >
                  <svg
                    className='w-4 h-4 text-blue-600'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d={getConditionTypeIcon(conditionType.condition_type)}
                    />
                  </svg>
                </div>
                <div className='flex-1'>
                  <span
                    className={`text-sm font-medium block ${
                      isSelected ? 'text-blue-700' : 'text-[#425A76]'
                    }`}
                  >
                    {conditionType.name}
                  </span>
                  <span className='text-xs text-gray-500 block mt-1'>
                    {conditionType.description}
                  </span>
                </div>
              </button>
            );
          })
        ) : (
          <div className='text-center py-4 text-sm text-gray-500'>
            No condition types found
          </div>
        )}
      </div>
    </div>
  );
}

export default ConditionManager;
