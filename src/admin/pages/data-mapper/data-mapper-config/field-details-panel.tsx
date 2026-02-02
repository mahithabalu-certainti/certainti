import React, { useState } from 'react';
import { Tooltip } from '@mui/material';
import { PDFField } from '../../../types';
import { CopyIcon, TickIcon } from '../../../../assets';

interface DetailItemProps {
  label: string;
  value: string | React.ReactNode;
  onCopy?: () => void;
  multiline?: boolean;
}

const DetailItem = ({
  label,
  value,
  onCopy,
  multiline = false,
}: DetailItemProps) => {
  const [showCopied, setShowCopied] = useState(false);

  const handleCopy = () => {
    if (onCopy) {
      onCopy();
      setShowCopied(true);
      setTimeout(() => setShowCopied(false), 2000);
    }
  };
  return (
    <div>
      <div className='font-semibold text-sm text-gray-700 mb-1'>{label}</div>

      <div
        className={`flex items-start justify-between bg-gray-50 border border-gray-200 rounded-[2px] p-2 ${
          multiline ? 'flex-col space-y-2' : ''
        }`}
      >
        <div className='flex-1 text-gray-700 break-all text-sm pl-1'>
          {value}
        </div>

        {onCopy && (
          <Tooltip title={showCopied ? 'Copied' : 'Copy'} arrow placement='top'>
            <button
              onClick={handleCopy}
              className='ml-2 pt-0.5 text-gray-500 hover:text-blue-600 transition cursor-pointer'
            >
              {showCopied ? (
                <React.Suspense fallback={null}>
                  <TickIcon alt='tick-icon' className='w-4 h-4' />
                </React.Suspense>
              ) : (
                <React.Suspense fallback={null}>
                  <CopyIcon className='w-4 h-4' />
                </React.Suspense>
              )}
            </button>
          </Tooltip>
        )}
      </div>
    </div>
  );
};

interface FieldDetailsPanelProps {
  field: PDFField | null;
}

const FieldDetailsPanel = ({ field }: FieldDetailsPanelProps) => {
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  if (!field) {
    return (
      <div className='bg-white rounded-[4px] border border-[#CBD6E2] sticky top-0 h-fit'>
        <div className='py-2.5 px-4 text-xl font-bold text-[#425A76] border-b border-[#CBD6E2]'>
          Field Details
        </div>
        <div className='flex-1 min-h-[100px] text-base text-[#425a76cf] break-all p-4'>
          Click on a field to view its details.
        </div>
      </div>
    );
  }

  return (
    <div className='bg-white rounded-[4px] border border-[#CBD6E2] sticky top-0 h-fit'>
      <div className='py-2.5 px-4 text-xl font-bold text-[#425A76] border-b border-[#CBD6E2]'>
        Field Details
      </div>

      <div className='space-y-6 p-4 max-h-[calc(100vh-335px)] overflow-auto'>
        <DetailItem
          label='Field ID'
          value={field.id}
          onCopy={() => copyToClipboard(field.id)}
        />

        <div className='grid grid-cols-1 gap-4'>
          <DetailItem label='Page' value={String(field.page + 1)} />
          <DetailItem
            label='Position'
            value={
              <>
                <span>
                  X: {field.x.toFixed(2)}, Y: {field.y.toFixed(2)}
                </span>
                <span className='mx-2'> Width: {field.width.toFixed(2)}</span>
                <span> Height: {field.height.toFixed(2)}</span>
              </>
            }
            multiline
          />
        </div>
      </div>
    </div>
  );
};

export default FieldDetailsPanel;
