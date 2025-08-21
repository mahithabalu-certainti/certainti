import { useEffect, useMemo, useState } from 'react';
import { AllPermissions, useGetAllCountries, useGetStatus, } from '../../../../../common-service';
import { checkPermission, getFiscalYears } from '../../../../../common-utils';
import { SectionTabPanel } from '../../../../../components';
import {
  ExportType,
  TimeSheetList,
  TimeSheetListURLParams,
} from '../../../../types';
import { ResourceTabs } from '../resources/resources';
import { getTimesheetFilterFields } from './helpers';
import { getTimesheetProjectTabFilterFields } from './timesheet-details-tab/project-tab/project-tab-filters';
import { useSelector } from 'react-redux';
import { RootState } from '../../../../../store/store';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import SectionHeader from '../../../../../components/details-section/section-header';
import { useTimesheetList } from '../../../../services/import';
import { TimeSheetIcon } from '../../../../../assets';
import { ListTable } from '../../../../../components/table';
import { getTimesheetListColumns } from './columns';
import TimesheetDetails from './timesheet-details';
import { getTimesheetResourceTabFilterFields } from './timesheet-details-tab/resource-tab/resource-tab-filters';
import { projectTaskFilterFields } from './timesheet-details-tab/project-task/filters';
import { useGetResourceType } from '../../../../services/resource-list';
import { TimesheetProjectExportListURLParams } from '../../../../types/timesheet-projects';
import { useFetchState } from '../../../../services/account';
import { FilterValue } from '../../components/filter/filterType';

interface TimeSheetProps {
  setExportType?: (type: ExportType) => void;
  setTimesheetParams: React.Dispatch<
    React.SetStateAction<TimeSheetListURLParams>
  >;
  setTimesheetProjectParams: React.Dispatch<
    React.SetStateAction<TimesheetProjectExportListURLParams>
  >;
  setTimesheetResourceParams: React.Dispatch<
    React.SetStateAction<TimesheetProjectExportListURLParams>
  >;
  setTimesheetTaskParams: React.Dispatch<
    React.SetStateAction<TimesheetProjectExportListURLParams>
  >;
}

const TimesheetTabs: ResourceTabs[] = [
  {
    id: AllPermissions.ACCOUNT_TIMESHEET_OVERVIEW,
    name: 'Overview',
    hide: false,
  },
];

const Timesheet: React.FC<TimeSheetProps> = ({
  setExportType,
  setTimesheetParams,
  setTimesheetProjectParams,
  setTimesheetResourceParams,
  setTimesheetTaskParams,
}) => {
  // UseStates
  const [appliedFilters, setAppliedFilters] = useState<
    Record<string, string | number | boolean | string[]>
  >({});
  const [currentPage, setCurrentPage] = useState(0);
  const [showFilter, setShowFilter] = useState<boolean>(false);
  const [sortFilterCount, setSortFilterCount] = useState<number>(0);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [sortField, setSortField] = useState<string>('r_number');
  const [refreshTimesheet, setRefreshTimesheet] = useState<number>(Date.now());
  const [rowsPerPage, setRowsPerPage] = useState(100);
  const [timesheetList, setTimesheetList] = useState<TimeSheetList[]>([]);

  // hooks
  const navigate = useNavigate();
  const { accountid } = useParams();
  const [searchParams] = useSearchParams();
  const { fiscalYear } = useSelector<RootState, { fiscalYear: string }>(
    (state: RootState) => state.account
  );

  // Permission Mangement
  const { permission } = useSelector((state: RootState) => state.permission);
  const timesheetViewEditFields = useMemo(
    () =>
      permission?.find(
        (item) => item.name === AllPermissions.TIMESHEET_VIEW_EDIT
      )?.fields ?? [],
    [permission]
  );
  const permissionMap = useMemo(() => {
    const map: Record<string, { read: boolean; edit: boolean }> = {};
    timesheetViewEditFields.forEach((item) => {
      map[item.name] = { read: item.read ?? false, edit: item.edit ?? false };
    });
    return map;
  }, [timesheetViewEditFields]);


  const isTimesheetExportEnable = checkPermission(
    permission,
    AllPermissions.ACCOUNT_TIMESHEET_EXPORT
  );
  const [toggleEnabled, setToggleEnabled] = useState(false);
  const [currentCountry, setCurrentCountry] = useState<string>('');

  // API Hooks
  const fileId = searchParams.get('timesheet_id');
  const tabName = searchParams.get('tab');
  const isProjectTab = tabName === 'timesheet_project';
  const isResourceTab = tabName === 'timesheet_project_resource';
  const isProjectTaskTab = tabName === 'timesheet_project_task';
  const viewDetails = !!fileId;
  const convertedFiscalYear = fiscalYear !== 'FY-All' ? Number(fiscalYear) : 0;
  const { data, isLoading, isError } = useTimesheetList(
    {
      page: currentPage + 1,
      limit: rowsPerPage,
      sort: sortField,
      sort_by: sortOrder,
      filters: { ...appliedFilters, entity: { equals: 'project_task' } },
      account_rid: accountid || '',
      fiscal_year: convertedFiscalYear,
    },
    !viewDetails,
    refreshTimesheet
  );
  const allCountries = useGetAllCountries();
  const Regions = useFetchState(currentCountry?.toString() || '');
  const resourceTypeOptions = useGetResourceType();
  const statusOptions = useGetStatus();

  // UseEffects
  useEffect(() => {
    if (data) {
      setTimesheetList(data.imports || []);
    }
  }, [data]);
  useEffect(() => {
    if (setExportType) {
      setExportType(tabName as ExportType || 'timesheet' as ExportType);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tabName])
  useEffect(() => {
    setTimesheetParams({
      page: currentPage + 1,
      limit: rowsPerPage,
      sort: sortField,
      sort_by: sortOrder,
      filters: appliedFilters,
      account_rid: accountid || '',
      fiscal_year: convertedFiscalYear,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    sortField,
    sortOrder,
    appliedFilters,
    currentPage,
    rowsPerPage,
    convertedFiscalYear,
  ]);

  // Functions
  const handleFilter = () => {
    setShowFilter(!showFilter);
  };
  const handleSorting = (sortBy: string, sortOrder: 'asc' | 'desc') => {
    const defaultSortField = 'r_number';
    const defaultSortOrder = 'asc';

    if (!sortBy) {
      setSortFilterCount(0);
      setSortOrder(defaultSortOrder);
      setSortField(defaultSortField);
    } else {
      setSortFilterCount(1);
      setSortOrder(sortOrder);
      setSortField(sortBy);
    }
  };
  const onRefreshClick = () => {
    setRefreshTimesheet(Date.now());
  };
  const handleBackClick = () => {
    searchParams.delete('timesheet_id');
    searchParams.delete('tab');
    navigate({ search: searchParams.toString() }, { replace: true });
  };
  const handleDocument = (rowId: string) => {
    if (rowId) {
      searchParams.set('timesheet_id', rowId);
      navigate({ search: searchParams.toString() }, { replace: true });
    }
  };
  const handleDownload = (documentUrl: string) => {
    if (!documentUrl) return;

    const link = document.createElement('a');
    link.href = documentUrl;
    link.download = '';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };
  const handleRowsPerPageChange = (newPageSize: number) => {
    setRowsPerPage(newPageSize);
    setCurrentPage(1);
  };
  const handleSortRequest = (property: string, sortOrder: 'asc' | 'desc') => {
    setSortOrder(sortOrder);
    setSortField(property);
  };
  const memoizedCountry: { option: string; value: string }[] = useMemo(
    () =>
      allCountries.data?.data.country.map((country) => ({
        option: country.country_name,
        value: country.rid,
      })) || [],
    [allCountries.data?.data.country]
  );
  const memoizedRegion = useMemo(
    () =>
      Regions.data?.data.states.map((state) => ({
        option: state.state_name,
        value: state.rid,
      })) || [],
    [Regions.data?.data.states]
  );
  const memoizedResourceType = useMemo(
    () =>
      resourceTypeOptions?.data?.data?.resouceType.map((item) => ({
        option: item.resource_type_name,
        value: item.rid,
      })) || [],
    [resourceTypeOptions?.data?.data?.resouceType]
  );
  const memoizedStatus = useMemo(
    () =>
      statusOptions?.data?.data?.status.map((status: { status_name: string; rid: string }) => ({
        option: status.status_name,
        value: status.rid,
      })) || [],
    [statusOptions?.data?.data?.status]
  );
  // Variables
  const currentYear = new Date().getFullYear();
  const fiscalYears = getFiscalYears(currentYear - 2000 + 1);
  const timesheetFilterFields = getTimesheetFilterFields(
    fiscalYears,
    permissionMap
  );

  const timesheetProjectFilterFields = getTimesheetProjectTabFilterFields(
    fiscalYears,
    memoizedResourceType,
    memoizedStatus,
  );

  const timesheetResourcesFilterFields = getTimesheetResourceTabFilterFields(memoizedCountry, memoizedRegion);

  const timesheetProjectTaskFilterFields = projectTaskFilterFields(
    memoizedResourceType,
  );

  const showUploads = searchParams.get('upload') === 'true';
  const totalItems = data?.count || 0;
  const timesheetColumns = getTimesheetListColumns(
    handleDocument,
    handleDownload,
    permissionMap,
    isTimesheetExportEnable
  );
  const getRowId = (row: TimeSheetList) => row.rid;

  const getFiltersMenu = () => {
    if (isProjectTab) {
      return timesheetProjectFilterFields
    } else if (isResourceTab) {
      return timesheetResourcesFilterFields
    } else if (isProjectTaskTab) {
      return timesheetProjectTaskFilterFields
    }
    return timesheetFilterFields;
  };
  const handleCountry = (fieldName: string, value: FilterValue) => {
    if (fieldName === 'country_rid' && value) {
      setCurrentCountry(String(value));
    }
  };
  return (
    <div className='w-full pt-2 pl-2 pr-4'>
      <SectionTabPanel
        tabs={TimesheetTabs}
        filterMenu={getFiltersMenu()}
        filterVisibility={!viewDetails || isProjectTab || isResourceTab || isProjectTaskTab}
        showFilter={showFilter}
        contextKey='timesheet'
        appliedFilters={appliedFilters}
        setAppliedFilters={setAppliedFilters}
        setCurrentPage={setCurrentPage}
        handleFilter={handleFilter}
        handleSorting={handleSorting}
        sortFilterCount={sortFilterCount}
        setSortFilterCount={setSortFilterCount}
        showToggle={isProjectTab}
        toggleEnabled={toggleEnabled}
        setToggleEnabled={setToggleEnabled}
        showRefresh={!showUploads || !viewDetails || isProjectTab || isResourceTab || isProjectTaskTab}
        onRefreshClick={onRefreshClick}
        onFilterChange={handleCountry}
      />
      {viewDetails ? (
        <TimesheetDetails
          handleBackClick={handleBackClick}
          bothParentAndChild={toggleEnabled}
          appliedFilters={appliedFilters}
          setExportType={setExportType}
          onRefreshClick={refreshTimesheet}
          setTimesheetProjectParams={setTimesheetProjectParams}
          setTimesheetResourceParams={setTimesheetResourceParams}
          setTimesheetTaskParams={setTimesheetTaskParams}
        />
      ) : (
        <>
          <SectionHeader
            title='Timesheet'
            count={totalItems}
            showItemCount={true}
            titleIcon={
              <TimeSheetIcon
                className='[&>path]:stroke-white'
                alt='Timesheet-header-icon'
              />
            }
            iconBg='#34CFCA'
            bgType='circle'
          />
          <div className='border border-[#CBD6E2]'>
            <ListTable
              data={timesheetList}
              columns={timesheetColumns}
              getRowId={getRowId}
              hoverHighlight={false}
              tableStyle={{
                borderBottom: '1px solid #CBD6E2',
                height: '100%',
                maxHeight: 'calc(100vh - 290px)',
                overflow: 'auto',
              }}
              stickyHeader={true}
              stickyColumnsCount={1}
              selectable={false}
              actionWidth={80}
              actionDisplayMode='dropdown'
              actionMenuItems={[]}
              loading={isLoading}
              error={isError ? 'Failed to load imports records' : undefined}
              rowsPerPageOptions={[25, 50, 100]}
              rowsPerPage={rowsPerPage}
              currentPage={currentPage}
              totalItems={totalItems}
              onPageChange={handlePageChange}
              onRowsPerPageChange={handleRowsPerPageChange}
              sortBy={sortField}
              sortOrder={sortOrder.toUpperCase() as 'ASC' | 'DESC'}
              onSort={handleSortRequest}
            />
          </div>
        </>
      )}
    </div>
  );
};

export default Timesheet;
