import React, { useState, useRef, useEffect } from 'react';
import { CircularProgress, SxProps, Tooltip } from '@mui/material';
import { Theme } from '@emotion/react';
import ReactQuill, { Quill } from 'react-quill';
import { Attachment, InteractionQuestion } from '../../consultant/types';
import TextButton from '../../components/button/text-button';
import {
  AttachmentsSideIcon,
  DocumentIcon,
  DownloadIcon,
  EditTextIcon,
  KeyContactRemoveIcon,
} from '../../assets';
import { formatDateToYYYYMMDDWithTime } from '../../common-utils';
import {
  InteractionQuestionUpdateRequest,
  useDeleteAttachment,
  useUpdateInteractionQuestion,
  useUploadAttachment,
} from '../../common-service';
import { useToast } from '../../hooks';
import { InfoSection } from '../../components';
import { DisplayColumn, transformInteractionData } from './ultils';

interface SectionHeaderButton {
  label: string;
  variant: 'text' | 'outlined' | 'contained';
  onClick: () => void;
  sx?: SxProps<Theme>;
  hide?: boolean;
  disabled?: boolean;
  loading?: boolean;
}

const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
  'text/csv',
];

const MAX_FILE_SIZE = 20 * 1024 * 1024;
const MAX_FILES_LIMIT = 10;
export interface HeaderData {
  interactionId: string;
  projectId: string;
  projectName: string;
  accountName: string;
  accountId: string;
  projectCode: string;
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
  isEditEnable?: boolean;
  headerData?: HeaderData;
}
enum FlagTypeEnum {
  draft = 'draft',
  submit = 'submit',
}

const Font = Quill.import('formats/font');
const Size = Quill.import('formats/size');
Size.whitelist = ['small', 'medium', 'large', 'huge'];
Font.whitelist = ['sans-serif', 'serif', 'monospace'];
Quill.register(Font, true);
Quill.register(Size, true);

const InteractionQuestions: React.FC<InteractionQuesProps> = ({
  questions,
  globalAttachments,
  isLoading = false,
  actionButtonEnable,
  refetchDeetails,
  formData,
  createdBy,
  parseToken,
  isEditEnable,
  headerData,
}) => {
  console.log('questions', formData);
  const { successToast, errorToast } = useToast();
  const [isEditing, setIsEditing] = useState<boolean>(true);
  const [activeFlag, setActiveFlag] = useState<FlagTypeEnum | null>(null);
  const [validationErrors, setValidationErrors] = useState<
    Record<string, boolean>
  >({});

  const [showOptionsPerQuestion, setShowOptionsPerQuestion] = useState<
    Record<string, boolean>
  >({});

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
  const [headerIntertaction, setHeaderInteraction] = useState<DisplayColumn[]>(
    []
  );

  useEffect(() => {
    // Initialize all toolbars as hidden
    const initialToolbarState = questions.reduce(
      (acc, q) => {
        acc[q.rid] = false;
        return acc;
      },
      {} as Record<string, boolean>
    );
    setShowOptionsPerQuestion(initialToolbarState);
  }, [questions, isEditing]);
  useEffect(() => {
    setHeaderInteraction(
      headerData ? transformInteractionData(headerData) : []
    );
  }, [headerData]);
  const handleEditClick = () => {
    setIsEditing(true);
    setValidationErrors({});
  };
  // const handleCancel = () => {
  //   setIsEditing(false);
  //   setValidationErrors({});

  //   // revert answers
  //   setEditedAnswers(
  //     questions.reduce(
  //       (acc, q) => {
  //         acc[q.rid] = q.response || '';
  //         return acc;
  //       },
  //       {} as Record<string, string>
  //     )
  //   );

  //   // revert global attachments
  //   setNewGlobalAttachments(globalAttachments || []);

  //   // revert question attachments
  //   setQuestionAttachments(
  //     questions.reduce(
  //       (acc, q) => {
  //         acc[q.rid] = q.attachments || [];
  //         return acc;
  //       },
  //       {} as Record<string, Attachment[]>
  //     )
  //   );
  // };
  const sanitizeQuillValue = (value: string) => {
    const trimmed = value.replace(/<(.|\n)*?>/g, '').trim();
    return trimmed ? value : '';
  };
  const validateMandatoryQuestions = () => {
    const errors: Record<string, boolean> = {};
    let isValid = true;

    questions.forEach((q) => {
      if (q.is_mandatory) {
        const answer = sanitizeQuillValue(editedAnswers[q.rid] || '');
        if (!answer) {
          errors[q.rid] = true;
          isValid = false;
        }
      }
    });

    setValidationErrors(errors);
    return isValid;
  };
  const handleSave = async (flag: FlagTypeEnum) => {
    // For submit action, validate mandatory questions
    if (flag === FlagTypeEnum.submit && !validateMandatoryQuestions()) {
      return;
    }
    setActiveFlag(flag);
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
      response_source: 'Email',
      ...payload,
    };
    updateInteractionQusResponse.mutate(finalPayload, {
      onSuccess: async () => {
        await refetchDeetails?.();
        setValidationErrors({});
        setActiveFlag(null);
        successToast(
          flag === FlagTypeEnum.draft
            ? 'Draft saved successfully'
            : 'Interaction submitted successfully'
        );
      },
      onError: () => {
        setActiveFlag(null);
        errorToast('Failed to save response. Please try again.');
      },
    });
  };
  const handleAnswerChange = (questionId: string, value: string) => {
    setEditedAnswers((prev) => ({
      ...prev,
      [questionId]: value,
    }));
    if (validationErrors[questionId]) {
      setValidationErrors((prev) => ({
        ...prev,
        [questionId]: false,
      }));
    }
  };

  const validateFile = (file: File): { isValid: boolean; error?: string } => {
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      return {
        isValid: false,
        error:
          'Only document files (PDF, Word, Excel, PowerPoint, Text) are allowed',
      };
    }

    if (file.size > MAX_FILE_SIZE) {
      return {
        isValid: false,
        error: 'File size must be less than 20MB',
      };
    }

    return { isValid: true };
  };

  const handleGlobalFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file count limit
    if (newGlobalAttachments.length >= MAX_FILES_LIMIT) {
      errorToast(
        `You can only upload up to ${MAX_FILES_LIMIT} attachments per response`
      );
      e.target.value = '';
      return;
    }

    // Validate file
    const validation = validateFile(file);
    if (!validation.isValid) {
      errorToast(validation?.error || '');
      e.target.value = '';
      return;
    }

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

    const currentQuestionFiles = questionAttachments[questionId] || [];
    if (currentQuestionFiles.length >= MAX_FILES_LIMIT) {
      errorToast(
        `You can only upload up to ${MAX_FILES_LIMIT} attachments per response`
      );
      e.target.value = '';
      return;
    }

    // Validate file
    const validation = validateFile(file);
    if (!validation.isValid) {
      errorToast(validation?.error || '');
      e.target.value = '';
      return;
    }

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

  const toggleQuestionOptions = (questionId: string) => {
    setShowOptionsPerQuestion((prev) => ({
      ...prev,
      [questionId]: !prev[questionId],
    }));
  };

  const isUpdateLoading = updateInteractionQusResponse.isPending || isLoading;
  const buttons: SectionHeaderButton[] = isEditing
    ? [
        {
          label: 'Draft',
          variant: 'contained' as const,
          onClick: () => handleSave(FlagTypeEnum.draft),
          sx: { width: '60px', minWidth: '60px' },
          loading: activeFlag === FlagTypeEnum.draft && isUpdateLoading,
          disabled:
            (activeFlag !== null && activeFlag !== FlagTypeEnum.draft) ||
            uploadFileMutation.isPending,
        },
        {
          label: 'Submit',
          variant: 'contained' as const,
          onClick: () => handleSave(FlagTypeEnum.submit),
          sx: { width: '64px', minWidth: '64px' },
          loading: activeFlag === FlagTypeEnum.submit && isUpdateLoading,
          disabled:
            (activeFlag !== null && activeFlag !== FlagTypeEnum.submit) ||
            uploadFileMutation.isPending,
        },
        {
          label: 'Upload Files',
          variant: 'outlined' as const,
          onClick: () => globalFileInputRef.current?.click(),
          sx: { width: '100px', minWidth: '100px' },
          disabled: isUpdateLoading || uploadFileMutation.isPending,
        },
        // {
        //   label: 'Cancel',
        //   variant: 'outlined' as const,
        //   onClick: handleCancel,
        //   sx: { width: '75px', minWidth: '75px' },
        //   disabled: isUpdateLoading || uploadFileMutation.isPending,
        // },
      ]
    : [
        {
          label: 'Edit',
          variant: 'outlined' as const,
          onClick: handleEditClick,
          sx: { width: '60px' },
          hide: !actionButtonEnable,
          disabled: !isEditEnable,
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

      <div
        className={`my-3 border border-[#CBD6E2] rounded-[2px] ${isUpdateLoading ? 'pointer-events-none' : ''}`}
      >
        <InfoSection
          columns={headerIntertaction}
          loading={isLoading}
          singleLineView={false}
        />
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
              accept='.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv'
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
                  {q.is_mandatory && (
                    <span className='text-red-500 ml-1'>*</span>
                  )}
                </span>{' '}
                - {q.question}
              </div>

              {isEditing ? (
                <div className='flex items-start gap-2.5 mt-2 relative'>
                  <div className='w-full'>
                    <ReactQuill
                      value={editedAnswers[q.rid]}
                      onChange={(value) => handleAnswerChange(q.rid, value)}
                      theme='snow'
                      className={`rounded-[2px] ${showOptionsPerQuestion[q.rid] ? '[&_.ql-toolbar]:block' : '[&_.ql-toolbar]:!hidden h-[55px] border-[#CBD6E2] border-t [&_.ql-container]:border-t [&_.ql-container]:border-[#CBD6E2]'} ${validationErrors[q.rid] ? 'border border-red-500 bg-[#FEF2F2]' : 'bg-white'}`}
                      modules={{
                        toolbar: [
                          [{ header: [1, 2, 3, 4, 5, 6, false] }],
                          [{ font: Font.whitelist }],
                          [{ size: Size.whitelist }],
                          ['bold', 'italic', 'underline', 'strike'],
                          [{ color: [] }, { background: [] }],
                          [{ script: 'sub' }, { script: 'super' }],
                          ['blockquote', 'code-block'],
                          [{ list: 'ordered' }, { list: 'bullet' }],
                          [{ indent: '-1' }, { indent: '+1' }],
                          [{ direction: 'rtl' }],
                          [{ align: [] }],
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
                        'list',
                        'bullet',
                        'indent',
                        'direction',
                        'align',
                      ]}
                    />
                    {validationErrors[q.rid] && (
                      <div className='text-red-500 text-sm mt-1'>
                        This question is mandatory
                      </div>
                    )}
                  </div>

                  <div className={`flex flex-col justify-center gap-2`}>
                    <Tooltip title='Add Attachment' arrow placement='top'>
                      <button
                        type='button'
                        onClick={() =>
                          questionFileInputRefs.current[q.rid]?.click()
                        }
                        className='flex border border-[#CBD6E2] w-[24px] h-[24px] bg-[linear-gradient(180deg,_#FFFFFF_0%,_#E4E6E7_100%)] justify-center items-center cursor-pointer mx-auto'
                      >
                        <AttachmentsSideIcon className='w-3.5 h-3.5' />
                      </button>
                    </Tooltip>
                    <Tooltip
                      title={
                        showOptionsPerQuestion[q.rid]
                          ? 'Hide Options'
                          : 'Show Options'
                      }
                      arrow
                      placement='top'
                    >
                      <button
                        type='button'
                        onClick={() => toggleQuestionOptions(q.rid)}
                        className='flex border border-[#CBD6E2] w-[24px] h-[24px] bg-[linear-gradient(180deg,_#FFFFFF_0%,_#E4E6E7_100%)] justify-center items-center cursor-pointer mx-auto'
                      >
                        <EditTextIcon className='w-4.5 h-4.5' />
                      </button>
                    </Tooltip>
                  </div>

                  {/* Hidden File Input */}
                  <input
                    ref={(el) => (questionFileInputRefs.current[q.rid] = el)}
                    type='file'
                    className='hidden'
                    onChange={(e) => handleQuestionFileUpload(e, q.rid)}
                    accept='.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv'
                  />
                </div>
              ) : (
                <div
                  className={`
  mt-2 border border-[#CBD6E2] rounded-[2px] py-2 px-3 min-h-20
  text-[14px] text-[#425A76] font-normal bg-[#FFFBFA]

  [&_p]:mb-2
  [&_strong]:font-bold [&_em]:italic
  [&_u]:underline [&_s]:line-through

  [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:mb-3
  [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:mb-2
  [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:mb-2
  [&_h4]:text-base [&_h4]:font-medium [&_h4]:mb-1
  [&_h5]:text-sm [&_h5]:font-medium [&_h5]:mb-1
  [&_h6]:text-xs [&_h6]:font-medium [&_h6]:mb-1

  [&_ul]:list-disc [&_ul]:pl-5
  [&_ol]:list-decimal [&_ol]:pl-5
  [&_li]:mb-1

  [&_a]:text-blue-600 [&_a]:underline
  [&_blockquote]:border-l-2 [&_blockquote]:pl-3 [&_blockquote]:italic

  [&_code]:font-mono [&_code]:bg-gray-100 [&_code]:px-1 [&_code]:rounded
  [&_pre]:font-mono [&_pre]:bg-gray-100 [&_pre]:p-2 [&_pre]:rounded [&_pre]:overflow-x-auto

  [&_img]:max-w-full [&_img]:rounded
  [&_table]:border-collapse [&_table]:border [&_table]:border-gray-300 [&_table]:my-2
  [&_th]:border [&_th]:border-gray-300 [&_th]:bg-gray-100 [&_th]:px-2 [&_th]:py-1
  [&_td]:border [&_td]:border-gray-300 [&_td]:px-2 [&_td]:py-1
`}
                  dangerouslySetInnerHTML={{ __html: q.response || '' }}
                />
              )}

              {/* Question-specific attachments */}
              {(isEditing ? questionAttachments[q.rid] : q.attachments).length >
                0 && (
                <div
                  className={`flex flex-col gap-1 mt-1 ${isEditing ? 'w-[96.5%]' : 'w-full'} max-h-[85px] ${
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
                            <DocumentIcon className='w-6 h-6' />
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
          {/* Global Attachments Section */}
          {(isEditing ? newGlobalAttachments : globalAttachments).length >
            0 && (
            <div className='p-3 border border-[#CBD6E2] mb-4'>
              <div className='font-semibold text-sm mb-2'>Uploaded Files</div>
              <div
                className={`flex flex-col gap-1 ${
                  (isEditing ? newGlobalAttachments : globalAttachments)
                    .length > 2
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
                          <DocumentIcon className='w-6 h-6' />
                        </React.Suspense>
                        <div className='text-[14px] text-[#425A76] font-normal'>
                          {file.fileName}.{file.fileType}
                        </div>
                      </div>
                      {isEditing ? (
                        removingGlobalIdx === idx &&
                        deleteAttachment.isPending ? (
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
        </div>
      </div>
    </>
  );
};

export default InteractionQuestions;
