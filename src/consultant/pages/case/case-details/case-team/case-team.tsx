import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useLayoutEffect,
} from 'react';
import {
  Select,
  SelectChangeEvent,
  MenuItem,
  Tooltip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Checkbox,
} from '@mui/material';
import {
  CalendarIcon,
  CaseTeamIcon,
  CloseIcon,
  ErrorInfoIcon,
  KeyContactAddIcon,
  KeyContactRemoveIcon,
} from '../../../../../assets';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import dayjs from 'dayjs';
import { SectionTabPanel } from '../../../../../components';
import SectionHeader from '../../../../../components/details-section/section-header';
import { ResourceTabs } from '../../../account-details-sidebar/sidebar-pages/resources/resources';
import {
  AllModules,
  AllPermissions,
  useGetStatus,
} from '../../../../../common-service';
import { checkPermission } from '../../../../../common-utils';
import { AccessRestricted } from '../../../../../components/account-restricted';
import { useToast } from '../../../../../hooks';
import { useSearchParams, useParams } from 'react-router-dom';
import {
  getCaseTeamTableColumns,
  CaseTeamFormData,
  CaseTeamFormErrors,
  CaseTeamTableColumn,
  CaseTeamMemberErrors,
} from './helper';
import {
  CaseTeamMember,
  useGetCaseTeam,
  useUpdateCaseTeam,
  useGetRoleOptions,
  useGetUserOptions,
} from '../../../../services/case-team';
import { TableSkeleton } from '../../../../../components/table';
import { RootState } from '../../../../../store/store';
import { useSelector } from 'react-redux';
import { ActivityDropdownItem, colorCode } from '../../../../types';
import { useQueryClient } from '@tanstack/react-query';

const ConfigTabs: ResourceTabs[] = [
  {
    id: AllPermissions.ACCOUNT_ATTACHMENT_OVERVIEW,
    name: 'Overview',
    hide: false,
  },
];

interface CaseTeamProps {
  activityMenuItems: ActivityDropdownItem[];
  fiscalYear: number;
  refetchCaseDetails: () => void;
}

const CaseTeam: React.FC<CaseTeamProps> = ({
  activityMenuItems,
  fiscalYear,
  refetchCaseDetails,
}) => {
  const [searchParams] = useSearchParams();
  const { caseId } = useParams();
  const { successToast, errorToast } = useToast();
  const [formData, setFormData] = useState<CaseTeamFormData>({
    team_members: [],
  });
  const [errors, setErrors] = useState<CaseTeamFormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [originalTeamMembers, setOriginalTeamMembers] = useState<
    CaseTeamMember[]
  >([]);
  const [isFormChanged, setIsFormChanged] = useState(false);
  const cellRefs = useRef<Record<string, HTMLTableCellElement | null>>({});
  const [cellWidths, setCellWidths] = useState<Record<string, number>>({});

  const { permission, modules } = useSelector(
    (state: RootState) => state.permission
  );

  //Permission
  const casesTeamEditFields = useMemo(
    () =>
      permission?.find(
        (item) => item.name === AllPermissions.CASES_TEAM_VIEW_EDIT
      )?.fields ?? [],
    [permission]
  );

  const caseTeamCreatePermission = useMemo(
    () =>
      permission?.find(
        (item) => item.name === AllPermissions.CASES_TEAM_CREATE
      ),
    [permission]
  );

  const caseTeamDeletePermission = useMemo(
    () =>
      permission?.find(
        (item) => item.name === AllPermissions.CASES_TEAM_DELETE
      ),
    [permission]
  );

  const permissionMap = useMemo(() => {
    const map: Record<string, { read: boolean; edit: boolean }> = {};
    casesTeamEditFields.forEach((item) => {
      map[item.name] = { read: item.read ?? false, edit: item.edit ?? false };
    });
    return map;
  }, [casesTeamEditFields]);

  const isCaseTeamEditable = useMemo(
    () =>
      permission
        .find((item) => item.name === AllPermissions.CASES_TEAM_VIEW_EDIT)
        ?.fields?.some((field) => field.edit),
    [permission]
  );

  const isCaseTeamViewEnable = checkPermission(
    permission,
    AllPermissions.CASES_TEAM_VIEW_EDIT
  );

  const isCaseCreateEnable = checkPermission(
    permission,
    AllPermissions.CASES_CREATE
  );

  const showAddButton = caseTeamCreatePermission
    ? caseTeamCreatePermission.is_enabled
    : isCaseCreateEnable;

  useEffect(() => {
    if (formData.team_members.length !== originalTeamMembers.length) {
      setIsFormChanged(true);
      return;
    }
    for (let i = 0; i < formData.team_members.length; i++) {
      const a = formData.team_members[i];
      const b = originalTeamMembers[i];
      if (
        a.user_name !== b.user_name ||
        a.user_role !== b.user_role ||
        a.start_date !== b.start_date ||
        a.end_date !== b.end_date ||
        a.is_primary !== b.is_primary ||
        a.status_rid !== b.status_rid
      ) {
        setIsFormChanged(true);
        return;
      }
    }
    setIsFormChanged(false);
  }, [formData.team_members, originalTeamMembers]);

  const accountId = searchParams.get('accountID') || '';
  const queryClient = useQueryClient();

  const caseTeamQuery = useGetCaseTeam(caseId, accountId);
  const updateCaseTeamMutation = useUpdateCaseTeam();
  const roleOptionsQuery = useGetRoleOptions();
  const userOptionsQuery = useGetUserOptions(accountId);
  const statusOptionsQuery = useGetStatus();

  const teamTableColumns = getCaseTeamTableColumns();
  const formLoading = caseTeamQuery.isLoading || !isDataLoaded;

  const getAvailableRoleOptions = (currentIndex: number) => {
    const allRoles = roleOptionsQuery.data?.map((role) => role.role_name) || [];
    const currentUser = formData.team_members[currentIndex]?.user_name;

    if (!currentUser) {
      return allRoles;
    }

    const currentUserAllocatedRoles = formData.team_members
      .filter((_, index) => index !== currentIndex)
      .filter((member) => member.user_name === currentUser)
      .map((member) => member.user_role)
      .filter((role) => role !== '');

    return allRoles.filter((role) => !currentUserAllocatedRoles.includes(role));
  };

  const getAvailableUserOptions = (currentIndex: number) => {
    const allUsers = userOptionsQuery.data?.map((user) => user.name) || [];
    const currentRole = formData.team_members[currentIndex]?.user_role;

    if (!currentRole) {
      return allUsers;
    }

    const currentRoleAllocatedUsers = formData.team_members
      .filter((_, index) => index !== currentIndex)
      .filter((member) => member.user_role === currentRole)
      .map((member) => member.user_name)
      .filter((user) => user !== '');

    return allUsers.filter((user) => !currentRoleAllocatedUsers.includes(user));
  };

  useEffect(() => {
    // Process data whenever we have case team data and dropdown options are available
    if (caseTeamQuery.data && userOptionsQuery.data && roleOptionsQuery.data) {
      const teamMembers = caseTeamQuery.data.team_members.map(
        (user: CaseTeamMember) => {
          const userOption = userOptionsQuery.data?.find(
            (u) => u.rid === user.user_rid
          );
          const roleOption = roleOptionsQuery.data?.find(
            (r) => r.rid === user.role_rid
          );
          const statusOption = statusOptionsQuery.data?.data?.status?.find(
            (s: { rid: string; status_name: string }) =>
              s.rid === user.status_rid
          );

          return {
            ...user,
            user_id: user.rid || '',
            user_name: userOption?.name || '',
            user_role: roleOption?.role_name || '',
            start_date: user.effective_startdate || '',
            end_date: user.effective_enddate || '',
            is_primary: user.is_primary || false,
            status: statusOption?.status_name || '',
            status_rid: user.status_rid || '',
            assigned_task_count: Number(user.assigned_task_count) || 0,
          };
        }
      );

      // Always update the state when we have fresh data
      setOriginalTeamMembers([...teamMembers]);

      const finalTeamMembers =
        teamMembers.length === 0 && showAddButton
          ? [
              {
                user_id: 'MEM_1',
                user_name: '',
                user_role: '',
                start_date: '',
                end_date: '',
                is_primary: false,
                status: '',
                status_rid: '',
              },
            ]
          : teamMembers;

      setFormData({
        team_members: finalTeamMembers,
      });
      setIsDataLoaded(true);
    }
  }, [
    caseTeamQuery.data,
    userOptionsQuery.data,
    roleOptionsQuery.data,
    statusOptionsQuery.data,
  ]);

  useEffect(() => {
    if (updateCaseTeamMutation.isSuccess) {
      successToast('Case team updated successfully');
      // Reset the mutation state and reload data
      setIsDataLoaded(false);
      updateCaseTeamMutation.reset();
      caseTeamQuery.refetch();
    }
  }, [
    updateCaseTeamMutation.isSuccess,
    successToast,
    updateCaseTeamMutation,
    caseTeamQuery,
  ]);

  useEffect(() => {
    if (updateCaseTeamMutation.isError) {
      errorToast('Failed to update case team');
      updateCaseTeamMutation.reset();
    }
  }, [updateCaseTeamMutation.isError, errorToast, updateCaseTeamMutation]);

  useLayoutEffect(() => {
    const calculateCellWidths = () => {
      const newWidths: Record<string, number> = {};
      Object.entries(cellRefs.current).forEach(([key, cell]) => {
        if (cell) {
          newWidths[key] = cell.offsetWidth;
        }
      });
      setCellWidths(newWidths);
    };

    const timer = setTimeout(calculateCellWidths, 100);
    const handleResize = () => calculateCellWidths();
    window.addEventListener('resize', handleResize);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', handleResize);
    };
  }, [formData.team_members, isDataLoaded]);

  function handleAddTeamMember() {
    setFormData((prev) => {
      const highestSeq = prev.team_members.reduce((max, member) => {
        const seqNum = parseInt(member.user_id.replace('MEM_', ''));
        return isNaN(seqNum) ? max : Math.max(max, seqNum);
      }, 0);

      return {
        ...prev,
        team_members: [
          ...prev.team_members,
          {
            user_id: `MEM_${highestSeq + 1}`,
            user_name: '',
            user_role: '',
            start_date: '',
            end_date: '',
            is_primary: false,
            status: '',
            status_rid: '',
          },
        ],
      };
    });
  }

  function handleRemoveTeamMember(index: number) {
    const memberToRemove = formData.team_members[index];

    if ((memberToRemove.assigned_task_count || 0) >= 1) {
      errorToast(
        `Cannot remove user. Please unassign the ${memberToRemove.assigned_task_count} assigned tasks before proceeding.`
      );
      return;
    }

    setFormData((prev) => {
      const updatedMembers = prev.team_members.filter((_, i) => i !== index);
      return {
        ...prev,
        team_members: updatedMembers,
      };
    });

    setErrors((prev) => {
      const newMemberErrors = [...(prev.team_members || [])];
      newMemberErrors.splice(index, 1);

      return {
        ...prev,
        team_members: newMemberErrors,
      };
    });
  }

  function handleTeamMemberChange(
    index: number,
    field: keyof CaseTeamMember,
    value: string | boolean
  ) {
    setFormData((prev) => {
      const updatedMembers = [...prev.team_members];
      const oldRole = updatedMembers[index].user_role;
      const newRole = field === 'user_role' ? (value as string) : oldRole;

      updatedMembers[index] = {
        ...updatedMembers[index],
        [field]: value,
      };

      // Auto-mark as primary if this is the first time adding this role
      if (field === 'user_role' && newRole && newRole !== oldRole) {
        // Check if this role exists elsewhere (excluding current row)
        const roleExistsElsewhere = updatedMembers.some(
          (member, idx) =>
            idx !== index &&
            member.user_role === newRole &&
            member.user_role !== ''
        );

        if (!roleExistsElsewhere) {
          updatedMembers[index].is_primary = true;
        } else {
          updatedMembers[index].is_primary = false;
        }
      }

      return {
        ...prev,
        team_members: updatedMembers,
      };
    });

    setErrors((prev) => {
      const newMemberErrors = [...(prev.team_members || [])];
      if (!newMemberErrors[index]) {
        newMemberErrors[index] = {};
      }

      newMemberErrors[index] = {
        ...newMemberErrors[index],
        [field]: undefined,
      };

      if (field === 'user_role') {
        newMemberErrors[index] = {
          ...newMemberErrors[index],
          is_primary: undefined,
        };
      }

      return {
        ...prev,
        team_members: newMemberErrors,
      };
    });
  }

  const handleConfirmStatusChange = (
    index: number,
    statusRid: string,
    statusName: string
  ) => {
    setFormData((prev) => {
      const updatedMembers = [...prev.team_members];
      updatedMembers[index] = {
        ...updatedMembers[index],
        status: statusName,
        status_rid: statusRid,
      };
      return {
        ...prev,
        team_members: updatedMembers,
      };
    });

    setErrors((prev) => {
      const newMemberErrors = [...(prev.team_members || [])];
      if (!newMemberErrors[index]) {
        newMemberErrors[index] = {};
      }
      newMemberErrors[index] = {
        ...newMemberErrors[index],
        status: undefined,
      };
      return {
        ...prev,
        team_members: newMemberErrors,
      };
    });
  };

  const handleStatusChange = (
    e: SelectChangeEvent<unknown>,
    member: CaseTeamMember,
    index: number
  ) => {
    const selectedStatusName = e.target.value as string;
    const selectedStatus = statusOptionsQuery.data?.data?.status?.find(
      (s: { rid: string; status_name: string }) =>
        s.status_name === selectedStatusName
    );

    if (
      (selectedStatusName?.toLowerCase().trim() === 'inactive' ||
        selectedStatusName?.toLowerCase().trim() === 'in-active') &&
      (member.assigned_task_count || 0) >= 1
    ) {
      errorToast(
        `Cannot deactivate user. Please unassign the ${member.assigned_task_count} assigned tasks before proceeding.`
      );
      return;
    } else {
      // Proceed with status change without confirmation
      handleConfirmStatusChange(
        index,
        selectedStatus?.rid || '',
        selectedStatusName
      );
    }
  };

  function validateForm(): boolean {
    const newErrors: CaseTeamFormErrors = {};
    const memberErrors: CaseTeamMemberErrors[] = [];
    let isValid = true;

    formData.team_members.forEach((member, index) => {
      const memberError: CaseTeamMemberErrors = {};

      // User name validation
      if (!member.user_name.trim()) {
        memberError.user_name = 'Field is required';
        isValid = false;
      }

      // User role validation
      if (!member.user_role.trim()) {
        memberError.user_role = 'Field is required';
        isValid = false;
      }

      if (!member.start_date) {
        memberError.start_date = 'Field is required';
        isValid = false;
      } else {
        const startDate = dayjs(member.start_date);

        if (
          member.end_date &&
          startDate.isAfter(dayjs(member.end_date), 'day')
        ) {
          memberError.start_date = 'Invalid Date';
          isValid = false;
        }
      }

      if (member.end_date) {
        const endDate = dayjs(member.end_date);
        const startDate = dayjs(member.start_date);

        if (endDate.isBefore(startDate, 'day')) {
          memberError.end_date = 'Invalid Date';
          isValid = false;
        }
      }

      if (!member.status || !member.status.trim()) {
        memberError.status = 'Field is required';
        isValid = false;
      }

      if (member.is_primary && member.user_role) {
        const existingPrimary = formData.team_members.find(
          (m, i) =>
            i !== index &&
            m.user_role === member.user_role &&
            m.user_role !== '' &&
            m.is_primary
        );

        if (existingPrimary) {
          memberError.is_primary = `Only one primary contact allowed per role.`;
          isValid = false;
        }
      }

      memberErrors[index] = memberError;
    });

    newErrors.team_members = memberErrors;
    setErrors(newErrors);
    return isValid;
  }

  function handleSave() {
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    const validMembers = formData.team_members.filter(
      (member) => member.user_name.trim() && member.user_role.trim()
    );

    const newMembers = validMembers.filter((member) =>
      member.user_id.startsWith('MEM_')
    );
    const existingMembers = validMembers.filter(
      (member) => !member.user_id.startsWith('MEM_')
    );

    const editedExistingMembers = existingMembers.filter((member) => {
      const originalMember = originalTeamMembers.find(
        (orig) => orig.user_id === member.user_id
      );
      if (!originalMember) return true;

      return (
        originalMember.user_name !== member.user_name ||
        originalMember.user_role !== member.user_role ||
        originalMember.start_date !== member.start_date ||
        originalMember.end_date !== member.end_date ||
        originalMember.is_primary !== member.is_primary ||
        originalMember.status_rid !== member.status_rid
      );
    });

    const teamMembersPayload = [
      ...newMembers.map((member) => {
        const userOption = userOptionsQuery.data?.find(
          (user) => user.name === member.user_name
        );
        const roleOption = roleOptionsQuery.data?.find(
          (role) => role.role_name === member.user_role
        );

        return {
          user_rid: userOption?.rid || '',
          role_rid: roleOption?.rid || '',
          effective_from: member.start_date,
          effective_to: member.end_date,
          is_primary: member.is_primary || false,
          status_rid: member.status_rid || '',
          action_type: 'add' as const,
        };
      }),
      ...editedExistingMembers.map((member) => {
        const userOption = userOptionsQuery.data?.find(
          (user) => user.name === member.user_name
        );
        const roleOption = roleOptionsQuery.data?.find(
          (role) => role.role_name === member.user_role
        );

        return {
          case_team_rid: member.rid || member.user_id,
          user_rid: userOption?.rid || '',
          role_rid: roleOption?.rid || '',
          effective_from: member.start_date,
          effective_to: member.end_date,
          is_primary: member.is_primary || false,
          status_rid: member.status_rid || '',
          action_type: 'edit' as const,
        };
      }),
    ];

    const deletedMembers = originalTeamMembers.filter(
      (original) =>
        !validMembers.some(
          (current) =>
            current.user_id === original.user_id &&
            !current.user_id.startsWith('MEM_')
        )
    );

    const deletePayloads = deletedMembers.map((member) => {
      const userOption = userOptionsQuery.data?.find(
        (user) => user.name === member.user_name
      );
      const roleOption = roleOptionsQuery.data?.find(
        (role) => role.role_name === member.user_role
      );

      return {
        case_team_rid: member.rid || '',
        user_rid: userOption?.rid || '',
        role_rid: roleOption?.rid || '',
        effective_from: member.start_date,
        effective_to: member.end_date,
        is_primary: member.is_primary || false,
        status_rid: member.status_rid || '',
        action_type: 'delete' as const,
      };
    });

    const payload = {
      case_rid: caseId || '',
      account_rid: accountId,
      team_members: [...teamMembersPayload, ...deletePayloads],
    };

    updateCaseTeamMutation.mutate(payload, {
      onSuccess: async () => {
        setIsLoading(false);
        // Invalidate case details query to update is_case_team_created flag
        await queryClient.invalidateQueries({
          queryKey: ['caseDetails', caseId, accountId],
        });
        // Refetch case details to ensure UI updates immediately
        await refetchCaseDetails();
      },
      onError: () => {
        setIsLoading(false);
      },
    });
  }

  const headerButtons = [
    {
      label: 'Save',
      variant: 'contained' as const,
      onClick: handleSave,
      hide: !isCaseTeamEditable,
      disabled: !isFormChanged || isLoading,
      loading: isLoading,
    },
  ];

  const getTitleIcon = () => {
    return <CaseTeamIcon alt='action-items-icon'    className={`[&>path]:stroke-[${colorCode.accountTextColor}] w-[14px] h-[14px]`}/>;
  };

  const isAddButtonEnabled = caseTeamCreatePermission
    ? caseTeamCreatePermission.is_enabled
    : true;

  const showDeleteButton = caseTeamDeletePermission
    ? caseTeamDeletePermission.is_enabled
    : true;

  const isDeleteButtonEnabled = caseTeamDeletePermission
    ? caseTeamDeletePermission.is_enabled
    : true;

  const isCaseTeamModuleEnabled = useMemo(
    () =>
      modules?.find((item) => item.name === AllModules.CASES_TEAM)?.is_enabled,
    [modules]
  );

  if (!isCaseTeamViewEnable || !isCaseTeamModuleEnabled)
    return <AccessRestricted />;

  const isColumnVisible = (col: CaseTeamTableColumn) => {
    if (col.hide) return false;
    if (col.name === 'action') return showDeleteButton;

    const permissionName: Record<string, string> = {
      user_role: 'role_rid',
      user_name: 'user_rid',
      start_date: 'effective_startdate',
      end_date: 'effective_enddate',
      is_primary: 'is_primary',
      status: 'status_rid',
    };

    const permKey = permissionName[col.name];

    if (permKey && permissionMap[permKey]) {
      return permissionMap[permKey].read;
    }
    return true;
  };

  return (
    <>
      <SectionTabPanel
        tabs={ConfigTabs}
        filterVisibility={false}
        showFilter={true}
        contextKey={`case`}
        appliedFilters={{}}
        setAppliedFilters={() => {}}
        setCurrentPage={() => 0}
        handleFilter={() => {}}
        handleSorting={() => {}}
        sortFilterCount={0}
        setSortFilterCount={() => {}}
        showRefresh={false}
        showAddActivity={true}
        activityMenuItems={activityMenuItems}
      />
      <SectionHeader
        title={'Case Team'}
        titleIcon={getTitleIcon()}
        buttons={headerButtons}
        count={
          formData.team_members.filter(
            (m) =>
              m.user_name ||
              m.user_role ||
              m.start_date ||
              m.end_date ||
              m.status
          ).length
        }
        showItemCount={true}
        hideSection={false}
        iconBg={colorCode.caseBgColor}
        bgType='circle'
      />

      <div className='flex flex-col gap-0 border border-[#CBD6E2] pt-5'>
        <div className='w-full mb-5'>
          <div className='px-4'>
            <TableContainer sx={{ overflowX: 'auto', width: '100%' }}>
              <Table
                className='border-l border-t border-[#CBD6E2]'
                sx={{ minWidth: 800 }}
              >
                <TableHead
                  sx={{
                    '& .MuiTableCell-root': {
                      fontWeight: 700,
                      fontSize: '13px',
                      color: '#2A2A2A',
                      padding: '0px 8px',
                      height: '29px',
                      boxSizing: 'border-box',
                    },
                  }}
                >
                  <TableRow sx={{ height: 29 }}>
                    {teamTableColumns
                      .filter(isColumnVisible)
                      .map((col: CaseTeamTableColumn) => (
                        <TableCell
                          key={col.name}
                          style={{
                            width: col.width,
                            textAlign: col.align ?? 'left',
                            textWrap: 'nowrap',
                          }}
                        >
                          {col.label}{' '}
                          {col.required && (
                            <span className='text-red-500 text-[16px]'>*</span>
                          )}
                        </TableCell>
                      ))}
                  </TableRow>
                </TableHead>
                <TableBody
                  sx={{
                    '& .MuiTableCell-root': {
                      padding: '0px',
                      px: '8px',
                      minHeight: '32px',
                      maxHeight: '32px',
                      height: '32px',
                      '& input, & textarea': {
                        border: 'none',
                        outline: 'none',
                        boxShadow: 'none',
                        background: 'transparent',
                        '&:disabled': {
                          backgroundColor: '#f3f4f6',
                          color: '#6b7280',
                          WebkitTextFillColor: '#6b7280',
                        },
                        '&:focus': {
                          border: '1px solid #60a5fa',
                          backgroundColor: 'white',
                        },
                      },
                    },
                  }}
                >
                  {formLoading ? (
                    <TableSkeleton rowsPerPage={4} columnsCount={7} />
                  ) : (
                    formData.team_members.map((member, index) => (
                      <TableRow
                        key={index}
                        sx={{
                          position: 'relative',
                          p: 0,
                        }}
                        className={''}
                      >
                        {teamTableColumns
                          .filter(isColumnVisible)
                          .map((col: CaseTeamTableColumn) => {
                            const isDisabled = col.disabled;
                            const isBtnDisabled = col.disabled;
                            const error =
                              errors.team_members?.[index]?.[
                                col.name as keyof CaseTeamMemberErrors
                              ];

                            return (
                              <TableCell
                                key={`${col.name}-${index}`}
                                ref={(el: HTMLTableCellElement | null) => {
                                  if (el)
                                    cellRefs.current[`${col.name}-${index}`] =
                                      el;
                                }}
                                style={{
                                  width: col.width,
                                  textAlign: col.align ?? 'left',
                                  position: 'relative',
                                  backgroundColor: error
                                    ? '#FEF2F2'
                                    : 'transparent',
                                }}
                                sx={{ padding: 0 }}
                              >
                                {col.name === 'user_role' && (
                                  <div className='p-1'>
                                    <Select
                                      value={member.user_role}
                                      onChange={(e) =>
                                        handleTeamMemberChange(
                                          index,
                                          'user_role',
                                          e.target.value
                                        )
                                      }
                                      disabled={
                                        isDisabled ||
                                        !permissionMap.role_rid?.edit ||
                                        !!member.rid
                                      }
                                      size='small'
                                      fullWidth
                                      displayEmpty
                                      className='h-[28px]'
                                      sx={{
                                        width: '100%',
                                        '& .MuiSelect-select': {
                                          fontSize: '13px',
                                          fontWeight: 500,
                                          color: member.user_role
                                            ? '#425A76'
                                            : '#7D98B6',
                                          padding: '4px 6px',
                                        },
                                        '& .MuiOutlinedInput-notchedOutline': {
                                          border: 'none',
                                          borderColor: '#CBD6E2',
                                        },
                                        '&:hover .MuiOutlinedInput-notchedOutline':
                                          {
                                            borderColor: '#CBD6E2',
                                          },
                                        '&.Mui-focused .MuiOutlinedInput-notchedOutline':
                                          {
                                            borderColor: '#CBD6E2',
                                          },
                                      }}
                                      MenuProps={{
                                        PaperProps: {
                                          sx: {
                                            marginTop: '4px',
                                            maxHeight: '250px',
                                            borderRadius: '0px',
                                            overflowX: 'auto',
                                            width: Math.max(
                                              cellWidths[
                                                `user_role-${index}`
                                              ] || 0,
                                              150
                                            ),
                                            boxShadow:
                                              'rgba(50, 50, 93, 0.25) 0px 2px 5px -1px, rgba(0, 0, 0, 0.3) 0px 1px 3px -1px',
                                            '& .MuiMenuItem-root': {
                                              fontSize: '13px',
                                              fontWeight: 500,
                                              padding: '6px 12px',
                                              paddingRight: '24px',
                                              whiteSpace: 'nowrap',
                                              display: 'block',
                                              width: '100%',
                                              minWidth: 'max-content',
                                              '&[data-value=""]': {
                                                color: '#7D98B6',
                                              },
                                              '&:not([data-value=""])': {
                                                color: '#425A76',
                                              },
                                              '&.Mui-selected': {
                                                backgroundColor:
                                                  'rgba(0, 0, 0, 0.08)',
                                              },
                                              '&.Mui-selected:hover': {
                                                backgroundColor:
                                                  'rgba(0, 0, 0, 0.12)',
                                              },
                                              '&:hover': {
                                                backgroundColor:
                                                  'rgba(0, 0, 0, 0.04)',
                                              },
                                            },
                                          },
                                        },
                                      }}
                                    >
                                      <MenuItem
                                        value=''
                                        sx={{
                                          fontSize: '13px',
                                          color: '#7D98B6 !important',
                                          fontWeight: 500,
                                        }}
                                      >
                                        Choose Case User Role
                                      </MenuItem>
                                      {getAvailableRoleOptions(index).map(
                                        (role) => (
                                          <MenuItem
                                            key={role}
                                            value={role}
                                            title={role}
                                            sx={{
                                              fontSize: '13px',
                                              color: '#425A76 !important',
                                              fontWeight: 500,
                                            }}
                                          >
                                            {role}
                                          </MenuItem>
                                        )
                                      )}
                                    </Select>
                                  </div>
                                )}

                                {col.name === 'user_name' && (
                                  <div className='p-1'>
                                    <Select
                                      value={member.user_name}
                                      onChange={(e) =>
                                        handleTeamMemberChange(
                                          index,
                                          'user_name',
                                          e.target.value
                                        )
                                      }
                                      disabled={
                                        isDisabled ||
                                        !permissionMap.user_rid?.edit ||
                                        !!member.rid
                                      }
                                      size='small'
                                      fullWidth
                                      displayEmpty
                                      className='h-[28px]'
                                      sx={{
                                        width: '100%',
                                        '& .MuiSelect-select': {
                                          fontSize: '13px',
                                          fontWeight: 500,
                                          color: member.user_name
                                            ? '#425A76'
                                            : '#7D98B6',
                                          padding: '4px 6px',
                                        },
                                        '& .MuiOutlinedInput-notchedOutline': {
                                          border: 'none',
                                          borderColor: '#CBD6E2',
                                        },
                                        '&:hover .MuiOutlinedInput-notchedOutline':
                                          {
                                            borderColor: '#CBD6E2',
                                          },
                                        '&.Mui-focused .MuiOutlinedInput-notchedOutline':
                                          {
                                            borderColor: '#CBD6E2',
                                          },
                                      }}
                                      MenuProps={{
                                        PaperProps: {
                                          sx: {
                                            marginTop: '4px',
                                            maxHeight: '250px',
                                            borderRadius: '0px',
                                            overflowX: 'auto',
                                            width: Math.max(
                                              cellWidths[
                                                `user_name-${index}`
                                              ] || 0,
                                              150 // minimum width fallback
                                            ),
                                            boxShadow:
                                              'rgba(50, 50, 93, 0.25) 0px 2px 5px -1px, rgba(0, 0, 0, 0.3) 0px 1px 3px -1px',
                                            '& .MuiMenuItem-root': {
                                              fontSize: '13px',
                                              fontWeight: 500,
                                              padding: '6px 12px',
                                              paddingRight: '24px',
                                              whiteSpace: 'nowrap',
                                              display: 'block',
                                              width: '100%',
                                              minWidth: 'max-content',
                                              '&[data-value=""]': {
                                                color: '#7D98B6',
                                              },
                                              '&:not([data-value=""])': {
                                                color: '#425A76',
                                              },
                                              '&.Mui-selected': {
                                                backgroundColor:
                                                  'rgba(0, 0, 0, 0.08)',
                                              },
                                              '&.Mui-selected:hover': {
                                                backgroundColor:
                                                  'rgba(0, 0, 0, 0.12)',
                                              },
                                              '&:hover': {
                                                backgroundColor:
                                                  'rgba(0, 0, 0, 0.04)',
                                              },
                                            },
                                          },
                                        },
                                      }}
                                    >
                                      <MenuItem
                                        value=''
                                        sx={{
                                          fontSize: '13px',
                                          color: '#7D98B6 !important',
                                          fontWeight: 500,
                                        }}
                                      >
                                        Choose Case User
                                      </MenuItem>
                                      {getAvailableUserOptions(index).map(
                                        (user) => (
                                          <MenuItem
                                            key={user}
                                            value={user}
                                            title={user}
                                            sx={{
                                              fontSize: '13px',
                                              color: '#425A76 !important',
                                              fontWeight: 500,
                                            }}
                                          >
                                            {user}
                                          </MenuItem>
                                        )
                                      )}
                                    </Select>
                                  </div>
                                )}

                                {col.name === 'is_primary' && (
                                  <div className='p-1 flex justify-center items-center'>
                                    <Checkbox
                                      checked={member.is_primary || false}
                                      onChange={(e) => {
                                        const isChecking = e.target.checked;
                                        if (!isChecking) {
                                          const roleCount =
                                            formData.team_members.filter(
                                              (m) =>
                                                m.user_role === member.user_role
                                            ).length;
                                          if (roleCount <= 1) {
                                            return;
                                          }
                                        }

                                        // Check if trying to set primary when another user in same role is already primary
                                        if (isChecking && member.user_role) {
                                          const existingPrimary =
                                            formData.team_members.find(
                                              (m, i) =>
                                                i !== index &&
                                                m.user_role ===
                                                  member.user_role &&
                                                m.user_role !== '' &&
                                                m.is_primary
                                            );

                                          if (existingPrimary) {
                                            // Set error and don't update the checkbox
                                            setErrors((prev) => {
                                              const newMemberErrors = [
                                                ...(prev.team_members || []),
                                              ];
                                              if (!newMemberErrors[index]) {
                                                newMemberErrors[index] = {};
                                              }
                                              newMemberErrors[index] = {
                                                ...newMemberErrors[index],
                                                is_primary:
                                                  'Only one primary contact allowed per role.',
                                              };
                                              return {
                                                ...prev,
                                                team_members: newMemberErrors,
                                              };
                                            });
                                            return; // Don't update the checkbox state
                                          }
                                        }

                                        // If validation passes or unchecking, update normally
                                        handleTeamMemberChange(
                                          index,
                                          'is_primary',
                                          isChecking
                                        );
                                      }}
                                      disabled={
                                        isDisabled || !isCaseTeamEditable
                                      }
                                      size='small'
                                      sx={{
                                        padding: 0,
                                        color: '#60A5FA',
                                        '&.Mui-checked': {
                                          color: '#60A5FA',
                                        },
                                        '&.Mui-disabled': {
                                          color: '#CBD6E2',
                                        },
                                      }}
                                    />
                                  </div>
                                )}

                                {col.name === 'status' && (
                                  <div className='p-1'>
                                    <Select
                                      value={member.status || ''}
                                      onChange={(e) =>
                                        handleStatusChange(e, member, index)
                                      }
                                      disabled={
                                        isDisabled || !isCaseTeamEditable
                                      }
                                      size='small'
                                      fullWidth
                                      displayEmpty
                                      className='h-[28px]'
                                      sx={{
                                        width: '100%',
                                        '& .MuiSelect-select': {
                                          fontSize: '13px',
                                          fontWeight: 500,
                                          color: member.status
                                            ? '#425A76'
                                            : '#7D98B6',
                                          padding: '4px 6px',
                                        },
                                        '& .MuiOutlinedInput-notchedOutline': {
                                          border: 'none',
                                          borderColor: '#CBD6E2',
                                        },
                                        '&:hover .MuiOutlinedInput-notchedOutline':
                                          {
                                            borderColor: '#CBD6E2',
                                          },
                                        '&.Mui-focused .MuiOutlinedInput-notchedOutline':
                                          {
                                            borderColor: '#CBD6E2',
                                          },
                                      }}
                                      MenuProps={{
                                        PaperProps: {
                                          sx: {
                                            marginTop: '4px',
                                            maxHeight: '250px',
                                            borderRadius: '0px',
                                            overflowX: 'auto',
                                            width: Math.max(
                                              cellWidths[`status-${index}`] ||
                                                0,
                                              150
                                            ),
                                            boxShadow:
                                              'rgba(50, 50, 93, 0.25) 0px 2px 5px -1px, rgba(0, 0, 0, 0.3) 0px 1px 3px -1px',
                                            '& .MuiMenuItem-root': {
                                              fontSize: '13px',
                                              fontWeight: 500,
                                              padding: '6px 12px',
                                              paddingRight: '24px',
                                              whiteSpace: 'nowrap',
                                              display: 'block',
                                              width: '100%',
                                              minWidth: 'max-content',
                                              '&[data-value=""]': {
                                                color: '#7D98B6',
                                              },
                                              '&:not([data-value=""])': {
                                                color: '#425A76',
                                              },
                                              '&.Mui-selected': {
                                                backgroundColor:
                                                  'rgba(0, 0, 0, 0.08)',
                                              },
                                              '&.Mui-selected:hover': {
                                                backgroundColor:
                                                  'rgba(0, 0, 0, 0.12)',
                                              },
                                              '&:hover': {
                                                backgroundColor:
                                                  'rgba(0, 0, 0, 0.04)',
                                              },
                                            },
                                          },
                                        },
                                      }}
                                    >
                                      <MenuItem
                                        value=''
                                        sx={{
                                          fontSize: '13px',
                                          color: '#7D98B6 !important',
                                          fontWeight: 500,
                                        }}
                                      >
                                        Choose Status
                                      </MenuItem>
                                      {statusOptionsQuery.data?.data?.status?.map(
                                        (status: {
                                          rid: string;
                                          status_name: string;
                                          status_description?: string;
                                        }) => (
                                          <MenuItem
                                            key={status.rid}
                                            value={status.status_name}
                                            sx={{
                                              fontSize: '13px',
                                              color: '#425A76 !important',
                                              fontWeight: 500,
                                            }}
                                          >
                                            {status.status_name}
                                          </MenuItem>
                                        )
                                      )}
                                    </Select>
                                  </div>
                                )}

                                {col.name === 'start_date' && (
                                  <div
                                    onKeyDown={(e) => e.stopPropagation()}
                                    className='w-full min-w-[140px]'
                                  >
                                    <LocalizationProvider
                                      dateAdapter={AdapterDayjs}
                                    >
                                      <DatePicker
                                        value={
                                          member.start_date
                                            ? dayjs(member.start_date)
                                            : null
                                        }
                                        onChange={(newValue) =>
                                          handleTeamMemberChange(
                                            index,
                                            'start_date',
                                            newValue
                                              ? dayjs(newValue).format(
                                                  'YYYY-MM-DD'
                                                )
                                              : ''
                                          )
                                        }
                                        format='YYYY-MMM-DD'
                                        minDate={
                                          fiscalYear
                                            ? dayjs(`${fiscalYear - 1}-04-01`)
                                            : dayjs().startOf('day')
                                        }
                                        disabled={
                                          isDisabled ||
                                          !permissionMap.effective_startdate
                                            ?.edit
                                        }
                                        sx={{
                                          width: '100%',
                                          minWidth: '140px',
                                          backgroundColor:
                                            'transparent !important',
                                          margin: 0,
                                          padding: 0,
                                          '& .MuiOutlinedInput-root': {
                                            height: '28px',
                                            borderRadius: '2px',
                                            minWidth: '140px',
                                            backgroundColor:
                                              'transparent !important',
                                            '&.Mui-disabled': {
                                              backgroundColor:
                                                'transparent !important',
                                              '& input': {
                                                color: '#6b7280',
                                                WebkitTextFillColor: '#6b7280',
                                                backgroundColor:
                                                  'transparent !important',
                                              },
                                            },
                                            '& fieldset': {
                                              border: error
                                                ? '1px solid #ef4444'
                                                : 'none',
                                              backgroundColor:
                                                'transparent !important',
                                            },
                                            '&:hover fieldset': {
                                              borderColor: error
                                                ? '#ef4444'
                                                : 'transparent',
                                              backgroundColor:
                                                'transparent !important',
                                            },
                                            '&.Mui-focused fieldset': {
                                              borderColor: error
                                                ? '#ef4444'
                                                : 'transparent',
                                              backgroundColor:
                                                'transparent !important',
                                            },
                                          },
                                          '& .MuiOutlinedInput-notchedOutline':
                                            {
                                              borderColor:
                                                'transparent !important',
                                              backgroundColor:
                                                'transparent !important',
                                            },
                                          '& .MuiInputBase-input': {
                                            fontSize: '12px',
                                            fontWeight: 500,
                                            padding: '4px 6px',
                                            height: '20px',
                                            minWidth: '100px',
                                            textAlign: 'left',
                                            color: member.start_date
                                              ? '#425A76'
                                              : '#7D98B6',
                                            backgroundColor:
                                              'transparent !important',
                                            whiteSpace: 'nowrap',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            '&::placeholder': {
                                              fontSize: '12px',
                                              color: '#7D98B6 !important',
                                              opacity: 1,
                                            },
                                            '&[placeholder]': {
                                              color: '#7D98B6 !important',
                                              opacity: 1,
                                            },
                                            '&.Mui-disabled::placeholder': {
                                              color: '#7D98B6 !important',
                                              WebkitTextFillColor:
                                                '#7D98B6 !important',
                                              opacity: 1,
                                            },
                                            '&.Mui-disabled': {
                                              color: '#6b7280',
                                              WebkitTextFillColor: '#6b7280',
                                            },
                                          },
                                          '& .MuiInputAdornment-root': {
                                            marginLeft: '2px',
                                            gap: '2px',
                                            backgroundColor:
                                              'transparent !important',
                                          },
                                        }}
                                        slotProps={{
                                          field: { clearable: true },
                                          clearButton: {
                                            tabIndex: -1,
                                          },
                                          openPickerButton: {
                                            tabIndex: -1,
                                          },
                                          textField: {
                                            size: 'small',
                                            error: !!error,
                                            placeholder: 'YYYY-MMM-DD',
                                            InputProps: {
                                              disabled: true,
                                              onPaste: (
                                                e: React.ClipboardEvent<HTMLInputElement>
                                              ) => {
                                                e.preventDefault();
                                                return false;
                                              },
                                            },
                                            InputLabelProps: {
                                              shrink: true,
                                            },
                                          },
                                          inputAdornment: {
                                            position: 'end',
                                          },
                                          popper: {
                                            sx: {
                                              '& .MuiPaper-root': {
                                                marginTop: '7px',
                                                marginLeft: '-10px',
                                                borderRadius: '0px',
                                              },
                                            },
                                          },
                                        }}
                                        slots={{
                                          openPickerIcon: () => (
                                            <CalendarIcon
                                              alt='calendar'
                                              className='w-3 h-3 flex-shrink-0'
                                            />
                                          ),
                                          clearIcon: () => (
                                            <CloseIcon
                                              alt='calendar'
                                              className='w-[9px] h-[9px] flex-shrink-0'
                                            />
                                          ),
                                        }}
                                      />
                                    </LocalizationProvider>
                                  </div>
                                )}

                                {col.name === 'end_date' && (
                                  <div
                                    onKeyDown={(e) => e.stopPropagation()}
                                    className='w-full min-w-[140px]'
                                  >
                                    <LocalizationProvider
                                      dateAdapter={AdapterDayjs}
                                    >
                                      <DatePicker
                                        value={
                                          member.end_date
                                            ? dayjs(member.end_date)
                                            : null
                                        }
                                        onChange={(newValue) =>
                                          handleTeamMemberChange(
                                            index,
                                            'end_date',
                                            newValue
                                              ? dayjs(newValue).format(
                                                  'YYYY-MM-DD'
                                                )
                                              : ''
                                          )
                                        }
                                        format='YYYY-MMM-DD'
                                        minDate={
                                          member.start_date
                                            ? dayjs(member.start_date)
                                            : dayjs('1950-01-01')
                                        }
                                        disabled={
                                          isDisabled ||
                                          !permissionMap.effective_enddate?.edit
                                        }
                                        sx={{
                                          width: '100%',
                                          minWidth: '140px',
                                          backgroundColor:
                                            'transparent !important',
                                          margin: 0,
                                          padding: 0,
                                          '& .MuiOutlinedInput-root': {
                                            height: '28px',
                                            borderRadius: '2px',
                                            minWidth: '140px',
                                            backgroundColor:
                                              'transparent !important',
                                            '&.Mui-disabled': {
                                              backgroundColor:
                                                'transparent !important',
                                              '& input': {
                                                color: '#6b7280',
                                                WebkitTextFillColor: '#6b7280',
                                                backgroundColor:
                                                  'transparent !important',
                                              },
                                            },
                                            '& fieldset': {
                                              border: error
                                                ? '1px solid #ef4444'
                                                : 'none',
                                              backgroundColor:
                                                'transparent !important',
                                            },
                                            '&:hover fieldset': {
                                              borderColor: error
                                                ? '#ef4444'
                                                : 'transparent',
                                              backgroundColor:
                                                'transparent !important',
                                            },
                                            '&.Mui-focused fieldset': {
                                              borderColor: error
                                                ? '#ef4444'
                                                : 'transparent',
                                              backgroundColor:
                                                'transparent !important',
                                            },
                                          },
                                          '& .MuiOutlinedInput-notchedOutline':
                                            {
                                              borderColor:
                                                'transparent !important',
                                              backgroundColor:
                                                'transparent !important',
                                            },
                                          '& .MuiInputBase-input': {
                                            fontSize: '12px',
                                            fontWeight: 500,
                                            padding: '4px 6px',
                                            height: '20px',
                                            minWidth: '100px',
                                            textAlign: 'left',
                                            color: member.end_date
                                              ? '#425A76'
                                              : '#7D98B6',
                                            backgroundColor:
                                              'transparent !important',
                                            whiteSpace: 'nowrap',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            '&::placeholder': {
                                              fontSize: '12px',
                                              color: '#7D98B6 !important',
                                              opacity: 1,
                                            },
                                            '&[placeholder]': {
                                              color: '#7D98B6 !important',
                                              opacity: 1,
                                            },
                                            '&.Mui-disabled::placeholder': {
                                              color: '#7D98B6 !important',
                                              WebkitTextFillColor:
                                                '#7D98B6 !important',
                                              opacity: 1,
                                            },
                                            '&.Mui-disabled': {
                                              color: '#6b7280',
                                              WebkitTextFillColor: '#6b7280',
                                            },
                                          },
                                          '& .MuiInputAdornment-root': {
                                            marginLeft: '2px',
                                            gap: '2px',
                                            backgroundColor:
                                              'transparent !important',
                                          },
                                        }}
                                        slotProps={{
                                          field: { clearable: true },
                                          clearButton: {
                                            tabIndex: -1,
                                          },
                                          openPickerButton: {
                                            tabIndex: -1,
                                          },
                                          textField: {
                                            size: 'small',
                                            error: !!error,
                                            placeholder: 'YYYY-MMM-DD',
                                            InputProps: {
                                              disabled: true,
                                              onPaste: (
                                                e: React.ClipboardEvent<HTMLInputElement>
                                              ) => {
                                                e.preventDefault();
                                                return false;
                                              },
                                            },
                                            InputLabelProps: {
                                              shrink: true,
                                            },
                                          },
                                          inputAdornment: {
                                            position: 'end',
                                          },
                                          popper: {
                                            sx: {
                                              '& .MuiPaper-root': {
                                                marginTop: '7px',
                                                marginLeft: '-10px',
                                                borderRadius: '0px',
                                              },
                                            },
                                          },
                                        }}
                                        slots={{
                                          openPickerIcon: () => (
                                            <CalendarIcon
                                              alt='calendar'
                                              className='w-3 h-3 flex-shrink-0'
                                            />
                                          ),
                                          clearIcon: () => (
                                            <CloseIcon
                                              alt='calendar'
                                              className='w-[9px] h-[9px] flex-shrink-0'
                                            />
                                          ),
                                        }}
                                      />
                                    </LocalizationProvider>
                                  </div>
                                )}

                                {col.name === 'action' && showDeleteButton && (
                                  <Tooltip
                                    title={'Remove team member'}
                                    disableHoverListener={isBtnDisabled}
                                    arrow
                                    placement='top'
                                  >
                                    <button
                                      type='button'
                                      onClick={() =>
                                        handleRemoveTeamMember(index)
                                      }
                                      style={{
                                        cursor:
                                          isBtnDisabled ||
                                          !isDeleteButtonEnabled
                                            ? 'default'
                                            : 'pointer',
                                        background: 'transparent',
                                        border: 'none',
                                        padding: 0,
                                        marginTop: '6px',
                                      }}
                                      aria-label='Remove team member' // prettier-ignore
                                      disabled={
                                        isBtnDisabled ||
                                        !isCaseTeamEditable ||
                                        !isDeleteButtonEnabled
                                      }
                                    >
                                      <React.Suspense fallback={null}>
                                        <KeyContactRemoveIcon
                                          alt='Remove'
                                          style={{
                                            width: 20,
                                            height: 20,
                                          }}
                                        />
                                      </React.Suspense>
                                    </button>
                                  </Tooltip>
                                )}

                                {error && (
                                  <Tooltip
                                    title={error}
                                    arrow
                                    placement='top'
                                    slotProps={{
                                      tooltip: {
                                        sx: {
                                          backgroundColor: '#FEF2F2',
                                          mr: 1,
                                        },
                                      },
                                    }}
                                  >
                                    <span className='h-[28px] w-5 flex items-center justify-center absolute top-[3px] bg-[#FEF2F2] right-[2px] cursor-pointer'>
                                      <React.Suspense fallback={null}>
                                        <ErrorInfoIcon
                                          alt='error'
                                          className='w-5 h-3.5'
                                        />
                                      </React.Suspense>
                                    </span>
                                  </Tooltip>
                                )}
                              </TableCell>
                            );
                          })}
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </div>

          {showAddButton && (
            <div className='mt-2 pl-4'>
              <button
                className='flex items-center cursor-pointer gap-1 bg-[#EAF0F5] h-[30px] color-[#2D3E4F] px-2 text-[12px] font-semibold disabled:bg-gray-100 disabled:opacity-75 disabled:cursor-default'
                type='button'
                onClick={handleAddTeamMember}
                disabled={
                  formLoading || !isCaseTeamEditable || !isAddButtonEnabled
                }
              >
                <span>
                  <React.Suspense fallback={null}>
                    <KeyContactAddIcon alt='add-btn' className='w-5 h-5' />
                  </React.Suspense>
                </span>
                Add Case Team Member
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default CaseTeam;
