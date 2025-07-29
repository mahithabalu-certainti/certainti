import React, { useMemo, useState } from 'react';
import { SectionHeaderTab, SectionTabPanel } from '../../../../../components';
import {
  AllModules,
  AllPermissions,
  useGetAllCountries,
} from '../../../../../common-service';
import SectionHeader from '../../../../../components/details-section/section-header';
import { FinancialIcon } from '../../../../../assets';
import SummayListTable from './summary/summay-list';
import ResourceCost from './resource-cost/resource-cost';
import { NewProjectData } from '../../../../types/project';
import { useSearchParams } from 'react-router-dom';
import { getProjectFinancialResCostFields } from './helpers';
import { useFetchState } from '../../../../services/account';
import { FilterValue } from '../../../account-details-sidebar/components/filter/filterType';
import { useGetResourceType } from '../../../../services/resource-list';
import {
  ExportType,
  ProjectFinancialResourceExportParams,
} from '../../../../types';
import { useSelector } from 'react-redux';
import { RootState } from '../../../../../store/store';
import { checkPermission } from '../../../../../common-utils';
import { AccessRestricted } from '../../../../../components/account-restricted';

const FinancialTabs = [
  {
    id: AllPermissions.PROJECT_FINANCIAL_OVERVIEW,
    name: 'Overview',
    hide: false,
  },
  {
    id: AllPermissions.PROJECT_FINANCIAL_TIMELINE,
    name: 'Timeline',
    hide: false,
    disable: true,
  },
];

interface ProjectFinancialProps {
  projectDetails: NewProjectData | null;
  setResCostExportParams: (
    params: ProjectFinancialResourceExportParams
  ) => void;
  setExportType: (type: ExportType) => void;
}

const Financial: React.FC<ProjectFinancialProps> = ({
  projectDetails,
  setExportType,
  setResCostExportParams,
}) => {
  const [appliedFilters, setAppliedFilters] = useState<
    Record<string, string | number | boolean | string[]>
  >({});
  const [refreshResourceCost, setRefreshResourceCost] = useState<number>(
    Date.now()
  );
  const [resourceCostCount, setResourceCostCount] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [showFilter, setShowFilter] = useState<boolean>(false);
  const [currentCountry, setCurrentCountry] = useState<string>('');

  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab') || 'summary';
  const { permission, modules } = useSelector(
    (state: RootState) => state.permission
  );

  const financialEnable = checkPermission(
    modules,
    AllModules.FINANCIAL_HIGHLIGHTS
  );

  const isResourceCostViewEnable = checkPermission(
    permission,
    AllPermissions.PROJECT_FINANCIAL_RESOURCE_COST_VIEW
  );

  const isSummaryViewEnable = checkPermission(
    permission,
    AllPermissions.PROJECT_FINANCIAL_SUMMARY_VIEW
  );

  const countriesList = useGetAllCountries();
  const region = useFetchState(currentCountry);
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

  const memoizedRegion = useMemo(
    () =>
      region.data?.data.states.map((state) => ({
        option: state.state_name,
        value: state.rid,
      })) || [],
    [region.data?.data.states]
  );

  const handleRefresh = () => {
    setRefreshResourceCost(Date.now());
  };

  const handleFilter = () => {
    setShowFilter(!showFilter);
  };

  const handleTabChange = (value: string) => {
    searchParams.set('tab', value);
    setSearchParams(searchParams);
    setResourceCostCount(0);
  };

  const handleFilterChange = (fieldName: string, value: FilterValue) => {
    if (fieldName === 'country_rid' && value) {
      setCurrentCountry(String(value));
    }
  };

  const filterFields = getProjectFinancialResCostFields(
    memoizedCountry,
    memoizedRegion,
    memoizedResourceType
  );

  const tabs = [
    { label: 'Summary', value: 'summary', hide: !isSummaryViewEnable },
    {
      label: 'Resource Cost',
      value: 'resource_cost',
      hide: !isResourceCostViewEnable,
    },
  ];

  if (!financialEnable || (!isSummaryViewEnable && !isResourceCostViewEnable))
    return <AccessRestricted />;

  return (
    <div className='w-full pt-2 pl-2 pr-4 mb-1'>
      <SectionTabPanel
        tabs={FinancialTabs}
        filterMenu={filterFields}
        filterVisibility={tabParam === 'resource_cost'}
        showFilter={showFilter}
        contextKey='project-financial-resource-cost'
        appliedFilters={appliedFilters}
        setAppliedFilters={setAppliedFilters}
        setCurrentPage={setCurrentPage}
        handleFilter={handleFilter}
        sortFilterCount={0}
        setSortFilterCount={() => {}}
        showRefresh={tabParam === 'resource_cost'}
        onRefreshClick={handleRefresh}
        onFilterChange={handleFilterChange}
      />
      <SectionHeader
        title='Financial Summary'
        titleIcon={
          <FinancialIcon
            alt='financial-header-icon'
            className='w-7 h-7 p-1.5 bg-[#D2E6FF] rounded-full'
          />
        }
        count={resourceCostCount}
        showItemCount={tabParam === 'resource_cost'}
      />
      <SectionHeaderTab
        tabs={tabs}
        onTabChange={handleTabChange}
        defaultValue={tabParam}
      />

      <div
        className={`border border-t-0 border-[#CBD6E2] ${
          tabParam !== 'resource_cost' ? 'p-3' : ''
        }`}
      >
        {tabParam === 'summary' && isSummaryViewEnable && (
          <SummayListTable projectDetails={projectDetails} />
        )}
        {tabParam === 'resource_cost' && isResourceCostViewEnable && (
          <ResourceCost
            projectDetails={projectDetails}
            refreshTrigger={refreshResourceCost}
            setCount={setResourceCostCount}
            currentPage={currentPage}
            appliedFilters={appliedFilters}
            setResCostExportParams={setResCostExportParams}
            setExportType={setExportType}
          />
        )}
      </div>
    </div>
  );
};

export default Financial;
