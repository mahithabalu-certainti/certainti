import { useEffect, useState } from 'react';
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
import { NotesList } from '../../../../../types';
import {
  CellEditData,
  FieldChangeValue,
  ShowHideTableColumn,
} from '../../../../../../components/table/types';
import { RootState } from '../../../../../../store/store';
import { useSelector } from 'react-redux';
import { useNotesList } from '../../../../../services/notes/notes-service';
import { getNotesTableColumns } from '../../../../notes/helpers';
import { NOTES_EDIT } from '../../../../../../routes';
import { FilterTypes } from '../../../../../../common-service';
import NotesDetails from './resource-notes-details';
import { useToast } from '../../../../../../hooks';
import { NOTES_UPDATE } from '../../../../../../api/graphql/queries/notes-query';
import { resourceClient } from '../../../../../../api/graphql/clients/client';
import { useMutation } from '@apollo/client';

interface ResourceNotesListProps {
  fiscalYear?: number;
  appliedFilters?: FilterTypes;
  resourceRid: string;
  order: 'ASC' | 'DESC';
  setOrder: (order: 'ASC' | 'DESC') => void;
  orderBy: string;
  setOrderBy: (field: keyof NotesList) => void;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  refreshNotes?: number;
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
const ResourceNotesList: React.FC<ResourceNotesListProps> = ({
  appliedFilters,
  resourceRid,
  currentPage,
  setCurrentPage,
  order,
  setOrder,
  orderBy,
  setOrderBy,
  refreshNotes,
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
  const [notesList, setNotesList] = useState<NotesList[]>([]);

  const [updateNotes] = useMutation(NOTES_UPDATE, {
    client: resourceClient,
  });

  const { fiscalYear } = useSelector<RootState, { fiscalYear: string }>(
    (state: RootState) => state.account
  );
  const convertedFiscalYear = fiscalYear !== 'FY-All' ? Number(fiscalYear) : 0;
  const noteId = searchParams.get('note_id');
  const viewDetails = !!noteId;

  const { data, isLoading, isError } = useNotesList(
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
    refreshNotes
  );
  const totalItems = data?.count || 0;

  useEffect(() => {
    if (data) {
      setNotesList(data.notes || []);
    }
    setCount?.(data?.count || 0);
  }, [data, setCount]);

  const accountInActive =
    accountDetails?.data?.accountById?.status?.status_name?.toLowerCase() !==
      'active' || resourceInActive;

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
    setOrderBy(property as keyof NotesList);
  };

  const handleNoteView = (rowId: string) => {
    if (rowId) {
      searchParams.set('note_id', rowId);
      navigate({ search: searchParams.toString() }, { replace: true });
    }
  };

  const handleDownload = (documentUrl: string) => {
    if (!documentUrl) return;

    const link = document.createElement('a');
    link.href = documentUrl;
    link.download = '';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const notesColumns = getNotesTableColumns(
    accountInActive,
    handleNoteView,
    handleDownload
  );
  const getRowId = (row: NotesList) => row.rid;

  const isModalOpen = Boolean(columnAnchorEl);

  const handlePopoverClose = () => {
    setColumnAnchorEl(null);
  };

  const modalId = isModalOpen
    ? 'resource-notes-list-column-visibility-popover'
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

  const handleEdit = (row: NotesList) => {
    const path = generatePath(NOTES_EDIT, {
      module: 'account',
      noteId: row.rid,
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
      onClick: (row: NotesList) => handleEdit(row),
      hide: false,
    },
  ];

  const handleCellEdit = async (rowId: string, updates: CellEditData[]) => {
    const previousNotes = [...notesList];
    // Find account_id
    const rowData = notesList.find((note) => note.rid === rowId);

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
            if (note.rid === updateNotes.rid) {
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
      {viewDetails ? (
        <NotesDetails
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
            columns={notesColumns}
            onColumnsChange={handleColumnsChange}
            columnRestrictions={RestrictedColumns}
          />
          <ListTable
            data={notesList}
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
            error={isError ? 'Failed to load notes data' : undefined}
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

export default ResourceNotesList;
