import React, { useEffect, useRef, useState } from 'react';
import ActionImportDropdown from './importdropdown';
import { ImportIcon, UploadIcon } from '../../../../../assets';
import TextButton from '../../../../../components/button/text-button';
import { uploadImportFile } from '../../../../services/import';
import { UploadImportPayload } from '../../../../../common-service';
import { useToast } from '../../../../../hooks';

interface OverviewProps {
  accountNo?: string | undefined;
  accountId?: string | undefined;
  accountInActive?: boolean;
}

const MAX_FILE_SIZE_MB = 50;

const Overview: React.FC<OverviewProps> = ({
  accountNo,
  accountId,
  accountInActive,
}) => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [message, setMessage] = useState<{
    type: 'error' | 'success';
    text: string;
  } | null>(null);
  const auth = localStorage.getItem('auth');
  const { userId } = auth ? JSON.parse(auth) : {};
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [entityType, setEntityType] = useState<string>('Select Type');
  const [fiscalYear, setFiscalYear] = useState<string>('Year');
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (
      message?.type === 'error' &&
      entityType !== 'Select Type' &&
      fiscalYear !== 'Select Year' &&
      selectedFiles.length > 0
    ) {
      setMessage(null);
    }
  }, [entityType, fiscalYear, selectedFiles]);

  const { successToast, errorToast } = useToast();
  const menuItems = [
    { label: 'Resource', onClick: () => setEntityType('Resource') },
    { label: 'Resource Cost', onClick: () => setEntityType('Resource Cost') },
    { label: 'Resource Skill', onClick: () => setEntityType('Resource Skill') },
    { label: 'Project', onClick: () => setEntityType('Project') },
    {
      label: 'Project Resource',
      onClick: () => setEntityType('Project Resource'),
    },
  ];

  const currentYear = new Date().getFullYear();

  const fiscalYears = Array.from(
    { length: currentYear - 2000 + 1 },
    (_, index) => {
      const year = currentYear - index;
      return {
        label: `FY-${year}`,
        onClick: () => setFiscalYear(year.toString()),
      };
    }
  );

  const showError = (text: string) => {
    setMessage({ type: 'error', text });
  };

  const showSuccess = (text: string) => {
    setMessage({ type: 'success', text });
  };
  const ACCEPTED_FILE_TYPES = [
    'text/csv',
    'application/vnd.ms-excel', // .xls
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
  ];

  const validateFiles = (files: FileList | null): File[] => {
    if (!files) return [];

    const validFiles: File[] = [];

    for (const file of Array.from(files)) {
      const isAcceptedType =
        ACCEPTED_FILE_TYPES.includes(file.type) ||
        /\.(csv|xls|xlsx)$/i.test(file.name);

      if (!isAcceptedType) {
        showError(`"${file.name}" is not a valid CSV or Excel file.`);
        continue;
      }

      if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
        showError(`"${file.name}" exceeds the 50MB limit.`);
        continue;
      }

      validFiles.push(file);
    }

    return validFiles;
  };

  const handleSubmit = async () => {
    if (entityType === 'Select Type') {
      showError('Please select an Entity Type.');
      return;
    }

    if (fiscalYear === 'Year') {
      showError('Please select a Fiscal Year.');
      return;
    }

    if (selectedFiles.length === 0) {
      showError('Please select a file before submitting.');
      return;
    }

    if (!accountId || !accountNo) {
      showError('Missing account information.');
      return;
    }

    const file = selectedFiles[0];
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      showError(
        `"${file.name}" exceeds the 50MB limit. Please upload a smaller file.`
      );
      return;
    }

    try {
      const payload: UploadImportPayload = {
        entity_type: entityType,
        file: selectedFiles[0],
        fiscal_year: fiscalYear,
        account_rid: accountId,
        related_to: 'account',
        related_to_rid: accountId,
        uploaded_by_user_rid: userId,
        account_r_number: accountNo,
      };
      setLoading(true);
      const response = await uploadImportFile(payload);
      if (
        response?.data.statusCode === 201 ||
        response?.data.statusCode === 200
      ) {
        successToast(response.data.message);
        fileInputRef.current!.value = '';
        setSelectedFiles([]);
        setEntityType('Select Type');
        setFiscalYear('Year');
        setLoading(false);
        setMessage(null);
      } else if (response?.data.statusCode === 400) {
        errorToast(response.data.message);
        setLoading(false);
      }
    } catch (error) {
      console.error('Upload failed:', error);
      showError('Failed to upload the file.');
      setLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const validFiles = validateFiles(e.target.files);
    if (validFiles.length > 0) {
      setSelectedFiles(validFiles);
      showSuccess(`File "${validFiles[0].name}" added successfully.`);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const validFiles = validateFiles(e.dataTransfer.files);

    if (validFiles.length > 0) {
      setSelectedFiles((prevFiles) => [...prevFiles, ...validFiles]);
      showSuccess(`File "${validFiles[0].name}" added successfully.`);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };
  const goBack = () => {
    window.history.back();
  };
  return (
    <div className='h-auto border border-[#CBD6E2] flex flex-col'>
      <div className='h-[50px] px-4 border-b border-[#CBD6E2] flex items-center justify-between'>
        <div className='flex items-center gap-2'>
          <ImportIcon
            alt='Import Icon'
            className='w-[24px] h-[24px]'
          />
          <span className='font-normal text-[14px] text-[#000000] '>
            Import
          </span>
        </div>
        <div className='flex gap-2'>
          <TextButton
            label='Cancel'
            onClick={goBack}
            sx={{
              width: '75px',
              minWidth: '75px',
              fontWeight: 400,
              fontSize: '13px',
            }}
          />
          <TextButton
            label='Save'
            loading={loading}
            onClick={handleSubmit}
            disabled={accountInActive}
            sx={{
              width: '64px',
              minWidth: '64px',
              fontWeight: 400,
              fontSize: '13px',
            }}
          />
        </div>
      </div>
      <div className='h-[50px] px-4 border-b border-[#CBD6E2] flex items-center gap-6'>
        <div className='flex items-center gap-2'>
          <label className='font-normal text-[14px] text-[#2D3E4F]'>
            Entity Type
            <span className='text-red-500 ml-1'>*</span>
          </label>
          <ActionImportDropdown actions={menuItems} label={entityType} />
        </div>
        <div className='flex items-center gap-2'>
          <label className='font-normal text-[14px] text-[#2D3E4F]'>
            Fiscal Year
            <span className='text-red-500 ml-1'>*</span>
          </label>
          <ActionImportDropdown
            actions={fiscalYears}
            label={`FY -${fiscalYear}`}
          />
        </div>
      </div>

      <div className='flex flex-col items-center justify-center gap-4 px-4 py-10'>
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onClick={openFileDialog}
          className={`h-[116px] w-[502px] border-[2px] border-dashed rounded-[8px] flex flex-col items-center justify-center gap-2 bg-[#F4F6F9] ${
            accountInActive
              ? 'border-gray-300 cursor-not-allowed opacity-50'
              : 'border-[#0176D3] cursor-pointer'
          }`}
        >
          <UploadIcon
            alt='Upload Icon'
            className='w-[36px] h-[24px]'
          />
          <div className='text-[14px] text-[#0B0B0B]'>
            Drag your file(s) or{' '}
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
            accept='.csv, application/vnd.ms-excel, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            className='hidden'
            ref={fileInputRef}
            onChange={handleFileSelect}
            disabled={accountInActive}
          />
        </div>

        {message && (
          <div
            className={`w-[502px] mt-2 text-sm ${
              message.type === 'error' ? 'text-red-600' : 'text-green-600'
            }`}
          >
            {message.text}
          </div>
        )}

        {/* {selectedFiles.length > 0 && (
          <div className='flex items-center justify-center font-[14px]  text-[#2D3E4F]'>
            <div className='pr-2'>Selected File:- </div>
            <div>{selectedFiles[0].name}</div>
          </div>
        )} */}
      </div>
    </div>
  );
};

export default Overview;
