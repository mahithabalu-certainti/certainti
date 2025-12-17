import React from 'react';
import { WorkflowIcon } from '../../../../assets';
import SingleSkeleton from '../../../../components/skeleton-component/singleskeleton';
import TextButton from '../../../../components/button/text-button';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { WORKFLOW_BUILDER } from '../../../../routes';
import { RuleBuilder } from './components';
import { WorkflowProvider, useWorkflowContext } from './workflow-context';
import { transformRuleToPayload, transformApiResponseToRule } from './helper';
import {
  useGetScopeList,
  useGetConditionList,
  useGetActionCategoryTypes,
  useCreateRule,
  useGetRuleDetails,
} from '../../../service/workflow-builder/workflow-builder-service';
import { useSelector } from 'react-redux';
import { RootState } from '../../../../store/store';

interface WorkflowBuilderProps {
  isLoadingRuleDetails: boolean;
}

const WorkflowBuilderFormContent: React.FC<WorkflowBuilderProps> = ({
  isLoadingRuleDetails,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { rule, validateAndSave } = useWorkflowContext();

  const isEditView = location.pathname.split('/').slice(-2, -1)[0] === 'edit';
  const { userId } = useSelector((state: RootState) => state.auth);

  const createRule = useCreateRule();

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
        scope_rid: rule.trigger?.category || '',
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

    const apiPayload = transformRuleToPayload(rule, userId || '');

    console.log('API Payload:', apiPayload);

    // Call create rule API
    createRule.mutate(apiPayload, {
      onSuccess: (response) => {
        console.log('Rule created successfully:', response);
        navigate(WORKFLOW_BUILDER);
      },
      onError: (error) => {
        console.error('Error creating rule:', error);
        // TODO: Show error toast/notification to user
      },
    });
  };

  const isSaveEnabled =
    rule.name.trim() !== '' &&
    rule.trigger !== null &&
    rule.conditions.length > 0 &&
    rule.actions.length > 0 &&
    rule.conditionType !== null;

  const isInitialLoading = isLoadingScopeList || isLoadingRuleDetails;

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
              <WorkflowIcon
                alt='workflow-icon'
                className='h-7 w-7 p-1 rounded bg-[#3992ec]'
              />
            </React.Suspense>
            <div className='w-[90%]'>
              {isInitialLoading ? (
                <div className='ml-2'>
                  <SingleSkeleton width={150} height={12} />
                </div>
              ) : (
                <div className='font-semibold text-[12px] leading-[20px] ml-2 mb-[-6px] text-[#7D98B6]'>
                  {`Workflow Builder ${isEditView ? `> ${rule.r_number || ''}` : ''}`}
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
              loading={createRule.isPending}
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
              disabled={createRule.isPending}
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
  const { ruleId } = useParams();
  const location = useLocation();

  const isEditView = location.pathname.split('/').slice(-2, -1)[0] === 'edit';

  // Fetch existing rule data for edit mode
  const { data: ruleDetailsResponse, isLoading: isLoadingRuleDetails } =
    useGetRuleDetails(ruleId || '', isEditView);

  // Transform API response to Rule format
  const initialRule = ruleDetailsResponse
    ? transformApiResponseToRule(ruleDetailsResponse)
    : undefined;

  return (
    <WorkflowProvider initialRule={initialRule}>
      <WorkflowBuilderFormContent isLoadingRuleDetails={isLoadingRuleDetails} />
    </WorkflowProvider>
  );
};

export default WorkflowBuilderForm;
