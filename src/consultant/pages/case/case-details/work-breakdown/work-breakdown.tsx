import { useEffect, useState } from 'react';
import { CaseIcon, ComingSoon } from '../../../../../assets';
import { SectionHeaderTab, SectionTabPanel } from '../../../../../components';
import SectionHeader from '../../../../../components/details-section/section-header';
import { ResourceTabs } from '../../../account-details-sidebar/sidebar-pages/resources/resources';
import { AllPermissions } from '../../../../../common-service';
import { useNavigate, useSearchParams } from 'react-router-dom';
import KanbanBoard from '../../../../../components/kanban-board/kanban-board';
import {
  mockUserData,
  mockKanbanData,
  mockTaskDetails,
} from '../../../../../components/kanban-board/mock-data';

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

const WorkBreakDown = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const tabParam = searchParams.get('tab') || 'milestone';
  const [appliedFilters, setAppliedFilters] = useState<
    Record<string, string | number | boolean | string[]>
  >({});
  const statusData = [
    { id: '1', name: 'To Do', color: '#gray' },
    { id: '2', name: 'In Progress', color: '#blue' },
    { id: '3', name: 'Done', color: '#green' },
  ];

  const priorityData = [
    { id: '1', name: 'Low', color: '#gray' },
    { id: '2', name: 'Medium', color: '#yellow' },
    { id: '3', name: 'High', color: '#red' },
  ];

  const tagData = [
    { id: '1', name: 'Bug', color: '#red' },
    { id: '2', name: 'Feature', color: '#blue' },
    { id: '3', name: 'Enhancement', color: '#green' },
    { id: '4', name: 'Design', color: '#purple' },
    { id: '5', name: 'UI/UX', color: '#pink' },
    { id: '6', name: 'Development', color: '#orange' },
    { id: '7', name: 'Setup', color: '#teal' },
    { id: '8', name: 'Backend', color: '#indigo' },
    { id: '9', name: 'Security', color: '#red' },
    { id: '10', name: 'Frontend', color: '#blue' },
    { id: '11', name: 'Marketing', color: '#green' },
    { id: '12', name: 'Database', color: '#purple' },
    { id: '13', name: 'Planning', color: '#gray' },
  ];

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

  // const headerButtons = [
  //   {
  //     label: 'Edit',
  //     variant: 'contained' as const,
  //     onClick: () => console.log('clicked'),
  //     hide: false,
  //     disabled: false,
  //     loading: false,
  //   },
  // ];

  const getTitleIcon = () => {
    return (
      <CaseIcon
        alt='case-icon'
        className={`w-6 h-6 p-[5px] [&>path]:stroke-[#4ce547] bg-[#D2FFE3] !rounded-lg`}
      />
    );
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
        showRefresh={false}
        // onRefreshClick={onRefreshClick}
        // hideTabPanel={hideSection}
      />
      <SectionHeader
        title={'Action Items'}
        titleIcon={getTitleIcon()}
        buttons={[]}
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
            data={mockKanbanData}
            onFetchTaskDetails={(taskId: string) => {
              const task = mockTaskDetails[taskId];
              return Promise.resolve(task ?? null);
            }}
            isCreateTaskDisabled={true}
            isCreateTaskHide={true}
            showCommentCount={true}
            showTaskCount={true}
            showProfileIndicator={true}
            isDragable={true}
            isDragablebetweenBoards={true}
            statusData={statusData}
            priorityData={priorityData}
            tagData={tagData}
            userData={mockUserData}
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
