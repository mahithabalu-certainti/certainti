import React, { useEffect, useMemo, useState } from 'react';
import { SectionHeaderTab, SectionTabPanel } from '../../../../../components';
import {
  AllPermissions,
  OverviewTabs,
  useGetAllCountries,
} from '../../../../../common-service';
import SectionHeader from '../../../../../components/details-section/section-header';
import { FinancialIcon } from '../../../../../assets';
import SummayListTable from './summary/summay-list';
import ResourceCost from './resource-cost/resource-cost';
import { NewProjectData } from '../../../../types/project';
import { ProjectQreAdjustmentResponse } from '../../utils';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getProjectFinancialResCostFields } from './helpers';
import { useFetchState } from '../../../../services/account';
import { FilterValue } from '../../../account-details-sidebar/components/filter/filterType';
import { useGetResourceType } from '../../../../services/resource-list';
import {
  ActivityDropdownItem,
  ColorCode,
  ExportType,
  ProjectFinancialResourceExportParams,
} from '../../../../types';
import { useSelector } from 'react-redux';
import { RootState } from '../../../../../store/store';
import { checkPermission } from '../../../../../common-utils';
import { AccessRestricted } from '../../../../../components/account-restricted';
import { BUTTON_STYLES } from '../../../../../admin/pages/manage-user-detail/styles';
import Timeline from '../../../../../pages/timeline/timeline';

const FinancialTabs: OverviewTabs[] = [
  {
    id: AllPermissions.PROJECT_FINANCIAL_OVERVIEW,
    name: 'Overview',
    hide: false,
    key: 'overview',
  },
  {
    id: AllPermissions.PROJECT_FINANCIAL_TIMELINE,
    name: 'Timeline',
    hide: false,
    // disable: true,
    key: 'timeline',
  },
];

interface ProjectFinancialProps {
  projectDetails: NewProjectData | null;
  setResCostExportParams: (
    params: ProjectFinancialResourceExportParams
  ) => void;
  setExportType: (type: ExportType) => void;
  onQreAdjustmentUpdated?: (data: ProjectQreAdjustmentResponse) => void;
  activityMenuItems: ActivityDropdownItem[];
  refetchProjectDetails: () => void;
}

const Financial: React.FC<ProjectFinancialProps> = ({
  projectDetails,
  setExportType,
  setResCostExportParams,
  onQreAdjustmentUpdated,
  activityMenuItems,
  refetchProjectDetails,
}) => {
  const navigate = useNavigate();
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
  const [columnAnchorEl, setColumnAnchorEl] =
    React.useState<HTMLButtonElement | null>(null);
  const [searchText, setSearchText] = useState('');

  const handleColumnVisibility = (
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    setColumnAnchorEl(event.currentTarget);
  };

  const [searchParams] = useSearchParams();
  const { permission } = useSelector((state: RootState) => state.permission);

  const isResourceCostViewEnable = checkPermission(
    permission,
    AllPermissions.PROJECT_FINANCIAL_RESOURCE_COST_VIEW
  );

  const isSummaryViewEnable = checkPermission(
    permission,
    AllPermissions.PROJECT_FINANCIAL_SUMMARY_VIEW
  );

  const initialTab = useMemo(() => {
    if (isSummaryViewEnable) return 'summary';
    if (isResourceCostViewEnable) return 'resource_cost';
    return 'summary';
  }, [isSummaryViewEnable, isResourceCostViewEnable]);

  useEffect(() => {
    if (searchParams.get('list') === 'financial' && !searchParams.get('tab')) {
      searchParams.set('tab', initialTab);
      navigate({ search: searchParams.toString() }, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialTab, searchParams]);

  const tabParam = searchParams.get('tab') || initialTab;

  const countriesList = useGetAllCountries();
  const region = useFetchState(currentCountry);
  const resourceTypeOptions = useGetResourceType();
  const isTimeLineView = searchParams.get('timelineview') === 'true';
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
    navigate({ search: searchParams.toString() }, { replace: true });
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

  const headerButtons = [
    {
      label: 'Show/Hide Fields',
      variant: 'outlined' as const,
      disabled: false,
      onClick: handleColumnVisibility,
      sx: { ...BUTTON_STYLES, width: '125px', minWidth: '125px' },
      hide: tabParam === 'resource_cost' ? false : true,
    },
  ];

  if (!isSummaryViewEnable && !isResourceCostViewEnable)
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
        showSearch={tabParam === 'resource_cost'}
        onSearch={(text) => setSearchText(text)}
        showAddActivity={true}
        activityMenuItems={activityMenuItems}
      />
      {isTimeLineView ? (
        <div className='border border-[#CBD6E2] rounded-[2px] overflow-auto'>
          <Timeline entitytype='project' />
        </div>
      ) : (
        <div>
          <SectionHeader
            title='Financial Summary'
            titleIcon={
              <FinancialIcon
                alt='financial-header-icon'
                className={`[&>path]:stroke-[${ColorCode.accountTextColor}] w-[14px] h-[14px]`}
              />
            }
            count={resourceCostCount}
            showItemCount={tabParam === 'resource_cost'}
            iconBg={ColorCode.projectBgColor}
            bgType='circle'
            buttons={headerButtons}
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
              <SummayListTable
                projectDetails={projectDetails}
                onQreAdjustmentUpdated={onQreAdjustmentUpdated}
                refetchProjectDetails={refetchProjectDetails}
              />
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
                setColumnAnchorEl={setColumnAnchorEl}
                columnAnchorEl={columnAnchorEl}
                searchValue={searchText}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Financial;
