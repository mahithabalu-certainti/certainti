import React, { useMemo, useState } from 'react';
import { AllPermissions, OverviewTabs } from '../../../../../common-service';
import { SectionTabPanel } from '../../../../../components';
import { CasesIcon } from '../../../../../assets';
import SectionHeader from '../../../../../components/details-section/section-header';
import { CaseListTable } from './table/case-list';
import { CaseListParams } from '../../../../types';
import { CASE_CREATE } from '../../../../../routes';
import { generatePath, useNavigate, useParams } from 'react-router-dom';
import { getCaseFilterFields } from './helper';
import { useManageUserList } from '../../../../../admin/service';
import { accountDetailsProps } from '../../../account-details/utils';
import { useGetCaseFilingTypes } from '../../../../services/cases/case-service';

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

interface CaseProps {
  accountInActive: boolean;
  accountDetails: accountDetailsProps;
}
const Cases: React.FC<CaseProps> = ({ accountInActive, accountDetails }) => {
  const navigate = useNavigate();
  const { accountid } = useParams();
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
    sortBy: 'r_number',
    sortOrder: 'ASC',
    fiscalYear: 0,
  });
  const [refreshCaseTrigger, setRefreshCaseTrigger] = useState<number>(
    Date.now()
  );
  const [columnAnchorEl, setColumnAnchorEl] =
    React.useState<HTMLButtonElement | null>(null);

  // User List Api
  const { data: userListData } = useManageUserList({
    page: 1,
    limit: 2000,
    sortBy: 'first_name',
    sortOrder: 'ASC',
  });

  const caseFillingTypes = useGetCaseFilingTypes();

  const userListOptions = useMemo(() => {
    return (
      userListData?.data?.users?.map((item) => ({
        value: item.rid,
        label: `${item.first_name} ${item.last_name}`,
      })) || []
    );
  }, [userListData]);

  const caseFilingTypesOptions = useMemo(() => {
    return (
      caseFillingTypes?.data?.data?.caseFilingType?.map((item) => ({
        value: item.rid,
        label: item.filing_type_name,
      })) || []
    );
  }, [caseFillingTypes]);

  const handleFilter = () => {
    setShowFilter(!showFilter);
  };

  const onRefreshClick = () => {
    setRefreshCaseTrigger(Date.now());
  };

  const handleColumnVisibility = (
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    setColumnAnchorEl(event.currentTarget);
  };

  const handleSorting = (sortBy: string, sortOrder: 'asc' | 'desc') => {
    const defaultSortField = 'r_number';
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

  console.log('accountDetails', accountDetails);

  const handlCreateNewCases = () => {
    const accountId = accountid ?? '';
    const path = generatePath(CASE_CREATE);
    const queryParams = new URLSearchParams({
      accountId,
      account_name: accountDetails?.accountById?.account_name || '',
      account_number: accountDetails?.accountById?.r_number || '',
      country_rid: accountDetails?.accountById?.country_rid || '',
    });
    navigate(`${path}?${queryParams.toString()}`);
  };

  const headerButtons = [
    {
      label: 'Show/Hide Fields',
      variant: 'outlined' as const,
      disabled: false,
      onClick: handleColumnVisibility,
      sx: { width: '125px', minWidth: '125px' },
    },
    {
      label: 'New',
      variant: 'outlined' as const,
      disabled: accountInActive,
      onClick: () => handlCreateNewCases(),
      sx: { width: '48px', minWidth: '48px' },
      hide: false,
    },
  ];

  const filterFields = getCaseFilterFields(
    [],
    caseFilingTypesOptions,
    userListOptions
  );

  return (
    <div className='w-full pt-2 pl-2 pr-4'>
      <SectionTabPanel
        tabs={CasesTabs}
        filterMenu={filterFields}
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
        showBackArrow={false}
        buttons={headerButtons}
        bgType='circle'
        iconBg='#D2FFE3'
      />
      <div className='border border-[#CBD6E2]'>
        <CaseListTable
          appliedFilters={appliedFilters}
          tableParams={tableParams}
          setTableParams={setTableParams}
          setTotalCount={setTotalCount}
          refreshTrigger={refreshCaseTrigger}
          setColumnAnchorEl={setColumnAnchorEl}
          columnAnchorEl={columnAnchorEl}
          accountDetails={accountDetails}
        />
      </div>
    </div>
  );
};

export default Cases;
