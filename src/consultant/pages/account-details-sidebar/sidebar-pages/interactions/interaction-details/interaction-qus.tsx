import React from 'react';
import { SxProps } from '@mui/material';
import { Theme } from '@emotion/react';
import { InteractionQuestion } from '../../../../../types';
import TextButton from '../../../../../../components/button/text-button';
import { DownloadIcon, PdfIcon } from '../../../../../../assets';
import { formatDateToYYYYMMDDWithTime } from '../../../../../../common-utils';

interface SectionHeaderButton {
  label: string;
  variant: 'text' | 'outlined' | 'contained';
  onClick: () => void;
  sx?: SxProps<Theme>;
  hide?: boolean;
  disabled?: boolean;
  loading?: boolean;
}

interface Props {
  questions: InteractionQuestion[];
}

const InteractionQuestions: React.FC<Props> = ({ questions }) => {
  const buttons: SectionHeaderButton[] = [
    {
      label: 'Response History',
      variant: 'outlined' as const,
      // disabled: accountInActive,
      onClick: () => console.log('Response History clicked'),
      sx: { width: '130px', minWidth: '130px' },
      hide: false,
    },
  ];

  return (
    <div className='my-3 border border-[#CBD6E2] rounded-[2px]'>
      <div className='flex items-center justify-between px-3.5 border-b border-[#CBD6E2] min-h-[40px] max-h-[40px]'>
        <div className='text-[14px] text-[#2D3E4F] font-semibold'>
          Interaction Question
        </div>
        <div className='flex items-center gap-2'>
          {buttons.map((button, index) =>
            button.hide ? null : (
              <TextButton
                key={`section-header-btn-${index}`}
                label={button.label}
                onClick={button.onClick}
                loading={button.loading}
                aria-label={button.label}
                sx={button.sx}
                disabled={button.disabled}
              />
            )
          )}
        </div>
      </div>
      <div>
        {questions.map((q) => (
          <div key={q.question_id} className='p-3'>
            <div className='font-medium text-[14px] text-[#2D3E4F]'>
              <span className='font-bold'>{q.question_id}</span> - {q.question}
            </div>

            <div
              className={`mt-2 border border-[#CBD6E2] rounded-[2px] py-2 px-3 min-h-20 text-[14px] text-[#425A76] font-normal ${q.answer ? 'bg-[#FFFBFA]' : 'bg-[#FCFCFC]'}`}
            >
              {q.answer}
            </div>

            {q.attachments.length > 0 && (
              <div
                className={`flex flex-col gap-1 mt-1 max-h-[85px] ${q.attachments.length > 2 ? 'overflow-auto' : 'overflow-visible'}`}
              >
                {q.attachments.map((file, index) => (
                  <div
                    key={index}
                    className='flex items-center justify-between border border-[#CBD6E2] bg-[#FFFBFA] rounded-[2px] p-2 px-3'
                  >
                    <div className='flex items-center gap-2'>
                      <PdfIcon />
                      <div className='text-[14px] text-[#425A76] font-normal'>
                        {file.file_name}
                      </div>
                    </div>
                    <a
                      href={file.file_url}
                      download
                      style={{
                        boxShadow: '0px 1px 2px 0px rgba(42, 54, 71, 0.05)',
                        background:
                          'linear-gradient(180deg, #FFFFFF 0%, #E4E6E7 100%)',
                      }}
                      className='p-1 border border-[#CBD6E2] rounded-[2px]'
                    >
                      <DownloadIcon />
                    </a>
                  </div>
                ))}
              </div>
            )}
            {q.response_received_on && (
              <div className='py-1 w-full flex justify-end items-center gap-2 text-[12px] text-[#425A76]'>
                <span className='text-[#7D98B6]'>Response Received on :</span>
                {formatDateToYYYYMMDDWithTime(q.response_received_on)}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default InteractionQuestions;
