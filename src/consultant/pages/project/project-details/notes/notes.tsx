import {
  generatePath,
  useNavigate,
  useParams,
  useSearchParams,
} from 'react-router-dom';
import {
  AllPermissions,
  FilterTypes,
  OverviewTabs,
} from '../../../../../common-service';
import { ExportType, NotesList, NotesListURLParams } from '../../../../types';
import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../../../../store/store';
import { useNotesList } from '../../../../services/notes/notes-service';
import { NOTES_CREATE, NOTES_EDIT } from '../../../../../routes';
import {
  getNotesFilterFields,
  getNotesTableColumns,
} from '../../../notes/helpers';
import {
  CellEditData,
  FieldChangeValue,
  ShowHideTableColumn,
} from '../../../../../components/table/types';
import { SectionTabPanel } from '../../../../../components';
import NotesDetails from './notes-details';
import SectionHeader from '../../../../../components/details-section/section-header';
import { NotesSideIcon } from '../../../../../assets';
import {
  ListTable,
  ManageColumnsPopover,
} from '../../../../../components/table';
import { useToast } from '../../../../../hooks';
import { useMutation } from '@apollo/client';
import { NOTES_UPDATE } from '../../../../../api/graphql/queries/notes-query';
import { resourceClient } from '../../../../../api/graphql/clients/client';

const NotesTabs: OverviewTabs[] = [
  {
    id: AllPermissions.NOTES_OVERVIEW,
    name: 'Overview',
    hide: false,
  },
  // {
  //   id: AllPermissions.NOTES_TIMELINE,
  //   name: 'Timeline',
  //   hide: false,
  //   disable: true,
  // },
];

interface NotesProps {
  setExportType?: (type: ExportType) => void;
  setNotesParams: React.Dispatch<React.SetStateAction<NotesListURLParams>>;
  accountInActive: boolean;
  projectFiscalYear?: number | string;
  projectCode?: string;
}

const Notes: React.FC<NotesProps> = ({
  setExportType,
  setNotesParams,
  accountInActive,
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
  const [refreshNotes, setRefreshNotes] = useState<number>(Date.now());
  const [rowsPerPage, setRowsPerPage] = useState(100);
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('ASC');
  const [sortField, setSortField] = useState<string>('r_number');
  const [notesList, setNotesList] = useState<NotesList[]>([]);
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
      sortBy: sortField,
      sortOrder: sortOrder,
      filters: appliedFilters,
      attachmentLevel: 'project',
      accountRid: accountId || '',
      entityId: projectID || '',
      search: searchText,
      fiscalYear: convertedFiscalYear,
    },
    !viewDetails,
    refreshNotes
  );
  const totalItems = data?.count || 0;

  useEffect(() => {
    if (data) {
      setNotesList(data.notes || []);
    }
  }, [data]);

  useEffect(() => {
    if (setExportType) {
      setExportType('notes');
    }
    setNotesParams({
      page: currentPage + 1,
      limit: rowsPerPage,
      sortBy: sortField,
      sortOrder: sortOrder,
      filters: appliedFilters,
      search: searchText,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    sortField,
    sortOrder,
    appliedFilters,
    currentPage,
    rowsPerPage,
    searchText,
  ]);

  const handleFilter = () => {
    setShowFilter(!showFilter);
  };
  const onRefreshClick = () => {
    setRefreshNotes(Date.now());
  };

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
    const path = generatePath(NOTES_CREATE, {
      module: 'project',
    });
    const queryParams = new URLSearchParams({
      accountId,
      entityLevel: 'project',
      entityId: projectID || '',
      projectFiscalYear: projectFiscalYear?.toString() || '',
      source: `Project > ${projectCode}`,
    });
    navigate(`${path}?${queryParams.toString()}`);
  };

  const handleEdit = (row: NotesList) => {
    const path = generatePath(NOTES_EDIT, {
      module: 'project',
      noteId: row.rid,
    });
    const queryParams = new URLSearchParams({
      accountId,
      entityLevel: row.attachment_level || 'project',
      entityId: row.attach_to || projectID || '',
      source: `Project > ${projectCode}`,
    });
    navigate(`${path}?${queryParams.toString()}`);
  };

  const headerButtons = [
    {
      label: 'New',
      variant: 'outlined' as const,
      disabled: accountInActive,
      onClick: () => handleCreate(),
      sx: { width: '48px', minWidth: '48px' },
      hide: false,
    },
    {
      label: 'Show/Hide Fields',
      variant: 'outlined' as const,
      disabled: false,
      onClick: handleColumnVisibility,
      sx: { width: '125px', minWidth: '125px' },
      hide: false,
    },
  ];

  const actionMenuItems = [
    {
      label: 'Edit',
      disabled: accountInActive,
      onClick: (row: NotesList) => handleEdit(row),
      hide: false,
    },
  ];

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const handleRowsPerPageChange = (newPageSize: number) => {
    setRowsPerPage(newPageSize);
    setCurrentPage(1);
  };

  const handleSortRequest = (property: string, sortOrder: 'asc' | 'desc') => {
    const apiOrder = sortOrder.toUpperCase() as 'ASC' | 'DESC';
    setSortOrder(apiOrder);
    setSortField(property);
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

  const notesFilterFields = getNotesFilterFields();

  const getRowId = (row: NotesList) => row.rid;

  const handlePopoverClose = () => {
    setColumnAnchorEl(null);
  };

  const modalId = isModalOpen
    ? 'project-notes-list-column-visibility-popover'
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
    const rowData = notesList.find((note) => note.rid === rowId);

    const updateData = updates.reduce<Record<string, FieldChangeValue>>(
      (acc, item) => {
        acc[item.editId || item.columnId] = item.value;
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
    <div className='w-full pt-2 pl-2 pr-4'>
      <SectionTabPanel
        tabs={NotesTabs}
        filterMenu={notesFilterFields}
        filterVisibility={viewDetails ? false : true}
        showFilter={showFilter}
        contextKey='notes'
        appliedFilters={appliedFilters}
        setAppliedFilters={setAppliedFilters}
        setCurrentPage={setCurrentPage}
        handleFilter={handleFilter}
        handleSorting={handleSorting}
        sortFilterCount={sortFilterCount}
        setSortFilterCount={setSortFilterCount}
        showRefresh={viewDetails ? false : true}
        onRefreshClick={onRefreshClick}
        showSearch={viewDetails ? false : true}
        searchDisabled={false}
        searchPlaceholder='Search'
        onSearch={(text) => setSearchText(text)}
      />
      {viewDetails ? (
        <NotesDetails
          accountInActive={accountInActive}
          projectFiscalYear={projectFiscalYear}
          projectCode={projectCode}
        />
      ) : (
        <>
          <SectionHeader
            title='Notes'
            count={totalItems}
            showItemCount={true}
            titleIcon={
              <NotesSideIcon
                className='[&>path]:stroke-white'
                alt='Notes-header-icon'
              />
            }
            buttons={headerButtons}
            iconBg='#7F81F4'
            bgType='circle'
          />
          <div className='border border-[#CBD6E2]'>
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
              error={isError ? 'Failed to load notes records' : undefined}
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

export default Notes;
