import { useEffect, useMemo, useState } from 'react';
import {
  AllPermissions,
  FilterTypes,
} from '../../../../../../../common-service';
import {
  CaseGlobalList,
  CaseListParams,
} from '../../../../../../../consultant/types';
import { RootState } from '../../../../../../../store/store';
import { useSelector } from 'react-redux';
import { getGlobalCaseListColumns } from './columns';
import { ListTable } from '../../../../../../../components/table';
import { useCaseGlobalList } from '../../../../../../../consultant/services/cases/case-service';

interface ICaseTableProps {
  appliedFilters: FilterTypes;
  tableParams: CaseListParams;
  setTableParams: React.Dispatch<React.SetStateAction<CaseListParams>>;
  setTotalCount: React.Dispatch<React.SetStateAction<number>>;
  refreshTrigger?: number;
  searchText: string;
  onSelectionChange?: (selectedIds: string[]) => void;
}

export const CaseListTable: React.FC<ICaseTableProps> = ({
  appliedFilters,
  tableParams,
  setTableParams,
  setTotalCount,
  refreshTrigger,
  searchText,
  onSelectionChange,
}) => {
  const [caseList, setCaseList] = useState<CaseGlobalList[]>([]);
  const { permission } = useSelector((state: RootState) => state.permission);

  const { data, isLoading, isError } = useCaseGlobalList(
    {
      ...tableParams,
      filters: appliedFilters,
      search: searchText,
    },
    refreshTrigger
  );
  const totalItems = data?.count || 0;

  useEffect(() => {
    if (data) {
      setTotalCount(data?.count || 0);
      setCaseList(data.cases || []);
    }
  }, [data, setTotalCount]);

  //Permission
  const casesEditFields = useMemo(
    () =>
      permission?.find((item) => item.name === AllPermissions.CASES_VIEW_EDIT)
        ?.fields ?? [],
    [permission]
  );

  const permissionMap = useMemo(() => {
    const map: Record<string, { read: boolean; edit: boolean }> = {};
    casesEditFields.forEach((item) => {
      map[item.name] = { read: item.read ?? false, edit: item.edit ?? false };
    });
    return map;
  }, [casesEditFields]);

  const accountViewEditFields = useMemo(
    () =>
      permission.find((item) => item.name === AllPermissions.ACCOUNTS_VIEW_EDIT)
        ?.fields ?? [],
    [permission]
  );
  const accountPermissionMap = useMemo(() => {
    const map: Record<string, { read: boolean; edit: boolean }> = {};
    accountViewEditFields.forEach((item) => {
      map[item.name] = { read: item.read ?? false, edit: item.edit ?? false };
    });
    return map;
  }, [accountViewEditFields]);

  const getRowId = (row: CaseGlobalList) => {
    return row.rid;
  };

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

  const globalCaseColumns = getGlobalCaseListColumns(
    permissionMap,
    accountPermissionMap
  );

  return (
    <div>
      <ListTable
        data={caseList}
        columns={globalCaseColumns}
        getRowId={getRowId}
        hoverHighlight={false}
        tableStyle={{
          height: '100%',
          maxHeight: 'calc(100vh - 400px)',
          overflow: 'auto',
        }}
        stickyHeader={true}
        stickyColumnsCount={2}
        selectable={true}
        expandable={false}
        onSelectionChange={(selectedIds) => {
          onSelectionChange?.(selectedIds);
        }}
        actionWidth={60}
        actionDisplayMode='dropdown'
        actionMenuItems={[]}
        loading={isLoading}
        error={isError ? 'Failed to load cases data' : undefined}
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
    </div>
  );
};
