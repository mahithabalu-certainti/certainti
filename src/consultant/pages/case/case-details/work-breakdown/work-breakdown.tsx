import { useEffect, useState } from 'react';
import { CaseIcon } from '../../../../../assets';
import { SectionHeaderTab, SectionTabPanel } from '../../../../../components';
import SectionHeader from '../../../../../components/details-section/section-header';
import { ResourceTabs } from '../../../account-details-sidebar/sidebar-pages/resources/resources';
import { AllPermissions } from '../../../../../common-service';
import { useNavigate, useSearchParams } from 'react-router-dom';
import KanbanBoard from '../../../../../components/kanban-board/kanban-board';
import {
  mockUserData,
  mockKanbanData,
} from '../../../../../components/kanban-board/mock-data';
import { CaseTask } from './case-task';

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
            userData={mockUserData}
            showCommentCount={true}
            showTaskCount={true}
            showProfileIndicator={true}
            isCreateTaskHide={true}
            isCreateTaskDisabled={true}
          />
        )}
        {tabParam === 'case_task' && <CaseTask />}
      </div>
    </>
  );
};

export default WorkBreakDown;
