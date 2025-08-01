import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  AllPermissions,
  useGetAllCountries,
} from '../../../../../common-service';
import { SectionHeaderTab, SectionTabPanel } from '../../../../../components';
import { useEffect, useMemo, useState } from 'react';
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
import { clearFilters } from '../../components/filter/utils';
import {
  ExportType,
  ProjectFinancialProjectExportParams,
  ProjectFinancialResourceExportParams,
} from '../../../../types';
import { RootState } from '../../../../../store/store';
import { useSelector } from 'react-redux';
import { AccessRestricted } from '../../../../../components/account-restricted';
// import { clearFilters } from '../../components/filter/utils';

const FinancialTabs = [
  {
    id: AllPermissions.ACCOUNT_FINANCIAL_OVERVIEW,
    name: 'Overview',
    hide: false,
  },
  {
    id: AllPermissions.ACCOUNT_FINANCIAL_TIMELINE,
    name: 'Timeline',
    hide: false,
    disable: true,
  },
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
}

const FinancialSummary: React.FC<ProjectFinancialProps> = ({
  accountDetails,
  setResCostExportParams,
  setFinancialProjectCostParams,
  setExportType,
  countryId,
  stateId,
}) => {
  const navigate = useNavigate();
  const [appliedFilters, setAppliedFilters] = useState<
    Record<string, string | number | boolean | string[]>
  >({});
  const [fiscalyear, setFiscalyear] = useState('2025');
  const [searchParams] = useSearchParams();
  const [reFetchData, setReFetchData] = useState<number>(Date.now());
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [showFilter, setShowFilter] = useState<boolean>(false);
  const [count, setCount] = useState<number>(0);

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
    if (searchParams.get('list') === 'financial' && !searchParams.get('tab')) {
      searchParams.set('tab', initialTab);
      navigate({ search: searchParams.toString() }, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialTab, searchParams]);

  const tabParam = searchParams.get('tab') || initialTab;

  const fiscalYearOptions = getFiscalYears(20);
  const countriesList = useGetAllCountries();
  const resourceTypeOptions = useGetResourceType();

  const memoizedResourceType = useMemo(
    () =>
      resourceTypeOptions?.data?.data?.resouceType.map((item) => ({
        option: item.resource_type_name,
        value: item.rid,
      })) || [],
    [resourceTypeOptions?.data?.data?.resouceType]
  );

  const memoizedCountry = useMemo(() => {
    return (
      countriesList.data?.data.country.map((item) => ({
        option: item.country_name,
        value: item.rid,
      })) || []
    );
  }, [countriesList]);

  const onRefreshClick = () => {
    setReFetchData(Date.now());
  };

  const handleTabChange = (value: string) => {
    searchParams.set('tab', value);
    navigate({ search: searchParams.toString() }, { replace: true });
    setCount(0);
    setAppliedFilters({});
    clearFilters(`account-financial-${tabParam}`);
  };

  const handleFilter = () => {
    setShowFilter(!showFilter);
  };

  const headerButtons = [
    {
      label: 'Download',
      variant: 'contained' as const,
      onClick: () => {},
      sx: {
        width: '96px',
        minWidth: '96px',
      },
      hide: ['summary', 'state_wise_summary'].includes(tabParam),
    },
  ];
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

  const filterFields =
    tabParam === 'resource_cost'
      ? getAccountFinancialResCostFields(memoizedCountry, memoizedResourceType)
      : tabParam === 'project_cost'
        ? getAccountFinancialProjectCostFields()
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
        contextKey={`account-financial-${tabParam}`}
        appliedFilters={appliedFilters}
        setAppliedFilters={setAppliedFilters}
        setCurrentPage={setCurrentPage}
        handleFilter={handleFilter}
        sortFilterCount={0}
        setSortFilterCount={() => {}}
        allYears={fiscalYearOptions}
        fiscalYearValue={fiscalyear}
        updatedYear={(e) => setFiscalyear(e.target.value)}
        showRefresh={
          tabParam === 'project_cost' || tabParam === 'resource_cost'
        }
        onRefreshClick={onRefreshClick}
        filterVisibility={
          tabParam === 'project_cost' || tabParam === 'resource_cost'
        }
        showFilter={showFilter}
        showFiscalYear={true}
      />
      <SectionHeader
        title='Financial Summary'
        titleIcon={
          <FinancialIcon
            alt='financial-header-icon'
            className='w-7 h-7 p-1.5 bg-[#ffeae5] rounded-full [&>path]:stroke-[#f16840]'
          />
        }
        buttons={headerButtons}
        count={count}
        showItemCount={
          tabParam === 'project_cost' || tabParam === 'resource_cost'
        }
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
          <Summary fiscalYear={fiscalyear} />
        )}
        {tabParam === 'state_wise_summary' && isStatewiseSummaryViewEnable && (
          <StateWiseSummary
            fiscalYear={fiscalyear}
            countryId={countryId}
            stateId={stateId}
          />
        )}
        {tabParam === 'project_cost' && isProjectCostViewEnable && (
          <FinancialProjectCost
            fiscalyear={fiscalyear}
            reFetchData={reFetchData}
            currentPage={currentPage}
            appliedFilters={appliedFilters}
            setCount={setCount}
            setFinancialProjectCostParams={setFinancialProjectCostParams}
            setExportType={setExportType}
          />
        )}
        {tabParam === 'resource_cost' && isResourceCostViewEnable && (
          <FinancialResourceCost
            accountDetails={accountDetails}
            fiscalyear={fiscalyear}
            currentPage={currentPage}
            refreshTrigger={reFetchData}
            appliedFilters={appliedFilters}
            setCount={setCount}
            setResCostExportParams={setResCostExportParams}
            setExportType={setExportType}
          />
        )}
      </div>
    </div>
  );
};

export default FinancialSummary;
