import React, { useState, useEffect } from 'react';
import {
  ExportType,
  ProjectDocumentsListURLParams,
} from '../../../../../../types';
import { useParams, useSearchParams } from 'react-router-dom';
import {
  ListTable,
  ManageColumnsPopover,
} from '../../../../../../../components/table';
import { ShowHideTableColumn } from '../../../../../../../components/table/types';
import { getProjectDocumentsColumns } from './columns';
import { useAttachmentList } from '../../../../../../services/attachments/attachments-service';
import {
  AttachmentList,
  AttachmentsListExportParams,
} from '../../../../../../types/attachment';

interface ProjectDocumentsProps {
  refreshTrigger: number;
  currentPage: number;
  appliedFilters: Record<string, string | number | boolean | string[]>;
  setCount: (value: number) => void;
  setExportParams?: React.Dispatch<
    React.SetStateAction<AttachmentsListExportParams>
  >;
  setExportType?: (type: ExportType) => void;
  columnAnchorEl: HTMLButtonElement | null;
  setColumnAnchorEl: React.Dispatch<
    React.SetStateAction<HTMLButtonElement | null>
  >;
  searchValue: string;
}

const ProjectDocuments: React.FC<ProjectDocumentsProps> = ({
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
  const [projectDocuments, setProjectDocuments] = useState<AttachmentList[]>(
    []
  );
  const [tableParams, setTableParams] = useState<ProjectDocumentsListURLParams>(
    {
      page: currentPage + 1,
      limit: 100,
      sortBy: 'r_number',
      sortOrder: 'ASC',
    }
  );

  const { data, isLoading, isError } = useAttachmentList(
    {
      page: currentPage + 1,
      limit: tableParams.limit,
      sortBy: tableParams.sortBy,
      sortOrder: tableParams.sortOrder,
      filters: appliedFilters,
      attachmentLevel: 'project',
      accountRid: accountId,
      entityId: caseId || '',
      search: searchValue,
      fiscalYear: 0,
      type: 'dossier_project_document',
    },
    refreshTrigger
  );

  const totalItems = data?.count || 0;

  useEffect(() => {
    if (data) {
      setProjectDocuments(data.attachments || []);
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
      setExportType('dossier-project-documents');
    }
    setExportParams?.({
      sortBy: tableParams.sortBy,
      sortOrder: tableParams.sortOrder,
      filters: appliedFilters,
      search: searchValue,
      fiscalYear: 0,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appliedFilters, searchValue, tableParams.sortBy, tableParams.sortOrder]);

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

  const getRowId = (row: AttachmentList) => row.rid;

  // Column visibility states
  const isModalOpen = Boolean(columnAnchorEl);
  const handlePopoverClose = () => setColumnAnchorEl(null);

  const modalId = isModalOpen
    ? `project-documents-list-column-visibility-popover`
    : undefined;

  const RestrictedColumns = [
    { id: 'r_number', canHide: false, canDrag: false },
  ];

  const projectDocumentsColumns = getProjectDocumentsColumns();

  const [columnVisibility, setColumnVisibility] = useState<
    Record<string, boolean>
  >(
    Object.fromEntries(
      projectDocumentsColumns.map((col) => [col.id, !col.hide])
    )
  );

  const [columnOrder, setColumnOrder] = useState(
    projectDocumentsColumns.map((col) => col.id)
  );

  const handleColumnsChange = (updatedColumns: ShowHideTableColumn[]) => {
    const newVisibility = Object.fromEntries(
      updatedColumns.map((col) => [col.id, !col.hide])
    );
    setColumnVisibility(newVisibility);
    setColumnOrder(updatedColumns.map((col) => col.id));
  };

  const visibleColumns = columnOrder
    .map((id) => projectDocumentsColumns.find((col) => col.id === id)!)
    .filter((col) => columnVisibility[col.id]);

  return (
    <>
      <ManageColumnsPopover
        anchorEl={columnAnchorEl}
        open={isModalOpen}
        popoverId={modalId}
        onClose={handlePopoverClose}
        columns={projectDocumentsColumns}
        onColumnsChange={handleColumnsChange}
        columnRestrictions={RestrictedColumns}
      />

      <ListTable
        data={projectDocuments}
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
        error={isError ? 'Failed to load project documents data' : undefined}
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

export default ProjectDocuments;
