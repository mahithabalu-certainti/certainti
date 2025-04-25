import React, { useEffect, useRef, useState } from 'react';
import ActionImportDropdown from './importdropdown';
import { importIcon, uploadIcon } from '../../../../../assets';
import TextButton from '../../../../../components/button/text-button';
import { uploadImportFile } from '../../../../services/import';
import { UploadImportPayload } from '../../../../../common-service';
import { useToast } from '../../../../../hooks';

interface OverviewProps {
  accountNo?: string | undefined;
  accountId?: string | undefined;
}

const MAX_FILE_SIZE_MB = 50;
const Overview: React.FC<OverviewProps> = ({ accountNo, accountId }) => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [message, setMessage] = useState<{
    type: 'error' | 'success';
    text: string;
  } | null>(null);
    const auth = localStorage.getItem('auth');
    const {  userId } = auth ? JSON.parse(auth) : {};
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [entityType, setEntityType] = useState<string>('Select Type');
  const [fiscalYear, setFiscalYear] = useState<string>('Select Year');


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

  const { successToast ,errorToast} = useToast();
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

  const fiscalYears = Array.from({ length: 6 }, (_, i) => {
    const year = new Date().getFullYear() - i;
    return {
      value: year.toString(),
      label: `FY-${year}`,
      onClick: () => setFiscalYear(year.toString()),
    };
  });

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

    if (fiscalYear === 'Select Year') {
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

 const response  = await uploadImportFile(payload);
 console.log(response)
      successToast('File uploaded successfully.');
    } catch (error) {
      console.error('Upload failed:', error);
      showError('Failed to upload the file.');
      errorToast('Failed to upload the file.');
    }
  };


  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const validFiles = validateFiles(e.target.files);
    if (validFiles.length > 0) {
      setSelectedFiles(validFiles);
      showSuccess(`File "${validFiles[0].name}" uploaded successfully.`);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const validFiles = validateFiles(e.dataTransfer.files);
    if (validFiles.length > 0) {
      setSelectedFiles(validFiles);
      showSuccess(`File "${validFiles[0].name}" uploaded successfully.`);
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
          <img
            src={importIcon}
            alt='Import Icon'
            className='w-[24px] h-[24px]'
          />
          <span className='font-medium'>Import</span>
        </div>
        <div className='flex gap-2'>
          <TextButton
            label='Cancel'
            variant='outlined'
            color='inherit'
            onClick={goBack}
          />
          <TextButton label='Save' variant='filled' onClick={handleSubmit} />
        </div>
      </div>

      <div className='h-[50px] px-4  border-b border-[#CBD6E2] flex items-center gap-6'>
        <div className='flex items-center gap-2'>
          <label className='text-sm font-medium'>Entity Type</label>
          <ActionImportDropdown actions={menuItems} label={entityType} />
        </div>
        <div className='flex items-center gap-2'>
          <label className='text-sm font-medium'>Fiscal Year</label>
          <ActionImportDropdown actions={fiscalYears} label={fiscalYear} />
        </div>
      </div>

      <div className='flex flex-col items-center justify-center gap-4 px-4 py-10'>
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onClick={openFileDialog}
          className='h-[116px] w-[502px] border-[2px] border-dashed border-[#0176D3] flex flex-col items-center justify-center gap-2 cursor-pointer bg-[#F4F6F9]'
        >
          <img
            src={uploadIcon}
            alt='Upload Icon'
            className='w-[36px] h-[24px]'
          />
          <div>
            Drag your file(s) or{' '}
            <span
              className='text-[#0176D3] underline cursor-pointer'
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

        {selectedFiles.length > 0 && (
          <div className='w-[502px] mt-4 border-t border-gray-300 pt-2'>
            <div className='text-sm font-semibold mb-2'>Selected File:</div>
            <ul className='text-sm list-disc pl-5'>
              {selectedFiles.map((file, index) => (
                <li key={index}>{file.name}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default Overview;
