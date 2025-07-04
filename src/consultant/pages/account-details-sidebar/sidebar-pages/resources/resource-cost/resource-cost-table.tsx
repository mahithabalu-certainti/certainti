/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useMemo, useState } from 'react';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ResourceCostList } from '../../../../../types/resource-cost';
import {
  useResourceCost,
  useUpdateCostAccept,
} from '../../../../../services/resource-cost/resource-cost-service';
import { RESOURCECOST } from '../../../../../../routes';
import { ListTable } from '../../../../../../components/table';
import { getResourceCostColumns } from './columns';
import { convertResourceCost } from './resource-cost-type';
import { AcceptIcon, RejectIcon } from '../../../../../../assets';
import { useToast } from '../../../../../../hooks';
import { useFetchCurrency } from '../../../../../services/account';
import { CellEditData } from '../../../../../../components/table/types';
import { ResourceTypeEnum } from '../../../../resource-form/utils';

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
  isResourceCostDeleteEnable?: boolean;
  isResourceCostEditEnable?: boolean;
  refreshCostTrigger?: number;
  setCount?: (count: number) => void;
  resourceType: ResourceTypeEnum;
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
  isResourceCostEditEnable,
  refreshCostTrigger,
  setCount,
  resourceType,
}) => {
  const navigate = useNavigate();
  const { successToast } = useToast();
  const [rowsPerPage, setRowsPerPage] = useState<number>(100);
  const accountInActive =
    accountDetails?.data?.accountById?.status?.status_name?.toLowerCase() !==
    'active';
  const apiOrder = costOrder.toUpperCase() as 'ASC' | 'DESC';
  const {
    data: costList,
    isLoading,
    error,
    refetch,
  } = useResourceCost(
    {
      page: currentPage + 1,
      limit: rowsPerPage,
      sortBy: costorderBy,
      sortOrder: apiOrder,
      filters: appliedFilters,
      accountNumber: accountDetails?.data?.accountById?.r_number,
      fiscalYear,
      resourceRid,
    },
    undefined,
    refreshCostTrigger
  );
  useEffect(() => {
    if (setCount) {
      setCount(costList?.count || 0);
    }
  }, [costList, setCount]);

  const currency = useFetchCurrency();

  const memoizedCurrency = useMemo(
    () =>
      currency.data?.data.currency.map((account) => ({
        label: account.currency_code,
        value: account.rid,
      })) || [],
    [currency.data?.data.currency]
  );

  const handleEdit = (cost: ResourceCostList) => {
    const data = convertResourceCost(cost);
    navigate(RESOURCECOST + '/edit/' + cost.r_number, {
      state: { ...accountDetails, costInfo: data, cost: true },
    });
  };
  const updateStatusAccept = useUpdateCostAccept();
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
      hide: !isResourceCostEditEnable,
    },
    {
      label: 'Delete',
      onClick: () => console.log('Delete'),
      disabled: accountInActive,
      // hide: !isResourceCostDeleteEnable,
      hide: true,
    },
  ];

  const handleAccept = (row: ResourceCostList) => {
    const payload = {
      rid: row?.rid,
      accountNumber: accountDetails?.data?.accountById?.r_number,
      action: 'accept',
      type: row?.status_name,
    };
    updateStatusAccept.mutate(payload, {
      onSuccess: (data) => {
        successToast(data?.statusMessage || 'Status updated successfully');
        refetch();
      },
    });
  };

  const handleReject = (row: ResourceCostList) => {
    const payload = {
      rid: row?.rid,
      accountNumber: accountDetails?.data?.accountById?.r_number,
      action: 'reject',
      type: row?.status_name,
    };
    updateStatusAccept.mutate(payload, {
      onSuccess: (data) => {
        successToast(data?.statusMessage || 'Status updated successfully');
        refetch();
      },
    });
  };
  const getConditionMenuItems = (row: ResourceCostList) => {
    let statusLabel = '';
    switch (row.status_name) {
      case 'Duplicate':
        statusLabel = 'Duplicate';
        break;
      case 'Anomaly':
        statusLabel = 'Anomaly';
        break;

      default:
        return [];
    }

    return [
      {
        label: statusLabel ? `Accept ${statusLabel}` : 'Accept',
        onClick: handleAccept,
        icon: AcceptIcon,
        className:
          'inline-flex items-center gap-1 px-2 py-1 rounded text-[12px] cursor-pointer  h-[24px] bg-[#3EA72F1A] hover:bg-[#3EA72F] hover:text-[#fff]',
      },
      {
        label: statusLabel ? `Reject ${statusLabel}` : 'Reject',
        onClick: handleReject,
        icon: RejectIcon,
        className:
          'inline-flex items-center gap-1 px-2 py-1 rounded text-[12px] cursor-pointer  h-[24px] bg-[#FF3C031A] hover:bg-[#FF3C03] hover:text-[#fff]',
      },
    ];
  };

  const isFullTime = resourceType?.toLowerCase() === ResourceTypeEnum.FULL_TIME;

  const getRowId = (row: ResourceCostList) => row?.rid || '';
  const resourceCostColumns = getResourceCostColumns(
    memoizedCurrency,
    isFullTime
  );

  const handleCellEdit = async (rowId: string, updates: CellEditData[]) => {
    console.log(rowId, updates);
  };

  return (
    <div>
      <ListTable
        data={costList?.resourceCost as any}
        columns={resourceCostColumns}
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
        actionMenuItems={actionMenuItems}
        conditionMenuItems={(row: ResourceCostList) =>
          getConditionMenuItems(row) || undefined
        }
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
        onCellEdit={handleCellEdit}
      />
    </div>
  );
};

export default ResourceCostTable;
