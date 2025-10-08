import React, { useState, useEffect } from 'react';
import {
  Select,
  MenuItem,
  Tooltip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import {
  ActionItemsIcon,
  ErrorInfoIcon,
  KeyContactAddIcon,
  KeyContactRemoveIcon,
} from '../../../../../assets';
import { SectionTabPanel } from '../../../../../components';
import SectionHeader from '../../../../../components/details-section/section-header';
import { ResourceTabs } from '../../../account-details-sidebar/sidebar-pages/resources/resources';
import { AllPermissions } from '../../../../../common-service';
import { useToast } from '../../../../../hooks';
import { useSearchParams } from 'react-router-dom';

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

const ConfigTabs: ResourceTabs[] = [
  {
    id: AllPermissions.ACCOUNT_ATTACHMENT_OVERVIEW,
    name: 'Overview',
    hide: false,
  },
];

const CaseTeam = () => {
  const [searchParams] = useSearchParams();
  const { successToast, errorToast } = useToast();

  const [formData, setFormData] = useState<CaseTeamFormData>({
    team_members: [
      {
        user_id: 'USER_1',
        user_name: '',
        user_role: '',
      },
    ],
  });

  const [errors, setErrors] = useState<CaseTeamFormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Get case ID from URL params
  const caseId = searchParams.get('caseId') || 'case_123';

  // API hooks
  const caseTeamQuery = useGetCaseTeam(caseId);
  const updateCaseTeamMutation = useUpdateCaseTeam();
  const roleOptionsQuery = useGetRoleOptions();
  const userOptionsQuery = useGetUserOptions();

  const teamTableColumns = getCaseTeamTableColumns();
  const formLoading = caseTeamQuery.isLoading && isInitialLoad;

  // Transform API data to dropdown options with user-specific allocation filtering
  const getAvailableRoleOptions = (currentIndex: number) => {
    const allRoles = roleOptionsQuery.data?.map((role) => role.role_name) || [];
    const currentUser = formData.team_members[currentIndex]?.user_name;

    if (!currentUser) {
      return allRoles;
    }

    // Find roles that the current user is already allocated to (excluding current row)
    const currentUserAllocatedRoles = formData.team_members
      .filter((_, index) => index !== currentIndex)
      .filter((member) => member.user_name === currentUser)
      .map((member) => member.user_role)
      .filter((role) => role !== '');

    return allRoles.filter((role) => !currentUserAllocatedRoles.includes(role));
  };

  const getAvailableUserOptions = (currentIndex: number) => {
    const allUsers = userOptionsQuery.data?.map((user) => user.user_name) || [];
    const currentRole = formData.team_members[currentIndex]?.user_role;

    if (!currentRole) {
      return allUsers;
    }

    // Find users that are already allocated to the current role (excluding current row)
    const currentRoleAllocatedUsers = formData.team_members
      .filter((_, index) => index !== currentIndex)
      .filter((member) => member.user_role === currentRole)
      .map((member) => member.user_name)
      .filter((user) => user !== '');

    return allUsers.filter((user) => !currentRoleAllocatedUsers.includes(user));
  };

  // Load data from API when component mounts
  useEffect(() => {
    if (caseTeamQuery.data && isInitialLoad) {
      setFormData({
        team_members: caseTeamQuery.data.team_members.map(
          (user: CaseTeamMember) => ({
            ...user,
            user_id: user.user_id || '',
            user_name: user.user_name || '',
            user_role: user.user_role || '',
          })
        ),
      });
      setIsInitialLoad(false);
    }
  }, [caseTeamQuery.data, isInitialLoad]);

  useEffect(() => {
    if (updateCaseTeamMutation.isSuccess) {
      successToast('Case team updated successfully');
      caseTeamQuery.refetch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [updateCaseTeamMutation.isSuccess]);

  useEffect(() => {
    if (updateCaseTeamMutation.isError) {
      errorToast('Failed to update case team');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [updateCaseTeamMutation.isError]);

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
          },
        ],
      };
    });
  }

  function handleRemoveTeamMember(index: number) {
    setFormData((prev) => {
      const updatedMembers = prev.team_members.filter((_, i) => i !== index);

      if (updatedMembers.length === 0) {
        updatedMembers.push({
          user_id: 'MEM_1',
          user_name: '',
          user_role: '',
        });
      }

      return {
        ...prev,
        team_members: updatedMembers,
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
      updatedMembers[index] = {
        ...updatedMembers[index],
        [field]: value,
      };
      return {
        ...prev,
        team_members: updatedMembers,
      };
    });

    // Clear error when field changes
    setErrors((prev) => {
      const newMemberErrors = [...(prev.team_members || [])];
      if (newMemberErrors[index]) {
        newMemberErrors[index] = {
          ...newMemberErrors[index],
          [field]: undefined,
        };
      }
      return {
        ...prev,
        team_members: newMemberErrors,
      };
    });
  }

  function validateForm(): boolean {
    const newErrors: CaseTeamFormErrors = {};
    const memberErrors: CaseTeamMemberErrors[] = [];
    let isValid = true;

    formData.team_members.forEach((member, index) => {
      const memberError: CaseTeamMemberErrors = {};

      if (!member.user_name.trim()) {
        memberError.user_name = 'User name is required';
        isValid = false;
      }

      if (!member.user_role.trim()) {
        memberError.user_role = 'User role is required';
        isValid = false;
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

    // Transform data for API
    const payload = {
      case_rid: caseId,
      team_members: formData.team_members.map((member) => ({
        user_id: member.user_id,
        user_name: member.user_name,
        user_role: member.user_role,
      })),
    };

    // Update operation
    updateCaseTeamMutation.mutate(payload, {
      onSuccess: () => {
        setIsLoading(false);
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
      hide: false,
      disabled: false,
      loading: isLoading,
    },
  ];

  const getTitleIcon = () => {
    return <ActionItemsIcon alt='action-items-icon' />;
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
      />
      <SectionHeader
        title={'Case Team'}
        titleIcon={getTitleIcon()}
        buttons={headerButtons}
        count={formData.team_members.length}
        showItemCount={true}
        hideSection={false}
      />

      <div className='flex flex-col gap-0 border border-[#CBD6E2] rounded-[2px] pt-5'>
        <div
          className='w-full mb-5'
          style={{
            display: 'block',
          }}
        >
          <div className='px-4'>
            <TableContainer sx={{ overflowX: 'auto' }}>
              <Table className='border-l border-t border-[#CBD6E2]'>
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
                      .filter((col) => !col.hide)
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
                        },
                        '&:focus': {
                          border: '1px solid #60a5fa',
                          backgroundColor: 'white',
                        },
                      },
                    },
                  }}
                >
                  {formLoading && (
                    <TableSkeleton rowsPerPage={4} columnsCount={3} />
                  )}
                  {!formLoading &&
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
                          .filter((col) => !col.hide)
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
                                      disabled={isDisabled}
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
                                            minWidth: 'fit-content',
                                            width: 'auto',
                                            boxShadow:
                                              'rgba(50, 50, 93, 0.25) 0px 2px 5px -1px, rgba(0, 0, 0, 0.3) 0px 1px 3px -1px',
                                            '& .MuiMenuItem-root': {
                                              fontSize: '13px',
                                              fontWeight: 500,
                                              padding: '6px 12px',
                                              '&[data-value=""]': {
                                                color: '#7D98B6',
                                              },
                                              '&:not([data-value=""])': {
                                                color: '#425A76',
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
                                        Choose User Role
                                      </MenuItem>
                                      {getAvailableRoleOptions(index).map(
                                        (role) => (
                                          <MenuItem
                                            key={role}
                                            value={role}
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
                                      disabled={isDisabled}
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
                                            minWidth: 'fit-content',
                                            width: 'auto',
                                            boxShadow:
                                              'rgba(50, 50, 93, 0.25) 0px 2px 5px -1px, rgba(0, 0, 0, 0.3) 0px 1px 3px -1px',
                                            '& .MuiMenuItem-root': {
                                              fontSize: '13px',
                                              fontWeight: 500,
                                              padding: '6px 12px',
                                              '&[data-value=""]': {
                                                color: '#7D98B6',
                                              },
                                              '&:not([data-value=""])': {
                                                color: '#425A76',
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
                                        Choose User
                                      </MenuItem>
                                      {getAvailableUserOptions(index).map(
                                        (user) => (
                                          <MenuItem
                                            key={user}
                                            value={user}
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

                                {col.name === 'action' && (
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
                                        cursor: isBtnDisabled
                                          ? 'default'
                                          : 'pointer',
                                        background: 'transparent',
                                        border: 'none',
                                        padding: 0,
                                        marginTop: '6px',
                                      }}
                                      aria-label='Remove team member'
                                      disabled={isBtnDisabled}
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
                    ))}
                </TableBody>
              </Table>
            </TableContainer>
          </div>

          <div className='mt-2 pl-4'>
            <button
              className='flex items-center cursor-pointer gap-1 bg-[#EAF0F5] h-[30px] rounded-[2px] color-[#2D3E4F] px-2 text-[12px] font-semibold disabled:bg-gray-100 disabled:opacity-75 disabled:cursor-default'
              type='button'
              onClick={handleAddTeamMember}
              disabled={false}
            >
              <span>
                <React.Suspense fallback={null}>
                  <KeyContactAddIcon alt='add-btn' className='w-5 h-5' />
                </React.Suspense>
              </span>
              Add Case Team Member
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default CaseTeam;
