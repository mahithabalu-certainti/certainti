/* eslint-disable @typescript-eslint/no-explicit-any */
import { NewFilterIcon, UserIcon } from '../../../../assets';
import React, { Suspense, useEffect, useMemo, useState } from 'react';
import { ManageAccountTable } from './table';
import { ProjectListParams } from '../../../../consultant/types/project';
import { useNavigate, useSearchParams } from 'react-router-dom';
import UserTab from './tab';
import { BUTTON_STYLES } from '../../manage-user-detail/styles';
import TextButton from '../../../../components/button/text-button';
import {
  useUpdateProjectAccesseDetails,
  useUserGroupList,
} from '../../../service/manage-account-access/manage-account-service';
import { useToast } from '../../../../hooks';
import { ActiveUserForGroup, FilterType } from '../../../types';
import { FilterModal } from '../../../../components';
import {
  getManageAccountFilterFields,
  getManageGroupListFilterFields,
  getManageProjectListFilterFields,
  getManageUserListFilterFields,
  getUserListFilterFields,
} from './helper';
import { useSelector } from 'react-redux';
import { RootState } from '../../../../store/store';
import {
  AllModules,
  AllPermissions,
  useGetAllCountries,
} from '../../../../common-service';
import { SelectOption } from '../../../../consultant/types';
import { useFetchIndustrys } from '../../../../consultant/services/account';
import {
  clearFilters,
  formatFilterForApi,
  getStoredFilters,
} from '../../../../components/filter-component/utils';
import { FilterState } from '../../../../consultant/types/account-filter';
import { checkPermission } from '../../../../common-utils';
import { AccessRestricted } from '../../../../components/account-restricted';
import { MANAGE_ACCOUNT_ACCESS } from '../../../../routes';
import { useGetUserGroupTypes, useManageUserRole } from '../../../service';
import { ListTable } from '../../../../components/table';
import { getAvailableUserColumns } from './column';
import { SortDirection } from '../../../../components/table/types';

const AccountList = () => {
  const [page, setPage] = useState<number>(1);
  const [appliedFilters, setAppliedFilters] = useState<
    Record<string, FilterType>
  >({});
  const [tableParams, setTableParams] = useState<ProjectListParams>({
    page: page,
    limit: 100,
    sortBy: 'account_name',
    sortOrder: 'ASC',
  });
  const [userParams, setUserParams] = useState<Record<string, unknown>>({
    page: 1,
    limit: 100,
    sortBy: 'user_name',
    sortOrder: 'ASC',
  });

  useEffect(() => {
    const saved = getStoredFilters();
    if (saved) {
      setAppliedFilters(
        formatFilterForApi(saved as Record<string, FilterState>)
      );
    }
  }, []);
  useEffect(() => {
    setUserParams((prev) => ({
      ...prev,
      page: 1,
      filters: appliedFilters,
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appliedFilters]);
  const [sortFilterCount, setSortFilterCount] = useState<number>(0);
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const [columnAnchorEl, setColumnAnchorEl] =
    React.useState<HTMLButtonElement | null>(null);

  const isModalOpen = Boolean(columnAnchorEl);
  const modalId = isModalOpen ? 'account-column-visibility-popover' : undefined;

  const isFilterOpen = Boolean(anchorEl);
  const filterId = isFilterOpen ? 'profile-filter-popover' : undefined;

  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const handleBack = () => {
    searchParams.delete('accountList');
    searchParams.delete('username');
    searchParams.delete('groupname');
    setAppliedFilters({});
    clearFilters();
    navigate({ search: searchParams.toString() });
  };
  const handleBackAccount = () => {
    navigate(MANAGE_ACCOUNT_ACCESS);
  };
  const handleCloseFilter = () => {
    setAnchorEl(null);
  };
  const handleFilterModal = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const userPageChange = (newPage: number) => {
    setUserParams((prev) => ({
      ...prev,
      page: newPage + 1,
    }));
  };
  const userRowsPerPageChange = (newLimit: number) => {
    setUserParams((prev) => ({
      ...prev,
      limit: newLimit,
      page: 1,
    }));
  };

  const accountList = searchParams.get('accountList');
  const accountId = searchParams.get('accountid');
  const accountname = searchParams.get('accountname');
  const username = searchParams.get('username');
  const groupname = searchParams.get('groupname');
  const tabIndex = searchParams.get('tabIndex');
  const groupId = searchParams.get('groupid');
  const name = username || groupname || '';
  const type = username ? 'USER' : groupname ? 'GROUP' : '';

  const projectListAccess = useUpdateProjectAccesseDetails();
  const availableUsers = useUserGroupList(
    accountId as string,
    groupId as string,
    userParams
  );
  const userRoles = useManageUserRole();
  const totalUsers = availableUsers?.data?.data.count || 0;
  const commonSuccess = projectListAccess.isSuccess;
  const [addedProjects, setAddedProjects] = useState<{
    [rid: string]: boolean;
  }>({});
  const { successToast } = useToast();
  useEffect(() => {
    if (commonSuccess) {
      successToast('projects updated successfully');
      handleBack();
    }
  }, [commonSuccess]);
  const handleSubmit = () => {
    const constructData: Partial<any> = {
      account_rid: accountId,
      projects: addedProjects,
      ...(type === 'USER'
        ? { user_rid: accountList }
        : { group_rid: accountList }),
    };

    projectListAccess.mutate(constructData);
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
  const { modules, permission } = useSelector(
    (state: RootState) => state.permission
  );
  const userViewEditFields = useMemo(
    () =>
      permission.find((item) => item.name === AllPermissions.ACCOUNTS_VIEW_EDIT)
        ?.fields ?? [],
    [permission]
  );

  const countriesList = useGetAllCountries();
  const industry = useFetchIndustrys();
  const allUserGroupTypes = useGetUserGroupTypes({ type: 'All' });
  const permissionMap = useMemo(() => {
    const map: Record<string, { read: boolean; edit: boolean }> = {};
    userViewEditFields.forEach((item) => {
      map[item.name] = { read: item.read ?? false, edit: item.edit ?? false };
    });
    return map;
  }, [userViewEditFields]);
  const allCountries = useMemo(() => {
    return (
      countriesList.data?.data.country.map((item) => ({
        label: item.country_name,
        value: item.country_name,
      })) || []
    );
  }, [countriesList]);

  const allIndustries: SelectOption[] = useMemo(
    () =>
      industry.data?.data.industries.map((industry) => ({
        label: industry.industry_name,
        value: industry.industry_name,
      })) || [],
    [industry.data?.data.industries]
  );
  const allGroupTypes: SelectOption[] = useMemo(
    () =>
      allUserGroupTypes.data?.data.groupTypes.map((groupTypes) => ({
        label: groupTypes.group_type_name,
        value: groupTypes.rid,
      })) || [],
    [allUserGroupTypes.data?.data.groupTypes]
  );
  const memoizeRole = useMemo(
    () =>
      userRoles.data?.data.roles.map((role) => ({
        label: role.business_teams,
        value: role.business_teams,
      })) || [],
    [userRoles.data?.data.roles]
  );
  const accountFilterFields = getManageAccountFilterFields(
    allCountries,
    allIndustries,
    permissionMap
  );
  const userFilterFeilds = getManageUserListFilterFields();
  const groupFilterFeilds = getManageGroupListFilterFields(allGroupTypes);
  const projectFilterFeilds = getManageProjectListFilterFields();
  const getFilterFields = () => {
    if (!accountname) {
      return accountFilterFields;
    } else if (groupId) {
      return getUserListFilterFields(memoizeRole);
    } else if (type === 'GROUP' || type === 'USER') {
      return projectFilterFeilds;
    } else if (tabIndex === '0') {
      return userFilterFeilds;
    } else if (tabIndex === '1') {
      return groupFilterFeilds;
    }
  };

  const handleSort = (sortBy: string, sortOrder: 'asc' | 'desc') => {
    const apiOrder = sortOrder === 'asc' ? 'ASC' : 'DESC';
    setUserParams((prev) => ({
      ...prev,
      sortBy,
      sortOrder: apiOrder,
    }));
  };

  const filtercolumn = getFilterFields();
  const manageaccountIsEnable = checkPermission(
    modules,
    AllModules.MANAGE_ACCOUNT_ACCESS
  );
  const accountViewEnable = checkPermission(
    permission,
    AllPermissions.MANAGE_ACCOUNT_ACCESS_VIEW_EDIT
  );
  const userViewEdit = useMemo(
    () =>
      permission.find(
        (item) => item.name === AllPermissions.MANAGE_ACCOUNT_ACCESS_VIEW_EDIT
      )?.fields ?? [],
    [permission]
  );
  const permissionMapListView = useMemo(() => {
    const map: Record<string, { read: boolean; edit: boolean }> = {};
    userViewEdit.forEach((item) => {
      map[item.name] = { read: item.read ?? false, edit: item.edit ?? false };
    });
    return map;
  }, [userViewEdit]);
  const getRowId = (row: ActiveUserForGroup) => row.rid;

  const disabled =
    permissionMapListView?.['assign']?.read &&
    !permissionMapListView?.['assign']?.edit;
  const hide =
    !permissionMapListView?.['assign']?.read &&
    !permissionMapListView?.['assign']?.edit;
  if (!manageaccountIsEnable || !accountViewEnable) return <AccessRestricted />;
  const handleColumnVisibility = (
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    setColumnAnchorEl(event.currentTarget);
  };
  return (
    <div>
      <div className='flex items-center justify-between w-full h-[55px] min-h-[50px] border-b border-[#CBD6E2] px-4'>
        <div className='flex w-full justify-between h-[33px]'>
          <div className='flex items-center  justify-center'>
            <UserIcon
              alt='manage user'
              className='h-7 w-7 rounded bg-[#BE3EB5] p-[7px]'
            />
            <div className='flex flex-col mx-2.5 pb-1'>
              <div className='font-semibold text-[#7D98B6] text-[12px] pt-1'>
                Admin Permission
              </div>
              <div className='font-bold text-[16px] text-[#2D3E4F] -mt-1'>
                Manage Account Access
              </div>
            </div>
          </div>

          {accountId && !type && (
            <div className='flex-end'>
              <TextButton
                label='Back To Account Access'
                onClick={handleBackAccount}
                sx={{
                  ...BUTTON_STYLES,
                  width: '170px',
                  minWidth: '170px',
                  maxWidth: '170px',
                }}
              />
            </div>
          )}
        </div>
        <div className='flex gap-3 justify-center items-center'></div>
      </div>

      <div className='flex items-center justify-between h-[42px] min-h-[42px] max-h-[42px] px-4'>
        <div className='flex items-center gap-4'>
          <div className='flex flex-col'>
            <div className='font-bold text-[14px] leading-[32px] text-[#2D3E4F]'>
              {groupId ? 'All Users' : 'All Accounts'}
            </div>
            {accountname && !groupId && (
              <div className='font-semibold text-[#7D98B6] text-[12px] -mt-2'>
                {`${accountname}  ${name ? ` > ${name}` : ''}`}
              </div>
            )}
          </div>
        </div>
        <div className='flex items-center gap-3'>
          <div className='flex gap-1 relative'>
            {groupId ? (
              <TextButton
                label='Back To Groups'
                onClick={() => {
                  setAppliedFilters({});
                  clearFilters();
                  searchParams.delete('groupid');
                  navigate(
                    { search: searchParams.toString() },
                    { replace: true }
                  );
                }}
                sx={{
                  ...BUTTON_STYLES,
                  px: 1,
                }}
              />
            ) : (
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
            )}

            <button
              className={`w-[64px] h-[24px] text-[13px] text-[#425A76] cursor-pointer flex items-center justify-center gap-1 font-semibold rounded-[2px] relative `}
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
                filterFields={filtercolumn || []}
                setAppliedFilters={setAppliedFilters}
                setPage={setPage}
                handleCloseFilter={handleCloseFilter}
                handleSorting={handleSorting}
              />
            </Suspense>
          </div>
          {accountList && (
            <div className='flex items-center gap-3'>
              <div className='relative h-[32px]'></div>
              <TextButton
                label='Cancel'
                onClick={handleBack}
                sx={{
                  ...BUTTON_STYLES,
                  width: '74px',
                  minWidth: '74px',
                  maxWidth: '74px',
                }}
              />
              <TextButton
                label='Save'
                onClick={handleSubmit}
                loading={projectListAccess.isPending}
                sx={{
                  ...BUTTON_STYLES,
                  width: '100px',
                  minWidth: '100px',
                  maxWidth: '100px',
                }}
              />
            </div>
          )}
        </div>
      </div>
      {!accountId && (
        <div className='border border-[#CBD6E2]'>
          <ManageAccountTable
            appliedFilters={appliedFilters}
            tableParams={groupId ? userParams : tableParams}
            setTableParams={
              groupId
                ? (data) => setUserParams(data as Record<string, unknown>)
                : (data) => setTableParams(data)
            }
            setAppliedFilters={setAppliedFilters}
            setColumnAnchorEl={setColumnAnchorEl}
            columnAnchorEl={columnAnchorEl}
          />
        </div>
      )}
      {accountId && !groupId && (
        <div>
          <UserTab
            type={type}
            setAddedProjects={setAddedProjects}
            appliedFilters={appliedFilters}
            setAppliedFilters={setAppliedFilters}
            disabled={disabled}
            hide={hide}
            setColumnAnchorEl={setColumnAnchorEl}
            columnAnchorEl={columnAnchorEl}
          />
        </div>
      )}
      {groupId && (
        <div className='border-t border-[#CBD6E2]'>
          <ListTable
            data={availableUsers.data?.data.users || []}
            columns={getAvailableUserColumns()}
            getRowId={getRowId}
            hoverHighlight={false}
            tableStyle={{
              height: '100%',
              maxHeight: 'calc(100vh - 195px)',
              overflow: 'auto',
            }}
            selectable={false}
            actionWidth={60}
            rowsPerPageOptions={[25, 50, 100]}
            rowsPerPage={userParams.limit as number}
            currentPage={Number(userParams.page ?? 1) - 1}
            totalItems={totalUsers}
            onPageChange={userPageChange}
            onRowsPerPageChange={userRowsPerPageChange}
            stickyHeader
            loading={availableUsers.isPending}
            sortBy={userParams.sortBy as string}
            sortOrder={userParams.sortOrder as SortDirection}
            onSort={handleSort}
          />
        </div>
      )}
    </div>
  );
};

export default AccountList;
