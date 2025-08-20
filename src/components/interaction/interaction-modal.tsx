import React, { useState, useEffect } from 'react';
import { Tooltip } from '@mui/material';
import { InteractionList } from '../../consultant/types';
import { REGEX_PATTERNS } from '../../common-utils';
import { CloseIcon, ErrorInfoIcon } from '../../assets';
import TextButton from '../button/text-button';

interface SendInteractionModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedRows: InteractionList[];
  onSend: (emails: Record<string, string>) => void;
}

const SendInteractionModal: React.FC<SendInteractionModalProps> = ({
  isOpen,
  onClose,
  selectedRows,
  onSend,
}) => {
  const [emails, setEmails] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const initialEmails: Record<string, string> = {};
    selectedRows.forEach((row) => {
      initialEmails[row.rid] = '';
    });
    setEmails(initialEmails);
    setErrors({});
  }, [selectedRows]);

  if (!isOpen) return null;

  const validateAllEmails = () => {
    const newErrors: Record<string, string> = {};

    selectedRows.forEach((row) => {
      const value = emails[row.rid] || '';
      if (!value) {
        newErrors[row.rid] = 'Field is required';
      } else if (!REGEX_PATTERNS.MAX_EMAIL_REGEX.test(value)) {
        newErrors[row.rid] = 'Max length exceeded';
      } else if (value && !REGEX_PATTERNS.EMAIL.test(value)) {
        newErrors[row.rid] = 'Invalid Email Address';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (id: string, value: string) => {
    setEmails((prev) => ({ ...prev, [id]: value }));
    setErrors((prev) => {
      if (!prev[id]) return prev;
      const updated = { ...prev };
      delete updated[id];
      return updated;
    });
  };

  const handleClose = () => {
    setEmails({});
    setErrors({});
    onClose();
  };

  const handleSend = () => {
    if (validateAllEmails()) {
      onSend(emails);
    }
  };

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50'>
      <div className='bg-white rounded-lg shadow-lg w-full max-w-xl p-5'>
        <div className='flex justify-between items-center border-b border-[#CBD6E2] pb-3'>
          <h2 className='text-[16px] font-bold text-[#2D3E4F]'>
            Send Interaction
          </h2>
          <button
            onClick={handleClose}
            className='cursor-pointer hover:bg-gray-400 p-2 rounded-full'
          >
            <CloseIcon />
          </button>
        </div>

        <div className='mt-4 max-h-[195px] overflow-y-auto'>
          {selectedRows.length === 0 ? (
            <p className='text-gray-500'>No rows selected.</p>
          ) : (
            selectedRows.map((row) => (
              <div key={row.rid} className='mb-3'>
                <label className='block font-medium mb-1'>
                  {row.r_number || row.rid}
                  <span className='text-red-500 text-[16px]'>*</span>
                </label>
                <div
                  className={`relative ${errors[row.rid] ? 'bg-[#FEF2F2]' : ''}`}
                >
                  <input
                    type='text'
                    placeholder='Enter Recipient Email'
                    value={emails[row.rid] || ''}
                    onChange={(e) => handleChange(row.rid, e.target.value)}
                    className={`placeholder-custom-color disabled:bg-gray-100 placeholder-[#7D98B6] outline-none focus:border-2 focus:border-blue-400 w-full sm:text-sm px-3 h-[32px] border border-[#CBD6E2] rounded-xs ${errors[row.rid] && 'border-red-500 disabled:!bg-[#FEF2F2] bg-[#FEF2F2]'}`}
                  />
                  {errors[row.rid] && (
                    <Tooltip
                      title={errors[row.rid]}
                      arrow
                      placement='top'
                      slotProps={{
                        tooltip: {
                          sx: {
                            backgroundColor: '#FEF2F2',
                            mr: 1,
                          },
                        },
                      }}
                    >
                      <span className='h-[28px] w-5 flex items-center justify-center absolute top-[2px] bg-[#FEF2F2] right-1.5 cursor-pointer'>
                        <ErrorInfoIcon alt='error' className='w-5 h-3.5' />
                      </span>
                    </Tooltip>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        <div className='flex gap-3 mt-6 justify-end'>
          <TextButton
            label='Cancel'
            onClick={handleClose}
            sx={{
              width: '75px',
              minWidth: '75px',
              fontSize: '12px',
              fontWeight: 400,
            }}
          />
          <TextButton
            label='Send'
            onClick={handleSend}
            disabled={selectedRows.length === 0}
            sx={{
              width: '64px',
              minWidth: '64px',
              fontSize: '13px',
              fontWeight: 400,
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default SendInteractionModal;
