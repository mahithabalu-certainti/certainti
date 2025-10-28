import React, { useState, useEffect } from 'react';
import { Tooltip } from '@mui/material';
import { InteractionList } from '../../consultant/types';
import { REGEX_PATTERNS } from '../../common-utils';
import { CloseIcon, ErrorInfoIcon } from '../../assets';
import TextButton from '../button/text-button';
import { useSendInteraction } from '../../consultant/services/interactions/interactions-service';
import { useParams, useSearchParams } from 'react-router-dom';
import { useToast } from '../../hooks';

interface SendInteractionModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedRows: InteractionList[];
  onSuccessRefetch: () => void;
  interaction_level: 'Account' | 'Project';
}

const SendInteractionModal: React.FC<SendInteractionModalProps> = ({
  isOpen,
  onClose,
  selectedRows,
  onSuccessRefetch,
  interaction_level,
}) => {
  const [searchParams] = useSearchParams();
  const { accountid } = useParams();
  const accountId = searchParams.get('accountID') || '';
  const { successToast } = useToast();

  const [recipient, setRecipient] = useState({ email: '', name: '' });
  const [errors, setErrors] = useState<{ name?: string; email?: string }>({});
  const [showEmailFields, setShowEmailFields] = useState<boolean>(false);

  const sendInteraction = useSendInteraction();

  useEffect(() => {
    setRecipient({ email: '', name: '' });
    setErrors({});
    setShowEmailFields(false);
  }, [selectedRows, isOpen]);

  if (!isOpen) return null;

  // validate recipient
  const validateRecipient = () => {
    const newErrors: { name?: string; email?: string } = {};
    const { email, name } = recipient;

    if (!email?.trim()) {
      newErrors.email = 'Recipient Email is required';
    } else if (!REGEX_PATTERNS.MAX_EMAIL_REGEX.test(email)) {
      newErrors.email = 'Max length exceeded';
    } else if (!REGEX_PATTERNS.EMAIL.test(email)) {
      newErrors.email = 'Invalid Email Address';
    }

    if (!name?.trim()) {
      newErrors.name = 'Recipient Name is required';
    } else if (!REGEX_PATTERNS.NAME_REGEX.test(name.trim())) {
      newErrors.name =
        "Recipient Name must contain only letters, spaces, apostrophes(') and hyphens(-).";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleClose = () => {
    setRecipient({ email: '', name: '' });
    setErrors({});
    setShowEmailFields(false);
    onClose();
  };

  const handleSend = () => {
    if (!selectedRows.length) return;
    const accountRid = accountId || accountid || selectedRows[0].account_rid;

    // without email/name
    if (!showEmailFields) {
      const interactions = selectedRows.map((row) => ({
        interaction_rid: row.rid,
        interaction_level: row.interaction_level_name || '',
        project_fiscal_rid: row.project_fiscal_rid || '',
      }));

      const payload = {
        account_rid: accountRid,
        interactions,
        email_info: {
          email: '',
          name: '',
        },
      };
      sendInteraction.mutate(payload, {
        onSuccess: (response) => {
          successToast(response?.statusMessage);
          handleClose();
          onSuccessRefetch();
        },
      });
      return;
    }

    if (validateRecipient()) {
      const interactions = selectedRows.map((row) => {
        return {
          interaction_rid: row.rid,
          interaction_level: interaction_level,
          project_fiscal_rid: row.project_fiscal_rid || '',
        };
      });

      const payload = {
        account_rid: accountRid,
        interactions,
        email_info: {
          email: recipient.email.trim(),
          name: recipient.name.trim() || recipient.email.split('@')[0] || '',
        },
      };
      sendInteraction.mutate(payload, {
        onSuccess: (response) => {
          successToast(response?.statusMessage);
          handleClose();
          onSuccessRefetch();
        },
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
              Do you want to add external email address to notify alternate
              recipient for this interaction?
            </h3>
            <div className='flex gap-3 justify-end'>
              <TextButton
                label='No'
                onClick={handleSend}
                loading={sendInteraction.isPending}
                sx={{
                  width: '60px',
                  minWidth: '60px',
                  fontWeight: 400,
                  fontSize: '13px',
                  height: '32px',
                }}
              />
              <TextButton
                label='Yes'
                onClick={() => setShowEmailFields(true)}
                disabled={sendInteraction.isPending}
                sx={{
                  width: '60px',
                  minWidth: '60px',
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
            <div className='mt-4'>
              {/* Name field */}
              <div className='mb-3'>
                <label className='block font-medium mb-1'>
                  Recipient Name<span className='text-red-500 ml-1'>*</span>
                </label>
                <div className='relative'>
                  <input
                    type='text'
                    placeholder='Enter Recipient Name'
                    value={recipient.name}
                    onChange={(e) =>
                      setRecipient((prev) => ({
                        ...prev,
                        name: e.target.value,
                      }))
                    }
                    className={`placeholder-[#7D98B6] outline-none focus:border-2 focus:border-blue-400 w-full sm:text-sm px-3 h-[32px] border rounded-xs ${
                      errors.name
                        ? 'border-red-500 bg-[#FEF2F2]'
                        : 'border-[#CBD6E2]'
                    }`}
                  />
                  {errors.name && (
                    <Tooltip
                      title={errors.name}
                      arrow
                      placement='top'
                      slotProps={{
                        tooltip: {
                          sx: { backgroundColor: '#FEF2F2', mr: 1 },
                        },
                      }}
                    >
                      <span className='h-[28px] w-5 flex items-center justify-center absolute top-[2px] right-1.5 cursor-pointer'>
                        <React.Suspense fallback={null}>
                          <ErrorInfoIcon alt='error' className='w-5 h-3.5' />
                        </React.Suspense>
                      </span>
                    </Tooltip>
                  )}
                </div>
              </div>

              {/* Email field */}
              <div className='mb-3'>
                <label className='block font-medium mb-1'>
                  Recipient Email<span className='text-red-500 ml-1'>*</span>
                </label>
                <div className='relative'>
                  <input
                    type='text'
                    placeholder='Enter Recipient Email'
                    value={recipient.email}
                    onChange={(e) =>
                      setRecipient((prev) => ({
                        ...prev,
                        email: e.target.value,
                      }))
                    }
                    className={`placeholder-[#7D98B6] outline-none focus:border-2 focus:border-blue-400 w-full sm:text-sm px-3 h-[32px] border rounded-xs ${
                      errors.email
                        ? 'border-red-500 bg-[#FEF2F2]'
                        : 'border-[#CBD6E2]'
                    }`}
                  />
                  {errors.email && (
                    <Tooltip
                      title={errors.email}
                      arrow
                      placement='top'
                      slotProps={{
                        tooltip: {
                          sx: { backgroundColor: '#FEF2F2', mr: 1 },
                        },
                      }}
                    >
                      <span className='h-[28px] w-5 flex items-center justify-center absolute top-[2px] right-1.5 cursor-pointer'>
                        <React.Suspense fallback={null}>
                          <ErrorInfoIcon alt='error' className='w-5 h-3.5' />
                        </React.Suspense>
                      </span>
                    </Tooltip>
                  )}
                </div>
              </div>
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
