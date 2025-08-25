import { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { useParams, useSearchParams } from 'react-router-dom';
import { RootState } from '../../../../../../../store/store';
import { ListTable } from '../../../../../../../components/table';
import { AllModules, AllPermissions } from '../../../../../../../common-service';
import { useTimesheetResourceTableList } from '../../../../../../services/import';
import { getResourceTabTableColumns } from './columns';
import { TimesheetProjectExportListURLParams, TimesheetResourceListType } from '../../../../../../types/timesheet-projects';
import { checkPermission } from '../../../../../../../common-utils';
import { AccessRestricted } from '../../../../../../../components/account-restricted';

interface ProjectTabListProps {
    documentRid: string;
    appliedFilters?: Record<string, string | number | boolean | string[]>;
    onRefreshClick?: number;
    setTimesheetResourceParams: React.Dispatch<
        React.SetStateAction<TimesheetProjectExportListURLParams>
    >;

}

const TimesheetResourcesTab: React.FC<ProjectTabListProps> = ({ documentRid,
    appliedFilters,
    onRefreshClick,
    setTimesheetResourceParams }) => {
    const [currentPage, setCurrentPage] = useState(0);
    const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('ASC');
    const [sortField, setSortField] = useState<string>('resource_code');
    const [rowsPerPage, setRowsPerPage] = useState(100);
    const [projectTabList, setProjectTabList] = useState<TimesheetResourceListType[]>([]);

    // hooks
    const { accountid } = useParams();
    const [searchParams] = useSearchParams();

    // Permission Mangement
    const { modules, permission } = useSelector((state: RootState) => state.permission);
    const timesheetResourcesIsEnable = checkPermission(
        modules,
        AllModules.PROJECT_RESOURCES
    );
    // TODO: Have to update view & edit permissions
    const timesheetResourceViewEditFields = useMemo(
        () =>
            permission?.find((item) => item.name === AllPermissions.PROJECTS_RESOURCES_VIEW_EDIT)
                ?.fields ?? [],
        [permission]
    );
    const permissionMap = useMemo(() => {
        const map: Record<string, { read: boolean; edit: boolean }> = {};
        timesheetResourceViewEditFields.forEach((item) => {
            map[item.name] = { read: item.read ?? false, edit: item.edit ?? false };
        });
        return map;
    }, [timesheetResourceViewEditFields]);

    // API Hooks
    const tabName = searchParams.get('tab');
    const isResourceTable = tabName === 'timesheet_project_resource';
    const viewDetails = !!isResourceTable;

    const { data: projectApiListData, isLoading, isError } = useTimesheetResourceTableList(
        {
            page: currentPage + 1,
            limit: rowsPerPage,
            sort: sortField,
            sort_by: sortOrder,
            filters: { ...appliedFilters },
            account_rid: accountid || '',
            documentRid: documentRid
        },
        viewDetails,
        onRefreshClick
    );

    useEffect(() => {
        if (projectApiListData) {
            setProjectTabList(projectApiListData.timesheet_resources || []);
        }
    }, [projectApiListData]);
    useEffect(() => {
        setTimesheetResourceParams({
            sortOrder: sortOrder,
            sortBy: sortField,
            filters: appliedFilters,
            account_rid: accountid || '',
            documentRid: documentRid,
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        sortField,
        sortOrder,
        appliedFilters,
        accountid,
        documentRid
    ]);

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

    const projectTabTableColumns = getResourceTabTableColumns(
        permissionMap,
    );
    if (!timesheetResourcesIsEnable) return <AccessRestricted />;
    return (
        <div className='border border-[#CBD6E2]'>
            <ListTable
                data={projectTabList as TimesheetResourceListType[]}
                columns={projectTabTableColumns}
                getRowId={(row: TimesheetResourceListType): string => row.rid || ''}
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
                sortOrder={sortOrder}
                onSort={(property: string, sortOrder: 'asc' | 'desc') =>
                    handleSortRequest(property, sortOrder.toUpperCase() as 'ASC' | 'DESC')}
            />
        </div>

    );
};

export default TimesheetResourcesTab;
