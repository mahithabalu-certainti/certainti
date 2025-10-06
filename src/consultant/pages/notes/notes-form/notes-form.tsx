import React, { useEffect, useMemo, useRef, useState } from 'react';
import { NotesSideIcon, UploadIcon } from '../../../../assets';
import SingleSkeleton from '../../../../components/skeleton-component/singleskeleton';
import TextButton from '../../../../components/button/text-button';
import SkeletonForm from '../../../../components/form-builder/skeleton-form';
import { FormBuilder } from '../../../../components/form-builder';
import { FileList } from '../../../../components/file-list';
import { NotesFormData } from './form-data';
import { Layout } from '../../../../common-service';
import {
  useCreateNote,
  useNoteDetails,
  useUpdateNote,
} from '../../../services/notes/notes-service';
import { useParams, useSearchParams } from 'react-router-dom';
import {
  formatDateToYYYYMMDDWithTime,
  getFiscalYears,
} from '../../../../common-utils';
import { NotesFormDataPayload } from '../../../types';
import { useToast } from '../../../../hooks';

const MAX_FILE_SIZE_MB = 100;
const RESTRICTED_EXTENSIONS = /\.(exe|bat|cmd|sh|bash)$/i;

const ACCEPTED_FILE_TYPES = [
  'text/csv',
  'application/vnd.ms-excel', // .xls
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
  'application/pdf', // .pdf
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
  'image/png', // .png
  'image/jpeg', // .jpg
  'text/plain', // .txt
];

const NotesForm: React.FC = () => {
  const { noteId } = useParams();
  const { successToast } = useToast();
  const [searchParams] = useSearchParams();
  const isEditView = location.pathname.split('/').slice(-2, -1)[0] === 'edit';
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [message, setMessage] = useState<{
    type: 'error' | 'success';
    text: string;
  } | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const accountId = searchParams.get('accountId') || '';
  const entityLevel = searchParams.get('entityLevel') || '';
  const entityId = searchParams.get('entityId') || '';
  const projectFiscalYear = searchParams.get('projectFiscalYear') || '';
  const sourcePath = searchParams.get('source') || '';

  const createNote = useCreateNote();
  const updateNote = useUpdateNote();
  const { data, isLoading } = useNoteDetails(entityId, noteId, isEditView);

  const minYear = 1950;
  const currentYear = new Date().getFullYear();
  const fiscalYears = getFiscalYears(currentYear - minYear + 1);

  const noteFormData = useMemo(
    () => ({
      ...(data && {
        title: data?.title || '',
        notes_owner: data?.notes_owner || '',
        descriptions: data?.descriptions || '',
        fiscal_year: data?.fiscal_year || '',
        rid: data?.rid || '',
        r_number: data?.r_number || '',
        created_on: formatDateToYYYYMMDDWithTime(data?.created_datetime || '-'),
        updated_on: data?.modified_datetime
          ? formatDateToYYYYMMDDWithTime(data?.modified_datetime || '-')
          : '-',
        created_by: data?.created_by || '-',
        updated_by: data?.modified_by || '-',
      }),
    }),
    [data]
  );

  const commonSuccess = createNote.isSuccess || updateNote.isSuccess;

  useEffect(() => {
    if (commonSuccess) {
      successToast(
        isEditView ? 'Note updated successfully' : 'Note created successfully'
      );
      goBack();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [commonSuccess, isEditView]);

  const showError = (text: string) => {
    setMessage({ type: 'error', text });
  };

  const validateFiles = (files: FileList | null): File[] => {
    if (!files) return [];
    const validFiles: File[] = [];
    for (const file of Array.from(files)) {
      const isAcceptedType =
        ACCEPTED_FILE_TYPES.includes(file.type) ||
        /\.(csv|xls|xlsx)$/i.test(file.name);
      if (!isAcceptedType) {
        showError(`"${file.name}" is not a valid CSV or Excel file.`);
        continue;
      }
      if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
        showError(`"${file.name}" exceeds the ${MAX_FILE_SIZE_MB}MB limit.`);
        continue;
      }
      if (RESTRICTED_EXTENSIONS.test(file.name)) {
        showError(
          `"${file.name}" type is not allowed (.exe, .bat, .cmd, .sh, .bash).`
        );
        continue;
      }
      validFiles.push(file);
    }
    return validFiles;
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(null);
    const validFiles = validateFiles(e.target.files);
    if (validFiles.length > 0) {
      setSelectedFiles([validFiles[0]]);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (selectedFiles.length > 0) return;
    setMessage(null);
    const validFiles = validateFiles(e.dataTransfer.files);
    if (validFiles.length > 0) {
      setSelectedFiles([validFiles[0]]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const openFileDialog = () => {
    if (selectedFiles.length === 0) {
      fileInputRef.current?.click();
    }
  };

  const handleExternalSubmit = () => {
    formRef.current?.requestSubmit();
  };

  const handleSubmitData = (data: Partial<NotesFormDataPayload>) => {
    if (!isEditView) {
      if (selectedFiles.length === 0) {
        showError('Please select a file before submitting.');
        return;
      }

      const file = selectedFiles[0];
      if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
        showError(
          `"${file.name}" exceeds the ${MAX_FILE_SIZE_MB}MB limit. Please upload a smaller file.`
        );
        return;
      }
    }
    setLoading(true);

    const payload = {
      account_rid: accountId || '',
      entity_level: entityLevel,
      entity_id: entityId,
      fiscal_year: projectFiscalYear ?? data?.fiscal_year,
      title: data?.title || '',
      notes_owner: data?.notes_owner || '',
      descriptions: data?.descriptions || '',
      ...(isEditView && { rid: data?.rid || '' }),
    };

    const formData = new FormData();
    formData.append('attachment', selectedFiles[0] as Blob);
    formData.append('data', JSON.stringify(payload));

    if (isEditView) {
      updateNote.mutate(formData);
    } else {
      createNote.mutate(formData);
    }
    setLoading(false);
  };

  const formConfig = NotesFormData(
    isEditView,
    fiscalYears,
    !!projectFiscalYear
  );

  const goBack = () => {
    window.history.back();
  };

  const formLoading = isLoading;

  return (
    <div>
      <div className='h-[50px] flex items-center justify-between px-10 sticky top-0 z-10 bg-white'>
        <div className='flex items-center w-[80%] max-w-[80%]'>
          <NotesSideIcon
            alt='note-icon'
            className={`w-7 h-7 p-[5px] [&>path]:stroke-white bg-[#7F81F4] rounded`}
          />
          <div className='w-[90%]'>
            {isLoading ? (
              <div className='ml-2'>
                <SingleSkeleton width={150} height={12} />
              </div>
            ) : (
              <div className='font-semibold text-[12px] leading-[20px] ml-2 mb-[-6px] text-[#7D98B6]'>
                {sourcePath
                  ? `${sourcePath}${isEditView ? ` > ${data?.r_number}` : ''}`
                  : `Note ${isEditView ? `> ${data?.r_number}` : ''}`}
              </div>
            )}
            <h5 className='text-[16px] font-bold ml-2 text-[#2D3E4F]'>
              {isEditView ? 'Edit Note' : 'Create Note'}
            </h5>
          </div>
        </div>
        <div className='flex gap-3'>
          <TextButton
            label='Save'
            loading={createNote.isPending || updateNote.isPending}
            onClick={handleExternalSubmit}
            sx={{
              width: '64px',
              minWidth: '64px',
              fontSize: '13px',
              fontWeight: 400,
            }}
          />
          <TextButton
            label='Cancel'
            onClick={goBack}
            disabled={createNote.isPending || updateNote.isPending}
            sx={{
              width: '75px',
              minWidth: '75px',
              fontSize: '12px',
              fontWeight: 400,
            }}
          />
        </div>
      </div>

      <div className={`${isEditView ? 'pb-10' : 'pb-4'}`}>
        {formLoading ? (
          <SkeletonForm />
        ) : (
          <div style={{ pointerEvents: loading ? 'none' : 'all' }}>
            <FormBuilder
              loading={false}
              data={formConfig}
              values={isEditView ? { ...noteFormData } : {}}
              outData={handleSubmitData}
              formRef={formRef}
              layout={Layout.TYPE_1}
            />

            <div className={`mt-4 ${isEditView ? 'hidden' : 'block'}`}>
              <div className='border capitalize h-[30px] border-box border-[#CBD6E2] font-bold text-[14px] text-[#2D3E4F] leading-[21px] tracking-[0%] align-middle py-1 bg-[#ECECEC] px-10'>
                Attachment
              </div>

              <div className='flex flex-col items-center justify-center gap-4 px-4 py-5'>
                <div
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onClick={openFileDialog}
                  className={`h-[116px] w-[502px] border-[2px] border-dashed rounded-[8px] flex flex-col items-center justify-center gap-2
              ${selectedFiles.length > 0 ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              ${message?.type === 'error' ? 'border-red-600 bg-[#FEF2F2]' : 'border-[#0176D3] bg-[#F4F6F9]'}
            `}
                  style={{
                    pointerEvents: selectedFiles.length > 0 ? 'none' : 'all',
                  }}
                >
                  <UploadIcon alt='Upload Icon' className='w-[36px] h-[24px]' />
                  <div
                    className='text-[14px] text-[#0B0B0B]'
                    style={{ whiteSpace: 'nowrap' }}
                  >
                    Drag your file or{' '}
                    <span
                      className='text-[#0176D3] underline'
                      onClick={(e) => {
                        e.stopPropagation();
                        openFileDialog();
                      }}
                    >
                      browse
                    </span>
                  </div>
                  <input
                    type='file'
                    accept='.csv,.xls,.xlsx,.pdf,.docx,.png,.jpg,.txt'
                    className='hidden'
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                  />
                </div>

                {/* Reserved space for error messages to prevent button movement */}
                <div className='w-[502px] max-w-[502px] mt-2'>
                  {message && (
                    <div
                      className={`text-sm ${
                        message.type === 'error'
                          ? 'text-red-600'
                          : 'text-green-600'
                      }`}
                    >
                      {message.text}
                    </div>
                  )}
                </div>

                <FileList
                  fileInputRef={fileInputRef}
                  selectedFiles={selectedFiles}
                  setSelectedFiles={setSelectedFiles}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotesForm;
