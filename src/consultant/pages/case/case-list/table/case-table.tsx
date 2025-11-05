import { useEffect, useMemo, useState } from 'react';
import { CaseGlobalList, CaseListParams, FilterState } from '../../../../types';
import { generatePath, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../../../../../store/store';
import { useCaseGlobalList } from '../../../../services/cases/case-service';
import { CASE_DETAILS, CASE_EDIT } from '../../../../../routes';
import { getGlobalCaseListColumns } from './columns';
import { reshapeGlobalFilter } from '../../../../../common-utils';
import {
  ActionItem,
  CellEditData,
  FieldChangeValue,
  ShowHideTableColumn,
} from '../../../../../components/table/types';
import { EditIcon } from '../../../../../assets';
import {
  ListTable,
  ManageColumnsPopover,
} from '../../../../../components/table';
import { AllPermissions, FilterTypes } from '../../../../../common-service';
import { useMutation } from '@apollo/client';
import { UPDATE_CASE } from '../../../../../api/graphql/queries/case-query';
import { caseClient } from '../../../../../api/graphql/clients/client';
import { useToast } from '../../../../../hooks';

interface ICaseTableProps {
  appliedFilters: FilterTypes;
  tableParams: CaseListParams;
  setTableParams: React.Dispatch<React.SetStateAction<CaseListParams>>;
  setTotalCount: React.Dispatch<React.SetStateAction<number>>;
  refreshTrigger?: number;
  columnAnchorEl: HTMLButtonElement | null;
  setColumnAnchorEl: React.Dispatch<
    React.SetStateAction<HTMLButtonElement | null>
  >;
  searchText: string;
  caseFilingTypesOptions: { value: string; label: string }[];
  userListOptions: { value: string; label: string }[];
}

export const CaseListTable: React.FC<ICaseTableProps> = ({
  appliedFilters,
  tableParams,
  setTableParams,
  setTotalCount,
  refreshTrigger,
  setColumnAnchorEl,
  columnAnchorEl,
  searchText,
  userListOptions,
  caseFilingTypesOptions,
}) => {
  const { errorToast } = useToast();
  const navigate = useNavigate();
  const [caseList, setCaseList] = useState<CaseGlobalList[]>([]);
  const { fiscalYear, filters } = useSelector<
    RootState,
    { filters: unknown; fiscalYear: string }
  >((state: RootState) => state.account);
  const { permission } = useSelector((state: RootState) => state.permission);

  const [updateCaseMutation] = useMutation(UPDATE_CASE, {
    client: caseClient,
  });

  const newFiscalYear = fiscalYear !== 'FY-All' ? Number(fiscalYear) : 0;

  const { data, isLoading, isError } = useCaseGlobalList(
    {
      ...tableParams,
      filters: appliedFilters,
      fiscalYear: newFiscalYear,
      globalFilters: reshapeGlobalFilter(filters as FilterState),
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

  const casesFieldsEditable = useMemo(
    () =>
      permission
        .find((item) => item.name === AllPermissions.CASES_VIEW_EDIT)
        ?.fields?.some((field) => field.edit),
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

  const handleViewCaseDetails = (caseItem: CaseGlobalList) => {
    const path = generatePath(CASE_DETAILS, {
      caseId: caseItem.rid,
    });
    const queryParams = new URLSearchParams({
      accountID: caseItem?.account_rid || '',
      account_name: caseItem?.account_name || '',
      account_number: caseItem?.account_r_number || '',
    });

    navigate(`${path}?${queryParams.toString()}`);
  };

  const globalCaseColumns = getGlobalCaseListColumns(
    handleViewCaseDetails,
    userListOptions,
    caseFilingTypesOptions,
    permissionMap,
    accountPermissionMap
  );

  // show hide columns
  const [columnVisibility, setColumnVisibility] = useState<
    Record<string, boolean>
  >(Object.fromEntries(globalCaseColumns.map((col) => [col.id, !col.hide])));

  const [columnOrder, setColumnOrder] = useState(
    globalCaseColumns.map((col) => col.id)
  );

  const handleColumnsChange = (updatedColumns: ShowHideTableColumn[]) => {
    const newVisibility = Object.fromEntries(
      updatedColumns.map((col) => [col.id, !col.hide])
    );
    setColumnVisibility(newVisibility);
    setColumnOrder(updatedColumns.map((col) => col.id));
  };

  const visibleColumns = columnOrder
    .map((id) => globalCaseColumns.find((col) => col.id === id)!)
    .filter((col) => columnVisibility[col.id]);

  const handlePopoverClose = () => {
    setColumnAnchorEl(null);
  };

  const RestrictedColumns = [
    {
      id: 'r_number',
      canHide: false,
      canDrag: false,
    },
  ];

  const isModalOpen = Boolean(columnAnchorEl);
  const modalId = isModalOpen
    ? 'global-case-column-visibility-popover'
    : undefined;

  const handleEdit = (caseItem: CaseGlobalList) => {
    const accountId = caseItem?.account_rid || '';
    const accountName = caseItem?.account_name || '';
    const path = generatePath(CASE_EDIT, {
      caseId: caseItem.rid,
    });
    const queryParams = new URLSearchParams({
      accountId,
      account_name: accountName || '',
      account_number: caseItem?.account_r_number || '',
      country_rid: caseItem?.country_rid || '',
      country_code: caseItem?.country_code || '',
    });
    navigate(`${path}?${queryParams.toString()}`);
  };

  const actionButtons: ActionItem<CaseGlobalList>[] = [
    {
      label: 'Edit',
      onClick: (row) => handleEdit(row),
      icon: EditIcon,
      disabled: (row) => row?.account_status_name?.toLowerCase() !== 'active',
      iconStyle: {
        filter:
          'brightness(0) saturate(100%) invert(25%) sepia(16%) saturate(592%) hue-rotate(164deg) brightness(93%) contrast(91%)',
      },
      hide: !casesFieldsEditable,
    },
  ];

  const handleCellEdit = async (rowId: string, updates: CellEditData[]) => {
    const previousCases = [...caseList];

    const rowData = caseList.find((data) => data.rid === rowId);
    if (!rowData) {
      errorToast('Row not found.');
      return;
    }

    const updateData = updates.reduce<Record<string, FieldChangeValue>>(
      (data, item) => {
        const key = item.editId || item.columnId;
        data[key] = item.value;
        return data;
      },
      {
        case_rid: rowId,
        account_rid: rowData?.account_rid,
      }
    );

    try {
      const res = await updateCaseMutation({
        variables: { data: updateData },
      });
      const result = res?.data?.updateInlineCaseDetails;
      if (result?.statusCode === 200 && result.data) {
        const updatedCase = result.data;
        setCaseList((prev) =>
          prev.map((data) => {
            if (data.rid === updatedCase.rid) {
              return {
                ...data,
                ...updatedCase,
              };
            }
            return data;
          })
        );
      } else {
        errorToast(result?.message || 'Failed to update field');
        setCaseList(previousCases);
      }
    } catch (error) {
      errorToast((error as Error)?.message || 'Failed to update field');
      setCaseList(previousCases);
    }
  };

  return (
    <div>
      <ManageColumnsPopover
        anchorEl={columnAnchorEl}
        open={isModalOpen}
        popoverId={modalId}
        onClose={handlePopoverClose}
        columns={globalCaseColumns}
        onColumnsChange={handleColumnsChange}
        columnRestrictions={RestrictedColumns}
      />
      <ListTable
        data={caseList}
        columns={visibleColumns}
        getRowId={getRowId}
        hoverHighlight={false}
        tableStyle={{
          height: '100%',
          maxHeight: 'calc(100vh - 180px)',
          overflow: 'auto',
        }}
        stickyHeader={true}
        stickyColumnsCount={2}
        selectable={true}
        expandable={false}
        onSelectionChange={(selectedIds) =>
          console.log('Selected:', selectedIds)
        }
        actionWidth={60}
        actionDisplayMode='dropdown'
        actionMenuItems={actionButtons}
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
        onCellEdit={handleCellEdit}
      />
    </div>
  );
};
