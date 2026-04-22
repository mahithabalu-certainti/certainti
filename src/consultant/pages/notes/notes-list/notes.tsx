import React, { Suspense, useMemo, useState } from 'react';
import {
  AllModules,
  AllPermissions,
  FilterTypes,
} from '../../../../common-service';
import { ColorCode, FilterState, NotesListURLParams } from '../../../types';
import {
  AccountSettingsIcon,
  ActionIcon,
  NewFilterIcon,
  NotesSideIcon,
  RefreshIcon,
} from '../../../../assets';
import { ActionsDropdown } from '../../../../components';
import SearchBar from '../../../../components/search/search-bar';
import Filter from '../../account-details-sidebar/components/filter/filter';
import { getNotesFilterFields } from '../helpers';
import { NotesTable } from './table/notes-table';
import { ExportNotesList } from '../../../services/notes/notes-service';
import { useSelector } from 'react-redux';
import { RootState } from '../../../../store/store';
import { checkPermission, reshapeGlobalFilter } from '../../../../common-utils';
import { AccessRestricted } from '../../../../components/account-restricted';
import { useManageUserList } from '../../../../admin/service';

export const Notes: React.FC = () => {
  const [appliedFilters, setAppliedFilters] = useState<FilterTypes>({});
  const [page, setPage] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [refreshTrigger, setRefreshTrigger] = useState(Date.now());
  const [searchText, setSearchText] = useState<string>('');
  const [tableParams, setTableParams] = useState<NotesListURLParams>({
    page: page,
    limit: 100,
    sortBy: 'r_number',
    sortOrder: 'ASC',
    fiscalYear: 0,
    isGlobal: true,
  });
  const [sortFilterCount, setSortFilterCount] = useState<number>(0);
  const [columnAnchorEl, setColumnAnchorEl] =
    React.useState<HTMLButtonElement | null>(null);

  // User List Api
  const { data: userListData } = useManageUserList({
    page: 1,
    limit: 2000,
    sortBy: 'first_name',
    sortOrder: 'ASC',
  });

  const { fiscalYear, filters } = useSelector<
    RootState,
    { filters: unknown; fiscalYear: string }
  >((state: RootState) => state.account);

  // Permission Management
  const { modules, permission } = useSelector(
    (state: RootState) => state.permission
  );
  const notesEnable = checkPermission(modules, AllModules.NOTES);

  const isNotesViewEnable = checkPermission(
    permission,
    AllPermissions.NOTES_VIEW_EDIT
  );

  const isNotesExportEnable = checkPermission(
    permission,
    AllPermissions.NOTES_EXPORT
  );

  const newFiscalYear = fiscalYear !== 'FY-All' ? Number(fiscalYear) : 0;

  const onRefreshClick = () => {
    setRefreshTrigger(Date.now());
  };

  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);

  const handleFilterModal = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleCloseFilter = () => {
    setAnchorEl(null);
  };

  const isFilterOpen = Boolean(anchorEl);
  const filterId = isFilterOpen ? 'all-notes-filter-popover' : undefined;

  const isModalOpen = Boolean(columnAnchorEl);
  const modalId = isModalOpen
    ? 'global-notes-list-column-visibility-popover'
    : undefined;

  const handleSorting = (sortBy: string, sortOrder: 'asc' | 'desc') => {
    const defaultSortField = 'r_number';
    const defaultSortOrder = 'ASC';
    const apiOrder = sortOrder === 'asc' ? 'ASC' : 'DESC';

    if (!sortBy) {
      setSortFilterCount(0);
      setTableParams((prev) => ({
        ...prev,
        sortBy: defaultSortField,
        sortOrder: defaultSortOrder,
      }));
    } else {
      setSortFilterCount(1);
      setTableParams((prev) => ({
        ...prev,
        sortBy,
        sortOrder: apiOrder,
      }));
    }
  };

  const handleExport = () => {
    const allNotesParams = {
      sortBy: tableParams.sortBy,
      sortOrder: tableParams.sortOrder,
      filters: appliedFilters,
      fiscalYear: newFiscalYear,
      globalFilters: reshapeGlobalFilter(filters as FilterState),
      isGlobal: true,
      search: searchText,
    };
    ExportNotesList('all_notes', allNotesParams);
  };

  const menuItems = [
    {
      label: 'Export',
      onClick: () => handleExport(),
      hide: !isNotesExportEnable,
    },
  ];

  const handleColumnVisibility = (
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    setColumnAnchorEl(event.currentTarget);
  };

  const userListOptions = useMemo(() => {
    return (
      userListData?.data?.users?.map((item) => ({
        value: item.rid,
        label: `${item.first_name} ${item.last_name}`,
      })) || []
    );
  }, [userListData]);

  // Permissions
  const notesEditFields = useMemo(
    () =>
      permission?.find((item) => item.name === AllPermissions.NOTES_VIEW_EDIT)
        ?.fields ?? [],
    [permission]
  );

  const permissionMap = useMemo(() => {
    const map: Record<string, { read: boolean; edit: boolean }> = {};
    notesEditFields.forEach((item) => {
      map[item.name] = { read: item.read ?? false, edit: item.edit ?? false };
    });
    return map;
  }, [notesEditFields]);

  const notesFilterFields = getNotesFilterFields(
    permissionMap,
    userListOptions
  );

  if (!notesEnable || !isNotesViewEnable) return <AccessRestricted />;

  return (
    <div className='flex flex-col w-full  h-full'>
      <div className='flex items-center justify-between w-full h-[55px] min-h-[55px] max-h-[55px] border-b border-[#CBD6E2] px-4'>
        <div className='flex h-[33px]'>
          <div className='flex items-center justify-center'>
            <NotesSideIcon
              alt='note-icon'
              className={`h-7 w-7 p-[5px] rounded [&>path]:stroke-[${ColorCode.projectTextColor}] bg-[${ColorCode.notesBgColor}]`}
            />
            <div className='flex flex-col mx-2.5 pb-1'>
              <div className='font-bold text-[16px] text-[#2D3E4F]'>Notes</div>
              <div className='font-semibold text-[#7D98B6] text-[12px] -mt-1'>
                {`${totalCount} items`}
              </div>
            </div>
          </div>
        </div>
        <div className='flex gap-3 justify-center items-center'>
          <ActionsDropdown actions={menuItems} />
          <div
            className='flex items-center justify-center border border-[#CBD6E2] bg-[linear-gradient(180deg,_#FFFFFF_0%,_#E4E6E7_100%)] w-[24px] h-[23px] cursor-pointer'
            onClick={onRefreshClick}
          >
            <RefreshIcon alt='refresh-icon' className='h-4' />
          </div>
          <div className='hidden border border-[#CBD6E2] w-[24px] h-[24px] justify-center items-center bg-[linear-gradient(180deg,_#FFFFFF_0%,_#E4E6E7_100%)]'>
            <ActionIcon alt='menu-icon' className='h-4' />
          </div>
          <div className='hidden border border-[#CBD6E2] w-[24px] h-[24px]  justify-center items-center bg-[linear-gradient(180deg,_#FFFFFF_0%,_#E4E6E7_100%)]'>
            <AccountSettingsIcon alt='menu-icon' className='h-4' />
          </div>
        </div>
      </div>
      <div className='flex items-center justify-end h-[34px] min-h-[34px] px-4'>
        <div className='flex gap-1 relative'>
          <SearchBar
            initialSearchText={searchText}
            onSearch={(value) => {
              setSearchText(value);
              setTableParams((prevParams) => {
                const newParams = { ...prevParams };
                if (value) {
                  newParams.search = value;
                } else {
                  delete newParams.search;
                }
                return newParams;
              });
            }}
            placeholder='Search'
            disabled={false}
            hide={false}
            setCurrentPage={(pageNo) => {
              setPage(pageNo + 1);
              setTableParams((prev) => ({
                ...prev,
                page: pageNo + 1,
              }));
            }}
          />
          <button
            aria-describedby={modalId}
            className={`w-[120px] h-[24px] text-[13px] text-[#425A76] cursor-pointer flex items-center justify-center gap-1 font-semibold rounded-[2px] relative border border-[#CBD6E2] px-0 py-0 normal-case ${isModalOpen ? 'bg-[#F3F3F3]' : 'bg-[linear-gradient(180deg,_#FFFFFF_0%,_#E4E6E7_100%)]'} hover:text-[#425A76] transition-colors duration-150`}
            style={{
              boxShadow: '0px 1px 2px 0px rgba(42, 54, 71, 0.05)',
            }}
            onClick={handleColumnVisibility}
          >
            Show/Hide Fields
          </button>
          <button
            aria-describedby={filterId}
            className={`w-[64px] h-[26px] text-[13px] text-[#425A76] cursor-pointer flex items-center justify-center gap-1 font-semibold rounded-[2px] relative 
              ${isFilterOpen || (appliedFilters && Object.keys(appliedFilters).length > 0) || sortFilterCount > 0 ? 'bg-[#F3F3F3]' : ''}`}
            onClick={handleFilterModal}
          >
            <NewFilterIcon alt='filter-icon' />
            Filter
            {(appliedFilters && Object.keys(appliedFilters).length > 0) ||
            sortFilterCount > 0 ? (
              <div className='absolute -top-[5px] -right-2 w-4 h-4 flex items-center justify-center text-xs'>
                <span className='absolute w-full h-full bg-[#FF6666] rounded-full animate-ping opacity-75 z-0'></span>
                <span className='w-4 h-4 bg-[#FF6666] text-white rounded-full flex items-center justify-center z-10 font-semibold'>
                  {(appliedFilters ? Object.keys(appliedFilters).length : 0) +
                    sortFilterCount}
                </span>
              </div>
            ) : null}
          </button>
          <Suspense fallback={null}>
            <Filter
              value='global-notes'
              isOpen={isFilterOpen}
              filterAnchorEl={anchorEl}
              filterId={filterId}
              filterMenu={notesFilterFields}
              setAppliedFilters={setAppliedFilters}
              handleCloseFilter={handleCloseFilter}
              setCurrentPage={(pageNo) => {
                setPage(pageNo + 1);
                setTableParams((prev) => ({
                  ...prev,
                  page: pageNo + 1,
                }));
              }}
              handleSorting={handleSorting}
            />
          </Suspense>
        </div>
      </div>

      <div className='border border-[#CBD6E2]'>
        <NotesTable
          appliedFilters={appliedFilters}
          tableParams={tableParams}
          setTableParams={setTableParams}
          setTotalCount={setTotalCount}
          refreshTrigger={refreshTrigger}
          setColumnAnchorEl={setColumnAnchorEl}
          columnAnchorEl={columnAnchorEl}
          searchValue={searchText}
          userListOptions={userListOptions}
        />
      </div>
    </div>
  );
};

export default Notes;
