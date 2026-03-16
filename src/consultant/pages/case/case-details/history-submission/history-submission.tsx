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
  ErrorInfoIcon,
  HistorySubmissionIcon,
  KeyContactAddIcon,
  KeyContactRemoveIcon,
} from '../../../../../assets';
import { SectionTabPanel } from '../../../../../components';
import SectionHeader from '../../../../../components/details-section/section-header';
import {
  AllModules,
  AllPermissions,
  OverviewTabs,
} from '../../../../../common-service';
import { useToast } from '../../../../../hooks';
import { useParams, useSearchParams } from 'react-router-dom';
import { TableSkeleton } from '../../../../../components/table';
import { RootState } from '../../../../../store/store';
import { useSelector } from 'react-redux';
import { ActivityMenuItem, ColorCode } from '../../../../types';
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
import { useFetchState } from '../../../../services/account';
import {
  COMMON_MENU_PROPS,
  getSelectStyles,
} from '../../../activities/activities-form/helper';
import {
  checkPermission,
  costDisplay,
  getFiscalYears,
  valueDisplay,
} from '../../../../../common-utils/common-utils';
import { AccessRestricted } from '../../../../../components/account-restricted';
import { accountDetailsProps } from '../../../account-details/utils';
import Timeline from '../../../../../pages/timeline/timeline';

const ConfigTabs: OverviewTabs[] = [
  {
    id: AllPermissions.ACCOUNT_ATTACHMENT_OVERVIEW,
    name: 'Overview',
    hide: false,
    key: 'overview',
  },
  {
    id: AllPermissions.ACCOUNT_ATTACHMENT_OVERVIEW,
    name: 'Timeline',
    hide: false,
    key: 'timeline',
  },
];

interface CaseTeamProps {
  activityMenuItems: ActivityMenuItem[];
  isDetailLoading?: boolean;
  accountDetails?: accountDetailsProps;
}

interface FormSubmission extends Omit<historySummary, 'fiscal_year'> {
  user_id: string; // Temporary ID for form management
  fiscal_year: string; // Keep as string for form handling, convert to number for API
}

const removeCommas = (value: string): string => {
  // Remove currency symbol and spaces first, then commas
  return value.replace(/[^0-9.,]/g, '').replace(/,/g, '');
};

const HistorySubmission: React.FC<CaseTeamProps> = ({
  activityMenuItems,
  isDetailLoading,
  accountDetails,
}) => {
  const { accountid } = useParams();
  const [searchParams] = useSearchParams();
  const { successToast, errorToast } = useToast();
  const accountId = searchParams.get('accountID') || accountid || '';
  const isTimeLineView = searchParams.get('timelineview') === 'true';
  const [formData, setFormData] = useState<HistoryFormData>({
    historicalSubmissions: [],
    region: '', // Region selection - empty initially for country-based data
  });
  const [errors, setErrors] = useState<HistoryFormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [originalSubmissions, setOriginalSubmissions] = useState<
    historySummary[]
  >([]);
  const [isFormChanged, setIsFormChanged] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState<string>(''); // Track selected region
  const cellRefs = useRef<Record<string, HTMLTableCellElement | null>>({});
  const [cellWidths, setCellWidths] = useState<Record<string, number>>({});

  const { permission, modules } = useSelector(
    (state: RootState) => state.permission
  );

  const accountCountryDetails = {
    country_name: accountDetails?.accountById?.country?.country_name || '',
    country_code: accountDetails?.accountById?.country?.country_code || '',
    country_id: accountDetails?.accountById?.country_rid || '',
  };

  const regionsOptions = useFetchState(
    accountDetails?.accountById?.country_rid ||
      accountCountryDetails?.country_id ||
      '',
    'active'
  );

  const regionListOptions = useMemo(
    () =>
      regionsOptions.data?.data?.states.map((region) => ({
        label: region?.state_name,
        value: region.rid,
      })) || [],
    [regionsOptions.data?.data?.states]
  );

  // Permission
  const accountViewEditFields = useMemo(
    () =>
      permission.find((item) => item.name === AllPermissions.ACCOUNTS_VIEW_EDIT)
        ?.fields ?? [],
    [permission]
  );
  const accountPermissionMap = useMemo(() => {
    const map: Record<string, { read: boolean; edit: boolean }> = {};
    accountViewEditFields.forEach((item) => {
      map[item.name] = { read: item.read ?? false, edit: item.edit ?? false };
    });
    return map;
  }, [accountViewEditFields]);

  const casesTeamEditFields = useMemo(
    () =>
      permission?.find(
        (item) => item.name === AllPermissions.HISTORICAL_SUBMISSION_VIEW_EDIT
      )?.fields ?? [],
    [permission]
  );

  const permissionMap = useMemo(() => {
    const map: Record<string, { read: boolean; edit: boolean }> = {};
    casesTeamEditFields.forEach((item) => {
      map[item.name] = { read: item.read ?? false, edit: item.edit ?? false };
    });
    return map;
  }, [casesTeamEditFields]);

  const isHistoricalSubmissionCreate = checkPermission(
    permission,
    AllPermissions.HISTORICAL_SUBMISSION_CREATE
  );
  const isHistoricalSubmissionDelete = checkPermission(
    permission,
    AllPermissions.HISTORICAL_SUBMISSION_DELETE
  );

  const isHistoricalSubmissionEnable = checkPermission(
    modules,
    AllModules.HISTORICAL_SUBMISSION
  );

  const isHistoricalSubmissionViewEnable = checkPermission(
    permission,
    AllPermissions.HISTORICAL_SUBMISSION_VIEW_EDIT
  );

  // Check if form is changed
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
        a.annual_gross_receipts !== b.annual_gross_receipts ||
        a.total_nonlabor_cost !== b.total_nonlabor_cost ||
        a.total_subcon_cost !== b.total_subcon_cost ||
        a.total_fte_cost !== b.total_fte_cost
      ) {
        setIsFormChanged(true);
        return;
      }
    }
    setIsFormChanged(false);
  }, [formData, originalSubmissions]);

  // Fetch historical data based on account ID and selected region
  const {
    data,
    isLoading: isDataLoading,
    refetch,
  } = useGetHistoricalSubmission(
    accountId,
    accountDetails?.accountById?.country_rid || '',
    selectedRegion
  );

  const updateHistorySubmissionMutation = useUpdateHistorySubmission();
  const formLoading = isDataLoading || isDetailLoading;
  const minYear = 1950;
  const currentYear = new Date().getFullYear();
  const yearOptions = getFiscalYears(currentYear - minYear + 1);

  // Handle region selection change
  const handleRegionChange = (value: string) => {
    setSelectedRegion(value);
    setFormData((prev) => ({
      ...prev,
      region: value,
    }));

    // Clear region error when user selects a region
    setErrors((prev) => ({
      ...prev,
      region: '',
    }));

    // Reset form data when region changes
    setFormData((prev) => ({
      ...prev,
      historicalSubmissions: [],
    }));
    setOriginalSubmissions([]);
    setIsDataLoaded(false);
  };

  // Updated historicalFields array with permission keys
  const historicalFields = [
    {
      key: 'fiscal_year',
      label: 'Fiscal Year',
      type: 'dropdown',
      required: true,
      width: '140px',
      sticky: true,
      sx: {
        position: 'sticky' as const,
        left: 0,
        background: '#fff',
        borderRight: '1px solid #CBD6E2',
        borderBottom: '1px solid #CBD6E2 !important',
        zIndex: 10,
      },
      permissionKey: 'fiscal_year',
    },
    {
      key: 'total_project_cost',
      label: 'Total Project Cost',
      type: 'text',
      required: true,
      width: '180px',
      permissionKey: 'total_project_cost',
    },
    {
      key: 'total_fte_cost',
      label: 'Total FTE QRE Cost',
      type: 'text',
      required: true,
      width: '200px',
      permissionKey: 'total_fte_cost',
    },
    {
      key: 'total_subcon_cost',
      label: 'Total Subcon QRE Cost',
      type: 'text',
      required: true,
      width: '200px',
      permissionKey: 'total_subcon_cost',
    },
    {
      key: 'total_nonlabor_cost',
      label: 'Total Non-Labor QRE Cost',
      type: 'text',
      required: true,
      width: '220px',
      permissionKey: 'total_nonlabor_cost',
    },
    {
      key: 'total_qre',
      label: 'Total QRE',
      type: 'text',
      required: true,
      width: '180px',
      permissionKey: 'total_qre',
    },
    {
      key: 'total_rd_credits',
      label: 'Total RD Credits',
      type: 'text',
      required: true,
      width: '180px',
      permissionKey: 'total_rd_credits',
    },
    {
      key: 'annual_gross_receipts',
      label: 'Annual Gross Receipts',
      type: 'text',
      required: false,
      width: '200px',
      permissionKey: 'annual_gross_receipts',
      showTooltip: true,
      tooltipMessage:
        'Annual Gross Receipt is the total money received in a year.',
    },
  ];

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
          // Map the new fields from API response
          total_nonlabor_cost: item.total_nonlabor_cost || '',
          total_subcon_cost: item.total_subcon_cost || '',
          total_fte_cost: item.total_fte_cost || '',
          // Map other fields that might have different names in API
          total_project: item.total_project || 0,
          total_qualified_project: item.total_qualified_project || 0,
          total_project_cost: item.total_project_cost || '',
          total_qualified_project_cost: item.total_qualified_project_cost || '',
          total_qre: item.total_qre || '',
          total_rd_credits: item.total_rd_credits || '',
          annual_gross_receipts: item.annual_gross_receipts || '',
          currency_symbol: item.currency_symbol || '',
        }));

        const regionFromData = selectedRegion;

        setFormData({
          historicalSubmissions: mappedSubmissions.map((m) => ({
            ...m,
            fiscal_year: Number(m.fiscal_year),
          })),
          region: regionFromData, // Set the selected region
        });

        // Also update selectedRegion if not already set
        if (regionFromData && !selectedRegion) {
          setSelectedRegion(regionFromData);
        }

        setOriginalSubmissions(apiData);
      } else if (apiData.length === 0) {
        // Only initialize with empty row if country_rid is available
        if (accountDetails?.accountById?.country_rid) {
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
              total_nonlabor_cost: '', // Initialize new fields
              total_subcon_cost: '',
              total_fte_cost: '',
              // Add fields from API response
              country_rid: null,
              state_rid: null,
              currency_rid: '',
              currency_symbol: '',
            },
          ];
          setFormData({
            historicalSubmissions: initialSubmissions,
            region: selectedRegion, // Set the selected region
          });
        } else {
          // If country_rid is not available, set empty array to show "No data available"
          setFormData({
            historicalSubmissions: [],
            region: selectedRegion,
          });
        }
        setOriginalSubmissions([]);
      }
      setIsDataLoaded(true);
    } else if (!data && !formLoading && !isDataLoaded && accountId) {
      // Only initialize with empty row if country_rid is available
      if (accountDetails?.accountById?.country_rid) {
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
            total_nonlabor_cost: '', // Initialize new fields
            total_subcon_cost: '',
            total_fte_cost: '',
            // Add fields from API response
            country_rid: null,
            state_rid: null,
            currency_rid: '',
            currency_symbol: '',
          },
        ];
        setFormData({
          historicalSubmissions: initialSubmissions,
          region: selectedRegion, // Set the selected region
        });
      } else {
        // If country_rid is not available, set empty array to show "No data available"
        setFormData({
          historicalSubmissions: [],
          region: selectedRegion,
        });
      }
      setOriginalSubmissions([]);
      setIsDataLoaded(true);
    }
  }, [
    data,
    isDataLoaded,
    formLoading,
    accountId,
    selectedRegion,
    accountDetails?.accountById?.country_rid,
  ]);

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
        total_nonlabor_cost: '', // Initialize new fields
        total_subcon_cost: '',
        total_fte_cost: '',
        // Add fields from API response
        country_rid: null,
        state_rid: selectedRegion || null,
        currency_rid: '',
        currency_symbol: '',
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

    // Clear errors for the removed row
    setErrors((prev) => {
      const newSubmissionErrors = [...(prev.historicalSubmissions || [])];
      newSubmissionErrors.splice(index, 1);

      return {
        ...prev,
        historicalSubmissions: newSubmissionErrors,
      };
    });
  }

  function handleSubmissionChange(
    index: number,
    field:
      | keyof historySummary
      | 'user_id'
      | 'total_nonlabor_cost'
      | 'total_subcon_cost'
      | 'total_fte_cost',
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

    // Validate region is NOT required (can be empty for country-based data)
    // Region is optional - can be empty for country-based submissions

    // Regex: 1–16 digits, optional . with up to 2 decimal places
    const amountRegex = /^\d{1,16}(\.\d{1,2})?$/;

    // Check for duplicate fiscal years in new records
    const newRecords = formData.historicalSubmissions.filter((s) => !s.rid);
    const allFiscalYears = formData.historicalSubmissions
      .map((s) => s.fiscal_year?.toString())
      .filter((year) => year && year !== '');

    // Collect duplicate years from new records
    const duplicateYearsSet = new Set<string>();
    newRecords.forEach((newRecord) => {
      const year = newRecord.fiscal_year?.toString();
      if (year && year !== '') {
        // Count how many times this year appears in all records
        const yearCount = allFiscalYears.filter((y) => y === year).length;
        if (yearCount > 1) {
          duplicateYearsSet.add(year);
        }
      }
    });

    if (duplicateYearsSet.size > 0) {
      const uniqueDuplicates = Array.from(duplicateYearsSet).sort();
      // Show all duplicate years in a single error message
      if (uniqueDuplicates.length === 1) {
        errorToast(
          `Fiscal year FY-${uniqueDuplicates[0]} already exists. Please select a different year.`
        );
      } else {
        const yearsList = uniqueDuplicates.map((y) => `FY-${y}`).join(', ');
        errorToast(
          `Fiscal years ${yearsList} already exist. Please select different years.`
        );
      }
      isValid = false;
    }

    formData.historicalSubmissions.forEach((submission, index) => {
      const submissionError: HistoryErrors = {};
      const isNewRecord = !submission.rid;

      // Fiscal Year validation
      if (!submission.fiscal_year) {
        submissionError.fiscal_year = 'Fiscal Year is required';
        isValid = false;
      } else if (isNewRecord) {
        // Only check for duplicates in new records against all records
        const yearCount = formData.historicalSubmissions.filter(
          (s) =>
            s.fiscal_year?.toString() === submission.fiscal_year?.toString()
        ).length;
        if (yearCount > 1) {
          submissionError.fiscal_year = 'Duplicate fiscal year';
          isValid = false;
        }
      }

      // Total FTE Cost validation
      if (!submission.total_fte_cost?.trim()) {
        submissionError.total_fte_cost = 'Total FTE QRE Cost is required';
        isValid = false;
      } else if (
        !amountRegex.test(removeCommas(submission.total_fte_cost || ''))
      ) {
        submissionError.total_fte_cost =
          'Total FTE QRE Cost must be 1–16 digits and up to 2 decimals';
        isValid = false;
      }

      // Total Subcon Cost validation
      if (!submission.total_subcon_cost?.trim()) {
        submissionError.total_subcon_cost = 'Total Subcon QRE Cost is required';
        isValid = false;
      } else if (
        !amountRegex.test(removeCommas(submission.total_subcon_cost || ''))
      ) {
        submissionError.total_subcon_cost =
          'Total Subcon QRE Cost must be 1–16 digits and up to 2 decimals';
        isValid = false;
      }

      // Total Non-Labor Cost validation
      if (!submission.total_nonlabor_cost?.trim()) {
        submissionError.total_nonlabor_cost =
          'Total Non-Labor QRE Cost is required';
        isValid = false;
      } else if (
        !amountRegex.test(removeCommas(submission.total_nonlabor_cost || ''))
      ) {
        submissionError.total_nonlabor_cost =
          'Total Non-Labor QRE Cost must be 1–16 digits and up to 2 decimals';
        isValid = false;
      }

      // Total Project Cost validation
      if (!submission.total_project_cost?.trim()) {
        submissionError.total_project_cost = 'Total Project Cost is required';
        isValid = false;
      } else if (
        !amountRegex.test(removeCommas(submission.total_project_cost))
      ) {
        submissionError.total_project_cost =
          'Total Project Cost must be 1–16 digits and up to 2 decimals';
        isValid = false;
      }

      // Total QRE validation
      if (!submission.total_qre?.trim()) {
        submissionError.total_qre = 'Total QRE is required';
        isValid = false;
      } else if (!amountRegex.test(removeCommas(submission.total_qre))) {
        submissionError.total_qre =
          'Total QRE must be 1–16 digits and up to 2 decimals';
        isValid = false;
      }

      // Total RD Credits validation
      if (!submission.total_rd_credits?.trim()) {
        submissionError.total_rd_credits = 'Total RD Credits is required';
        isValid = false;
      } else if (!amountRegex.test(removeCommas(submission.total_rd_credits))) {
        submissionError.total_rd_credits =
          'Total RD Credits must be 1–16 digits and up to 2 decimals';
        isValid = false;
      }

      // Annual Gross Receipts (optional, but validate if provided)
      if (
        submission.annual_gross_receipts?.trim() &&
        !amountRegex.test(removeCommas(submission.annual_gross_receipts))
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
      currentSubmission.total_fte_cost !== originalSubmission.total_fte_cost ||
      currentSubmission.total_subcon_cost !==
        originalSubmission.total_subcon_cost ||
      currentSubmission.total_nonlabor_cost !==
        originalSubmission.total_nonlabor_cost ||
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
        total_project_cost:
          parseFloat(removeCommas(submission.total_project_cost)) || 0,
        total_qualified_project_cost:
          parseFloat(
            removeCommas(submission.total_qualified_project_cost || '0')
          ) || 0,
        total_nonlabor_cost:
          parseFloat(removeCommas(submission.total_nonlabor_cost || '0')) || 0,
        total_subcon_cost:
          parseFloat(removeCommas(submission.total_subcon_cost || '0')) || 0,
        total_fte_cost:
          parseFloat(removeCommas(submission.total_fte_cost || '0')) || 0,
        total_qre: parseFloat(removeCommas(submission.total_qre)) || 0,
        total_rd_credits:
          parseFloat(removeCommas(submission.total_rd_credits)) || 0,
        annual_gross_receipts:
          parseFloat(removeCommas(submission.annual_gross_receipts || '0')) ||
          0,
        action_type: actionType,
        country_rid: accountCountryDetails.country_id, // Always include country_rid
        state_rid: selectedRegion || '', // Include region_rid if selected, otherwise empty
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
          total_nonlabor_cost: parseFloat(
            originalSubmission.total_nonlabor_cost || '0'
          ),
          total_subcon_cost: parseFloat(
            originalSubmission.total_subcon_cost || '0'
          ),
          total_fte_cost: parseFloat(originalSubmission.total_fte_cost || '0'),
          total_qre: parseFloat(originalSubmission.total_qre),
          total_rd_credits: parseFloat(originalSubmission.total_rd_credits),
          annual_gross_receipts: parseFloat(
            originalSubmission.annual_gross_receipts
          ),
          country_rid: accountCountryDetails.country_id,
          state_rid: selectedRegion || '',
          action_type: 'delete',
        });
      }
    });

    // Call the mutation
    updateHistorySubmissionMutation.mutate(payload, {
      onSuccess: (response) => {
        setIsLoading(false);

        // Check if there are any errors in the data array
        const hasErrors =
          response.data &&
          response.data.length > 0 &&
          response.data.some((item) => item.error);

        if (hasErrors) {
          // Extract error messages from the data array
          const errorMessages = response.data
            .filter((item) => item.error)
            .map((item) => `Fiscal Year ${item.fiscal_year}: ${item.error}`)
            .join('\n');

          errorToast(`Failed to save historical submission:\n${errorMessages}`);

          // Still refetch data even if there were partial errors
          setIsDataLoaded(false);
          refetch().then(() => {
            setIsDataLoaded(true);
          });
        } else {
          // No errors in the data array - complete success
          successToast('Historical submission saved successfully');
          setIsDataLoaded(false);
          refetch().then(() => {
            setIsDataLoaded(true);
          });
        }
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
      hide: !isHistoricalSubmissionCreate,
      disabled:
        !isFormChanged ||
        isLoading ||
        !accountDetails?.accountById?.country_rid,
      loading: isLoading,
    },
  ];

  const getTitleIcon = () => {
    return (
      <HistorySubmissionIcon
        alt='action-items-icon'
        className={`[&>path]:stroke-[${ColorCode.accountTextColor}] w-[14px] h-[14px]`}
      />
    );
  };

  // Add this function to check if a field should be visible
  const shouldShowField = (fieldName: string): boolean => {
    if (permissionMap && permissionMap[fieldName]) {
      const fieldPermission = permissionMap[fieldName];
      return fieldPermission.read || fieldPermission.edit;
    }
    return true;
  };

  const isFieldEditable = (
    _fieldName: string,
    isNewRow: boolean = false
  ): boolean => {
    // If it's a newly created row, always return true (editable)
    if (isNewRow) {
      return true;
    }

    // For existing rows, check permission
    // if (permissionMap && permissionMap[fieldName]) {
    //   return permissionMap[fieldName].edit;
    // }

    // If existing rows, default to non editable
    return false;
  };

  // Filtered fields based on permissions
  const visibleHistoricalFields = useMemo(() => {
    return historicalFields.filter((field) =>
      shouldShowField(field.permissionKey)
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [historicalFields, permissionMap]);

  if (!isHistoricalSubmissionViewEnable || !isHistoricalSubmissionEnable)
    return <AccessRestricted />;

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
      {isTimeLineView ? (
        <div className='border border-[#CBD6E2] rounded-[2px] overflow-auto'>
          <Timeline entitytype='account' />
        </div>
      ) : (
        <div>
          <SectionHeader
            title={'Historical Submission'}
            titleIcon={getTitleIcon()}
            buttons={headerButtons}
            count={formData.historicalSubmissions.length}
            showItemCount={true}
            hideSection={false}
            iconBg={ColorCode.accountBgColor}
            bgType='circle'
          />

          <div className='flex flex-col gap-0 border border-[#CBD6E2]'>
            <div className='w-full mb-5'>
              <div className='capitalize h-[30px] border-b border-[#CBD6E2] font-bold text-[14px] text-[#2D3E4F] leading-[21px] tracking-[0%] align-middle py-1 bg-[#ECECEC] px-3.5'>
                Jurisdiction Information
              </div>
              <div className='grid md:grid-cols-2 gap-x-4 gap-y-3 px-4 py-3'>
                <div
                  style={{
                    display:
                      !accountPermissionMap?.['country_rid']?.read &&
                      !accountPermissionMap?.['country_rid']?.edit
                        ? 'none'
                        : 'block',
                  }}
                >
                  <label
                    className={`text-[13px] text-[#2D3E4F] font-semibold leading-[21px] tracking-[0] md:text-left mt-1`}
                    htmlFor='country_name'
                  >
                    Country <span className='text-red-500'> *</span>
                  </label>
                  <input
                    type='text'
                    name='country_name'
                    placeholder='-'
                    autoComplete='off'
                    className={`placeholder-custom-color disabled:bg-gray-100 placeholder-[#7D98B6] outline-none focus:border-2 focus:border-blue-400 w-full sm:text-sm px-3 h-[32px] border border-[#CBD6E2] rounded-xs ${errors?.country && 'border-red-500 disabled:!bg-[#FEF2F2] bg-[#FEF2F2]'}`}
                    disabled={true}
                    value={accountCountryDetails.country_name}
                  />
                  {errors?.country && (
                    <span className='text-[12px] text-red-400 col-span-full'>
                      {errors.country}
                    </span>
                  )}
                </div>

                <div
                  style={{
                    display:
                      !accountPermissionMap?.['region_rid']?.read &&
                      !accountPermissionMap?.['region_rid']?.edit
                        ? 'none'
                        : 'block',
                  }}
                >
                  <label
                    className={`text-[13px] text-[#2D3E4F] font-semibold leading-[21px] tracking-[0] md:text-left mt-1`}
                    htmlFor='region'
                  >
                    Region
                    {/* Region is optional, so no required asterisk */}
                  </label>

                  <Select
                    name='region'
                    value={selectedRegion}
                    onChange={(e) => handleRegionChange(e.target.value)}
                    displayEmpty
                    fullWidth
                    size='small'
                    className={`custom-select-no-arrow sm:text-sm ${
                      selectedRegion === '' ? 'text-[#7D98B6]' : 'text-black'
                    } ${errors?.region ? 'border-red-500 bg-[#FEF2F2]' : ''}`}
                    MenuProps={COMMON_MENU_PROPS}
                    sx={getSelectStyles(
                      !!errors?.region,
                      selectedRegion === ''
                    )}
                    disabled={
                      accountPermissionMap?.['region_rid']?.read &&
                      !accountPermissionMap?.['region_rid']?.edit
                    }
                  >
                    <MenuItem
                      value=''
                      sx={{
                        color: '#7D98B6',
                        fontSize: '13px',
                        fontWeight: 500,
                      }}
                    >
                      Choose Region
                    </MenuItem>
                    {regionListOptions?.map((option, i) => (
                      <MenuItem
                        key={`${option.value}-${i}`}
                        value={option.value}
                        title={option.label}
                        sx={{
                          color: '#425A76',
                          fontSize: '13px',
                          fontWeight: 500,
                        }}
                      >
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>

                  {errors?.region && (
                    <span className='text-[12px] text-red-400 col-span-full'>
                      {errors.region}
                    </span>
                  )}
                </div>
              </div>

              <div className='capitalize mb-4 h-[30px] border-b border-[#CBD6E2] font-bold text-[14px] text-[#2D3E4F] leading-[21px] tracking-[0%] align-middle py-1 bg-[#ECECEC] px-3.5'>
                Historical Information
                {selectedRegion ? ' (For Region)' : ' (For Federal)'}
              </div>
              <div className='px-3.5'>
                <TableContainer
                  sx={{
                    overflowX: 'auto',
                    maxHeight: 'calc(100vh - 400px)',
                    position: 'relative',
                    border: '1px solid #CBD6E2 !important',
                    '& .MuiTableRow-root > .MuiTableCell-root:last-of-type': {
                      borderRight: 'none',
                    },
                  }}
                >
                  <Table stickyHeader>
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
                        {visibleHistoricalFields.map((field) => (
                          <TableCell
                            key={field.key}
                            style={{
                              width: field.width,
                              minWidth: field.width,
                              maxWidth: field.width,
                              textAlign: 'left',
                              textWrap: 'nowrap',
                              ...(field.sx || {}),
                              ...(field.showTooltip
                                ? {
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 3,
                                  }
                                : {}),
                            }}
                          >
                            {field.label}{' '}
                            {field.required && (
                              <span className='text-red-500 text-[16px]'>
                                *
                              </span>
                            )}
                            {field.showTooltip && (
                              <Tooltip
                                title={field.tooltipMessage || ''}
                                arrow
                                placement='top'
                                slotProps={{
                                  tooltip: {
                                    sx: {
                                      mr: 1,
                                    },
                                  },
                                }}
                              >
                                <span className='w-5 mt-1 inline-flex items-center justify-center cursor-pointer'>
                                  <React.Suspense fallback={null}>
                                    <ErrorInfoIcon className='w-5 h-3.5 [&>path]:fill-[#9fa0a1]' />
                                  </React.Suspense>
                                </span>
                              </Tooltip>
                            )}
                          </TableCell>
                        ))}
                        <TableCell style={{ width: '140px' }}>
                          Actions
                        </TableCell>
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
                          '& radio': {
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          },
                        },
                      }}
                    >
                      {formLoading ? (
                        <TableSkeleton
                          rowsPerPage={4}
                          columnsCount={visibleHistoricalFields.length + 1}
                        />
                      ) : formData.historicalSubmissions.length > 0 ? (
                        formData.historicalSubmissions.map(
                          (submission, rowIndex) => {
                            const isNewRow = !submission.rid;
                            return (
                              <TableRow
                                key={submission.user_id}
                                sx={{
                                  position: 'relative',
                                  p: 0,
                                }}
                              >
                                {/* Fiscal Year Dropdown - Sticky First Column */}
                                {shouldShowField('fiscal_year') && (
                                  <TableCell
                                    ref={(el: HTMLTableCellElement | null) => {
                                      if (el)
                                        cellRefs.current[
                                          `fiscal_year-${rowIndex}`
                                        ] = el;
                                    }}
                                    style={{
                                      position: 'relative',
                                    }}
                                    sx={{
                                      padding: '0px !important',
                                      position: 'sticky !important',
                                      left: 0,
                                      backgroundColor: errors
                                        .historicalSubmissions?.[rowIndex]
                                        ?.fiscal_year
                                        ? '#FEF2F2 !important'
                                        : '#fff !important',
                                      borderRight: '1px solid #CBD6E2',
                                      borderBottom:
                                        '1px solid #CBD6E2 !important',
                                      zIndex: 6,
                                    }}
                                  >
                                    <div>
                                      <Select
                                        value={submission.fiscal_year}
                                        onChange={(e) =>
                                          handleSubmissionChange(
                                            rowIndex,
                                            'fiscal_year',
                                            e.target.value
                                          )
                                        }
                                        disabled={
                                          !isFieldEditable(
                                            'fiscal_year',
                                            isNewRow
                                          )
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
                                            color: submission.fiscal_year
                                              ? '#425A76'
                                              : '#7D98B6',
                                            padding: '4px 8px',
                                          },
                                          '& .MuiOutlinedInput-notchedOutline':
                                            {
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
                                          '&.Mui-disabled .MuiSelect-select': {
                                            backgroundColor: '#F3F4F6', // Tailwind bg-gray-100
                                          },
                                        }}
                                        MenuProps={{
                                          PaperProps: {
                                            sx: {
                                              marginTop: '4px',
                                              maxHeight: '250px',
                                              borderRadius: '0px',
                                              width: Math.max(
                                                cellWidths[
                                                  `fiscal_year-${rowIndex}`
                                                ] || 0,
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
                                          Choose Fiscal Year
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
                                    {errors.historicalSubmissions?.[rowIndex]
                                      ?.fiscal_year && (
                                      <Tooltip
                                        title={
                                          errors.historicalSubmissions[rowIndex]
                                            .fiscal_year
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
                                )}

                                {/* Total Project Cost Text Field */}
                                {shouldShowField('total_project_cost') && (
                                  <TableCell
                                    style={{
                                      position: 'relative',
                                      backgroundColor: errors
                                        .historicalSubmissions?.[rowIndex]
                                        ?.total_project_cost
                                        ? '#FEF2F2'
                                        : 'transparent',
                                    }}
                                    sx={{ padding: '0px !important' }}
                                  >
                                    <div>
                                      <TextField
                                        value={
                                          submission.total_project_cost
                                            ? costDisplay(
                                                submission.total_project_cost ||
                                                  '',
                                                submission.currency_symbol
                                              )
                                            : ''
                                        }
                                        onChange={(e) => {
                                          const rawValue = removeCommas(
                                            e.target.value
                                          );
                                          handleSubmissionChange(
                                            rowIndex,
                                            'total_project_cost',
                                            rawValue
                                          );
                                        }}
                                        disabled={
                                          !isFieldEditable(
                                            'total_project_cost',
                                            isNewRow
                                          )
                                        }
                                        size='small'
                                        fullWidth
                                        placeholder='Enter Total Project Cost'
                                        sx={{
                                          '& .MuiInputBase-root': {
                                            height: '28px',
                                            fontSize: '13px',
                                            '& input': {
                                              padding: '4px 8px',
                                              color: '#425A76',
                                            },
                                            '& .MuiOutlinedInput-notchedOutline':
                                              {
                                                border: 'none',
                                              },
                                            '&:hover .MuiOutlinedInput-notchedOutline':
                                              {
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
                                    {errors.historicalSubmissions?.[rowIndex]
                                      ?.total_project_cost && (
                                      <Tooltip
                                        title={
                                          errors.historicalSubmissions[rowIndex]
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
                                )}

                                {/* Total FTE Cost Text Field */}
                                {shouldShowField('total_fte_cost') && (
                                  <TableCell
                                    style={{
                                      position: 'relative',
                                      backgroundColor: errors
                                        .historicalSubmissions?.[rowIndex]
                                        ?.total_fte_cost
                                        ? '#FEF2F2'
                                        : 'transparent',
                                    }}
                                    sx={{ padding: '0px !important' }}
                                  >
                                    <div>
                                      <TextField
                                        value={
                                          submission.total_fte_cost
                                            ? costDisplay(
                                                submission.total_fte_cost || '',
                                                submission.currency_symbol
                                              )
                                            : ''
                                        }
                                        onChange={(e) => {
                                          const rawValue = removeCommas(
                                            e.target.value
                                          );
                                          handleSubmissionChange(
                                            rowIndex,
                                            'total_fte_cost',
                                            rawValue
                                          );
                                        }}
                                        disabled={
                                          !isFieldEditable(
                                            'total_fte_cost',
                                            isNewRow
                                          )
                                        }
                                        size='small'
                                        fullWidth
                                        placeholder='Enter Total FTE QRE Cost'
                                        sx={{
                                          '& .MuiInputBase-root': {
                                            height: '28px',
                                            fontSize: '13px',
                                            '& input': {
                                              padding: '4px 8px',
                                              color: '#425A76',
                                            },
                                            '& .MuiOutlinedInput-notchedOutline':
                                              {
                                                border: 'none',
                                              },
                                            '&:hover .MuiOutlinedInput-notchedOutline':
                                              {
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
                                    {errors.historicalSubmissions?.[rowIndex]
                                      ?.total_fte_cost && (
                                      <Tooltip
                                        title={
                                          errors.historicalSubmissions[rowIndex]
                                            .total_fte_cost
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
                                )}

                                {/* Total Subcon Cost Text Field */}
                                {shouldShowField('total_subcon_cost') && (
                                  <TableCell
                                    style={{
                                      position: 'relative',
                                      backgroundColor: errors
                                        .historicalSubmissions?.[rowIndex]
                                        ?.total_subcon_cost
                                        ? '#FEF2F2'
                                        : 'transparent',
                                    }}
                                    sx={{ padding: '0px !important' }}
                                  >
                                    <div>
                                      <TextField
                                        value={
                                          submission.total_subcon_cost
                                            ? costDisplay(
                                                submission.total_subcon_cost ||
                                                  '',
                                                submission.currency_symbol
                                              )
                                            : ''
                                        }
                                        onChange={(e) => {
                                          const rawValue = removeCommas(
                                            e.target.value
                                          );
                                          handleSubmissionChange(
                                            rowIndex,
                                            'total_subcon_cost',
                                            rawValue
                                          );
                                        }}
                                        disabled={
                                          !isFieldEditable(
                                            'total_subcon_cost',
                                            isNewRow
                                          )
                                        }
                                        size='small'
                                        fullWidth
                                        placeholder='Enter Total Subcon QRE Cost'
                                        sx={{
                                          '& .MuiInputBase-root': {
                                            height: '28px',
                                            fontSize: '13px',
                                            '& input': {
                                              padding: '4px 8px',
                                              color: '#425A76',
                                            },
                                            '& .MuiOutlinedInput-notchedOutline':
                                              {
                                                border: 'none',
                                              },
                                            '&:hover .MuiOutlinedInput-notchedOutline':
                                              {
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
                                    {errors.historicalSubmissions?.[rowIndex]
                                      ?.total_subcon_cost && (
                                      <Tooltip
                                        title={
                                          errors.historicalSubmissions[rowIndex]
                                            .total_subcon_cost
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
                                )}

                                {/* Total Non-Labor Cost Text Field */}
                                {shouldShowField('total_nonlabor_cost') && (
                                  <TableCell
                                    style={{
                                      position: 'relative',
                                      backgroundColor: errors
                                        .historicalSubmissions?.[rowIndex]
                                        ?.total_nonlabor_cost
                                        ? '#FEF2F2'
                                        : 'transparent',
                                    }}
                                    sx={{ padding: '0px !important' }}
                                  >
                                    <div>
                                      <TextField
                                        value={
                                          submission.total_nonlabor_cost
                                            ? costDisplay(
                                                submission.total_nonlabor_cost ||
                                                  '',
                                                submission.currency_symbol
                                              )
                                            : ''
                                        }
                                        onChange={(e) => {
                                          const rawValue = removeCommas(
                                            e.target.value
                                          );
                                          handleSubmissionChange(
                                            rowIndex,
                                            'total_nonlabor_cost',
                                            rawValue
                                          );
                                        }}
                                        disabled={
                                          !isFieldEditable(
                                            'total_nonlabor_cost',
                                            isNewRow
                                          )
                                        }
                                        size='small'
                                        fullWidth
                                        placeholder='Enter Total Non-Labor QRE Cost'
                                        sx={{
                                          '& .MuiInputBase-root': {
                                            height: '28px',
                                            fontSize: '13px',
                                            '& input': {
                                              padding: '4px 8px',
                                              color: '#425A76',
                                            },
                                            '& .MuiOutlinedInput-notchedOutline':
                                              {
                                                border: 'none',
                                              },
                                            '&:hover .MuiOutlinedInput-notchedOutline':
                                              {
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
                                    {errors.historicalSubmissions?.[rowIndex]
                                      ?.total_nonlabor_cost && (
                                      <Tooltip
                                        title={
                                          errors.historicalSubmissions[rowIndex]
                                            .total_nonlabor_cost
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
                                )}

                                {/* Total QRE Text Field */}
                                {shouldShowField('total_qre') && (
                                  <TableCell
                                    style={{
                                      position: 'relative',
                                      backgroundColor: errors
                                        .historicalSubmissions?.[rowIndex]
                                        ?.total_qre
                                        ? '#FEF2F2'
                                        : 'transparent',
                                    }}
                                    sx={{ padding: '0px !important' }}
                                  >
                                    <div>
                                      <TextField
                                        value={
                                          submission.total_qre
                                            ? costDisplay(
                                                submission.total_qre || '',
                                                submission.currency_symbol
                                              )
                                            : ''
                                        }
                                        onChange={(e) => {
                                          const rawValue = removeCommas(
                                            e.target.value
                                          );
                                          handleSubmissionChange(
                                            rowIndex,
                                            'total_qre',
                                            rawValue
                                          );
                                        }}
                                        disabled={
                                          !isFieldEditable(
                                            'total_qre',
                                            isNewRow
                                          )
                                        }
                                        size='small'
                                        fullWidth
                                        placeholder='Enter Total QRE'
                                        sx={{
                                          '& .MuiInputBase-root': {
                                            height: '28px',
                                            fontSize: '13px',
                                            '& input': {
                                              padding: '4px 8px',
                                              color: '#425A76',
                                            },
                                            '& .MuiOutlinedInput-notchedOutline':
                                              {
                                                border: 'none',
                                              },
                                            '&:hover .MuiOutlinedInput-notchedOutline':
                                              {
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
                                    {errors.historicalSubmissions?.[rowIndex]
                                      ?.total_qre && (
                                      <Tooltip
                                        title={
                                          errors.historicalSubmissions[rowIndex]
                                            .total_qre
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
                                )}

                                {/* Total RD Credits Text Field */}
                                {shouldShowField('total_rd_credits') && (
                                  <TableCell
                                    style={{
                                      position: 'relative',
                                      backgroundColor: errors
                                        .historicalSubmissions?.[rowIndex]
                                        ?.total_rd_credits
                                        ? '#FEF2F2'
                                        : 'transparent',
                                    }}
                                    sx={{ padding: '0px !important' }}
                                  >
                                    <div>
                                      <TextField
                                        value={
                                          submission.total_rd_credits
                                            ? valueDisplay(
                                                submission.total_rd_credits ||
                                                  ''
                                              )
                                            : ''
                                        }
                                        onChange={(e) => {
                                          const rawValue = removeCommas(
                                            e.target.value
                                          );
                                          handleSubmissionChange(
                                            rowIndex,
                                            'total_rd_credits',
                                            rawValue
                                          );
                                        }}
                                        disabled={
                                          !isFieldEditable(
                                            'total_rd_credits',
                                            isNewRow
                                          )
                                        }
                                        size='small'
                                        fullWidth
                                        placeholder='Enter Total RD Credits'
                                        sx={{
                                          '& .MuiInputBase-root': {
                                            height: '28px',
                                            fontSize: '13px',
                                            '& input': {
                                              padding: '4px 8px',
                                              color: '#425A76',
                                            },
                                            '& .MuiOutlinedInput-notchedOutline':
                                              {
                                                border: 'none',
                                              },
                                            '&:hover .MuiOutlinedInput-notchedOutline':
                                              {
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
                                    {errors.historicalSubmissions?.[rowIndex]
                                      ?.total_rd_credits && (
                                      <Tooltip
                                        title={
                                          errors.historicalSubmissions[rowIndex]
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
                                )}

                                {/* Annual Gross Receipts Text Field */}
                                {shouldShowField('annual_gross_receipts') && (
                                  <TableCell
                                    style={{
                                      position: 'relative',
                                      backgroundColor: errors
                                        .historicalSubmissions?.[rowIndex]
                                        ?.annual_gross_receipts
                                        ? '#FEF2F2'
                                        : 'transparent',
                                    }}
                                    sx={{ padding: '0px !important' }}
                                  >
                                    <div>
                                      <TextField
                                        value={
                                          submission.annual_gross_receipts
                                            ? valueDisplay(
                                                submission.annual_gross_receipts ||
                                                  ''
                                              )
                                            : ''
                                        }
                                        onChange={(e) => {
                                          const rawValue = removeCommas(
                                            e.target.value
                                          );
                                          handleSubmissionChange(
                                            rowIndex,
                                            'annual_gross_receipts',
                                            rawValue
                                          );
                                        }}
                                        disabled={
                                          !isFieldEditable(
                                            'annual_gross_receipts',
                                            isNewRow
                                          )
                                        }
                                        size='small'
                                        fullWidth
                                        placeholder='Enter Annual Gross Receipts'
                                        sx={{
                                          '& .MuiInputBase-root': {
                                            height: '28px',
                                            fontSize: '13px',
                                            '& input': {
                                              padding: '4px 8px',
                                              color: '#425A76',
                                            },
                                            '& .MuiOutlinedInput-notchedOutline':
                                              {
                                                border: 'none',
                                              },
                                            '&:hover .MuiOutlinedInput-notchedOutline':
                                              {
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
                                    {errors.historicalSubmissions?.[rowIndex]
                                      ?.annual_gross_receipts && (
                                      <Tooltip
                                        title={
                                          errors.historicalSubmissions[rowIndex]
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
                                )}

                                {/* Actions Column */}
                                <TableCell sx={{ width: '140px', padding: 0 }}>
                                  <Tooltip
                                    title={'Remove Entry'}
                                    disableHoverListener={
                                      (!isHistoricalSubmissionDelete &&
                                        !isNewRow) ||
                                      !isNewRow
                                    }
                                    arrow
                                    placement='top'
                                  >
                                    <button
                                      type='button'
                                      onClick={() =>
                                        handleRemoveSubmission(rowIndex)
                                      }
                                      style={{
                                        cursor: !isNewRow
                                          ? 'default'
                                          : !isHistoricalSubmissionDelete &&
                                              !isNewRow
                                            ? 'default'
                                            : 'pointer',
                                        background: 'transparent',
                                        border: 'none',
                                        padding: 0,
                                        marginTop: '6px',
                                        opacity: !isNewRow ? 0.5 : 1,
                                      }}
                                      aria-label='Remove entry'
                                      className='ml-4'
                                      disabled={
                                        !isNewRow ||
                                        (!isHistoricalSubmissionDelete &&
                                          !isNewRow)
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
                                </TableCell>
                              </TableRow>
                            );
                          }
                        )
                      ) : (
                        <TableRow sx={{ height: '32px' }}>
                          <TableCell
                            colSpan={historicalFields.length + 1}
                            align='center'
                            sx={{
                              borderBottom: '1px solid #CBD6E2',
                              height: '32px',
                              color: '#425A76',
                              fontSize: '14px',
                              fontWeight: 500,
                            }}
                          >
                            No data available
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </div>

              <div className='mt-2 pl-4'>
                <button
                  className='flex items-center cursor-pointer gap-1 bg-[#EAF0F5] h-[30px] color-[#2D3E4F] px-2 text-[12px] font-semibold disabled:bg-gray-100 disabled:opacity-50 disabled:cursor-default'
                  type='button'
                  onClick={handleAddSubmission}
                  disabled={
                    formLoading ||
                    !isHistoricalSubmissionCreate ||
                    !accountDetails?.accountById?.country_rid
                  }
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
        </div>
      )}
    </>
  );
};

export default HistorySubmission;
