import { useEffect, useMemo, useState } from 'react';
import {
  ListTable,
  ManageColumnsPopover,
} from '../../../../../../components/table';
import {
  generatePath,
  useNavigate,
  useParams,
  useSearchParams,
} from 'react-router-dom';
import { ChecklistList } from '../../../../../types';
import {
  CellEditData,
  FieldChangeValue,
  ShowHideTableColumn,
} from '../../../../../../components/table/types';
import { RootState } from '../../../../../../store/store';
import { useSelector } from 'react-redux';
import { useChecklistList } from '../../../../../services/checklist/checklist-service';
import { getChecklistTableColumns } from '../../../../checklist/helpers';
import { CHECKLIST_EDIT } from '../../../../../../routes';
import {
  AllModules,
  AllPermissions,
  FilterTypes,
} from '../../../../../../common-service';
import ResourceChecklistDetails from './resource-checklist-details';
import { checkPermission } from '../../../../../../common-utils';
import { AccessRestricted } from '../../../../../../components/account-restricted';
import { useToast } from '../../../../../../hooks';
import { useMutation } from '@apollo/client';
import { CHECKLIST_UPDATE } from '../../../../../../api/graphql/queries/checklist-query';
import { caseClient } from '../../../../../../api/graphql/clients/client';

interface ResourceChecklistListProps {
  fiscalYear?: number;
  appliedFilters?: FilterTypes;
  resourceRid: string;
  order: 'ASC' | 'DESC';
  setOrder: (order: 'ASC' | 'DESC') => void;
  orderBy: string;
  setOrderBy: (field: keyof ChecklistList) => void;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  refreshChecklist?: number;
  setCount?: (count: number) => void;
  resourceInActive: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  accountDetails?: Record<string, any>;
  columnAnchorEl: HTMLButtonElement | null;
  setColumnAnchorEl: React.Dispatch<
    React.SetStateAction<HTMLButtonElement | null>
  >;
  searchValue?: string;
  resourceNumber?: string;
}

const ResourceChecklistList: React.FC<ResourceChecklistListProps> = ({
  appliedFilters,
  resourceRid,
  currentPage,
  setCurrentPage,
  order,
  setOrder,
  orderBy,
  setOrderBy,
  refreshChecklist,
  accountDetails,
  setCount,
  columnAnchorEl,
  setColumnAnchorEl,
  searchValue,
  resourceNumber,
  resourceInActive,
}) => {
  const { errorToast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { accountid } = useParams();
  const [rowsPerPage, setRowsPerPage] = useState<number>(100);
  const [checklistList, setChecklistList] = useState<ChecklistList[]>([]);

  const [updateChecklist] = useMutation(CHECKLIST_UPDATE, {
    client: caseClient,
  });

  const { fiscalYear } = useSelector<RootState, { fiscalYear: string }>(
    (state: RootState) => state.account
  );
  const { permission, modules } = useSelector(
    (state: RootState) => state.permission
  );
  const convertedFiscalYear = fiscalYear !== 'FY-All' ? Number(fiscalYear) : 0;
  const checklistId = searchParams.get('checklist_id');
  const viewDetails = !!checklistId;

  const { data, isLoading, isError } = useChecklistList(
    {
      page: currentPage + 1,
      limit: rowsPerPage,
      sortBy: orderBy,
      sortOrder: order,
      filters: appliedFilters,
      attachmentLevel: 'resource',
      accountRid: accountid,
      entityId: resourceRid || '',
      fiscalYear: convertedFiscalYear,
      search: searchValue,
    },
    !viewDetails,
    refreshChecklist
  );
  const totalItems = data?.count || 0;

  useEffect(() => {
    if (data) {
      setChecklistList(data.checklists || []);
    }
    setCount?.(data?.count || 0);
  }, [data, setCount]);

  const accountInActive =
    accountDetails?.data?.accountById?.status?.status_name?.toLowerCase() !==
      'active' || resourceInActive;

  // Permissions
  const checklistEnable = checkPermission(modules, AllModules.CHECKLISTS);

  const isChecklistViewEnable = checkPermission(
    permission,
    AllPermissions.CHECKLIST_VIEW_EDIT
  );

  const checklistEditFields = useMemo(
    () =>
      permission?.find(
        (item) => item.name === AllPermissions.CHECKLIST_VIEW_EDIT
      )?.fields ?? [],
    [permission]
  );

  const checklistFieldsEditable = useMemo(
    () =>
      permission
        .find((item) => item.name === AllPermissions.CHECKLIST_VIEW_EDIT)
        ?.fields?.some((field) => field.edit),
    [permission]
  );

  const permissionMap = useMemo(() => {
    const map: Record<string, { read: boolean; edit: boolean }> = {};
    checklistEditFields.forEach((item) => {
      map[item.name] = { read: item.read ?? false, edit: item.edit ?? false };
    });
    return map;
  }, [checklistEditFields]);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  // handles page limit change
  const handleRowsPerPageChange = (newPageSize: number) => {
    setRowsPerPage(newPageSize);
    setCurrentPage(0);
  };

  const handleSortRequest = (property: string, sortOrder: 'asc' | 'desc') => {
    const apiOrder = sortOrder.toUpperCase() as 'ASC' | 'DESC';
    setOrder(apiOrder);
    setOrderBy(property as keyof ChecklistList);
  };

  const handleChecklistView = (rowId: string) => {
    if (rowId) {
      searchParams.set('checklist_id', rowId);
      navigate({ search: searchParams.toString() }, { replace: true });
    }
  };

  const checklistColumns = getChecklistTableColumns(
    permissionMap,
    accountInActive,
    handleChecklistView
  );
  const getRowId = (row: ChecklistList) => row.rid;

  const isModalOpen = Boolean(columnAnchorEl);

  const handlePopoverClose = () => {
    setColumnAnchorEl(null);
  };

  const modalId = isModalOpen
    ? 'resource-checklist-list-column-visibility-popover'
    : undefined;

  const RestrictedColumns = [
    {
      id: 'r_number',
      canHide: false,
      canDrag: false,
    },
  ];

  const [columnVisibility, setColumnVisibility] = useState<
    Record<string, boolean>
  >(Object.fromEntries(checklistColumns.map((col) => [col.id, !col.hide])));

  const [columnOrder, setColumnOrder] = useState(
    checklistColumns.map((col) => col.id)
  );

  const handleColumnsChange = (updatedColumns: ShowHideTableColumn[]) => {
    const newVisibility = Object.fromEntries(
      updatedColumns.map((col) => [col.id, !col.hide])
    );
    setColumnVisibility(newVisibility);
    setColumnOrder(updatedColumns.map((col) => col.id));
  };

  const visibleColumns = columnOrder
    .map((id) => checklistColumns.find((col) => col.id === id)!)
    .filter((col) => columnVisibility[col.id]);

  const handleEdit = (row: ChecklistList) => {
    const path = generatePath(CHECKLIST_EDIT, {
      module: 'account',
      checklistId: row.rid,
    });
    const queryParams = new URLSearchParams({
      accountId: accountid || '',
      entityLevel: row.attachment_level || 'resource',
      entityId: row.attach_to || '',
      source: `Resource > ${resourceNumber}`,
    });
    navigate(`${path}?${queryParams.toString()}`);
  };

  const actionMenuItems = [
    {
      label: 'Edit',
      disabled: accountInActive,
      onClick: (row: ChecklistList) => handleEdit(row),
      hide: !checklistFieldsEditable,
    },
  ];

  const handleCellEdit = async (rowId: string, updates: CellEditData[]) => {
    const previousChecklist = [...checklistList];
    const rowData = checklistList.find((item) => item.rid === rowId);
    if (!rowData) {
      return;
    }

    const updateData = updates.reduce<Record<string, FieldChangeValue>>(
      (acc, item) => {
        let value = item.value;
        if (item.columnId === 'fiscal_year' && typeof value === 'string') {
          const numValue = Number(value);
          value = !isNaN(numValue) ? numValue : value;
        }
        acc[item.editId || item.columnId] = value;
        return acc;
      },
      {
        rid: rowId,
        account_rid: rowData?.account_rid,
        entity_id: rowData?.attach_to,
        attachement_level: rowData?.attachment_level,
      }
    );

    try {
      const res = await updateChecklist({
        variables: { data: updateData },
      });
      const result = res.data?.updateCheckListInline;
      if (result?.statusCode === 200 && result.data) {
        const updatedItem = result.data;
        setChecklistList((prev) =>
          prev.map((item) =>
            item.rid === updatedItem.rid ? { ...item, ...updatedItem } : item
          )
        );
      } else {
        errorToast(result?.statusMessage || 'Failed to update field');
        setChecklistList(previousChecklist);
      }
    } catch (error) {
      errorToast((error as Error)?.message || 'Failed to update field');
      setChecklistList(previousChecklist);
    }
  };

  if (!checklistEnable || !isChecklistViewEnable) return <AccessRestricted />;

  return (
    <>
      {viewDetails ? (
        <ResourceChecklistDetails
          accountInActive={accountInActive}
          resourceNumber={resourceNumber}
        />
      ) : (
        <div>
          <ManageColumnsPopover
            anchorEl={columnAnchorEl}
            open={isModalOpen}
            popoverId={modalId}
            onClose={handlePopoverClose}
            columns={checklistColumns}
            onColumnsChange={handleColumnsChange}
            columnRestrictions={RestrictedColumns}
          />
          <ListTable
            data={checklistList}
            columns={visibleColumns}
            getRowId={getRowId}
            hoverHighlight={false}
            tableStyle={{
              borderBottom: '1px solid #CBD6E2',
              height: '100%',
              maxHeight: 'calc(100vh - 450px)',
              overflow: 'auto',
            }}
            stickyHeader={true}
            stickyColumnsCount={1}
            selectable={false}
            actionWidth={80}
            actionDisplayMode='dropdown'
            actionMenuItems={actionMenuItems}
            loading={isLoading}
            error={isError ? 'Failed to load checklist data' : undefined}
            rowsPerPageOptions={[25, 50, 100]}
            rowsPerPage={rowsPerPage}
            currentPage={currentPage}
            totalItems={totalItems}
            onPageChange={handlePageChange}
            onRowsPerPageChange={handleRowsPerPageChange}
            sortBy={orderBy}
            sortOrder={order.toUpperCase() as 'ASC' | 'DESC'}
            onSort={handleSortRequest}
            onCellEdit={handleCellEdit}
          />
        </div>
      )}
    </>
  );
};

export default ResourceChecklistList;
