import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ListTable, ManageColumnsPopover } from '../../../../components/table';
import {
  FilterCondition,
  Profiles,
  UserListParams,
} from '../../../types/manage-user';
import { getProfileColumns } from './columns';
import { ManageProfile, ManageProfileList } from '../../../types';
import { useManageProfileList } from '../../../service';
import { MANAGE_PROFILE } from '../../../../routes/routes';
import {
  ActionItem,
  CellEditData,
  FieldChangeValue,
  ListTableColumn,
  ShowHideTableColumn,
} from '../../../../components/table/types';
import { DeleteIcon, EditIcon } from '../../../../assets';
import { useMutation } from '@apollo/client';
import { UPDATE_USER_PROFILE } from '../../../../api/graphql/queries/profile-query';
import { userClient } from '../../../../api/graphql/clients/client';
import { useToast } from '../../../../hooks';
import { useSelector } from 'react-redux';
import { RootState } from '../../../../store/store';
import { AllPermissions } from '../../../../common-service';

interface IUserTableProps {
  appliedFilters: Record<string, FilterCondition>;
  tableParams: UserListParams;
  isProfileViewEnable?: boolean;
  isProfileDeleteEnable?: boolean;
  setTableParams: React.Dispatch<React.SetStateAction<UserListParams>>;
  onSelectionChange: (selectedIds: string[]) => void;
  refreshProfileTrigger?: number;
  columnAnchorEl: HTMLButtonElement | null;
  setColumnAnchorEl: React.Dispatch<
    React.SetStateAction<HTMLButtonElement | null>
  >;
  searchValue?: string;
}

export const ProfileTable: React.FC<IUserTableProps> = ({
  appliedFilters,
  tableParams,
  // isProfileViewEnable,
  // isProfileDeleteEnable,
  setTableParams,
  onSelectionChange,
  refreshProfileTrigger,
  columnAnchorEl,
  setColumnAnchorEl,
  searchValue,
}) => {
  const navigate = useNavigate();
  const { errorToast } = useToast();
  const [profileList, setProfileList] = useState<Profiles[]>([]);
  const [updateUserProfile] = useMutation(UPDATE_USER_PROFILE, {
    client: userClient,
  });

  //permissions
  const { permission } = useSelector((state: RootState) => state.permission);
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
  const profilePermissionViewEditFields = useMemo(
    () =>
      permission.find((item) => item.name === AllPermissions.PROFILE_VIEW_EDIT)
        ?.fields ?? [],
    [permission]
  );

  const profilePermissionMap = useMemo(() => {
    const map: Record<string, { read: boolean; edit: boolean }> = {};
    profilePermissionViewEditFields.forEach((item) => {
      map[item.name] = { read: item.read ?? false, edit: item.edit ?? false };
    });
    return map;
  }, [profilePermissionViewEditFields]);

  const isProfileviewEdit =
    !profilePermissionMap?.['profile_permissions']?.read &&
    !profilePermissionMap?.['profile_permissions']?.edit;

  const {
    data: ProfileList,
    isLoading,
    isError,
  } = useManageProfileList(
    { ...tableParams, filters: appliedFilters, search: searchValue },
    refreshProfileTrigger
  );
  const totalItems = ProfileList?.data?.count || 0;

  useEffect(() => {
    setProfileList(ProfileList?.data?.profiles ?? []);
  }, [ProfileList]);

  const convertUserListData = (data: ManageProfileList): ManageProfile => {
    if (!data) return {} as ManageProfile;
    return {
      id: data?.rid,
      createdBy: data?.created_by || '',
      createdOn: data?.created_datetime,
      profileName: data?.profile_name,
    };
  };

  const getRowId = (row: ManageProfileList) => row.rid;

  const handleEdit = (row: ManageProfileList) => {
    const data = convertUserListData(row);
    navigate(MANAGE_PROFILE + '/edit/' + data.id, {
      state: { user: data },
    });
  };
  // const handleView = (row: ManageProfileList) => {
  //   const data = convertUserListData(row);
  //   navigate(MANAGE_PROFILE + '/view/' + data.id, {
  //     state: { user: data },
  //   });
  // };
  const handleDelete = (row: ManageProfileList) => {
    // navigate(`/admin/manage-user/${row.id}`, {
    //   state: { user: row },
    // });
    console.log('trigger row delete:', row);
  };

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

  const actionButtons: ActionItem<ManageProfileList>[] = [
    // {
    //   label: 'View',
    //   onClick: (row: ManageProfileList) => handleView(row),
    //   hide: !isProfileViewEnable,
    // },
    {
      label: 'Edit',
      onClick: (row: ManageProfileList) => handleEdit(row),
      icon: EditIcon,
      iconStyle: {
        filter:
          'brightness(0) saturate(100%) invert(25%) sepia(16%) saturate(592%) hue-rotate(164deg) brightness(93%) contrast(91%)',
      },
      hide: isProfileviewEdit,
    },
    {
      label: 'Delete',
      onClick: (row: ManageProfileList) => handleDelete(row),
      icon: DeleteIcon,
      // hide: !isProfileDeleteEnable,
      hide: true,
    },
  ];

  const handleCellEdit = async (rowId: string, updates: CellEditData[]) => {
    const previousProfileList = [...profileList];
    const updateData = updates.reduce<Record<string, FieldChangeValue>>(
      (res, item) => {
        const key = item.editId || item.columnId;
        res[key] = item.value;
        return res;
      },
      { rid: rowId }
    );

    try {
      const res = await updateUserProfile({
        variables: { input: updateData },
      });

      const result = res.data?.updateUserProfile;
      if (result?.success === true && result.profile) {
        const updatedProfile = result.profile;
        setProfileList((prevProfiles) =>
          prevProfiles.map((profile) =>
            profile.rid === updatedProfile.rid ? updatedProfile : profile
          )
        );
      } else {
        errorToast(result?.message || 'Failed to update filed');
        setProfileList(previousProfileList);
      }
    } catch (error) {
      errorToast((error as Error)?.message || 'Failed to update filed');
      setProfileList(previousProfileList);
    }
  };

  const profileColumns = getProfileColumns(permissionMap);

  const RestrictedColumns = [
    {
      id: 'profile_name',
      canHide: false,
      canDrag: false,
    },
  ];

  const [visibleColumns, setVisibleColumns] = useState<
    ListTableColumn<ManageProfileList>[]
  >(profileColumns.filter((col) => !col.hide));

  const handleColumnsChange = (updatedColumns: ShowHideTableColumn[]) => {
    setVisibleColumns(
      updatedColumns.filter(
        (col) => !col.hide
      ) as ListTableColumn<ManageProfileList>[]
    );
  };

  const handlePopoverClose = () => {
    setColumnAnchorEl(null);
  };

  const isModalOpen = Boolean(columnAnchorEl);
  const modalId = isModalOpen
    ? 'interaction-column-visibility-popover'
    : undefined;

  return (
    <>
      <ManageColumnsPopover
        anchorEl={columnAnchorEl}
        open={isModalOpen}
        popoverId={modalId}
        onClose={handlePopoverClose}
        columns={profileColumns}
        onColumnsChange={handleColumnsChange}
        columnRestrictions={RestrictedColumns}
      />
      <ListTable
        data={(profileList || []) as ManageProfileList[]}
        columns={visibleColumns}
        getRowId={getRowId}
        hoverHighlight={false}
        tableStyle={{
          height: '100%',
          maxHeight: 'calc(100vh - 195px)',
          overflow: 'auto',
        }}
        stickyHeader={true}
        stickyColumnsCount={2}
        selectable={true}
        onSelectionChange={onSelectionChange}
        actionWidth={60}
        actionDisplayMode='dropdown'
        actionMenuItems={actionButtons}
        loading={isLoading}
        error={isError ? 'Failed to load profiles' : undefined}
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
