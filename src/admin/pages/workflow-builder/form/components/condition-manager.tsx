import React, { useEffect, useState, useMemo } from 'react';
import {
  Condition,
  ConditionType,
  ConditionTypeEnum,
  getDynamicSvgIcon,
} from '../helper';
import { AddIcon, SwapIcon } from '../../../../../assets';
import { Button, Tooltip } from '@mui/material';
import { useWorkflowContext } from '../workflow-context';
import { ConditionListResponse } from '../../../../types';
import { useGetConditionCategoryList } from '../../../../service/workflow-builder/workflow-builder-service';
import ConditionForm from './condition-form';

interface ConditionManagerProps {
  conditionListData?: ConditionListResponse;
  isLoadingConditionTypes?: boolean;
  onCategorySelectorChange?: (isShowing: boolean) => void;
}

const ConditionManager: React.FC<ConditionManagerProps> = ({
  conditionListData,
  isLoadingConditionTypes,
  onCategorySelectorChange,
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
    currentStep,
    goToStep,
    validatedConditionIds,
    duplicateConditionIds,
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

  // Track previous conditions length to detect new additions
  const [prevConditionsLength, setPrevConditionsLength] = useState(0);

  useEffect(() => {
    // Only expand the last condition when a NEW condition is added
    if (rule.conditions.length > prevConditionsLength) {
      setExpandedConditionIds(
        new Set([rule.conditions[rule.conditions.length - 1].id])
      );
    }
    setPrevConditionsLength(rule.conditions.length);
  }, [rule.conditions, prevConditionsLength]);

  useEffect(() => {
    // Show condition type selector when:
    // 1. No conditions exist AND no condition type selected
    // 2. Condition type is THEN AND user navigated back to conditions
    // Don't show if category selector is already showing (for IF/ELSE-IF)
    if (
      rule.conditions.length === 0 &&
      rule.trigger?.id &&
      currentStep === 'conditions'
    ) {
      // If condition type is IF/ELSE-IF and no conditions exist, show category selector
      if (
        rule.conditionType &&
        rule.conditionType.condition_type?.toLowerCase() !==
          ConditionTypeEnum.then
      ) {
        // Set the selected condition RID if not already set
        if (selectedConditionRid !== rule.conditionType.rid) {
          setSelectedConditionRid(rule.conditionType.rid);
        }
        // Show category selector for IF/ELSE-IF types
        setShowConditionTypeSelector(false);
        setShowCategorySelector(true);
      } else if (
        !rule.conditionType ||
        rule.conditionType.condition_type?.toLowerCase() ===
          ConditionTypeEnum.then
      ) {
        // Show condition type selector when:
        // - No condition type selected yet, OR
        // - THEN type is selected (user can change it)
        setShowConditionTypeSelector(true);
        setShowCategorySelector(false);

        // Set the selected condition RID if condition type exists
        if (
          rule.conditionType &&
          selectedConditionRid !== rule.conditionType.rid
        ) {
          setSelectedConditionRid(rule.conditionType.rid);
        }
      }
    }
  }, [
    rule.conditions.length,
    rule.trigger?.id,
    rule.conditionType,
    currentStep,
    selectedConditionRid,
  ]);

  // Close selectors when navigating away from conditions step
  useEffect(() => {
    if (currentStep !== 'conditions') {
      setShowCategorySelector(false);
      setShowConditionTypeSelector(false);
    }
  }, [currentStep]);

  // Notify parent when category selector state changes
  useEffect(() => {
    onCategorySelectorChange?.(showCategorySelector);
  }, [showCategorySelector, onCategorySelectorChange]);

  // Check if all existing conditions are complete
  const areAllConditionsComplete = rule.conditions.every(
    (condition) =>
      condition.field &&
      condition.operator &&
      condition.value !== '' &&
      condition.value !== null &&
      condition.value !== undefined
  );

  // Identify incomplete conditions that should show validation errors
  const incompleteConditions = useMemo(() => {
    if (validatedConditionIds.size === 0) return new Set();

    return new Set(
      rule.conditions
        .filter(
          (condition) =>
            validatedConditionIds.has(condition.id) &&
            (!condition.field ||
              !condition.operator ||
              condition.value === '' ||
              condition.value === null ||
              condition.value === undefined)
        )
        .map((condition) => condition.id)
    );
  }, [rule.conditions, validatedConditionIds]);

  // Auto-expand incomplete conditions when validation errors are shown
  useEffect(() => {
    if (validatedConditionIds.size > 0 && incompleteConditions.size > 0) {
      setExpandedConditionIds(
        new Set(Array.from(incompleteConditions) as string[])
      );
    }
  }, [validatedConditionIds, incompleteConditions]);

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
  };

  const handleConditionTypeSelect = (conditionType: ConditionType) => {
    // Update the rule with the selected condition type
    setConditionType(conditionType);
    setSelectedConditionRid(conditionType.rid);

    // Hide condition type selector first
    setShowConditionTypeSelector(false);

    // If THEN type is selected, automatically navigate to actions
    if (
      conditionType.condition_type?.toLowerCase() === ConditionTypeEnum.then
    ) {
      setShowCategorySelector(false);
      // Navigate to actions page
      goToStep('actions');
    } else {
      // For IF/ELSE-IF, show category selector
      // Use setTimeout to ensure state updates properly
      setTimeout(() => {
        setShowCategorySelector(true);
      }, 0);
    }
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
      // If no conditions added yet, reset everything and show condition type selector again
      setSelectedConditionRid(null);
      setConditionType(null); // Reset the condition type in the rule context
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
      {rule.conditions.map((condition, index) => {
        // Calculate disabled fields for this condition
        const disabledFieldIds: string[] = [];

        // If this is condition 2 (index 1) and operator is AND
        if (index === 1 && condition.logicalOperator === 'AND') {
          // Get the field from condition 1
          const condition1Field = rule.conditions[0]?.field;
          if (condition1Field) {
            disabledFieldIds.push(condition1Field);
          }
        }

        // Check if AND button should be disabled (when both conditions have same field)
        let isAndDisabled = false;
        let andDisabledTooltip = '';

        if (index === 1 && condition.logicalOperator === 'OR') {
          const condition1 = rule.conditions[0];
          const condition2 = condition;

          if (
            condition1.field &&
            condition2.field &&
            condition1.field === condition2.field
          ) {
            isAndDisabled = true;
            andDisabledTooltip =
              'Cannot use AND operator when both conditions use the same field. Please change one of the fields first.';
          }
        }

        return (
          <div key={condition.id}>
            {index > 0 && (
              <div className='relative flex justify-center'>
                <div className='w-[1px] bg-gray-400 h-18 relative'>
                  <div className='absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2'>
                    <Tooltip
                      title={
                        isAndDisabled && condition.logicalOperator === 'OR'
                          ? andDisabledTooltip
                          : ''
                      }
                      arrow
                      placement='top'
                      slotProps={{
                        tooltip: {
                          sx: {
                            backgroundColor: '#FEF2F2',
                          },
                        },
                      }}
                    >
                      <span>
                        <Button
                          variant='contained'
                          size='small'
                          onClick={() => {
                            const newOperator =
                              condition.logicalOperator === 'OR' ? 'AND' : 'OR';
                            updateLogicalOperator(condition.id, newOperator);
                          }}
                          disabled={
                            isAndDisabled && condition.logicalOperator === 'OR'
                          }
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
                            '&.Mui-disabled': {
                              backgroundColor: '#F3F4F6',
                              color: '#9CA3AF',
                              // opacity: 0.6,
                              cursor: 'not-allowed',
                            },
                            transition:
                              'background-color 0.2s ease, color 0.2s ease',
                          }}
                        >
                          <React.Suspense fallback={null}>
                            <SwapIcon
                              className={`w-4 h-4 transition-transform duration-300 ${
                                isAndDisabled
                                  ? '[&>path]:fill-[#9CA3AF]'
                                  : condition.logicalOperator === 'OR'
                                    ? 'rotate-180 [&>path]:fill-[#0B5ED7]'
                                    : '[&>path]:fill-[#374151]'
                              }`}
                            />
                          </React.Suspense>
                          {condition.logicalOperator === 'OR' ? 'OR' : 'AND'}
                        </Button>
                      </span>
                    </Tooltip>
                  </div>
                </div>
              </div>
            )}
            <div>
              <ConditionForm
                key={condition.id}
                condition={condition}
                isExpanded={isExpanded(condition.id)}
                onToggleExpand={() => handleToggleExpand(condition.id)}
                onChange={(updated) => updateCondition(condition.id, updated)}
                onDelete={() => handleDeleteCondition(condition.id)}
                showValidationErrors={validatedConditionIds.has(condition.id)}
                isDuplicate={duplicateConditionIds.has(condition.id)}
                disabledFieldIds={disabledFieldIds}
              />
            </div>
          </div>
        );
      })}

      {/* Show connector line when adding new condition (CategorySelector is shown) */}
      {rule.conditions.length > 0 && showCategorySelector && (
        <div className='relative flex justify-center'>
          <div className='w-[1px] bg-gray-400 h-18 relative'>
            <div className='absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2'>
              <button
                className='flex items-center justify-center gap-[4px] w-[70px] h-[28px] text-[12px] font-medium rounded-[3px] bg-[#F3F4F6] border border-[#D1D5DB] text-[#9CA3AF] shadow-none cursor-default'
                disabled
              >
                <React.Suspense fallback={null}>
                  <SwapIcon className='w-4 h-4 [&>path]:fill-[#9CA3AF]' />
                  AND
                </React.Suspense>
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

      {/* Only show Add Condition button if condition type is NOT THEN or if conditions already exist */}
      {rule.trigger?.id &&
        rule.conditionType?.condition_type?.toLowerCase() !==
          ConditionTypeEnum.then &&
        (rule.conditions.length > 0 || !showConditionTypeSelector) &&
        rule.conditions.length < 2 && (
          <button
            onClick={handleAddConditionClick}
            disabled={
              showConditionTypeSelector ||
              showCategorySelector ||
              isLoadingConditionTypes ||
              isLoadingCategories ||
              (rule.conditions.length > 0 && !areAllConditionsComplete)
            }
            className={`w-auto h-[28px] px-2.5 text-[13px] font-semibold flex items-center mt-4 rounded-[2px] border border-[#CBD6E2] text-[#425A76] hover:bg-gray-100 transition-all cursor-pointer disabled:cursor-default disabled:opacity-60 disabled:bg-gray-100 ${
              rule.conditions.length === 0 ? 'mt-2' : 'mt-4'
            }`}
          >
            <React.Suspense fallback={null}>
              <div className='flex items-center justify-center gap-2'>
                <AddIcon className='w-4 h-3' />
                Add condition
              </div>
            </React.Suspense>
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

    return iconMap[conditionType.toLowerCase()] || iconMap.if;
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
