import React, { useState } from 'react';

import {  UploadIcon,
  CloseIcon,
} from '../../../../../../../assets';
import TextButton from '../../../../../../../components/button/text-button';
import { useToast } from '../../../../../../../hooks';
import { useSignOffFinancialHighlights } from '../../../../../../services/case-dossier/cases-financial-services';

interface SignOffModalProps {
  isOpen: boolean;
  onClose: () => void;
  caseId: string;
  accountId: string;
}

const SignOffModal: React.FC<SignOffModalProps> = ({
  isOpen,
  onClose,
  caseId,
  accountId,
}) => {
  const [signOffFile, setSignOffFile] = useState<File | null>(null);
  const [signOffComments, setSignOffComments] = useState<string>('');
  const [commentError, setCommentError] = useState(false);
  const { successToast, errorToast } = useToast();
  const { mutate: signOff, isPending: isSigningOff } = useSignOffFinancialHighlights();

  const handleSignOffSubmit = async () => {
    if (!signOffComments.trim()) {
      setCommentError(true);
      errorToast('Comments are required for sign off');
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
  };

  const handleClose = () => {
    setSignOffFile(null);
    setSignOffComments('');
    setCommentError(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className='fixed inset-0 flex justify-center items-center bg-black/50 overflow-y-auto pt-10 pb-10'
      style={{ zIndex: 9999 }}
    >
      <div className='bg-white rounded-lg shadow-lg w-[500px] flex flex-col'>
        {/* Header Section */}
        <div className='flex justify-between items-center border-b border-[#CBD6E2] px-6 py-[2px]'>
          <h2 className='text-[#2D3E4F] text-[16px] p-1 font-semibold'>
            Sign Off Financial Highlights
          </h2>
        </div>

        {/* Content Section */}
        <div className='p-4 flex flex-col gap-3'>
          {/* Comments Section */}
          <div className='flex flex-col gap-2'>
            <label className='text-[13px] font-semibold text-[#2D3E4F]'>
              Comments <span style={{ color: 'red' }}>*</span>
            </label>
            <textarea
              rows={4}
              className={`w-full p-2 text-[13px] bg-[#F9FAFB] border rounded-md focus:outline-none focus:ring-1 transition-all ${
                commentError ? 'border-red-500 focus:ring-red-500' : 'border-[#CBD6E2] focus:ring-[#0176D3]'
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
              className='border-2 border-dashed border-[#CBD6E2] rounded-md p-3 flex flex-col items-center justify-center cursor-pointer bg-[#F9FAFB] hover:bg-[#F4F6F9] transition-colors gap-2 relative'
              onClick={() => document.getElementById('sign-off-file-input')?.click()}
            >
              {signOffFile ? (
                <div className='flex items-center gap-2'>
                  <span className='text-[13px] text-[#0176D3] font-medium'>
                    {signOffFile.name}
                  </span>
                  <CloseIcon
                    className='w-4 h-4 text-[#FF4D4F] hover:text-[#D9363E] cursor-pointer'
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
                onChange={(e) => setSignOffFile(e.target.files?.[0] || null)}
                onClick={(e) => ((e.target as HTMLInputElement).value = '')}
              />
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
