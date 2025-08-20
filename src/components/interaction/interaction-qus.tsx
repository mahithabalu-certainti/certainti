import React, { useState, useRef, useEffect } from 'react';
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
import {
  useUpdateInteractionQuestionResponse,
  useUploadInteractionAttachment,
} from '../../consultant/services/interactions/response-interaction-service';

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
  isLoading?: boolean;
  actionButtonEnable?: boolean;
  handleResponseHistory?: () => void;
  refetchDeetails?: () => void;
  formData?: Record<string, string>;
}

const InteractionQuestions: React.FC<InteractionQuesProps> = ({
  questions,
  globalAttachments,
  isEditEnable = false,
  isLoading = false,
  actionButtonEnable,
  handleResponseHistory,
  refetchDeetails,
  formData,
}) => {
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editedAnswers, setEditedAnswers] = useState<Record<string, string>>(
    questions.reduce(
      (acc, q) => {
        acc[q.rid] = q.response || '';
        return acc;
      },
      {} as Record<string, string>
    )
  );

  const [newGlobalAttachments, setNewGlobalAttachments] = useState<
    Attachment[]
  >(globalAttachments || []);
  const [questionAttachments, setQuestionAttachments] = useState<
    Record<string, Attachment[]>
  >(
    questions.reduce(
      (acc, q) => {
        acc[q.rid] = q.attachments || [];
        return acc;
      },
      {} as Record<string, Attachment[]>
    )
  );

  const globalFileInputRef = useRef<HTMLInputElement | null>(null);
  const questionFileInputRefs = useRef<Record<string, HTMLInputElement | null>>(
    {}
  );
  const uploadFileMutation = useUploadInteractionAttachment();
  const updateInteractionQusResponse = useUpdateInteractionQuestionResponse();

  useEffect(() => {
    setEditedAnswers(
      questions.reduce(
        (acc, q) => {
          acc[q.rid] = q.response || '';
          return acc;
        },
        {} as Record<string, string>
      )
    );

    setNewGlobalAttachments(globalAttachments || []);

    setQuestionAttachments(
      questions.reduce(
        (acc, q) => {
          acc[q.rid] = q.attachments || [];
          return acc;
        },
        {} as Record<string, Attachment[]>
      )
    );
  }, [questions, globalAttachments]);

  const handleEditClick = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);

    // revert answers
    setEditedAnswers(
      questions.reduce(
        (acc, q) => {
          acc[q.rid] = q.response || '';
          return acc;
        },
        {} as Record<string, string>
      )
    );

    // revert global attachments
    setNewGlobalAttachments(globalAttachments || []);

    // revert question attachments
    setQuestionAttachments(
      questions.reduce(
        (acc, q) => {
          acc[q.rid] = q.attachments || [];
          return acc;
        },
        {} as Record<string, Attachment[]>
      )
    );
  };

  const handleSave = async (flag: 'draft' | 'submit') => {
    const payload = {
      status_action: (flag === 'draft'
        ? 'RESPONSE_DRAFT'
        : 'RESPONSE_RECEIVED') as 'RESPONSE_DRAFT' | 'RESPONSE_RECEIVED',
      attachments: newGlobalAttachments,
      questions: questions.map((q) => ({
        question: q.question,
        response: editedAnswers[q.rid] || '',
        rid: q.rid,
        attachments: questionAttachments[q.rid] || [],
      })),
    };

    const finalPayload = {
      account_rid: formData?.account_rid || '',
      project_rid: formData?.project_rid || '',
      project_fiscal_rid: formData?.project_fiscal_rid || '',
      interaction_rid: formData?.interaction_rid || '',
      ...payload,
    };
    updateInteractionQusResponse.mutate(finalPayload, {
      onSuccess: async () => {
        await refetchDeetails?.();
        setIsEditing(false);
      },
    });
  };

  const handleAnswerChange = (questionId: string, value: string) => {
    setEditedAnswers((prev) => ({
      ...prev,
      [questionId]: value,
    }));
  };

  const handleGlobalFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const res = await uploadFileMutation.mutateAsync({
        account_rid: formData?.account_rid || '',
        project_rid: formData?.project_rid || '',
        interaction_rid: formData?.interaction_rid || '',
        file,
      });
      setNewGlobalAttachments((prev) => [...prev, res.data]);
      e.target.value = '';
    } catch (err) {
      console.error('Upload failed', err);
    }
  };

  const handleQuestionFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    questionId: string
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const res = await uploadFileMutation.mutateAsync({
        account_rid: formData?.account_rid || '',
        project_rid: formData?.project_rid || '',
        interaction_rid: formData?.interaction_rid || '',
        file,
      });
      setQuestionAttachments((prev) => ({
        ...prev,
        [questionId]: [...(prev[questionId] || []), res.data],
      }));
      e.target.value = '';
    } catch (err) {
      console.error('Upload failed', err);
    }
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

  const isUpdateLoading = updateInteractionQusResponse.isPending || isLoading;

  const handleDownload = (documentUrl: string) => {
    if (!documentUrl) return;

    const link = document.createElement('a');
    link.href = documentUrl;
    link.download = '';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const buttons: SectionHeaderButton[] = isEditing
    ? [
        {
          label: 'Save as Draft',
          variant: 'contained' as const,
          onClick: () => handleSave('draft'),
          sx: { width: '110px', minWidth: '110px' },
          loading: isUpdateLoading,
          disabled: uploadFileMutation.isPending,
        },
        {
          label: 'Save & Submit',
          variant: 'contained' as const,
          onClick: () => handleSave('submit'),
          sx: { width: '110px', minWidth: '110px' },
          loading: isUpdateLoading,
          disabled: uploadFileMutation.isPending,
        },
        {
          label: 'Upload Files',
          variant: 'outlined' as const,
          onClick: () => globalFileInputRef.current?.click(),
          sx: { width: '100px', minWidth: '100px' },
          disabled: isUpdateLoading || uploadFileMutation.isPending,
        },
        {
          label: 'Cancel',
          variant: 'outlined' as const,
          onClick: handleCancel,
          sx: { width: '75px', minWidth: '75px' },
          disabled: isUpdateLoading || uploadFileMutation.isPending,
        },
      ]
    : [
        {
          label: 'Edit Response',
          variant: 'outlined' as const,
          disabled: !isEditEnable,
          onClick: handleEditClick,
          sx: { width: '110px', minWidth: '110px' },
          hide: !actionButtonEnable,
        },
        {
          label: 'Response History',
          variant: 'outlined' as const,
          onClick: () => handleResponseHistory?.(),
          sx: { width: '130px', minWidth: '130px' },
          hide: !actionButtonEnable,
        },
      ];

  return (
    <div
      className={`my-3 border border-[#CBD6E2] rounded-[2px] ${isUpdateLoading ? 'pointer-events-none' : ''}`}
    >
      <div className='flex items-center justify-between px-3.5 border-b border-[#CBD6E2] min-h-[40px] max-h-[40px]'>
        <div className='text-[14px] text-[#2D3E4F] font-semibold'>
          Interaction Question
        </div>
        <div className='flex items-center gap-2'>
          {buttons.map((button, index) => {
            if (button.hide) return null;

            return (
              <TextButton
                key={`section-header-btn-${index}`}
                label={button.label}
                onClick={button.onClick}
                loading={button.loading}
                aria-label={button.label}
                sx={button.sx}
                disabled={button.disabled}
              />
            );
          })}

          <input
            ref={globalFileInputRef}
            type='file'
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
                      {file.fileName}.{file.fileType}
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
                    <button
                      onClick={() => handleDownload(file.fileUrl)}
                      className='p-1 border border-[#CBD6E2] rounded-[2px] cursor-pointer'
                      style={{
                        boxShadow: '0px 1px 2px 0px rgba(42, 54, 71, 0.05)',
                        background:
                          'linear-gradient(180deg, #FFFFFF 0%, #E4E6E7 100%)',
                      }}
                    >
                      <DownloadIcon />
                    </button>
                  )}
                </div>
              )
            )}
          </div>
        </div>
      )}

      {/* Questions */}
      <div>
        {questions.map((q, index) => (
          <div key={q.rid} className='p-3'>
            <div className='font-medium text-[14px] text-[#2D3E4F]'>
              <span className='font-bold'>
                {q.question_seq_num || `Q00${index + 1}`}
              </span>{' '}
              - {q.question}
            </div>

            {isEditing ? (
              <div className='mt-2 relative'>
                <div
                  id={`toolbar-${q.rid}`}
                  className='flex flex-wrap items-center gap-1'
                >
                  <select className='ql-header' defaultValue=''>
                    <option value='1'></option>
                    <option value='2'></option>
                    <option value='3'></option>
                    <option value='4'></option>
                    <option value='5'></option>
                    <option value='6'></option>
                    <option value=''></option>
                  </select>
                  <select className='ql-font'></select>
                  <select className='ql-size'></select>
                  <button className='ql-bold'></button>
                  <button className='ql-italic'></button>
                  <button className='ql-underline'></button>
                  <button className='ql-strike'></button>
                  <button
                    type='button'
                    onClick={() =>
                      questionFileInputRefs.current[q.rid]?.click()
                    }
                    className='ml-2 flex items-center'
                  >
                    <AttachmentsSideIcon className='w-4 h-2.5 attachment-icon' />
                  </button>
                  <select className='ql-color'></select>
                  <select className='ql-background'></select>
                  <button className='ql-script' value='sub'></button>
                  <button className='ql-script' value='super'></button>
                  <button className='ql-blockquote'></button>
                  <button className='ql-list' value='ordered'></button>
                  <button className='ql-list' value='bullet'></button>
                  <button className='ql-indent' value='-1'></button>
                  <button className='ql-indent' value='+1'></button>
                  <button className='ql-direction' value='rtl'></button>
                  <select className='ql-align'></select>
                  <button className='ql-clean'></button>
                </div>

                <ReactQuill
                  value={editedAnswers[q.rid]}
                  onChange={(value) => handleAnswerChange(q.rid, value)}
                  theme='snow'
                  className='rounded-[2px] bg-white'
                  modules={{
                    toolbar: {
                      container: `#toolbar-${q.rid}`,
                    },
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
                    'list',
                    'bullet',
                    'indent',
                    'direction',
                    'align',
                    'clean',
                  ]}
                />

                {/* Hidden File Input */}
                <input
                  ref={(el) => (questionFileInputRefs.current[q.rid] = el)}
                  type='file'
                  className='hidden'
                  onChange={(e) => handleQuestionFileUpload(e, q.rid)}
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
            {(isEditing ? questionAttachments[q.rid] : q.attachments).length >
              0 && (
              <div
                className={`flex flex-col gap-1 mt-1 max-h-[85px] ${
                  (isEditing ? questionAttachments[q.rid] : q.attachments)
                    .length > 2
                    ? 'overflow-auto'
                    : 'overflow-visible'
                }`}
              >
                {(isEditing ? questionAttachments[q.rid] : q.attachments).map(
                  (file, index) => (
                    <div
                      key={index}
                      className='flex items-center justify-between border border-[#CBD6E2] bg-[#FFFBFA] rounded-[2px] p-2 px-3'
                    >
                      <div className='flex items-center gap-2'>
                        <PdfIcon />
                        <div className='text-[14px] text-[#425A76] font-normal'>
                          {file.fileName}.{file.fileType}
                        </div>
                      </div>
                      {isEditing ? (
                        <Tooltip title='Remove file' arrow placement='top'>
                          <button
                            onClick={() =>
                              removeQuestionAttachment(q.rid, index)
                            }
                            className='cursor-pointer p-[4px]'
                          >
                            <KeyContactRemoveIcon />
                          </button>
                        </Tooltip>
                      ) : (
                        <button
                          onClick={() => handleDownload(file.fileUrl)}
                          className='p-1 border border-[#CBD6E2] rounded-[2px] cursor-pointer'
                          style={{
                            boxShadow: '0px 1px 2px 0px rgba(42, 54, 71, 0.05)',
                            background:
                              'linear-gradient(180deg, #FFFFFF 0%, #E4E6E7 100%)',
                          }}
                        >
                          <DownloadIcon />
                        </button>
                      )}
                    </div>
                  )
                )}
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
