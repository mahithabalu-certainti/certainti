import React, { useState, useEffect, useMemo } from 'react';
import {
  ExportType,
  ResourceSummaryListURLParams,
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
import { RootState } from '../../../../../../../store/store';
import { useSelector } from 'react-redux';
import { AllPermissions } from '../../../../../../../common-service';
import { useCaseProjectResourceList } from '../../../../../../services/case-project-resource/case-project-resource-service';
import {
  CaseProjectResourceRowType,
  getCaseProjectResourceColumns,
} from '../../../case-project-resource/columns';
import { ReviewProjectListURLParams } from '../../../../../../types/assign-projects';
import { PROJECT_DETAILS } from '../../../../../../../routes';

interface ResourceSummaryProps {
  refreshTrigger: number;
  currentPage: number;
  appliedFilters: Record<string, string | number | boolean | string[]>;
  setCount: (value: number) => void;
  setExportParams?: React.Dispatch<
    React.SetStateAction<ReviewProjectListURLParams>
  >;
  setExportType?: (type: ExportType) => void;
  columnAnchorEl: HTMLButtonElement | null;
  setColumnAnchorEl: React.Dispatch<
    React.SetStateAction<HTMLButtonElement | null>
  >;
  searchValue: string;
}

const ResourceSummary: React.FC<ResourceSummaryProps> = ({
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
  const [resourceSummary, setResourceSummary] = useState<
    CaseProjectResourceRowType[]
  >([]);
  const [tableParams, setTableParams] = useState<ResourceSummaryListURLParams>({
    page: currentPage + 1,
    limit: 100,
    sortBy: 'resource_code',
    sortOrder: 'ASC',
  });
  const { permission } = useSelector((state: RootState) => state.permission);

  const { data, isLoading, isError } = useCaseProjectResourceList(
    {
      page: tableParams.page,
      limit: tableParams.limit,
      sortBy: tableParams.sortBy,
      sortOrder: tableParams.sortOrder,
      search: searchValue,
      filters: appliedFilters,
      accountRid: accountId || '',
      case_rid: caseId || '',
      fiscalYear: 0,
      type: 'qualifiedProjects',
    },
    refreshTrigger
  );

  const totalItems = data?.data.count || 0;

  useEffect(() => {
    if (data) {
      setResourceSummary(data?.data?.projectResources || []);
      setCount(data?.data?.count || 0);
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
      setExportType('dossier-resource-summary');
    }
    setExportParams?.({
      page: 1,
      limit: tableParams.limit,
      sortBy: tableParams.sortBy,
      sortOrder: tableParams.sortOrder,
      filters: appliedFilters,
      search: searchValue,
      type: 'qualifiedProjects',
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    appliedFilters,
    searchValue,
    tableParams.sortBy,
    tableParams.sortOrder,
    tableParams.limit,
  ]);

  // Permission Management
  const projectViewEditFields = useMemo(
    () =>
      permission.find(
        (item) => item.name === AllPermissions.PROJECTS_RESOURCES_VIEW_EDIT
      )?.fields ?? [],
    [permission]
  );

  const permissionMap = useMemo(() => {
    const map: Record<string, { read: boolean; edit: boolean }> = {};
    projectViewEditFields.forEach((item) => {
      map[item.name] = { read: item.read ?? false, edit: item.edit ?? false };
    });
    return map;
  }, [projectViewEditFields]);

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

  const getRowId = (row: CaseProjectResourceRowType) => row.rid;

  // Column visibility states
  const isModalOpen = Boolean(columnAnchorEl);
  const handlePopoverClose = () => setColumnAnchorEl(null);

  const modalId = isModalOpen
    ? `resource-summary-list-column-visibility-popover`
    : undefined;

  const RestrictedColumns = [
    { id: 'resource_code', canHide: false, canDrag: false },
  ];

  const handleViewResource = (row: CaseProjectResourceRowType) => {
    if (row.rid) {
      const path = generatePath(PROJECT_DETAILS, {
        projectid: row.project_fiscal_rid ?? '',
      });
      const queryParams = new URLSearchParams({
        list: 'projectResources',
        accountID: row.account_rid || accountId || '',
        currency_rid: row.currency_rid || '',
        source: 'account',
        navigateFrom: 'case',
        page: 'details',
        pro_res_id: row.project_resource_rid || '',
        origin: 'case_dossier',
      });

      navigate(`${path}?${queryParams.toString()}`);
    }
  };

  const resourceSummaryColumns = getCaseProjectResourceColumns(
    handleViewResource,
    permissionMap,
    projectPermissionMap
  );

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
        error={isError ? 'Failed to load resource summary data' : undefined}
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

export default ResourceSummary;
