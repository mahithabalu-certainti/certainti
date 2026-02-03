import { useSelector } from 'react-redux';
import { FilterState, NotesList, NotesListURLParams } from '../../../../types';
import { RootState } from '../../../../../store/store';
import { useEffect, useMemo, useState } from 'react';
import { useAllNotesList } from '../../../../services/notes/notes-service';
import {
  checkPermission,
  reshapeGlobalFilter,
} from '../../../../../common-utils';
import { getNotesTableColumns } from '../../helpers';
import {
  ListTable,
  ManageColumnsPopover,
} from '../../../../../components/table';
import {
  CellEditData,
  FieldChangeValue,
  ShowHideTableColumn,
} from '../../../../../components/table/types';
import { AllPermissions, FilterTypes } from '../../../../../common-service';
import { useToast } from '../../../../../hooks';
import { useMutation } from '@apollo/client';
import { NOTES_UPDATE } from '../../../../../api/graphql/queries/notes-query';
import { resourceClient } from '../../../../../api/graphql/clients/client';
import { generatePath, useNavigate } from 'react-router-dom';
import { GLOBAL_NOTES_EDIT } from '../../../../../routes';

interface NotesTableProps {
  appliedFilters: FilterTypes;
  tableParams: NotesListURLParams;
  setTableParams: React.Dispatch<React.SetStateAction<NotesListURLParams>>;
  setTotalCount: React.Dispatch<React.SetStateAction<number>>;
  refreshTrigger?: number;
  columnAnchorEl: HTMLButtonElement | null;
  setColumnAnchorEl: React.Dispatch<
    React.SetStateAction<HTMLButtonElement | null>
  >;
  searchValue?: string;
  userListOptions: { value: string; label: string }[];
}

export const NotesTable: React.FC<NotesTableProps> = ({
  appliedFilters,
  tableParams,
  setTableParams,
  setTotalCount,
  refreshTrigger,
  setColumnAnchorEl,
  columnAnchorEl,
  searchValue,
  userListOptions,
}) => {
  const navigate = useNavigate();
  const { errorToast } = useToast();
  const { fiscalYear, filters } = useSelector<
    RootState,
    { filters: unknown; fiscalYear: string }
  >((state: RootState) => state.account);
  const [notesList, setNotesList] = useState<NotesList[]>([]);
  const { permission } = useSelector((state: RootState) => state.permission);

  const [updateNotes] = useMutation(NOTES_UPDATE, {
    client: resourceClient,
  });

  const newFiscalYear = fiscalYear !== 'FY-All' ? Number(fiscalYear) : 0;

  const { data, isLoading, isError } = useAllNotesList(
    {
      ...tableParams,
      search: searchValue,
      filters: appliedFilters,
      globalFilters: reshapeGlobalFilter(filters as FilterState),
      fiscalYear: newFiscalYear,
    },
    refreshTrigger
  );
  const totalItems = data?.count || 0;

  useEffect(() => {
    if (setTotalCount) {
      setTotalCount(totalItems);
    }
  }, [totalItems, setTotalCount]);

  useEffect(() => {
    if (data) {
      setNotesList(data.notes || []);
    }
  }, [data]);

  // Permissions
  const isNotesExportEnable = checkPermission(
    permission,
    AllPermissions.NOTES_EXPORT
  );

  const notesEditFields = useMemo(
    () =>
      permission?.find((item) => item.name === AllPermissions.NOTES_VIEW_EDIT)
        ?.fields ?? [],
    [permission]
  );

  const notesFieldsEditable = useMemo(
    () =>
      permission
        .find((item) => item.name === AllPermissions.NOTES_VIEW_EDIT)
        ?.fields?.some((field) => field.edit),
    [permission]
  );

  const permissionMap = useMemo(() => {
    const map: Record<string, { read: boolean; edit: boolean }> = {};
    notesEditFields.forEach((item) => {
      map[item.name] = { read: item.read ?? false, edit: item.edit ?? false };
    });
    return map;
  }, [notesEditFields]);

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

  const getRowId = (row: NotesList) => row?.notes_rid || '';

  const handleDownload = (documentUrl: string) => {
    if (!documentUrl) return;

    const link = document.createElement('a');
    link.href = documentUrl;
    link.download = '';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleEdit = (row: NotesList) => {
    const path = generatePath(GLOBAL_NOTES_EDIT, {
      noteId: row?.notes_rid || '',
    });
    const queryParams = new URLSearchParams({
      accountId: row?.account_rid || '',
      entityLevel: row?.attachment_level || '',
      entityId: row?.attach_to || '',
      source: `Notes`,
    });
    navigate(`${path}?${queryParams.toString()}`);
  };

  const actionMenuItems = [
    {
      label: 'Edit',
      disabled: (row: NotesList) =>
        row?.status_name?.toLowerCase() !== 'active',
      onClick: (row: NotesList) => handleEdit(row),
      hide: !notesFieldsEditable,
    },
  ];

  const handleViewGlobalNoteDetails = (row: NotesList) => {
    if (!row?.attachment_level) return;

    const noteId = row?.notes_rid || '';
    const attachTo = row?.attach_to || '';
    const parentId = row?.parent_rid || '';
    const accountId = row?.account_rid || '';
    const currencyId = row?.currency_rid || '';

    switch (row.attachment_level.toLowerCase()) {
      // Account-level notes
      case 'account':
        navigate(
          `/account/details/${attachTo}?list=notes&note_id=${noteId}&activeMenu=notes&origin=notes`
        );
        break;

      // Resource-level notes
      case 'resource':
        navigate(
          `/account/details/${accountId}?list=resources&res_id=${attachTo}&tab=notes&note_id=${noteId}&activeMenu=notes&origin=notes`
        );
        break;

      // Resource sub-level (cost or skill)
      case 'resource_cost':
      case 'resource_skill':
        navigate(
          `/account/details/${accountId}?list=resources&res_id=${parentId}&tab=notes&note_id=${noteId}&activeMenu=notes&origin=notes`
        );
        break;

      // Project-level notes
      case 'project':
        navigate(
          `/project/details/${attachTo}?accountID=${accountId}&source=account&currency_rid=${currencyId}&list=notes&note_id=${noteId}&activeMenu=notes&origin=notes`
        );
        break;

      // Project sub-level (task or resource)
      case 'project_task':
      case 'project_resource':
        navigate(
          `/project/details/${parentId}?accountID=${accountId}&source=account&currency_rid=${currencyId}&list=notes&note_id=${noteId}&activeMenu=notes&origin=notes`
        );
        break;

      // Case-level notes
      case 'case':
        navigate(
          `/case/details/${attachTo}?accountID=${accountId}&list=notes&note_id=${noteId}&activeMenu=notes&origin=notes`
        );
        break;

      default:
        console.warn('Unknown attachment level:', row?.attachment_level);
    }
  };

  const notesColumns = getNotesTableColumns(
    false,
    undefined,
    handleDownload,
    isNotesExportEnable,
    permissionMap,
    userListOptions,
    handleViewGlobalNoteDetails,
    true
  );

  const handlePopoverClose = () => {
    setColumnAnchorEl(null);
  };
  const isModalOpen = Boolean(columnAnchorEl);

  const modalId = isModalOpen
    ? 'global-notes-list-column-visibility-popover'
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
  >(Object.fromEntries(notesColumns.map((col) => [col.id, !col.hide])));

  const [columnOrder, setColumnOrder] = useState(
    notesColumns.map((col) => col.id)
  );

  const handleColumnsChange = (updatedColumns: ShowHideTableColumn[]) => {
    const newVisibility = Object.fromEntries(
      updatedColumns.map((col) => [col.id, !col.hide])
    );
    setColumnVisibility(newVisibility);
    setColumnOrder(updatedColumns.map((col) => col.id));
  };

  const visibleColumns = columnOrder
    .map((id) => notesColumns.find((col) => col.id === id)!)
    .filter((col) => columnVisibility[col.id]);

  const handleCellEdit = async (rowId: string, updates: CellEditData[]) => {
    const previousNotes = [...notesList];
    // Find account_id
    const rowData = notesList.find((note) => note?.notes_rid === rowId);

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
      }
    );

    try {
      const res = await updateNotes({
        variables: { data: updateData },
      });
      const result = res.data?.updateNotesInline;
      if (result?.statusCode === 200 && result.data) {
        const updateNotes = result.data;
        setNotesList((prev) =>
          prev.map((note) => {
            if (note?.notes_rid === updateNotes.rid) {
              return {
                ...note,
                ...updateNotes,
              };
            }
            return note;
          })
        );
      } else {
        errorToast(result?.statusMessage || 'Failed to update filed');
        setNotesList(previousNotes);
      }
    } catch (error) {
      errorToast((error as Error)?.message || 'Failed to update filed');
      setNotesList(previousNotes);
    }
  };

  return (
    <>
      <ManageColumnsPopover
        anchorEl={columnAnchorEl}
        open={isModalOpen}
        popoverId={modalId}
        onClose={handlePopoverClose}
        columns={notesColumns}
        onColumnsChange={handleColumnsChange}
        columnRestrictions={RestrictedColumns}
      />
      <ListTable
        data={notesList || []}
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
        onSelectionChange={(selectedIds) =>
          console.log('Selected:', selectedIds)
        }
        actionWidth={60}
        actionDisplayMode='dropdown'
        actionMenuItems={actionMenuItems}
        loading={isLoading}
        error={isError ? 'Failed to load notes data' : undefined}
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
    </>
  );
};
