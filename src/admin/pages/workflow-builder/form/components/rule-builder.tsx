import React, { useState } from 'react';
import { DeleteIcon, EditIcon } from '../../../../../assets';
import {
  ActionManager,
  ConditionManager,
  ConnectorLine,
  PageSkeleton,
  TriggerManager,
} from '.';
import { Condition, Rule, Trigger, getDynamicSvgIcon } from '../helper';
import { useRuleBuilderStepper } from '../rule-builder-stepper';
import { useGetScopeList } from '../../../../service/workflow-builder/workflow-builder-service';

interface RuleBuilderProps {
  rule: Rule;
  setRule: React.Dispatch<React.SetStateAction<Rule>>;
  ruleId?: string;
}

const RuleBuilder: React.FC<RuleBuilderProps> = ({ rule, setRule, ruleId }) => {
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const {
    currentStep,
    selectedTriggerId,
    goToTriggerStep,
    goToConditionsStep,
    goToActionsStep,
    canProceedToConditions,
    canProceedToActions,
    clearTriggerData,
  } = useRuleBuilderStepper({ ruleId });

  // Fetch scope list (categories) - only load once
  const { data: scopeListData, isLoading: isLoadingScopes } = useGetScopeList();

  const handleSelectTrigger = (trigger: Trigger) => {
    // Check if we're changing to a different trigger
    const isChangingTrigger =
      selectedTriggerId && selectedTriggerId !== trigger.id;

    if (isChangingTrigger) {
      // Clear all conditions and actions when changing triggers
      setRule((prev) => ({
        ...prev,
        trigger: trigger,
        conditions: [], // Clear all conditions
        actions: [], // Clear all actions
        componentType: null,
      }));
    } else {
      // First time selecting a trigger
      setRule((prev) => ({
        ...prev,
        trigger: trigger,
      }));
    }

    // Navigate to conditions step
    goToConditionsStep(trigger.id);
  };

  const handleRemoveTrigger = () => {
    // Clear all data
    setRule((prev) => ({
      ...prev,
      trigger: null,
      conditions: [],
      actions: [],
      componentType: null,
    }));

    // Use clearTriggerData to completely reset (including trigger selection)
    clearTriggerData();
  };

  // Handle adding a new condition
  const handleAddCondition = (condition: Condition) => {
    setRule((prev) => ({
      ...prev,
      conditions: [
        ...prev.conditions,
        {
          ...condition,
          logicalOperator: prev.conditions.length === 0 ? undefined : 'AND',
        },
      ],
    }));
  };

  // Handle updating an existing condition
  const handleUpdateCondition = (
    conditionId: string,
    updatedCondition: Condition
  ) => {
    setRule((prev) => ({
      ...prev,
      conditions: prev.conditions.map((cond) =>
        cond.id === conditionId ? updatedCondition : cond
      ),
    }));
  };

  // Handle deleting a condition
  const handleDeleteCondition = (conditionId: string) => {
    setRule((prev) => ({
      ...prev,
      conditions: prev.conditions.filter((c) => c.id !== conditionId),
    }));
  };

  const handleLogicalOperatorChange = (
    conditionId: string,
    operator: 'AND' | 'OR'
  ) => {
    setRule((prev) => ({
      ...prev,
      conditions: prev.conditions.map((condition) =>
        condition.id === conditionId
          ? { ...condition, logicalOperator: operator }
          : condition
      ),
    }));
  };

  const handleBack = () => {
    switch (currentStep) {
      case 'conditions':
        goToTriggerStep();
        break;
      case 'actions':
        goToConditionsStep(selectedTriggerId!);
        break;
      default:
        goToTriggerStep();
    }
  };

  const handleNext = () => {
    switch (currentStep) {
      case 'trigger':
        if (canProceedToConditions && selectedTriggerId) {
          goToConditionsStep(selectedTriggerId);
        }
        break;
      case 'conditions':
        if (canProceedToActions(rule.conditions.length)) {
          goToActionsStep();
        }
        break;
      case 'actions':
        // Handle rule submission
        console.log('Submitting rule:', rule);
        break;
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 'trigger':
        return (
          <TriggerManager
            scopeListData={scopeListData}
            onSelect={handleSelectTrigger}
            selectedTriggerId={selectedTriggerId}
          />
        );

      case 'conditions':
        return (
          <div className='p-6 relative'>
            <div className='flex items-start justify-between gap-3 mb-3'>
              <div className='flex items-center gap-2'>
                <div className='bg-blue-100 p-1 rounded-md flex items-center justify-center w-8 h-8 flex-shrink-0'>
                  {getDynamicSvgIcon('condition')}
                </div>
                <div className='text-lg font-semibold text-[#425A76] mb-1 capitalize'>
                  {rule.trigger?.name || 'Configure Conditions'}
                </div>
              </div>
              <button
                onClick={handleRemoveTrigger}
                className='h-8 w-8 flex items-center justify-center hover:bg-gray-100 rounded-full transition-colors cursor-pointer'
              >
                <DeleteIcon className='w-4 h-4' />
              </button>
            </div>

            <div className='text-sm text-[#425A76] mb-6'>
              {rule.trigger?.description}
            </div>

            <ConditionManager
              rule={rule}
              setRule={setRule}
              conditions={rule.conditions}
              onAddCondition={handleAddCondition}
              onUpdateCondition={handleUpdateCondition}
              onDeleteCondition={handleDeleteCondition}
              onLogicalOperatorChange={handleLogicalOperatorChange}
            />
          </div>
        );

      case 'actions':
        return (
          <div className='relative'>
            <ActionManager
              rule={rule}
              actions={rule.actions}
              onAddAction={(action) => {
                setRule((prev) => ({
                  ...prev,
                  actions: [...prev.actions, action],
                }));
              }}
              onDeleteAction={(actionId) => {
                setRule((prev) => ({
                  ...prev,
                  actions: prev.actions.filter((a) => a.id !== actionId),
                }));
              }}
            />
          </div>
        );

      default:
        return (
          <div className='p-6 text-center py-12'>
            <p className='text-gray-500 text-sm'>
              Select a trigger to configure your rule
            </p>
          </div>
        );
    }
  };

  const isNextButtonDisabled = () => {
    switch (currentStep) {
      case 'trigger':
        return !canProceedToConditions;
      case 'conditions':
        return !canProceedToActions(rule.conditions.length);
      case 'actions':
        return rule.actions.length === 0;
      default:
        return true;
    }
  };

  const isLoading = isLoadingScopes || false;

  return (
    <div>
      <div className='flex items-center justify-between border-b border-[#CBD6E2] h-[50px] px-10'>
        <div className='flex items-center gap-3 group'>
          {isEditing ? (
            <input
              type='text'
              value={rule.name}
              autoFocus
              onChange={(e) =>
                setRule((prev) => ({ ...prev, name: e.target.value }))
              }
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
              <EditIcon
                className='w-3.5 h-3.5 cursor-pointer transition-opacity duration-200'
                style={{
                  filter:
                    'brightness(0) saturate(100%) invert(16%) sepia(14%) saturate(749%) hue-rotate(169deg) brightness(93%) contrast(86%)',
                }}
                onClick={() => setIsEditing(true)}
              />
            </div>
          )}
          <span className='px-1 py-0.5 bg-purple-100 text-purple-700 text-xs font-medium rounded'>
            NEW
          </span>
        </div>
      </div>
      {isLoading ? (
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
                    : selectedTriggerId
                      ? 'border border-[#98fb98] bg-[#E0FEE0]'
                      : 'border-gray-300 bg-white'
                }`}
                onClick={() => currentStep !== 'trigger' && goToTriggerStep()}
              >
                <div className='flex items-start gap-3'>
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 border ${
                      selectedTriggerId
                        ? 'bg-green-200 border-green-500'
                        : 'bg-blue-200 border border-blue-500'
                    }`}
                  >
                    <span className='text-[#425A76]'>⏻</span>
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
                  {selectedTriggerId && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveTrigger();
                      }}
                      className='h-8 w-8 flex items-center justify-center hover:bg-gray-100 rounded-full transition-colors cursor-pointer'
                    >
                      <DeleteIcon className='w-4 h-4' />
                    </button>
                  )}
                </div>
              </div>

              <ConnectorLine
                active={Boolean(
                  selectedTriggerId &&
                    currentStep === 'conditions' &&
                    !rule.conditions.length
                )}
              />

              {/* Conditions Block */}
              <div
                className={`border rounded-lg p-4 ${
                  selectedTriggerId && currentStep !== 'conditions'
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
                  selectedTriggerId &&
                  currentStep !== 'conditions' &&
                  goToConditionsStep(selectedTriggerId)
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
                                <div className='flex flex-col items-center w-[20%]'>
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
                        {rule.conditions.length > 4 && (
                          <div className='text-xs text-gray-500'>
                            +{rule.conditions.length - 4} more conditions
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
                  rule.conditions.length > 0 && currentStep !== 'actions'
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
                  rule.conditions.length > 0 &&
                  currentStep !== 'actions' &&
                  goToActionsStep()
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
                        currentStep === 'actions'
                          ? 'text-blue-700'
                          : rule.actions.length > 0
                            ? 'text-yellow-700'
                            : 'text-gray-700'
                      }`}
                    >
                      ⚡
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
