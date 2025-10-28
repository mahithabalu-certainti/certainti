/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react';
import { InteractionDetailIcon } from '../../../../../assets';
import { SectionTabPanel } from '../../../../../components';
import { AllPermissions, OverviewTabs } from '../../../../../common-service';
import SectionHeader from '../../../../../components/details-section/section-header';
import SelectProjects from './select-project/select-projects';
import AssignedProjects from './assigned-projects/select-project/assigned-projects';
import { useNavigate, useSearchParams } from 'react-router-dom';

const InteractionsTabs: OverviewTabs[] = [
  {
    id: AllPermissions.INTERACTIONS_OVERVIEW, // permission need to be change
    name: 'Overview',
    hide: false,
  },
  // {
  //   id: AllPermissions.INTERACTIONS_TIMELINE,
  //   name: 'Timeline',
  //   hide: false,
  //   disable: true,
  // },
];

const AssignProjects: React.FC = () => {
  const [refreshTrigger, setRefreshTrigger] = useState<number>();
  const [appliedFilters, setAppliedFilters] = useState<
    Record<string, string | number | boolean | string[]>
  >({});
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [showFilter, setShowFilter] = useState<boolean>(false);
  const [sortFilterCount, setSortFilterCount] = useState<number>(0);
  const [searchParams] = useSearchParams();
  const handleSorting = () => {
    setSortFilterCount(sortFilterCount + 1);
  };
  const navigate = useNavigate();
  const filterFields: any[] = [];

  const handleAssignProject = () => {
    searchParams.set('assignProject', 'true');
    navigate({ search: searchParams.toString() }, { replace: true });
  };
  const handletoAssignprojects = () => {};
  const handleBackToAssignedProjects = () => {
    searchParams.delete('assignProject');
    navigate({ search: searchParams.toString() }, { replace: true });
  };
  const isAssignProject = searchParams.get('assignProject') === 'true';
  console.log(isAssignProject);
  const headerButtons = [
    {
      label: 'Assign Projects',
      variant: 'outlined' as const,
      disabled: false,
      onClick: () => handleAssignProject(),
      sx: { width: '120px', minWidth: '120px' },
      hide: isAssignProject,
    },
    {
      label: 'Assign',
      variant: 'outlined' as const,
      disabled: false,
      onClick: () => handletoAssignprojects(),
      sx: { width: '120px', minWidth: '120px' },
      hide: !isAssignProject,
    },
    {
      label: 'Back to Assigned Projects',
      variant: 'outlined' as const,
      disabled: false,
      onClick: () => handleBackToAssignedProjects(),
      sx: { width: '180px', minWidth: '120px' },
      hide: !isAssignProject,
    },
  ];

  const onRefreshClick = () => {
    setRefreshTrigger(Date.now());
  };
  const handleFilter = () => {
    setShowFilter(!showFilter);
  };
  return (
    <div className='w-full pt-2 pl-2 pr-4'>
      <SectionTabPanel
        tabs={InteractionsTabs}
        filterMenu={filterFields}
        filterVisibility={false}
        showFilter={showFilter}
        contextKey='assign-projects'
        appliedFilters={appliedFilters}
        setAppliedFilters={setAppliedFilters}
        setCurrentPage={setCurrentPage}
        handleFilter={handleFilter}
        handleSorting={handleSorting}
        sortFilterCount={sortFilterCount}
        setSortFilterCount={setSortFilterCount}
        showRefresh={true}
        onRefreshClick={onRefreshClick}
      />
      <SectionHeader
        title={isAssignProject ? 'Assign Projects' : 'Assigned Projects'}
        titleIcon={
          <InteractionDetailIcon
            alt='financial-header-icon'
            className={`w-7 h-7 p-1 bg-[#E25A32] 'rounded-[2px]' 'rounded-full'`}
          />
        }
        count={10}
        showItemCount={true}
        buttons={headerButtons}
      />
      <div className='border border-[#CBD6E2]'>
        {isAssignProject ? <SelectProjects /> : <AssignedProjects />}
      </div>
    </div>
  );
};

export default AssignProjects;
