import React, {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowDownDisabledIcon,
  ArrowDownIcon,
  ManageUserIcon,
  NewFilterIcon,
} from '../../../../assets/icons';
import TextButton from '../../../../components/button/text-button';
import {
  Checkbox,
  MenuItem,
  Popover,
  Select,
  SelectChangeEvent,
  Skeleton,
} from '@mui/material';
import { ListTable } from '../../../../components/table';
import {
  ActiveUserForGroup,
  FilterType,
  GroupByIdAccount,
  GroupByIdProjects,
  GroupByIdUsers,
  ProjectListByAccounts,
  UserGroupDetails,
  UserGroupDetailsCommon,
} from '../../../types';
import { getAvailableProjectsColumns, getAvailableUserColumns } from '../table';
import { AccountList, SelectOption, YesNo } from '../../../../consultant/types';
import {
  useCreateUserGroup,
  useGetprojectByAccount,
  useGetUserGroupDetails,
  useGetUserGroupTypes,
  useGetUsersByAccount,
  useManageUserRole,
  useUpdateUserGroup,
} from '../../../service';
import { RootState, useAppDispatch } from '../../../../store/store';
import { useSelector } from 'react-redux';
import { fetchAccountsThunk } from '../../../../store/slices';
import { useToast } from '../../../../hooks';
import { MANAGE_USER_GROUP } from '../../../../routes';
import { UserListParams } from '../../../types/manage-user';
import { AllPermissions } from '../../../../common-service';
import { FilterModal } from '../../../../components';
import { getProjectFilterFields, getUserGroupFilterFields } from './helpers';
import { useFetchClassification } from '../../../../consultant/services/account';
import { useGetProjectType } from '../../../../consultant/services/project';

const HEADER_STYLES = {
  adminPermission:
    'font-semibold text-[#7D98B6] text-[12px] leading-5 tracking-normal',
  manageUser: 'text-[16px] font-bold text-[#2D3E4F] -mt-0.5',
};
enum Tabs {
  FORM = 'form',
  USER = 'user',
  PROJECT = 'project',
}
enum GroupTypes {
  CUSTOM_GLOBAL_CONSULTANT_FIRM = 'Custom Global Consultant Firm',
  CUSTOM_CHILD_CLIENT_FIRM = 'Custom Child Client Firm',
  CUSTOM_GLOBAL_CLIENT_FIRM = 'Custom Global Client Firm',
}
interface GroupInformation {
  groupName: string;
  isConsultantOnly: boolean;
  groupType: string;
  accounts: string[];
}
interface GroupInformationError {
  groupName: string;
  groupType: string;
  accounts: string;
}

export const CreateUserGroup: React.FC = () => {
  // hooks
  const { groupId } = useParams();
  const dispatch = useAppDispatch();
  const { successToast } = useToast();
  const navigate = useNavigate();

  // UseStates
  const [accountAnchorEl, setAccountAnchorEl] =
    useState<HTMLButtonElement | null>(null);
  const [tabs, setTabs] = useState<Tabs>(Tabs.FORM);
  const [accountCollapse, setAccountCollapse] = useState<string[]>([]);
  const [selectAccountCount, setSelectAccountCount] = useState({
    parent: 0,
    child: 0,
  });
  const [addedUsers, setAddedUsers] = useState<string[]>([]);
  const [addedProjects, setAddedProjects] = useState<string[]>([]);
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);
  const [groupInformation, setGroupInformation] = useState<GroupInformation>({
    groupName: '',
    isConsultantOnly: false,
    groupType: '',
    accounts: [],
  });
  const [groupInformationError, setGroupInformationError] =
    useState<GroupInformationError>({
      groupName: '',
      groupType: '',
      accounts: '',
    });
  const [projectParams, setProjectParams] = useState<UserListParams>({
    page: 1,
    limit: 100,
  });
  const [userParams, setUserParams] = useState<UserListParams>({
    page: 1,
    limit: 100,
  });
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const [appliedFilters, setAppliedFilters] = useState<
    Record<string, FilterType>
  >({});

  // Redux store
  const { accounts, loading } = useSelector(
    (state: RootState) => state.account
  );

  // Permission Mangement
  const { permission } = useSelector((state: RootState) => state.permission);
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
  const createUserGroup = useCreateUserGroup();
  const updateUserGroup = useUpdateUserGroup();
  const availableUsers = useGetUsersByAccount();
  const availableProjects = useGetprojectByAccount();
  const allUserGroupTypes = useGetUserGroupTypes({ type: 'All' });
  const userGroupDetails = useGetUserGroupDetails(groupId as string);
  const classification = useFetchClassification();
  const projectTypeOptions = useGetProjectType();
  const userRoles = useManageUserRole();

  // Variables
  const tabOrder = [Tabs.FORM, Tabs.USER, Tabs.PROJECT];
  const currentIndex = tabOrder.indexOf(tabs);
  const isAccountModalOpen = Boolean(accountAnchorEl);
  const isFilterOpen = Boolean(anchorEl);
  const accountId = 'Accounts-popover';
  const userGroupData = userGroupDetails.data?.data?.userGroupById;
  const isEditView = Boolean(groupId);
  const totalProjects = availableProjects?.data?.data.totalCount || 0;
  const totalUsers = availableUsers?.data?.data.count || 0;
  const commonSkeleton = (
    <Skeleton variant='rounded' width='100%' height={32} />
  );
  const allGroupTypes: SelectOption[] = useMemo(() => {
    const groupTypes = allUserGroupTypes.data?.data.groupTypes || [];
    return groupTypes
      .filter((item) => {
        const isConsultantMatch =
          item.is_consultant_only_group === groupInformation.isConsultantOnly;
        return isEditView
          ? isConsultantMatch
          : item.type === 'CUSTOM' && isConsultantMatch;
      })
      .map(({ group_type_name, rid }) => ({
        label: group_type_name,
        value: rid,
      }));
  }, [
    allUserGroupTypes.data?.data.groupTypes,
    groupInformation.isConsultantOnly,
    isEditView,
  ]);
  const currentGroupType = allUserGroupTypes.data?.data.groupTypes.find(
    (item) => item.rid === groupInformation.groupType
  );
  const memoizedClassification = useMemo(
    () =>
      classification.data?.data.projectClassifications.map((data) => ({
        label: data.classification_name,
        value: data.classification_name,
      })) || [],
    [classification.data?.data.projectClassifications]
  );
  const memoizedProjectTypes = useMemo(
    () =>
      projectTypeOptions?.data?.data?.projectType.map((item) => ({
        label: item.project_type_name,
        value: item.rid,
      })) || [],
    [projectTypeOptions?.data?.data?.projectType]
  );
  const memoizeRole = useMemo(
    () =>
      userRoles.data?.data.roles.map((role) => ({
        label: role.business_teams,
        value: role.business_teams,
      })) || [],
    [userRoles.data?.data.roles]
  );
  const userGroupFilterFields =
    tabs === Tabs.USER
      ? getUserGroupFilterFields(memoizeRole)
      : getProjectFilterFields(memoizedClassification, memoizedProjectTypes);
  const groupTypeNotCustom = currentGroupType?.type !== 'CUSTOM';
  const prefixGroupName = 'G-';
  const isGroupNameDisabled =
    isEditView &&
    permissionMap?.['group_name']?.read &&
    !permissionMap?.['group_name']?.edit;
  const isAccountDisabled =
    isEditView &&
    permissionMap?.['accounts']?.read &&
    !permissionMap?.['accounts']?.edit;

  // UseEffects
  useEffect(() => {
    // Get Global accounts list only in create
    dispatch(fetchAccountsThunk());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    if (!isEditView) {
      //When create select all project by default
      setAddedProjects(
        availableProjects.data?.data.projects.map((item) => item.project_rid) ||
          []
      );
    }
  }, [availableProjects.data?.data.projects, isEditView]);
  useEffect(() => {
    let parentCount = 0;
    let childCount = 0;
    accounts.forEach((parent) => {
      parent?.child_accounts?.forEach((child) => {
        if (selectedAccounts.includes(child.rid)) {
          childCount++;
        }
      });
      if (selectedAccounts.includes(parent.rid)) {
        parentCount++;
      }
    });
    setSelectAccountCount({ parent: parentCount, child: childCount });
  }, [selectedAccounts, accounts]);
  useEffect(() => {
    if (isEditView && userGroupData) {
      const {
        group_name,
        is_consultant_only_group,
        group_type_rid,
        accounts,
        users,
        projects,
      } = userGroupData;
      setGroupInformation({
        ...groupInformation,
        groupName: group_name.replace(/^G-/, ''),
        isConsultantOnly: is_consultant_only_group,
        groupType: group_type_rid,
      });
      const selectedAccounts = accounts
        .filter((item) => item.has_access)
        .map((item) => item.rid);
      setSelectedAccounts(selectedAccounts);
      const selectedUsers = users
        .filter((item) => item.has_access)
        .map((item) => item.rid);
      setAddedUsers(selectedUsers);
      const selectedProjects = projects
        .filter((item) => item.has_access)
        .map((item) => item.project_rid);
      setAddedProjects(selectedProjects);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditView, userGroupData]);
  useEffect(() => {
    if (createUserGroup.isSuccess || updateUserGroup.isSuccess) {
      successToast(
        isEditView ? 'User updated successfully' : 'User created successfully'
      );
      navigate(MANAGE_USER_GROUP);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [createUserGroup.isSuccess, updateUserGroup.isSuccess]);
  useEffect(() => {
    if (tabs === Tabs.USER) {
      setUserParams((prev) => ({
        ...prev,
        page: 1,
      }));
      availableUsers.mutate({
        is_consultant_only_group: groupInformation.isConsultantOnly,
        account_rid: selectedAccounts,
        limit: userParams.limit as number,
        page: userParams.page as number,
        group_type_rid: groupInformation.groupType,
        ...(isEditView && { group_rid: groupId as string }),
        filters: appliedFilters,
      });
    }
    if (tabs === Tabs.PROJECT) {
      setProjectParams((prev) => ({
        ...prev,
        page: 1,
      }));
      availableProjects.mutate({
        account_rid: selectedAccounts,
        limit: projectParams.limit,
        page: projectParams.page,
        group_type_rid: groupInformation.groupType,
        isFromuserGroup: true,
        ...(isEditView && { group_rid: groupId as string }),
        filters: appliedFilters,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appliedFilters, tabs, projectParams.page, projectParams.limit]);

  // Functions
  const handleAccountsModal = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      setAccountAnchorEl(event.currentTarget);
      // Clear Error
      setGroupInformationError((prev) => ({
        ...prev,
        accounts: '',
      }));
    },
    []
  );
  const handleCloseAccountModel = useCallback(() => {
    setAccountAnchorEl(null);
  }, []);
  const goBack = () => {
    if (currentIndex === 0) {
      window.history.back();
    } else {
      setAppliedFilters({});
      setTabs(tabOrder[currentIndex - 1]);
    }
  };
  const toggleUsers = (rowId: string, checked: boolean) => {
    if (checked) {
      setAddedUsers((prev) => [...prev, rowId]);
    } else {
      setAddedUsers((prev) => prev.filter((item) => item !== rowId));
    }
  };
  const toggleProjects = (rowId: string, checked: boolean) => {
    if (checked) {
      setAddedProjects((prev) => [...prev, rowId]);
    } else {
      setAddedProjects((prev) => prev.filter((item) => item !== rowId));
    }
  };
  const updatedForm = (
    e: React.ChangeEvent<HTMLInputElement> | SelectChangeEvent<string>
  ) => {
    const { name, value } = e.target;
    if (name === 'isConsultantOnly') {
      setGroupInformation((prev) => ({
        ...prev,
        [name]: value === YesNo.Yes,
        groupType: '',
      }));
    } else if (name === 'groupType') {
      setGroupInformation((prev) => ({
        ...prev,
        [name]: value,
      }));
      // clear accounts when change grouptype
      setSelectedAccounts([]);
    } else {
      setGroupInformation((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
    // Clear Error
    setGroupInformationError((prev) => ({
      ...prev,
      [name]: '',
    }));
  };
  const projectPageChange = (newPage: number) => {
    setProjectParams((prev) => ({
      ...prev,
      page: newPage + 1,
    }));
  };
  const projectRowsPerPageChange = (newLimit: number) => {
    setProjectParams((prev) => ({
      ...prev,
      limit: newLimit,
      page: 1,
    }));
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
  const getRowId = (row: ActiveUserForGroup) => row.rid;
  const getProjectRowId = (row: ProjectListByAccounts) => row.project_rid;
  const validateGroupName = (value: string) => {
    // Check for empty value
    if (!value.trim()) {
      return 'Field is required';
    }

    // Check length
    if (value.length < 2 || value.length > 64) {
      return 'The group name must contain a minimum of 2 and a maximum of 64 characters.';
    }

    // Check for starting/ending spaces or special characters
    if (/^[\s\-']|[\s\-']$/.test(value)) {
      return 'Group name cannot begin or end with a space or special character.';
    }

    // Check for consecutive special characters
    if (/[-']{2,}/.test(value)) {
      return 'Group name cannot contain consecutive special characters.';
    }

    // Check for allowed characters only
    if (!/^[A-Za-z0-9\s\-']+$/.test(value)) {
      return "Group name can only contain letters, numbers, spaces, hyphens (-) and apostrophes (').";
    }

    return '';
  };
  const getModifiedProjects = (
    selectedData: string[],
    apiData?: GroupByIdProjects[]
  ) => {
    const oldData = apiData
      ?.filter(
        (proj) => proj.has_access && !selectedData.includes(proj.project_rid)
      )
      .reduce<Record<string, boolean>>((proj, item) => {
        proj[item.project_rid] = false;
        return proj;
      }, {});
    const newData = selectedData
      .filter((item) => !apiData?.find((it) => it.project_rid === item)) //Remove API data
      .reduce<Record<string, boolean>>((proj, key) => {
        proj[key] = true;
        return proj;
      }, {});
    return { ...oldData, ...newData };
  };
  const getModifiedDatas = (
    selectedData: string[],
    apiData?: GroupByIdAccount[] | GroupByIdUsers[]
  ): UserGroupDetailsCommon[] => {
    const oldData = apiData?.map(({ rid, has_access }) => {
      const isSelected = selectedData.includes(rid);
      return {
        rid,
        is_enabled: isSelected,
        is_modified: isSelected !== has_access,
      };
    });
    const newData = selectedData
      .filter((item) => !apiData?.find((it) => it.rid === item)) //Remove API data
      .map((id) => {
        return {
          rid: id,
          is_enabled: true,
          is_modified: true,
        };
      });
    return oldData?.concat(newData) || [];
  };
  const switchTabAndSubmit = () => {
    if (tabs === Tabs.FORM) {
      const groupName = validateGroupName(groupInformation.groupName);
      const groupType = groupInformation.groupType.trim()
        ? ''
        : 'Field is required';
      const newErrors: GroupInformationError = {
        ...groupInformationError,
        groupName,
        groupType,
        accounts: selectedAccounts.length === 0 ? 'Please select Accounts' : '',
      };
      setGroupInformationError(newErrors);
      if (Object.values(newErrors).every((val) => val === '')) {
        // If No errors
        setAppliedFilters({});
        setTabs(Tabs.USER);
      }
    } else if (tabs === Tabs.USER) {
      setAppliedFilters({});
      setTabs(Tabs.PROJECT);
    } else if (tabs === Tabs.PROJECT) {
      const commonData = {
        group_name: prefixGroupName + groupInformation.groupName,
        is_consultant_only_group: groupInformation.isConsultantOnly,
        accounts: selectedAccounts.map((id) => ({
          rid: id,
          is_enabled: true,
          is_modified: true,
        })),
        users: addedUsers.map((id) => ({
          rid: id,
          is_enabled: true,
          is_modified: true,
        })),
        projects: addedProjects.reduce<UserGroupDetails['projects']>(
          (proj, key) => {
            proj[key] = true;
            return proj;
          },
          {}
        ),
      };
      if (isEditView) {
        const constructDataForUpdate = {
          ...commonData,
          group_rid: groupId as string,
          accounts: getModifiedDatas(selectedAccounts, userGroupData?.accounts),
          users: getModifiedDatas(addedUsers, userGroupData?.users),
          projects: getModifiedProjects(addedProjects, userGroupData?.projects),
        };
        updateUserGroup.mutate(constructDataForUpdate);
      } else {
        const constructDataForCreate = {
          ...commonData,
          group_type_rid: groupInformation.groupType,
        };
        createUserGroup.mutate(constructDataForCreate);
      }
    }
  };
  const handleFilterModal = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleCloseFilter = () => {
    setAnchorEl(null);
  };

  return (
    <>
      {/* Header Section */}
      <div className='h-[50px] border-box flex items-center justify-between px-10 border-b-2 border-gray-200 sticky top-0 z-10 bg-white'>
        <div className='flex items-center gap-2 w-[80%] max-w-[80%]'>
          <ManageUserIcon
            alt='manage user group'
            className='h-6 w-6 rounded [&>path:first-child]:fill-[#BE3EB5]'
          />
          <div className='w-[90%]'>
            <div className={HEADER_STYLES.adminPermission}>
              {isEditView
                ? `Admin Permission > Manage User Group > Edit`
                : 'Admin Permission > Manage User Group > Create'}
            </div>
            <div className={HEADER_STYLES.manageUser}>
              {isEditView ? 'Edit User Group' : 'Create User Group'}
            </div>
          </div>
        </div>
        <div className='flex gap-3'>
          <TextButton
            label={
              tabs === Tabs.PROJECT
                ? isEditView
                  ? 'Update'
                  : 'Create'
                : 'Next'
            }
            sx={{
              width: '64px',
              minWidth: '64px',
              fontSize: '13px',
              fontWeight: 400,
            }}
            loading={createUserGroup.isPending || updateUserGroup.isPending}
            onClick={switchTabAndSubmit}
          />
          <TextButton
            label={tabs === Tabs.FORM ? 'Cancel' : 'Back'}
            onClick={goBack}
            sx={{
              width: '75px',
              minWidth: '75px',
              fontSize: '12px',
              fontWeight: 400,
            }}
          />
        </div>
      </div>
      <div
        className={`border-b h-[30px] border-box border-[#CBD6E2] font-bold text-[14px] text-[#2D3E4F] leading-[21px] tracking-[0%] align-middle py-1 bg-[#ECECEC] px-10`}
      >
        {tabs === Tabs.FORM && 'Group Information'}
        {tabs === Tabs.USER && 'Available User'}
        {tabs === Tabs.PROJECT && 'Available Projects'}
      </div>

      {(tabs === Tabs.USER || tabs === Tabs.PROJECT) && (
        <div className='flex px-10 py-1 justify-end'>
          <button
            aria-describedby='user-group'
            className={`w-[64px] h-[24px] text-[13px] mt-[5px] text-[#425A76] cursor-pointer flex items-center justify-center gap-1 font-semibold rounded-[2px] relative 
            ${isFilterOpen || (appliedFilters && Object.keys(appliedFilters).length > 0) ? 'bg-[#F3F3F3]' : ''}`}
            onClick={handleFilterModal}
          >
            <NewFilterIcon alt='filter-icon' />
            Filter
            {appliedFilters && Object.keys(appliedFilters).length > 0 ? (
              <div className='absolute -top-[5px] -right-2 w-4 h-4 flex items-center justify-center text-xs'>
                <span className='absolute w-full h-full bg-[#FF6666] rounded-full animate-ping opacity-75 z-0'></span>
                <span className='w-4 h-4 bg-[#FF6666] text-white rounded-full flex items-center justify-center z-10 font-semibold'>
                  {appliedFilters ? Object.keys(appliedFilters).length : 0}
                </span>
              </div>
            ) : null}
          </button>
          <Suspense fallback={null}>
            <FilterModal
              isOpen={isFilterOpen}
              filterAnchorEl={anchorEl}
              filterId='user-group'
              filterFields={userGroupFilterFields}
              setAppliedFilters={setAppliedFilters}
              setPage={(page) => setUserParams({ ...userParams, page })}
              handleCloseFilter={handleCloseFilter}
              carryFilterData={false}
            />
          </Suspense>
        </div>
      )}

      <div className='flex flex-row w-full items-end gap-4 px-10 py-1'>
        {tabs === Tabs.FORM && (
          <div className='w-full flex flex-col gap-2'>
            <div className='w-full flex flex-row gap-2'>
              {(!isEditView || permissionMap?.['group_name']?.read) && (
                <div className='w-1/2 flex flex-col gap-1'>
                  <label className='text-[13px] font-[600] text-[#2D3E4F]'>
                    Group Name <span className='text-red-500'> *</span>
                  </label>
                  <div className='relative'>
                    <input
                      type='text'
                      name='groupName'
                      placeholder='Enter Group Name'
                      className={`pl-9 placeholder-custom-color placeholder-[#7D98B6] outline-none focus:border-2 focus:border-blue-400 w-full sm:text-sm px-3 h-[32px] border border-[#CBD6E2] rounded-xs ${groupInformationError.groupName ? 'border-red-500' : 'border-gray-300'} ${isGroupNameDisabled ? 'bg-[#f3f4f6] text-[#00000061]' : ''}`}
                      onChange={updatedForm}
                      value={groupInformation.groupName}
                      disabled={isGroupNameDisabled}
                    />
                    <span className='absolute left-0 top-1/2 -translate-y-1/2 text-sm border-r border-r-[#d1d5dc] px-1 py-1 pl-[10px]'>
                      {prefixGroupName}
                    </span>
                  </div>
                  {groupInformationError.groupName && (
                    <span className='text-red-500 text-[11px]'>
                      {groupInformationError.groupName}
                    </span>
                  )}
                </div>
              )}
              {(!isEditView ||
                permissionMap?.['is_consultant_only_group']?.read) && (
                <div className='w-1/2 flex flex-col gap-1'>
                  <label className='text-[13px] font-[600] text-[#2D3E4F]'>
                    Is Consultant Only Group ?{' '}
                    <span className='text-red-500'> *</span>
                  </label>
                  <div className='flex gap-4'>
                    <label className={`cursor-pointer flex items-center`}>
                      <input
                        type='radio'
                        name='isConsultantOnly'
                        onChange={updatedForm}
                        value={YesNo.Yes}
                        checked={groupInformation.isConsultantOnly}
                        disabled={isEditView}
                      />
                      <span className='text-[13px] text-[#7D98B6] ml-2'>
                        Yes
                      </span>
                    </label>
                    <label className={`cursor-pointer flex items-center`}>
                      <input
                        type='radio'
                        name='isConsultantOnly'
                        onChange={updatedForm}
                        value={YesNo.No}
                        checked={!groupInformation.isConsultantOnly}
                        disabled={isEditView}
                      />
                      <span className='text-[13px] text-[#7D98B6] ml-2'>
                        No
                      </span>
                    </label>
                  </div>
                </div>
              )}
            </div>
            <div className='w-full flex flex-row gap-2'>
              {(!isEditView || permissionMap?.['group_type_rid']?.read) && (
                <div className='w-1/2 flex flex-col gap-1'>
                  <label className='text-[13px] font-[600] text-[#2D3E4F]'>
                    Group Type <span className='text-red-500'> *</span>
                  </label>
                  {allUserGroupTypes.isPending ? (
                    commonSkeleton
                  ) : (
                    <Select
                      name='groupType'
                      className='custom-select-no-arrow w-full h-full sm:text-sm px-1.5 py-[7px]'
                      displayEmpty
                      fullWidth
                      size='small'
                      MenuProps={{
                        PaperProps: {
                          sx: {
                            maxWidth: 300,
                            maxHeight: 300,
                            marginTop: '4px',
                            boxShadow:
                              'rgba(50, 50, 93, 0.25) 0px 2px 5px -1px, rgba(0, 0, 0, 0.3) 0px 1px 3px -1px',
                            '& .MuiMenuItem-root': {
                              fontSize: '13px',
                              padding: '6px 12px',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            },
                          },
                        },
                      }}
                      sx={{
                        height: '32px',
                        fontSize: '13px',
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          border: '2px solid #60A5FA',
                        },
                        '& .MuiOutlinedInput-root': {
                          '&.Mui-focused': {
                            boxShadow: 'none',
                          },
                        },
                        '.MuiSelect-select': {
                          padding: '6px 6px',
                        },
                        '&.Mui-disabled': {
                          backgroundColor: '#f3f4f6',
                        },
                        '& svg': {
                          color: '#7D98B6',
                        },
                        '& .MuiOutlinedInput-notchedOutline': {
                          border: groupInformationError.groupType
                            ? '1px solid #ef4444'
                            : '1px solid #CBD6E2',
                          borderRadius: '2px',
                        },
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          border: groupInformationError.groupType
                            ? '1px solid #ef4444'
                            : '1px solid #CBD6E2',
                        },
                      }}
                      value={groupInformation.groupType}
                      onChange={updatedForm}
                      disabled={isEditView}
                    >
                      <MenuItem
                        key='default'
                        sx={{
                          color: '#425A76',
                          fontSize: '13px',
                          fontWeight: '500',
                        }}
                        value=''
                        title=''
                      >
                        Choose Group Type
                      </MenuItem>
                      {allGroupTypes.map((item, i) => {
                        return (
                          <MenuItem
                            key={i}
                            sx={{
                              color: '#425A76',
                              fontSize: '13px',
                              fontWeight: '500',
                            }}
                            value={item.value}
                            title={item.label}
                          >
                            {item.label}
                          </MenuItem>
                        );
                      })}
                    </Select>
                  )}
                  {groupInformationError.groupType && (
                    <span className='text-red-500 text-[11px]'>
                      {groupInformationError.groupType}
                    </span>
                  )}
                </div>
              )}
              {(!isEditView || permissionMap?.['accounts']?.read) && (
                <div className='w-1/2 flex flex-col gap-1'>
                  <label className='text-[13px] font-[600] text-[#2D3E4F]'>
                    Accounts <span className='text-red-500'> *</span>
                  </label>
                  {loading ? (
                    commonSkeleton
                  ) : (
                    <button
                      aria-describedby={accountId}
                      onClick={handleAccountsModal}
                      className={`border border-[#ccc] rounded text-left px-[10px] py-[7px] text-xs w-full flex justify-between items-center ${groupInformationError.accounts ? 'border-red-500' : ''} ${groupTypeNotCustom || isAccountDisabled ? 'bg-[#f3f4f6] text-[#00000061]' : 'cursor-pointer'}`}
                      type='button'
                      disabled={groupTypeNotCustom || isAccountDisabled}
                    >
                      <span>
                        {selectAccountCount.parent} Accounts{' '}
                        {selectAccountCount.child} Childs
                      </span>

                      <ArrowDownDisabledIcon />
                    </button>
                  )}
                  <AccountModal
                    isOpen={isAccountModalOpen}
                    filterAnchorEl={accountAnchorEl}
                    filterId={accountId}
                    handleClose={handleCloseAccountModel}
                    accounts={accounts}
                    accountCollapse={accountCollapse}
                    setAccountCollapse={setAccountCollapse}
                    selectedAccounts={selectedAccounts}
                    setSelectedAccounts={setSelectedAccounts}
                    currentGroupType={
                      currentGroupType?.group_type_name as string
                    }
                  />
                  {groupInformationError.accounts && (
                    <span className='text-red-500 text-[11px]'>
                      {groupInformationError.accounts}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
        {tabs === Tabs.USER && (
          <div className='w-full border border-solid border-[#CBD6E2]'>
            <Suspense fallback={null}>
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
                actionDisplayMode='toggle'
                rowsPerPageOptions={[25, 50, 100]}
                rowsPerPage={userParams.limit}
                currentPage={(userParams.page ?? 1) - 1}
                totalItems={totalUsers}
                onPageChange={userPageChange}
                onRowsPerPageChange={userRowsPerPageChange}
                actionColumnName='Add / Remove'
                stickyHeader
                toggleClick={toggleUsers}
                toggleData={addedUsers}
                loading={availableUsers.isPending}
                checkedToggleTooltip='Added'
                unCheckedToggleTooltip='Removed'
              />
            </Suspense>
          </div>
        )}
        {tabs === Tabs.PROJECT && (
          <>
            <div className='w-full border border-solid border-[#CBD6E2]'>
              <Suspense fallback={null}>
                <ListTable
                  data={availableProjects.data?.data.projects || []}
                  stickyHeader
                  columns={getAvailableProjectsColumns()}
                  getRowId={getProjectRowId}
                  hoverHighlight={false}
                  tableStyle={{
                    height: '100%',
                    maxHeight: 'calc(100vh - 195px)',
                    overflow: 'auto',
                  }}
                  selectable={false}
                  actionWidth={100}
                  actionDisplayMode='toggle'
                  rowsPerPageOptions={[25, 50, 100]}
                  rowsPerPage={projectParams.limit}
                  currentPage={(projectParams.page ?? 1) - 1}
                  totalItems={totalProjects}
                  onPageChange={projectPageChange}
                  onRowsPerPageChange={projectRowsPerPageChange}
                  actionColumnName='Exclusion / Inclusion'
                  toggleClick={toggleProjects}
                  toggleData={addedProjects}
                  disabledToggle={groupTypeNotCustom}
                  loading={availableProjects.isPending}
                  checkedToggleTooltip='Inclusion'
                  unCheckedToggleTooltip='Exclusion'
                />
              </Suspense>
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default CreateUserGroup;

interface AccountModalProps {
  isOpen: boolean;
  filterId: string | undefined;
  filterAnchorEl: HTMLButtonElement | null;
  accounts: AccountList[];
  currentGroupType: string;
  accountCollapse: string[];
  setAccountCollapse: (data: string[]) => void;
  selectedAccounts: string[];
  setSelectedAccounts: (data: string[]) => void;
  handleClose: () => void;
}
const AccountModal: React.FC<AccountModalProps> = ({
  isOpen,
  filterAnchorEl,
  filterId,
  accounts,
  accountCollapse,
  selectedAccounts,
  currentGroupType,
  handleClose,
  setAccountCollapse,
  setSelectedAccounts,
}) => {
  const isCustomGlobalClientFirmSelected =
    currentGroupType === GroupTypes.CUSTOM_GLOBAL_CLIENT_FIRM;
  const isCustomChildClientFirmSelected =
    currentGroupType === GroupTypes.CUSTOM_CHILD_CLIENT_FIRM;

  const ifGlobalClientAccountSelect =
    isCustomGlobalClientFirmSelected && selectedAccounts.length > 0;

  function findParentRid(data: AccountList[], myId: string[]) {
    for (const parent of data) {
      if (parent.child_accounts?.some((child) => myId.includes(child.rid))) {
        return parent.rid;
      }
    }
    return null;
  }
  const parentRid = findParentRid(accounts, selectedAccounts);

  const toggleAccount = (
    id: string,
    checked: boolean,
    parentId?: string,
    childrens?: AccountList[]
  ) => {
    if (isCustomChildClientFirmSelected) {
      setSelectedAccounts(
        checked
          ? [...selectedAccounts, id]
          : selectedAccounts.filter((oldId) => oldId !== id)
      );
    } else {
      setSelectedAccounts(
        checked
          ? parentId
            ? selectedAccounts.includes(parentId)
              ? [...selectedAccounts, id]
              : [...selectedAccounts, id].concat(parentId) //when child choose parent should active
            : [...selectedAccounts, id]
          : childrens //when Parent Remove child should remove
            ? selectedAccounts.filter(
                (oldId) =>
                  !childrens
                    .map((it) => it.rid)
                    .concat(id)
                    .includes(oldId)
              )
            : selectedAccounts.filter((oldId) => oldId !== id)
      );
    }
  };

  return (
    <Popover
      id={filterId}
      open={isOpen}
      anchorEl={filterAnchorEl}
      onClose={handleClose}
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'right',
      }}
      transformOrigin={{
        vertical: 'top',
        horizontal: 'right',
      }}
      PaperProps={{
        sx: {
          boxShadow: '0px 4px 15px 11px #0000001A',
          bgcolor: 'transparent',
          mt: 0.5,
          borderRadius: '8px',
          border: '1px solid #CBD6E2',
          maxHeight: 250,
          width: 600,
          background: 'white',
        },
      }}
    >
      <div>
        {accounts.map((item, i) => {
          const isChecked = selectedAccounts.includes(item.rid);
          const checkBoxDisabled = ifGlobalClientAccountSelect
            ? parentRid
              ? parentRid === item.rid
                ? false
                : true
              : !isChecked
            : isCustomChildClientFirmSelected
              ? true
              : false;
          return (
            <div key={i} className='text-xs'>
              <div className='flex items-center bg-[#f4f4f4] pt-1 pb-1 pl-4 border-t border-[#fff] font-bold'>
                <ArrowDownIcon
                  className={`cursor-pointer ${accountCollapse.includes(item.rid) ? 'rotate-[-90deg]' : ''}`}
                  onClick={() =>
                    setAccountCollapse(
                      accountCollapse.includes(item.rid)
                        ? accountCollapse.filter((id) => id !== item.rid)
                        : [...accountCollapse, item.rid]
                    )
                  }
                />
                <label
                  className={`${checkBoxDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <Checkbox
                    size='small'
                    sx={{
                      color: '#CBD6E2',
                      '&.Mui-checked': {
                        color: '#1755E7',
                      },
                      padding: '0px',
                      mr: 1,
                    }}
                    checked={isChecked}
                    onChange={(_e, checked) =>
                      toggleAccount(
                        item.rid,
                        checked,
                        undefined,
                        item.child_accounts
                      )
                    }
                    disabled={checkBoxDisabled}
                  />
                  {item.account_name}
                </label>
              </div>
              {!accountCollapse.includes(item.rid) &&
                item?.child_accounts?.map((child, j) => {
                  const isChildChecked = selectedAccounts.includes(child.rid);
                  const childCheckBoxDisabled = isCustomChildClientFirmSelected
                    ? selectedAccounts.length > 0
                      ? !isChildChecked
                      : false
                    : checkBoxDisabled;
                  return (
                    <label
                      className={`border-t border-t-[#f3f3f3] bg-white block pl-8 pt-1 pb-1 ${childCheckBoxDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                      key={j}
                    >
                      <Checkbox
                        size='small'
                        sx={{
                          color: '#CBD6E2',
                          '&.Mui-checked': {
                            color: '#1755E7',
                          },
                          padding: '0px',
                          mr: 1,
                        }}
                        checked={isChildChecked}
                        onChange={(_e, checked) =>
                          toggleAccount(child.rid, checked, item.rid)
                        }
                        disabled={childCheckBoxDisabled}
                      />
                      {child.account_name}
                    </label>
                  );
                })}
            </div>
          );
        })}
      </div>
    </Popover>
  );
};
