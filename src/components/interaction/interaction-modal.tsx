import React, { useState, useEffect } from 'react';
import { Tooltip } from '@mui/material';
import { InteractionList } from '../../consultant/types';
import { REGEX_PATTERNS } from '../../common-utils';
import { CloseIcon, ErrorInfoIcon } from '../../assets';
import TextButton from '../button/text-button';
import { useSendInteraction } from '../../consultant/services/interactions/interactions-service';
import { useParams, useSearchParams } from 'react-router-dom';

interface SendInteractionModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedRows: InteractionList[];
}

const SendInteractionModal: React.FC<SendInteractionModalProps> = ({
  isOpen,
  onClose,
  selectedRows,
}) => {
  const [searchParams] = useSearchParams();
  const { accountid } = useParams();
  const accountId = searchParams.get('accountID') || '';
  const [emails, setEmails] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showEmailFields, setShowEmailFields] = useState<boolean>(false);

  const sendInteraction = useSendInteraction();

  useEffect(() => {
    const initialEmails: Record<string, string> = {};
    selectedRows.forEach((row) => {
      initialEmails[row.rid] = '';
    });
    setEmails(initialEmails);
    setErrors({});
    setShowEmailFields(false);
  }, [selectedRows, isOpen]);

  if (!isOpen) return null;

  const validateAllEmails = () => {
    const newErrors: Record<string, string> = {};

    selectedRows.forEach((row) => {
      const value = emails[row.rid]?.trim();
      if (value) {
        if (!REGEX_PATTERNS.MAX_EMAIL_REGEX.test(value)) {
          newErrors[row.rid] = 'Max length exceeded';
        } else if (!REGEX_PATTERNS.EMAIL.test(value)) {
          newErrors[row.rid] = 'Invalid Email Address';
        }
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
    setShowEmailFields(false);
    onClose();
  };

  const handleSend = () => {
    if (!selectedRows.length) return;
    const accountRid = accountId || accountid || selectedRows[0].account_rid;

    // without emails
    if (!showEmailFields) {
      const interactions = selectedRows.map((row) => ({
        interaction_rid: row.rid,
      }));

      const payload = {
        account_rid: accountRid,
        interactions,
        customRecipient: false,
      };
      sendInteraction.mutate(payload, {
        onSuccess: () => handleClose(),
      });
      return;
    }

    if (validateAllEmails()) {
      const interactions = selectedRows.map((row) => {
        const email = emails[row.rid]?.trim();
        if (email) {
          return {
            interaction_rid: row.rid,
            emailInfo: {
              email,
              name: email.split('@')[0],
            },
          };
        }
        return { interaction_rid: row.rid };
      });

      const payload = {
        account_rid: accountRid,
        interactions,
        customRecipient: true,
      };
      sendInteraction.mutate(payload, {
        onSuccess: () => handleClose(),
      });
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
            className='cursor-pointer hover:bg-gray-200 p-2 rounded-full'
          >
            <React.Suspense fallback={null}>
              <CloseIcon />
            </React.Suspense>
          </button>
        </div>

        {/* Confirmation */}
        {!showEmailFields && (
          <div className='mt-4'>
            <h3 className='text-[16px] font-bold text-[#2D3E4F] text-center text-sm mb-8'>
              Would you like to add one or more external email addresses to
              notify additional recipients for this interaction?
            </h3>
            <div className='flex gap-3 justify-end'>
              <TextButton
                label='Cancel'
                onClick={handleSend}
                loading={sendInteraction.isPending}
                sx={{
                  width: '64px',
                  minWidth: '64px',
                  fontWeight: 400,
                  fontSize: '13px',
                  height: '32px',
                }}
              />
              <TextButton
                label='Confirm'
                onClick={() => setShowEmailFields(true)}
                disabled={sendInteraction.isPending}
                sx={{
                  width: '64px',
                  minWidth: '64px',
                  fontWeight: 400,
                  fontSize: '13px',
                  height: '32px',
                }}
              />
            </div>
          </div>
        )}

        {/* Email input fields */}
        {showEmailFields && (
          <>
            <div className='mt-4 max-h-[195px] overflow-y-auto'>
              {selectedRows.length === 0 ? (
                <p className='text-gray-500'>No rows selected.</p>
              ) : (
                selectedRows.map((row) => (
                  <div key={row.rid} className='mb-3'>
                    <label className='block font-medium mb-1'>
                      {row.r_number || row.rid}
                    </label>
                    <div
                      className={`relative ${errors[row.rid] ? 'bg-[#FEF2F2]' : ''}`}
                    >
                      <input
                        type='text'
                        placeholder='Enter Recipient Email (optional)'
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
                              sx: { backgroundColor: '#FEF2F2', mr: 1 },
                            },
                          }}
                        >
                          <span className='h-[28px] w-5 flex items-center justify-center absolute top-[2px] bg-[#FEF2F2] right-1.5 cursor-pointer'>
                            <React.Suspense fallback={null}>
                              <ErrorInfoIcon
                                alt='error'
                                className='w-5 h-3.5'
                              />
                            </React.Suspense>
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
                disabled={sendInteraction.isPending}
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
                loading={sendInteraction.isPending}
                sx={{
                  width: '64px',
                  minWidth: '64px',
                  fontSize: '13px',
                  fontWeight: 400,
                }}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default SendInteractionModal;
