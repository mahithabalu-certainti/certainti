import { useEffect, useMemo, useState } from 'react';
import { AllPermissions } from '../../../../../common-service';
import { checkPermission, getFiscalYears } from '../../../../../common-utils';
import { SectionTabPanel } from '../../../../../components';
import { ExportType, TimeSheetList } from '../../../../types';
import { ImportsListURLParams } from '../../../../types/imports';
import { ResourceTabs } from '../resources/resources';
import { getTimesheetFilterFields } from './helpers';
import { useSelector } from 'react-redux';
import { RootState } from '../../../../../store/store';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import SectionHeader from '../../../../../components/details-section/section-header';
import { useTimesheetList } from '../../../../services/import';
import { TimeSheetIcon } from '../../../../../assets';
import { ListTable } from '../../../../../components/table';
import { getTimesheetListColumns } from './columns';
import TimesheetDetails from './timesheet-details';

interface TimeSheetProps {
  setExportType?: (type: ExportType) => void;
  setImportsParams: React.Dispatch<React.SetStateAction<ImportsListURLParams>>;
}

const ImportsTabs: ResourceTabs[] = [
  {
    id: AllPermissions.ACCOUNT_TIMESHEET_OVERVIEW,
    name: 'Overview',
    hide: false,
  },
];

const Timesheet: React.FC<TimeSheetProps> = ({
  setExportType,
  setImportsParams,
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
  const [refreshImports, setRefreshImports] = useState<number>(Date.now());
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

  // API Hooks
  const fileId = searchParams.get('file_id');
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
    refreshImports
  );

  // UseEffects
  useEffect(() => {
    if (data) {
      setTimesheetList(data.imports || []);
    }
  }, [data]);
  useEffect(() => {
    if (setExportType) {
      setExportType('timesheet');
    }
    setImportsParams({
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
    setRefreshImports(Date.now());
  };
  const handleBackClick = () => {
    searchParams.delete('file_id');
    searchParams.delete('tab');
    navigate({ search: searchParams.toString() }, { replace: true });
  };
  const handleDocument = (rowId: string) => {
    if (rowId) {
      searchParams.set('file_id', rowId);
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

  // Variables
  const currentYear = new Date().getFullYear();
  const fiscalYears = getFiscalYears(currentYear - 2000 + 1);
  const timesheetFilterFields = getTimesheetFilterFields(
    fiscalYears,
    permissionMap
  );
  const totalItems = data?.count || 0;
  const timesheetColumns = getTimesheetListColumns(
    handleDocument,
    handleDownload,
    permissionMap,
    isTimesheetExportEnable
  );
  const getRowId = (row: TimeSheetList) => row.rid;

  return (
    <div className='w-full pt-2 pl-2 pr-4'>
      <SectionTabPanel
        tabs={ImportsTabs}
        filterMenu={timesheetFilterFields}
        filterVisibility={viewDetails ? false : true}
        showFilter={showFilter}
        contextKey='imports'
        appliedFilters={appliedFilters}
        setAppliedFilters={setAppliedFilters}
        setCurrentPage={setCurrentPage}
        handleFilter={handleFilter}
        handleSorting={handleSorting}
        sortFilterCount={sortFilterCount}
        setSortFilterCount={setSortFilterCount}
        showRefresh={viewDetails ? false : true}
        onRefreshClick={onRefreshClick}
      />
      {viewDetails ? (
        <TimesheetDetails handleBackClick={handleBackClick} />
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
