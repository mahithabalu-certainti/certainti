import React, { useEffect, useMemo, useState } from 'react';
import {
  ListTable,
  ManageColumnsPopover,
} from '../../../../../../../components/table';

import { getFinancialProjectCostColumns } from './columns';
import { accountDetailsProps } from '../../../../../account-details/utils';
import { useParams } from 'react-router-dom';
import {
  CostListParms,
  FinancialProjectCostList,
} from '../../../../../../types/account-financial';
import { useProjectCostList } from '../../../../../../services/financial/account-financial-service';
import {
  ExportType,
  ProjectFinancialProjectExportParams,
} from '../../../../../../types';
import { useSelector } from 'react-redux';
import { RootState } from '../../../../../../../store/store';
import { AllPermissions } from '../../../../../../../common-service';
import {
  ListTableColumn,
  ShowHideTableColumn,
} from '../../../../../../../components/table/types';

interface FinancialProjectCostProps {
  accountDetails?: accountDetailsProps;
  reFetchData?: number;
  activeKey?: string;
  fiscalyear?: string;
  currentPage: number;
  appliedFilters: Record<string, string | number | boolean | string[]>;
  setCount: (value: number) => void;
  setFinancialProjectCostParams: (
    params: ProjectFinancialProjectExportParams
  ) => void;
  setExportType?: (type: ExportType) => void;
  columnAnchorEl: HTMLButtonElement | null;
  setColumnAnchorEl: React.Dispatch<
    React.SetStateAction<HTMLButtonElement | null>
  >;
}

const FinancialProjectCost: React.FC<FinancialProjectCostProps> = ({
  fiscalyear,
  reFetchData,
  currentPage,
  appliedFilters,
  setCount,
  setFinancialProjectCostParams,
  setExportType,
  columnAnchorEl,
  setColumnAnchorEl,
}) => {
  const { accountid } = useParams();
  const [projectCostList, setProjectCostList] = useState<
    FinancialProjectCostList[]
  >([]);
  const [tableParams, setTableParams] = useState<CostListParms>({
    sortBy: 'project_code',
    sortOrder: 'ASC',
    page: currentPage + 1,
    limit: 100,
    filters: appliedFilters,
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

  // Permissions
  const { permission } = useSelector((state: RootState) => state.permission);

  const financialProjectCostViewFields = useMemo(
    () =>
      permission?.find(
        (item) =>
          item.name === AllPermissions.ACCOUNT_FINANCIAL_PROJECT_COST_VIEW
      )?.fields ?? [],
    [permission]
  );

  const permissionMap = useMemo(() => {
    const map: Record<string, { read: boolean; edit: boolean }> = {};
    financialProjectCostViewFields.forEach((item) => {
      map[item.name] = { read: item.read ?? false, edit: item.edit ?? false };
    });
    return map;
  }, [financialProjectCostViewFields]);

  useEffect(() => {
    if (projectCostData) {
      setProjectCostList(projectCostData?.costs || []);
      setCount(projectCostData.count || 0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectCostData]);

  useEffect(() => {
    setTableParams((prev) => ({
      ...prev,
      page: currentPage + 1,
      filters: appliedFilters,
    }));
  }, [currentPage, appliedFilters]);

  useEffect(() => {
    if (setExportType) {
      setExportType('financial_project_cost');
    }
    setFinancialProjectCostParams({
      sortBy: tableParams.sortBy,
      sortOrder: tableParams.sortOrder,
      filters: appliedFilters,
      fiscalYear: Number(fiscalyear),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tableParams, fiscalyear, appliedFilters]);

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

  const financialProjectCostColumns =
    getFinancialProjectCostColumns(permissionMap);

  const RestrictedColumns = [
    {
      id: 'project_code',
      canHide: false,
      canDrag: false,
    },
  ];

  const [visibleColumns, setVisibleColumns] = useState<
    ListTableColumn<FinancialProjectCostList>[]
  >(financialProjectCostColumns.filter((col) => !col.hide));

  const handleColumnsChange = (updatedColumns: ShowHideTableColumn[]) => {
    setVisibleColumns(
      updatedColumns.filter(
        (col) => !col.hide
      ) as ListTableColumn<FinancialProjectCostList>[]
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
        columns={financialProjectCostColumns}
        onColumnsChange={handleColumnsChange}
        columnRestrictions={RestrictedColumns}
      />
      <ListTable
        data={projectCostList || []}
        columns={visibleColumns}
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
    </>
  );
};

export default FinancialProjectCost;
