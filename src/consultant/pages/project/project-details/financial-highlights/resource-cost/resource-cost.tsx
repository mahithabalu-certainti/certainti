import React, { useState, useEffect, useMemo } from 'react';
import { ListTable } from '../../../../../../components/table';
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
}

const ResourceCost: React.FC<FinancialResourceCostProps> = ({
  projectDetails,
  refreshTrigger,
  currentPage,
  appliedFilters,
  setCount,
  setResCostExportParams,
  setExportType,
}) => {
  const { projectid: projectId } = useParams();
  const [searchParams] = useSearchParams();
  const accountId = searchParams.get('accountID') || '';
  const fiscalYear = projectDetails?.fiscal_year;

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
    }));
  }, [currentPage, appliedFilters]);

  useEffect(() => {
    if (setExportType) {
      setExportType('financial');
    }
    setResCostExportParams({
      sortBy: tableParams.sortBy,
      sortOrder: tableParams.sortOrder,
      filters: appliedFilters,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tableParams]);

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
  const financialResourceCostColumns =
    getFinancialResourceCostColumns(permissionMap);

  return (
    <ListTable
      data={resourceCostList}
      columns={financialResourceCostColumns}
      getRowId={getRowId}
      hoverHighlight={false}
      tableStyle={{
        height: '100%',
        maxHeight: 'calc(100vh - 320px)',
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
  );
};

export default ResourceCost;
