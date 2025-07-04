import React, { useRef, useState } from 'react';
import TextButton from '../../../../../components/button/text-button';
import { UploadIcon } from '../../../../../assets';
import { useToast } from '../../../../../hooks';
import { uploadAttachmentFile } from '../../../../services/attachments/attachments-service';

interface UploadPopupProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const UploadPopup: React.FC<UploadPopupProps> = ({
  isOpen,
  //   onConfirm,
  onCancel,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [message, setMessage] = useState<{
    type: 'error' | 'success';
    text: string;
  } | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const { successToast, errorToast } = useToast();
  const showSuccess = (text: string) => {
    setMessage({ type: 'success', text });
  };
  const showError = (text: string) => {
    setMessage({ type: 'error', text });
  };
  const ACCEPTED_FILE_TYPES = [
    'text/csv',
    'application/vnd.ms-excel', // .xls
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
  ];
  const MAX_FILE_SIZE_MB = 50;
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
  const handleClose = () => {
    setSelectedFiles([]);
    setMessage(null);
    onCancel();
  };
  const handleSubmit = async () => {
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

    try {
      const payload = {};
      setLoading(true);
      const response = await uploadAttachmentFile(payload);
      if (
        response?.data.statusCode === 201 ||
        response?.data.statusCode === 200
      ) {
        successToast(response.data.message);
        fileInputRef.current!.value = '';
        setSelectedFiles([]);
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
  if (!isOpen) return null;

  return (
    <div
      className='fixed inset-0 flex items-center justify-center'
      style={{ backgroundColor: 'rgb(30 28 28 / 50%)', zIndex: 99999 }}
    >
      <div className='bg-white rounded-lg  max-w-[570px] w-full mx-4'>
        <div className='p-4 font-lexend font-medium text-[16px] leading-5 text-[#2D3E4F] tracking-normal'>
          Upload
        </div>
        <div className='flex flex-col items-center border-y border-[#CBD6E2] justify-center gap-4  py-10'>
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onClick={openFileDialog}
            className={`h-[116px] w-[510px] border-[2px] border-dashed rounded-[8px] flex flex-col items-center justify-center gap-2 bg-[#F4F6F9]  border-[#0176D3] cursor-pointer`}
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
        <div className='flex justify-end gap-4 p-3'>
          <TextButton
            label='Cancel'
            onClick={handleClose}
            sx={{
              width: '64px',
              minWidth: '64px',
              fontWeight: 400,
              fontSize: '13px',
              height: '32px',
            }}
          />
          <TextButton
            label='Save'
            color='inherit'
            loading={loading}
            onClick={handleSubmit}
            sx={{
              width: '56px',
              minWidth: '56px',
              fontWeight: 400,
              fontSize: '12px',
              height: '32px',
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default UploadPopup;
