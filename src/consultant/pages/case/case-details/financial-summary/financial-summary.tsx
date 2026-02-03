import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  AllPermissions,
  useGetAllCountries,
} from '../../../../../common-service';
import { SectionHeaderTab, SectionTabPanel } from '../../../../../components';
import React, { useEffect, useMemo, useState } from 'react';
import SectionHeader from '../../../../../components/details-section/section-header';
import { FinancialIcon } from '../../../../../assets';
import { StateWiseSummary, Summary } from './tab';
import { checkPermission, getFiscalYears } from '../../../../../common-utils';
import FinancialProjectCost from './tab/project-cost/project-cost';
import FinancialResourceCost from './tab/resource-cost/resource-cost';
import { accountDetailsProps } from '../../../account-details/utils';
import {
  getAccountFinancialProjectCostFields,
  getAccountFinancialResCostFields,
} from './helpers';
import { useGetResourceType } from '../../../../services/resource-list';
import {
  ColorCode,
  ExportType,
  ProjectFinancialProjectExportParams,
  ProjectFinancialResourceExportParams,
} from '../../../../types';
import { RootState } from '../../../../../store/store';
import { useSelector } from 'react-redux';
import { AccessRestricted } from '../../../../../components/account-restricted';
import { clearFilters } from '../../../account-details-sidebar/components/filter/utils';

const FinancialTabs = [
  {
    id: AllPermissions.ACCOUNT_FINANCIAL_OVERVIEW,
    name: 'Overview',
    hide: false,
  },
  // {
  //   id: AllPermissions.ACCOUNT_FINANCIAL_TIMELINE,
  //   name: 'Timeline',
  //   hide: false,
  //   disable: true,
  // },
];
interface ProjectFinancialProps {
  countryId?: string | null;
  stateId?: string | null;
  accountDetails?: accountDetailsProps;
  activeKey?: string;
  setResCostExportParams: (
    params: ProjectFinancialResourceExportParams
  ) => void;
  setFinancialProjectCostParams: (
    params: ProjectFinancialProjectExportParams
  ) => void;
  setExportType: (type: ExportType) => void;
  accountId?: string;
  caseRid?: string;
}

const CaseFinancialSummary: React.FC<ProjectFinancialProps> = ({
  accountDetails,
  setResCostExportParams,
  setFinancialProjectCostParams,
  setExportType,
  countryId,
  stateId,
  accountId,
  caseRid,
}) => {
  const navigate = useNavigate();
  const [appliedFilters, setAppliedFilters] = useState<
    Record<string, string | number | boolean | string[]>
  >({});
  const { fiscalYear } = useSelector<RootState, { fiscalYear: string }>(
    (state: RootState) => state.account
  );
  const currentYear = new Date().getFullYear().toString();
  const fiscalYearValue = fiscalYear === 'FY-All' ? currentYear : fiscalYear;
  const [searchParams] = useSearchParams();
  const [reFetchData, setReFetchData] = useState<number>(Date.now());
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [showFilter, setShowFilter] = useState<boolean>(false);
  const [count, setCount] = useState<number>(0);
  const [columnAnchorEl, setColumnAnchorEl] =
    React.useState<HTMLButtonElement | null>(null);
  const [searchText, setSearchText] = useState('');
  const [resetSearch, setResetSearch] = useState(false);

  const { permission } = useSelector((state: RootState) => state.permission);

  const isProjectCostViewEnable = checkPermission(
    permission,
    AllPermissions.ACCOUNT_FINANCIAL_PROJECT_COST_VIEW
  );

  const isResourceCostViewEnable = checkPermission(
    permission,
    AllPermissions.ACCOUNT_FINANCIAL_RESOURCE_COST_VIEW
  );

  const isSummaryViewEnable = checkPermission(
    permission,
    AllPermissions.ACCOUNT_FINANCIAL_SUMMARY_VIEW
  );

  const isStatewiseSummaryViewEnable = checkPermission(
    permission,
    AllPermissions.ACCOUNT_FINANCIAL_STATEWISE_SUMMARY_VIEW
  );

  const initialTab = useMemo(() => {
    if (isSummaryViewEnable) return 'summary';
    if (isStatewiseSummaryViewEnable) return 'state_wise_summary';
    if (isProjectCostViewEnable) return 'project_cost';
    if (isResourceCostViewEnable) return 'resource_cost';
    return 'summary';
  }, [
    isSummaryViewEnable,
    isStatewiseSummaryViewEnable,
    isProjectCostViewEnable,
    isResourceCostViewEnable,
  ]);

  useEffect(() => {
    if (
      searchParams.get('list') === 'financialHighlights' &&
      !searchParams.get('tab')
    ) {
      searchParams.set('tab', initialTab);
      navigate({ search: searchParams.toString() }, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialTab, searchParams]);

  const tabParam = searchParams.get('tab') || initialTab;

  const fiscalYearOptions = getFiscalYears(26);
  const resourceTypeOptions = useGetResourceType();
  const countriesList = useGetAllCountries();

  const memoizedResourceType = useMemo(
    () =>
      resourceTypeOptions?.data?.data?.resouceType.map((item) => ({
        option: item.resource_type_name,
        value: item.rid,
      })) || [],
    [resourceTypeOptions?.data?.data?.resouceType]
  );

  const onRefreshClick = () => {
    setReFetchData(Date.now());
  };

  const handleTabChange = (value: string) => {
    searchParams.set('tab', value);
    navigate({ search: searchParams.toString() }, { replace: true });
    setCount(0);
    setAppliedFilters({});
    setAppliedFilters({});
    clearFilters(`case-financial-${tabParam}`);
    setSearchText('');
    setSearchText('');
    setResetSearch(true);
  };

  const handleFilter = () => {
    setShowFilter(!showFilter);
  };

  const handleSearchReset = () => {
    setResetSearch(false);
  };

  const tabs = [
    { label: 'Summary', value: 'summary', hide: !isSummaryViewEnable },
    {
      label: 'State wise Summary',
      value: 'state_wise_summary',
      hide: !isStatewiseSummaryViewEnable,
    },
    {
      label: 'Project Cost',
      value: 'project_cost',
      hide: !isProjectCostViewEnable,
    },
    {
      label: 'Resource Cost',
      value: 'resource_cost',
      hide: !isResourceCostViewEnable,
    },
  ];

  const handleColumnVisibility = (
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    setColumnAnchorEl(event.currentTarget);
  };

  const headerButtons = [
    {
      label: 'Show/Hide Fields',
      variant: 'outlined' as const,
      disabled: false,
      onClick: handleColumnVisibility,
      sx: { width: '125px', minWidth: '125px' },
      hide: tabParam === 'summary' || tabParam === 'state_wise_summary',
    },
  ];

  const fiscalYearFilterOptions = useMemo(
    () =>
      fiscalYearOptions.map((item) => ({
        option: item.label,
        value: item.value,
      })),
    [fiscalYearOptions]
  );

  const memoizedCountry = useMemo(() => {
    return (
      countriesList.data?.data.country.map((item) => ({
        option: item.country_name,
        value: item.rid,
      })) || []
    );
  }, [countriesList]);

  const filterFields =
    tabParam === 'resource_cost'
      ? getAccountFinancialResCostFields(
          fiscalYearFilterOptions,
          memoizedCountry,
          memoizedResourceType
        )
      : tabParam === 'project_cost'
        ? getAccountFinancialProjectCostFields(fiscalYearFilterOptions)
        : [];

  if (
    !isSummaryViewEnable &&
    !isStatewiseSummaryViewEnable &&
    !isProjectCostViewEnable &&
    !isResourceCostViewEnable
  )
    return <AccessRestricted />;

  return (
    <div className='w-full pt-2 pl-2 pr-4 mb-1'>
      {' '}
      <SectionTabPanel
        tabs={FinancialTabs}
        filterMenu={filterFields}
        contextKey={`case-financial-${tabParam}`}
        appliedFilters={appliedFilters}
        setAppliedFilters={setAppliedFilters}
        setCurrentPage={setCurrentPage}
        handleFilter={handleFilter}
        sortFilterCount={0}
        setSortFilterCount={() => {}}
        allYears={fiscalYearOptions}
        fiscalYearValue={fiscalYearValue}
        showRefresh={
          tabParam === 'project_cost' || tabParam === 'resource_cost'
        }
        onRefreshClick={onRefreshClick}
        filterVisibility={
          tabParam === 'project_cost' || tabParam === 'resource_cost'
        }
        showFilter={showFilter}
        // showFiscalYear={true}
        showSearch={tabParam === 'project_cost' || tabParam === 'resource_cost'}
        searchDisabled={false}
        searchPlaceholder='Search'
        onSearch={(text) => setSearchText(text)}
        searchReset={resetSearch}
        onSearchReset={handleSearchReset}
      />
      <SectionHeader
        title='Financial Summary'
        titleIcon={
          <FinancialIcon
            alt='financial-header-icon'
            className={`[&>path]:stroke-[${ColorCode.accountTextColor}] w-[14px] h-[14px]`}
          />
        }
        buttons={headerButtons}
        count={count}
        showItemCount={
          tabParam === 'project_cost' || tabParam === 'resource_cost'
        }
        iconBg={ColorCode.caseBgColor}
        bgType='circle'
      />
      <SectionHeaderTab
        tabs={tabs}
        onTabChange={handleTabChange}
        defaultValue={tabParam}
      />
      <div
        className={`border border-t-0 border-[#CBD6E2] ${
          tabParam === 'summary' || tabParam === 'state_wise_summary'
            ? 'p-3'
            : ''
        }`}
      >
        {tabParam === 'summary' && isSummaryViewEnable && (
          <Summary
            fiscalYear={fiscalYearValue}
            accountDetails={accountDetails}
            caseRid={caseRid}
            accountId={accountId}
          />
        )}
        {tabParam === 'state_wise_summary' && isStatewiseSummaryViewEnable && (
          <StateWiseSummary
            fiscalYear={fiscalYearValue}
            countryId={countryId}
            stateId={stateId}
            accountDetails={accountDetails}
            caseRid={caseRid}
            accountId={accountId}
          />
        )}
        {tabParam === 'project_cost' && isProjectCostViewEnable && (
          <FinancialProjectCost
            fiscalyear={fiscalYearValue}
            reFetchData={reFetchData}
            currentPage={currentPage}
            appliedFilters={appliedFilters}
            setCount={setCount}
            setFinancialProjectCostParams={setFinancialProjectCostParams}
            setExportType={setExportType}
            setColumnAnchorEl={setColumnAnchorEl}
            columnAnchorEl={columnAnchorEl}
            searchValue={searchText}
            accountId={accountId}
            caseRid={caseRid}
          />
        )}
        {tabParam === 'resource_cost' && isResourceCostViewEnable && (
          <FinancialResourceCost
            accountDetails={accountDetails}
            fiscalyear={fiscalYearValue}
            currentPage={currentPage}
            refreshTrigger={reFetchData}
            appliedFilters={appliedFilters}
            setCount={setCount}
            setResCostExportParams={setResCostExportParams}
            setExportType={setExportType}
            setColumnAnchorEl={setColumnAnchorEl}
            columnAnchorEl={columnAnchorEl}
            searchValue={searchText}
            accountId={accountId}
            caseRid={caseRid}
          />
        )}
      </div>
    </div>
  );
};

export default CaseFinancialSummary;
