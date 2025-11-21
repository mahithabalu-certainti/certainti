/* eslint-disable @typescript-eslint/no-explicit-any */
import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useLayoutEffect,
} from 'react';
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
  TextField,
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
import { TableSkeleton } from '../../../../../components/table';
import { RootState } from '../../../../../store/store';
import { useSelector } from 'react-redux';
import { ActivityMenuItem } from '../../../../types';
import {
  useGetHistoricalSubmission,
  useUpdateHistorySubmission,
} from '../../../../services/historical-submission/historical-submission';
import {
  HistoricalSubmissionPayload,
  HistoryErrors,
  HistoryFormData,
  HistoryFormErrors,
  historySummary,
} from '../../../../types/history-submission';

const ConfigTabs: ResourceTabs[] = [
  {
    id: AllPermissions.ACCOUNT_ATTACHMENT_OVERVIEW,
    name: 'Overview',
    hide: false,
  },
];

interface CaseTeamProps {
  activityMenuItems: ActivityMenuItem[];
}

// Generate years from 1950 to current year
const generateYearOptions = () => {
  const currentYear = new Date().getFullYear();
  const years = [];
  for (let year = 1950; year <= currentYear; year++) {
    years.push({
      value: year,
      label: `FY - ${year}`,
    });
  }
  return years.reverse();
};

// Extended interface for form submission with temporary id
interface FormSubmission extends Omit<historySummary, 'fiscal_year'> {
  user_id: string; // Temporary ID for form management
  fiscal_year: string; // Keep as string for form handling, convert to number for API
}

const HistorySubmission: React.FC<CaseTeamProps> = ({ activityMenuItems }) => {
  const [searchParams] = useSearchParams();
  const { successToast, errorToast } = useToast();
  const [formData, setFormData] = useState<HistoryFormData>({
    historicalSubmissions: [],
  });
  const [errors, setErrors] = useState<HistoryFormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [originalSubmissions, setOriginalSubmissions] = useState<
    historySummary[]
  >([]);
  const [isFormChanged, setIsFormChanged] = useState(false);
  const cellRefs = useRef<Record<string, HTMLTableCellElement | null>>({});
  const [cellWidths, setCellWidths] = useState<Record<string, number>>({});

  const { permission } = useSelector((state: RootState) => state.permission);

  // Permission
  // const casesTeamEditFields = useMemo(
  //   () =>
  //     permission?.find(
  //       (item) => item.name === AllPermissions.CASES_TEAM_VIEW_EDIT
  //     )?.fields ?? [],
  //   [permission]
  // );

  // const permissionMap = useMemo(() => {
  //   const map: Record<string, { read: boolean; edit: boolean }> = {};
  //   casesTeamEditFields.forEach((item) => {
  //     map[item.name] = { read: item.read ?? false, edit: item.edit ?? false };
  //   });
  //   return map;
  // }, [casesTeamEditFields]);

  const isCaseTeamEditable = useMemo(
    () =>
      permission
        .find((item) => item.name === AllPermissions.CASES_TEAM_VIEW_EDIT)
        ?.fields?.some((field) => field.edit),
    [permission]
  );

  useEffect(() => {
    if (formData.historicalSubmissions.length !== originalSubmissions.length) {
      setIsFormChanged(true);
      return;
    }
    for (let i = 0; i < formData.historicalSubmissions.length; i++) {
      const a = formData.historicalSubmissions[i];
      const b = originalSubmissions[i];
      if (
        a.fiscal_year?.toString() !== b.fiscal_year?.toString() ||
        a.total_project_cost !== b.total_project_cost ||
        a.total_qre !== b.total_qre ||
        a.total_rd_credits !== b.total_rd_credits ||
        a.annual_gross_receipts !== b.annual_gross_receipts
      ) {
        setIsFormChanged(true);
        return;
      }
    }
    setIsFormChanged(false);
  }, [formData.historicalSubmissions, originalSubmissions]);

  const accountId = searchParams.get('accountID') || '';

  const {
    data,
    isLoading: isCaseTeamLoading,
    refetch,
  } = useGetHistoricalSubmission(accountId);

  const updateHistorySubmissionMutation = useUpdateHistorySubmission();
  const formLoading = isCaseTeamLoading;
  const yearOptions = generateYearOptions();

  // Updated form structure for historical submission with correct field mapping
  const historicalFields = [
    {
      key: 'fiscal_year',
      label: 'Fiscal Year',
      type: 'dropdown',
      required: true,
    },
    {
      key: 'total_project_cost',
      label: 'Total Project Cost',
      type: 'text',
      required: true,
    },
    {
      key: 'total_qre',
      label: 'Total QRE',
      type: 'text',
      required: true,
    },
    {
      key: 'total_rd_credits',
      label: 'Total RD Credits',
      type: 'text',
      required: true,
    },
    {
      key: 'annual_gross_receipts',
      label: 'Annual Gross Receipts',
      type: 'text',
      required: false,
    },
  ];
  console.log('Historical Fields:', data);
  useEffect(() => {
    // Process API data when it's available
    if (data && !formLoading) {
      const apiData = data as historySummary[];

      if (apiData && apiData.length > 0) {
        // Map API data to form structure using the correct field names
        const mappedSubmissions: FormSubmission[] = apiData.map((item) => ({
          ...item,
          user_id: item.rid || `MEM_${item.fiscal_year}`, // Temporary ID for form management
          fiscal_year: item.fiscal_year?.toString() || '', // Convert to string for form
        }));

        setFormData({
          historicalSubmissions: mappedSubmissions.map((m) => ({
            ...m,
            fiscal_year: Number(m.fiscal_year),
          })),
        });
        setOriginalSubmissions(apiData);
      } else if (apiData.length === 0) {
        // Initialize with empty data if no API data
        const initialSubmissions: FormSubmission[] = [
          {
            user_id: 'MEM_1',
            rid: '',
            r_number: '',
            eid: null,
            created_by: '',
            modified_by: null,
            created_datetime: '',
            modified_datetime: null,
            account_rid: accountId,
            fiscal_year: '',
            total_project: 0,
            total_qualified_project: 0,
            total_project_cost: '',
            total_qualified_project_cost: '',
            total_qre: '',
            total_rd_credits: '',
            annual_gross_receipts: '',
          },
        ];
        setFormData({
          historicalSubmissions: initialSubmissions,
        });
        setOriginalSubmissions([]);
      }
      setIsDataLoaded(true);
    } else if (!data && !formLoading && !isDataLoaded && accountId) {
      // Initialize with empty data if no API data available
      const initialSubmissions: FormSubmission[] = [
        {
          user_id: 'MEM_1',
          rid: '',
          r_number: '',
          eid: null,
          created_by: '',
          modified_by: null,
          created_datetime: '',
          modified_datetime: null,
          account_rid: accountId,
          fiscal_year: '',
          total_project: 0,
          total_qualified_project: 0,
          total_project_cost: '',
          total_qualified_project_cost: '',
          total_qre: '',
          total_rd_credits: '',
          annual_gross_receipts: '',
        },
      ];
      setFormData({
        historicalSubmissions: initialSubmissions,
      });
      setOriginalSubmissions([]);
      setIsDataLoaded(true);
    }
  }, [data, isDataLoaded, formLoading, accountId]);

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
  }, [formData.historicalSubmissions, isDataLoaded]);

  function handleAddSubmission() {
    setFormData((prev) => {
      const highestSeq = prev.historicalSubmissions.reduce(
        (max, submission) => {
          const seqNum = submission.user_id
            ? parseInt(submission.user_id.replace('MEM_', ''))
            : 0;
          return isNaN(seqNum) ? max : Math.max(max, seqNum);
        },
        0
      );

      const newSubmission: FormSubmission = {
        user_id: `MEM_${highestSeq + 1}`,
        rid: '',
        r_number: '',
        eid: null,
        created_by: '',
        modified_by: null,
        created_datetime: '',
        modified_datetime: null,
        account_rid: accountId,
        fiscal_year: '',
        total_project: 0,
        total_qualified_project: 0,
        total_project_cost: '',
        total_qualified_project_cost: '',
        total_qre: '',
        total_rd_credits: '',
        annual_gross_receipts: '',
      };

      return {
        ...prev,
        historicalSubmissions: [...prev.historicalSubmissions, newSubmission],
      };
    });
  }

  function handleRemoveSubmission(index: number) {
    setFormData((prev) => {
      const updatedSubmissions = prev.historicalSubmissions.filter(
        (_, i) => i !== index
      );
      return {
        ...prev,
        historicalSubmissions: updatedSubmissions,
      };
    });
  }

  function handleSubmissionChange(
    index: number,
    field: keyof historySummary | 'user_id',
    value: string | number
  ) {
    setFormData((prev) => {
      const updatedSubmissions = [...prev.historicalSubmissions];
      updatedSubmissions[index] = {
        ...updatedSubmissions[index],
        [field]: value,
      };
      return {
        ...prev,
        historicalSubmissions: updatedSubmissions,
      };
    });

    // Clear errors for the specific field being changed
    setErrors((prev) => {
      const newSubmissionErrors = [...(prev.historicalSubmissions || [])];
      if (!newSubmissionErrors[index]) {
        newSubmissionErrors[index] = {};
      }

      newSubmissionErrors[index] = {
        ...newSubmissionErrors[index],
        [field]: undefined,
      };

      return {
        ...prev,
        historicalSubmissions: newSubmissionErrors,
      };
    });
  }

  function validateForm(): boolean {
    const newErrors: HistoryFormErrors = {};
    const submissionErrors: HistoryErrors[] = [];
    let isValid = true;

    // Regex: 1–16 digits, optional . with up to 2 decimal places
    const amountRegex = /^\d{1,16}(\.\d{1,2})?$/;

    formData.historicalSubmissions.forEach((submission, index) => {
      const submissionError: HistoryErrors = {};

      // Fiscal Year validation
      if (!submission.fiscal_year) {
        submissionError.fiscal_year = 'Fiscal Year is required';
        isValid = false;
      }

      // Total Project Cost validation
      if (!submission.total_project_cost?.trim()) {
        submissionError.total_project_cost = 'Total Project Cost is required';
        isValid = false;
      } else if (!amountRegex.test(submission.total_project_cost)) {
        submissionError.total_project_cost =
          'Total Project Cost must be 1–16 digits and up to 2 decimals';
        isValid = false;
      }

      // Total QRE validation
      if (!submission.total_qre?.trim()) {
        submissionError.total_qre = 'Total QRE is required';
        isValid = false;
      } else if (!amountRegex.test(submission.total_qre)) {
        submissionError.total_qre =
          'Total QRE must be 1–16 digits and up to 2 decimals';
        isValid = false;
      }

      // Total RD Credits validation
      if (!submission.total_rd_credits?.trim()) {
        submissionError.total_rd_credits = 'Total RD Credits is required';
        isValid = false;
      } else if (!amountRegex.test(submission.total_rd_credits)) {
        submissionError.total_rd_credits =
          'Total RD Credits must be 1–16 digits and up to 2 decimals';
        isValid = false;
      }

      // Annual Gross Receipts (optional, but validate if provided)
      if (
        submission.annual_gross_receipts?.trim() &&
        !amountRegex.test(submission.annual_gross_receipts)
      ) {
        submissionError.annual_gross_receipts =
          'Annual Gross Receipts must be 1–16 digits and up to 2 decimals';
        isValid = false;
      }

      submissionErrors[index] = submissionError;
    });

    newErrors.historicalSubmissions = submissionErrors;
    setErrors(newErrors);
    return isValid;
  }

  function determineActionType(
    currentSubmission: FormSubmission,
    originalSubmission: historySummary | undefined
  ): 'add' | 'edit' | 'delete' {
    if (!originalSubmission) {
      return 'add';
    }

    // Check if this is a deletion (submission exists in original but not in current form)
    const existsInCurrent = formData.historicalSubmissions.some(
      (sub) => sub.rid === originalSubmission.rid
    );

    if (!existsInCurrent) {
      return 'delete';
    }

    // Check if there are any changes
    const hasChanges =
      currentSubmission.fiscal_year !==
        originalSubmission.fiscal_year?.toString() ||
      currentSubmission.total_project_cost !==
        originalSubmission.total_project_cost ||
      currentSubmission.total_qre !== originalSubmission.total_qre ||
      currentSubmission.total_rd_credits !==
        originalSubmission.total_rd_credits ||
      currentSubmission.annual_gross_receipts !==
        originalSubmission.annual_gross_receipts;

    return hasChanges ? 'edit' : 'edit'; // Default to edit if no changes but exists
  }

  function handleSave() {
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    // Prepare payload according to your API structure
    const payload: HistoricalSubmissionPayload = {
      account_rid: accountId,
      historical_submissions: [],
    };

    // Process existing submissions to determine action types
    formData.historicalSubmissions.forEach((submission) => {
      const originalSubmission = originalSubmissions.find(
        (orig) => orig.rid === submission.rid
      );

      const actionType = determineActionType(
        submission as FormSubmission,
        originalSubmission
      );

      const submissionPayload: any = {
        fiscal_year: parseInt(submission.fiscal_year.toString()) || 0,
        total_project: submission.total_project || 0,
        total_qualified_project: submission.total_qualified_project || 0,
        total_project_cost: parseFloat(submission.total_project_cost) || 0,
        total_qualified_project_cost:
          parseFloat(submission.total_qualified_project_cost || '0') || 0,
        total_qre: parseFloat(submission.total_qre) || 0,
        total_rd_credits: parseFloat(submission.total_rd_credits) || 0,
        annual_gross_receipts:
          parseFloat(submission.annual_gross_receipts || '0') || 0,
        action_type: actionType,
      };

      // Add history_submission_rid for edit and delete actions
      if (originalSubmission && actionType !== 'add') {
        submissionPayload.history_submission_rid = originalSubmission.rid;
      }

      payload.historical_submissions.push(submissionPayload);
    });

    // Handle deletions (submissions that exist in original but not in current form)
    originalSubmissions.forEach((originalSubmission) => {
      const existsInCurrent = formData.historicalSubmissions.some(
        (sub) => sub.rid === originalSubmission.rid
      );

      if (!existsInCurrent) {
        payload.historical_submissions.push({
          history_submission_rid: originalSubmission.rid,
          fiscal_year: parseInt(originalSubmission.fiscal_year.toString()),
          total_project: originalSubmission.total_project,
          total_qualified_project: originalSubmission.total_qualified_project,
          total_project_cost: parseFloat(originalSubmission.total_project_cost),
          total_qualified_project_cost: parseFloat(
            originalSubmission.total_qualified_project_cost
          ),
          total_qre: parseFloat(originalSubmission.total_qre),
          total_rd_credits: parseFloat(originalSubmission.total_rd_credits),
          annual_gross_receipts: parseFloat(
            originalSubmission.annual_gross_receipts
          ),
          action_type: 'delete',
        });
      }
    });

    // console.log('Saving historical data payload:', payload);

    // Call the mutation
    updateHistorySubmissionMutation.mutate(payload, {
      onSuccess: () => {
        setIsLoading(false);
        successToast('Historical submission saved successfully');
        refetch();
        setIsDataLoaded(false);
        refetch().then(() => {
          // After refetch completes, ensure data gets loaded
          setIsDataLoaded(true); // This will trigger the useEffect to process new data
        });
      },
      onError: (error) => {
        setIsLoading(false);
        errorToast('Failed to save historical submission');
        console.error('Error saving historical submission:', error);
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
        showAddActivity={true}
        activityMenuItems={activityMenuItems}
      />
      <SectionHeader
        title={'Historical Submission'}
        titleIcon={getTitleIcon()}
        buttons={headerButtons}
        count={formData.historicalSubmissions.length}
        showItemCount={true}
        hideSection={false}
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
                    {historicalFields.map((field) => (
                      <TableCell
                        key={field.key}
                        style={{
                          textAlign: 'left',
                          textWrap: 'nowrap',
                        }}
                      >
                        {field.label}{' '}
                        {field.required && (
                          <span className='text-red-500 text-[16px]'>*</span>
                        )}
                      </TableCell>
                    ))}
                    <TableCell style={{ width: '80px' }}>Actions</TableCell>
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
                    <TableSkeleton
                      rowsPerPage={4}
                      columnsCount={historicalFields.length + 1}
                    />
                  ) : (
                    formData.historicalSubmissions.map((submission, index) => (
                      <TableRow
                        key={submission.user_id}
                        sx={{
                          position: 'relative',
                          p: 0,
                        }}
                        className={''}
                      >
                        {/* Fiscal Year Dropdown */}
                        <TableCell
                          ref={(el: HTMLTableCellElement | null) => {
                            if (el)
                              cellRefs.current[`fiscal_year-${index}`] = el;
                          }}
                          style={{
                            position: 'relative',
                            backgroundColor: errors.historicalSubmissions?.[
                              index
                            ]?.fiscal_year
                              ? '#FEF2F2'
                              : 'transparent',
                          }}
                          sx={{ padding: 0 }}
                        >
                          <div className='p-1'>
                            <Select
                              value={submission.fiscal_year}
                              onChange={(e) =>
                                handleSubmissionChange(
                                  index,
                                  'fiscal_year',
                                  e.target.value
                                )
                              }
                              disabled={!isCaseTeamEditable}
                              size='small'
                              fullWidth
                              displayEmpty
                              className='h-[28px]'
                              sx={{
                                width: '100%',
                                '& .MuiSelect-select': {
                                  fontSize: '13px',
                                  fontWeight: 500,
                                  color: submission.fiscal_year
                                    ? '#425A76'
                                    : '#7D98B6',
                                  padding: '4px 6px',
                                },
                                '& .MuiOutlinedInput-notchedOutline': {
                                  border: 'none',
                                  borderColor: '#CBD6E2',
                                },
                                '&:hover .MuiOutlinedInput-notchedOutline': {
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
                                    width: Math.max(
                                      cellWidths[`fiscal_year-${index}`] || 0,
                                      150
                                    ),
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
                                Choose Year
                              </MenuItem>
                              {yearOptions.map((year) => (
                                <MenuItem
                                  key={year.value}
                                  value={year.value.toString()}
                                  sx={{
                                    fontSize: '13px',
                                    color: '#425A76 !important',
                                    fontWeight: 500,
                                  }}
                                >
                                  {year.label}
                                </MenuItem>
                              ))}
                            </Select>
                          </div>
                          {errors.historicalSubmissions?.[index]
                            ?.fiscal_year && (
                            <Tooltip
                              title={
                                errors.historicalSubmissions[index].fiscal_year
                              }
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

                        {/* Total Project Cost Text Field */}
                        <TableCell
                          style={{
                            position: 'relative',
                            backgroundColor: errors.historicalSubmissions?.[
                              index
                            ]?.total_project_cost
                              ? '#FEF2F2'
                              : 'transparent',
                          }}
                          sx={{ padding: 0 }}
                        >
                          <div className='p-1'>
                            <TextField
                              value={submission.total_project_cost}
                              onChange={(e) =>
                                handleSubmissionChange(
                                  index,
                                  'total_project_cost',
                                  e.target.value
                                )
                              }
                              disabled={!isCaseTeamEditable}
                              size='small'
                              fullWidth
                              placeholder='Enter total project cost'
                              sx={{
                                '& .MuiInputBase-root': {
                                  height: '28px',
                                  fontSize: '13px',
                                  '& input': {
                                    padding: '4px 6px',
                                    color: '#425A76',
                                  },
                                  '& .MuiOutlinedInput-notchedOutline': {
                                    border: 'none',
                                  },
                                  '&:hover .MuiOutlinedInput-notchedOutline': {
                                    border: 'none',
                                  },
                                  '&.Mui-focused .MuiOutlinedInput-notchedOutline':
                                    {
                                      border: 'none',
                                    },
                                },
                              }}
                            />
                          </div>
                          {errors.historicalSubmissions?.[index]
                            ?.total_project_cost && (
                            <Tooltip
                              title={
                                errors.historicalSubmissions[index]
                                  .total_project_cost
                              }
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

                        {/* Total QRE Text Field */}
                        <TableCell
                          style={{
                            position: 'relative',
                            backgroundColor: errors.historicalSubmissions?.[
                              index
                            ]?.total_qre
                              ? '#FEF2F2'
                              : 'transparent',
                          }}
                          sx={{ padding: 0 }}
                        >
                          <div className='p-1'>
                            <TextField
                              value={submission.total_qre}
                              onChange={(e) =>
                                handleSubmissionChange(
                                  index,
                                  'total_qre',
                                  e.target.value
                                )
                              }
                              disabled={!isCaseTeamEditable}
                              size='small'
                              fullWidth
                              placeholder='Enter total QRE'
                              sx={{
                                '& .MuiInputBase-root': {
                                  height: '28px',
                                  fontSize: '13px',
                                  '& input': {
                                    padding: '4px 6px',
                                    color: '#425A76',
                                  },
                                  '& .MuiOutlinedInput-notchedOutline': {
                                    border: 'none',
                                  },
                                  '&:hover .MuiOutlinedInput-notchedOutline': {
                                    border: 'none',
                                  },
                                  '&.Mui-focused .MuiOutlinedInput-notchedOutline':
                                    {
                                      border: 'none',
                                    },
                                },
                              }}
                            />
                          </div>
                          {errors.historicalSubmissions?.[index]?.total_qre && (
                            <Tooltip
                              title={
                                errors.historicalSubmissions[index].total_qre
                              }
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

                        {/* Total RD Credits Text Field */}
                        <TableCell
                          style={{
                            position: 'relative',
                            backgroundColor: errors.historicalSubmissions?.[
                              index
                            ]?.total_rd_credits
                              ? '#FEF2F2'
                              : 'transparent',
                          }}
                          sx={{ padding: 0 }}
                        >
                          <div className='p-1'>
                            <TextField
                              value={submission.total_rd_credits}
                              onChange={(e) =>
                                handleSubmissionChange(
                                  index,
                                  'total_rd_credits',
                                  e.target.value
                                )
                              }
                              disabled={!isCaseTeamEditable}
                              size='small'
                              fullWidth
                              placeholder='Enter total RD credits'
                              sx={{
                                '& .MuiInputBase-root': {
                                  height: '28px',
                                  fontSize: '13px',
                                  '& input': {
                                    padding: '4px 6px',
                                    color: '#425A76',
                                  },
                                  '& .MuiOutlinedInput-notchedOutline': {
                                    border: 'none',
                                  },
                                  '&:hover .MuiOutlinedInput-notchedOutline': {
                                    border: 'none',
                                  },
                                  '&.Mui-focused .MuiOutlinedInput-notchedOutline':
                                    {
                                      border: 'none',
                                    },
                                },
                              }}
                            />
                          </div>
                          {errors.historicalSubmissions?.[index]
                            ?.total_rd_credits && (
                            <Tooltip
                              title={
                                errors.historicalSubmissions[index]
                                  .total_rd_credits
                              }
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

                        {/* Annual Gross Receipts Text Field */}
                        <TableCell
                          style={{
                            position: 'relative',
                            backgroundColor: errors.historicalSubmissions?.[
                              index
                            ]?.annual_gross_receipts
                              ? '#FEF2F2'
                              : 'transparent',
                          }}
                          sx={{ padding: 0 }}
                        >
                          <div className='p-1'>
                            <TextField
                              value={submission.annual_gross_receipts}
                              onChange={(e) =>
                                handleSubmissionChange(
                                  index,
                                  'annual_gross_receipts',
                                  e.target.value
                                )
                              }
                              disabled={!isCaseTeamEditable}
                              size='small'
                              fullWidth
                              placeholder='Enter annual gross receipts'
                              sx={{
                                '& .MuiInputBase-root': {
                                  height: '28px',
                                  fontSize: '13px',
                                  '& input': {
                                    padding: '4px 6px',
                                    color: '#425A76',
                                  },
                                  '& .MuiOutlinedInput-notchedOutline': {
                                    border: 'none',
                                  },
                                  '&:hover .MuiOutlinedInput-notchedOutline': {
                                    border: 'none',
                                  },
                                  '&.Mui-focused .MuiOutlinedInput-notchedOutline':
                                    {
                                      border: 'none',
                                    },
                                },
                              }}
                            />
                          </div>
                          {errors.historicalSubmissions?.[index]
                            ?.annual_gross_receipts && (
                            <Tooltip
                              title={
                                errors.historicalSubmissions[index]
                                  .annual_gross_receipts
                              }
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

                        {/* Actions Column */}
                        <TableCell sx={{ padding: 0 }}>
                          <Tooltip
                            title={'Remove entry'}
                            disableHoverListener={!isCaseTeamEditable}
                            arrow
                            placement='top'
                          >
                            <button
                              type='button'
                              onClick={() => handleRemoveSubmission(index)}
                              style={{
                                cursor: !isCaseTeamEditable
                                  ? 'default'
                                  : 'pointer',
                                background: 'transparent',
                                border: 'none',
                                padding: 0,
                                marginTop: '6px',
                              }}
                              aria-label='Remove entry'
                              disabled={!isCaseTeamEditable}
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
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </div>

          <div className='mt-2 pl-4'>
            <button
              className='flex items-center cursor-pointer gap-1 bg-[#EAF0F5] h-[30px] color-[#2D3E4F] px-2 text-[12px] font-semibold disabled:bg-gray-100 disabled:opacity-75 disabled:cursor-default'
              type='button'
              onClick={handleAddSubmission}
              disabled={formLoading || !isCaseTeamEditable}
            >
              <span>
                <React.Suspense fallback={null}>
                  <KeyContactAddIcon alt='add-btn' className='w-5 h-5' />
                </React.Suspense>
              </span>
              Add New
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default HistorySubmission;
