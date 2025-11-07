import { useEffect, useMemo, useState } from 'react';
import { FilterCondition } from '../../../../types/manage-user';
import {
  ActionItem,
  ListTableColumn,
  ShowHideTableColumn,
} from '../../../../../components/table/types';
import { EditIcon } from '../../../../../assets';
import {
  ListTable,
  ManageColumnsPopover,
} from '../../../../../components/table';
import { getTaskTemplateColumns } from './columns';
import { TaskTemplateList, TaskTemplateListParams } from '../../../../types';
import { generatePath, useNavigate } from 'react-router-dom';
import { TASK_TEMPLATES_EDIT } from '../../../../../routes';
import { useTaskTemplateList } from '../../../../service/task-template/task-template-service';

interface ITaskTemplateTableProps {
  appliedFilters: Record<string, FilterCondition>;
  tableParams: TaskTemplateListParams;
  setTableParams: React.Dispatch<React.SetStateAction<TaskTemplateListParams>>;
  refreshTrigger?: number;
  columnAnchorEl: HTMLButtonElement | null;
  setColumnAnchorEl: React.Dispatch<
    React.SetStateAction<HTMLButtonElement | null>
  >;
}

export const TaskTemplateTable: React.FC<ITaskTemplateTableProps> = ({
  appliedFilters,
  tableParams,
  setTableParams,
  refreshTrigger,
  columnAnchorEl,
  setColumnAnchorEl,
}) => {
  const navigate = useNavigate();
  const [taskTemplateList, setTaskTemplateList] = useState<TaskTemplateList[]>(
    []
  );

  const { data, isLoading, isError } = useTaskTemplateList(
    { ...tableParams, filter: appliedFilters },
    refreshTrigger
  );
  const totalItems = data?.count || 0;
  useEffect(() => {
    if (data?.taskTemplates) {
      setTaskTemplateList(data?.taskTemplates || []);
    }
  }, [data?.taskTemplates]);

  const getRowId = (row: TaskTemplateList) => row.rid;

  const handleEdit = (row: TaskTemplateList) => {
    const path = generatePath(TASK_TEMPLATES_EDIT, {
      templateId: row.rid,
    });
    navigate(path);
  };

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

  const templateColumns = useMemo(() => getTaskTemplateColumns(), []);

  const [visibleColumns, setVisibleColumns] = useState<
    ListTableColumn<TaskTemplateList>[]
  >(templateColumns.filter((col) => !col.hide));

  useEffect(() => {
    const updatedColumns = templateColumns.filter((col) => !col.hide);
    setVisibleColumns(updatedColumns);
  }, [templateColumns]);

  const actionButtons: ActionItem<TaskTemplateList>[] = [
    {
      label: 'Edit',
      onClick: (row) => handleEdit(row),
      icon: EditIcon,
      iconStyle: {
        filter:
          'brightness(0) saturate(100%) invert(25%) sepia(16%) saturate(592%) hue-rotate(164deg) brightness(93%) contrast(91%)',
      },
    },
  ];

  const RestrictedColumns = [
    {
      id: 'r_number',
      canHide: false,
      canDrag: false,
    },
  ];

  const handleColumnsChange = (updatedColumns: ShowHideTableColumn[]) => {
    setVisibleColumns(
      updatedColumns.filter(
        (col) => !col.hide
      ) as ListTableColumn<TaskTemplateList>[]
    );
  };

  const handlePopoverClose = () => {
    setColumnAnchorEl(null);
  };

  const isModalOpen = Boolean(columnAnchorEl);
  const modalId = isModalOpen
    ? 'task-template-column-visibility-popover'
    : undefined;

  return (
    <>
      <ManageColumnsPopover
        anchorEl={columnAnchorEl}
        open={isModalOpen}
        popoverId={modalId}
        onClose={handlePopoverClose}
        columns={templateColumns}
        onColumnsChange={handleColumnsChange}
        columnRestrictions={RestrictedColumns}
      />
      <ListTable
        data={taskTemplateList}
        columns={visibleColumns}
        getRowId={getRowId}
        hoverHighlight={false}
        tableStyle={{
          height: '100%',
          maxHeight: 'calc(100vh - 190px)',
          overflow: 'auto',
        }}
        stickyHeader={true}
        stickyColumnsCount={2}
        // Selection
        selectable={true}
        // Actions
        actionWidth={60}
        actionDisplayMode='dropdown'
        actionMenuItems={actionButtons}
        // State
        loading={isLoading}
        error={isError ? 'Failed to load task template' : undefined}
        // Pagination
        rowsPerPageOptions={[25, 50, 100]}
        rowsPerPage={tableParams.limit}
        currentPage={(tableParams.page ?? 1) - 1}
        totalItems={totalItems}
        onPageChange={handlePageChange}
        onRowsPerPageChange={handleRowsPerPageChange}
        // Sorting
        sortBy={tableParams.sort}
        sortOrder={tableParams.sort_by}
        onSort={handleSort}
      />
    </>
  );
};
