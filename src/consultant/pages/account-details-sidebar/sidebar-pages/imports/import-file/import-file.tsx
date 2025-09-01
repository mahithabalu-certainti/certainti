import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useToast } from '../../../../../../hooks';
import {
  UploadImportPayload,
  useGetImportEntityTypes,
} from '../../../../../../common-service';
import { uploadImportFile } from '../../../../../services/import';
import { ImportsIcon, UploadIcon } from '../../../../../../assets';
import SectionHeader from '../../../../../../components/details-section/section-header';
import {
  ButtonDropdown,
  FileList,
  GlobalFiscalYearDropdown,
} from '../../../../../../components';

interface ImportFileProps {
  accountNo?: string | undefined;
  accountId?: string | undefined;
  accountInActive?: boolean;
  onUploadSuccess: () => void;
  handleShowUpload: () => void;
}

const MAX_FILE_SIZE_MB = 50;

const ImportFile: React.FC<ImportFileProps> = ({
  accountNo,
  accountId,
  accountInActive,
  onUploadSuccess,
  handleShowUpload,
}) => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [message, setMessage] = useState<{
    type: 'error' | 'success';
    text: string;
  } | null>(null);
  const auth = localStorage.getItem('auth');
  const { userId } = auth ? JSON.parse(auth) : {};
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [entityType, setEntityType] = useState<string>('');
  const [fiscalYear, setFiscalYear] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const { successToast, errorToast } = useToast();
  const entityTypes = useGetImportEntityTypes();

  useEffect(() => {
    if (
      message?.type === 'error' &&
      entityType !== '' &&
      fiscalYear !== '' &&
      selectedFiles.length > 0
    ) {
      setMessage(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entityType, fiscalYear, selectedFiles]);

  useEffect(() => {
    if (entityType === 'Resource' || entityType === 'Resource Skill') {
      setFiscalYear('');
    }
  }, [entityType]);

  const entityOptions = useMemo(
    () =>
      entityTypes.data?.data.map((type) => ({
        label: type.entity_name,
        value: type.entity_name,
      })) || [],
    [entityTypes.data?.data]
  );

  const currentYear = new Date().getFullYear();

  const fiscalYearsOptions: { label: string; value: string }[] = Array.from(
    { length: currentYear - 2000 + 1 },
    (_, index) => {
      const year = currentYear - index;
      return {
        label: `FY-${year}`,
        value: year.toString(),
      };
    }
  );

  const handleFiscalYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setFiscalYear(value);
  };

  const showError = (text: string) => {
    setMessage({ type: 'error', text });
  };

  const ACCEPTED_FILE_TYPES = [
    'text/csv',
    'application/vnd.ms-excel', // .xls
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
  ];

  const validateFiles = (files: FileList | null): File[] => {
    if (!files) return [];

    const validFiles: File[] = [];
    let hasError = false;

    for (const file of Array.from(files)) {
      if (/\s/.test(file.name)) {
        showError(
          `"${file.name}" is invalid. Filename must not contain spaces.`
        );
        hasError = true;
        continue;
      }

      const isAcceptedType =
        ACCEPTED_FILE_TYPES.includes(file.type) ||
        /\.(csv|xls|xlsx)$/i.test(file.name);

      if (!isAcceptedType) {
        showError(`"${file.name}" is not a valid CSV or Excel file.`);
        hasError = true;
        continue;
      }

      if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
        showError(`"${file.name}" exceeds the 50MB limit.`);
        hasError = true;
        continue;
      }

      validFiles.push(file);
    }

    if (!hasError && validFiles.length > 0) {
      setMessage(null);
    }

    return validFiles;
  };

  const handleSubmit = async () => {
    if (!entityType) {
      showError('Please select an Entity Type.');
      return;
    }

    if (
      !fiscalYear &&
      entityType !== 'Resource' &&
      entityType !== 'Resource Skill'
    ) {
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
      const currentYear = new Date().getFullYear();

      const payload: UploadImportPayload = {
        entity_type: entityType,
        file: file,
        fiscal_year:
          entityType === 'Resource' || entityType === 'Resource Skill'
            ? currentYear.toString()
            : fiscalYear,
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
        goBack();
        if (onUploadSuccess) {
          onUploadSuccess();
        }
      } else if (response?.data.statusCode === 400) {
        errorToast(response.data.message);
        setLoading(false);
      }
    } catch (error) {
      if (
        (error as { response?: { status?: number } })?.response?.status === 400
      ) {
        const message =
          (error as { response?: { data?: { detail: { message?: string } } } })
            ?.response?.data?.detail?.message || 'Failed to upload the file.';
        errorToast(message);
      } else {
        errorToast(
          error instanceof Error ? error.message : 'Failed to upload the file.'
        );
      }
      showError('Failed to upload the file.');
      setLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const validFiles = validateFiles(e.target.files);
    if (validFiles.length > 0) {
      setSelectedFiles(validFiles);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const validFiles = validateFiles(e.dataTransfer.files);

    if (validFiles.length > 0) {
      setSelectedFiles((prevFiles) => [...prevFiles, ...validFiles]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  const goBack = () => {
    handleShowUpload();
  };

  const headerButtons = [
    {
      label: 'Cancel',
      variant: 'outlined' as const,
      disabled: false,
      onClick: () => goBack(),
      sx: { width: '75px', minWidth: '75px' },
    },
    {
      label: 'Save',
      variant: 'outlined' as const,
      disabled: accountInActive,
      loading: loading,
      onClick: () => handleSubmit(),
      sx: { width: '64px', minWidth: '64px' },
    },
  ];

  return (
    <div className='h-auto border border-[#CBD6E2] flex flex-col rounded-tr-[2px] rounded-tl-[2px] '>
      <SectionHeader
        title='Imports'
        titleIcon={
          <ImportsIcon
            className='[&>path]:stroke-white'
            alt='Imports-header-icon'
          />
        }
        iconBg='#af78ff'
        bgType='circle'
        className='border-b border-[#CBD6E2] h-[40px]'
        buttons={headerButtons}
      />
      <div className='h-[38px] py-1 px-2 border-b border-[#CBD6E2] flex items-center gap-6'>
        <div className='flex items-center gap-2'>
          <label className='font-normal text-[14px] text-[#2D3E4F]'>
            Entity Type
            <span className='text-red-500 ml-1'>*</span>
          </label>
          <ButtonDropdown
            label='Select Type'
            options={entityOptions}
            disabled={entityTypes.isPending}
            selectedValue={entityType}
            onSelect={(value) => setEntityType(value)}
          />
        </div>
        <div className='flex items-center gap-2'>
          <label className='font-normal text-[14px] text-[#2D3E4F]'>
            Fiscal Year
            <span className='text-red-500 ml-1'>*</span>
          </label>
          <GlobalFiscalYearDropdown
            fiscalYear={fiscalYear}
            fiscalYearsOptions={fiscalYearsOptions}
            onChange={handleFiscalYearChange}
            placeholder='FY-Year'
            className='text-[#425A76] text-[13px] font-semibold border border-[#CBD6E2] shadow-[0px_1px_2px_0px_rgba(42,54,71,0.05)] bg-gradient-to-b from-[#FFFFFF] to-[#E4E6E7]'
            disabled={
              entityType === 'Resource' || entityType === 'Resource Skill'
            }
          />
        </div>
      </div>

      <div
        className={`flex flex-col items-center justify-center gap-4 px-4 py-10 ${accountInActive ? 'opacity-50' : ''}`}
        style={{ pointerEvents: accountInActive || loading ? 'none' : 'all' }}
      >
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onClick={openFileDialog}
          className={`h-[116px] w-[502px] border-[2px] border-dashed rounded-[8px] flex flex-col items-center justify-center gap-2  ${
            message && message.type === 'error'
              ? 'border-red-600 bg-[#FEF2F2] cursor-pointer'
              : 'border-[#0176D3] bg-[#F4F6F9] cursor-pointer'
          }`}
        >
          <UploadIcon alt='Upload Icon' className='w-[36px] h-[24px]' />
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
            className={`w-[502px] max-w-[502px] mt-2 break-all text-sm ${
              message.type === 'error' ? 'text-red-600' : 'text-green-600'
            }`}
          >
            {message.text}
          </div>
        )}

        <FileList
          fileInputRef={fileInputRef}
          selectedFiles={selectedFiles}
          setSelectedFiles={setSelectedFiles}
        />
      </div>
    </div>
  );
};

export default ImportFile;
