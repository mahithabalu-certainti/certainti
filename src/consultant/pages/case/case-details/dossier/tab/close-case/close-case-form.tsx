import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
} from '@mui/material';
import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  CloseIcon,
  UploadIcon,
  AttachmentsSideIcon,
  CloseCircleIcon,
  ErrorInfoIcon,
  DetailsKeyContactErrorIcon,
} from '../../../../../../../assets';
import TextButton from '../../../../../../../components/button/text-button';
import { useParams, useSearchParams } from 'react-router-dom';
import { useFetchState } from '../../../../../../services/account';
import { useToast } from '../../../../../../../hooks';
import { REGEX_PATTERNS } from '../../../../../../../common-utils';
import ConfirmationPopup from '../../../../../../../common-utils/confirmation-popup';
import {
  useComputedData,
  useCaseCloseMutation,
} from '../../../../../../services/case-dossier/case-dossier-service';
import { costDisplay } from '../../../../../../../common-utils/common-utils';

const removeCommas = (value: string): string => {
  return value.replace(/[^0-9.,]/g, '').replace(/,/g, '');
};

interface RowFormData {
  rd_credits_computed: string;
  rd_credits_submitted: string;
  rd_credits_approved: string;
  comments: string;
}

interface RowErrors {
  rd_credits_submitted?: string;
  rd_credits_approved?: string;
  comments?: string;
}

const EMPTY_ROW: RowFormData = {
  rd_credits_computed: '',
  rd_credits_submitted: '',
  rd_credits_approved: '',
  comments: '',
};

const MAX_FILE_SIZE_MB = 100;
const ACCEPTED_EXTENSIONS = [
  'eml',
  'msg',
  'pdf',
  'txt',
  'doc',
  'docx',
  'xls',
  'xlsx',
  'jpg',
  'jpeg',
  'png',
  'gif',
  'bmp',
  'svg',
  'webp',
];
const RESTRICTED_EXTENSIONS = /\.(exe|bat|cmd|sh|bash)$/i;
const ACCEPTED_MIME_TYPES = [
  'image/*',
  'message/rfc822',
  'application/vnd.ms-outlook',
  'application/pdf',
  'text/plain',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];

const TABLE_HEAD_SX = {
  '& .MuiTableCell-root': {
    fontWeight: 700,
    fontSize: '12px',
    color: '#2A2A2A',
    padding: '0px 8px',
    height: '32px',
    boxSizing: 'border-box',
    backgroundColor: '#FCFCFC',
    borderBottom: '1px solid #CBD6E2',
    borderRight: '1px solid #CBD6E2',
    '&:last-child': { borderRight: 'none' },
  },
};

const TABLE_BODY_SX = {
  '& .MuiTableCell-root': {
    padding: '0px',
    borderRight: '1px solid #CBD6E2',
    borderBottom: '1px solid #CBD6E2',
    '&:last-child': { borderRight: 'none' },
    '& input, & textarea': {
      border: 'none',
      outline: 'none',
      boxShadow: 'none',
      background: 'transparent',
      width: '100%',
      fontSize: '12px',
      padding: '2px 8px',
      fontFamily: 'inherit',
      resize: 'none',
      '&:disabled': { backgroundColor: '#f3f4f6', color: '#6b7280' },
      '&:focus': { border: '1px solid #60a5fa', backgroundColor: 'white' },
    },
  },
};

const CellInput: React.FC<{
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  disabled?: boolean;
  hasError?: boolean;
  errorMsg?: string;
}> = ({ value, onChange, placeholder, disabled, hasError, errorMsg }) => (
  <div className={`relative flex h-full ${hasError ? 'bg-[#FEF2F2]' : ''}`}>
    <input
      type='text'
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      autoComplete='off'
      className={`outline-none w-full h-[36px] sm:text-[12px] px-2 placeholder:text-[12px] placeholder:text-[#7d98b6] ${disabled ? 'bg-gray-100 text-gray-500' : ''} ${hasError ? 'bg-[#FEF2F2] focus:!bg-[#FEF2F2]' : ''}`}
      style={{ fontFamily: 'inherit' }}
    />
    {hasError && errorMsg && (
      <Tooltip
        title={errorMsg}
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
            <ErrorInfoIcon alt='error' className='w-5 h-3.5' />
          </React.Suspense>
        </span>
      </Tooltip>
    )}
  </div>
);

const CellTextarea: React.FC<{
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  hasError?: boolean;
  errorMsg?: string;
}> = ({ value, onChange, placeholder, hasError, errorMsg }) => (
  <div className={`relative flex h-full ${hasError ? 'bg-[#FEF2F2]' : ''}`}>
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={2}
      className={`outline-none w-full sm:text-[12px] px-2 py-1 resize-none placeholder:text-[12px] placeholder:text-[#7d98b6] ${hasError ? 'bg-[#FEF2F2] focus:!bg-[#FEF2F2]' : ''}`}
      style={{
        fontFamily: 'inherit',
        scrollbarWidth: 'thin',
        scrollbarColor: '#9ca3af transparent',
      }}
    />
    {hasError && errorMsg && (
      <Tooltip
        title={errorMsg}
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
            <ErrorInfoIcon alt='error' className='w-5 h-3.5' />
          </React.Suspense>
        </span>
      </Tooltip>
    )}
  </div>
);

const FileUploadCell: React.FC<{
  file: File | null;
  onFileSet: (f: File | null) => void;
  onError: (msg: string) => void;
  error?: string;
}> = ({ file, onFileSet, onError, error }) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const validateAndSet = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const f = files[0];
    if (/\s/.test(f.name)) {
      onError(`"${f.name}" must not contain spaces.`);
      return;
    }
    if (f.name.length > 100) {
      onError(`File name must not exceed 100 characters.`);
      return;
    }
    if (RESTRICTED_EXTENSIONS.test(f.name)) {
      onError(`"${f.name}" type is not allowed.`);
      return;
    }
    const ext = f.name.split('.').pop()?.toLowerCase();
    const isImage = f.type.startsWith('image/');
    const mimeOk = ACCEPTED_MIME_TYPES.some((t) =>
      t === 'image/*' ? isImage : f.type === t
    );
    const extOk = ext && ACCEPTED_EXTENSIONS.includes(ext);
    if (!mimeOk && !extOk) {
      onError(`"${f.name}" is not an accepted file type.`);
      return;
    }
    if (f.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      onError(`"${f.name}" exceeds ${MAX_FILE_SIZE_MB}MB.`);
      return;
    }
    onFileSet(f);
  };

  return (
    <div className='relative flex flex-col gap-1 min-h-[36px] justify-center'>
      <input
        type='file'
        ref={inputRef}
        className='hidden'
        accept='image/*,.eml,.msg,.pdf,.txt,.doc,.docx,.xls,.xlsx'
        onChange={(e) => {
          validateAndSet(e.target.files);
          if (inputRef.current) inputRef.current.value = '';
        }}
      />
      {file ? (
        <div className='flex items-center justify-between mx-1.5 bg-white border border-[#CBD6E2] rounded p-1.5 shadow-sm gap-1'>
          <div className='flex items-center gap-1 flex-1 min-w-0'>
            <React.Suspense fallback={null}>
              <AttachmentsSideIcon className='w-2.5 h-2.5 flex-shrink-0 [&>path]:stroke-[#2D3E4F]' />
            </React.Suspense>
            <span
              className='text-[10px] text-[#2D3E4F] truncate leading-tight'
              title={file.name}
            >
              {file.name}
            </span>
          </div>
          <button
            type='button'
            className='p-0 cursor-pointer flex-shrink-0 leading-none'
            onClick={(e) => {
              e.stopPropagation();
              onFileSet(null);
              onError('');
            }}
            title='Remove file'
          >
            <React.Suspense fallback={null}>
              <CloseCircleIcon
                alt='close-icon'
                className='w-4 h-4 hover:[&>path]:stroke-[#e34616] hover:[&>rect]:fill-[#ffede7]'
              />
            </React.Suspense>
          </button>
        </div>
      ) : (
        <div
          className={`relative flex items-center h-11 justify-center ${error ? 'bg-[#FEF2F2]' : ''}`}
        >
          <button
            type='button'
            className='flex items-center gap-1 text-[11px] text-[#0176D3] hover:underline cursor-pointer self-center py-1'
            onClick={() => inputRef.current?.click()}
          >
            <React.Suspense fallback={null}>
              <UploadIcon className='w-3 h-3' />
            </React.Suspense>
            Upload
          </button>
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
              <span className='h-[28px] w-5 flex items-center justify-center absolute top-[50%] -translate-y-1/2 bg-[#FEF2F2] right-[2px] cursor-pointer'>
                <React.Suspense fallback={null}>
                  <ErrorInfoIcon alt='error' className='w-5 h-3.5' />
                </React.Suspense>
              </span>
            </Tooltip>
          )}
        </div>
      )}
    </div>
  );
};

export interface CloseCaseFormRef {
  handleSubmit: () => void;
}

export interface CloseCaseFormProps {
  caseDetails?: {
    country_name?: string;
    country_rid?: string;
    country_code?: string;
    fiscal_year?: string | number;
    all_task_completed?: boolean;
    currency_symbol?: string;
  };
  refetchCaseDetails?: () => void;
  onCancel?: () => void;
  onSuccess?: () => void;
  showTitle?: boolean;
  showCloseIcon?: boolean;
  isInsideModal?: boolean;
  hideFooter?: boolean;
}

const CloseCaseForm = React.forwardRef<CloseCaseFormRef, CloseCaseFormProps>(
  (
    {
      caseDetails,
      refetchCaseDetails,
      onCancel,
      onSuccess,
      showTitle = true,
      showCloseIcon = true,
      isInsideModal = false,
      hideFooter = false,
    },
    ref
  ) => {
    const [countryForm, setCountryForm] = useState<RowFormData>(EMPTY_ROW);
    const [countryErrors, setCountryErrors] = useState<RowErrors>({});
    const [countryFile, setCountryFile] = useState<File | null>(null);
    const [countryFileError, setCountryFileError] = useState('');

    const [stateFormData, setStateFormData] = useState<
      Record<string, RowFormData>
    >({});
    const [stateErrors, setStateErrors] = useState<Record<string, RowErrors>>(
      {}
    );
    const [stateFiles, setStateFiles] = useState<Record<string, File | null>>(
      {}
    );
    const [stateFileErrors, setStateFileErrors] = useState<
      Record<string, string>
    >({});

    const [showConfirmation, setShowConfirmation] = useState(false);
    const isTaskCompleted = caseDetails?.all_task_completed;
    const { successToast } = useToast();
    const { caseId } = useParams();
    const [searchParams] = useSearchParams();
    const accountid = searchParams.get('accountID') ?? '';

    const caseCountryDetails = {
      country_name: caseDetails?.country_name || '',
      country_code: caseDetails?.country_code || '',
      country_rid: caseDetails?.country_rid || '',
    };

    const region = useFetchState(caseDetails?.country_rid || '', 'active');
    const { mutate: closeCase, isPending: isClosing } = useCaseCloseMutation();

    const stateList = useMemo(() => {
      return (region.data?.data.states || []).map((s) => ({
        state_rid: s.rid,
        state_name: s.state_name,
      }));
    }, [region.data?.data.states]);

    const computedDataQuery = useComputedData(
      {
        case_rid: caseId ?? '',
        account_rid: accountid,
        country_rid: caseCountryDetails.country_rid,
        country_code: caseCountryDetails.country_code,
        state_rid: stateList.map((s) => s.state_rid),
      },
      true
    );
    const computedData = computedDataQuery.data?.data;

    useEffect(() => {
      if (!computedData) return;

      const countryFinalCredit =
        computedData.countryComputedData?.final_credit ?? '';
      setCountryForm((prev) => ({
        ...prev,
        rd_credits_computed: countryFinalCredit,
      }));

      if (computedData.stateComputedData?.length) {
        setStateFormData((prev) => {
          const updated = { ...prev };
          computedData.stateComputedData.forEach((sd) => {
            updated[sd.state_rid] = {
              ...(updated[sd.state_rid] ?? EMPTY_ROW),
              rd_credits_computed: sd.final_credit ?? '',
            };
          });
          return updated;
        });
      }
    }, [computedData]);

    const handleReset = () => {
      setCountryForm(EMPTY_ROW);
      setCountryErrors({});
      setCountryFile(null);
      setCountryFileError('');
      setStateFormData({});
      setStateErrors({});
      setStateFiles({});
      setStateFileErrors({});
      setShowConfirmation(false);
    };

    const updateCountryField = (field: keyof RowFormData, value: string) => {
      let finalValue = value;
      if (
        field === 'rd_credits_submitted' ||
        field === 'rd_credits_approved' ||
        field === 'rd_credits_computed'
      ) {
        finalValue = removeCommas(value);
      }
      setCountryForm((prev) => ({ ...prev, [field]: finalValue }));
      setCountryErrors((prev) => ({ ...prev, [field]: '' }));
    };

    const updateStateField = (
      stateRid: string,
      field: keyof RowFormData,
      value: string
    ) => {
      let finalValue = value;
      if (
        field === 'rd_credits_submitted' ||
        field === 'rd_credits_approved' ||
        field === 'rd_credits_computed'
      ) {
        finalValue = removeCommas(value);
      }
      setStateFormData((prev) => ({
        ...prev,
        [stateRid]: {
          ...(prev[stateRid] ?? EMPTY_ROW),
          [field]: finalValue,
        },
      }));
      setStateErrors((prev) => ({
        ...prev,
        [stateRid]: {
          ...(prev[stateRid] ?? {}),
          [field]: '',
        },
      }));
    };

    const stateHasAnyData = (stateRid: string): boolean => {
      const d = stateFormData[stateRid];
      if (!d) return !!stateFiles[stateRid];
      return (
        !!d.rd_credits_submitted.trim() ||
        !!d.rd_credits_approved.trim() ||
        !!d.comments.trim() ||
        !!stateFiles[stateRid]
      );
    };

    const allStatesHaveData = () =>
      stateList.length > 0 &&
      stateList.every((s) => stateHasAnyData(s.state_rid));

    const validateCountry = (): boolean => {
      const errs: RowErrors = {};
      if (!countryForm.rd_credits_submitted.trim()) {
        errs.rd_credits_submitted = 'Field is required';
      } else if (
        !REGEX_PATTERNS.EFFORTS_NUMBER.test(countryForm.rd_credits_submitted)
      ) {
        errs.rd_credits_submitted =
          'Only positive numbers, up to 16 digits and 2 decimal places';
      }
      if (!countryForm.rd_credits_approved.trim()) {
        errs.rd_credits_approved = 'Field is required';
      } else if (
        !REGEX_PATTERNS.EFFORTS_NUMBER.test(countryForm.rd_credits_approved)
      ) {
        errs.rd_credits_approved =
          'Only positive numbers, up to 16 digits and 2 decimal places';
      }
      if (
        countryForm.comments &&
        !REGEX_PATTERNS.MAX_2000.test(countryForm.comments)
      ) {
        errs.comments = 'Comments must be within 2000 characters';
      }
      setCountryErrors(errs);
      return Object.keys(errs).length === 0;
    };

    const validateStates = (): boolean => {
      let valid = true;
      const newStateErrors: Record<string, RowErrors> = {};

      stateList.forEach((s) => {
        if (!stateHasAnyData(s.state_rid)) return;

        const d = stateFormData[s.state_rid] ?? EMPTY_ROW;
        const errs: RowErrors = {};
        if (!d.rd_credits_submitted.trim()) {
          errs.rd_credits_submitted = 'Field is required';
          valid = false;
        } else if (
          !REGEX_PATTERNS.EFFORTS_NUMBER.test(d.rd_credits_submitted)
        ) {
          errs.rd_credits_submitted =
            'Only positive numbers, up to 16 digits and 2 decimal places';
          valid = false;
        }
        if (!d.rd_credits_approved.trim()) {
          errs.rd_credits_approved = 'Field is required';
          valid = false;
        } else if (!REGEX_PATTERNS.EFFORTS_NUMBER.test(d.rd_credits_approved)) {
          errs.rd_credits_approved =
            'Only positive numbers, up to 16 digits and 2 decimal places';
          valid = false;
        }
        if (d.comments && !REGEX_PATTERNS.MAX_2000.test(d.comments)) {
          errs.comments = 'Comments must be within 2000 characters';
          valid = false;
        }
        if (Object.keys(errs).length > 0) {
          newStateErrors[s.state_rid] = errs;
        }
      });

      setStateErrors(newStateErrors);
      return valid;
    };

    const buildAndSubmit = (userPreference: string) => {
      const country_credits = {
        country_rid: caseCountryDetails.country_rid,
        rd_credits_computed: countryForm.rd_credits_computed,
        rd_credits_submitted: countryForm.rd_credits_submitted,
        rd_credits_approved: countryForm.rd_credits_approved,
        comments: countryForm.comments,
      };

      const state_credits = stateList
        .filter((s) => stateHasAnyData(s.state_rid))
        .map((s) => {
          const d = stateFormData[s.state_rid] ?? EMPTY_ROW;
          return {
            state_rid: s.state_rid,
            rd_credits_computed: d.rd_credits_computed,
            rd_credits_submitted: d.rd_credits_submitted,
            rd_credits_approved: d.rd_credits_approved,
            comments: d.comments,
          };
        });

      const files: Record<string, File> = {};
      if (countryFile) {
        files[`file_country_${caseCountryDetails.country_rid}`] = countryFile;
      }
      stateList.forEach((s) => {
        if (stateFiles[s.state_rid]) {
          files[`file_state_${s.state_rid}`] = stateFiles[s.state_rid]!;
        }
      });

      closeCase(
        {
          case_rid: caseId ?? '',
          account_rid: accountid,
          country_credits,
          state_credits,
          files: Object.keys(files).length > 0 ? files : undefined,
          fiscal_year: caseDetails?.fiscal_year,
          user_preference: userPreference,
        },
        {
          onSuccess: () => {
            successToast('Case closed successfully');
            handleReset();
            onSuccess?.();
            refetchCaseDetails?.();
          },
        }
      );
    };

    const handleSubmit = () => {
      const countryValid = validateCountry();
      const statesValid = validateStates();
      if (!countryValid || !statesValid) return;

      if (stateList.length > 0 && !allStatesHaveData()) {
        setShowConfirmation(true);
        return;
      }

      buildAndSubmit('');
    };

    React.useImperativeHandle(ref, () => ({
      handleSubmit,
    }));

    const handleConfirmYes = () => {
      setShowConfirmation(false);
      buildAndSubmit('true');
    };

    const handleConfirmNo = () => {
      setShowConfirmation(false);
    };

    return (
      <React.Suspense fallback={null}>
        <div
          className={`${isInsideModal ? '' : 'bg-white rounded-md shadow-sm'}`}
        >
          {/* Header - Only in Modal or if showTitle is explicitly true */}
          {showTitle && (
            <div className='flex items-center justify-between gap-2 px-5 py-3 border-b border-[#CBD6E2]'>
              <div className='text-[15px] font-bold text-[#2D3E4F]'>
                Close Case
              </div>
              {showCloseIcon && onCancel && (
                <button
                  className='w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-200 cursor-pointer disabled:cursor-default'
                  onClick={onCancel}
                  disabled={isClosing}
                >
                  <React.Suspense fallback={null}>
                    <CloseIcon className='w-3 h-3' />
                  </React.Suspense>
                </button>
              )}
            </div>
          )}

          {!isTaskCompleted && (
            <div className='flex items-center gap-1.5 h-8 border-b border-[#FFC77B] bg-[#FEF8F0] text-[13px] text-[#2D3E4F] px-3 py-2 border-box'>
              <div>
                <React.Suspense fallback={null}>
                  <DetailsKeyContactErrorIcon alt='key-contact' />
                </React.Suspense>
              </div>
              <div>
                <span className='font-bold mr-1 capitalize'>
                  Milestone Task
                </span>
                -
                <span className='ml-1 font-medium'>
                  Some tasks in this case are still incomplete. Please Complete
                  all tasks before closing the case.
                </span>
              </div>
            </div>
          )}

          <div
            className='overflow-y-auto px-5 py-4 flex flex-col gap-5'
            style={{
              maxHeight: isInsideModal ? '70vh' : 'auto',
              pointerEvents: isClosing ? 'none' : 'all',
            }}
          >
            <div>
              <div className='font-bold text-[13px] text-[#2D3E4F] mb-2'>
                Federal
              </div>
              <TableContainer
                sx={{ border: '1px solid #CBD6E2', borderRadius: '2px' }}
              >
                <Table
                  size='small'
                  sx={{ tableLayout: 'fixed', width: '100%' }}
                >
                  <TableHead sx={TABLE_HEAD_SX}>
                    <TableRow>
                      <TableCell style={{ width: '12%' }}>
                        Country Name
                      </TableCell>
                      <TableCell style={{ width: '16%' }}>
                        RD Credits Computed
                      </TableCell>
                      <TableCell style={{ width: '16%' }}>
                        RD Credits Submitted{' '}
                        <span className='text-red-500'>*</span>
                      </TableCell>
                      <TableCell style={{ width: '16%' }}>
                        RD Credits Approved{' '}
                        <span className='text-red-500'>*</span>
                      </TableCell>
                      <TableCell style={{ width: 'auto' }}>Comments</TableCell>
                      <TableCell style={{ width: '10%', textAlign: 'center' }}>
                        Attachment
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody sx={TABLE_BODY_SX}>
                    <TableRow>
                      <TableCell>
                        <div className='px-2 py-2 text-[12px] text-[#2D3E4F] font-medium h-full min-h-[36px] flex items-center'>
                          {computedDataQuery.isLoading ? (
                            <span className='text-[#9DB0C6]'>Loading…</span>
                          ) : (
                            caseCountryDetails.country_name || '-'
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <CellInput
                          value={
                            countryForm.rd_credits_computed
                              ? costDisplay(
                                  countryForm.rd_credits_computed,
                                  caseDetails?.currency_symbol
                                )
                              : ''
                          }
                          onChange={() => undefined}
                          placeholder={
                            computedDataQuery.isLoading ? 'Loading...' : '-'
                          }
                          disabled
                        />
                      </TableCell>
                      <TableCell
                        style={{
                          backgroundColor: countryErrors.rd_credits_submitted
                            ? '#FEF2F2'
                            : undefined,
                        }}
                      >
                        <CellInput
                          value={
                            countryForm.rd_credits_submitted
                              ? costDisplay(
                                  countryForm.rd_credits_submitted,
                                  caseDetails?.currency_symbol
                                )
                              : ''
                          }
                          onChange={(v) =>
                            updateCountryField('rd_credits_submitted', v)
                          }
                          placeholder='Enter RD Credits Submitted'
                          hasError={!!countryErrors.rd_credits_submitted}
                          errorMsg={countryErrors.rd_credits_submitted}
                        />
                      </TableCell>
                      <TableCell
                        style={{
                          backgroundColor: countryErrors.rd_credits_approved
                            ? '#FEF2F2'
                            : undefined,
                        }}
                      >
                        <CellInput
                          value={
                            countryForm.rd_credits_approved
                              ? costDisplay(
                                  countryForm.rd_credits_approved,
                                  caseDetails?.currency_symbol
                                )
                              : ''
                          }
                          onChange={(v) =>
                            updateCountryField('rd_credits_approved', v)
                          }
                          placeholder='Enter RD Credits Approved'
                          hasError={!!countryErrors.rd_credits_approved}
                          errorMsg={countryErrors.rd_credits_approved}
                        />
                      </TableCell>
                      <TableCell
                        style={{
                          backgroundColor: countryErrors.comments
                            ? '#FEF2F2'
                            : undefined,
                        }}
                      >
                        <CellTextarea
                          value={countryForm.comments}
                          onChange={(v) => updateCountryField('comments', v)}
                          placeholder='Enter Comments'
                          hasError={!!countryErrors.comments}
                          errorMsg={countryErrors.comments}
                        />
                      </TableCell>
                      <TableCell>
                        <FileUploadCell
                          file={countryFile}
                          onFileSet={setCountryFile}
                          onError={setCountryFileError}
                          error={countryFileError || undefined}
                        />
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </div>

            {stateList.length > 0 && (
              <div>
                <div className='font-bold text-[13px] text-[#2D3E4F] mb-2'>
                  State-wise
                </div>
                <TableContainer
                  sx={{ border: '1px solid #CBD6E2', borderRadius: '2px' }}
                >
                  <Table
                    size='small'
                    sx={{ tableLayout: 'fixed', width: '100%' }}
                  >
                    <TableHead sx={TABLE_HEAD_SX}>
                      <TableRow>
                        <TableCell style={{ width: '12%' }}>
                          State Name
                        </TableCell>
                        <TableCell style={{ width: '16%' }}>
                          RD Credits Computed
                        </TableCell>
                        <TableCell style={{ width: '16%' }}>
                          RD Credits Submitted
                        </TableCell>
                        <TableCell style={{ width: '16%' }}>
                          RD Credits Approved
                        </TableCell>
                        <TableCell style={{ width: 'auto' }}>
                          Comments
                        </TableCell>
                        <TableCell
                          style={{ width: '10%', textAlign: 'center' }}
                        >
                          Attachment
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody sx={TABLE_BODY_SX}>
                      {stateList.map((s) => {
                        const d = stateFormData[s.state_rid] ?? EMPTY_ROW;
                        const errs = stateErrors[s.state_rid] ?? {};
                        const fileErr = stateFileErrors[s.state_rid] ?? '';
                        return (
                          <TableRow key={s.state_rid}>
                            <TableCell>
                              <div className='px-2 py-2 text-[12px] text-[#2D3E4F] font-medium h-full min-h-[36px] flex items-center'>
                                {s.state_name}
                              </div>
                            </TableCell>
                            <TableCell>
                              <CellInput
                                value={
                                  d.rd_credits_computed
                                    ? costDisplay(
                                        d.rd_credits_computed,
                                        caseDetails?.currency_symbol
                                      )
                                    : ''
                                }
                                onChange={() => undefined}
                                placeholder={
                                  computedDataQuery.isLoading
                                    ? 'Loading...'
                                    : '-'
                                }
                                disabled
                              />
                            </TableCell>
                            <TableCell
                              style={{
                                backgroundColor: errs.rd_credits_submitted
                                  ? '#FEF2F2'
                                  : undefined,
                              }}
                            >
                              <CellInput
                                value={
                                  d.rd_credits_submitted
                                    ? costDisplay(
                                        d.rd_credits_submitted,
                                        caseDetails?.currency_symbol
                                      )
                                    : ''
                                }
                                onChange={(v) =>
                                  updateStateField(
                                    s.state_rid,
                                    'rd_credits_submitted',
                                    v
                                  )
                                }
                                placeholder='Enter RD Credits Submitted'
                                hasError={!!errs.rd_credits_submitted}
                                errorMsg={errs.rd_credits_submitted}
                              />
                            </TableCell>
                            <TableCell
                              style={{
                                backgroundColor: errs.rd_credits_approved
                                  ? '#FEF2F2'
                                  : undefined,
                              }}
                            >
                              <CellInput
                                value={
                                  d.rd_credits_approved
                                    ? costDisplay(
                                        d.rd_credits_approved,
                                        caseDetails?.currency_symbol
                                      )
                                    : ''
                                }
                                onChange={(v) =>
                                  updateStateField(
                                    s.state_rid,
                                    'rd_credits_approved',
                                    v
                                  )
                                }
                                placeholder='Enter RD Credits Approved'
                                hasError={!!errs.rd_credits_approved}
                                errorMsg={errs.rd_credits_approved}
                              />
                            </TableCell>
                            <TableCell
                              style={{
                                backgroundColor: errs.comments
                                  ? '#FEF2F2'
                                  : undefined,
                              }}
                            >
                              <CellTextarea
                                value={d.comments}
                                onChange={(v) =>
                                  updateStateField(s.state_rid, 'comments', v)
                                }
                                placeholder='Enter Comments'
                                hasError={!!errs.comments}
                                errorMsg={errs.comments}
                              />
                            </TableCell>
                            <TableCell>
                              <FileUploadCell
                                file={stateFiles[s.state_rid] ?? null}
                                onFileSet={(f) =>
                                  setStateFiles((prev) => ({
                                    ...prev,
                                    [s.state_rid]: f,
                                  }))
                                }
                                onError={(msg) =>
                                  setStateFileErrors((prev) => ({
                                    ...prev,
                                    [s.state_rid]: msg,
                                  }))
                                }
                                error={fileErr || undefined}
                              />
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              </div>
            )}
          </div>

          {!hideFooter && (
            <div className='border-t border-[#CBD6E2] px-6 py-3 flex gap-3 justify-end'>
              {onCancel && (
                <TextButton
                  label='Cancel'
                  onClick={onCancel}
                  disabled={isClosing}
                  sx={{
                    width: '75px',
                    minWidth: '75px',
                    fontSize: '13px',
                    fontWeight: 400,
                  }}
                />
              )}
              <TextButton
                label='Save'
                onClick={handleSubmit}
                disabled={!isTaskCompleted}
                loading={isClosing}
                sx={{
                  width: '65px',
                  minWidth: '65px',
                  fontSize: '13px',
                  fontWeight: 400,
                }}
              />
            </div>
          )}
        </div>

        <ConfirmationPopup
          isOpen={showConfirmation}
          message='One or more state entries are incomplete. Do you want to close this case without completing all state details?'
          onConfirm={handleConfirmYes}
          onCancel={handleConfirmNo}
        />
      </React.Suspense>
    );
  }
);

export default CloseCaseForm;
