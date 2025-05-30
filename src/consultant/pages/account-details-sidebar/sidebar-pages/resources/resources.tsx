/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import {
  useLocation,
  useNavigate,
  useParams,
  useSearchParams,
} from 'react-router-dom';
import { resourceProfileIcon } from '../../../../../assets';
import { RESOURCE, RESOURCE_CREATE } from '../../../../../routes';
import { RootState } from '../../../../../store/store';
import { useResourceList } from '../../../../services/resource-list';
import { AccountData } from '../../../account-details/utils';
import TabPanel from '../../components/tab';
import { getResourceColumns } from './columns';
import ResourceSubComponents from './resource-sub-components';
import ResourceTableHeader from './resource-table-header';
import { ResourceCostList } from '../../../../types/resource-cost';
import {
  ExportModule,
  ResourceSkillList,
} from '../../../../types/resource-skill';
import { ResourceList } from '../../../../types/resource';
import { AllPermissions, Permissions } from '../../../../../common-service';
import { checkPermission } from '../../../../../common-utils';
import { ListTable } from '../../../../../components/table';
import { clearFilters } from '../../components/filter/utils';

const BUTTON_STYLES = {
  height: '24px !important',
  fontSize: '13px',
  fontWeight: 600,
  borderRadius: '2px',
};

interface ResourceProps {
  permission?: Permissions[];
  accountDetails?: Record<string, any>;
  activeKey?: string;
  setTableParams?: React.Dispatch<React.SetStateAction<ExportModule>>;
  setExportType?: (type: 'resource' | 'cost' | 'skill') => void;
}

export interface ResourceTabs {
  id: AllPermissions;
  name: string;
  hide: boolean;
}

export interface TabMenus {
  label: string;
  value: string;
  hide: boolean;
  id: AllPermissions;
}

const resourceTabs: ResourceTabs[] = [
  { id: AllPermissions.RESOURCES_OVERVIEW, name: 'Overview', hide: false },
  {
    id: AllPermissions.RESOURCE_VIEW_TIMELINE,
    name: 'Timeline',
    hide: false,
  },
];

const tabs: TabMenus[] = [
  {
    label: 'Details',
    value: 'details',
    hide: false,
    id: AllPermissions.RESOURCE_VIEW,
  },
  {
    label: 'Resource Cost',
    value: 'cost',
    hide: false,
    id: AllPermissions.RESOURCE_COST_VIEW,
  },
  {
    label: 'Resource Skill',
    value: 'skill',
    hide: false,
    id: AllPermissions.RESOURCE_SKILL_VIEW,
  },
];

const Resource: React.FC<ResourceProps> = ({
  accountDetails,
  permission,
  setTableParams,
  setExportType,
}) => {
  const [resourceTab, setResourceTab] = useState(resourceTabs);
  const [tabMenus, setTabMenus] = useState<TabMenus[]>(tabs);
  const [viewResourceList, setViewResourceList] = useState<boolean>(true);
  // const [columns, setColumns] = useState<any>([]);
  const [showFilter, setShowFilter] = useState<boolean>(false);
  const [filterVisibility, setFilterVisibility] = useState<boolean>(true);
  const [value, setValue] = useState(''); // Resource inner tab value
  const [appliedFilters, setAppliedFilters] = useState<Record<string, any>>({});
  const [showBackArrow, setShowBackArrow] = useState<boolean>(false);
  const [resourceData, setResourceData] = useState<any>({});
  const [currentPage, setCurrentPage] = useState(0);
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('DESC');
  const [sortField, setSortField] = useState<string>('created_datetime');
  const [costOrder, setCostOrder] = useState<'asc' | 'desc'>('desc');
  const [costorderBy, setCostOrderBy] =
    useState<keyof ResourceCostList>('created_datetime');
  const [skillOrder, setSkillOrder] = useState<'asc' | 'desc'>('desc');
  const [skillOrderBy, setSkillOrderBy] =
    useState<keyof ResourceSkillList>('created_datetime');
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const { fiscalYear } = useSelector<RootState, { fiscalYear: string }>(
    (state: RootState) => state.account
  );
  const [resourceNumber, setResourceNumber] = useState<string | null>(null);
  const convertedFiscalYear = fiscalYear !== 'FY-All' ? Number(fiscalYear) : 0;
  const accountInActive =
    accountDetails?.data?.accountById?.status === 'inactive';

  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { accountid } = useParams();
  const {
    data: ResourceList,
    isLoading,
    error,
  } = useResourceList({
    page: currentPage + 1, // API expects 1-based index
    limit: rowsPerPage,
    accountNumber: accountDetails?.data?.accountById.r_number,
    sortBy: sortField,
    sortOrder: sortOrder,
    filters: appliedFilters,
  });

  // Permission Mangement
  const isResourceDownloadEnable = checkPermission(
    permission || [],
    AllPermissions.RESOURCES_DOWNLOAD
  );
  const isResourceCostDownloadEnable = checkPermission(
    permission || [],
    AllPermissions.RESOURCE_COST_DOWNLOAD
  );
  const isResourceSkillDownloadEnable = checkPermission(
    permission || [],
    AllPermissions.RESOURCE_SKILL_DOWNLOAD
  );
  const isResourceViewAllEnable = checkPermission(
    permission || [],
    AllPermissions.RESOURCE_VIEW_ALL
  );
  const isResourceCreateEnable = checkPermission(
    permission || [],
    AllPermissions.RESOURCE_CREATE
  );
  const isResourceDeleteEnable = checkPermission(
    permission || [],
    AllPermissions.RESOURCE_DELETE
  );
  const isResourceEditEnable = checkPermission(
    permission || [],
    AllPermissions.RESOURCE_EDIT
  );
  const isResourceCostCreateEnable = checkPermission(
    permission || [],
    AllPermissions.RESOURCE_COST_CREATE
  );
  const isResourceSkillCreateEnable = checkPermission(
    permission || [],
    AllPermissions.RESOURCE_SKILL_CREATE
  );
  const isResoureceOverviewHide = resourceTab[0].hide;

  useEffect(() => {
    const isHide = (tab: ResourceTabs | TabMenus) => {
      return (
        !permission?.find((item) => item.name === tab.id)?.is_enabled || false
      );
    };
    // updated sub tabs(Overview, Timeline)
    setResourceTab(
      resourceTabs.map((tab) => ({
        ...tab,
        hide: isHide(tab),
      }))
    );
    // updated sub tabs(Details, Cost, Skill)
    const updatedTabs = tabs.map((tab) => ({ ...tab, hide: isHide(tab) }));
    setTabMenus(updatedTabs);
    // assign default tab value
    const activeTab = updatedTabs.find((tab) => !tab.hide)?.value;
    setValue(activeTab as string);
  }, [permission]);

  useEffect(() => {
    if (searchParams.get('res_id') && ResourceList) {
      const refId = searchParams.get('res_id') as string;
      const resourceNumber = ResourceList?.resource?.find(
        (resource: ResourceList) => resource.rid === refId
      )?.r_number;
      setResourceNumber(resourceNumber ?? '');
    } else {
      setResourceNumber(null);
    }
  }, [searchParams, ResourceList]);

  const handleFilter = () => {
    setShowFilter(!showFilter);
  };

  const handleTabChange = (_: React.SyntheticEvent, newValue: string) => {
    // setValue(newValue);
    setShowFilter(false);
    setAppliedFilters({});
    clearFilters(value || 'resource');
    // update the URL with the tab value
    searchParams.set('tab', newValue);
    navigate({ search: searchParams.toString() });
    setCurrentPage(0);
  };

  const handleResourceClick = (row: any) => {
    setResourceData(row);
    setViewResourceList(!viewResourceList);
    setShowBackArrow(!showBackArrow);
    setShowFilter(false);
    setFilterVisibility(false);
    setAppliedFilters({});
    clearFilters(value || 'resource');
  };

  useEffect(() => {
    // update the URL when open a resource sub tab
    if (!viewResourceList && resourceData.rid) {
      searchParams.set('res_id', resourceData.rid);
      searchParams.set('tab', value);
      navigate({ search: searchParams.toString() });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resourceData.rid, viewResourceList, value]);

  // useEffect(() => {
  //   setColumns(getResourceColumns(handleResourceClick));
  // }, []);

  useEffect(() => {
    // update sub tab when refereshing the page
    const tab = searchParams.get('tab');
    if (tab) {
      setValue(tab);
      setViewResourceList(false);
      setShowBackArrow(true);
    }
  }, [searchParams]);

  const handleEdit = (resource: any) => {
    setFilterVisibility(false);
    navigate(RESOURCE + '/edit/' + resource.rid + `?account_id=${accountid}`, {
      state: { resource, accountDetails, resources: true },
    });
  };

  const actionMenuItems = [
    {
      label: 'Edit',
      onClick: handleEdit,
      disabled: accountInActive,
      hide: !isResourceEditEnable,
    },
    {
      label: 'Delete',
      onClick: (row: any) => console.log('Delete', row),
      disabled: accountInActive || !isResourceDeleteEnable,
      hide: !isResourceDeleteEnable,
    },
    {
      label: 'View Summary',
      onClick: (row: any) => console.log('Summary', row),
    },
    {
      label: 'View Activities',
      onClick: (row: any) => console.log('Activities', row),
    },
    {
      label: 'View Notes',
      onClick: (row: any) => console.log('Notes', row),
    },
  ];

  const handleCreateButtonEnable = () => {
    if (value === 'details' || value === '') {
      return !isResourceCreateEnable;
    } else if (value === 'cost') {
      return !isResourceCostCreateEnable;
    } else if (value === 'skill') {
      return !isResourceSkillCreateEnable;
    }
    return accountInActive;
  };

  const handleDownloadButtonEnable = () => {
    if (value === 'details' || value === '') {
      return !isResourceDownloadEnable;
    } else if (value === 'cost') {
      return !isResourceCostDownloadEnable;
    } else if (value === 'skill') {
      return !isResourceSkillDownloadEnable;
    }
    return false;
  };

  const headerButtons = [
    {
      label: 'New',
      variant: 'outlined' as const,
      onClick: () => handleCreateResource(),
      sx: { ...BUTTON_STYLES, width: '48px', minWidth: '48px' },
      hide: handleCreateButtonEnable(),
    },
    {
      label: 'Download',
      variant: 'outlined' as const,
      onClick: () => console.log('Download'),
      sx: { ...BUTTON_STYLES, width: '96px', minWidth: '96px' },
      hide: handleDownloadButtonEnable(),
    },
  ];

  const handleBackClick = () => {
    setViewResourceList(!viewResourceList);
    setShowBackArrow(!showBackArrow);
    setShowFilter(false);
    // clear query params
    searchParams.delete('res_id');
    searchParams.delete('tab');
    navigate(
      {
        pathname: location.pathname,
        search: searchParams.toString(),
      },
      {
        state: { ...location.state, activeKey: 'resources' },
        replace: true,
      }
    );
    setFilterVisibility(true);
    setAppliedFilters({});
    clearFilters(value || 'resource');
  };

  const handleCreateResource = () => {
    const resId = searchParams.get('res_id');
    if (value === 'cost') {
      navigate(`${RESOURCE}/cost/create${resId ? `?res_id=${resId}` : ''}`, {
        state: {
          ...accountDetails,
          resourceData,
          cost: true,
          sectionName: 'Financial Information',
        },
      });
    } else if (value === 'skill') {
      navigate(`${RESOURCE}/skill/create${resId ? `?res_id=${resId}` : ''}`, {
        state: {
          ...accountDetails,
          resourceData,
          skill: true,
          sectionName: 'Skill Information',
        },
      });
    } else {
      navigate(
        `${RESOURCE_CREATE}?account_id=${accountid}${resId ? `&res_id=${resId}` : ''}`,
        {
          state: { accountDetails, resourceCreate: true },
        }
      );
    }
  };

  // export function need handle in download btn export droopdown in parent

  useEffect(() => {
    const updatedParams: Partial<ExportModule> = {
      sortBy: '',
      sortOrder: 'DESC',
      resourceRid: searchParams.get('res_id') || '',
      rNumber: accountDetails?.data?.accountById?.r_number,
    };

    if (value === 'cost') {
      updatedParams.sortBy = costorderBy;
      updatedParams.sortOrder = costOrder.toUpperCase() as 'ASC' | 'DESC';
      setExportType?.('cost');
    } else if (value === 'skill') {
      updatedParams.sortBy = skillOrderBy;
      updatedParams.sortOrder = skillOrder.toUpperCase() as 'ASC' | 'DESC';
      setExportType?.('skill');
    } else {
      updatedParams.sortBy = sortField;
      updatedParams.sortOrder = sortOrder;
      setExportType?.('resource');
    }

    setTableParams?.((prev) => ({
      ...prev,
      ...updatedParams,
    }));
  }, [
    value,
    costOrder,
    costorderBy,
    skillOrder,
    skillOrderBy,
    sortField,
    sortOrder,
    searchParams,
    setTableParams,
    setExportType,
    accountDetails?.data?.accountById?.r_number,
  ]);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const handleRowsPerPageChange = (newPageSize: number) => {
    setRowsPerPage(newPageSize);
    setCurrentPage(1);
  };

  const handleSortRequest = (property: string, sortOrder: 'asc' | 'desc') => {
    const apiOrder = sortOrder === 'asc' ? 'ASC' : 'DESC';
    setSortOrder(apiOrder);
    setSortField(property);
  };

  const getRowId = (row: ResourceList) => row.rid;

  const resourceColumns = getResourceColumns(handleResourceClick);

  return (
    <div className='w-full py-3 pl-3 pr-4'>
      <TabPanel
        resourceTab={resourceTab}
        value={value}
        appliedFilters={appliedFilters}
        setAppliedFilters={(data) => {
          setAppliedFilters(data);
        }}
        showFilter={showFilter}
        filterVisibility={
          isResoureceOverviewHide
            ? false
            : isResourceViewAllEnable
              ? filterVisibility
              : false
        }
        handleFilter={handleFilter}
        setCurrentPage={setCurrentPage}
      />
      {!isResoureceOverviewHide && isResourceViewAllEnable && (
        <>
          <ResourceTableHeader
            value={value}
            title='Resources'
            resourceNumber={resourceData?.r_number ?? resourceNumber}
            titleIcon={
              <img src={resourceProfileIcon} alt='resource header icon' />
            }
            headerButtons={headerButtons}
            showBackArrow={showBackArrow}
            onBackClick={handleBackClick}
          />
          {!viewResourceList ? (
            <ResourceSubComponents
              permission={permission}
              tabMenus={tabMenus}
              setFilterVisibility={setFilterVisibility}
              handleTabChange={handleTabChange}
              value={value}
              resourceId={searchParams.get('res_id') as string}
              accountId={accountDetails?.data?.accountById?.r_number}
              appliedFilters={appliedFilters || {}}
              fiscalYearValue={convertedFiscalYear}
              accountDetails={accountDetails as AccountData}
              setShowFilter={setShowFilter}
              currentPage={currentPage}
              setCurrentPage={setCurrentPage}
              costOrder={costOrder}
              setCostOrder={setCostOrder}
              costorderBy={costorderBy}
              setCostorderBy={setCostOrderBy}
              skillOrder={skillOrder}
              setSkillOrder={setSkillOrder}
              skillOrderBy={skillOrderBy}
              setSkillOrderBy={setSkillOrderBy}
            />
          ) : (
            <div className='border border-[#CBD6E2]'>
              <ListTable
                data={ResourceList?.resource as any}
                columns={resourceColumns}
                getRowId={getRowId}
                hoverHighlight={false}
                tableStyle={{
                  borderBottom: '1px solid #CBD6E2',
                  overflow: 'auto',
                }}
                stickyHeader={false}
                stickyColumnsCount={1}
                selectable={false}
                actionWidth={150}
                actionDisplayMode='dropdown'
                actionMenuItems={actionMenuItems}
                loading={isLoading}
                error={error ? 'Failed to load resource data' : undefined}
                rowsPerPage={rowsPerPage}
                currentPage={currentPage}
                totalItems={ResourceList?.count || 0}
                onPageChange={handlePageChange}
                onRowsPerPageChange={handleRowsPerPageChange}
                sortBy={sortField}
                sortOrder={sortOrder}
                onSort={handleSortRequest}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Resource;
