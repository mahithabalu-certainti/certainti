/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { useEffect, useMemo, useState } from 'react';
//Commented lines for future use
// import { checkPermission, getFiscalYears } from '../../../../../common-utils';
// import { SectionTabPanel } from '../../../../../components';
// import {
// AccountDetailsResponse,
// ExportType,
// Project,
// } from '../../../../types';
// import { ImportsListURLParams } from '../../../../types/imports';
// import { ResourceTabs } from '../resources/resources';
// import { getTimesheetFilterFields } from './helpers';
import { useSelector } from 'react-redux';
import { useParams, useSearchParams } from 'react-router-dom';
// import ImportFile from './import-file';
// import SectionHeader from '../../../../../components/details-section/section-header';
// import { TimeSheetIcon } from '../../../../../assets';
import { RootState } from '../../../../../../../store/store';
import { ListTable } from '../../../../../../../components/table';
import { AllPermissions } from '../../../../../../../common-service';
import { useTimesheetProjectTableList } from '../../../../../../services/import';
// import { checkPermission } from '../../../../../../../common-utils';
import { getProjectTabTableColumns } from './columns';
import { TimesheetProjectList } from '../../../../../../types/timesheet-projects';
import { ExportType } from '../../../../../../types';

interface projectTabListProps {
  bothParentAndChild: boolean;
  documentRid: string;
  appliedFilters?: Record<string, string | number | boolean | string[]>;
  setExportType?: (type: ExportType) => void;
  onRefreshClick?: number;
}

const TimesheetProjectTab: React.FC<projectTabListProps> = ({
  bothParentAndChild,
  documentRid,
  appliedFilters,
  setExportType,
  onRefreshClick,
}) => {
  const [currentPage, setCurrentPage] = useState(0);
  // const [showFilter, setShowFilter] = useState<boolean>(false);
  // const [sortFilterCount, setSortFilterCount] = useState<number>(0);
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('ASC');
  const [sortField, setSortField] = useState<string>('project_code');
  const [rowsPerPage, setRowsPerPage] = useState(100);
  const [projectTabList, setProjectTabList] = useState<TimesheetProjectList[]>(
    []
  );

  // hooks
  // const navigate = useNavigate();
  const { accountid } = useParams();
  const [searchParams] = useSearchParams();
  const { fiscalYear } = useSelector<RootState, { fiscalYear: string }>(
    (state: RootState) => state.account
  );

  // Permission Mangement
  const { permission } = useSelector((state: RootState) => state.permission);
  // TODO: Have to update view & edit permissions
  const timesheet_Project_ViewEditFields = useMemo(
    () =>
      permission?.find((item) => item.name === AllPermissions.PROJECTS_VIEW_EDIT)
        ?.fields ?? [],
    [permission]
  );
  const permissionMap = useMemo(() => {
    const map: Record<string, { read: boolean; edit: boolean }> = {};
    timesheet_Project_ViewEditFields.forEach((item) => {
      map[item.name] = { read: item.read ?? false, edit: item.edit ?? false };
    });
    return map;
  }, [timesheet_Project_ViewEditFields]);
  // TODO: Have to update export permissions
  // const isTimesheetProjectExportEnable = checkPermission(
  //     permission,
  //     AllPermissions.IMPORTS_EXPORT
  // );

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
      filters: { ...appliedFilters },
      account_rid: accountid || '',
      fiscal_year: convertedFiscalYear,
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
      if (setExportType) {
        setExportType('timesheet_project');
      }
      // setTimesheetParams({
      //   page: currentPage + 1,
      //   limit: rowsPerPage,
      //   sort: sortField,
      //   sort_by: sortOrder,
      //   filters: appliedFilters,
      //   account_rid: accountid || '',
      //   fiscal_year: convertedFiscalYear,
      // });
      // eslint-disable-next-line react-hooks/exhaustive-deps
    },
    [
      // sortField,
      // sortOrder,
      // appliedFilters,
      // currentPage,
      // rowsPerPage,
      // convertedFiscalYear,
    ]
  );

  // const handleBackClick = () => {
  //     searchParams.delete('timesheet_id');
  //     searchParams.delete('tab');
  //     navigate({ search: searchParams.toString() }, { replace: true });
  // };

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
          handleSortRequest(property, sortOrder.toUpperCase() as 'ASC' | 'DESC')}
        selectable={false}
        onSelectionChange={(selectedIds) =>
          console.log('Selected:', selectedIds)
        }
        component='project'
      />
    </div>
  );
};

export default TimesheetProjectTab;
