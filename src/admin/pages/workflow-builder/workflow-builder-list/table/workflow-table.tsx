import { useEffect, useMemo, useState } from 'react';
import { getWorkflowColumns } from './columns';
import { ShowHideTableColumn } from '../../../../../components/table/types';
import {
  ListTable,
  ManageColumnsPopover,
} from '../../../../../components/table';
import {
  useWorkflowRuleList,
  useUpdateRuleStatus,
} from '../../../../service/workflow-builder/workflow-builder-service';
import {
  WorkflowRuleListItem,
  WorkflowRuleListURLParams,
} from '../../../../types';
import { AllPermissions, FilterTypes } from '../../../../../common-service';
import { generatePath, useNavigate } from 'react-router-dom';
import { WORKFLOW_BUILDER_EDIT } from '../../../../../routes';
import RuleMapModal from '../components/rule-map-modal';
import { RootState } from '../../../../../store/store';
import { useSelector } from 'react-redux';

interface IWorkflowTableProps {
  appliedFilters: FilterTypes;
  tableParams: WorkflowRuleListURLParams;
  setTableParams: React.Dispatch<
    React.SetStateAction<WorkflowRuleListURLParams>
  >;
  refreshTrigger?: number;
  columnAnchorEl: HTMLButtonElement | null;
  setColumnAnchorEl: React.Dispatch<
    React.SetStateAction<HTMLButtonElement | null>
  >;
  searchValue?: string;
}

export const WorkflowTable: React.FC<IWorkflowTableProps> = ({
  appliedFilters,
  tableParams,
  setTableParams,
  refreshTrigger,
  setColumnAnchorEl,
  columnAnchorEl,
  searchValue,
}) => {
  const navigate = useNavigate();
  const [workflowList, setWorkflowList] = useState<WorkflowRuleListItem[]>([]);

  // Rule Map Modal State
  const [isRuleMapModalOpen, setIsRuleMapModalOpen] = useState(false);
  const [selectedRuleData, setSelectedRuleData] =
    useState<WorkflowRuleListItem | null>(null);
  // Permission Management
  const { permission } = useSelector((state: RootState) => state.permission);

  const {
    data,
    isLoading,
    isError,
    refetch: refetchList,
  } = useWorkflowRuleList(
    {
      ...tableParams,
      search: searchValue,
      filters: appliedFilters,
    },
    refreshTrigger
  );

  const updateRuleStatus = useUpdateRuleStatus();

  const totalItems = data?.count || 0;

  useEffect(() => {
    if (data) {
      setWorkflowList(data.rules || []);
    }
  }, [data]);

  // Permissions
  const workflowFieldsEditable = useMemo(
    () =>
      permission
        .find((item) => item.name === AllPermissions.WORKFLOW_BUILDER_VIEW_EDIT)
        ?.fields?.some((field) => field.edit),
    [permission]
  );

  const workflowEditFields = useMemo(
    () =>
      permission?.find(
        (item) => item.name === AllPermissions.WORKFLOW_BUILDER_VIEW_EDIT
      )?.fields ?? [],
    [permission]
  );

  const permissionMap = useMemo(() => {
    const map: Record<string, { read: boolean; edit: boolean }> = {};
    workflowEditFields.forEach((item) => {
      map[item.name] = { read: item.read ?? false, edit: item.edit ?? false };
    });
    return map;
  }, [workflowEditFields]);

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

  const getRowId = (row: WorkflowRuleListItem) => row?.rid || '';

  const handleToggleStatus = async (
    rowData: WorkflowRuleListItem,
    enabled: boolean
  ) => {
    // Store the previous state for rollback
    const previousState = workflowList.find(
      (workflow) => workflow.rid === rowData.rid
    )?.is_active;

    // Optimistic update - immediately update the UI
    setWorkflowList((prevList) =>
      prevList.map((workflow) =>
        workflow.rid === rowData.rid
          ? { ...workflow, is_active: enabled }
          : workflow
      )
    );

    updateRuleStatus.mutate(
      {
        rule_rid: rowData.rid,
        is_active: enabled,
      },
      {
        onSuccess: () => {
          refetchList();
        },
        onError: () => {
          setWorkflowList((prevList) =>
            prevList.map((workflow) =>
              workflow.rid === rowData.rid
                ? { ...workflow, is_active: previousState ?? !enabled }
                : workflow
            )
          );
        },
      }
    );
  };

  const handleCreateRuleMap = (rowData: WorkflowRuleListItem) => {
    setSelectedRuleData(rowData);
    setIsRuleMapModalOpen(true);
  };

  const handleRuleMapModalClose = () => {
    setIsRuleMapModalOpen(false);
    setSelectedRuleData(null);
  };

  const handleRuleMapSuccess = () => {
    refetchList();
  };

  const handleEdit = (row: WorkflowRuleListItem) => {
    const path = generatePath(WORKFLOW_BUILDER_EDIT, {
      ruleId: row?.rid || '',
    });
    navigate(`${path}`);
  };

  const actionMenuItems = [
    {
      label: 'Edit',
      onClick: (row: WorkflowRuleListItem) => handleEdit(row),
      hide: !workflowFieldsEditable,
    },
  ];

  const workflowColumns = getWorkflowColumns(
    handleToggleStatus,
    handleCreateRuleMap,
    permissionMap
  );

  const handlePopoverClose = () => {
    setColumnAnchorEl(null);
  };
  const isModalOpen = Boolean(columnAnchorEl);

  const modalId = isModalOpen
    ? 'workflow-list-column-visibility-popover'
    : undefined;

  const RestrictedColumns = [
    {
      id: 'rule_name',
      canHide: false,
      canDrag: false,
    },
  ];

  const [columnVisibility, setColumnVisibility] = useState<
    Record<string, boolean>
  >(Object.fromEntries(workflowColumns.map((col) => [col.id, !col.hide])));

  const [columnOrder, setColumnOrder] = useState(
    workflowColumns.map((col) => col.id)
  );

  const handleColumnsChange = (updatedColumns: ShowHideTableColumn[]) => {
    const newVisibility = Object.fromEntries(
      updatedColumns.map((col) => [col.id, !col.hide])
    );
    setColumnVisibility(newVisibility);
    setColumnOrder(updatedColumns.map((col) => col.id));
  };

  const visibleColumns = columnOrder
    .map((id) => workflowColumns.find((col) => col.id === id)!)
    .filter((col) => columnVisibility[col.id]);

  return (
    <>
      <ManageColumnsPopover
        anchorEl={columnAnchorEl}
        open={isModalOpen}
        popoverId={modalId}
        onClose={handlePopoverClose}
        columns={workflowColumns}
        onColumnsChange={handleColumnsChange}
        columnRestrictions={RestrictedColumns}
      />

      <RuleMapModal
        open={isRuleMapModalOpen}
        onClose={handleRuleMapModalClose}
        scopeTypeName={selectedRuleData?.scope_type_name || ''}
        scopeTypeRid={selectedRuleData?.scope_type_rid || ''}
        ruleRid={selectedRuleData?.rid || ''}
        isRuleMapped={selectedRuleData?.is_rule_mapped || false}
        onSuccess={handleRuleMapSuccess}
        eventType={selectedRuleData?.event_type}
      />

      <ListTable
        data={workflowList || []}
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
        selectable={true}
        onSelectionChange={(selectedIds) =>
          console.log('Selected:', selectedIds)
        }
        actionWidth={60}
        actionDisplayMode='dropdown'
        actionMenuItems={actionMenuItems}
        loading={isLoading}
        error={isError ? 'Failed to load data' : undefined}
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
