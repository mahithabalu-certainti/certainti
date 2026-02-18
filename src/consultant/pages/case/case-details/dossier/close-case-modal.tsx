import { Box, Modal, Select, MenuItem } from '@mui/material';
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { CloseIcon, UploadIcon } from '../../../../../assets';
import TextButton from '../../../../../components/button/text-button';
import { SectionHeaderTab } from '../../../../../components';
import { useParams, useSearchParams } from 'react-router-dom';
import { useFetchState } from '../../../../services/account';
import { FileList } from '../../../../../components/file-list';
import { useToast } from '../../../../../hooks';
import { REGEX_PATTERNS } from '../../../../../common-utils';
import { COMMON_MENU_PROPS, getSelectStyles } from './tab/rd-form/helper';
import {
  useComputedData,
  useCaseCloseMutation,
} from '../../../../services/case-dossier/case-dossier-service';

interface CloseCaseModalProps {
  open: boolean;
  onClose: () => void;
  caseDetails?: {
    country_name?: string;
    country_rid?: string;
    country_code?: string;
    fiscal_year?: string | number;
  };
  refetchCaseDetails?: () => void;
}

interface TabFormData {
  rd_credits_computed: string;
  rd_credits_submitted: string;
  rd_credits_approved: string;
}

interface FormErrors {
  country?: string;
  region?: string;
  rd_credits_submitted?: string;
  rd_credits_approved?: string;
  comments?: string;
  attachments?: string;
}

const MAX_FILE_SIZE_MB = 100;
const RESTRICTED_EXTENSIONS = /\.(exe|bat|cmd|sh|bash)$/i;

const ACCEPTED_FILE_TYPES = [
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

const EMPTY_FORM: TabFormData = {
  rd_credits_computed: '',
  rd_credits_submitted: '',
  rd_credits_approved: '',
};

const CloseCaseModal: React.FC<CloseCaseModalProps> = ({
  open,
  onClose,
  caseDetails,
  refetchCaseDetails,
}) => {
  const [activeTab, setActiveTab] = useState<string>('federal');
  const [selectedRegion, setSelectedRegion] = useState<string>('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [comments, setComments] = useState<string>('');
  const [message, setMessage] = useState<{
    type: 'error' | 'success';
    text: string;
  } | null>(null);

  // Per-tab form data keyed by 'federal' or state_rid
  const [tabFormData, setTabFormData] = useState<Record<string, TabFormData>>(
    {}
  );

  const fileInputRef = useRef<HTMLInputElement | null>(null);
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
  const computedDataQuery = useComputedData(
    {
      case_rid: caseId ?? '',
      account_rid: accountid,
      country_rid: caseCountryDetails.country_rid,
      country_code: caseCountryDetails.country_code,
      state_rid:
        activeTab === 'state_wise' && selectedRegion ? [selectedRegion] : [],
    },
    open
  );
  const computedData = computedDataQuery.data?.data;

  const regionListOptions = useMemo(() => {
    const states = region.data?.data.states || [];
    return states.map((state) => ({
      label: state.state_name,
      value: state.rid,
    }));
  }, [region.data?.data.states]);

  useEffect(() => {
    if (!computedData || !open) return;

    if (activeTab === 'federal') {
      const finalCredit = computedData.countryComputedData?.final_credit ?? '';
      setTabFormData((prev) => ({
        ...prev,
        federal: {
          ...(prev['federal'] ?? EMPTY_FORM),
          rd_credits_computed: finalCredit,
        },
      }));
    } else if (activeTab === 'state_wise' && selectedRegion) {
      const stateData = computedData.stateComputedData?.find(
        (s) => s.state_rid === selectedRegion
      );
      const finalCredit = stateData?.final_credit ?? '';
      setTabFormData((prev) => ({
        ...prev,
        [selectedRegion]: {
          ...(prev[selectedRegion] ?? EMPTY_FORM),
          rd_credits_computed: finalCredit,
        },
      }));
    }
  }, [computedData, activeTab, selectedRegion, open]);

  // Auto-select first region when switching to state-wise tab
  useEffect(() => {
    if (
      activeTab === 'state_wise' &&
      regionListOptions.length > 0 &&
      !selectedRegion
    ) {
      setSelectedRegion(regionListOptions[0].value);
    }
  }, [activeTab, regionListOptions, selectedRegion]);

  const tabs = [
    { label: 'Federal', value: 'federal', hide: false },
    { label: 'State-wise', value: 'state_wise', hide: false },
  ];

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setTabFormData({});
    setComments('');
    setSelectedFiles([]);
    setErrors({});
    setMessage(null);
    if (value === 'federal') {
      setSelectedRegion('');
    }
  };

  const handleRegionChange = (value: string) => {
    setSelectedRegion(value);
    setTabFormData({});
    setComments('');
    setSelectedFiles([]);
    setErrors({});
    setMessage(null);
  };

  // Current form key: 'federal' or the selected state_rid
  const currentKey = activeTab === 'federal' ? 'federal' : selectedRegion || '';

  const currentFormData: TabFormData = tabFormData[currentKey] ?? EMPTY_FORM;

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    if (name === 'comments') {
      setComments(value);
      setErrors((prev) => ({ ...prev, comments: '' }));
    } else {
      setTabFormData((prev) => ({
        ...prev,
        [currentKey]: {
          ...(prev[currentKey] ?? EMPTY_FORM),
          [name]: value,
        },
      }));
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const showError = (text: string) => {
    setMessage({ type: 'error', text });
  };

  const validateFiles = (files: FileList | null): File[] => {
    if (!files) return [];
    const validFiles: File[] = [];
    const allowedExtensions = [
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

    for (const file of Array.from(files)) {
      if (/\s/.test(file.name)) {
        showError(
          `"${file.name}" is invalid. File name must not contain spaces.`
        );
        continue;
      }
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      const isImage = file.type.startsWith('image/');
      const isMimeTypeAccepted = ACCEPTED_FILE_TYPES.some((acceptedType) => {
        if (acceptedType === 'image/*') return isImage;
        return file.type === acceptedType;
      });
      const isExtensionAccepted =
        fileExtension && allowedExtensions.includes(fileExtension);
      if (!isMimeTypeAccepted && !isExtensionAccepted) {
        showError(
          `"${file.name}" is not a valid file. Only images, .eml, .msg, .pdf, .txt, .doc, .docx, .xls, or .xlsx files are allowed.`
        );
        continue;
      }
      if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
        showError(`"${file.name}" exceeds the ${MAX_FILE_SIZE_MB}MB limit.`);
        continue;
      }
      if (RESTRICTED_EXTENSIONS.test(file.name)) {
        showError(
          `"${file.name}" type is not allowed (.exe, .bat, .cmd, .sh, .bash).`
        );
        continue;
      }
      validFiles.push(file);
    }
    return validFiles;
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(null);
    const validFiles = validateFiles(e.target.files);
    if (validFiles.length > 0) {
      setSelectedFiles((prev) => [...prev, ...validFiles]);
      setErrors((prev) => ({ ...prev, attachments: '' }));
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setMessage(null);
    const validFiles = validateFiles(e.dataTransfer.files);
    if (validFiles.length > 0) {
      setSelectedFiles((prev) => [...prev, ...validFiles]);
      setErrors((prev) => ({ ...prev, attachments: '' }));
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (activeTab === 'state_wise' && !selectedRegion) {
      newErrors.region = 'Field is required';
    }

    if (!currentFormData.rd_credits_submitted.trim()) {
      newErrors.rd_credits_submitted = 'Field is required';
    } else if (
      !REGEX_PATTERNS.EFFORTS_NUMBER.test(currentFormData.rd_credits_submitted)
    ) {
      newErrors.rd_credits_submitted =
        'Only positive numbers allowed, up to 16 digits and 2 decimal places';
    }

    if (!currentFormData.rd_credits_approved.trim()) {
      newErrors.rd_credits_approved = 'Field is required';
    } else if (
      !REGEX_PATTERNS.EFFORTS_NUMBER.test(currentFormData.rd_credits_approved)
    ) {
      newErrors.rd_credits_approved =
        'Only positive numbers allowed, up to 16 digits and 2 decimal places';
    }

    if (!REGEX_PATTERNS.MAX_2000.test(comments)) {
      newErrors.comments = 'Comments must be within 2000 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) return;

    // Federal tab → full country_credits; State-wise tab → empty object
    const federalData = tabFormData['federal'] ?? EMPTY_FORM;
    const country_credits =
      activeTab === 'federal'
        ? {
            country_rid: caseCountryDetails.country_rid,
            rd_credits_computed: federalData.rd_credits_computed,
            rd_credits_submitted: federalData.rd_credits_submitted,
            rd_credits_approved: federalData.rd_credits_approved,
          }
        : {};

    // Build state_credits from all state tab data
    const state_credits = regionListOptions
      .map((opt) => {
        const stateData = tabFormData[opt.value];
        if (!stateData) return null;
        return {
          state_rid: opt.value,
          rd_credits_computed: stateData.rd_credits_computed,
          rd_credits_submitted: stateData.rd_credits_submitted,
          rd_credits_approved: stateData.rd_credits_approved,
        };
      })
      .filter(Boolean) as {
      state_rid: string;
      rd_credits_computed: string;
      rd_credits_submitted: string;
      rd_credits_approved: string;
    }[];

    closeCase(
      {
        case_rid: caseId ?? '',
        account_rid: accountid,
        country_credits,
        state_credits,
        files: selectedFiles.length > 0 ? selectedFiles : undefined,
        comments: comments || undefined,
        fiscal_year: caseDetails?.fiscal_year,
      },
      {
        onSuccess: () => {
          successToast('Case closed successfully');
          handleClose();
          refetchCaseDetails?.();
        },
      }
    );
  };

  const handleClose = () => {
    setActiveTab('federal');
    setSelectedRegion('');
    setTabFormData({});
    setComments('');
    setSelectedFiles([]);
    setErrors({});
    setMessage(null);
    onClose();
  };

  return (
    <React.Suspense fallback={null}>
      <Modal open={open}>
        <Box className='absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 min-w-[40%] max-w-[40%] bg-white rounded-md shadow-lg outline-none'>
          {/* Header */}
          <div className='flex items-center justify-between gap-2 p-4 border-b border-[#CBD6E2] shrink-0'>
            <div className='text-[16px] font-bold text-[#2D3E4F]'>
              Close Case
            </div>
            <button
              className='w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-200 cursor-pointer disabled:cursor-default'
              onClick={handleClose}
              disabled={isClosing}
            >
              <React.Suspense fallback={null}>
                <CloseIcon className='w-3 h-3' />
              </React.Suspense>
            </button>
          </div>

          {/* Body */}
          <div
            className='min-h-[500px] max-h-[70vh] overflow-y-auto'
            style={{
              pointerEvents: isClosing ? 'none' : 'all',
            }}
          >
            <SectionHeaderTab
              tabs={tabs}
              onTabChange={handleTabChange}
              defaultValue={activeTab}
              className='flex flex-col gap-0 border-b border-[#CBD6E2] pl-3'
            />
            <div className='pb-2'>
              {/* Country and Region Fields */}
              <div className='grid md:grid-cols-2 gap-x-4 gap-y-3 px-6 py-3'>
                <div>
                  <label
                    className='text-[13px] text-[#2D3E4F] font-semibold leading-[21px] tracking-[0] md:text-left mt-1'
                    htmlFor='country_name'
                  >
                    Country <span className='text-red-500'>*</span>
                  </label>
                  <input
                    type='text'
                    name='country_name'
                    placeholder='-'
                    autoComplete='off'
                    className={`placeholder-custom-color disabled:bg-gray-100 placeholder-[#7D98B6] outline-none focus:border-2 focus:border-blue-400 w-full sm:text-sm px-3 h-[32px] border border-[#CBD6E2] rounded-xs ${
                      errors?.country &&
                      'border-red-500 disabled:!bg-[#FEF2F2] bg-[#FEF2F2]'
                    }`}
                    disabled={true}
                    value={caseCountryDetails.country_name}
                  />
                  {errors?.country && (
                    <span className='text-[12px] text-red-400 col-span-full'>
                      {errors.country}
                    </span>
                  )}
                </div>

                {activeTab === 'state_wise' && (
                  <div>
                    <label
                      className='text-[13px] text-[#2D3E4F] font-semibold leading-[21px] tracking-[0] md:text-left mt-1'
                      htmlFor='region'
                    >
                      Region <span className='text-red-500'>*</span>
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
                )}

                {/* RD Credits Computed */}
                <div>
                  <label
                    htmlFor='rd_credits_computed'
                    className='text-[13px] text-[#2D3E4F] font-semibold leading-[21px]'
                  >
                    RD Credits Computed
                  </label>
                  <input
                    type='text'
                    name='rd_credits_computed'
                    placeholder={
                      computedDataQuery.isLoading
                        ? 'Loading...'
                        : 'Enter RD Credits Computed'
                    }
                    value={currentFormData.rd_credits_computed}
                    onChange={handleInputChange}
                    autoComplete='off'
                    disabled={true}
                    className='outline-none placeholder-custom-color disabled:bg-gray-100 h-[32px] w-full sm:text-sm py-2 px-3 border border-[#CBD6E2] rounded-xs'
                  />
                </div>

                <div>
                  <label
                    htmlFor='rd_credits_submitted'
                    className='text-[13px] text-[#2D3E4F] font-semibold leading-[21px]'
                  >
                    RD Credits Submitted <span className='text-red-500'>*</span>
                  </label>
                  <input
                    type='text'
                    name='rd_credits_submitted'
                    placeholder='Enter RD Credits Submitted'
                    value={currentFormData.rd_credits_submitted}
                    onChange={handleInputChange}
                    autoComplete='off'
                    className={`outline-none placeholder-custom-color h-[32px] w-full sm:text-sm py-2 px-3 focus:border-2 focus:border-blue-400 border border-[#CBD6E2] rounded-xs ${
                      errors?.rd_credits_submitted
                        ? 'border-red-500 bg-[#FEF2F2] focus:!bg-[#FEF2F2]'
                        : ''
                    }`}
                  />
                  {errors?.rd_credits_submitted && (
                    <span className='text-[12px] text-red-400'>
                      {errors.rd_credits_submitted}
                    </span>
                  )}
                </div>

                <div>
                  <label
                    htmlFor='rd_credits_approved'
                    className='text-[13px] text-[#2D3E4F] font-semibold leading-[21px]'
                  >
                    RD Credits Approved <span className='text-red-500'>*</span>
                  </label>
                  <input
                    type='text'
                    name='rd_credits_approved'
                    placeholder='Enter RD Credits Approved'
                    value={currentFormData.rd_credits_approved}
                    onChange={handleInputChange}
                    autoComplete='off'
                    className={`outline-none placeholder-custom-color h-[32px] w-full sm:text-sm py-2 px-3 focus:border-2 focus:border-blue-400 border border-[#CBD6E2] rounded-xs ${
                      errors?.rd_credits_approved
                        ? 'border-red-500 bg-[#FEF2F2] focus:!bg-[#FEF2F2]'
                        : ''
                    }`}
                  />
                  {errors?.rd_credits_approved && (
                    <span className='text-[12px] text-red-400'>
                      {errors.rd_credits_approved}
                    </span>
                  )}
                </div>
              </div>

              {/* Comments Field */}
              <div className='grid md:grid-cols-1 gap-x-4 gap-y-[2px] px-6 pt-3'>
                <label
                  htmlFor='comments'
                  className='text-[13px] text-[#2D3E4F] font-semibold leading-[21px]'
                >
                  Comments
                </label>
                <textarea
                  name='comments'
                  placeholder='Enter Comments'
                  value={comments}
                  onChange={handleInputChange}
                  autoComplete='off'
                  className={`outline-none placeholder-custom-color h-[95px] w-full sm:text-sm py-2 px-3 resize-none focus:border-2 focus:border-blue-400 border border-[#CBD6E2] rounded-xs ${
                    errors?.comments
                      ? 'border-red-500 bg-[#FEF2F2] focus:!bg-[#FEF2F2]'
                      : ''
                  }`}
                />
                {errors?.comments && (
                  <span className='text-[12px] text-red-400'>
                    {errors.comments}
                  </span>
                )}
              </div>

              {/* Attachments Section */}
              <div className='mt-4 px-6'>
                <label className='text-[13px] text-[#2D3E4F] font-semibold leading-[21px] mb-2 block'>
                  Attachments
                </label>

                <div className='flex flex-col items-center justify-center gap-4'>
                  <div
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onClick={openFileDialog}
                    className={`h-[116px] w-full border-[2px] border-dashed rounded-[8px] flex flex-col items-center justify-center gap-2 cursor-pointer
                      ${message?.type === 'error' ? 'border-red-600 bg-[#FEF2F2]' : 'border-[#0176D3] bg-[#F4F6F9]'}
                    `}
                  >
                    <React.Suspense fallback={null}>
                      <UploadIcon
                        alt='Upload Icon'
                        className='w-[36px] h-[24px]'
                      />
                    </React.Suspense>
                    <div
                      className='text-[14px] text-[#0B0B0B]'
                      style={{ whiteSpace: 'nowrap' }}
                    >
                      Drag your file or{' '}
                      <span
                        className='text-[#0176D3] underline'
                        onClick={(e) => {
                          e.stopPropagation();
                          openFileDialog();
                        }}
                      >
                        browse
                      </span>
                    </div>
                    <input
                      type='file'
                      accept='image/*,.eml,.msg,.pdf,.txt,.doc,.docx,.xls,.xlsx'
                      className='hidden'
                      ref={fileInputRef}
                      onChange={handleFileSelect}
                      multiple
                    />
                  </div>

                  {/* Error messages */}
                  <div className='w-full'>
                    {message && (
                      <div
                        className={`text-sm ${
                          message.type === 'error'
                            ? 'text-red-600'
                            : 'text-green-600'
                        }`}
                      >
                        {message.text}
                      </div>
                    )}
                  </div>

                  <div className='w-full'>
                    <FileList
                      fileInputRef={fileInputRef}
                      selectedFiles={selectedFiles}
                      setSelectedFiles={setSelectedFiles}
                      existingFiles={[]}
                      onRemoveExistingFile={() => {}}
                      disabled={false}
                      className='w-full'
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className='border-t border-[#CBD6E2] px-6 py-4 flex gap-3 justify-end'>
            <TextButton
              label='Cancel'
              onClick={handleClose}
              disabled={isClosing}
              sx={{
                width: '75px',
                minWidth: '75px',
                fontSize: '13px',
                fontWeight: 400,
              }}
            />
            <TextButton
              label='Save'
              onClick={handleSubmit}
              loading={isClosing}
              sx={{
                width: '65px',
                minWidth: '65px',
                fontSize: '13px',
                fontWeight: 400,
              }}
            />
          </div>
        </Box>
      </Modal>
    </React.Suspense>
  );
};

export default CloseCaseModal;
