/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from 'react';
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Typography,
  Box,
} from '@mui/material';
import {UploadIcon } from '../../../../../../../assets';
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
  const { successToast, errorToast } = useToast();
  const { mutate: signOff, isPending: isSigningOff } = useSignOffFinancialHighlights();

  const handleSignOffSubmit = async () => {
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
          onSuccess: (response: any) => {
            successToast(response?.statusMessage || 'Signed off successfully');
            setSignOffFile(null);
            setSignOffComments('');
            onClose();
          },
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

  const handleClose = () => {
    setSignOffFile(null);
    setSignOffComments('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onClose={handleClose} maxWidth='sm' fullWidth>
      <DialogTitle className='flex justify-between items-center border-b border-[#CBD6E2]'>
        <span className='text-[#2D3E4F] text-[16px] font-semibold'>
          Sign Off Financial Highlights
        </span>
      </DialogTitle>
      <DialogContent className='pt-1'>
        <Box className='flex flex-col gap-5 pt-2'>
          {/* <Typography className='text-[14px] text-[#425A76] font-medium'>
            Please sign off total cases details to proceed.
          </Typography> */}

          {/* File Upload Section */}
          <Box className='flex flex-col gap-2'>
            <Typography className='text-[13px] font-semibold text-[#2D3E4F]'>
              Attach File
            </Typography>
            <Box
              className='border-2 border-dashed border-[#CBD6E2] rounded-md p-6 flex flex-col items-center justify-center cursor-pointer bg-[#F9FAFB] hover:bg-[#F4F6F9] transition-colors gap-2'
              onClick={() =>
                document.getElementById('sign-off-file-input')?.click()
              }
            >
              <UploadIcon className='w-8 h-8 text-[#0176D3]' />
              <Typography className='text-[13px] text-[#0176D3] underline'>
                {signOffFile
                  ? signOffFile.name
                  : 'Click to browse or drag file here'}
              </Typography>
              <input
                id='sign-off-file-input'
                type='file'
                className='hidden'
                onChange={(e) => setSignOffFile(e.target.files?.[0] || null)}
              />
            </Box>
          </Box>

          {/* Comments Section */}
          <Box className='flex flex-col gap-2'>
            <Typography className='text-[13px] font-semibold text-[#2D3E4F]'>
              Comments
            </Typography>
            <TextField
              multiline
              rows={4}
              fullWidth
              placeholder='Enter your comments here...'
              value={signOffComments}
              onChange={(e) => setSignOffComments(e.target.value)}
              variant='outlined'
              sx={{
                '& .MuiOutlinedInput-root': {
                  fontSize: '13px',
                  backgroundColor: '#F9FAFB',
                  '& fieldset': { borderColor: '#CBD6E2' },
                },
              }}
            />
          </Box>
        </Box>
      </DialogContent>
      <DialogActions className='border-t border-[#CBD6E2] px-6 py-4'>
        <Box className='flex gap-3 justify-end w-full'>
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
        </Box>
      </DialogActions>
    </Dialog>
  );
};

export default SignOffModal;
