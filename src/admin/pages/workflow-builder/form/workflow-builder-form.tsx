import React from 'react';
import { SettingIcon } from '../../../../assets';
import SingleSkeleton from '../../../../components/skeleton-component/singleskeleton';
import TextButton from '../../../../components/button/text-button';
import { useNavigate, useLocation } from 'react-router-dom';
import { WORKFLOW_BUILDER } from '../../../../routes';
import { RuleBuilder } from './components';
import { WorkflowProvider, useWorkflowContext } from './workflow-context';
import {
  useGetScopeList,
  useGetConditionList,
  useGetActionCategoryTypes,
} from '../../../service/workflow-builder/workflow-builder-service';

const WorkflowBuilderFormContent: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { rule, validateAndSave } = useWorkflowContext();

  const { data: scopeListData, isLoading: isLoadingScopeList } =
    useGetScopeList();

  const { data: conditionListData, isLoading: isLoadingConditionTypes } =
    useGetConditionList(
      {
        event_rid: rule.trigger?.id || '',
        status_rid: '',
      },
      !!rule.trigger?.id
    );

  const { data: actionCategoryData, isLoading: isLoadingActionCategories } =
    useGetActionCategoryTypes(
      {
        scope_rid: rule.trigger?.id || '',
        status_rid: '',
      },
      !!rule.trigger?.id
    );

  const goBack = () => {
    navigate(WORKFLOW_BUILDER);
  };

  const handleSubmit = () => {
    // First validate the workflow
    if (!validateAndSave()) {
      // Validation failed - user is now on conditions step with errors shown
      return;
    }

    // Transform rule to API payload format
    const apiPayload = {
      rule_id: rule.id,
      rule_name: rule.name,
      trigger_id: rule.trigger?.id,
      condition_type_id: rule.conditionType?.rid,
      conditions: rule.conditions.map((condition) => ({
        condition_id: condition.id,
        category_id: condition.category,
        field: condition.field,
        operator: condition.operator,
        value: condition.value,
        logical_operator: condition.logicalOperator,
      })),
      actions: rule.actions.map((action) => ({
        action_id: action.id,
        category_id: action.category,
      })),
      is_active: rule.isActive,
    };

    console.log('API Payload:', apiPayload);

    // TODO: Call create/update API here
    // if (isEditView) {
    //   await updateWorkflowRule(apiPayload);
    // } else {
    //   await createWorkflowRule(apiPayload);
    // }

    navigate(WORKFLOW_BUILDER);
  };

  const isEditView =
    location.pathname.split('/').slice(-2, -1)[0] === 'edit-rule';

  const isSaveEnabled =
    rule.name.trim() !== '' &&
    rule.trigger !== null &&
    rule.conditions.length > 0 &&
    rule.actions.length > 0 &&
    rule.conditionType !== null;

  const isInitialLoading = isLoadingScopeList;

  // Pass all fetched data to RuleBuilder
  const apiData = {
    scopeListData,
    conditionListData,
    actionCategoryData,
    isLoadingConditionTypes,
    isLoadingActionCategories,
  };

  return (
    <div className='flex flex-col h-full'>
      <div className='sticky top-0 z-10 flex flex-col bg-white border-b border-[#CBD6E2]'>
        <div className='flex items-center justify-between h-[50px] px-10 '>
          <div className='flex items-center w-[80%] max-w-[80%]'>
            <React.Suspense fallback={null}>
              <SettingIcon
                alt='setting-icon'
                className='h-7 w-7 p-0.5 rounded [&>path]:fill-[#fff] [&>path]:stroke-[#EA0084] bg-[#EA0084]'
              />
            </React.Suspense>
            <div className='w-[90%]'>
              {isInitialLoading ? (
                <div className='ml-2'>
                  <SingleSkeleton width={150} height={12} />
                </div>
              ) : (
                <div className='font-semibold text-[12px] leading-[20px] ml-2 mb-[-6px] text-[#7D98B6]'>
                  {`Workflow Builder ${isEditView ? `> ` : ''}`}
                </div>
              )}
              <h5 className='text-[16px] font-bold ml-2 mt-0.5 text-[#2D3E4F]'>
                {isEditView ? 'Edit Rule' : 'Create Rule'}
              </h5>
            </div>
          </div>
          <div className='flex gap-3'>
            <TextButton
              label='Save'
              loading={false}
              onClick={handleSubmit}
              disabled={!isSaveEnabled}
              sx={{
                width: '64px',
                minWidth: '64px',
                fontSize: '13px',
                fontWeight: 400,
              }}
            />
            <TextButton
              label='Cancel'
              onClick={goBack}
              disabled={false}
              sx={{
                width: '75px',
                minWidth: '75px',
                fontSize: '12px',
                fontWeight: 400,
              }}
            />
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className='flex-1'>
        <React.Suspense fallback={null}>
          <RuleBuilder apiData={apiData} isInitialLoading={isInitialLoading} />
        </React.Suspense>
      </div>
    </div>
  );
};

// Main component that provides the context
const WorkflowBuilderForm: React.FC = () => {
  // TODO: For edit mode, fetch existing rule data and pass as initialRule
  // const { ruleId } = useParams();
  // const { data: existingRule } = useGetWorkflowRule(ruleId);

  return (
    <WorkflowProvider>
      <WorkflowBuilderFormContent />
    </WorkflowProvider>
  );
};

export default WorkflowBuilderForm;
