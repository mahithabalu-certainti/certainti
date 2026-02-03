import React, { useEffect, useState } from 'react';
import {
  generatePath,
  useNavigate,
  useParams,
  useSearchParams,
} from 'react-router-dom';
import {
  ActivityList,
  ActivityListExportURLParams,
  ActivityListURLParams,
  ActivityModuleType,
  ActivityType,
  ExportType,
} from '../../../types';
import {
  ListTableColumn,
  ShowHideTableColumn,
} from '../../../../components/table/types';
import { useActivityList } from '../../../services/activities/activities-service';
import { ListTable, ManageColumnsPopover } from '../../../../components/table';
import { ACTIVITY_EDIT } from '../../../../routes';

interface ActivityListTableProps {
  refreshTrigger: number;
  currentPage: number;
  appliedFilters: Record<string, string | number | boolean | string[]>;
  setCount: (value: number) => void;
  columnAnchorEl: HTMLButtonElement | null;
  setColumnAnchorEl: React.Dispatch<
    React.SetStateAction<HTMLButtonElement | null>
  >;
  searchValue: string;
  activityType: ActivityType;
  columns: ListTableColumn<ActivityList>[];
  accountInActive?: boolean;
  entityDetails?: {
    r_number: string;
    module: string;
    source: string;
    fiscalYear?: string | number;
  };
  entityLevel: 'account' | 'case' | 'project';
  setExportType?: (type: ExportType) => void;
  setActivityParams: React.Dispatch<
    React.SetStateAction<ActivityListExportURLParams>
  >;
  editButtonEnable?: boolean;
  activityEditPermissionByType?: Record<ActivityModuleType, boolean>;
}

const ActivityListTable: React.FC<ActivityListTableProps> = ({
  refreshTrigger,
  currentPage,
  appliedFilters,
  setCount,
  columnAnchorEl,
  setColumnAnchorEl,
  searchValue,
  activityType,
  columns,
  accountInActive,
  entityDetails,
  entityLevel,
  setActivityParams,
  setExportType,
  editButtonEnable = true,
  activityEditPermissionByType,
}) => {
  const navigate = useNavigate();
  const { caseId, accountid, projectid } = useParams();
  const [searchParams] = useSearchParams();
  const accountId = searchParams.get('accountID') || '';
  const activityId = searchParams.get('activity_id');
  const viewDetails = !!activityId;

  const [activityData, setActivityData] = useState<ActivityList[]>([]);
  const [tableParams, setTableParams] = useState<ActivityListURLParams>({
    page: currentPage + 1,
    limit: 100,
    sortBy: 'r_number',
    sortOrder: 'ASC',
  });

  const { data, isLoading, isError } = useActivityList(
    {
      ...tableParams,
      search: searchValue,
      filters: appliedFilters,
      entityId: caseId || accountid || projectid || '',
      accountRid: accountId || accountid || '',
      attachmentLevel: entityLevel || 'account',
      activity_type: activityType,
    },
    !viewDetails,
    refreshTrigger
  );

  const totalItems = data?.count || 0;

  useEffect(() => {
    if (data) {
      setActivityData(data.activities || []);
      setCount(data.count || 0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  useEffect(() => {
    setTableParams((prev) => ({
      ...prev,
      page: currentPage + 1,
      filters: appliedFilters,
      search: searchValue,
    }));
  }, [currentPage, appliedFilters, searchValue]);

  useEffect(() => {
    if (setExportType) {
      setExportType('activities');
    }
    setActivityParams({
      sortBy: tableParams.sortBy,
      sortOrder: tableParams.sortOrder,
      filters: appliedFilters,
      search: searchValue,
      activity_type: activityType,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    appliedFilters,
    searchValue,
    tableParams.sortBy,
    tableParams.sortOrder,
    activityType,
  ]);

  const handleSort = (sortBy: string, sortOrder: 'asc' | 'desc') => {
    const apiOrder = sortOrder === 'asc' ? 'ASC' : 'DESC';
    setTableParams((prev) => ({ ...prev, sortBy, sortOrder: apiOrder }));
  };

  const handlePageChange = (newPage: number) => {
    setTableParams((prev) => ({ ...prev, page: newPage + 1 }));
  };

  const handleRowsPerPageChange = (newLimit: number) => {
    setTableParams((prev) => ({ ...prev, limit: newLimit, page: 1 }));
  };

  const getRowId = (row: ActivityList) => row.rid;

  const handleEdit = (row: ActivityList) => {
    if (row.activity_type?.toLowerCase() === 'task') {
      searchParams.set('activity_id', row.rid);
      searchParams.set('activity_type', 'task');
      navigate({ search: searchParams.toString() }, { replace: true });
    } else {
      const path = generatePath(ACTIVITY_EDIT, {
        module: entityDetails?.module || '',
        activityId: row.rid,
        type: row.activity_type?.toLowerCase() || activityType,
      });
      const queryParams = new URLSearchParams({
        accountId: accountId || accountid || '',
        entityLevel: row.attachment_level || entityDetails?.module || '',
        entityId: row.attach_to || '',
        source: entityDetails?.source || '',
      });
      navigate(`${path}?${queryParams.toString()}`);
    }
  };

  const shouldDisableEdit = (row: ActivityList): boolean => {
    const type = row.activity_type.toLowerCase() as ActivityModuleType;

    // 1️⃣ For ALL tab → check permission by activity type
    if (activityType === 'all') {
      if (!activityEditPermissionByType?.[type]) return true;
    }

    // 2️⃣ Disable when account is inactive
    if (accountInActive) return true;

    // 3️⃣ Email: disable when already sent
    if (type === 'email' && row.status_name?.toLowerCase() === 'sent') {
      return true;
    }

    return false;
  };

  const actionMenuItems = [
    {
      label: 'Edit',
      disabled: (row: ActivityList) => shouldDisableEdit(row),
      onClick: (row: ActivityList) => handleEdit(row),
      hide: activityType !== 'all' && !editButtonEnable,
    },
  ];

  // Column visibility states
  const isModalOpen = Boolean(columnAnchorEl);
  const handlePopoverClose = () => setColumnAnchorEl(null);

  const modalId = isModalOpen
    ? `activity-${activityType || 'all'}-list-column-visibility-popover`
    : undefined;

  const RestrictedColumns = [
    { id: 'r_number', canHide: false, canDrag: false },
  ];

  const [columnVisibility, setColumnVisibility] = useState<
    Record<string, boolean>
  >(Object.fromEntries(columns.map((col) => [col.id, !col.hide])));

  const [columnOrder, setColumnOrder] = useState(columns.map((col) => col.id));

  const handleColumnsChange = (updatedColumns: ShowHideTableColumn[]) => {
    const newVisibility = Object.fromEntries(
      updatedColumns.map((col) => [col.id, !col.hide])
    );
    setColumnVisibility(newVisibility);
    setColumnOrder(updatedColumns.map((col) => col.id));
  };

  const visibleColumns = columnOrder
    .map((id) => columns.find((col) => col.id === id)!)
    .filter((col) => columnVisibility[col.id]);

  return (
    <>
      <ManageColumnsPopover
        anchorEl={columnAnchorEl}
        open={isModalOpen}
        popoverId={modalId}
        onClose={handlePopoverClose}
        columns={columns}
        onColumnsChange={handleColumnsChange}
        columnRestrictions={RestrictedColumns}
      />

      <ListTable
        data={activityData}
        columns={visibleColumns}
        getRowId={getRowId}
        hoverHighlight={false}
        tableStyle={{
          height: '100%',
          maxHeight: 'calc(100vh - 420px)',
          overflow: 'auto',
        }}
        stickyHeader={true}
        stickyColumnsCount={1}
        selectable={false}
        actionWidth={80}
        actionDisplayMode='dropdown'
        actionMenuItems={activityType === 'task' ? [] : actionMenuItems}
        loading={isLoading}
        error={isError ? 'Failed to load activity data' : undefined}
        rowsPerPageOptions={[25, 50, 100]}
        rowsPerPage={tableParams.limit}
        currentPage={(tableParams.page ?? 1) - 1}
        totalItems={totalItems}
        onPageChange={handlePageChange}
        onRowsPerPageChange={handleRowsPerPageChange}
        sortBy={tableParams.sortBy}
        sortOrder={tableParams.sortOrder}
        onSort={handleSort}
      />
    </>
  );
};

export default ActivityListTable;
