import React, { useState, useEffect, useMemo } from 'react';
import {
  ExportType,
  TechnicalSummaryExportListParams,
  TechnicalSummaryList,
  TechnicalSummaryListURLParams,
} from '../../../../../../types';
import { useParams, useSearchParams } from 'react-router-dom';
import {
  ListTable,
  ManageColumnsPopover,
} from '../../../../../../../components/table';
import { ShowHideTableColumn } from '../../../../../../../components/table/types';
import { useSelector } from 'react-redux';
import { RootState } from '../../../../../../../store/store';
import { AllPermissions } from '../../../../../../../common-service';
import { getTechnicalSummaryListColumns } from '../../../technical-summary/columns';
import { useCasesTechnicalSummaryList } from '../../../../../../services/case-technical-summary/technical-summary-service';

interface TechnicalSummaryProps {
  refreshTrigger: number;
  currentPage: number;
  appliedFilters: Record<string, string | number | boolean | string[]>;
  setCount: (value: number) => void;
  setExportParams?: (params: TechnicalSummaryExportListParams) => void;
  setExportType?: (type: ExportType) => void;
  columnAnchorEl: HTMLButtonElement | null;
  setColumnAnchorEl: React.Dispatch<
    React.SetStateAction<HTMLButtonElement | null>
  >;
  searchValue: string;
  fiscalYear: number;
}

const TechnicalSummary: React.FC<TechnicalSummaryProps> = ({
  refreshTrigger,
  currentPage,
  appliedFilters,
  setCount,
  setExportParams,
  setExportType,
  columnAnchorEl,
  setColumnAnchorEl,
}) => {
  const { caseId } = useParams();
  const [searchParams] = useSearchParams();
  const accountId = searchParams.get('accountID') || '';
  const [technicalSummary, setTechnicalSummary] = useState<
    TechnicalSummaryList[]
  >([]);
  const [tableParams, setTableParams] = useState<TechnicalSummaryListURLParams>(
    {
      page: currentPage + 1,
      limit: 100,
      sortBy: 'r_number',
      sortOrder: 'ASC',
    }
  );

  const { data, isLoading, isError } = useCasesTechnicalSummaryList(
    {
      page: currentPage + 1,
      limit: tableParams.limit,
      sortOrder: tableParams.sortOrder,
      sortBy: tableParams.sortBy,
      filters: appliedFilters,
      account_rid: accountId || '',
      case_rid: caseId || '',
    },
    refreshTrigger,
    true
  );

  const totalItems = data?.count || 0;

  useEffect(() => {
    if (data) {
      setTechnicalSummary(data.techSummaryInfo || []);
      setCount(data.count || 0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  useEffect(() => {
    setTableParams((prev) => ({
      ...prev,
      page: currentPage + 1,
      filters: appliedFilters,
    }));
  }, [currentPage, appliedFilters]);

  useEffect(() => {
    if (setExportType) {
      setExportType('dossier-technical-summary');
    }
    setExportParams?.({
      sortOrder: tableParams.sortOrder,
      sortBy: tableParams.sortBy,
      filters: appliedFilters,
      case_rid: caseId || '',
      account_rid: accountId || '',
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    appliedFilters,
    tableParams.sortBy,
    tableParams.sortOrder,
    tableParams.limit,
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

  const getRowId = (row: TechnicalSummaryList) => row.rid;

  // Column visibility states
  const isModalOpen = Boolean(columnAnchorEl);
  const handlePopoverClose = () => setColumnAnchorEl(null);

  const modalId = isModalOpen
    ? `technical-summary-list-column-visibility-popover`
    : undefined;

  const RestrictedColumns = [
    { id: 'r_number', canHide: false, canDrag: false },
  ];

  const { permission } = useSelector((state: RootState) => state.permission);

  const technicalSummaryViewEditFields = useMemo(
    () =>
      permission?.find(
        (item) =>
          item.name === AllPermissions.PROJECT_TECHNICAL_SUMMARY_VIEW_EDIT
      )?.fields ?? [],
    [permission]
  );

  const permissionMap = useMemo(() => {
    const map: Record<string, { read: boolean; edit: boolean }> = {};
    technicalSummaryViewEditFields.forEach((item) => {
      map[item.name] = { read: item.read ?? false, edit: item.edit ?? false };
    });
    return map;
  }, [technicalSummaryViewEditFields]);

  const technicalSummaryColumns = getTechnicalSummaryListColumns(
    undefined,
    permissionMap
  );

  const [columnVisibility, setColumnVisibility] = useState<
    Record<string, boolean>
  >(
    Object.fromEntries(
      technicalSummaryColumns.map((col) => [col.id, !col.hide])
    )
  );

  const [columnOrder, setColumnOrder] = useState(
    technicalSummaryColumns.map((col) => col.id)
  );

  const handleColumnsChange = (updatedColumns: ShowHideTableColumn[]) => {
    const newVisibility = Object.fromEntries(
      updatedColumns.map((col) => [col.id, !col.hide])
    );
    setColumnVisibility(newVisibility);
    setColumnOrder(updatedColumns.map((col) => col.id));
  };

  const visibleColumns = columnOrder
    .map((id) => technicalSummaryColumns.find((col) => col.id === id)!)
    .filter((col) => columnVisibility[col.id]);

  return (
    <>
      <ManageColumnsPopover
        anchorEl={columnAnchorEl}
        open={isModalOpen}
        popoverId={modalId}
        onClose={handlePopoverClose}
        columns={technicalSummaryColumns}
        onColumnsChange={handleColumnsChange}
        columnRestrictions={RestrictedColumns}
      />

      <ListTable
        data={technicalSummary}
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
        error={isError ? 'Failed to load technical summary data' : undefined}
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

export default TechnicalSummary;
