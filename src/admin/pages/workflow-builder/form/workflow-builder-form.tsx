import React, { useState } from 'react';
import { SettingIcon } from '../../../../assets';
import SingleSkeleton from '../../../../components/skeleton-component/singleskeleton';
import TextButton from '../../../../components/button/text-button';
import { useNavigate } from 'react-router-dom';
import { WORKFLOW_BUILDER } from '../../../../routes';
import { RuleBuilder } from './components';
import { Rule } from './helper';

const WorkflowBuilderForm: React.FC = () => {
  const navigate = useNavigate();
  const [rule, setRule] = useState<Rule>({
    id: crypto.randomUUID(),
    name: 'Untitled rule',
    trigger: null,
    conditions: [],
    actions: [],
    conditionType: null,
    isActive: false,
  });

  const goBack = () => {
    navigate(WORKFLOW_BUILDER);
  };

  const handleSubmit = () => {
    console.log('API Payload:', rule);
    navigate(WORKFLOW_BUILDER);
  };

  const isLoading = false;
  const isEditView =
    location.pathname.split('/').slice(-2, -1)[0] === 'edit-rule';

  const isSaveEnabled =
    rule.name.trim() !== '' &&
    rule.trigger !== null &&
    rule.conditions.length > 0 &&
    rule.actions.length > 0 &&
    rule.conditionType !== null;

  return (
    <div className='flex flex-col h-full'>
      <div className='sticky top-0 z-10 flex flex-col bg-white border-b border-[#CBD6E2]'>
        <div className='flex items-center justify-between h-[50px] px-10 '>
          <div className='flex items-center w-[80%] max-w-[80%]'>
            <SettingIcon
              alt='setting-icon'
              className='h-7 w-7 p-0.5 rounded [&>path]:fill-[#fff] [&>path]:stroke-[#EA0084] bg-[#EA0084]'
            />
            <div className='w-[90%]'>
              {isLoading ? (
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
          <RuleBuilder rule={rule} setRule={setRule} />
        </React.Suspense>
      </div>
    </div>
  );
};

export default WorkflowBuilderForm;
