import React, { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { FieldErrors, FormBuilder } from './formBuilder';
import { Attachment, UploadIcon } from '../../assets';
import TextButton from '../button/text-button';
import { useToast } from '../../hooks';
import { attachmentFileUpload } from '../../consultant/services/attachments/attachments-service';
import { SelectOption } from '../../consultant/types';
import { getFormFields, shouldShowField, validateField } from './helpers';

type FormData = {
  [key: string]: string | null;
};

interface FieldOptionType {
  fiscalYears: SelectOption[];
  docCategories: SelectOption[];
  docTypes: SelectOption[];
}
interface UploadsProps {
  accountId?: string | undefined | null;
  attachID?: string | undefined | null;
  accountInActive?: boolean;
  fieldOptions: FieldOptionType;
}

const MAX_FILE_SIZE_MB = 20;
const RESTRICTED_EXTENSIONS = /\.(exe|bat|cmd|sh|bash)$/i;

const Uploads: React.FC<UploadsProps> = ({
  attachID,
  accountId,
  accountInActive,
  fieldOptions,
}) => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [formData, setFormData] = useState<FormData>({});
  const [message, setMessage] = useState<{
    type: 'error' | 'success';
    text: string;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [entityType, setEntityType] = useState<string | null>('Select Type');
  const [loading, setLoading] = useState<boolean>(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const location = useLocation();
  const { successToast, errorToast } = useToast();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const extractedEntityType = params.get('attachment_entity');
    setEntityType(extractedEntityType);
  }, [location.search]);

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

  const goBack = () => {
    window.history.back();
  };

  const formFields = getFormFields(
    fieldOptions.fiscalYears,
    fieldOptions.docCategories,
    fieldOptions.docTypes
  );

  const handleSubmit = async () => {
    const newErrors: FieldErrors = {};
    formFields.forEach((field) => {
      if (shouldShowField(field, formData, formFields)) {
        const error = validateField(
          field.id,
          formData[field.id] ?? '',
          formFields
        );
        newErrors[field.id] = error;
      } else {
        newErrors[field.id] = null;
      }
    });
    setFieldErrors(newErrors);
    const hasErrors = Object.values(newErrors).some((e) => e);
    if (hasErrors) {
      return;
    }
    if (selectedFiles.length === 0) {
      showError('Please select a file before submitting.');
      return;
    }

    const file = selectedFiles[0];
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      showError(
        `"${file.name}" exceeds the 50MB limit. Please upload a smaller file.`
      );
      return;
    }
    setLoading(true);

    try {
      const payload = {
        attachment: selectedFiles[0],
        account_rid: accountId,
        attach_to: attachID,
        attachment_level: entityType,
        fiscal_year: formData?.fiscal_year,
        document_category_rid: formData?.document_category_rid,
        document_type_rid: formData?.document_type_rid,
        document_category_others: formData?.document_category_other || '',
        document_type_others: formData?.document_type_others || '',
        comments: String(formData?.comments || '').trim(),
      };
      const response = await attachmentFileUpload(payload);
      if (response?.data.statusCode === 200) {
        successToast(response.data.statusMessage);
        fileInputRef.current!.value = '';
        setSelectedFiles([]);
        setFormData({});
        setMessage(null);
        setLoading(false);
        goBack();
      } else if (response?.data.statusCode === 400) {
        errorToast(response.data.statusMessage);
        setLoading(false);
      }
    } catch (error) {
      errorToast(
        error instanceof Error ? error.message : 'Failed to upload the file.'
      );
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

  return (
    <div className='h-auto border border-[#CBD6E2] flex flex-col'>
      <div className='h-[38px] py-1 px-2 border-b border-[#CBD6E2] flex items-center justify-between'>
        <div className='flex items-center gap-1'>
          <Attachment alt='Import Icon' className='w-6 h-6' />
          <span className='text-[13px] text-[#2D3E4F] font-semibold'>
            Attachments
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
            disabled={loading}
            sx={{
              width: '64px',
              minWidth: '64px',
              fontWeight: 400,
              fontSize: '13px',
            }}
          />
        </div>
      </div>
      <div style={{ pointerEvents: loading ? 'none' : 'all' }}>
        <div className='flex items-center align-middle px-4 h-[30px] border-b border-[#CBD6E2] text-[#2D3E4F] text-[14px] font-bold bg-[#ECECEC]'>
          {'Document Info'}
        </div>
        <FormBuilder
          fieldOptions={fieldOptions}
          formData={formData}
          setFormData={setFormData}
          onFormChange={(data) => {
            setFormData(data);
          }}
          fieldErrors={fieldErrors}
          setFieldErrors={setFieldErrors}
        />
        <div className='flex flex-col border-t border-[#cbd6e2] items-center justify-center gap-4 px-4 py-10'>
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
              className={`w-[502px] mt-2 text-sm ${
                message.type === 'error' ? 'text-red-600' : 'text-green-600'
              }`}
            >
              {message.text}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Uploads;
