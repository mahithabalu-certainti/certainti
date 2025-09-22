import React, { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { AttachmentsSideIcon, UploadIcon } from '../../assets';
import TextButton from '../button/text-button';
import { useToast } from '../../hooks';
import { attachmentFileUpload } from '../../consultant/services/attachments/attachments-service';
import AttachmentForm from './attachment-from';
import { AttachmentUploadPayload } from '../../consultant/types/attachment';
import { FileList } from '../file-list';
interface UploadsProps {
  accountId: string | undefined | null;
  attachID: string | undefined | null;
  accountInActive?: boolean;
  onUploadSuccess?: () => void;
  projectFiscalYear?: number | string;
}

const MAX_FILE_SIZE_MB = 100;
const RESTRICTED_EXTENSIONS = /\.(exe|bat|cmd|sh|bash)$/i;

const ACCEPTED_FILE_TYPES = [
  'text/csv',
  'application/vnd.ms-excel', // .xls
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
  'application/pdf', // .pdf
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
  'image/png', // .png
  'image/jpeg', // .jpg
  'text/plain', // .txt
];

const Uploads: React.FC<UploadsProps> = ({
  attachID,
  accountId,
  accountInActive,
  onUploadSuccess,
  projectFiscalYear,
}) => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [message, setMessage] = useState<{
    type: 'error' | 'success';
    text: string;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [entityType, setEntityType] = useState<string | null>('Select Type');
  const [loading, setLoading] = useState<boolean>(false);

  const formRef = useRef<HTMLFormElement>(null);

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

  const handleSubmit = async (data: Partial<AttachmentUploadPayload>) => {
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
        account_rid: accountId || '',
        attach_to: attachID || '',
        attachment_level: entityType || '',
        fiscal_year: data?.fiscal_year || '',
        document_category_rid: data?.document_category_rid || '',
        document_type_rid: data?.document_type_rid || '',
        document_category_others: data?.document_category_others || '',
        document_type_others: data?.document_type_others || '',
        comments: data?.comments || '',
      };
      const response = await attachmentFileUpload(payload);
      if (response?.data.statusCode === 200) {
        successToast(response.data.statusMessage);
        fileInputRef.current!.value = '';
        setSelectedFiles([]);
        setMessage(null);
        setLoading(false);
        goBack();
        if (onUploadSuccess) {
          onUploadSuccess();
        }
      } else if (response?.data.statusCode === 400) {
        errorToast(response.data.statusMessage);
        setLoading(false);
      }
    } catch (error) {
      if (
        (error as { response?: { status?: number } })?.response?.status === 400
      ) {
        const message =
          (error as { response?: { data?: { statusMessage?: string } } })
            ?.response?.data?.statusMessage || 'Upload failed.';
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
      setSelectedFiles([validFiles[0]]);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (selectedFiles.length > 0) return;
    const validFiles = validateFiles(e.dataTransfer.files);
    if (validFiles.length > 0) {
      setSelectedFiles([validFiles[0]]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const openFileDialog = () => {
    if (selectedFiles.length === 0) {
      fileInputRef.current?.click();
    }
  };

  const handleExternalSubmit = () => {
    formRef.current?.requestSubmit();
  };

  return (
    <div className='h-auto border border-[#CBD6E2] flex flex-col mb-3'>
      <div className='h-[38px] py-1 px-2 border-b border-[#CBD6E2] flex items-center justify-between'>
        <div className='flex items-center gap-1'>
          <div className='w-[24px] h-[24px] flex items-center justify-center bg-[#D8E9FF] rounded-full'>
            <AttachmentsSideIcon
              alt='Import Icon'
              className='[&>path]:stroke-[#4B9BFF]'
            />
          </div>
          <span className='text-[13px] text-[#2D3E4F] font-semibold'>
            Attachments
          </span>
        </div>
      </div>
      <div style={{ pointerEvents: loading ? 'none' : 'all' }}>
        <AttachmentForm
          formRef={formRef}
          onFormSubmit={handleSubmit}
          projectFiscalYear={projectFiscalYear}
        />
        <div className='flex flex-col border-t border-[#cbd6e2] items-center justify-center gap-4 px-4 py-5'>
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onClick={openFileDialog}
            className={`h-[116px] w-[502px] border-[2px] border-dashed rounded-[8px] flex flex-col items-center justify-center gap-2
              ${selectedFiles.length > 0 ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              ${message?.type === 'error' ? 'border-red-600 bg-[#FEF2F2]' : 'border-[#0176D3] bg-[#F4F6F9]'}
            `}
            style={{
              pointerEvents: selectedFiles.length > 0 ? 'none' : 'all',
            }}
          >
            <UploadIcon alt='Upload Icon' className='w-[36px] h-[24px]' />
            <div className='text-[14px] text-[#0B0B0B]'>
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
              accept='.csv,.xls,.xlsx,.pdf,.docx,.png,.jpg,.txt'
              className='hidden'
              ref={fileInputRef}
              onChange={handleFileSelect}
              disabled={accountInActive}
            />
          </div>

          {/* Reserved space for error messages to prevent button movement */}
          <div className='w-[502px] max-w-[502px] mt-2 h-[20px]'>
            {message && (
              <div
                className={`break-all text-sm ${
                  message.type === 'error' ? 'text-red-600' : 'text-green-600'
                }`}
              >
                {message.text}
              </div>
            )}
          </div>

          <FileList
            fileInputRef={fileInputRef}
            selectedFiles={selectedFiles}
            setSelectedFiles={setSelectedFiles}
          />
        </div>
      </div>
      <div className='border-t border-[#CBD6E2] flex w-full justify-end gap-4 mb-3 pt-3 pr-3'>
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
          label='Upload'
          loading={loading}
          onClick={handleExternalSubmit}
          disabled={loading}
          sx={{
            width: '75px',
            minWidth: '75px',
            fontWeight: 400,
            fontSize: '13px',
          }}
        />
      </div>
    </div>
  );
};

export default Uploads;
