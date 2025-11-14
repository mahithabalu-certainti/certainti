import { useEffect, useState } from 'react';
import { CaseIcon, ComingSoon } from '../../../../../assets';
import { SectionHeaderTab, SectionTabPanel } from '../../../../../components';
import SectionHeader from '../../../../../components/details-section/section-header';
import { ResourceTabs } from '../../../account-details-sidebar/sidebar-pages/resources/resources';
import { AllPermissions } from '../../../../../common-service';
import { useNavigate, useSearchParams, useParams } from 'react-router-dom';
import KanbanBoard from '../../../../../components/kanban-board/kanban-board';
import { useGetWorkBreakdownList } from '../../../../../hooks/use-work-breakdown';
import { getTaskDetail } from '../../../../services/work-breakdown/work-breakdown-service';
import { useGetUserOptions } from '../../../../services/case-team/case-team-service';

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
  const { caseId } = useParams<{
    caseId: string;
  }>();
  const accountId = searchParams.get('accountID');

  const {
    data: kanbanData,
    isLoading,
    isError,
  } = useGetWorkBreakdownList(accountId || '', caseId || '');
  
  const userOptionsQuery = useGetUserOptions(accountId || '');

  const tabParam = searchParams.get('tab') || 'milestone';
  const [appliedFilters, setAppliedFilters] = useState<
    Record<string, string | number | boolean | string[]>
  >({});

  const priorityData = [
    { id: '1', name: 'Lowest', color: '#gray' },
    { id: '2', name: 'Low', color: '#lightblue' },
    { id: '3', name: 'Medium', color: '#yellow' },
    { id: '4', name: 'High', color: '#orange' },
    { id: '5', name: 'Highest', color: '#red' },
  ];

  const statusData = [
    { id: '1', name: 'Active', color: '#10b981' },
    { id: '2', name: 'Inactive', color: '#ef4444' },
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
    navigate(`?${searchParams.toString()}`, { replace: true });
  };

  const handleFetchTaskDetails = async (taskId: string) => {
    console.log('handleFetchTaskDetails called for taskId:', taskId);
    if (!accountId || !caseId) {
      console.warn('Account ID or Case ID is missing');
      return null;
    }

    try {
      const taskData = await getTaskDetail(accountId, caseId, taskId);
      return taskData;
    } catch (error) {
      console.error('Failed to fetch task details:', error);
      return null;
    }
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
          <>
            {isError ? (
              <div className='flex items-center justify-center h-full p-40 text-red-500'>
                Error loading data.
              </div>
            ) : kanbanData?.data && kanbanData.data.length === 0 ? (
              <div className='flex items-center justify-center h-full p-40 text-gray-500'>
                {kanbanData.statusMessage || 'No data available'}
              </div>
            ) : (
              <KanbanBoard
                data={kanbanData?.data || []}
                onFetchTaskDetails={handleFetchTaskDetails}
                showCommentCount={true}
                showTaskCount={true}
                showProfileIndicator={true}
                isDragable={true}
                isLoading={isLoading}
                statusData={statusData}
                priorityData={priorityData}
                tagData={tagData}
                userData={userOptionsQuery.data || []}
              />
            )}
          </>
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
