import React, { useState, useEffect } from 'react';
import {
  ClosingRemarksItems,
  ExportType,
  ResourceSummaryListExportParams,
  ResourceSummaryListURLParams,
} from '../../../../../../types';
import { useParams, useSearchParams } from 'react-router-dom';
import {
  ListTable,
  ManageColumnsPopover,
} from '../../../../../../../components/table';
import { ShowHideTableColumn } from '../../../../../../../components/table/types';
import { getClosingRemarksColumns } from './column';
import { useClosingRemarksList } from '../../../../../../services/case-dossier/case-dossier-service';

interface ClosingRemarksProps {
  refreshTrigger: number;
  currentPage: number;
  appliedFilters: Record<string, string | number | boolean | string[]>;
  setCount: (value: number) => void;
  setExportParams?: (params: ResourceSummaryListExportParams) => void;
  setExportType?: (type: ExportType) => void;
  columnAnchorEl: HTMLButtonElement | null;
  setColumnAnchorEl: React.Dispatch<
    React.SetStateAction<HTMLButtonElement | null>
  >;
  searchValue: string;
}

const ClosingRemarks: React.FC<ClosingRemarksProps> = ({
  refreshTrigger,
  currentPage,
  appliedFilters,
  setCount,
  setExportParams,
  setExportType,
  columnAnchorEl,
  setColumnAnchorEl,
  searchValue,
}) => {
  const { caseId } = useParams();
  const [searchParams] = useSearchParams();
  const accountId = searchParams.get('accountID') || '';
  const [resourceSummary, setResourceSummary] = useState<ClosingRemarksItems[]>(
    []
  );
  const [tableParams, setTableParams] = useState<ResourceSummaryListURLParams>({
    page: currentPage + 1,
    limit: 100,
    sortBy: 'signoff_at',
    sortOrder: 'ASC',
  });

  const { data, isLoading, isError } = useClosingRemarksList(
    {
      case_rid: caseId ?? '',
      account_rid: accountId ?? '',
      sort: tableParams.sortBy,
      sort_by: tableParams.sortOrder,
    },
    refreshTrigger
  );

  const totalItems = data?.count || 0;

  useEffect(() => {
    if (data) {
      setResourceSummary(data.closingRemarks || []);
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
      setExportType('dossier-audit-timeline');
    }
    setExportParams?.({
      sortBy: tableParams.sortBy,
      sortOrder: tableParams.sortOrder,
      filters: appliedFilters,
      search: searchValue,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appliedFilters, searchValue, tableParams.sortBy, tableParams.sortOrder]);

  // Permission Management
  // const projectViewEditFields = useMemo(
  //     () =>
  //         permission.find(
  //             (item) => item.name === AllPermissions.PROJECTS_RESOURCES_VIEW_EDIT
  //         )?.fields ?? [],
  //     [permission]
  // );

  // const permissionMap = useMemo(() => {
  //     const map: Record<string, { read: boolean; edit: boolean }> = {};
  //     projectViewEditFields.forEach((item) => {
  //         map[item.name] = { read: item.read ?? false, edit: item.edit ?? false };
  //     });
  //     return map;
  // }, [projectViewEditFields]);

  // const projectListViewEditFields = useMemo(
  //     () =>
  //         permission.find((item) => item.name === AllPermissions.PROJECTS_VIEW_EDIT)
  //             ?.fields ?? [],
  //     [permission]
  // );

  // const projectPermissionMap = useMemo(() => {
  //     const map: Record<string, { read: boolean; edit: boolean }> = {};
  //     projectListViewEditFields.forEach((item) => {
  //         map[item.name] = { read: item.read ?? false, edit: item.edit ?? false };
  //     });
  //     return map;
  // }, [projectListViewEditFields]);

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

  const getRowId = (row: ClosingRemarksItems) => row.rid;

  // Column visibility states
  const isModalOpen = Boolean(columnAnchorEl);
  const handlePopoverClose = () => setColumnAnchorEl(null);

  const modalId = isModalOpen
    ? `resource-summary-list-column-visibility-popover`
    : undefined;

  const RestrictedColumns = [
    { id: 'resource_code', canHide: false, canDrag: false },
  ];

  const resourceSummaryColumns = getClosingRemarksColumns();

  const [columnVisibility, setColumnVisibility] = useState<
    Record<string, boolean>
  >(
    Object.fromEntries(resourceSummaryColumns.map((col) => [col.id, !col.hide]))
  );

  const [columnOrder, setColumnOrder] = useState(
    resourceSummaryColumns.map((col) => col.id)
  );

  const handleColumnsChange = (updatedColumns: ShowHideTableColumn[]) => {
    const newVisibility = Object.fromEntries(
      updatedColumns.map((col) => [col.id, !col.hide])
    );
    setColumnVisibility(newVisibility);
    setColumnOrder(updatedColumns.map((col) => col.id));
  };

  const visibleColumns = columnOrder
    .map((id) => resourceSummaryColumns.find((col) => col.id === id)!)
    .filter((col) => columnVisibility[col.id]);

  return (
    <>
      <ManageColumnsPopover
        anchorEl={columnAnchorEl}
        open={isModalOpen}
        popoverId={modalId}
        onClose={handlePopoverClose}
        columns={resourceSummaryColumns}
        onColumnsChange={handleColumnsChange}
        columnRestrictions={RestrictedColumns}
      />

      <ListTable
        data={resourceSummary}
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
        actionMenuItems={[]}
        loading={isLoading}
        error={isError ? 'Failed to load closing remarks data' : undefined}
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

export default ClosingRemarks;
