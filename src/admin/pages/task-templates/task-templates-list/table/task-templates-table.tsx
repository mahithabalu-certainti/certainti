import { useEffect, useMemo, useState } from 'react';
import { FilterCondition } from '../../../../types/manage-user';
import {
  ActionItem,
  CellEditData,
  FieldChangeValue,
  ShowHideTableColumn,
} from '../../../../../components/table/types';
import { EditIcon } from '../../../../../assets';
import {
  ListTable,
  ManageColumnsPopover,
} from '../../../../../components/table';
import { getTaskTemplateColumns } from './columns';
import {
  TaskTemplateDetails,
  TaskTemplateList,
  TaskTemplateListParams,
} from '../../../../types';
import { generatePath, useNavigate } from 'react-router-dom';
import {
  TASK_TEMPLATES_DETAILS,
  TASK_TEMPLATES_EDIT,
} from '../../../../../routes';
import {
  useGetTaskAssignRoleTypes,
  useGetTaskCategoryTypes,
  useGetTaskCheckListTypes,
  useGetTaskMilestoneTypes,
  useGetTaskPriorityTypes,
  useGetTaskWeightAgeTypes,
  useTaskTemplateList,
} from '../../../../service/task-template/task-template-service';
import { TASK_TEMPLATE } from '../../../../../api/graphql/queries/task-template-query';
import { useMutation } from '@apollo/client';
import { caseClient } from '../../../../../api/graphql/clients/client';
import { useToast } from '../../../../../hooks';
import { AllPermissions, useGetStatus } from '../../../../../common-service';
import { SelectOption } from '../../../../../consultant/types';
import { useSelector } from 'react-redux';
import { RootState } from '../../../../../store/store';

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
  const { errorToast } = useToast();
  const [taskTemplateList, setTaskTemplateList] = useState<TaskTemplateList[]>(
    []
  );
  const [updateTaskTemplate] = useMutation(TASK_TEMPLATE, {
    client: caseClient,
  });
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
  const statusOptions = useGetStatus();

  const taskMilestoneTypes = useGetTaskMilestoneTypes();
  const taskPrioritytTypes = useGetTaskPriorityTypes();
  const taskCheckListTypes = useGetTaskCheckListTypes();
  const taskAssignRoleTypes = useGetTaskAssignRoleTypes();
  const taskWeightAgeTypes = useGetTaskWeightAgeTypes();
  const taskCategoryTypes = useGetTaskCategoryTypes();

  const taskMilestoneTypesOptions = useMemo(() => {
    return (
      taskMilestoneTypes?.data?.data?.map((item) => ({
        value: item.rid,
        label: item.milestone_name,
      })) || []
    );
  }, [taskMilestoneTypes]);
  const taskPrioritytTypesTypesOptions = useMemo(() => {
    return (
      taskPrioritytTypes?.data?.data?.map((item) => ({
        value: item.rid,
        label: item.priority_name,
      })) || []
    );
  }, [taskPrioritytTypes]);
  const taskCheckListTypesTypesOptions = useMemo(() => {
    return (
      taskCheckListTypes?.data?.data?.map((item) => ({
        value: item.rid,
        label: item.checklist_name,
      })) || []
    );
  }, [taskCheckListTypes]);
  const taskAssigneRoleTypesTypesOptions = useMemo(() => {
    return (
      taskAssignRoleTypes?.data?.data?.caseRoles?.map((item) => ({
        value: item.rid,
        label: item.role_name,
      })) || []
    );
  }, [taskAssignRoleTypes]);
  const memoizedStatus: SelectOption[] = useMemo(
    () =>
      statusOptions?.data?.data?.status.map((status) => ({
        label: status?.status_name,
        value: status?.rid,
        desc: status?.status_description,
      })) || [],
    [statusOptions?.data?.data?.status]
  );

  const taskWeightAgeTypesOptions = useMemo(() => {
    return (
      taskWeightAgeTypes?.data?.data?.data?.map((item) => ({
        value: item.rid,
        label: item.weightage_value,
      })) || []
    );
  }, [taskWeightAgeTypes]);
  const taskCategoryTypesOptions = useMemo(() => {
    return (
      taskCategoryTypes?.data?.data?.map((item) => ({
        value: item.rid,
        label: item.category_name,
      })) || []
    );
  }, [taskCategoryTypes]);
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
  const handleViewDetails = (row: TaskTemplateDetails) => {
    const path = generatePath(TASK_TEMPLATES_DETAILS, {
      templateId: row.rid,
    });
    navigate(path);
  };
  const taskColumns = getTaskTemplateColumns(
    taskMilestoneTypesOptions,
    taskPrioritytTypesTypesOptions,
    taskCheckListTypesTypesOptions,
    taskAssigneRoleTypesTypesOptions,
    memoizedStatus,
    taskCategoryTypesOptions,
    taskWeightAgeTypesOptions,
    permissionMap,
    handleViewDetails
  );
  const [columnOrder, setColumnOrder] = useState(
    taskColumns.map((col) => col.id)
  );
  const [columnVisibility, setColumnVisibility] = useState<
    Record<string, boolean>
  >(Object.fromEntries(taskColumns.map((col) => [col.id, !col.hide])));

  const visibleColumns = columnOrder
    .map((id) => taskColumns.find((col) => col.id === id)!)
    .filter((col) => columnVisibility[col.id]);

  const handleColumnsChange = (updatedColumns: ShowHideTableColumn[]) => {
    const newVisibility = Object.fromEntries(
      updatedColumns.map((col) => [col.id, !col.hide])
    );
    setColumnVisibility(newVisibility);
    setColumnOrder(updatedColumns.map((col) => col.id));
  };

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

  const handlePopoverClose = () => {
    setColumnAnchorEl(null);
  };

  const handleCellEdit = async (rowId: string, updates: CellEditData[]) => {
    const previousTaskTemplateList = [...taskTemplateList];

    const matchedTask = taskTemplateList.find((task) => task.rid === rowId);
    if (!matchedTask) {
      return;
    }

    const updateData = updates.reduce<Record<string, FieldChangeValue>>(
      (usr, item) => {
        const key = item.editId || item.columnId;
        usr[key] = item.value;
        return usr;
      },
      {
        rid: rowId,
      }
    );

    try {
      const res = await updateTaskTemplate({
        variables: { data: updateData },
      });
      const result = res.data?.UpdateTaskTemplateInline;

      if (result?.statusCode === 200 && result.data) {
        const updatedItem = result.data;
        setTaskTemplateList((prev) =>
          prev.map((item) =>
            item.rid === updatedItem.rid ? { ...item, ...updatedItem } : item
          )
        );
      } else {
        errorToast(result?.statusMessage || 'Failed to update field');
        setTaskTemplateList(previousTaskTemplateList);
      }
    } catch (error) {
      errorToast((error as Error)?.message || 'Failed to update field');
      setTaskTemplateList(previousTaskTemplateList);
    }
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
        columns={taskColumns}
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
        onCellEdit={handleCellEdit}
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
