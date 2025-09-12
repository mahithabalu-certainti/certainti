import React from 'react';
import {
  AccountSendInteractionPayload,
  InteractionList,
  SendIntractionProject,
} from '../../../../types';
import { useParams, useSearchParams } from 'react-router-dom';
import { useToast } from '../../../../../hooks';
import { useAccountSendInteraction } from '../../../../services/interactions/interactions-service';
import { CloseIcon } from '../../../../../assets';
import TextButton from '../../../../../components/button/text-button';
import { Project } from '../../../../types/project';

interface SendInteractionModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedRows: InteractionList[];
  selectedTableId: string[];
  projectList: Project[];
  onSuccessRefetch: () => void;
}

const SendInteractionAlert: React.FC<SendInteractionModalProps> = ({
  isOpen,
  onClose,
  selectedRows,
  selectedTableId,
  projectList,
  onSuccessRefetch,
}) => {
  const [searchParams] = useSearchParams();
  const { accountid } = useParams();
  const accountId = searchParams.get('accountID') || '';
  const { successToast } = useToast();

  const sendInteraction = useAccountSendInteraction();

  if (!isOpen) return null;

  const handleSend = () => {
    const localData = localStorage.getItem('selectedInteraction');
    if (selectedRows.length > 0 || localData) {
      const accountRid = accountId || accountid;
      const payload: AccountSendInteractionPayload = {
        account_rid: accountRid as string,
        account_interaction_rid:
          selectedRows.length > 0
            ? selectedRows.map((it) => it.rid)
            : JSON.parse(localData as string),
        projects: selectedTableId.map((id) => {
          for (const project of projectList) {
            const fiscal = project.ProjectFiscal.find((pf) => pf.rid === id);
            if (fiscal) {
              return {
                project_fiscal_rid: fiscal.project_fiscal_rid,
                fiscal_year: fiscal.fiscal_year.toString(),
                project_rid: fiscal.project_rid,
              };
            }
          }
        }) as SendIntractionProject[],
      };
      sendInteraction.mutate(payload, {
        onSuccess: (response) => {
          successToast(response?.statusMessage);
          onClose();
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
              disabled={sendInteraction.isPending}
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
              loading={sendInteraction.isPending}
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
