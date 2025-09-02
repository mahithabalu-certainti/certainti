import React, { useState, useRef } from 'react';
import { CircularProgress, SxProps, Tooltip } from '@mui/material';
import { Theme } from '@emotion/react';
import ReactQuill from 'react-quill';
import { Attachment, InteractionQuestion } from '../../consultant/types';
import TextButton from '../../components/button/text-button';
import { DownloadIcon, KeyContactRemoveIcon, PdfIcon } from '../../assets';
import { formatDateToYYYYMMDDWithTime } from '../../common-utils';
import {
  InteractionQuestionUpdateRequest,
  useDeleteAttachment,
  useUpdateInteractionQuestion,
  useUploadAttachment,
} from '../../common-service';

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
  isLoading?: boolean;
  actionButtonEnable?: boolean;
  refetchDeetails?: () => void;
  formData?: Record<string, string>;
  createdBy?: string;
  parseToken: {
    auth_token: string;
    email: string;
  };
}

const InteractionQuestions: React.FC<InteractionQuesProps> = ({
  questions,
  globalAttachments,
  isLoading = false,
  actionButtonEnable,
  refetchDeetails,
  formData,
  createdBy,
  parseToken,
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
  // Track which global attachment is being deleted
  const [removingGlobalIdx, setRemovingGlobalIdx] = useState<number | null>(
    null
  );
  // Track which question attachment is being deleted: { [questionId]: index }
  const [removingQuestionAttachment, setRemovingQuestionAttachment] = useState<{
    [key: string]: number | null;
  }>({});

  const globalFileInputRef = useRef<HTMLInputElement | null>(null);
  const questionFileInputRefs = useRef<Record<string, HTMLInputElement | null>>(
    {}
  );

  const uploadFileMutation = useUploadAttachment();
  const updateInteractionQusResponse = useUpdateInteractionQuestion();
  const deleteAttachment = useDeleteAttachment();

  // Inject attachment button into Quill toolbar after mount
  React.useEffect(() => {
    if (!isEditing) return;
    const toolbar = document.querySelectorAll('.ql-toolbar.ql-snow');
    if (!toolbar.length) return;
    questions.forEach((q) => {
      const seqNum =
        typeof q.question_seq_num === 'number'
          ? q.question_seq_num
          : parseInt(q.question_seq_num, 10);
      const toolbarEl =
        toolbar[!isNaN(seqNum) && seqNum > 0 ? seqNum - 1 : 0] || toolbar[0];
      if (!toolbarEl) return;
      // Prevent duplicate button
      if (toolbarEl.querySelector('.custom-attach-btn')) return;
      const span = document.createElement('span');
      span.className = 'ql-formats';
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'custom-attach-btn cursor-pointer';
      btn.innerHTML = `<svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" class="w-4 h-4"><path d="M2.40585 6.0086L1.50604 5.1082C1.02837 4.63053 0.76001 3.98266 0.76001 3.30712C0.76001 2.63159 1.02837 1.98372 1.50604 1.50604C1.98372 1.02837 2.63159 0.76001 3.30712 0.76001C3.98266 0.76001 4.63053 1.02837 5.1082 1.50604L10.5112 6.90899C10.9813 7.38823 11.2432 8.03369 11.24 8.70501C11.2368 9.37633 10.9686 10.0192 10.4939 10.4939C10.0192 10.9686 9.37633 11.2368 8.70501 11.24C8.03369 11.2432 7.38823 10.9813 6.90899 10.5112L4.88311 8.48468C4.59459 8.18415 4.43537 7.7825 4.43962 7.36591C4.44387 6.94933 4.61124 6.55101 4.90583 6.25642C5.20042 5.96184 5.59874 5.79446 6.01532 5.79021C6.43191 5.78597 6.83356 5.94518 7.13409 6.2337L8.25959 7.35919" stroke="#2D3E4F" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"></path></svg>`;
      btn.onclick = () => {
        if (questionFileInputRefs.current[q.rid]) {
          if (questionFileInputRefs.current[q.rid]) {
            questionFileInputRefs.current[q.rid]!.click();
          }
        }
      };
      span.appendChild(btn);
      toolbarEl.appendChild(span);
    });
    // Cleanup on unmount or edit mode off
    return () => {
      document
        .querySelectorAll('.custom-attach-btn')
        .forEach((el) => el.remove());
    };
  }, [isEditing, questions]);

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

    const finalPayload: InteractionQuestionUpdateRequest = {
      account_rid: formData?.account_rid || '',
      project_rid: formData?.project_rid || '',
      project_fiscal_rid: formData?.project_fiscal_rid || '',
      interaction_rid: formData?.interaction_rid || '',
      authToken: parseToken.auth_token,
      userId: parseToken.email,
      ...payload,
    };
    updateInteractionQusResponse.mutate(finalPayload, {
      onSuccess: () => {
        refetchDeetails?.();
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
        authToken: parseToken.auth_token,
        userId: parseToken.email,
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
        authToken: parseToken.auth_token,
        userId: parseToken.email,
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
    const fileObj = newGlobalAttachments.find((_, i) => i === index);
    if (fileObj && fileObj.fileUrl) {
      setRemovingGlobalIdx(index);
      deleteAttachment.mutate(
        {
          authToken: parseToken.auth_token,
          userId: parseToken.email,
          file_url: fileObj.fileUrl,
        },
        {
          onSuccess: () => {
            setNewGlobalAttachments((prev) =>
              prev.filter((_, i) => i !== index)
            );
            setRemovingGlobalIdx(null);
          },
          onSettled: () => {
            setRemovingGlobalIdx(null);
          },
        }
      );
    }
  };
  const removeQuestionAttachment = (questionId: string, index: number) => {
    const fileObj = (questionAttachments[questionId] || [])[index];
    if (fileObj && fileObj.fileUrl) {
      setRemovingQuestionAttachment((prev) => ({
        ...prev,
        [questionId]: index,
      }));
      deleteAttachment.mutate(
        {
          authToken: parseToken.auth_token,
          userId: parseToken.email,
          file_url: fileObj.fileUrl,
        },
        {
          onSuccess: () => {
            setQuestionAttachments((prev) => ({
              ...prev,
              [questionId]: prev[questionId].filter((_, i) => i !== index),
            }));
            setRemovingQuestionAttachment((prev) => ({
              ...prev,
              [questionId]: null,
            }));
          },
          onSettled: () => {
            setRemovingQuestionAttachment((prev) => ({
              ...prev,
              [questionId]: null,
            }));
          },
        }
      );
    }
  };
  const handleDownload = (documentUrl: string) => {
    if (!documentUrl) return;

    const link = document.createElement('a');
    link.href = documentUrl;
    link.download = '';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const isUpdateLoading = updateInteractionQusResponse.isPending || isLoading;
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
          label: 'Edit',
          variant: 'outlined' as const,
          onClick: handleEditClick,
          sx: { width: '60px' },
          hide: !actionButtonEnable,
        },
      ];

  return (
    <>
      <div className='flex justify-between py-2'>
        <span className='text-[14px] text-[#2D3E4F] font-bold'>
          Hello {createdBy}
        </span>
        <div className='flex gap-2'>
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
        </div>
      </div>

      {/* Global Attachments Section */}
      {(isEditing ? newGlobalAttachments : globalAttachments).length > 0 && (
        <div className='p-3 border border-[#CBD6E2] mb-4'>
          <div className='font-semibold text-sm mb-2'>Uploaded Files</div>
          <div
            className={`flex flex-col gap-1 ${
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
                    <React.Suspense fallback={null}>
                      <PdfIcon />
                    </React.Suspense>
                    <div className='text-[14px] text-[#425A76] font-normal'>
                      {file.fileName}.{file.fileType}
                    </div>
                  </div>
                  {isEditing ? (
                    removingGlobalIdx === idx && deleteAttachment.isPending ? (
                      <CircularProgress size={24} />
                    ) : (
                      <Tooltip title='Remove file' arrow placement='top'>
                        <button
                          onClick={() => removeGlobalAttachment(idx)}
                          className='cursor-pointer p-[4px]'
                          disabled={deleteAttachment.isPending}
                        >
                          <React.Suspense fallback={null}>
                            <KeyContactRemoveIcon />
                          </React.Suspense>
                        </button>
                      </Tooltip>
                    )
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
                      <React.Suspense fallback={null}>
                        <DownloadIcon />
                      </React.Suspense>
                    </button>
                  )}
                </div>
              )
            )}
          </div>
        </div>
      )}

      <div
        className={`my-3 border border-[#CBD6E2] rounded-[2px] ${isUpdateLoading ? 'pointer-events-none' : ''}`}
      >
        <div className='flex items-center justify-between px-3.5 border-b border-[#CBD6E2] min-h-[40px] max-h-[40px]'>
          <div className='text-[14px] text-[#2D3E4F] font-semibold'>
            Interaction Question
          </div>
          <div className='flex items-center gap-2'>
            <input
              ref={globalFileInputRef}
              type='file'
              className='hidden'
              onChange={handleGlobalFileUpload}
            />
          </div>
        </div>

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
                  <ReactQuill
                    value={editedAnswers[q.rid]}
                    onChange={(value) => handleAnswerChange(q.rid, value)}
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
                          <React.Suspense fallback={null}>
                            <PdfIcon />
                          </React.Suspense>
                          <div className='text-[14px] text-[#425A76] font-normal'>
                            {file.fileName}.{file.fileType}
                          </div>
                        </div>
                        {isEditing ? (
                          removingQuestionAttachment[q.rid] === index &&
                          deleteAttachment.isPending ? (
                            <CircularProgress size={24} />
                          ) : (
                            <Tooltip title='Remove file' arrow placement='top'>
                              <button
                                onClick={() =>
                                  removeQuestionAttachment(q.rid, index)
                                }
                                className='cursor-pointer p-[4px]'
                                disabled={deleteAttachment.isPending}
                              >
                                <React.Suspense fallback={null}>
                                  <KeyContactRemoveIcon />
                                </React.Suspense>
                              </button>
                            </Tooltip>
                          )
                        ) : (
                          <button
                            onClick={() => handleDownload(file.fileUrl)}
                            className='p-1 border border-[#CBD6E2] rounded-[2px] cursor-pointer'
                            style={{
                              boxShadow:
                                '0px 1px 2px 0px rgba(42, 54, 71, 0.05)',
                              background:
                                'linear-gradient(180deg, #FFFFFF 0%, #E4E6E7 100%)',
                            }}
                          >
                            <React.Suspense fallback={null}>
                              <DownloadIcon />
                            </React.Suspense>
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
    </>
  );
};

export default InteractionQuestions;
