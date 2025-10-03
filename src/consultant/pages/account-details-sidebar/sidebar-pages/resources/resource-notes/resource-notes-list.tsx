import { useEffect, useState } from 'react';
import { AttachmentList } from '../../../../../types/attachment';
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
import { ShowHideTableColumn } from '../../../../../../components/table/types';
import { RootState } from '../../../../../../store/store';
import { useSelector } from 'react-redux';
import { useNotesList } from '../../../../../services/notes/notes-service';
import { getNotesTableColumns } from '../../../../notes/helpers';
import { NOTES_EDIT } from '../../../../../../routes';
import { FilterTypes } from '../../../../../../common-service';
import NotesDetails from './resource-notes-details';

interface ResourceNotesListProps {
  fiscalYear?: number;
  appliedFilters?: FilterTypes;
  resourceRid: string;
  order: 'ASC' | 'DESC';
  setOrder: (order: 'ASC' | 'DESC') => void;
  orderBy: string;
  setOrderBy: (field: keyof AttachmentList) => void;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  refreshNotes?: number;
  setCount?: (count: number) => void;
  resourceInActive?: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  accountDetails?: Record<string, any>;
  columnAnchorEl: HTMLButtonElement | null;
  setColumnAnchorEl: React.Dispatch<
    React.SetStateAction<HTMLButtonElement | null>
  >;
  searchValue?: string;
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
}) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { accountid } = useParams();
  const [rowsPerPage, setRowsPerPage] = useState<number>(100);
  const [notesList, setNotesList] = useState<NotesList[]>([]);

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
      noteLevel: 'resource',
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
    'active';

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
    setOrderBy(property as keyof AttachmentList);
  };

  const handleNoteView = (rowId: string) => {
    if (rowId) {
      searchParams.set('note_id', rowId);
      navigate({ search: searchParams.toString() }, { replace: true });
    }
  };

  const notesColumns = getNotesTableColumns(handleNoteView);
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
      entityLevel: 'resource',
      entityId: resourceRid || '',
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

  return (
    <>
      {viewDetails ? (
        <NotesDetails accountInActive={accountInActive} />
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
          />
        </div>
      )}
    </>
  );
};

export default ResourceNotesList;
