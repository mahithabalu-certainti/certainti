import React from 'react';
import TextButton from '../components/button/text-button';

interface ConfirmationPopupProps {
  isOpen: boolean;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmLabel?: string;
}

const ConfirmationPopup: React.FC<ConfirmationPopupProps> = ({
  isOpen,
  message,
  onConfirm,
  onCancel,
  confirmLabel,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className='fixed inset-0 flex items-center justify-center'
      style={{ backgroundColor: 'rgb(30 28 28 / 50%)', zIndex: 99999 }}
    >
      <div className='bg-white rounded-lg p-6 max-w-md w-full mx-4'>
        <h3 className='text-[16px] font-bold text-[#2D3E4F] text-center text-sm mb-6'>
          {message}
        </h3>
        <div className='flex justify-center gap-4'>
          <TextButton
            label='Cancel'
            onClick={onCancel}
            sx={{
              width: '64px',
              minWidth: '64px',
              fontWeight: 400,
              fontSize: '13px',
              height: '32px',
            }}
          />
          <TextButton
            label={confirmLabel ? confirmLabel : 'Confirm'}
            color='inherit'
            onClick={onConfirm}
            sx={{
              width: '56px',
              minWidth: '56px',
              fontWeight: 400,
              fontSize: '12px',
              height: '32px',
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default ConfirmationPopup;
