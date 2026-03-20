import React, { useState, useEffect } from 'react';
import {
  AuditTimelineListExportParams,
  ClosingRemarksItems,
  ExportType,
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
  setExportParams?: (params: AuditTimelineListExportParams) => void;
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
    sortOrder: 'DESC',
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
      sort: tableParams.sortBy,
      sort_by: tableParams.sortOrder,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appliedFilters, searchValue, tableParams.sortBy, tableParams.sortOrder]);

  const handleSort = (sortBy: string, sortOrder: 'asc' | 'desc') => {
    const apiOrder = sortOrder === 'asc' ? 'ASC' : 'DESC';
    setTableParams((prev) => ({ ...prev, sortBy, sortOrder: apiOrder }));
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
        sortBy={tableParams.sortBy}
        sortOrder={tableParams.sortOrder}
        onSort={handleSort}
      />
    </>
  );
};

export default ClosingRemarks;
