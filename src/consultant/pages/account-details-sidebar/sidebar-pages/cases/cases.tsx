import { useState } from 'react';
import { AllPermissions, OverviewTabs } from '../../../../../common-service';
import { SectionTabPanel } from '../../../../../components';
import { CasesIcon } from '../../../../../assets';
import SectionHeader from '../../../../../components/details-section/section-header';
import { CaseList } from './case-list/case-list';
import { CaseListParams } from '../../../../types';
import { CASE_CREATE } from '../../../../../routes';
import { useNavigate } from 'react-router-dom';

const CasesTabs: OverviewTabs[] = [
  {
    id: AllPermissions.INTERACTIONS_OVERVIEW, // need to change persmission
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
const Cases = () => {
  const [appliedFilters, setAppliedFilters] = useState<
    Record<string, string | number | boolean | string[]>
  >({});

  const [showFilter, setShowFilter] = useState<boolean>(false);
  const [sortFilterCount, setSortFilterCount] = useState<number>(0);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [tableParams, setTableParams] = useState<CaseListParams>({
    page: page,
    limit: 100,
    sortBy: 'case_id',
    sortOrder: 'ASC',
    fiscalYear: 0,
  });
  const navigate = useNavigate();
  const [refreshCasesTrigger, setRefreshCasesTrigger] = useState<number>();
  const handleFilter = () => {
    setShowFilter(!showFilter);
  };
  const onRefreshClick = () => {
    setRefreshCasesTrigger(Date.now());
  };
  const handleSorting = (sortBy: string, sortOrder: 'asc' | 'desc') => {
    const defaultSortField = 'case_id';
    const defaultSortOrder = 'ASC';
    const apiOrder = sortOrder === 'asc' ? 'ASC' : 'DESC';

    if (!sortBy) {
      setSortFilterCount(0);
      setTableParams((prev) => ({
        ...prev,
        sortBy: defaultSortField,
        sortOrder: defaultSortOrder,
      }));
    } else {
      setSortFilterCount(1);
      setTableParams((prev) => ({
        ...prev,
        sortBy,
        sortOrder: apiOrder,
      }));
    }
  };

  const handleBack = () => {
    // navigate(-1`);
  };
  const handlCreateNewCases = () => {
    navigate(CASE_CREATE); // need to change persmission
  };
  const headerButtons = [
    {
      label: 'New',
      variant: 'outlined' as const,
      disabled: false,
      onClick: () => handlCreateNewCases(),
      sx: { width: '48px', minWidth: '48px' },
      hide: false,
    },
  ];
  return (
    <div className='w-full pt-2 pl-2 pr-4'>
      <SectionTabPanel
        tabs={CasesTabs}
        filterMenu={[]}
        filterVisibility={true}
        showFilter={true}
        contextKey='Cases'
        appliedFilters={appliedFilters}
        setAppliedFilters={setAppliedFilters}
        setCurrentPage={setPage}
        handleFilter={handleFilter}
        handleSorting={handleSorting}
        sortFilterCount={sortFilterCount}
        setSortFilterCount={setSortFilterCount}
        showRefresh={true}
        onRefreshClick={onRefreshClick}
      />
      <SectionHeader
        title={'Cases'}
        titleIcon={
          <CasesIcon
            alt='cases-header-icon'
            className='[&>path]:stroke-[#4ce547] w-[14px] h-[14px]'
          />
        }
        count={totalCount}
        showItemCount={true}
        showBackArrow={true}
        onBackClick={handleBack}
        buttons={headerButtons}
        // bgType='circle'
      />
      <div className='border border-[#CBD6E2]'>
        <CaseList
          appliedFilters={
            appliedFilters as Record<string, string | number | boolean>
          }
          tableParams={tableParams}
          setTableParams={(data) => {
            setTableParams(data);
            onRefreshClick();
          }}
          setTotalCount={setTotalCount}
          refreshCasesTrigger={refreshCasesTrigger}
        />
      </div>
    </div>
  );
};

export default Cases;
