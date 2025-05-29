/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ResourceCostList } from '../../../../../types/resource-cost';
import { useResourceCost } from '../../../../../services/resource-cost/resource-cost-service';
import { RESOURCECOST } from '../../../../../../routes';
import { ListTable } from '../../../../../../components/table';
import { resourceCostColumns } from './columns';
import { convertResourceCost } from './resource-cost-type';

interface ResourceCostTableProps {
  fiscalYear?: number;
  appliedFilters?: Record<string, any>;
  accountDetails?: Record<string, any>;
  resourceRid: string;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  costOrder: 'asc' | 'desc';
  setCostOrder: (costOrder: 'asc' | 'desc') => void;
  costorderBy: string;
  setCostorderBy: (field: keyof ResourceCostList) => void;
}

const ResourceCostTable: React.FC<ResourceCostTableProps> = ({
  fiscalYear,
  appliedFilters,
  accountDetails,
  resourceRid,
  currentPage,
  setCurrentPage,
  costOrder,
  setCostOrder,
  costorderBy,
  setCostorderBy,
}) => {
  const navigate = useNavigate();
  const [rowsPerPage, setRowsPerPage] = useState<number>(25);
  const accountInActive =
    accountDetails?.data?.accountById?.status === 'inactive';
  const apiOrder = costOrder.toUpperCase() as 'ASC' | 'DESC';
  const {
    data: costList,
    isLoading,
    error,
  } = useResourceCost({
    page: currentPage + 1,
    limit: rowsPerPage,
    sortBy: costorderBy,
    sortOrder: apiOrder,
    filters: appliedFilters,
    accountNumber: accountDetails?.data?.accountById?.r_number,
    fiscalYear,
    resourceRid,
  });

  const handleEdit = (cost: ResourceCostList) => {
    const data = convertResourceCost(cost);
    navigate(RESOURCECOST + '/edit/' + cost.r_number, {
      state: { ...accountDetails, costInfo: data, cost: true },
    });
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  // handles page limit change
  const handleRowsPerPageChange = (newPageSize: number) => {
    setRowsPerPage(newPageSize);
    setCurrentPage(0);
  };

  const handleSortRequest = (property: string, sortOrder: 'asc' | 'desc') => {
    setCostOrder(sortOrder);
    setCostorderBy(property as keyof ResourceCostList);
  };

  const actionMenuItems = [
    {
      label: 'Edit',
      onClick: handleEdit,
      disabled: accountInActive,
    },
    {
      label: 'Delete',
      onClick: () => console.log('Delete'),
      disabled: accountInActive,
    },
  ];

  const getRowId = (row: ResourceCostList) => row?.rid || '';

  return (
    <div>
      <ListTable
        data={costList?.resourceCost as any}
        columns={resourceCostColumns}
        getRowId={getRowId}
        hoverHighlight={false}
        tableStyle={{ borderBottom: '1px solid #CBD6E2', overflow: 'auto' }}
        stickyHeader={false}
        stickyColumnsCount={1}
        selectable={false}
        actionWidth={100}
        actionDisplayMode='dropdown'
        actionMenuItems={actionMenuItems}
        loading={isLoading}
        error={error ? 'Failed to load resource cost data' : undefined}
        rowsPerPageOptions={[25, 50, 100]}
        rowsPerPage={rowsPerPage}
        currentPage={currentPage}
        totalItems={costList?.count ?? 0}
        onPageChange={handlePageChange}
        onRowsPerPageChange={handleRowsPerPageChange}
        sortBy={costorderBy}
        sortOrder={costOrder.toUpperCase() as 'ASC' | 'DESC'}
        onSort={handleSortRequest}
      />
    </div>
  );
};

export default ResourceCostTable;
