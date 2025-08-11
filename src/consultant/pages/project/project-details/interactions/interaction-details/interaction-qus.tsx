import React, { useState } from 'react';
import { SxProps } from '@mui/material';
import { Theme } from '@emotion/react';
import ReactQuill from 'react-quill';
import { InteractionQuestion } from '../../../../../types';
import { DownloadIcon, PdfIcon } from '../../../../../../assets';
import TextButton from '../../../../../../components/button/text-button';
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
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editedAnswers, setEditedAnswers] = useState<Record<string, string>>(
    questions.reduce(
      (acc, q) => {
        acc[q.question_id] = q.answer || '';
        return acc;
      },
      {} as Record<string, string>
    )
  );

  const handleEditClick = () => {
    setIsEditing(true);
    setEditedAnswers(
      questions.reduce(
        (acc, q) => {
          acc[q.question_id] = q.answer || '';
          return acc;
        },
        {} as Record<string, string>
      )
    );
  };

  const handleSave = () => {
    console.log('Saving all answers:', editedAnswers);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
    // Revert to original answers
    setEditedAnswers(
      questions.reduce(
        (acc, q) => {
          acc[q.question_id] = q.answer || '';
          return acc;
        },
        {} as Record<string, string>
      )
    );
  };

  const handleAnswerChange = (questionId: string, value: string) => {
    setEditedAnswers((prev) => ({
      ...prev,
      [questionId]: value,
    }));
  };

  const buttons: SectionHeaderButton[] = isEditing
    ? [
        {
          label: 'Save',
          variant: 'contained' as const,
          onClick: handleSave,
          sx: { width: '64px', minWidth: '64px' },
        },
        {
          label: 'Cancel',
          variant: 'outlined' as const,
          onClick: handleCancel,
          sx: { width: '75px', minWidth: '75px' },
        },
      ]
    : [
        {
          label: 'Edit Response',
          variant: 'outlined' as const,
          onClick: handleEditClick,
          sx: { width: '110px', minWidth: '110px' },
        },
        {
          label: 'Response History',
          variant: 'outlined' as const,
          onClick: () => console.log('Response History clicked'),
          sx: { width: '130px', minWidth: '130px' },
        },
      ];

  return (
    <div className='my-3 border border-[#CBD6E2] rounded-[2px]'>
      <div className='flex items-center justify-between px-3.5 border-b border-[#CBD6E2] min-h-[40px] max-h-[40px]'>
        <div className='text-[14px] text-[#2D3E4F] font-semibold'>
          Interaction Question
        </div>
        <div className='flex items-center gap-2'>
          {buttons.map((button, index) => (
            <TextButton
              key={`section-header-btn-${index}`}
              label={button.label}
              onClick={button.onClick}
              loading={button.loading}
              aria-label={button.label}
              sx={button.sx}
              disabled={button.disabled}
            />
          ))}
        </div>
      </div>
      <div>
        {questions.map((q) => (
          <div key={q.question_id} className='p-3'>
            <div className='font-medium text-[14px] text-[#2D3E4F]'>
              <span className='font-bold'>{q.question_id}</span> - {q.question}
            </div>

            {isEditing ? (
              <div className='mt-2'>
                <ReactQuill
                  value={editedAnswers[q.question_id]}
                  onChange={(value) => handleAnswerChange(q.question_id, value)}
                  theme='snow'
                  className='rounded-[2px] bg-white'
                  modules={{
                    toolbar: [
                      ['bold', 'italic', 'underline', 'strike'],
                      [{ list: 'ordered' }, { list: 'bullet' }],
                      ['link'],
                      ['clean'],
                    ],
                  }}
                  formats={[
                    'bold',
                    'italic',
                    'underline',
                    'strike',
                    'list',
                    'bullet',
                    'link',
                  ]}
                />
              </div>
            ) : (
              <div
                className={`mt-2 border border-[#CBD6E2] rounded-[2px] py-2 px-3 min-h-20 text-[14px] text-[#425A76] font-normal ${q.answer ? 'bg-[#FFFBFA]' : 'bg-[#FCFCFC]'}`}
                dangerouslySetInnerHTML={{ __html: q.answer || '' }}
              />
            )}

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
