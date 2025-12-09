import React, { Suspense, useMemo, useState } from 'react';
import { NewFilterIcon, RefreshIcon, ManageUserIcon } from '../../../../assets';
import TextButton from '../../../../components/button/text-button';
import { useNavigate } from 'react-router-dom';
import { MANAGE_USER_GROUP_CREATE } from '../../../../routes';
import { FilterModal } from '../../../../components';
import { FilterCondition, UserListParams } from '../../../types/manage-user';
import { FilterType } from '../../../types';
import { exportUserGroupList, useGetUserGroupTypes } from '../../../service';
import { getManageUserGroupFilterFields } from './helpers';
import { UserGroupTable } from '../table';
import { SelectOption } from '../../../../consultant/types';
import { useSelector } from 'react-redux';
import { RootState } from '../../../../store/store';
import { checkPermission } from '../../../../common-utils';
import { AllPermissions } from '../../../../common-service';
import SearchBar from '../../../../components/search/search-bar';

const BUTTON_STYLES = {
  height: '24px',
  fontSize: '13px',
};

export const UserGroupList: React.FC = () => {
  // hooks
  const navigate = useNavigate();

  // UseStates
  const [appliedFilters, setAppliedFilters] = useState<
    Record<string, FilterType>
  >({});
  const [page, setPage] = useState<number>(1);
  const [tableParams, setTableParams] = useState<UserListParams>({
    page: page,
    limit: 100,
    sortBy: 'group_name',
    sortOrder: 'ASC',
  });
  const [isExporting, setIsExporting] = useState(false);
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const [searchText, setSearchText] = useState<string>('');
  const handleFilterModal = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const [refreshUserGroupTrigger, setRefreshUserGroupTrigger] =
    useState<number>();
  const [sortFilterCount, setSortFilterCount] = useState<number>(0);

  const [columnAnchorEl, setColumnAnchorEl] =
    React.useState<HTMLButtonElement | null>(null);

  const isModalOpen = Boolean(columnAnchorEl);
  const modalId = isModalOpen ? 'user-group-visibility-popover' : undefined;

  // Permission Mangement
  const { permission } = useSelector((state: RootState) => state.permission);
  const isManageUserGroupFieldsEditable = useMemo(
    () =>
      permission
        .find((item) => item.name === AllPermissions.USER_GROUP_VIEW_EDIT)
        ?.fields?.some((field) => field.edit),
    [permission]
  );
  const isUserGroupCreateEnable = checkPermission(
    permission,
    AllPermissions.USER_GROUP_CREATE
  );
  const isUserGroupExportEnable = checkPermission(
    permission,
    AllPermissions.USER_GROUP_EXPORT
  );
  const userGroupViewEditFields = useMemo(
    () =>
      permission.find(
        (item) => item.name === AllPermissions.USER_GROUP_VIEW_EDIT
      )?.fields ?? [],
    [permission]
  );
  const permissionMap = useMemo(() => {
    const map: Record<string, { read: boolean; edit: boolean }> = {};
    userGroupViewEditFields.forEach((item) => {
      map[item.name] = { read: item.read ?? false, edit: item.edit ?? false };
    });
    return map;
  }, [userGroupViewEditFields]);

  // API Hooks
  const allUserGroupTypes = useGetUserGroupTypes({ type: 'All' });

  // Variables
  const isFilterOpen = Boolean(anchorEl);
  const filterId = isFilterOpen ? 'profile-filter-popover' : undefined;
  const allGroupTypes: SelectOption[] = useMemo(
    () =>
      allUserGroupTypes.data?.data.groupTypes.map((groupTypes) => ({
        label: groupTypes.group_type_name,
        value: groupTypes.rid,
      })) || [],
    [allUserGroupTypes.data?.data.groupTypes]
  );
  const userGroupFilterFields = getManageUserGroupFilterFields(
    allGroupTypes,
    permissionMap
  );

  // Functions
  const onRefreshClick = () => {
    setRefreshUserGroupTrigger(Date.now());
  };
  const handleCloseFilter = () => {
    setAnchorEl(null);
  };
  const handleSorting = (sortBy: string, sortOrder: 'asc' | 'desc') => {
    const defaultSortField = 'group_name';
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
  const handleExport = async () => {
    setIsExporting(true);
    try {
      await exportUserGroupList(tableParams);
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleColumnVisibility = (
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    setColumnAnchorEl(event.currentTarget);
  };

  return (
    <div className='flex flex-col h-full w-full'>
      {/* Header Section */}
      <div className='flex items-center justify-between w-full h-[55px] min-h-[50px] border-b border-[#CBD6E2] px-4'>
        <div className='flex h-[33px]'>
          <div className='flex items-center justify-center'>
            <ManageUserIcon
              alt='manage user group'
              className='h-7 w-7 rounded [&>path:first-child]:fill-[#BE3EB5]'
            />
            <div className='flex flex-col mx-2.5 pb-1'>
              <div className='font-semibold text-[#7D98B6] text-[12px] pt-1'>
                Admin Permission
              </div>
              <div className='font-bold text-[16px] text-[#2D3E4F] -mt-1'>
                Manage User Group
              </div>
            </div>
          </div>
        </div>
        <div className='flex gap-3 justify-center items-center'>
          <button
            className='flex border border-[#CBD6E2] w-[24px] h-[24px] bg-[linear-gradient(180deg,_#FFFFFF_0%,_#E4E6E7_100%)] justify-center items-center cursor-pointer'
            onClick={onRefreshClick}
          >
            <RefreshIcon alt='refresh-icon' className='h-4' />
          </button>
          {isUserGroupCreateEnable && (
            <TextButton
              label='Create Group'
              onClick={() => navigate(MANAGE_USER_GROUP_CREATE)}
              sx={{
                ...BUTTON_STYLES,
                width: '119px',
                minWidth: '119px',
                maxWidth: '119px',
              }}
            />
          )}
        </div>
      </div>

      <div className='flex items-center justify-between h-[42px] min-h-[42px] max-h-[42px] px-4'>
        <div className='font-bold text-[14px] leading-[32px] text-[#2D3E4F]'>
          All Groups
        </div>
        <div className='flex items-center gap-3'>
          <div className='flex gap-1 relative'>
            <SearchBar
              initialSearchText={searchText}
              onSearch={(value) => {
                setSearchText(value);
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
              className={`w-[120px] h-[24px] text-[13px] text-[#425A76] cursor-pointer flex items-center justify-center gap-1  rounded-[2px] relative border border-[#CBD6E2] px-0 py-0 normal-case ${isModalOpen ? 'bg-[#F3F3F3]' : 'bg-[linear-gradient(180deg,_#FFFFFF_0%,_#E4E6E7_100%)]'} hover:text-[#425A76] transition-colors duration-150`}
              style={{
                boxShadow: '0px 1px 2px 0px rgba(42, 54, 71, 0.05)',
              }}
              onClick={handleColumnVisibility}
            >
              Show/Hide Fields
            </button>
            <button
              aria-describedby={filterId}
              className={`w-[64px] h-[24px] text-[13px] text-[#425A76] cursor-pointer flex items-center justify-center gap-1 font-semibold rounded-[2px] relative 
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
              <FilterModal
                isOpen={isFilterOpen}
                filterAnchorEl={anchorEl}
                filterId={filterId}
                filterFields={userGroupFilterFields}
                setAppliedFilters={setAppliedFilters}
                setPage={(pageNo) => {
                  setPage(pageNo);
                  setTableParams((prev) => ({
                    ...prev,
                    page: pageNo,
                  }));
                }}
                handleCloseFilter={handleCloseFilter}
                handleSorting={handleSorting}
              />
            </Suspense>
          </div>
          {isUserGroupExportEnable && (
            <TextButton
              label='Export'
              sx={{
                ...BUTTON_STYLES,
                width: '74px',
                minWidth: '74px',
                maxWidth: '74px',
              }}
              onClick={handleExport}
              loading={isExporting}
            />
          )}
        </div>
      </div>

      <div className='border border-[#CBD6E2]'>
        <Suspense fallback={null}>
          <UserGroupTable
            appliedFilters={appliedFilters as Record<string, FilterCondition>}
            tableParams={tableParams}
            setTableParams={(data) => {
              setTableParams(data);
              onRefreshClick();
            }}
            onSelectionChange={() => {}}
            isProfileEditEnable={isManageUserGroupFieldsEditable}
            refreshUserGroupTrigger={refreshUserGroupTrigger}
            setColumnAnchorEl={setColumnAnchorEl}
            columnAnchorEl={columnAnchorEl}
            searchValue={searchText}
          />
        </Suspense>
      </div>
    </div>
  );
};

export default UserGroupList;
