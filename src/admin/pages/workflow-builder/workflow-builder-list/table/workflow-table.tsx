import { useEffect, useState } from 'react';
import { getWorkflowColumns } from './columns';
import { ShowHideTableColumn } from '../../../../../components/table/types';
import {
  ListTable,
  ManageColumnsPopover,
} from '../../../../../components/table';
import { useWorkflowRuleList } from '../../../../service/workflow-builder/workflow-builder-service';
import {
  WorkflowRuleListItem,
  WorkflowRuleListURLParams,
} from '../../../../types';
import { FilterTypes } from '../../../../../common-service';
import { generatePath, useNavigate } from 'react-router-dom';
import { WORKFLOW_BUILDER_EDIT } from '../../../../../routes';

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

  const { data, isLoading, isError } = useWorkflowRuleList(
    {
      ...tableParams,
      search: searchValue,
      filters: appliedFilters,
    },
    refreshTrigger
  );

  const totalItems = data?.count || 0;

  useEffect(() => {
    if (data) {
      setWorkflowList(data.rules || []);
    }
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

  const getRowId = (row: WorkflowRuleListItem) => row?.rid || '';

  // const handleToggleStatus = (rid: string, enabled: boolean) => {
  //   // Update the workflow status in the local state
  //   setWorkflowList((prevList) =>
  //     prevList.map((workflow) =>
  //       workflow.rid === rid ? { ...workflow, enabled } : workflow
  //     )
  //   );

  //   // Here you would typically make an API call to update the status
  //   console.log(
  //     `Toggling workflow ${rid} to ${enabled ? 'enabled' : 'disabled'}`
  //   );
  // };

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
      // hide: !notesFieldsEditable,
    },
  ];

  const workflowColumns = getWorkflowColumns();

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
