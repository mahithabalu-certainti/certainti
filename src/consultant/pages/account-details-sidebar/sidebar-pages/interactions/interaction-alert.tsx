import React from 'react';
import { InteractionList } from '../../../../types';
import { useParams, useSearchParams } from 'react-router-dom';
import { useToast } from '../../../../../hooks';
import { useSendInteraction } from '../../../../services/interactions/interactions-service';
import { CloseIcon } from '../../../../../assets';
import TextButton from '../../../../../components/button/text-button';

interface SendInteractionModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedRows: InteractionList[];
  onSuccessRefetch: () => void;
}

const SendInteractionAlert: React.FC<SendInteractionModalProps> = ({
  isOpen,
  onClose,
  selectedRows,
  onSuccessRefetch,
}) => {
  const [searchParams] = useSearchParams();
  const { accountid } = useParams();
  const accountId = searchParams.get('accountID') || '';
  const { successToast } = useToast();

  const sendInteraction = useSendInteraction();

  if (!isOpen) return null;

  const handleSend = () => {
    if (!selectedRows.length) return;
    const accountRid = accountId || accountid || selectedRows[0].account_rid;

    const interactions = selectedRows.map((row) => {
      return {
        interaction_rid: row.rid,
        project_fiscal_rid: row.project_fiscal_rid || '',
        email_info: {
          email: '',
          name: '',
        },
      };
    });

    const payload = {
      account_rid: accountRid,
      interactions,
    };
    sendInteraction.mutate(payload, {
      onSuccess: (response) => {
        successToast(response?.statusMessage);
        onClose();
        onSuccessRefetch();
      },
    });
  };

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50'>
      <div className='bg-white rounded-lg shadow-lg w-full max-w-xl p-5'>
        <div className='flex justify-between items-center border-b border-[#CBD6E2] pb-3'>
          <h2 className='text-[16px] font-bold text-[#2D3E4F]'>
            Send Interaction
          </h2>
          <button
            onClick={onClose}
            className='cursor-pointer hover:bg-gray-200 p-2 rounded-full'
          >
            <React.Suspense fallback={null}>
              <CloseIcon />
            </React.Suspense>
          </button>
        </div>

        {/* Confirmation */}
        <div className='mt-4'>
          <h3 className='text-[16px] font-bold text-[#2D3E4F] text-center text-sm mb-8'>
            Do you want to send interaction?
          </h3>
          <div className='flex gap-3 justify-end'>
            <TextButton
              label='No'
              onClick={onClose}
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
              onClick={handleSend}
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
      </div>
    </div>
  );
};

export default SendInteractionAlert;
