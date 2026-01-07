import React, { Suspense, useMemo, useState } from 'react';
import { NewFilterIcon, RefreshIcon, ManageProfileIcon } from '../../../../assets';
import TextButton from '../../../../components/button/text-button';
import { useNavigate } from 'react-router-dom';
import { MANAGE_PROFILE_CREATE } from '../../../../routes';
import { FilterModal } from '../../../../components';
import { getManageProfileFilterFields } from './';
import { FilterCondition, UserListParams } from '../../../types/manage-user';
import { ProfileTable } from '../';
import { FilterType } from '../../../types';
import { exportProfileList } from '../../../service';
import { useToast } from '../../../../hooks';
import { useSelector } from 'react-redux';
import { RootState } from '../../../../store/store';
import { checkPermission } from '../../../../common-utils';
import { AllModules, AllPermissions } from '../../../../common-service';
import { AccessRestricted } from '../../../../components/account-restricted';
import SearchBar from '../../../../components/search/search-bar';
import { ColorCode } from '../../../../consultant/types';

const BUTTON_STYLES = {
  height: '24px',
  fontSize: '13px',
};

export const ProfileList: React.FC = () => {
  const [appliedFilters, setAppliedFilters] = useState<
    Record<string, FilterType>
  >({});
  const [page, setPage] = useState<number>(1);
  const [tableParams, setTableParams] = useState<UserListParams>({
    page: page,
    limit: 100,
    sortBy: 'profile_name',
    sortOrder: 'ASC',
  });
  const navigate = useNavigate();
  const [isExporting, setIsExporting] = useState(false);
  const [selectedProfileId, setSelectedProfileId] = useState<string[]>([]);
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const { errorToast } = useToast();
  const handleFilterModal = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const [refreshProfileTrigger, setRefreshProfileTrigger] = useState<number>(
    Date.now()
  );
  const [sortFilterCount, setSortFilterCount] = useState<number>(0);
  const [columnAnchorEl, setColumnAnchorEl] =
    React.useState<HTMLButtonElement | null>(null);
  const [searchText, setSearchText] = useState<string>('');
  const isModalOpen = Boolean(columnAnchorEl);
  const modalId = isModalOpen ? 'account-column-visibility-popover' : undefined;

  const onRefreshClick = () => {
    setRefreshProfileTrigger(Date.now());
  };

  // Permission Mangement
  const { modules, permission } = useSelector(
    (state: RootState) => state.permission
  );
  const isProfileEnable = checkPermission(
    modules,
    AllModules.PROFILE_MANAGEMENT
  );
  const isProfileCreateEnable = checkPermission(
    permission,
    AllPermissions.PROFILE_CREATE
  );
  const isProfileExportEnable = checkPermission(
    permission,
    AllPermissions.PROFILE_EXPORT
  );
  const isProfileViewEnable = checkPermission(
    permission,
    AllPermissions.PROFILE_VIEW_EDIT
  );
  const isProfileDeleteEnable = checkPermission(
    permission,
    AllPermissions.PROFILE_DELETE
  );
  const profileViewEditFields = useMemo(
    () =>
      permission.find((item) => item.name === AllPermissions.PROFILE_VIEW_EDIT)
        ?.fields ?? [],
    [permission]
  );
  const permissionMap = useMemo(() => {
    const map: Record<string, { read: boolean; edit: boolean }> = {};
    profileViewEditFields.forEach((item) => {
      map[item.name] = { read: item.read ?? false, edit: item.edit ?? false };
    });
    return map;
  }, [profileViewEditFields]);
  const handleCloseFilter = () => {
    setAnchorEl(null);
  };

  const isFilterOpen = Boolean(anchorEl);
  const filterId = isFilterOpen ? 'profile-filter-popover' : undefined;

  const handleSelectionChange = (selectedIds: string[]) => {
    setSelectedProfileId(selectedIds);
  };

  const handleSorting = (sortBy: string, sortOrder: 'asc' | 'desc') => {
    const defaultSortField = 'profile_name';
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
    if (selectedProfileId.length > 1) {
      errorToast('Please select just one profile to proceed with export.');
      return;
    }

    if (selectedProfileId.length === 0) {
      errorToast('Please select a profile before exporting.');
      return;
    }

    setIsExporting(true);

    const profileId = selectedProfileId[0];
    try {
      await exportProfileList(profileId);
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };
  const profileFilterFields = getManageProfileFilterFields(permissionMap);
  if (!isProfileEnable || !isProfileViewEnable) return <AccessRestricted />;

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
          <ManageProfileIcon
           alt='manage-profile' 
          className={`h-7 w-7 p-1.5 rounded [&>path]:stroke-[${ColorCode.manageAccountTextColor}] bg-[${ColorCode.manageAccountBgcolor}]`}
          />
            <div className='flex flex-col mx-2.5 pb-1'>
              <div className='font-semibold text-[#7D98B6] text-[12px] pt-1'>
                Admin Permission
              </div>
              <div className='font-bold text-[16px] text-[#2D3E4F] -mt-1'>
                Manage Profile
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
          {isProfileCreateEnable && (
            <TextButton
              label='Create Profile'
              onClick={() => navigate(MANAGE_PROFILE_CREATE)}
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
          All Profiles
        </div>
        <div className='flex items-center gap-0'>
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
              className={`w-[120px] h-[24px] mr-[4px] text-[13px] text-[#425A76] cursor-pointer flex items-center justify-center gap-1 rounded-[2px] relative border border-[#CBD6E2] px-0 py-0 normal-case ${isModalOpen ? 'bg-[#F3F3F3]' : 'bg-[linear-gradient(180deg,_#FFFFFF_0%,_#E4E6E7_100%)]'} hover:text-[#425A76] transition-colors duration-150`}
              style={{
                boxShadow: '0px 1px 2px 0px rgba(42, 54, 71, 0.05)',
              }}
              onClick={handleColumnVisibility}
            >
              Show/Hide Fields
            </button>
            <Suspense fallback={null}>
              <FilterModal
                isOpen={isFilterOpen}
                filterAnchorEl={anchorEl}
                filterId={filterId}
                filterFields={profileFilterFields}
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
          {isProfileExportEnable && (
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
        </div>
      </div>

      {/* Profile Table Section */}
      <div className='border border-[#CBD6E2]'>
        <Suspense fallback={null}>
          <ProfileTable
            appliedFilters={appliedFilters as Record<string, FilterCondition>}
            tableParams={tableParams}
            setTableParams={setTableParams}
            onSelectionChange={handleSelectionChange}
            isProfileViewEnable={isProfileViewEnable}
            isProfileDeleteEnable={isProfileDeleteEnable}
            refreshProfileTrigger={refreshProfileTrigger}
            setColumnAnchorEl={setColumnAnchorEl}
            columnAnchorEl={columnAnchorEl}
            searchValue={searchText}
          />
        </Suspense>
      </div>
    </div>
  );
};

export default ProfileList;
