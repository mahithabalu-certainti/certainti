import React, { useState } from 'react';
import { DeleteIcon, EditIcon } from '../../../../../assets';
import {
  ActionManager,
  ConditionManager,
  ConnectorLine,
  PageSkeleton,
  TriggerManager,
} from '.';
import { getDynamicSvgIcon, Trigger } from '../helper';
import { useWorkflowContext } from '../workflow-context';
import {
  ActionCategoryTypeResponse,
  ConditionListResponse,
  ScopeListResponse,
} from '../../../../types';
import { Tooltip } from '@mui/material';

interface RuleBuilderProps {
  apiData: {
    scopeListData?: ScopeListResponse;
    conditionListData?: ConditionListResponse;
    actionCategoryData?: ActionCategoryTypeResponse;
    isLoadingConditionTypes?: boolean;
    isLoadingActionCategories?: boolean;
  };
  isInitialLoading: boolean;
}

const RuleBuilder: React.FC<RuleBuilderProps> = ({
  apiData,
  isInitialLoading,
}) => {
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const {
    rule,
    currentStep,
    selectTrigger,
    removeTrigger,
    updateRuleName,
    goToStep,
    canProceedToConditions,
    canProceedToActions,
    validatedConditionIds,
  } = useWorkflowContext();

  const handleSelectTrigger = (trigger: Trigger) => {
    selectTrigger(trigger);
  };

  const handleRemoveTrigger = () => {
    removeTrigger();
  };

  const handleBack = () => {
    switch (currentStep) {
      case 'conditions':
        goToStep('trigger');
        break;
      case 'actions':
        goToStep('conditions');
        break;
      default:
        goToStep('trigger');
    }
  };

  const handleNext = () => {
    switch (currentStep) {
      case 'trigger':
        if (canProceedToConditions) {
          goToStep('conditions');
        }
        break;
      case 'conditions':
        if (canProceedToActions) {
          goToStep('actions');
        }
        break;
      // No 'actions' case needed since Next button is not shown in actions step
      // Validation for save happens in the form-level save button
    }
  };

  const renderStepContent = () => {
    return (
      <>
        {/* Trigger Step - Always mounted, visibility controlled by CSS */}
        <div style={{ display: currentStep === 'trigger' ? 'block' : 'none' }}>
          <TriggerManager
            scopeListData={apiData.scopeListData}
            onSelect={handleSelectTrigger}
          />
        </div>

        {/* Conditions Step - Always mounted, visibility controlled by CSS */}
        <div
          style={{ display: currentStep === 'conditions' ? 'block' : 'none' }}
        >
          <div className='p-6 relative'>
            <div className='flex items-start justify-between gap-3 mb-3 pr-4'>
              <div className='flex items-center gap-2'>
                <div className='bg-blue-100 p-1 rounded-md flex items-center justify-center w-8 h-8 flex-shrink-0'>
                  {getDynamicSvgIcon(rule.trigger?.name || 'trigger')}
                </div>
                <div className='text-lg font-semibold text-[#425A76] mb-1 capitalize'>
                  {rule.trigger?.name || 'Configure Conditions'}
                </div>
              </div>
              <Tooltip
                placement='top'
                title='Remove Trigger'
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
                  onClick={handleRemoveTrigger}
                  className='h-8 w-8 flex items-center justify-center hover:bg-gray-100 rounded-full transition-colors cursor-pointer'
                >
                  <React.Suspense fallback={null}>
                    <DeleteIcon className='w-4 h-4' />
                  </React.Suspense>
                </button>
              </Tooltip>
            </div>

            <div className='text-sm text-[#425A76] mb-6'>
              {rule.trigger?.description}
            </div>

            <ConditionManager
              conditionListData={apiData.conditionListData}
              isLoadingConditionTypes={apiData.isLoadingConditionTypes}
              validatedConditionIds={validatedConditionIds}
            />
          </div>
        </div>

        {/* Actions Step - Always mounted, visibility controlled by CSS */}
        <div style={{ display: currentStep === 'actions' ? 'block' : 'none' }}>
          <div className='relative'>
            <ActionManager
              actionCategoryData={apiData.actionCategoryData}
              isLoadingActionCategories={apiData.isLoadingActionCategories}
            />
          </div>
        </div>
      </>
    );
  };

  const isNextButtonDisabled = () => {
    switch (currentStep) {
      case 'trigger':
        return !canProceedToConditions;
      case 'conditions':
        return !canProceedToActions;
      case 'actions':
        return rule.actions.length === 0;
      default:
        return true;
    }
  };

  return (
    <div>
      <div className='flex items-center justify-between border-b border-[#CBD6E2] h-[50px] px-10'>
        <div className='flex items-center gap-3 group'>
          {isEditing ? (
            <input
              type='text'
              value={rule.name}
              autoFocus
              onChange={(e) => updateRuleName(e.target.value)}
              onBlur={() => setIsEditing(false)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') setIsEditing(false);
              }}
              className='text-[14px] font-medium text-[#425A76] bg-white border border-gray-300 
                 rounded-[2px] px-2 py-0.5 outline-none focus:ring-1 focus:ring-blue-500'
            />
          ) : (
            <div className='flex items-center gap-2 group/name relative'>
              <h1 className='text-xl font-medium text-[#425A76]'>
                {rule.name}
              </h1>
              <React.Suspense fallback={null}>
                <EditIcon
                  className='w-3.5 h-3.5 cursor-pointer transition-opacity duration-200'
                  style={{
                    filter:
                      'brightness(0) saturate(100%) invert(16%) sepia(14%) saturate(749%) hue-rotate(169deg) brightness(93%) contrast(86%)',
                  }}
                  onClick={() => setIsEditing(true)}
                />
              </React.Suspense>
            </div>
          )}
          <span className='px-1 py-0.5 bg-purple-100 text-purple-700 text-xs font-medium rounded'>
            NEW
          </span>
        </div>
      </div>
      {isInitialLoading ? (
        <div className='w-full flex h-full bg-gray-50'>
          <PageSkeleton showLeftPanel={true} />
          <div className='flex-1 border-l border-[#CBD6E2] min-h-[calc(100vh-182px)] max-h-[calc(100vh-182px)] overflow-y-auto'>
            <PageSkeleton />
          </div>
        </div>
      ) : (
        <div className='flex h-full bg-gray-50'>
          {/* Left Panel - Visual Stepper */}
          <div className='flex justify-items-start pl-10 flex-shrink-0 w-[30%] py-10 min-h-[calc(100vh-182px)] max-h-[calc(100vh-182px)] overflow-y-auto'>
            <div className='w-[90%] max-w-[90%]'>
              {/* Trigger Block */}
              <div
                className={`border rounded-lg p-4 cursor-pointer transition-all ${
                  currentStep === 'trigger'
                    ? 'border-blue-500 bg-blue-50'
                    : rule.trigger
                      ? 'border border-[#98fb98] bg-[#E0FEE0]'
                      : 'border-gray-300 bg-white'
                }`}
                onClick={() => currentStep !== 'trigger' && goToStep('trigger')}
              >
                <div className='flex items-start gap-3'>
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 border ${
                      rule.trigger
                        ? 'bg-green-200 border-green-500 text-green-700'
                        : 'bg-blue-200 border border-blue-500 text-blue-700'
                    }`}
                  >
                    <span>⏻</span>
                  </div>
                  <div className='flex-1'>
                    <h3 className='text-sm font-semibold text-gray-900 mb-1'>
                      When:{' '}
                      {rule.trigger ? (
                        <span className='capitalize'>{rule.trigger.name}</span>
                      ) : (
                        'Add a trigger'
                      )}
                    </h3>
                    <p className='text-xs text-gray-600'>
                      {rule.trigger
                        ? rule.trigger.description
                        : 'An event that triggers the rule to run'}
                    </p>
                  </div>
                  {rule.trigger && (
                    <Tooltip placement='top' title='Remove Trigger' arrow>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveTrigger();
                        }}
                        className='h-8 w-8 flex items-center justify-center hover:bg-gray-100 rounded-full transition-colors cursor-pointer'
                      >
                        <React.Suspense fallback={null}>
                          <DeleteIcon className='w-4 h-4' />
                        </React.Suspense>
                      </button>
                    </Tooltip>
                  )}
                </div>
              </div>

              <ConnectorLine
                active={Boolean(
                  rule.trigger &&
                    currentStep === 'conditions' &&
                    !rule.conditions.length
                )}
              />

              {/* Conditions Block */}
              <div
                className={`border rounded-lg p-4 ${
                  rule.trigger && currentStep !== 'conditions'
                    ? 'cursor-pointer'
                    : 'cursor-default'
                } transition-all ${
                  currentStep === 'conditions'
                    ? 'border-blue-500 bg-blue-50'
                    : rule.conditions.length > 0
                      ? 'border-amber-300 bg-amber-50'
                      : 'border-gray-300 bg-white'
                }`}
                onClick={() =>
                  rule.trigger &&
                  currentStep !== 'conditions' &&
                  goToStep('conditions')
                }
              >
                <div className='flex items-start gap-3'>
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 border ${
                      currentStep === 'conditions' &&
                      rule.conditions.length === 0
                        ? 'border-blue-500 bg-blue-200'
                        : rule.conditions.length > 0
                          ? 'bg-[#FFF3B3] border-[#FFD700]'
                          : 'border-gray-300 bg-gray-200'
                    }`}
                  >
                    <span
                      className={`text-[16px] ${
                        currentStep === 'conditions' &&
                        rule.conditions.length === 0
                          ? 'text-blue-700'
                          : rule.conditions.length > 0
                            ? 'text-amber-700'
                            : 'text-[#425A76]'
                      }`}
                    >
                      ≈
                    </span>
                  </div>
                  <div className='flex-1'>
                    <h3 className='text-sm font-semibold text-gray-900 mb-1'>
                      {rule.conditionType?.condition_type === 'for-each'
                        ? 'For Each:'
                        : rule.conditionType?.condition_type === 'then'
                          ? 'Then:'
                          : rule.conditionType?.condition_type === 'if'
                            ? 'If:'
                            : ''}
                      {rule.conditions.length > 0
                        ? `${rule.conditions.length} condition(s)`
                        : 'Add conditions'}
                    </h3>
                    <p className='text-xs text-gray-600'>
                      {rule.conditions.length > 0
                        ? 'Conditions that must be met for the rule to execute'
                        : 'Filter events that trigger the rule'}
                    </p>
                    {rule.conditions.length > 0 && (
                      <div className='mt-2 space-y-1'>
                        {rule.conditions
                          .slice(0, 3)
                          .map((condition, index, arr) => (
                            <div
                              key={condition.id}
                              className='flex flex-col items-start'
                            >
                              {/* Bullet + name */}
                              <div className='flex items-center gap-2 text-xs text-gray-700'>
                                <div className='w-3 h-3 rounded-full bg-amber-100 flex items-center justify-center'>
                                  <span className='bg-amber-700 w-1 h-1 rounded-full'></span>
                                </div>
                                <span>{condition.name}</span>
                              </div>

                              {/* Connector + logical operator — show if NOT last item */}
                              {index < arr.length - 1 && (
                                <div className='flex flex-col items-center w-[25%]'>
                                  <div className='w-[1px] h-2 bg-gray-400'></div>

                                  {/* Use next condition’s logicalOperator */}
                                  <div className='!p-0 text-[8px] font-semibold text-[#0B5ED7]'>
                                    {arr[index + 1].logicalOperator || 'AND'}
                                  </div>

                                  <div className='w-[1px] h-2 bg-gray-400'></div>
                                </div>
                              )}
                            </div>
                          ))}

                        {/* More count */}
                        {rule.conditions.length > 3 && (
                          <div className='text-xs text-gray-500'>
                            +{rule.conditions.length - 3} more conditions
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <ConnectorLine
                active={
                  rule.conditions.length > 0 &&
                  currentStep === 'actions' &&
                  !rule.actions.length
                }
              />

              {/* Actions Block */}
              <div
                className={`border rounded-lg p-4 ${
                  canProceedToActions && currentStep !== 'actions'
                    ? 'cursor-pointer'
                    : 'cursor-default'
                } transition-all border ${
                  currentStep === 'actions'
                    ? 'border-blue-500 bg-blue-50'
                    : rule.actions.length > 0
                      ? 'border border-[#ff7256d3] bg-[#ffd5cd8d]'
                      : 'border-gray-300 bg-white'
                }`}
                onClick={() =>
                  canProceedToActions &&
                  currentStep !== 'actions' &&
                  goToStep('actions')
                }
              >
                <div className='flex items-start gap-3'>
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 border ${
                      currentStep === 'actions' && rule.actions.length === 0
                        ? 'border-blue-500 bg-blue-200'
                        : rule.actions.length > 0
                          ? 'border border-[#FF7256] bg-[#FFD5CD]'
                          : 'bg-gray-200 border-gray-300'
                    }`}
                  >
                    <span
                      className={`text-sm ${
                        currentStep === 'actions' && rule.actions.length === 0
                          ? 'text-blue-700'
                          : rule.actions.length > 0
                            ? 'text-yellow-700'
                            : 'text-gray-700'
                      }`}
                    >
                      <svg
                        xmlns='http://www.w3.org/2000/svg'
                        viewBox='0 0 24 24'
                        fill='currentColor'
                        className='w-4 h-4'
                      >
                        <path d='M13 2L3 14h7l-1 8 10-12h-7l1-8z' />
                      </svg>
                    </span>
                  </div>
                  <div className='flex-1'>
                    <h3 className='text-sm font-semibold text-gray-900 mb-1'>
                      Then:{' '}
                      {rule.actions.length > 0
                        ? `${rule.actions.length} action(s)`
                        : 'Add actions'}
                    </h3>
                    <p className='text-xs text-gray-600'>
                      Define what should happen when conditions are met
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel - Step Content */}
          <div className='flex-1 border-l border-[#CBD6E2] min-h-[calc(100vh-182px)] max-h-[calc(100vh-182px)] overflow-y-auto'>
            {renderStepContent()}

            {/* Navigation Buttons */}
            {(currentStep === 'conditions' || currentStep === 'actions') && (
              <div className='mt-6 pt-6 border-t border-gray-200 px-6 pb-6'>
                <div className='flex justify-between gap-3'>
                  <button
                    onClick={handleBack}
                    className={`w-1/2 px-4 py-2 text-[12px] font-bold text-[#425A76] rounded-[2px] transition-colors bg-gray-50 hover:bg-gray-100 cursor-pointer border border-[#CBD6E2] disabled:opacity-50 disabled:bg-gray-400 disabled:cursor-default
                `}
                  >
                    Back
                  </button>
                  {currentStep !== 'actions' && (
                    <button
                      onClick={handleNext}
                      disabled={isNextButtonDisabled()}
                      className={`w-1/2 px-4 py-2 text-[12px] font-bold text-[#425A76] rounded-[2px] transition-colors bg-gray-50 hover:bg-gray-100 border border-[#CBD6E2] disabled:opacity-60 cursor-pointer disabled:cursor-default
                `}
                    >
                      Next
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default RuleBuilder;
