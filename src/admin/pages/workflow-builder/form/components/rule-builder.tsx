import React, { useState } from 'react';
import { ActionTypeEnum } from '../helper';

import { DeleteIcon, ErrorInfoIcon } from '../../../../../assets';
import {
  ActionManager,
  ActionTemplate,
  ConditionManager,
  ConnectorLine,
  PageSkeleton,
  TriggerManager,
} from '.';
import {
  ConditionTypeEnum,
  getCategoryColor,
  getDynamicSvgIcon,
  Trigger,
} from '../helper';
import { useWorkflowContext } from '../workflow-context';
import {
  ActionCategoryTypeResponse,
  ConditionListResponse,
  ScopeListResponse,
} from '../../../../types';
import { Tooltip } from '@mui/material';
import SingleSkeleton from '../../../../../components/skeleton-component/singleskeleton';
import TextButton from '../../../../../components/button/text-button';

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
  const isEditView = location.pathname.split('/').slice(-2, -1)[0] === 'edit';
  const [isCategorySelectorShowing, setIsCategorySelectorShowing] =
    useState<boolean>(false);
  const {
    rule,
    currentStep,
    selectTrigger,
    removeTrigger,
    updateRuleName,
    goToStep,
    canProceedToConditions,
    canProceedToActions,
    canProceedToActionTemplate,
    ruleNameError,
    showRuleNameError,
    validateAndSave,
  } = useWorkflowContext();

  // Check if we should show the Action Template step
  const shouldShowActionTemplate = rule.actions.some(
    (action) =>
      action.name === ActionTypeEnum.InApp ||
      action.name === ActionTypeEnum.Email
  );

  const handleSelectTrigger = (trigger: Trigger) => {
    selectTrigger(trigger);
  };

  const handleRemoveTrigger = () => {
    removeTrigger();
  };

  const handleBack = () => {
    if (currentStep === 'conditions') {
      goToStep('trigger');
    } else if (currentStep === 'actions') {
      goToStep('conditions');
    } else if (currentStep === 'action-template') {
      goToStep('actions');
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
      case 'actions':
        if (shouldShowActionTemplate && canProceedToActionTemplate) {
          goToStep('action-template');
        } else if (!shouldShowActionTemplate) {
          // If no template needed, save directly
          validateAndSave();
        }
        break;
      case 'action-template':
        validateAndSave();
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
          <div className='relative'>
            <div className='flex items-start justify-between gap-3 px-6 pt-6'>
              <div className='flex items-center gap-2'>
                <div
                  className='p-1 rounded-md flex items-center justify-center w-8 h-8 flex-shrink-0'
                  style={{
                    backgroundColor:
                      getCategoryColor(rule.trigger?.category || 'trigger') ||
                      '#E5E7EB',
                  }}
                >
                  {getDynamicSvgIcon(rule.trigger?.name || 'trigger')}
                </div>
                <div className='text-lg font-semibold text-[#425A76] mb-1 capitalize'>
                  {rule.trigger?.name || 'Configure Conditions'}
                </div>
              </div>
              {!isEditView && (
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
                    className='h-8 w-8 mr-2 flex items-center justify-center hover:bg-gray-100 rounded-full transition-colors cursor-pointer'
                  >
                    <React.Suspense fallback={null}>
                      <DeleteIcon className='w-4 h-4' />
                    </React.Suspense>
                  </button>
                </Tooltip>
              )}
            </div>

            <div className='text-sm text-[#425A76] px-6 py-2 border-b border-[#CBD6E2]'>
              {rule.trigger?.description}
            </div>

            <div className='min-h-[calc(100vh-320px)]  max-h-[calc(100vh-320px)] overflow-y-auto p-6'>
              <ConditionManager
                conditionListData={apiData.conditionListData}
                isLoadingConditionTypes={apiData.isLoadingConditionTypes}
                onCategorySelectorChange={setIsCategorySelectorShowing}
              />
            </div>
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

        {/* Action Template Step - Always mounted, visibility controlled by CSS */}
        {shouldShowActionTemplate && (
          <div
            style={{
              display: currentStep === 'action-template' ? 'block' : 'none',
            }}
          >
            <div className='relative min-h-[calc(100vh-238px)] max-h-[calc(100vh-238px)]'>
              <ActionTemplate />
            </div>
          </div>
        )}
      </>
    );
  };

  const isNextButtonDisabled = () => {
    switch (currentStep) {
      case 'trigger':
        return !canProceedToConditions;
      case 'conditions':
        // Disable if conditions are incomplete OR if category selector is showing
        return !canProceedToActions || isCategorySelectorShowing;
      case 'actions':
        // If templates are needed, check canProceedToActionTemplate, otherwise check if actions exist
        return shouldShowActionTemplate
          ? !canProceedToActionTemplate
          : rule.actions.length === 0;
      case 'action-template':
        return !canProceedToActionTemplate; // Disable if templates are not fully configured
      default:
        return true;
    }
  };

  const isButtonDisabled = isNextButtonDisabled();

  return (
    <div>
      <div className='flex items-center justify-between border-b border-[#CBD6E2] h-[50px] px-10'>
        {isInitialLoading ? (
          <SingleSkeleton width={160} height={22} />
        ) : (
          <div className='flex items-center gap-3'>
            <div className='relative flex items-center gap-2'>
              <label
                className='text-[13px] text-[#2D3E4F] font-semibold leading-[21px] tracking-[0]'
                htmlFor='rule_name'
              >
                Rule Name <span className='text-red-500'>*</span> :
              </label>
              <input
                type='text'
                id='rule_name'
                name='rule_name'
                value={rule.name}
                onChange={(e) => updateRuleName(e.target.value)}
                placeholder='Enter Rule Name'
                autoComplete='off'
                className={`placeholder-custom-color placeholder-[#7D98B6] truncate overflow-hidden text-ellipsis whitespace-nowrap outline-none focus:border-b focus:border-b-blue-400 w-[250px] text-[13px] font-medium text-[#425A76] px-1 h-[24px] border-0 border-b ${
                  showRuleNameError && ruleNameError
                    ? 'border-b-red-500'
                    : 'border-b-[#CBD6E2]'
                }`}
                style={{
                  paddingRight:
                    showRuleNameError && ruleNameError ? '24px' : '4px',
                }}
              />
              {showRuleNameError && ruleNameError && (
                <Tooltip
                  title={ruleNameError}
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
                  <div className='absolute right-2 top-2/5 flex items-center cursor-pointer'>
                    <React.Suspense fallback={null}>
                      <ErrorInfoIcon className='w-3.5 h-3 text-red-500' />
                    </React.Suspense>
                  </div>
                </Tooltip>
              )}
            </div>
            {/* {!isEditView && (
              <span className='px-1 py-0.5 bg-purple-100 text-purple-700 text-xs font-medium rounded'>
                NEW
              </span>
            )} */}
          </div>
        )}
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
                    <svg viewBox='0 0 24 24' className='w-4 h-4' fill='none'>
                      <line
                        x1='12'
                        y1='3'
                        x2='12'
                        y2='12'
                        stroke='currentColor'
                        strokeWidth='2'
                        strokeLinecap='round'
                        strokeLinejoin='round'
                      />
                      <path
                        d='M17.66 7.34a8 8 0 1 1-11.32 0'
                        stroke='currentColor'
                        strokeWidth='2'
                        strokeLinecap='round'
                        strokeLinejoin='round'
                      />
                    </svg>
                  </div>
                  <div className='flex-1'>
                    <h3 className='text-sm font-semibold text-gray-900 mb-1'>
                      When:{' '}
                      {rule.trigger ? (
                        <span className='capitalize'>{rule.trigger.name}</span>
                      ) : (
                        'Add trigger'
                      )}
                    </h3>
                    <p className='text-xs text-gray-600'>
                      {rule.trigger
                        ? rule.trigger.description
                        : 'An event that triggers the rule to run'}
                    </p>
                  </div>
                  {rule.trigger && !isEditView && (
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
                    : rule.conditions.length > 0 ||
                        rule.conditionType?.condition_type?.toLowerCase() ===
                          ConditionTypeEnum.then
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
                      rule.conditions.length === 0 &&
                      rule.conditionType?.condition_type?.toLowerCase() !==
                        ConditionTypeEnum.then
                        ? 'border-blue-500 bg-blue-200'
                        : rule.conditions.length > 0 ||
                            rule.conditionType?.condition_type?.toLowerCase() ===
                              ConditionTypeEnum.then
                          ? 'bg-[#FFF3B3] border-[#FFD700]'
                          : 'border-gray-300 bg-gray-200'
                    }`}
                  >
                    <span
                      className={`text-[16px] ${
                        currentStep === 'conditions' &&
                        rule.conditions.length === 0 &&
                        rule.conditionType?.condition_type?.toLowerCase() !==
                          ConditionTypeEnum.then
                          ? 'text-blue-700'
                          : rule.conditions.length > 0 ||
                              rule.conditionType?.condition_type?.toLowerCase() ===
                                ConditionTypeEnum.then
                            ? 'text-amber-700'
                            : 'text-[#425A76]'
                      }`}
                    >
                      ≈
                    </span>
                  </div>
                  <div className='flex-1'>
                    <h3 className='text-sm font-semibold text-gray-900 mb-1'>
                      {rule.conditionType?.condition_type
                        ? `${rule.conditionType?.condition_type}: `
                        : ''}
                      {rule.conditions.length > 0
                        ? `${rule.conditions.length} condition(s)`
                        : rule.conditionType?.condition_type?.toLowerCase() ===
                            ConditionTypeEnum.then
                          ? 'No conditions (Optional)'
                          : 'Add conditions'}
                    </h3>
                    <p className='text-xs text-gray-600'>
                      {rule.conditions.length > 0
                        ? 'Conditions that must be met for the rule to execute'
                        : rule.conditionType?.condition_type?.toLowerCase() ===
                            ConditionTypeEnum.then
                          ? 'Conditions are optional for THEN type'
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
                  (currentStep === 'actions' ||
                    currentStep === 'action-template') &&
                  !rule.actions.length
                }
              />

              {/* Actions Block */}
              <div
                className={`border rounded-lg p-4 ${
                  canProceedToActions &&
                  currentStep !== 'actions' &&
                  !isCategorySelectorShowing
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
                  !isCategorySelectorShowing &&
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

              {shouldShowActionTemplate && (
                <>
                  <ConnectorLine
                    active={
                      rule.actions.length > 0 &&
                      currentStep === 'action-template' &&
                      rule.actions.some(
                        (action) => !rule.actionTemplates?.[action.name] // Use action.name
                      )
                    }
                  />

                  {/* Action Template Block */}
                  <div
                    className={`border rounded-lg p-4 ${
                      canProceedToActionTemplate &&
                      currentStep !== 'action-template'
                        ? 'cursor-pointer'
                        : 'cursor-default'
                    } transition-all ${
                      currentStep === 'action-template'
                        ? 'border-blue-500 bg-blue-50'
                        : rule.actions.length > 0 &&
                            rule.actions.every(
                              (action) => rule.actionTemplates?.[action.name] // Use action.name
                            )
                          ? 'border border-[#d467d4] bg-[#d446d41f]'
                          : 'border-gray-300 bg-white'
                    }`}
                    onClick={() =>
                      canProceedToActionTemplate &&
                      currentStep !== 'action-template' &&
                      goToStep('action-template')
                    }
                  >
                    <div className='flex items-start gap-3'>
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 border ${
                          currentStep === 'action-template' &&
                          rule.actions.some(
                            (action) => !rule.actionTemplates?.[action.name] // Use action.name
                          )
                            ? 'border-blue-500 bg-blue-200'
                            : rule.actions.length > 0 &&
                                rule.actions.every(
                                  (action) =>
                                    rule.actionTemplates?.[action.name] // Use action.name
                                )
                              ? 'border border-[#d467d4] bg-[#dda0dd1f]'
                              : 'bg-gray-200 border-gray-300'
                        }`}
                      >
                        <span
                          className={`text-sm ${
                            currentStep === 'action-template' &&
                            rule.actions.some(
                              (action) => !rule.actionTemplates?.[action.name] // Use action.name
                            )
                              ? 'text-blue-700'
                              : rule.actions.length > 0 &&
                                  rule.actions.every(
                                    (action) =>
                                      rule.actionTemplates?.[action.name] // Use action.name
                                  )
                                ? 'text-[#d720d7]'
                                : 'text-gray-700'
                          }`}
                        >
                          🛠
                        </span>
                      </div>
                      <div className='flex-1'>
                        <h3 className='text-sm font-semibold text-gray-900 mb-1'>
                          Template:{' '}
                          {rule.actionTemplates &&
                          Object.keys(rule.actionTemplates).length > 0
                            ? `${Object.keys(rule.actionTemplates).length}/${rule.actions.length} Configured`
                            : 'Configure Templates'}
                        </h3>
                        <p className='text-xs text-gray-600'>
                          Configure template for selected action
                        </p>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Right Panel - Step Content */}
          <div className='flex-1 border-l border-[#CBD6E2] min-h-[calc(100vh-182px)] max-h-[calc(100vh-182px)] overflow-y-auto'>
            {renderStepContent()}

            {/* Navigation Buttons */}
            <div className='border-t border-gray-200 px-6 py-4'>
              <div className='flex justify-end items-center gap-3'>
                {/* Back Button - Show only on conditions and actions steps */}
                {currentStep !== 'trigger' && (
                  <TextButton
                    label={
                      currentStep === 'conditions'
                        ? 'Back to Trigger'
                        : currentStep === 'actions'
                          ? 'Back to Conditions'
                          : 'Back to Actions'
                    }
                    onClick={handleBack}
                    sx={{
                      width: '125px',
                      minWidth: '125px',
                      fontSize: '12px',
                      fontWeight: 400,
                    }}
                  />
                )}

                {/* Next Button - Show on trigger, conditions and actions steps */}
                {currentStep !== 'action-template' &&
                  !(currentStep === 'actions' && !shouldShowActionTemplate) && (
                    <TextButton
                      label={
                        currentStep === 'trigger'
                          ? 'Next to Conditions'
                          : currentStep === 'conditions'
                            ? 'Next to Actions'
                            : currentStep === 'actions' &&
                                shouldShowActionTemplate
                              ? 'Next to Template'
                              : 'Next'
                      }
                      onClick={handleNext}
                      disabled={isButtonDisabled}
                      sx={{
                        width: '135px',
                        minWidth: '135px',
                        fontSize: '12px',
                        fontWeight: 400,
                      }}
                    />
                  )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RuleBuilder;
