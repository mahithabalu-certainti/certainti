import { useEffect, useMemo, useState } from 'react';
import { FilterCondition } from '../../../../../../types/manage-user';
import {
  TaskTemplateList,
  TaskTemplateListParams,
} from '../../../../../../types';
import { useTaskTemplateList } from '../../../../../../service/task-template/task-template-service';
import { useSelector } from 'react-redux';
import { RootState } from '../../../../../../../store/store';
import { AllPermissions } from '../../../../../../../common-service';
import { getTaskTemplateColumns } from './columns';
import { ListTable } from '../../../../../../../components/table';

interface ITaskTemplateTableProps {
  appliedFilters: Record<string, FilterCondition>;
  tableParams: TaskTemplateListParams;
  setTableParams: React.Dispatch<React.SetStateAction<TaskTemplateListParams>>;
  refreshTrigger?: number;
  onSelectionChange?: (selectedIds: string[]) => void;
  setTotalCount: (count: number) => void;
  initialSelectedIds?: string[];
}

export const TaskTemplateTable: React.FC<ITaskTemplateTableProps> = ({
  appliedFilters,
  tableParams,
  setTableParams,
  refreshTrigger,
  onSelectionChange,
  setTotalCount,
  initialSelectedIds,
}) => {
  const [taskTemplateList, setTaskTemplateList] = useState<TaskTemplateList[]>(
    []
  );
  const { data, isLoading, isError } = useTaskTemplateList(
    { ...tableParams, filter: appliedFilters },
    refreshTrigger
  );

  const totalItems = data?.count || 0;
  useEffect(() => {
    if (data) {
      setTaskTemplateList(data?.taskTemplates || []);
      setTotalCount(data.count || 0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  const getRowId = (row: TaskTemplateList) => row.rid;

  const handleSort = (sort: string, sort_by: 'asc' | 'desc') => {
    const apiOrder = sort_by === 'asc' ? 'ASC' : 'DESC';
    setTableParams((prev) => ({
      ...prev,
      sort,
      sort_by: apiOrder,
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

  const { permission } = useSelector((state: RootState) => state.permission);
  const taskViewEditFields = useMemo(
    () =>
      permission?.find(
        (item) => item.name === AllPermissions.TASK_TEMPLATE_VIEW_EDIT
      )?.fields ?? [],
    [permission]
  );

  const permissionMap = useMemo(() => {
    const map: Record<string, { read: boolean; edit: boolean }> = {};
    taskViewEditFields.forEach((item) => {
      map[item.name] = { read: item.read ?? false, edit: item.edit ?? false };
    });
    return map;
  }, [taskViewEditFields]);

  const taskColumns = getTaskTemplateColumns(permissionMap);

  return (
    <>
      <ListTable
        data={taskTemplateList}
        columns={taskColumns}
        getRowId={getRowId}
        hoverHighlight={false}
        tableStyle={{
          height: '100%',
          maxHeight: 'calc(100vh - 400px)',
          overflow: 'auto',
        }}
        stickyHeader={true}
        stickyColumnsCount={2}
        // Selection
        selectable={true}
        // Actions
        actionWidth={60}
        actionDisplayMode='dropdown'
        actionMenuItems={[]}
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
        // Selection callback
        onSelectionChange={(selectedIds) => {
          onSelectionChange?.(selectedIds);
        }}
        initialSelectedIds={initialSelectedIds}
      />
    </>
  );
};
