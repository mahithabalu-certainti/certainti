import React, { useState, useRef } from 'react';

import { UploadIcon } from '../../../../../../../assets';
import TextButton from '../../../../../../../components/button/text-button';
import { FileList } from '../../../../../../../components';
import { useToast } from '../../../../../../../hooks';
import { useSignOffFinancialHighlights } from '../../../../../../services/case-dossier/cases-financial-services';

interface SignOffModalProps {
  isOpen: boolean;
  onClose: () => void;
  caseId: string;
  accountId: string;
  refetchCaseDetails: () => void;
}

// File validation constants
const MAX_FILE_SIZE_MB = 100;
const RESTRICTED_EXTENSIONS = /\.(exe|bat|cmd|sh|bash)$/i;

// Accepted file types: images (all types), email (.eml), PDF, and text files
const ACCEPTED_FILE_TYPES = [
  // Images
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/bmp',
  'image/webp',
  'image/svg+xml',
  'image/tiff',
  // Email
  'message/rfc822', // .eml
  // PDF
  'application/pdf',
  // Text
  'text/plain',
];

const SignOffModal: React.FC<SignOffModalProps> = ({
  isOpen,
  onClose,
  caseId,
  accountId,
  refetchCaseDetails,
}) => {
  const [signOffFile, setSignOffFile] = useState<File | null>(null);
  const [signOffComments, setSignOffComments] = useState<string>('');
  const [commentError, setCommentError] = useState(false);
  const [message, setMessage] = useState<{
    type: 'error' | 'success';
    text: string;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { successToast, errorToast } = useToast();
  const { mutate: signOff, isPending: isSigningOff } =
    useSignOffFinancialHighlights();

  // File validation function
  const validateFile = (file: File): boolean => {
    // Check file type
    const isAcceptedType =
      ACCEPTED_FILE_TYPES.includes(file.type) ||
      /\.(jpg|jpeg|png|gif|bmp|webp|svg|tiff|eml|pdf|txt)$/i.test(file.name);

    if (!isAcceptedType) {
      showError(
        `"${file.name}" is not a valid file. Only images, .eml, .pdf, or .txt files are allowed.`
      );
      return false;
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      showError(`"${file.name}" exceeds the ${MAX_FILE_SIZE_MB}MB limit.`);
      return false;
    }

    // Check restricted extensions
    if (RESTRICTED_EXTENSIONS.test(file.name)) {
      showError(
        `"${file.name}" type is not allowed (.exe, .bat, .cmd, .sh, .bash).`
      );
      return false;
    }

    return true;
  };

  const showError = (text: string) => {
    setMessage({ type: 'error', text });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow if no file is currently uploaded
    if (signOffFile) {
      return;
    }

    setMessage(null);
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0]; // Only take the first file
      if (validateFile(file)) {
        setSignOffFile(file);
      }
    }
    // Reset input value to allow re-selecting the same file after removal
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();

    // Only allow if no file is currently uploaded
    if (signOffFile) {
      return;
    }

    setMessage(null);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0]; // Only take the first file
      if (validateFile(file)) {
        setSignOffFile(file);
      }
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const openFileDialog = () => {
    // Only allow if no file is currently uploaded
    if (signOffFile) {
      return;
    }
    fileInputRef.current?.click();
  };

  const handleRemoveFile = () => {
    setSignOffFile(null);
    setMessage(null);
    // Reset input value
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSignOffSubmit = async () => {
    if (!signOffComments.trim()) {
      setCommentError(true);
    }

    if (!signOffComments.trim()) {
      return;
    }

    // File validation only if file is selected
    if (signOffFile) {
      if (signOffFile.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
        showError(
          `"${signOffFile.name}" exceeds the ${MAX_FILE_SIZE_MB}MB limit. Please upload a smaller file.`
        );
        return;
      }
    }

    setCommentError(false);
    try {
      signOff(
        {
          case_rid: caseId,
          account_rid: accountId,
          sign_off: true,
          file: signOffFile,
          comments: signOffComments,
        },
        {
          onSuccess: (response: { statusMessage?: string }) => {
            successToast(response?.statusMessage || 'Signed off successfully');
            setSignOffFile(null);
            setSignOffComments('');
            setMessage(null);
            refetchCaseDetails();
            onClose();
          },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          onError: (error: any) => {
            errorToast(
              error?.response?.data?.statusMessage || 'Failed to approve'
            );
          },
        }
      );
    } catch {
      errorToast('Failed to process file');
    }
  };

  const handleClose = () => {
    setSignOffFile(null);
    setSignOffComments('');
    setCommentError(false);
    setMessage(null);
    onClose();
  };

  if (!isOpen) return null;

  // Check if file is uploaded to disable upload area
  const isFileUploaded = signOffFile !== null;

  return (
    <div
      className='fixed inset-0 flex justify-center items-center bg-black/50 overflow-y-auto pt-10 pb-10'
      style={{ zIndex: 9999 }}
    >
      <div className='bg-white rounded-lg shadow-lg w-[530px] min-h-[500px] flex flex-col'>
        {/* Header Section */}
        <div className='flex justify-between items-center border-b border-[#CBD6E2] px-[12px] py-[2px]'>
          <h2 className='text-[#2D3E4F] text-[16px] p-1 font-semibold'>
            Financial Workings
          </h2>
        </div>

        {/* Content Section */}
        <div className='p-4 flex-1 flex flex-col gap-3'>
          {/* Comments Section */}
          <div className='flex flex-col gap-2'>
            <label className='text-[13px] font-semibold text-[#2D3E4F]'>
              Comments <span style={{ color: 'red' }}>*</span>
            </label>
            <textarea
              rows={6}
              className={`w-full min-h-[120px] max-h-[120px] overflow-auto p-2 text-[13px] resize-none border rounded-md focus:outline-none focus:ring-1 transition-all ${
                commentError
                  ? 'border-red-500 focus:ring-red-500 bg-[#FEF2F2]'
                  : 'border-[#CBD6E2] focus:ring-[#0176D3]'
              }`}
              placeholder='Enter your comments here...'
              value={signOffComments}
              onChange={(e) => {
                setSignOffComments(e.target.value);
                if (e.target.value.trim()) setCommentError(false);
              }}
            />
            {commentError && (
              <span className='text-red-500 text-[11px]'>
                Field is required
              </span>
            )}
          </div>

          {/* File Upload Section */}
          <div className='flex flex-col gap-2'>
            <span className='text-[13px] font-semibold text-[#2D3E4F]'>
              Attachment
            </span>
            <div className='flex flex-col items-center justify-center gap-2'>
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onClick={openFileDialog}
                className={`h-[116px] w-full border-[2px] border-dashed rounded-[8px] flex flex-col items-center justify-center gap-2 transition-all
                    ${
                      isFileUploaded
                        ? 'cursor-default opacity-80 bg-[#F4F6F9] border-[#0176D3]'
                        : message?.type === 'error'
                          ? 'border-red-600 bg-[#FEF2F2] cursor-pointer'
                          : 'border-[#0176D3] bg-[#F4F6F9] cursor-pointer hover:bg-[#E8F0FE]'
                    }
                  `}
                style={{
                  pointerEvents: isFileUploaded ? 'none' : 'auto',
                }}
              >
                <React.Suspense fallback={null}>
                  <UploadIcon
                    alt='Upload Icon'
                    className={`w-[36px] h-[24px] ${isFileUploaded ? 'opacity-50' : ''}`}
                  />
                </React.Suspense>
                <div
                  className={`text-[14px] ${isFileUploaded ? 'text-gray-400' : 'text-[#0B0B0B]'}`}
                  style={{ whiteSpace: 'nowrap' }}
                >
                  Drag your file or{' '}
                  <span
                    className={`underline ${isFileUploaded ? 'text-gray-400' : 'text-[#0176D3]'}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!isFileUploaded) {
                        openFileDialog();
                      }
                    }}
                  >
                    browse
                  </span>
                </div>
                <input
                  type='file'
                  accept='.jpg,.jpeg,.png,.gif,.bmp,.webp,.svg,.tiff,.eml,.pdf,.txt,image/*'
                  className='hidden'
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  disabled={isFileUploaded}
                />
              </div>

              <div className='w-full mt-1'>
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

              <div className='max-h-[150px] overflow-y-auto w-full'>
                <FileList
                  fileInputRef={fileInputRef}
                  selectedFiles={signOffFile ? [signOffFile] : []}
                  setSelectedFiles={(files) => {
                    if (files.length === 0) {
                      handleRemoveFile();
                    }
                  }}
                  existingFiles={[]}
                  onRemoveExistingFile={() => {}}
                  disabled={false}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Action Section */}
        <div className='border-t border-[#CBD6E2] px-6 py-4 flex gap-3 justify-end'>
          <TextButton
            label='Cancel'
            onClick={handleClose}
            sx={{
              width: '75px',
              minWidth: '75px',
              fontSize: '13px',
              fontWeight: 400,
            }}
          />
          <TextButton
            label='Approve'
            loading={isSigningOff}
            onClick={handleSignOffSubmit}
            disabled={isSigningOff}
            sx={{
              width: '85px',
              minWidth: '85px',
              fontSize: '13px',
              fontWeight: 400,
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default SignOffModal;
