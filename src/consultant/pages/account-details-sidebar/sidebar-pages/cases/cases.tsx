import React, { useEffect, useMemo, useState } from 'react';
import {
  AllModules,
  AllPermissions,
  OverviewTabs,
} from '../../../../../common-service';
import { SectionTabPanel } from '../../../../../components';
import { CasesIcon } from '../../../../../assets';
import SectionHeader from '../../../../../components/details-section/section-header';
import { CaseListTable } from './table/case-list';
import {
  ActivityDropdownItem,
  CaseListExportParams,
  CaseListParams,
  colorCode,
  ExportType,
} from '../../../../types';
import { CASE_CREATE } from '../../../../../routes';
import { generatePath, useNavigate, useParams } from 'react-router-dom';
import { getCaseFilterFields } from './helper';
import { accountDetailsProps } from '../../../account-details/utils';
import {
  useGetCaseFilingTypes,
  useGetCaseOwners,
  useGetCaseStatuses,
} from '../../../../services/cases/case-service';
import { useSelector } from 'react-redux';
import { RootState } from '../../../../../store/store';
import { checkPermission } from '../../../../../common-utils';
import { AccessRestricted } from '../../../../../components/account-restricted';

const CasesTabs: OverviewTabs[] = [
  {
    id: AllPermissions.CASES_OVERVIEW, // need to change persmission
    name: 'Overview',
    hide: false,
  },
  {
    id: AllPermissions.CASES_TIMELINE,
    name: 'Timeline',
    hide: true,
    disable: true,
  },
];

interface CaseProps {
  accountInActive: boolean;
  accountDetails: accountDetailsProps;
  setExportType: (type: ExportType) => void;
  setCasesParams: React.Dispatch<React.SetStateAction<CaseListExportParams>>;
  activityMenuItems: ActivityDropdownItem[];
}
const Cases: React.FC<CaseProps> = ({
  accountInActive,
  accountDetails,
  setExportType,
  setCasesParams,
  activityMenuItems,
}) => {
  const navigate = useNavigate();
  const { accountid } = useParams();
  const [appliedFilters, setAppliedFilters] = useState<
    Record<string, string | number | boolean | string[]>
  >({});
  const [showFilter, setShowFilter] = useState<boolean>(false);
  const [sortFilterCount, setSortFilterCount] = useState<number>(0);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [searchText, setSearchText] = useState<string>('');
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

  const { fiscalYear } = useSelector<RootState, { fiscalYear: string }>(
    (state: RootState) => state.account
  );

  const { permission, modules } = useSelector(
    (state: RootState) => state.permission
  );

  const convertedFiscalYear = fiscalYear !== 'FY-All' ? Number(fiscalYear) : 0;

  const caseFillingTypes = useGetCaseFilingTypes();
  const caseStatus = useGetCaseStatuses();
  const caseOwners = useGetCaseOwners();

  const caseOwnersOptions = useMemo(() => {
    return (
      caseOwners?.data?.data?.caseOwners?.map((item) => ({
        value: item.rid,
        label: item.name || '',
      })) || []
    );
  }, [caseOwners]);

  const caseFilingTypesOptions = useMemo(() => {
    return (
      caseFillingTypes?.data?.data?.caseFilingType?.map((item) => ({
        value: item.rid,
        label: item.filing_type_name,
      })) || []
    );
  }, [caseFillingTypes]);

  const caseStatusOptions = useMemo(() => {
    return (
      caseStatus?.data?.data?.caseStatus?.map((item) => ({
        value: item.rid,
        label: item.status_name,
      })) || []
    );
  }, [caseStatus]);

  useEffect(() => {
    if (setExportType) {
      setExportType('cases');
    }
    setCasesParams({
      sortBy: tableParams.sortBy,
      sortOrder: tableParams.sortOrder as 'ASC' | 'DESC' | undefined,
      filters: appliedFilters,
      fiscalYear: convertedFiscalYear,
      search: searchText,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    appliedFilters,
    convertedFiscalYear,
    tableParams.sortBy,
    tableParams.sortOrder,
    searchText,
  ]);

  // Permissions
  const casesEnable = checkPermission(modules, AllModules.CASES);

  const isCasesViewEnable = checkPermission(
    permission,
    AllPermissions.CASES_VIEW_EDIT
  );

  const isCaseCreateEnable = checkPermission(
    permission,
    AllPermissions.CASES_CREATE
  );

  const casesEditFields = useMemo(
    () =>
      permission?.find((item) => item.name === AllPermissions.CASES_VIEW_EDIT)
        ?.fields ?? [],
    [permission]
  );

  const permissionMap = useMemo(() => {
    const map: Record<string, { read: boolean; edit: boolean }> = {};
    casesEditFields.forEach((item) => {
      map[item.name] = { read: item.read ?? false, edit: item.edit ?? false };
    });
    return map;
  }, [casesEditFields]);

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

  const handlCreateNewCase = () => {
    const accountId = accountid ?? '';
    const accountName = accountDetails?.accountById?.account_name || '';
    const path = generatePath(CASE_CREATE);
    const queryParams = new URLSearchParams({
      accountId,
      account_name: accountDetails?.accountById?.account_name || '',
      account_number: accountDetails?.accountById?.r_number || '',
      country_rid: accountDetails?.accountById?.country_rid || '',
      country_code: accountDetails?.accountById?.country?.country_code || '',
      source: `Account > ${accountName}`,
      // activeMenu: 'account',
    });
    navigate(`${path}?${queryParams.toString()}`);
  };

  const headerButtons = [
    {
      label: 'New',
      variant: 'outlined' as const,
      disabled: accountInActive,
      onClick: () => handlCreateNewCase(),
      sx: { width: '48px', minWidth: '48px' },
      hide: !isCaseCreateEnable,
    },
    {
      label: 'Show/Hide Fields',
      variant: 'outlined' as const,
      disabled: false,
      onClick: handleColumnVisibility,
      sx: { width: '125px', minWidth: '125px' },
    },
  ];

  const filterFields = getCaseFilterFields(
    caseStatusOptions,
    caseFilingTypesOptions,
    caseOwnersOptions,
    permissionMap
  );

  if (!casesEnable || !isCasesViewEnable) return <AccessRestricted />;

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
        setCurrentPage={(pageNo) => {
          setPage(pageNo + 1);
          setTableParams((prev) => ({
            ...prev,
            page: pageNo + 1,
          }));
        }}
        handleFilter={handleFilter}
        handleSorting={handleSorting}
        sortFilterCount={sortFilterCount}
        setSortFilterCount={setSortFilterCount}
        showRefresh={true}
        onRefreshClick={onRefreshClick}
        showSearch={true}
        searchDisabled={false}
        searchPlaceholder='Search'
        onSearch={(text) => setSearchText(text)}
        showAddActivity={true}
        activityMenuItems={activityMenuItems}
      />
      <SectionHeader
        title={'Cases'}
        titleIcon={
          <CasesIcon
            alt='cases-header-icon'
            className={`[&>path]:stroke-[${colorCode.AccountTextColor}] w-[14px] h-[14px]`}
          />
        }
        count={totalCount}
        showItemCount={true}
        showBackArrow={false}
        buttons={headerButtons}
          iconBg={colorCode.AccountBgColor}
              bgType='circle'
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
          searchText={searchText}
          accountInActive={accountInActive}
          caseFilingTypesOptions={caseFilingTypesOptions}
          caseOwnersOptions={caseOwnersOptions}
        />
      </div>
    </div>
  );
};

export default Cases;
