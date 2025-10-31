import { useEffect, useMemo, useState } from 'react';
import { getCaseListColumns } from './columns';
import { generatePath, useNavigate, useParams } from 'react-router-dom';
import { CaseList, CaseListParams } from '../../../../../types';
import {
  ActionItem,
  ShowHideTableColumn,
} from '../../../../../../components/table/types';
import { CASE_DETAILS, CASE_EDIT } from '../../../../../../routes';
import {
  ListTable,
  ManageColumnsPopover,
} from '../../../../../../components/table';
import { EditIcon } from '../../../../../../assets';
import { useCaseList } from '../../../../../services/cases/case-service';
import { useSelector } from 'react-redux';
import { RootState } from '../../../../../../store/store';
import { accountDetailsProps } from '../../../../account-details/utils';
import { AllPermissions } from '../../../../../../common-service';

interface ICaseTableProps {
  appliedFilters: Record<string, string | number | boolean | string[]>;
  tableParams: CaseListParams;
  isCaseEditEnable?: boolean;
  isCaseDeleteEnable?: boolean;
  setTableParams: React.Dispatch<React.SetStateAction<CaseListParams>>;
  setTotalCount: React.Dispatch<React.SetStateAction<number>>;
  refreshTrigger?: number;
  columnAnchorEl: HTMLButtonElement | null;
  setColumnAnchorEl: React.Dispatch<
    React.SetStateAction<HTMLButtonElement | null>
  >;
  accountDetails: accountDetailsProps;
  searchText: string;
}

export const CaseListTable: React.FC<ICaseTableProps> = ({
  appliedFilters,
  tableParams,
  setTableParams,
  setTotalCount,
  refreshTrigger,
  columnAnchorEl,
  setColumnAnchorEl,
  accountDetails,
  searchText,
}) => {
  const navigate = useNavigate();
  const { accountid } = useParams();
  const [caseList, setCaseList] = useState<CaseList[]>([]);
  const { fiscalYear } = useSelector<RootState, { fiscalYear: string }>(
    (state: RootState) => state.account
  );
  const { permission } = useSelector((state: RootState) => state.permission);

  const newFiscalYear = fiscalYear !== 'FY-All' ? Number(fiscalYear) : 0;
  const currencySymbol =
    accountDetails?.accountById?.currency?.currency_symbol || '';

  const { data, isLoading, isError } = useCaseList(
    {
      ...tableParams,
      filters: appliedFilters,
      fiscalYear: newFiscalYear,
      search: searchText,
    },
    accountid,
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

  const getRowId = (row: CaseList) => {
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

  const handleViewCaseDetails = (caseItem: CaseList) => {
    const path = generatePath(CASE_DETAILS, {
      caseId: caseItem.rid,
    });
    const queryParams = new URLSearchParams({
      accountID: accountid || '',
      account_name: accountDetails?.accountById?.account_name || '',
      account_number: accountDetails?.accountById?.r_number || '',
      country_rid: accountDetails?.accountById?.country_rid || '',
      country_code: accountDetails?.accountById?.country?.country_code || '',
      // activeMenu: 'account',
    });

    navigate(`${path}?${queryParams.toString()}`);
  };

  const caseColumns = getCaseListColumns(
    handleViewCaseDetails,
    currencySymbol,
    permissionMap
  );

  // show hide columns
  const [columnVisibility, setColumnVisibility] = useState<
    Record<string, boolean>
  >(Object.fromEntries(caseColumns.map((col) => [col.id, !col.hide])));

  const [columnOrder, setColumnOrder] = useState(
    caseColumns.map((col) => col.id)
  );

  const handleColumnsChange = (updatedColumns: ShowHideTableColumn[]) => {
    const newVisibility = Object.fromEntries(
      updatedColumns.map((col) => [col.id, !col.hide])
    );
    setColumnVisibility(newVisibility);
    setColumnOrder(updatedColumns.map((col) => col.id));
  };

  const visibleColumns = columnOrder
    .map((id) => caseColumns.find((col) => col.id === id)!)
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
  const modalId = isModalOpen ? 'case-column-visibility-popover' : undefined;

  const handleEdit = (caseItem: CaseList) => {
    const accountId = accountid ?? '';
    const accountName = accountDetails?.accountById?.account_name || '';
    const path = generatePath(CASE_EDIT, {
      caseId: caseItem.rid,
    });
    const queryParams = new URLSearchParams({
      accountId,
      account_name: accountDetails?.accountById?.account_name || '',
      account_number: accountDetails?.accountById?.r_number || '',
      country_rid: accountDetails?.accountById?.country_rid || '',
      country_code: accountDetails?.accountById?.country?.country_code || '',
      source: `Account > ${accountName}`,
      // activeMenu: 'account',
    });
    navigate(`${path}?${queryParams.toString()}`);
  };

  const actionButtons: ActionItem<CaseList>[] = [
    {
      label: 'Edit',
      onClick: (row) => handleEdit(row),
      icon: EditIcon,
      iconStyle: {
        filter:
          'brightness(0) saturate(100%) invert(25%) sepia(16%) saturate(592%) hue-rotate(164deg) brightness(93%) contrast(91%)',
      },
      hide: !casesFieldsEditable,
    },
  ];

  return (
    <div>
      <ManageColumnsPopover
        anchorEl={columnAnchorEl}
        open={isModalOpen}
        popoverId={modalId}
        onClose={handlePopoverClose}
        columns={caseColumns}
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
          maxHeight: 'calc(100vh - 320px)',
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
      />
    </div>
  );
};
