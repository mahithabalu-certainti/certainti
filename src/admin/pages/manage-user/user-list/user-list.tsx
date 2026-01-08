import React, { Suspense, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ManagerUserIcon,
  NewFilterIcon,
  RefreshIcon,
} from '../../../../assets/icons';
import { FilterModal } from '../../../../components';
import ActionsDropdown from '../../../../components/actions-dropdown/actions-dropdown';
import TextButton from '../../../../components/button/text-button';
import { ADMIN_CREATE_USER, ADMIN_MANAGE_USER } from '../../../../routes';
import { UserTable } from '../table/user-table';
import { getUserFilterFields } from './helpers';
import {
  exportUserList,
  useGetUserProfileList,
  useManageUserRole,
} from '../../../service';
import { FilterCondition, UserListParams } from '../../../types/manage-user';
import { useSelector } from 'react-redux';
import { RootState } from '../../../../store/store';
import { checkPermission } from '../../../../common-utils';
import { AllModules, AllPermissions } from '../../../../common-service';
import { AccessRestricted } from '../../../../components/account-restricted';
import {
  formatFilterForApi,
  getStoredFilters,
} from '../../../../components/filter-component/utils';
import { useToast } from '../../../../hooks';
import { FilterState } from '../../../../consultant/types/account-filter';
import SearchBar from '../../../../components/search/search-bar';
import { ColorCode } from '../../../../consultant/types';

const BUTTON_STYLES = {
  height: '24px',
  fontSize: '13px',
};

const UserList: React.FC = () => {
  const navigate = useNavigate();
  const [appliedFilters, setAppliedFilters] = useState<
    Record<string, FilterCondition>
  >({});
  const [page, setPage] = useState<number>(1);
  const [tableParams, setTableParams] = useState<UserListParams>({
    page: page,
    limit: 100,
    sortBy: 'first_name',
    sortOrder: 'ASC',
  });
  const [sortFilterCount, setSortFilterCount] = useState<number>(0);
  const [refreshUserTrigger, setRefreshUserTrigger] = useState<number>();
  const [columnAnchorEl, setColumnAnchorEl] =
    React.useState<HTMLButtonElement | null>(null);
  const [searchText, setSearchText] = useState<string>('');
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  const isModalOpen = Boolean(columnAnchorEl);
  const modalId = isModalOpen ? 'account-column-visibility-popover' : undefined;

  const onRefreshClick = () => {
    setRefreshUserTrigger(Date.now());
  };
  // Permission Mangement
  const { modules, permission } = useSelector(
    (state: RootState) => state.permission
  );
  const userIsEnable = checkPermission(modules, AllModules.USER_MANAGEMENT);
  const isUserCreateEnable = checkPermission(
    permission,
    AllPermissions.USER_CREATE
  );
  const isUserFieldsEditable = useMemo(
    () =>
      permission
        ?.find((item) => item.name === AllPermissions.USER_VIEW_EDIT)
        ?.fields?.some((field) => field.edit),
    [permission]
  );
  const isProfileViewEditEnable = checkPermission(
    permission,
    AllPermissions.PROFILE_VIEW_EDIT
  );
  const isUserDeleteEnable = checkPermission(
    permission,
    AllPermissions.USER_DELETE
  );
  const isUserViewEnable = checkPermission(
    permission,
    AllPermissions.USER_VIEW_EDIT
  );
  const isUserViewAllEnable = checkPermission(
    permission,
    AllPermissions.USER_VIEW_EDIT
  );
  const isUserExportEnable = checkPermission(
    permission,
    AllPermissions.USER_EXPORT
  );
  const userViewEditFields = useMemo(
    () =>
      permission.find((item) => item.name === AllPermissions.USER_VIEW_EDIT)
        ?.fields ?? [],
    [permission]
  );
  const permissionMap = useMemo(() => {
    const map: Record<string, { read: boolean; edit: boolean }> = {};
    userViewEditFields.forEach((item) => {
      map[item.name] = { read: item.read ?? false, edit: item.edit ?? false };
    });
    return map;
  }, [userViewEditFields]);
  const userActionButtons = [
    { label: 'Suspend User', width: '104px', hide: false },
    { label: 'Reinstate User', width: '116px', hide: false },
    {
      label: 'Reset Password',
      width: '118px',
      hide: false,
    },
    { label: 'Delete', width: '58px', hide: !isUserDeleteEnable },
  ];

  const [selectedUserId, setSelectedUserId] = useState<string[]>([]);
  const { errorToast } = useToast();
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const handleFilterModal = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleCloseFilter = () => {
    setAnchorEl(null);
  };

  const isFilterOpen = Boolean(anchorEl);
  const filterId = isFilterOpen ? 'user-filter-popover' : undefined;

  const handleSelectionChange = (selectedIds: string[]) => {
    setSelectedUserId(selectedIds);
  };

  const handleSorting = (sortBy: string, sortOrder: 'asc' | 'desc') => {
    const defaultSortField = 'first_name';
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

  const MENU_ITEMS = [
    {
      label: 'Assign Permissions to User',
      hide: !isProfileViewEditEnable,
      onClick: () => {
        if (selectedUserId.length === 1) {
          navigate(
            ADMIN_MANAGE_USER + '/extended-permission/' + selectedUserId[0]
          );
        } else if (selectedUserId.length > 1) {
          errorToast('Please select only one user to assign permissions.');
        } else {
          errorToast('You must select a user to assign permissions.');
        }
      },
    },
    {
      label: 'Export',
      onClick: () =>
        exportUserList({
          ...tableParams,
          timezone,
          ...(searchText && { search: searchText }),
        }),
      hide: !isUserExportEnable,
    },
  ];

  const profileList = useGetUserProfileList();
  const userRoles = useManageUserRole();

  const userProfiles = useMemo(() => {
    return (
      profileList.data?.data.profiles.map((item) => ({
        label: item.profile_name,
        value: item.profile_name,
      })) || []
    );
  }, [profileList]);

  const memoizeRole = useMemo(
    () =>
      userRoles.data?.data.roles.map((role) => ({
        label: role.business_teams,
        value: role.business_teams,
      })) || [],
    [userRoles.data?.data.roles]
  );

  const profileOptions = useMemo(() => {
    return (
      profileList.data?.data.profiles.map((item) => ({
        label: item.profile_name,
        value: item.rid,
      })) || []
    );
  }, [profileList]);

  const roleOptions = useMemo(
    () =>
      userRoles.data?.data.roles.map((role) => ({
        label: role.business_teams,
        value: role.rid,
      })) || [],
    [userRoles.data?.data.roles]
  );
  const userFilterfields = getUserFilterFields(
    userProfiles,
    memoizeRole,
    permissionMap
  );

  useEffect(() => {
    const saved = getStoredFilters();
    if (saved) {
      setAppliedFilters(
        formatFilterForApi(saved as Record<string, FilterState>)
      );
    }
  }, []);

  const handleAction = (action: string) => {
    switch (action) {
      case 'Suspend User':
        console.log('Suspend User clicked');
        break;
      case 'Reinstate User':
        console.log('Reinstate User clicked');
        break;
      case 'Reset Password':
        console.log('Reset Password clicked');
        break;
      case 'Delete':
        console.log('Delete clicked');
        break;
      default:
        break;
    }
  };

  const handleColumnVisibility = (
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    setColumnAnchorEl(event.currentTarget);
  };

  if (!userIsEnable || !isUserViewAllEnable) return <AccessRestricted />;

  return (
    <div className='flex flex-col w-full h-full'>
      {/* Header Section */}
      <div className='flex items-center justify-between w-full h-[55px] min-h-[50px] border-b border-[#CBD6E2] px-4'>
        <div className='flex h-[33px]'>
          <div className='flex items-center justify-center'>
            <ManagerUserIcon 
            alt='manage user' 
             className={`h-7 w-7 p-1.5 rounded [&>path]:stroke-[${ColorCode.manageAccountTextColor}] bg-[${ColorCode.manageAccountBgcolor}]`}
            />
            <div className='flex flex-col mx-2.5 pb-1'>
              <div className='font-semibold text-[#7D98B6] text-[12px] pt-1'>
                Admin Permission
              </div>
              <div className='font-bold text-[16px] text-[#2D3E4F] -mt-1'>
                Manage User
              </div>
            </div>
          </div>
        </div>
        <div className='flex gap-3 justify-center items-center'>
          <ActionsDropdown actions={MENU_ITEMS} />
          <button
            className='flex border border-[#CBD6E2] w-[24px] h-[23px] bg-[linear-gradient(180deg,_#FFFFFF_0%,_#E4E6E7_100%)] justify-center items-center cursor-pointer'
            onClick={onRefreshClick}
          >
            <RefreshIcon alt='refresh-icon' className='h-4' />
          </button>
          {isUserCreateEnable && (
            <TextButton
              label='Create User'
              onClick={() => navigate(ADMIN_CREATE_USER)}
              sx={{
                ...BUTTON_STYLES,
                width: '91px',
                minWidth: '91px',
                maxWidth: '91px',
              }}
            />
          )}
        </div>
      </div>

      <div className='flex items-center justify-between h-[42px] min-h-[42px] max-h-[42px] px-4'>
        <div className='font-bold text-[14px] leading-[32px] text-[#2D3E4F]'>
          All Users
        </div>
        <div className='flex items-center gap-1'>
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
          <div className='flex relative'>
            <button
              aria-describedby={modalId}
              className={`w-[120px] h-[24px] text-[13px] text-[#425A76] cursor-pointer flex items-center justify-center gap-1 rounded-[2px] relative border border-[#CBD6E2] px-0 py-0 normal-case ${isModalOpen ? 'bg-[#F3F3F3]' : 'bg-[linear-gradient(180deg,_#FFFFFF_0%,_#E4E6E7_100%)]'} hover:text-[#425A76] transition-colors duration-150`}
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
                filterFields={userFilterfields}
                setAppliedFilters={(filters) =>
                  setAppliedFilters(filters as Record<string, FilterCondition>)
                }
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
          {userActionButtons.map((button) => {
            if (button.hide) return null;
            return (
              <TextButton
                key={button.label}
                label={button.label}
                onClick={() => handleAction(button.label)}
                sx={{
                  ...BUTTON_STYLES,
                  width: button.width,
                  minWidth: button.width,
                  maxWidth: button.width,
                  display: 'none',
                }}
              />
            );
          })}
        </div>
      </div>

      {/* User Table Section */}
      <div className='border border-[#CBD6E2]'>
        <UserTable
          appliedFilters={appliedFilters}
          tableParams={tableParams}
          setTableParams={(data) => {
            setTableParams(data);
            onRefreshClick();
          }}
          isUserEditEnable={isUserFieldsEditable}
          isUserViewEnable={isUserViewEnable}
          onSelectionChange={handleSelectionChange}
          refreshUserTrigger={refreshUserTrigger}
          profileOptions={profileOptions}
          roleOptions={roleOptions}
          setColumnAnchorEl={setColumnAnchorEl}
          columnAnchorEl={columnAnchorEl}
          searchValue={searchText}
        />
      </div>
    </div>
  );
};

export default UserList;
