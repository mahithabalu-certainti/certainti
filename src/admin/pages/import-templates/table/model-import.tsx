import { useRef, useState } from 'react';
import { UploadIcon } from '../../../../assets';
import { FileList } from '../../../../components';
import TextButton from '../../../../components/button/text-button';
import { useToast } from '../../../../hooks';
import { importTemplateFileUpload } from '../../../service/import-template/template';

interface ModelTableProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  templateId: string;
  onUploadSuccess?: () => void;
}

const ImportModel: React.FC<ModelTableProps> = ({
  isOpen,
  onClose,
  title,
  templateId,
  onUploadSuccess,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: 'error' | 'success';
    text: string;
  } | null>(null);
  const { successToast, errorToast } = useToast();
  const showError = (text: string) => {
    setMessage({ type: 'error', text });
    setSelectedFiles([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
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
    let hasError = false;

    for (const file of Array.from(files)) {
      if (/\s/.test(file.name)) {
        showError(
          `"${file.name}" is invalid. File name must not contain spaces.`
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
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const validFiles = validateFiles(e.target.files);
    if (validFiles.length > 0) {
      setSelectedFiles([validFiles[0]]);
    }
  };
  const handleSubmit = async () => {
    if (selectedFiles.length === 0) {
      showError('Please select a file before submitting.');
      return;
    }

    const file = selectedFiles[0];
    const allowedTypes = [
      'application/vnd.ms-excel', // .xls
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
    ];

    if (!allowedTypes.includes(file.type)) {
      showError('Only Excel files (.xls, .xlsx) are allowed.');
      return;
    }
    setLoading(true);

    try {
      const payload = {
        file: selectedFiles[0],
        templateId: templateId || '',
      };
      const response = await importTemplateFileUpload(payload);
      if (response?.data.statusCode === 200) {
        successToast(response.data.statusMessage);
        fileInputRef.current!.value = '';
        setSelectedFiles([]);
        setMessage(null);
        setLoading(false);
        handleClose();
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

  const handleClose = () => {
    onClose();
    setSelectedFiles([]);
    setMessage(null);
    setLoading(false);
    fileInputRef.current!.value = '';
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (selectedFiles.length > 0) return;
    const validFiles = validateFiles(e.dataTransfer.files);
    if (validFiles.length > 0) {
      setSelectedFiles([validFiles[0]]);
    }
  };
  const openFileDialog = () => {
    if (selectedFiles.length === 0) {
      fileInputRef.current?.click();
    }
  };
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };
  if (!isOpen) return null;

  return (
    <div
      className='fixed inset-0 flex justify-center items-center bg-black/50'
      style={{ zIndex: 999 }}
    >
      <div
        className='bg-white rounded-lg shadow-lg  w-[60%] p-5'
        style={{ minHeight: 'calc(100vh - 520px)' }}
      >
        <div className='flex justify-between  items-center pb-1 border-b border-[#CBD6E2]'>
          <h2 className='text-[16px] font-bold text-[#2D3E4F]'>{title}</h2>
        </div>
        {/* <div style={{ pointerEvents: loading ? 'none' : 'all' }}> */}
        <div className='flex flex-col items-center justify-center gap-4 px-4 py-5 mt-6'>
          <div
            className={`flex flex-col items-center justify-center gap-4 px-4}`}
          >
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
                accept='.csv, application/vnd.ms-excel, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                className='hidden'
                ref={fileInputRef}
                onChange={handleFileSelect}
                disabled={false}
              />
            </div>

            {/* Reserved space for error messages to prevent button movement */}
            <div className='w-[502px] max-w-[502px] mt-2'>
              {message && (
                <div
                  className={`text-sm ${
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

            {/* Button section with top border and reduced bottom spacing */}
          </div>
        </div>
        {/* </div> */}
        <div className='border-t border-[#CBD6E2]  flex w-full justify-end gap-4 pt-3 pr-3'>
          <TextButton
            label='Cancel'
            onClick={handleClose}
            disabled={false}
            sx={{ width: '75px', minWidth: '75px' }}
          />
          <TextButton
            label='Upload'
            onClick={handleSubmit}
            disabled={false}
            sx={{ width: '75px', minWidth: '75px' }}
            loading={loading}
          />
        </div>
      </div>
    </div>
  );
};
export default ImportModel;
