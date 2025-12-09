import { useSelector } from 'react-redux';
import { TaskList, TasksListURLParams } from '../../../../types/task';
import { RootState } from '../../../../../store/store';
import { useEffect, useState } from 'react';
import { useAllTasksList } from '../../../../services/tasks/tasks-service';
import {
  ActionItem,
  ListTableColumn,
  ShowHideTableColumn,
} from '../../../../../components/table/types';
import {
  ListTable,
  ManageColumnsPopover,
} from '../../../../../components/table';
import {
  // checkPermission,
  reshapeGlobalFilter,
} from '../../../../../common-utils';
import { AccountList, FilterState } from '../../../../types';
// import { useToast } from '../../../../../hooks';
// import { AllPermissions } from '../../../../../common-service';
import { getTaskTableColumns } from './columns';
import { EditIcon } from '../../../../../assets';

interface ITaskTableProps {
  appliedFilters: Record<string, string | number | boolean>;
  tableParams: TasksListURLParams;
  setTableParams: React.Dispatch<React.SetStateAction<TasksListURLParams>>;
  setTotalCount: React.Dispatch<React.SetStateAction<number>>;
  refreshTrigger?: number;
  fieldOptions: any;
  setCurrentCategory: (rowId: string) => void;
  columnAnchorEl: HTMLButtonElement | null;
  setColumnAnchorEl: React.Dispatch<
    React.SetStateAction<HTMLButtonElement | null>
  >;
  searchValue?: string;
}

export const TaskTable: React.FC<ITaskTableProps> = ({
  appliedFilters,
  tableParams,
  setTableParams,
  setTotalCount,
  refreshTrigger,
  setColumnAnchorEl,
  columnAnchorEl,
  searchValue,
}) => {
  // const { errorToast } = useToast();
  const { fiscalYear, filters } = useSelector<
    RootState,
    { filters: unknown; fiscalYear: string }
  >((state: RootState) => state.account);
  const [taskList, setTaskList] = useState<TaskList[]>([]);
  // const { permission } = useSelector((state: RootState) => state.permission);
  const newFiscalYear = fiscalYear !== 'FY-All' ? Number(fiscalYear) : 0;

  const { data, isLoading, isError } = useAllTasksList(
    {
      ...tableParams,
      filters: appliedFilters,
      globalFilters: reshapeGlobalFilter(filters as FilterState),
      search: searchValue,
      fiscalYear: newFiscalYear,
    },
    refreshTrigger
  );
  const totalItems = data?.data?.count || data?.data?.totalCount || 0;

  useEffect(() => {
    if (data?.data) {
      setTotalCount(data.data.count || data.data.totalCount || 0);
      setTaskList(data.data.tasks || []);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  const handleSort = (sortBy: string, sortOrder: 'asc' | 'desc') => {
    const apiOrder = sortOrder === 'asc' ? 'ASC' : 'DESC';
    setTableParams((prev) => ({
      ...prev,
      sortBy,
      sortOrder: apiOrder,
    }));
  };

  const handlePageChange = (newPage: number) => {
    setTableParams((prev) => ({
      ...prev,
      page: newPage + 1,
    }));
  };

  const handleRowsPerPageChange = (newLimit: number) => {
    setTableParams((prev) => ({
      ...prev,
      limit: newLimit,
      page: 1,
    }));
  };

  // Permissions
  // const taskViewEditFields = useMemo(
  //   () =>
  //     permission?.find(
  //       (item) => item.name === AllPermissions.ATTACHMENT_VIEW_EDIT
  //     )?.fields ?? [],
  //   [permission]
  // );

  // const isTaskExportEnable = checkPermission(
  //   permission,
  //   AllPermissions.ATTACHMENT_EXPORT
  // );

  // const permissionMap = useMemo(() => {
  //   const map: Record<string, { read: boolean; edit: boolean }> = {};
  //   taskViewEditFields.forEach((item) => {
  //     map[item.name] = { read: item.read ?? false, edit: item.edit ?? false };
  //   });
  //   return map;
  // }, [taskViewEditFields]);

  const getRowId = (row: TaskList) => row.task_rid;

  const tasksColumns = getTaskTableColumns((row) => {
    console.log('Task clicked:', row);
  });

  const actionButtons: ActionItem<TaskList>[] = [
    {
      label: 'Edit',
      onClick: (row: TaskList) => console.log('Edit clicked:', row),
      icon: EditIcon,
      hide: false,
      iconStyle: {
        filter:
          'brightness(0) saturate(100%) invert(25%) sepia(16%) saturate(592%) hue-rotate(164deg) brightness(93%) contrast(91%)',
      },
    },
  ];

  const [visibleColumns, setVisibleColumns] = useState<
    ListTableColumn<TaskList>[]
  >(tasksColumns.filter((col) => !col.hide));

  const handleColumnsChange = (updatedColumns: ShowHideTableColumn[]) => {
    setVisibleColumns(
      updatedColumns.filter((col) => !col.hide) as ListTableColumn<TaskList>[]
    );
  };

  const handlePopoverClose = () => {
    setColumnAnchorEl(null);
  };

  const RestrictedColumns = [
    {
      id: 'r_number',
      canHide: false,
      canDrag: false,
    },
  ];

  const isModalOpen = Boolean(columnAnchorEl);
  const modalId = isModalOpen ? 'task-column-visibility-popover' : undefined;

  return (
    <>
      <ManageColumnsPopover
        anchorEl={columnAnchorEl}
        open={isModalOpen}
        popoverId={modalId}
        onClose={handlePopoverClose}
        columns={tasksColumns}
        onColumnsChange={handleColumnsChange}
        columnRestrictions={RestrictedColumns}
      />
      <ListTable
        data={taskList || []}
        columns={visibleColumns}
        getRowId={getRowId}
        hoverHighlight={false}
        tableStyle={{
          height: '100%',
          maxHeight: 'calc(100vh - 180px)',
          overflow: 'auto',
        }}
        stickyHeader={true}
        stickyColumnsCount={1}
        selectable={true}
        onSelectionChange={(selectedIds) =>
          console.log('Selected:', selectedIds)
        }
        actionWidth={60}
        actionDisplayMode='dropdown'
        actionMenuItems={actionButtons}
        loading={isLoading}
        error={isError ? 'Failed to load Tasks data' : undefined}
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
