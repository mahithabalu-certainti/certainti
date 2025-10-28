import React, { useState, useEffect, useMemo } from 'react';
import {
  ListTable,
  ManageColumnsPopover,
} from '../../../../../../components/table';
import { getFinancialResourceCostColumns } from './columns';
import { NewProjectData } from '../../../../../types/project';
import {
  ExportType,
  ProjectFinancialResourceCostList,
  ProjectFinancialResourceExportParams,
  ProjectFinancialResourceListParams,
} from '../../../../../types';
import { useProjectFinancialResourceCost } from '../../../../../services/financial/financial-service';
import { useParams, useSearchParams } from 'react-router-dom';
import { RootState } from '../../../../../../store/store';
import { useSelector } from 'react-redux';
import { AllPermissions } from '../../../../../../common-service';
import {
  ListTableColumn,
  ShowHideTableColumn,
} from '../../../../../../components/table/types';

interface FinancialResourceCostProps {
  projectDetails: NewProjectData | null;
  refreshTrigger: number;
  currentPage: number;
  appliedFilters: Record<string, string | number | boolean | string[]>;
  setCount: (value: number) => void;
  setResCostExportParams: (
    params: ProjectFinancialResourceExportParams
  ) => void;
  setExportType?: (type: ExportType) => void;
  columnAnchorEl: HTMLButtonElement | null;
  setColumnAnchorEl: React.Dispatch<
    React.SetStateAction<HTMLButtonElement | null>
  >;
  searchValue: string;
}

const ResourceCost: React.FC<FinancialResourceCostProps> = ({
  projectDetails,
  refreshTrigger,
  currentPage,
  appliedFilters,
  setCount,
  setResCostExportParams,
  setExportType,
  columnAnchorEl,
  setColumnAnchorEl,
  searchValue,
}) => {
  const { projectid: projectId } = useParams();
  const [searchParams] = useSearchParams();
  const accountId = searchParams.get('accountID') || '';
  const fiscalYear = projectDetails?.fiscal_year;
  const currencySymbol = projectDetails?.currency_symbol;

  const [resourceCostList, setResourceCostList] = useState<
    ProjectFinancialResourceCostList[]
  >([]);
  const [tableParams, setTableParams] =
    useState<ProjectFinancialResourceListParams>({
      sortBy: 'resource_code',
      sortOrder: 'ASC',
      page: currentPage + 1,
      limit: 100,
      filters: appliedFilters,
      search: searchValue,
    });
  const { permission } = useSelector((state: RootState) => state.permission);

  const { data, isLoading, isError } = useProjectFinancialResourceCost(
    {
      page: tableParams.page,
      limit: tableParams.limit,
      sortBy: tableParams.sortBy,
      sortOrder: tableParams.sortOrder,
      filters: tableParams.filters,
      projectRid: projectId,
      accountRid: accountId,
      fiscalYear: fiscalYear,
      accountNumber: projectDetails?.account_number,
      search: searchValue,
    },
    refreshTrigger
  );

  const totalItems = data?.count;
  useEffect(() => {
    if (data) {
      setResourceCostList(data.projectResourceFiscal || []);
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
      setExportType('financial');
    }

    setResCostExportParams({
      sortBy: tableParams.sortBy,
      sortOrder: tableParams.sortOrder,
      filters: appliedFilters,
      search: searchValue,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tableParams, appliedFilters, searchValue]);

  // Permissions
  const financialResourceCostViewEditFields = useMemo(
    () =>
      permission?.find(
        (item) =>
          item.name === AllPermissions.PROJECT_FINANCIAL_RESOURCE_COST_VIEW
      )?.fields ?? [],
    [permission]
  );

  const permissionMap = useMemo(() => {
    const map: Record<string, { read: boolean; edit: boolean }> = {};
    financialResourceCostViewEditFields.forEach((item) => {
      map[item.name] = { read: item.read ?? false, edit: item.edit ?? false };
    });
    return map;
  }, [financialResourceCostViewEditFields]);

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

  const getRowId = (row: ProjectFinancialResourceCostList) => row.resource_rid;

  const financialResourceCostColumns = useMemo(() => {
    return getFinancialResourceCostColumns(permissionMap, currencySymbol);
  }, [permissionMap, currencySymbol]);

  const RestrictedColumns = [
    {
      id: 'resource_code',
      canHide: false,
      canDrag: false,
    },
  ];

  const [visibleColumns, setVisibleColumns] = useState<
    ListTableColumn<ProjectFinancialResourceCostList>[]
  >(financialResourceCostColumns.filter((col) => !col.hide));
  useEffect(() => {
    const updatedColumns = financialResourceCostColumns.filter(
      (col) => !col.hide
    );
    setVisibleColumns(updatedColumns);
  }, [currencySymbol, financialResourceCostColumns]);
  const handleColumnsChange = (updatedColumns: ShowHideTableColumn[]) => {
    setVisibleColumns(
      updatedColumns.filter(
        (col) => !col.hide
      ) as ListTableColumn<ProjectFinancialResourceCostList>[]
    );
  };

  const handlePopoverClose = () => {
    setColumnAnchorEl(null);
  };

  const isModalOpen = Boolean(columnAnchorEl);
  const modalId = isModalOpen
    ? 'interaction-column-visibility-popover'
    : undefined;

  return (
    <>
      <ManageColumnsPopover
        anchorEl={columnAnchorEl}
        open={isModalOpen}
        popoverId={modalId}
        onClose={handlePopoverClose}
        columns={financialResourceCostColumns}
        onColumnsChange={handleColumnsChange}
        columnRestrictions={RestrictedColumns}
      />
      <ListTable
        data={resourceCostList}
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
        loading={isLoading || !fiscalYear}
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

export default ResourceCost;
