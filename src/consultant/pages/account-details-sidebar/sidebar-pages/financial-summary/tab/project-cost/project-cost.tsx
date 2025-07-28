import React, { useState } from 'react';
import { ListTable } from '../../../../../../../components/table';

import { getFinancialProjectCostColumns } from './columns';
import { accountDetailsProps } from '../../../../../account-details/utils';
import { useParams } from 'react-router-dom';
import {
  CostListParms,
  FinancialProjectCostList,
} from '../../../../../../types/account-financial';
import { useProjectCostList } from '../../../../../../services/financial/account-financial-service';

interface FinancialProjectCostProps {
  accountDetails?: accountDetailsProps;
  reFetchData?: number;
  activeKey?: string;
  fiscalyear?: string;
  handleReset?: () => void;
}

const FinancialProjectCost: React.FC<FinancialProjectCostProps> = ({
  fiscalyear,
  reFetchData,
}) => {
  const { accountid } = useParams();
  const [tableParams, setTableParams] = useState<CostListParms>({
    sortBy: 'project_name',
    sortOrder: 'ASC',
    page: 1,
    limit: 100,
  });

  const {
    data: projectCostData,
    isLoading,
    error,
  } = useProjectCostList(
    accountid ?? '',
    fiscalyear ?? '',
    tableParams,
    reFetchData
  );

  const getRowId = (row: FinancialProjectCostList) => row?.rid || '';

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

  return (
    <ListTable
      data={projectCostData?.costs || []}
      columns={getFinancialProjectCostColumns()}
      getRowId={getRowId}
      hoverHighlight={false}
      tableStyle={{
        borderBottom: '1px solid #CBD6E2',
        height: '100%',
        maxHeight: 'calc(100vh - 410px)',
        overflow: 'auto',
      }}
      stickyHeader={true}
      stickyColumnsCount={1}
      selectable={false}
      actionWidth={80}
      actionDisplayMode='dropdown'
      loading={isLoading}
      error={error ? 'Failed to load resource cost data' : undefined}
      totalItems={projectCostData?.count ?? 0}
      rowsPerPageOptions={[25, 50, 100]}
      sortBy={tableParams.sortBy}
      sortOrder={tableParams.sortOrder}
      rowsPerPage={tableParams.limit}
      currentPage={(tableParams.page ?? 1) - 1}
      onPageChange={handlePageChange}
      onRowsPerPageChange={handleRowsPerPageChange}
      onSort={handleSort}
    />
  );
};

export default FinancialProjectCost;
