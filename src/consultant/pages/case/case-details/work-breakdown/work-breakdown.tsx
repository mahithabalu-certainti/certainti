import { useEffect, useState } from 'react';
import { Board } from '../../../../../components/kanban-board/types';
import KanbanBoard from '../../../../../components/kanban-board/kanbanBoard';
import { ActionItemsIcon, ComingSoon } from '../../../../../assets';
import { SectionHeaderTab, SectionTabPanel } from '../../../../../components';
import SectionHeader from '../../../../../components/details-section/section-header';
import { ResourceTabs } from '../../../account-details-sidebar/sidebar-pages/resources/resources';
import { AllPermissions } from '../../../../../common-service';
import { useNavigate, useSearchParams } from 'react-router-dom';

const ConfigTabs: ResourceTabs[] = [
  {
    id: AllPermissions.ACCOUNT_ATTACHMENT_OVERVIEW,
    name: 'Overview',
    hide: false,
  },
  // {
  //   id: AllPermissions.ACCOUNT_ATTACHMENT_TIMELINE,
  //   name: 'Timeline',
  //   hide: false,
  //   disable: true,
  // },
];

const initialBoards: Board[] = [
  {
    id: 'case-setup',
    title: 'Case Setup',
    color: '#8B5CF6',
    tasks: [
      { id: '1', title: 'Create Case Team', completed: false },
      { id: '2', title: 'Add Projects', completed: false },
      { id: '3', title: 'Review Projects', completed: false },
    ],
  },
  {
    id: 'base-data',
    title: 'Base Data Gathering',
    color: '#EC4899',
    tasks: [
      { id: '4', title: 'Basic Info', completed: false },
      { id: '5', title: 'Point of contact', completed: false },
      { id: '6', title: 'Timesheet', completed: false },
      { id: '7', title: 'Financials', completed: false },
      { id: '8', title: 'Technical Details', completed: false },
      { id: '9', title: 'Project Resources', completed: false },
    ],
  },
  {
    id: 'extended-data',
    title: 'Extended Data Gathering',
    color: '#06B6D4',
    tasks: [
      { id: '10', title: 'Generate Survey', completed: false },
      { id: '11', title: 'Send Survey', completed: false },
      { id: '12', title: 'Survey Follow up', completed: false },
      { id: '13', title: 'Review Survey Response', completed: false },
      { id: '14', title: 'Schedule Deep Dive meeting', completed: false },
      { id: '15', title: 'Execute deep dive meeting', completed: false },
      {
        id: '16',
        title: 'Update deep dive meeting response',
        completed: false,
      },
    ],
  },
  {
    id: 'technical-summary',
    title: 'Technical Summary',
    color: '#F59E0B',
    tasks: [
      { id: '17', title: 'Generate Technical summary', completed: false },
      { id: '18', title: 'Review Technical summary', completed: false },
      { id: '19', title: 'Update Technical summary', completed: false },
      {
        id: '20',
        title: 'Approve and baseline technical summary',
        completed: false,
      },
    ],
  },
];

const WorkBreakDown = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const tabParam = searchParams.get('tab') || 'milestone';
  const [appliedFilters, setAppliedFilters] = useState<
    Record<string, string | number | boolean | string[]>
  >({});
  const [boards, setBoards] = useState<Board[]>(initialBoards);

  useEffect(() => {
    if (
      !searchParams.get('tab') &&
      searchParams.get('list') === 'workBreakdown'
    ) {
      searchParams.set('tab', 'milestone');
      navigate(`?${searchParams.toString()}`, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const headerButtons = [
    {
      label: 'Edit',
      variant: 'contained' as const,
      onClick: () => console.log('clicked'),
      hide: false,
      disabled: false,
      loading: false,
    },
  ];

  const getTitleIcon = () => {
    return <ActionItemsIcon alt='action-items-icon' />;
  };

  const tabs = [
    { label: 'Milestone', value: 'milestone' },
    { label: 'Case Task', value: 'case_task' },
  ];

  const handleTabChange = (value: string) => {
    searchParams.set('tab', value);
    // setSearchParams(searchParams);
    navigate(`?${searchParams.toString()}`, { replace: true });
  };

  return (
    <>
      <SectionTabPanel
        tabs={ConfigTabs}
        // filterMenu={filterFields}
        filterVisibility={false}
        showFilter={true}
        contextKey={`case`}
        appliedFilters={appliedFilters}
        setAppliedFilters={setAppliedFilters}
        setCurrentPage={() => 0}
        handleFilter={() => {}}
        handleSorting={() => {}}
        sortFilterCount={0}
        setSortFilterCount={() => {}}
        showRefresh={true}
        // onRefreshClick={onRefreshClick}
        // hideTabPanel={hideSection}
      />
      <SectionHeader
        title={'Action Items'}
        titleIcon={getTitleIcon()}
        buttons={headerButtons}
        count={0}
        showItemCount={false}
        hideSection={false}
      />
      <SectionHeaderTab
        tabs={tabs}
        onTabChange={handleTabChange}
        defaultValue={tabParam}
      />

      <div className='border border-t-0 border-[#CBD6E2]'>
        {tabParam === 'milestone' && (
          <KanbanBoard
            boards={boards}
            onBoardsChange={setBoards}
            config={{
              allowCreateBoard: true,
              allowDeleteBoard: false,
              allowSwapBoards: false,
              allowCreateTask: true,
              allowTaskMovement: true,
              allowTaskDelete: false,
            }}
          />
        )}
        {tabParam === 'case_task' && (
          <div className='flex items-center justify-center h-full'>
            <ComingSoon alt='comingSoon' />
          </div>
        )}
      </div>
    </>
  );
};

export default WorkBreakDown;
