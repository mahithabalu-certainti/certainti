import React, { useState, useEffect, useMemo } from 'react';
import {
  ExportType,
  ProjectDocumentsListURLParams,
} from '../../../../../../types';
import {
  generatePath,
  useNavigate,
  useParams,
  useSearchParams,
} from 'react-router-dom';
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
import { checkPermission } from '../../../../../../../common-utils';
import { AllPermissions } from '../../../../../../../common-service';
import { RootState } from '../../../../../../../store/store';
import { useSelector } from 'react-redux';
import { PROJECT_DETAILS } from '../../../../../../../routes';

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
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const accountId = searchParams.get('accountID') || '';
  const [projectDocuments, setProjectDocuments] = useState<AttachmentList[]>(
    []
  );
  const [tableParams, setTableParams] = useState<ProjectDocumentsListURLParams>(
    {
      page: currentPage + 1,
      limit: 100,
      sortBy: 'project_code',
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
      type: 'dossier_project_document',
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
      type: 'dossier_project_document',
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
  const { permission } = useSelector((state: RootState) => state.permission);
  const attachmentViewEditFields = useMemo(
    () =>
      permission?.find(
        (item) => item.name === AllPermissions.ATTACHMENT_VIEW_EDIT
      )?.fields ?? [],
    [permission]
  );

  const permissionMap = useMemo(() => {
    const map: Record<string, { read: boolean; edit: boolean }> = {};
    attachmentViewEditFields.forEach((item) => {
      map[item.name] = { read: item.read ?? false, edit: item.edit ?? false };
    });
    return map;
  }, [attachmentViewEditFields]);
  const projectListViewEditFields = useMemo(
    () =>
      permission.find((item) => item.name === AllPermissions.PROJECTS_VIEW_EDIT)
        ?.fields ?? [],
    [permission]
  );

  const projectPermissionMap = useMemo(() => {
    const map: Record<string, { read: boolean; edit: boolean }> = {};
    projectListViewEditFields.forEach((item) => {
      map[item.name] = { read: item.read ?? false, edit: item.edit ?? false };
    });
    return map;
  }, [projectListViewEditFields]);
  const isAttachmentExportEnable = checkPermission(
    permission,
    AllPermissions.ATTACHMENT_EXPORT
  );

  const handleViewRecord = (data: AttachmentList) => {
    const path = generatePath(PROJECT_DETAILS, {
      projectid: data?.attach_to ?? '',
    });
    const queryParams = new URLSearchParams({
      list: 'attachments',
      accountID: data?.account_rid || accountId || '',
      source: 'account',
      currency_rid: data?.currency_rid ?? '',
      navigateFrom: 'case',
    });

    navigate(`${path}?${queryParams.toString()}`);
  };

  const projectDocumentsColumns = getProjectDocumentsColumns(
    projectPermissionMap,
    permissionMap,
    isAttachmentExportEnable,
    handleViewRecord
  );

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
