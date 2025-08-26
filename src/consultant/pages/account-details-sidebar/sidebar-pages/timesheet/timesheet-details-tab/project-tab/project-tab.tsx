import { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { useParams, useSearchParams } from 'react-router-dom';
import { RootState } from '../../../../../../../store/store';
import { ListTable } from '../../../../../../../components/table';
import {
  AllModules,
  AllPermissions,
} from '../../../../../../../common-service';
import { useTimesheetProjectTableList } from '../../../../../../services/import';
import { getProjectTabTableColumns } from './columns';
import {
  TimesheetProjectList,
  TimesheetProjectExportListURLParams,
} from '../../../../../../types/timesheet-projects';
import { AccessRestricted } from '../../../../../../../components/account-restricted';
import { checkPermission } from '../../../../../../../common-utils';

interface ProjectTabListProps {
  bothParentAndChild: boolean;
  documentRid: string;
  appliedFilters?: Record<string, string | number | boolean | string[]>;
  onRefreshClick?: number;
  setTimesheetProjectParams: React.Dispatch<
    React.SetStateAction<TimesheetProjectExportListURLParams>
  >;
}

const TimesheetProjectTab: React.FC<ProjectTabListProps> = ({
  bothParentAndChild,
  documentRid,
  appliedFilters,
  onRefreshClick,
  setTimesheetProjectParams,
}) => {
  const [currentPage, setCurrentPage] = useState(0);
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('ASC');
  const [sortField, setSortField] = useState<string>('project_code');
  const [rowsPerPage, setRowsPerPage] = useState(100);
  const [projectTabList, setProjectTabList] = useState<TimesheetProjectList[]>(
    []
  );

  const { accountid } = useParams();
  const [searchParams] = useSearchParams();
  const { fiscalYear } = useSelector<RootState, { fiscalYear: string }>(
    (state: RootState) => state.account
  );

  // Permission Mangement
  const { modules, permission } = useSelector(
    (state: RootState) => state.permission
  );
  const timesheetProjectIsEnable = checkPermission(
    modules,
    AllModules.PROJECTS
  );
  // TODO: Have to update view & edit permissions
  const timesheet_Project_ViewEditFields = useMemo(
    () =>
      permission?.find(
        (item) => item.name === AllPermissions.PROJECTS_VIEW_EDIT
      )?.fields ?? [],
    [permission]
  );
  const permissionMap = useMemo(() => {
    const map: Record<string, { read: boolean; edit: boolean }> = {};
    timesheet_Project_ViewEditFields.forEach((item) => {
      map[item.name] = { read: item.read ?? false, edit: item.edit ?? false };
    });
    return map;
  }, [timesheet_Project_ViewEditFields]);

  // API Hooks
  const tabName = searchParams.get('tab');
  const isTaskTable = tabName === 'timesheet_project';
  const viewDetails = !!isTaskTable;
  const convertedFiscalYear = fiscalYear !== 'FY-All' ? Number(fiscalYear) : 0;
  const {
    data: projectApiListData,
    isLoading,
    isError,
  } = useTimesheetProjectTableList(
    {
      page: currentPage + 1,
      limit: rowsPerPage,
      sort: sortField,
      sort_by: sortOrder,
      filters: appliedFilters,
      account_rid: accountid || '',
      fiscalYear: convertedFiscalYear,
      bothParentAndChild,
      documentRid,
    },
    viewDetails,
    onRefreshClick
  );

  useEffect(() => {
    if (projectApiListData) {
      setProjectTabList(projectApiListData.timesheet_projects || []);
    }
  }, [projectApiListData]);

  useEffect(
    () => {
      setTimesheetProjectParams({
        sortOrder: sortOrder,
        sortBy: sortField,
        filters: appliedFilters,
        account_rid: accountid || '',
        fiscalYear: convertedFiscalYear,
        bothParentAndChild,
        documentRid,
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      sortField,
      sortOrder,
      appliedFilters,
      convertedFiscalYear,
      bothParentAndChild,
      documentRid,
    ]
  );

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };
  const handleRowsPerPageChange = (newPageSize: number) => {
    setRowsPerPage(newPageSize);
    setCurrentPage(1);
  };
  const handleSortRequest = (property: string, sortOrder: 'ASC' | 'DESC') => {
    setSortOrder(sortOrder);
    setSortField(property);
  };

  const totalItems = projectApiListData?.count || 0;
  const projectTabTableColumns = getProjectTabTableColumns(permissionMap);
  if (!timesheetProjectIsEnable) return <AccessRestricted />;
  return (
    <div className='border border-[#CBD6E2]'>
      <ListTable
        data={projectTabList as TimesheetProjectList[]}
        columns={projectTabTableColumns}
        getRowId={(row: TimesheetProjectList): string => row.rid || ''}
        hoverHighlight={false}
        tableStyle={{
          height: '100%',
          maxHeight: 'calc(100vh - 290px)',
          overflow: 'auto',
        }}
        stickyHeader={true}
        expandAllParent={true}
        expandable={true}
        childrenKey='ProjectFiscal'
        maxNestingLevel={2}
        stickyColumnsCount={1}
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
        sortOrder={sortOrder}
        onSort={(property: string, sortOrder: 'asc' | 'desc') =>
          handleSortRequest(property, sortOrder.toUpperCase() as 'ASC' | 'DESC')
        }
        selectable={false}
        onSelectionChange={(selectedIds) =>
          console.log('Selected:', selectedIds)
        }
        component='timesheet-project'
      />
    </div>
  );
};

export default TimesheetProjectTab;
