import React, { useState } from 'react';
import { RefreshIcon, SettingIcon } from '../../../../assets';
import TextButton from '../../../../components/button/text-button';
import { WORKFLOW_BUILDER_CREATE } from '../../../../routes';
import { useNavigate } from 'react-router-dom';
import { WorkflowTable } from './table/workflow-table';

interface WorkflowTableParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

const BUTTON_STYLES = {
  height: '24px',
  fontSize: '13px',
};

const WorkflowBuilder: React.FC = () => {
  const navigate = useNavigate();
  const [tableParams, setTableParams] = useState<WorkflowTableParams>({
    page: 1,
    limit: 100,
    sortBy: 'name',
    sortOrder: 'ASC',
  });
  const [refreshWorkflowTrigger, setRefreshWorkflowTrigger] =
    useState<number>();
  const [columnAnchorEl, setColumnAnchorEl] =
    React.useState<HTMLButtonElement | null>(null);
  const [, setSelectedWorkflowIds] = useState<string[]>([]);

  const isModalOpen = Boolean(columnAnchorEl);
  const modalId = isModalOpen
    ? 'workflow-column-visibility-popover'
    : undefined;

  const onRefreshClick = () => {
    setRefreshWorkflowTrigger(Date.now());
  };

  const handleSelectionChange = (selectedIds: string[]) => {
    setSelectedWorkflowIds(selectedIds);
  };

  const workflowActionButtons = [
    { label: 'Enable Rules', width: '104px', hide: false },
    { label: 'Disable Rules', width: '116px', hide: false },
    { label: 'Duplicate', width: '118px', hide: false },
    { label: 'Delete', width: '58px', hide: false },
  ];

  const handleAction = (action: string) => {
    switch (action) {
      case 'Enable Rules':
        console.log('Enable Rules clicked');
        break;
      case 'Disable Rules':
        console.log('Disable Rules clicked');
        break;
      case 'Duplicate':
        console.log('Duplicate clicked');
        break;
      case 'Delete':
        console.log('Delete clicked');
        break;
      default:
        break;
    }
  };

  const handleColumnVisibility = (
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    setColumnAnchorEl(event.currentTarget);
  };

  return (
    <div className='flex flex-col w-full h-full'>
      <div className='flex items-center justify-between w-full h-[55px] min-h-[50px] border-b border-[#CBD6E2] px-4'>
        <div className='flex h-[33px]'>
          <div className='flex items-center justify-center'>
            <SettingIcon
              alt='setting-icon'
              className='h-7 w-7 p-0.5 rounded [&>path]:fill-[#fff] [&>path]:stroke-[#EA0084] bg-[#EA0084]'
            />
            <div className='flex flex-col mx-2.5 pb-1'>
              <div className='font-semibold text-[#7D98B6] text-[12px] pt-1'>
                Workflow Builder
              </div>
              <div className='font-bold text-[16px] text-[#2D3E4F] -mt-1'>
                Workflow Management
              </div>
            </div>
          </div>
        </div>
        <div className='flex gap-3 justify-center items-center'>
          <button
            className='flex border border-[#CBD6E2] w-[24px] h-[23px] bg-[linear-gradient(180deg,_#FFFFFF_0%,_#E4E6E7_100%)] justify-center items-center cursor-pointer'
            onClick={onRefreshClick}
          >
            <RefreshIcon alt='refresh-icon' className='h-4' />
          </button>
          <TextButton
            label='Create Rule'
            onClick={() => navigate(WORKFLOW_BUILDER_CREATE)}
            sx={{
              ...BUTTON_STYLES,
              width: '91px',
              minWidth: '91px',
              maxWidth: '91px',
            }}
          />
        </div>
      </div>

      <div className='flex items-center justify-between h-[42px] min-h-[42px] max-h-[42px] px-4'>
        <div className='font-bold text-[14px] leading-[32px] text-[#2D3E4F]'>
          All Workflow Rules
        </div>
        <div className='flex items-center gap-1'>
          <button
            aria-describedby={modalId}
            className={`w-[120px] h-[24px] text-[13px] text-[#425A76] cursor-pointer flex items-center justify-center gap-1 rounded-[2px] relative border border-[#CBD6E2] px-0 py-0 normal-case ${isModalOpen ? 'bg-[#F3F3F3]' : 'bg-[linear-gradient(180deg,_#FFFFFF_0%,_#E4E6E7_100%)]'} hover:text-[#425A76] transition-colors duration-150`}
            style={{
              boxShadow: '0px 1px 2px 0px rgba(42, 54, 71, 0.05)',
            }}
            onClick={handleColumnVisibility}
          >
            Show/Hide Fields
          </button>
          {workflowActionButtons.map((button) => {
            if (button.hide) return null;
            return (
              <TextButton
                key={button.label}
                label={button.label}
                onClick={() => handleAction(button.label)}
                sx={{
                  ...BUTTON_STYLES,
                  width: button.width,
                  minWidth: button.width,
                  maxWidth: button.width,
                  display: 'none',
                }}
              />
            );
          })}
        </div>
      </div>

      <div className='border border-[#CBD6E2]'>
        <WorkflowTable
          tableParams={tableParams}
          setTableParams={setTableParams}
          onSelectionChange={handleSelectionChange}
          columnAnchorEl={columnAnchorEl}
          setColumnAnchorEl={setColumnAnchorEl}
          refreshWorkflowTrigger={refreshWorkflowTrigger}
        />
      </div>
    </div>
  );
};

export default WorkflowBuilder;
