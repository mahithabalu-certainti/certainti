import React, { useState } from 'react';

import { UploadIcon, CloseIcon } from '../../../../../../../assets';
import TextButton from '../../../../../../../components/button/text-button';
import TruncateWithTooltip from '../../../../../../../components/truncate-with-tooltip/truncate-with-tooltip';
import { useToast } from '../../../../../../../hooks';
import { useSignOffFinancialHighlights } from '../../../../../../services/case-dossier/cases-financial-services';

interface SignOffModalProps {
  isOpen: boolean;
  onClose: () => void;
  caseId: string;
  accountId: string;
  refetchCaseDetails: () => void;
}

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
  const [fileError, setFileError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const { successToast, errorToast } = useToast();
  const { mutate: signOff, isPending: isSigningOff } =
    useSignOffFinancialHighlights();

  const allowedExtensions = ['txt', 'pdf', 'eml', 'png', 'jpg', 'jpeg'];

  const validateFile = (file: File) => {
    const extension = file.name.split('.').pop()?.toLowerCase();
    return extension && allowedExtensions.includes(extension);
  };

  const handleFileSelection = (file: File | null) => {
    setFileError(null);
    if (file) {
      if (validateFile(file)) {
        setSignOffFile(file);
      } else {
        setSignOffFile(null);
        setFileError(
          'Invalid file format. Allowed formats: .txt, .pdf, .eml, .png, .jpg, .jpeg'
        );
      }
    } else {
      setSignOffFile(null);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFileSelection(files[0]);
    }
  };

  const handleSignOffSubmit = async () => {
    if (!signOffComments.trim()) {
      setCommentError(true);
    }

    if (!signOffComments.trim() || fileError) {
      return;
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
            refetchCaseDetails();
            onClose();
          },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          onError: (error: any) => {
            errorToast(
              error?.response?.data?.statusMessage || 'Failed to sign off'
            );
          },
        }
      );
    } catch {
      errorToast('Failed to process file');
    }
  };

  const handleRemoveFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSignOffFile(null);
    setFileError(null);
  };

  const handleClose = () => {
    setSignOffFile(null);
    setSignOffComments('');
    setCommentError(false);
    setFileError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className='fixed inset-0 flex justify-center items-center bg-black/50 overflow-y-auto pt-10 pb-10'
      style={{ zIndex: 9999 }}
    >
      <div className='bg-white rounded-lg shadow-lg w-[500px] min-h-[450px] flex flex-col'>
        {/* Header Section */}
        <div className='flex justify-between items-center border-b border-[#CBD6E2] px-[12px] py-[2px]'>
          <h2 className='text-[#2D3E4F] text-[16px] p-1 font-semibold'>
            Sign Off Financial Highlights
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
              className={`w-full p-2 text-[13px] bg-[#F9FAFB] border rounded-md focus:outline-none focus:ring-1 transition-all ${
                commentError
                  ? 'border-red-500 focus:ring-red-500'
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
              <span className='text-red-500 text-[11px] mt-1'>
                Comments are required
              </span>
            )}
          </div>

          {/* File Upload Section */}
          <div className='flex flex-col gap-2'>
            <span className='text-[13px] font-semibold text-[#2D3E4F]'>
              Attach File
            </span>
            <div
              className={`border-2 border-dashed rounded-md p-3 flex flex-col items-center justify-center cursor-pointer transition-colors gap-2 relative ${
                fileError
                  ? 'border-red-500 bg-red-50'
                  : isDragging
                  ? 'border-[#0176D3] bg-[#F0F7FF]'
                  : 'border-[#CBD6E2] bg-[#F9FAFB] hover:bg-[#F4F6F9]'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() =>
                document.getElementById('sign-off-file-input')?.click()
              }
            >
              {signOffFile ? (
                <div className='flex items-center gap-2 max-w-full'>
                  <div className='flex-1 min-w-0'>
                    <TruncateWithTooltip
                      text={signOffFile.name}
                      maxWidth={200}
                      className='text-[13px] text-[#0176D3] font-medium'
                      enableCopy={false}
                    />
                  </div>
                  <CloseIcon
                    className='w-3 h-3 text-[#FF4D4F] hover:text-[#D9363E] cursor-pointer flex-shrink-0'
                    onClick={handleRemoveFile}
                  />
                </div>
              ) : (
                <>
                  <UploadIcon className='w-8 h-8 text-[#0176D3]' />
                  <span className='text-[13px] text-[#0176D3] underline'>
                    Click to browse or drag file here
                  </span>
                </>
              )}
              <input
                id='sign-off-file-input'
                type='file'
                className='hidden'
                accept='.txt,.pdf,.eml,.png,.jpg,.jpeg'
                onChange={(e) =>
                  handleFileSelection(e.target.files?.[0] || null)
                }
                onClick={(e) => ((e.target as HTMLInputElement).value = '')}
              />
            </div>
            {fileError && (
              <span className='text-red-500 text-[11px] mt-1'>{fileError}</span>
            )}
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
            label='Sign Off'
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
