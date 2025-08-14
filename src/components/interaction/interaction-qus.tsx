import React, { useState, useRef } from 'react';
import { SxProps, Tooltip } from '@mui/material';
import { Theme } from '@emotion/react';
import ReactQuill from 'react-quill';
import { Attachment, InteractionQuestion } from '../../consultant/types';
import TextButton from '../button/text-button';
import {
  AttachmentsSideIcon,
  DownloadIcon,
  KeyContactRemoveIcon,
  PdfIcon,
} from '../../assets';
import { formatDateToYYYYMMDDWithTime } from '../../common-utils';

interface SectionHeaderButton {
  label: string;
  variant: 'text' | 'outlined' | 'contained';
  onClick: () => void;
  sx?: SxProps<Theme>;
  hide?: boolean;
  disabled?: boolean;
  loading?: boolean;
}

interface InteractionQuesProps {
  questions: InteractionQuestion[];
  globalAttachments: Attachment[];
  isEditEnable?: boolean;
}

interface UploadedFile {
  file: File;
  url?: string;
}

const InteractionQuestions: React.FC<InteractionQuesProps> = ({
  questions,
  globalAttachments,
  isEditEnable = false,
}) => {
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editedAnswers, setEditedAnswers] = useState<Record<string, string>>(
    questions.reduce(
      (acc, q) => {
        acc[q.question_seq_num] = q.response || '';
        return acc;
      },
      {} as Record<string, string>
    )
  );

  const [newGlobalAttachments, setNewGlobalAttachments] = useState<
    UploadedFile[]
  >(
    (globalAttachments || []).map((f) => ({
      file: new File([], f.file_name), // placeholder so UI works
      url: f.file_url,
    }))
  );
  const [questionAttachments, setQuestionAttachments] = useState<
    Record<string, UploadedFile[]>
  >(
    questions.reduce(
      (acc, q) => {
        acc[q.question_seq_num] = (q.attachments || []).map((f) => ({
          file: new File([], f.file_name), // placeholder for UI
          url: f.file_url,
        }));
        return acc;
      },
      {} as Record<string, UploadedFile[]>
    )
  );

  const globalFileInputRef = useRef<HTMLInputElement | null>(null);
  const questionFileInputRefs = useRef<Record<string, HTMLInputElement | null>>(
    {}
  );

  const handleEditClick = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);

    // revert answers
    setEditedAnswers(
      questions.reduce(
        (acc, q) => {
          acc[q.question_seq_num] = q.response || '';
          return acc;
        },
        {} as Record<string, string>
      )
    );

    // revert global attachments
    setNewGlobalAttachments(
      (globalAttachments || []).map((f) => ({
        file: new File([], f.file_name),
        url: f.file_url,
      }))
    );

    // revert question attachments
    setQuestionAttachments(
      questions.reduce(
        (acc, q) => {
          acc[q.question_seq_num] = (q.attachments || []).map((f) => ({
            file: new File([], f.file_name),
            url: f.file_url,
          }));
          return acc;
        },
        {} as Record<string, UploadedFile[]>
      )
    );
  };

  const handleSave = (flag: 'draft' | 'submit') => {
    console.log('Saving answers:', editedAnswers);
    console.log('Flag:', flag);
    console.log('New Global Attachments:', newGlobalAttachments);
    console.log('Question Attachments:', questionAttachments);
    setIsEditing(false);
  };

  const handleAnswerChange = (questionId: string, value: string) => {
    setEditedAnswers((prev) => ({
      ...prev,
      [questionId]: value,
    }));
  };

  const handleGlobalFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files).map((file) => ({
      file,
      url: URL.createObjectURL(file),
    }));
    setNewGlobalAttachments((prev) => [...prev, ...files]);
    e.target.value = '';
  };

  const handleQuestionFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    questionId: string
  ) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files).map((file) => ({
      file,
      url: URL.createObjectURL(file),
    }));
    setQuestionAttachments((prev) => ({
      ...prev,
      [questionId]: [...(prev[questionId] || []), ...files],
    }));
    e.target.value = '';
  };

  const removeGlobalAttachment = (index: number) => {
    setNewGlobalAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const removeQuestionAttachment = (questionId: string, index: number) => {
    setQuestionAttachments((prev) => ({
      ...prev,
      [questionId]: prev[questionId].filter((_, i) => i !== index),
    }));
  };

  const buttons: SectionHeaderButton[] = isEditing
    ? [
        {
          label: 'Save as Draft',
          variant: 'contained' as const,
          onClick: () => handleSave('draft'),
          sx: { width: '110px', minWidth: '110px' },
        },
        {
          label: 'Save & Submit',
          variant: 'contained' as const,
          onClick: () => handleSave('submit'),
          sx: { width: '110px', minWidth: '110px' },
        },
        {
          label: 'Upload Files',
          variant: 'outlined' as const,
          onClick: () => globalFileInputRef.current?.click(),
          sx: { width: '100px', minWidth: '100px' },
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
          disabled: !isEditEnable,
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
          <input
            ref={globalFileInputRef}
            type='file'
            multiple
            className='hidden'
            onChange={handleGlobalFileUpload}
          />
        </div>
      </div>

      {/* Global Attachments Section */}
      {(isEditing ? newGlobalAttachments : globalAttachments).length > 0 && (
        <div className='p-3 bg-[#F7F9FB] border-b border-[#CBD6E2]'>
          <div className='font-semibold text-sm mb-2'>Uploaded Files</div>
          <div
            className={`flex flex-col gap-1 max-h-[85px] ${
              (isEditing ? newGlobalAttachments : globalAttachments).length > 2
                ? 'overflow-auto'
                : 'overflow-visible'
            }`}
          >
            {(isEditing ? newGlobalAttachments : globalAttachments).map(
              (file, idx) => (
                <div
                  key={idx}
                  className='flex items-center justify-between border border-[#CBD6E2] bg-[#FFFBFA] rounded-[2px] p-2 px-3'
                >
                  <div className='flex items-center gap-2'>
                    <PdfIcon />
                    <div className='text-[14px] text-[#425A76] font-normal'>
                      {'file_name' in file ? file.file_name : file.file.name}
                    </div>
                  </div>
                  {isEditing ? (
                    <Tooltip title='Remove file' arrow placement='top'>
                      <button
                        onClick={() => removeGlobalAttachment(idx)}
                        className='cursor-pointer p-[4px]'
                      >
                        <KeyContactRemoveIcon />
                      </button>
                    </Tooltip>
                  ) : (
                    <a
                      href={
                        'file_url' in file
                          ? file.file_url
                          : URL.createObjectURL(file.file)
                      }
                      download
                      className='p-1 border border-[#CBD6E2] rounded-[2px]'
                      style={{
                        boxShadow: '0px 1px 2px 0px rgba(42, 54, 71, 0.05)',
                        background:
                          'linear-gradient(180deg, #FFFFFF 0%, #E4E6E7 100%)',
                      }}
                    >
                      <DownloadIcon />
                    </a>
                  )}
                </div>
              )
            )}
          </div>
        </div>
      )}

      {/* Questions */}
      <div>
        {questions.map((q) => (
          <div key={q.question_seq_num} className='p-3'>
            <div className='font-medium text-[14px] text-[#2D3E4F]'>
              <span className='font-bold'>{q.question_seq_num}</span> -{' '}
              {q.question}
            </div>

            {isEditing ? (
              <div className='mt-2 relative'>
                <ReactQuill
                  value={editedAnswers[q.question_seq_num]}
                  onChange={(value) =>
                    handleAnswerChange(q.question_seq_num, value)
                  }
                  theme='snow'
                  className='rounded-[2px] bg-white'
                  modules={{
                    toolbar: [
                      [{ header: [1, 2, 3, 4, 5, 6, false] }],
                      [{ font: [] }],
                      [{ size: [] }],
                      ['bold', 'italic', 'underline', 'strike'],
                      [{ color: [] }, { background: [] }],
                      [{ script: 'sub' }, { script: 'super' }],
                      ['blockquote'],
                      [{ list: 'ordered' }, { list: 'bullet' }],
                      [{ indent: '-1' }, { indent: '+1' }],
                      [{ direction: 'rtl' }],
                      [{ align: [] }],
                      // ['image', 'video'],
                      ['clean'],
                    ],
                  }}
                  formats={[
                    'header',
                    'font',
                    'size',
                    'bold',
                    'italic',
                    'underline',
                    'strike',
                    'color',
                    'background',
                    'script',
                    'blockquote',
                    // 'code-block',
                    'list',
                    'bullet',
                    'indent',
                    'direction',
                    'align',
                    // 'link',
                    // 'image',
                    // 'video',
                    'clean',
                  ]}
                />
                <button
                  type='button'
                  onClick={() =>
                    questionFileInputRefs.current[q.question_seq_num]?.click()
                  }
                  className='absolute top-3 right-[8%] w-6 h-5 flex items-center justify-center cursor-pointer'
                >
                  <AttachmentsSideIcon className='w-4 h-4' />
                </button>
                <input
                  ref={(el) =>
                    (questionFileInputRefs.current[q.question_seq_num] = el)
                  }
                  type='file'
                  multiple
                  className='hidden'
                  onChange={(e) =>
                    handleQuestionFileUpload(e, q.question_seq_num)
                  }
                />
              </div>
            ) : (
              <div
                className={`mt-2 border border-[#CBD6E2] rounded-[2px] py-2 px-3 min-h-20 text-[14px] text-[#425A76] font-normal ${
                  q.response ? 'bg-[#FFFBFA]' : 'bg-[#FCFCFC]'
                }`}
                dangerouslySetInnerHTML={{ __html: q.response || '' }}
              />
            )}

            {/* Question-specific attachments */}
            {(isEditing
              ? questionAttachments[q.question_seq_num]
              : q.attachments
            ).length > 0 && (
              <div
                className={`flex flex-col gap-1 mt-1 max-h-[85px] ${
                  (isEditing
                    ? questionAttachments[q.question_seq_num]
                    : q.attachments
                  ).length > 2
                    ? 'overflow-auto'
                    : 'overflow-visible'
                }`}
              >
                {(isEditing
                  ? questionAttachments[q.question_seq_num]
                  : q.attachments
                ).map((file, index) => (
                  <div
                    key={index}
                    className='flex items-center justify-between border border-[#CBD6E2] bg-[#FFFBFA] rounded-[2px] p-2 px-3'
                  >
                    <div className='flex items-center gap-2'>
                      <PdfIcon />
                      <div className='text-[14px] text-[#425A76] font-normal'>
                        {'file_name' in file ? file.file_name : file.file.name}
                      </div>
                    </div>
                    {isEditing ? (
                      <Tooltip title='Remove file' arrow placement='top'>
                        <button
                          onClick={() =>
                            removeQuestionAttachment(q.question_seq_num, index)
                          }
                          className='cursor-pointer p-[4px]'
                        >
                          <KeyContactRemoveIcon />
                        </button>
                      </Tooltip>
                    ) : (
                      <a
                        href={
                          'file_url' in file
                            ? file.file_url
                            : URL.createObjectURL(file.file)
                        }
                        download
                        className='p-1 border border-[#CBD6E2] rounded-[2px]'
                        style={{
                          boxShadow: '0px 1px 2px 0px rgba(42, 54, 71, 0.05)',
                          background:
                            'linear-gradient(180deg, #FFFFFF 0%, #E4E6E7 100%)',
                        }}
                      >
                        <DownloadIcon />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}

            {!isEditing && q.response_on_datetime && (
              <div className='py-1 w-full flex justify-end items-center gap-2 text-[12px] text-[#425A76]'>
                <span className='text-[#7D98B6]'>Response Received on:</span>
                {formatDateToYYYYMMDDWithTime(q.response_on_datetime)}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default InteractionQuestions;
