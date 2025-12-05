import { useState } from 'react';
import { getWorkflowColumns, WorkflowRule } from './columns';
import { ShowHideTableColumn } from '../../../../../components/table/types';
import {
  ListTable,
  ManageColumnsPopover,
} from '../../../../../components/table';
interface WorkflowTableParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

interface IWorkflowTableProps {
  tableParams: WorkflowTableParams;
  setTableParams: React.Dispatch<React.SetStateAction<WorkflowTableParams>>;
  onSelectionChange: (selectedIds: string[]) => void;
  columnAnchorEl: HTMLButtonElement | null;
  setColumnAnchorEl: React.Dispatch<
    React.SetStateAction<HTMLButtonElement | null>
  >;
  refreshWorkflowTrigger?: number;
}

export const WorkflowTable: React.FC<IWorkflowTableProps> = ({
  tableParams,
  setTableParams,
  onSelectionChange,
  columnAnchorEl,
  setColumnAnchorEl,
}) => {
  // Mock data - in real implementation, this would come from an API
  const [workflowList, setWorkflowList] = useState<WorkflowRule[]>([
    {
      rid: '1',
      name: 'Notify When Assignee Changes',
      labels: ['automation', 'assignment'],
      owner: 'John Doe',
      scope: 'Account',
      updated_datetime: '2025-10-05T09:32:44.769+00:00',
      enabled: true,
      created_datetime: '2025-10-05T09:32:44.769+00:00',
      created_by: 'Admin',
    },
    {
      rid: '2',
      name: 'Reminder: Due Tomorrow',
      labels: ['notification', 'email'],
      owner: 'Jane Smith',
      scope: 'Case',
      updated_datetime: '2025-10-05T09:32:44.769+00:00',
      enabled: false,
      created_datetime: '2025-10-05T09:32:44.769+00:00',
      created_by: 'Manager',
    },
    {
      rid: '3',
      name: 'Escalate High-Priority Overdue Task',
      labels: ['status', 'update'],
      owner: 'Mike Johnson',
      scope: 'Project',
      updated_datetime: '2025-10-05T09:32:44.769+00:00',
      enabled: true,
      created_datetime: '2025-10-05T09:32:44.769+00:00',
      created_by: 'Team Lead',
    },
  ]);

  const totalItems = workflowList.length;
  const isLoading = false;
  const isError = false;

  const getRowId = (row: WorkflowRule) => row.rid;

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

  const handleToggleStatus = (rid: string, enabled: boolean) => {
    // Update the workflow status in the local state
    setWorkflowList((prevList) =>
      prevList.map((workflow) =>
        workflow.rid === rid ? { ...workflow, enabled } : workflow
      )
    );

    // Here you would typically make an API call to update the status
    console.log(
      `Toggling workflow ${rid} to ${enabled ? 'enabled' : 'disabled'}`
    );
  };

  const workflowColumns = getWorkflowColumns(handleToggleStatus);

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

  const RestrictedColumns = [
    {
      id: 'name',
      canHide: false,
      canDrag: false,
    },
  ];

  const handlePopoverClose = () => {
    setColumnAnchorEl(null);
  };

  const isModalOpen = Boolean(columnAnchorEl);
  const modalId = isModalOpen
    ? 'workflow-column-visibility-popover'
    : undefined;

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
      <ListTable
        data={workflowList}
        columns={visibleColumns}
        getRowId={getRowId}
        hoverHighlight={true}
        tableStyle={{
          height: '100%',
          maxHeight: 'calc(100vh - 195px)',
          overflow: 'auto',
        }}
        stickyHeader={true}
        stickyColumnsCount={2}
        actionWidth={50}
        // Selection
        selectable={true}
        onSelectionChange={onSelectionChange}
        // State
        loading={isLoading}
        error={isError ? 'Failed to load workflow rules' : undefined}
        emptyMessege='No workflow rules found'
        // Pagination
        rowsPerPageOptions={[25, 50, 100]}
        rowsPerPage={tableParams.limit}
        currentPage={(tableParams.page ?? 1) - 1}
        totalItems={totalItems}
        onPageChange={handlePageChange}
        onRowsPerPageChange={handleRowsPerPageChange}
        // Sorting
        sortBy={tableParams.sortBy}
        sortOrder={tableParams.sortOrder}
        onSort={handleSort}
      />
    </>
  );
};
