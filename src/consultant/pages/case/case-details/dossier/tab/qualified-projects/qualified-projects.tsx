import React, { useState, useEffect, useMemo } from 'react';
import {
  ExportType,
  QualifiedProjectItem,
  QualifiedProjectsListExportParams,
  QualifiedProjectsListURLParams,
} from '../../../../../../types';
import { useParams, useSearchParams } from 'react-router-dom';
import {
  ListTable,
  ManageColumnsPopover,
} from '../../../../../../../components/table';
import { ShowHideTableColumn } from '../../../../../../../components/table/types';
// import { getQualifiedProjectsColumns } from './columns';
import { AssignProject } from '../../../../../../types/assign-projects';
import { useAssignProjectsList } from '../../../../../../services/cases-assign-projects/assign-project-service';
import { getAssignedProjectColumns } from '../../../case-assign-projects/assigned-projects/column';
import { useSelector } from 'react-redux';
import { RootState } from '../../../../../../../store/store';
import { AllPermissions } from '../../../../../../../common-service';

interface QualifiedProjectsProps {
  refreshTrigger: number;
  currentPage: number;
  appliedFilters: Record<string, string | number | boolean | string[]>;
  setCount: (value: number) => void;
  setExportParams?: (params: QualifiedProjectsListExportParams) => void;
  setExportType?: (type: ExportType) => void;
  columnAnchorEl: HTMLButtonElement | null;
  setColumnAnchorEl: React.Dispatch<
    React.SetStateAction<HTMLButtonElement | null>
  >;
  searchValue: string;
  fiscalYear: number;
}

const QualifiedProjects: React.FC<QualifiedProjectsProps> = ({
  refreshTrigger,
  currentPage,
  appliedFilters,
  setCount,
  setExportParams,
  setExportType,
  columnAnchorEl,
  setColumnAnchorEl,
  searchValue,
  fiscalYear,
}) => {
  const { caseId } = useParams();
  const [searchParams] = useSearchParams();
  const accountId = searchParams.get('accountID') || '';
  const [qualifiedProjects, setQualifiedProjects] = useState<AssignProject[]>(
    []
  );
  const [tableParams, setTableParams] =
    useState<QualifiedProjectsListURLParams>({
      page: currentPage + 1,
      limit: 100,
      sortBy: 'project_code',
      sortOrder: 'ASC',
    });


  const { data, isLoading, isError } = useAssignProjectsList(
    {
      page: currentPage + 1,
      limit: tableParams.limit,
      sort: tableParams.sortBy,
      sort_by: tableParams.sortOrder,
      search: searchValue,
      filter: appliedFilters,
      case_rid: caseId,
      account_rid: accountId,
      fiscal_year: fiscalYear,
    },
    refreshTrigger
  );
  const totalItems = data?.count || 0;
  useEffect(() => {
    if (data) {
      setQualifiedProjects(data.projects || []);
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
      setExportType('dossier-qualified-projects');
    }
    setExportParams?.({
      sortBy: tableParams.sortBy,
      sortOrder: tableParams.sortOrder,
      filters: appliedFilters,
      search: searchValue,
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

  const getRowId = (row: QualifiedProjectItem) => row.rid;

  // Column visibility states
  const isModalOpen = Boolean(columnAnchorEl);
  const handlePopoverClose = () => setColumnAnchorEl(null);

  const modalId = isModalOpen
    ? `qualified-projects-list-column-visibility-popover`
    : undefined;

  const RestrictedColumns = [
    { id: 'project_code', canHide: false, canDrag: false },
  ];
  const { permission } = useSelector((state: RootState) => state.permission);
  const projectViewEditlistFields = useMemo(
    () =>
      permission.find((item) => item.name === AllPermissions.PROJECTS_VIEW_EDIT)
        ?.fields ?? [],
    [permission]
  );
  const permissionMap = useMemo(() => {
    const map: Record<string, { read: boolean; edit: boolean }> = {};
    projectViewEditlistFields.forEach((item) => {
      map[item.name] = { read: item.read ?? false, edit: item.edit ?? false };
    });
    return map;
  }, [projectViewEditlistFields]);
  // const qualifiedProjectsColumns = getQualifiedProjectsColumns();
  const qualifiedProjectsColumns = getAssignedProjectColumns(permissionMap);

  const [columnVisibility, setColumnVisibility] = useState<
    Record<string, boolean>
  >(
    Object.fromEntries(
      qualifiedProjectsColumns.map((col) => [col.id, !col.hide])
    )
  );

  const [columnOrder, setColumnOrder] = useState(
    qualifiedProjectsColumns.map((col) => col.id)
  );

  const handleColumnsChange = (updatedColumns: ShowHideTableColumn[]) => {
    const newVisibility = Object.fromEntries(
      updatedColumns.map((col) => [col.id, !col.hide])
    );
    setColumnVisibility(newVisibility);
    setColumnOrder(updatedColumns.map((col) => col.id));
  };

  const visibleColumns = columnOrder
    .map((id) => qualifiedProjectsColumns.find((col) => col.id === id)!)
    .filter((col) => columnVisibility[col.id]);

  return (
    <>
      <ManageColumnsPopover
        anchorEl={columnAnchorEl}
        open={isModalOpen}
        popoverId={modalId}
        onClose={handlePopoverClose}
        columns={qualifiedProjectsColumns}
        onColumnsChange={handleColumnsChange}
        columnRestrictions={RestrictedColumns}
      />

      <ListTable
        data={qualifiedProjects}
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
        error={isError ? 'Failed to load qualified projects data' : undefined}
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

export default QualifiedProjects;
