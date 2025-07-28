import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { accountDetailsProps } from '../../../../../account-details/utils';
import {
  ExportType,
  ProjectFinancialResourceCostList,
  ProjectFinancialResourceExportParams,
  ProjectFinancialResourceListParams,
} from '../../../../../../types';
import { useProjectFinancialResourceCost } from '../../../../../../services/financial/financial-service';
import { ListTable } from '../../../../../../../components/table';
import { getFinancialResourceCostColumns } from './columns';

interface FinancialResourceCostProps {
  refreshTrigger: number;
  currentPage: number;
  appliedFilters: Record<string, string | number | boolean | string[]>;
  setCount: (value: number) => void;
  setResCostExportParams: (
    params: ProjectFinancialResourceExportParams
  ) => void;
  setExportType?: (type: ExportType) => void;

  accountDetails?: accountDetailsProps;
  activeKey?: string;
  fiscalyear?: string;
}

const ResourceCost: React.FC<FinancialResourceCostProps> = ({
  accountDetails,
  refreshTrigger,
  currentPage,
  appliedFilters,
  setCount,
  setResCostExportParams,
  setExportType,
  fiscalyear,
}) => {
  const { accountid } = useParams();
  const accountNumber = accountDetails?.accountById?.r_number;

  const [resourceCostList, setResourceCostList] = useState<
    ProjectFinancialResourceCostList[]
  >([]);
  const [tableParams, setTableParams] =
    useState<ProjectFinancialResourceListParams>({
      sortBy: 'project_code',
      sortOrder: 'ASC',
      page: currentPage + 1,
      limit: 100,
      filters: appliedFilters,
    });

  const { data, isLoading, isError } = useProjectFinancialResourceCost(
    {
      page: tableParams.page,
      limit: tableParams.limit,
      sortBy: tableParams.sortBy,
      sortOrder: tableParams.sortOrder,
      filters: tableParams.filters,
      accountRid: accountid,
      accountNumber: accountDetails?.accountById?.r_number,
      fiscalYear: Number(fiscalyear) || 0,
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
      setExportType('financial_resource_cost');
    }
    setResCostExportParams({
      sortBy: tableParams.sortBy,
      sortOrder: tableParams.sortOrder,
      filters: appliedFilters,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tableParams]);

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

  return (
    <ListTable
      data={resourceCostList}
      columns={getFinancialResourceCostColumns()}
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
      loading={isLoading || !accountNumber || !fiscalyear}
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
