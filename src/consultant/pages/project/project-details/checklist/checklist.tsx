import React, { useEffect, useMemo, useState } from 'react';
import {
  generatePath,
  useNavigate,
  useParams,
  useSearchParams,
} from 'react-router-dom';
import {
  AllModules,
  AllPermissions,
  FilterTypes,
  OverviewTabs,
} from '../../../../../common-service';
import {
  ChecklistList,
  ChecklistListExportParams,
  ExportType,
} from '../../../../types';
import { useChecklistList } from '../../../../services/checklist/checklist-service';
import { CHECKLIST_CREATE, CHECKLIST_EDIT } from '../../../../../routes';
import {
  getChecklistFilterFields,
  getChecklistTableColumns,
} from '../../../checklist/helpers';
import {
  CellEditData,
  FieldChangeValue,
  ShowHideTableColumn,
} from '../../../../../components/table/types';
import { SectionTabPanel } from '../../../../../components';
import ChecklistDetails from './checklist-details';
import SectionHeader from '../../../../../components/details-section/section-header';
import { ChecklistIcon } from '../../../../../assets';
import {
  ListTable,
  ManageColumnsPopover,
} from '../../../../../components/table';
import { useSelector } from 'react-redux';
import { RootState } from '../../../../../store/store';
import { checkPermission } from '../../../../../common-utils';
import { AccessRestricted } from '../../../../../components/account-restricted';
import { useToast } from '../../../../../hooks';
import { useMutation } from '@apollo/client';
import { CHECKLIST_UPDATE } from '../../../../../api/graphql/queries/checklist-query';
import { caseClient } from '../../../../../api/graphql/clients/client';

const ChecklistTabs: OverviewTabs[] = [
  {
    id: AllPermissions.CHECKLIST_OVERVIEW,
    name: 'Overview',
    hide: false,
  },
  // Future tabs like timeline can be added here
];

interface ChecklistProps {
  setExportType?: (type: ExportType) => void;
  setChecklistParams: React.Dispatch<
    React.SetStateAction<ChecklistListExportParams>
  >;
  accountOrProjectInActive: boolean;
  projectFiscalYear?: number | string;
  projectCode?: string;
}

const Checklist: React.FC<ChecklistProps> = ({
  setExportType,
  setChecklistParams,
  accountOrProjectInActive,
  projectFiscalYear,
  projectCode,
}) => {
  const { errorToast } = useToast();
  const [searchParams] = useSearchParams();
  const { projectid: projectID } = useParams();
  const accountId = searchParams.get('accountID') || '';
  const navigate = useNavigate();

  const [appliedFilters, setAppliedFilters] = useState<FilterTypes>({});
  const [showFilter, setShowFilter] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [refreshChecklist, setRefreshChecklist] = useState<number>(Date.now());
  const [rowsPerPage, setRowsPerPage] = useState(100);
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('ASC');
  const [sortField, setSortField] = useState<string>('r_number');
  const [checklistList, setChecklistList] = useState<ChecklistList[]>([]);
  const [sortFilterCount, setSortFilterCount] = useState<number>(0);
  const [searchText, setSearchText] = useState('');

  const [columnAnchorEl, setColumnAnchorEl] =
    React.useState<HTMLButtonElement | null>(null);

  const isModalOpen = Boolean(columnAnchorEl);
  const handleColumnVisibility = (
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    setColumnAnchorEl(event.currentTarget);
  };

  const [updateChecklist] = useMutation(CHECKLIST_UPDATE, {
    client: caseClient,
  });

  const { permission, modules } = useSelector(
    (state: RootState) => state.permission
  );

  const checklistId = searchParams.get('checklist_id');
  const viewDetails = !!checklistId;
  const activeMenuPath = searchParams.get('activeMenu') || '';

  // Fetch Checklist List
  const { data, isLoading, isError } = useChecklistList(
    {
      page: currentPage + 1,
      limit: rowsPerPage,
      sortBy: sortField,
      sortOrder: sortOrder,
      filters: appliedFilters,
      attachmentLevel: 'project',
      accountRid: accountId || '',
      entityId: projectID || '',
      search: searchText,
      fiscalYear: 0,
    },
    !viewDetails,
    refreshChecklist
  );

  const totalItems = data?.count || 0;

  useEffect(() => {
    if (data) {
      setChecklistList(data.checklists || []);
    }
  }, [data]);

  useEffect(() => {
    if (setExportType) {
      setExportType('checklist');
    }
    setChecklistParams({
      sortBy: sortField,
      sortOrder: sortOrder,
      filters: appliedFilters,
      fiscalYear: 0,
      search: searchText,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appliedFilters, sortField, sortOrder, searchText]);

  // Permissions management
  const checklistEnable = checkPermission(modules, AllModules.CHECKLISTS);

  const isChecklistViewEnable = checkPermission(
    permission,
    AllPermissions.CHECKLIST_VIEW_EDIT
  );

  const isChecklistCreateEnable = checkPermission(
    permission,
    AllPermissions.CHECKLIST_CREATE
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

  const handleFilter = () => setShowFilter(!showFilter);
  const onRefreshClick = () => setRefreshChecklist(Date.now());

  const handleSorting = (sortBy: string, sortOrder: 'asc' | 'desc') => {
    const defaultSortField = 'r_number';
    const defaultSortOrder = 'ASC';
    const apiOrder = sortOrder.toUpperCase() as 'ASC' | 'DESC';

    if (!sortBy) {
      setSortFilterCount(0);
      setSortOrder(defaultSortOrder);
      setSortField(defaultSortField);
    } else {
      setSortFilterCount(1);
      setSortOrder(apiOrder);
      setSortField(sortBy);
    }
  };

  const handleCreate = () => {
    const path = generatePath(CHECKLIST_CREATE, {
      module: 'project',
    });
    const queryParams = new URLSearchParams({
      accountId,
      entityLevel: 'project',
      entityId: projectID || '',
      projectFiscalYear: projectFiscalYear?.toString() || '',
      source: `Project > ${projectCode}`,
      ...(!activeMenuPath ? {} : { activeMenu: activeMenuPath }),
    });
    navigate(`${path}?${queryParams.toString()}`);
  };

  const handleEdit = (row: ChecklistList) => {
    const path = generatePath(CHECKLIST_EDIT, {
      module: 'project',
      checklistId: row.rid,
    });
    const queryParams = new URLSearchParams({
      accountId,
      entityLevel: row.attachment_level || 'project',
      entityId: row.attach_to || projectID || '',
      projectFiscalYear: projectFiscalYear?.toString() || '',
      source: `Project > ${projectCode}`,
      ...(!activeMenuPath ? {} : { activeMenu: activeMenuPath }),
    });
    navigate(`${path}?${queryParams.toString()}`);
  };

  const headerButtons = [
    {
      label: 'New',
      variant: 'outlined' as const,
      disabled: accountOrProjectInActive,
      onClick: handleCreate,
      sx: { width: '48px', minWidth: '48px' },
      hide: !isChecklistCreateEnable,
    },
    {
      label: 'Show/Hide Fields',
      variant: 'outlined' as const,
      onClick: handleColumnVisibility,
      sx: { width: '125px', minWidth: '125px' },
    },
  ];

  const actionMenuItems = [
    {
      label: 'Edit',
      disabled: accountOrProjectInActive,
      onClick: (row: ChecklistList) => handleEdit(row),
      hide: !checklistFieldsEditable,
    },
  ];

  const handlePageChange = (newPage: number) => setCurrentPage(newPage);
  const handleRowsPerPageChange = (newSize: number) => {
    setRowsPerPage(newSize);
    setCurrentPage(1);
  };

  const handleSortRequest = (property: string, order: 'asc' | 'desc') => {
    const apiOrder = order.toUpperCase() as 'ASC' | 'DESC';
    setSortOrder(apiOrder);
    setSortField(property);
  };

  const handleChecklistView = (rowId: string) => {
    if (rowId) {
      searchParams.set('checklist_id', rowId);
      navigate({ search: searchParams.toString() }, { replace: true });
    }
  };

  const checklistColumns = getChecklistTableColumns(
    permissionMap,
    accountOrProjectInActive,
    handleChecklistView
  );

  const checklistFilterFields = getChecklistFilterFields(permissionMap);

  const getRowId = (row: ChecklistList) => row.rid;

  const handlePopoverClose = () => setColumnAnchorEl(null);
  const modalId = isModalOpen
    ? 'project-checklist-list-column-visibility-popover'
    : undefined;

  const RestrictedColumns = [
    { id: 'r_number', canHide: false, canDrag: false },
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
        attachment_level: rowData?.attachment_level,
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
    <div className='w-full pt-2 pl-2 pr-4'>
      <SectionTabPanel
        tabs={ChecklistTabs}
        filterMenu={checklistFilterFields}
        filterVisibility={!viewDetails}
        showFilter={showFilter}
        contextKey='checklist'
        appliedFilters={appliedFilters}
        setAppliedFilters={setAppliedFilters}
        setCurrentPage={setCurrentPage}
        handleFilter={handleFilter}
        handleSorting={handleSorting}
        sortFilterCount={sortFilterCount}
        setSortFilterCount={setSortFilterCount}
        showRefresh={!viewDetails}
        onRefreshClick={onRefreshClick}
        showSearch={!viewDetails}
        searchDisabled={false}
        searchPlaceholder='Search'
        onSearch={(text) => setSearchText(text)}
      />

      {viewDetails ? (
        <ChecklistDetails
          accountOrProjectInActive={accountOrProjectInActive}
          projectCode={projectCode || ''}
          projectFiscalYear={projectFiscalYear || ''}
        />
      ) : (
        <>
          <SectionHeader
            title='Checklist'
            count={totalItems}
            showItemCount={true}
            titleIcon={
              <ChecklistIcon
                className='[&>path]:stroke-white'
                alt='Checklist-header-icon'
              />
            }
            buttons={headerButtons}
            iconBg='#FFB46E'
            bgType='circle'
          />

          <div className='border border-[#CBD6E2]'>
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
                maxHeight: 'calc(100vh - 380px)',
                overflow: 'auto',
              }}
              stickyHeader={true}
              stickyColumnsCount={1}
              selectable={false}
              actionWidth={80}
              actionDisplayMode='dropdown'
              actionMenuItems={actionMenuItems}
              loading={isLoading}
              error={isError ? 'Failed to load checklist records' : undefined}
              rowsPerPageOptions={[25, 50, 100]}
              rowsPerPage={rowsPerPage}
              currentPage={currentPage}
              totalItems={totalItems}
              onPageChange={handlePageChange}
              onRowsPerPageChange={handleRowsPerPageChange}
              sortBy={sortField}
              sortOrder={sortOrder.toUpperCase() as 'ASC' | 'DESC'}
              onSort={handleSortRequest}
              onCellEdit={handleCellEdit}
            />
          </div>
        </>
      )}
    </div>
  );
};

export default Checklist;
