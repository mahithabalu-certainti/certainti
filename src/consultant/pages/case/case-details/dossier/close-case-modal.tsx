import { Box, Modal } from '@mui/material';
import React from 'react';
import CloseCaseForm from './tab/close-case/close-case-form';

interface CloseCaseModalProps {
  open: boolean;
  onClose: () => void;
  caseDetails?: {
    country_name?: string;
    country_rid?: string;
    country_code?: string;
    fiscal_year?: string | number;
    all_task_completed?: boolean;
    currency_symbol?: string;
  };
  refetchCaseDetails?: () => void;
}

const CloseCaseModal: React.FC<CloseCaseModalProps> = ({
  open,
  onClose,
  caseDetails,
  refetchCaseDetails,
}) => {
  return (
    <Modal open={open}>
      <Box
        className='absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-md shadow-lg outline-none'
        sx={{ width: '80vw' }}
      >
        <CloseCaseForm
          caseDetails={caseDetails}
          refetchCaseDetails={refetchCaseDetails}
          onCancel={onClose}
          onSuccess={onClose}
          isInsideModal={true}
        />
      </Box>
    </Modal>
  );
};

export default CloseCaseModal;
