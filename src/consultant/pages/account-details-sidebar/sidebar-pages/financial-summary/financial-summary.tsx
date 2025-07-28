import { useSearchParams } from 'react-router-dom';
import {
  AllModules,
  AllPermissions,
  useGetAllCountries,
} from '../../../../../common-service';
import { SectionHeaderTab, SectionTabPanel } from '../../../../../components';
import { useMemo, useState } from 'react';
import SectionHeader from '../../../../../components/details-section/section-header';
import { FinancialIcon } from '../../../../../assets';
import { StateWiseSummary, Summary } from './tab';
import { NewProjectData } from '../../../../types/project';
import { checkPermission, getFiscalYears } from '../../../../../common-utils';
import FinancialProjectCost from './tab/project-cost/project-cost';
import FinancialResourceCost from './tab/resource-cost/resource-cost';
import { accountDetailsProps } from '../../../account-details/utils';
import { getAccountFinancialResCostFields } from './helpers';
import { useGetResourceType } from '../../../../services/resource-list';
import { clearFilters } from '../../components/filter/utils';
import {
  ExportType,
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
  accountDetails?: accountDetailsProps;
  activeKey?: string;
  projectDetails: NewProjectData | null;
  setResCostExportParams: (
    params: ProjectFinancialResourceExportParams
  ) => void;
  setExportType: (type: ExportType) => void;
}

const FinancialSummary: React.FC<ProjectFinancialProps> = ({
  accountDetails,
  projectDetails,
  setResCostExportParams,
  setExportType,
}) => {
  const [appliedFilters, setAppliedFilters] = useState<
    Record<string, string | number | boolean | string[]>
  >({});
  const [fiscalyear, setFiscalyear] = useState('2025');
  const [searchParams, setSearchParams] = useSearchParams();
  const [reFetchData, setReFetchData] = useState<number>(Date.now());
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [showFilter, setShowFilter] = useState<boolean>(false);
  const [count, setCount] = useState<number>(0);

  const { modules } = useSelector((state: RootState) => state.permission);

  const financialEnable = checkPermission(
    modules,
    AllModules.FINANCIAL_HIGHLIGHTS
  );

  // const handleResetTabChange = () => {
  //   setCount(0);
  //   setAppliedFilters({});
  //   clearFilters(`account-financial-${tabParam}`);
  // };

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
    setSearchParams(searchParams);
    setCount(0);
    setAppliedFilters({});
    clearFilters(`account-financial-${tabParam}`);
  };

  const handleFilter = () => {
    setShowFilter(!showFilter);
  };

  const tabParam = searchParams.get('tab') || 'summary';
  const headerButtons = [
    {
      label: 'Download',
      variant: 'contained' as const,
      onClick: () => {},
      sx: {
        width: '96px',
        minWidth: '96px',
      },
    },
  ];
  const tabs = [
    { label: 'Summary', value: 'summary' },
    { label: 'State wise Summary', value: 'state_wise_summary' },
    { label: 'Project Cost', value: 'project_cost' },
    { label: 'Resource Cost', value: 'resource_cost' },
  ];

  const filterFields =
    tabParam === 'resource_cost'
      ? getAccountFinancialResCostFields(
          // fiscalYearOptions,
          memoizedCountry,
          memoizedResourceType
        )
      : [];

  if (!financialEnable) return <AccessRestricted />;

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
        {tabParam === 'summary' && <Summary projectDetails={projectDetails} />}
        {tabParam === 'state_wise_summary' && (
          <StateWiseSummary projectDetails={projectDetails} />
        )}
        {tabParam === 'project_cost' && (
          <FinancialProjectCost
            fiscalyear={fiscalyear}
            reFetchData={reFetchData}
            // handleReset={handleResetTabChange}
          />
        )}
        {tabParam === 'resource_cost' && (
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
