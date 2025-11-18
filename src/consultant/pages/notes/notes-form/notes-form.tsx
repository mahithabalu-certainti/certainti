import React, { useEffect, useMemo, useRef, useState } from 'react';
import { NotesSideIcon, UploadIcon } from '../../../../assets';
import SingleSkeleton from '../../../../components/skeleton-component/singleskeleton';
import TextButton from '../../../../components/button/text-button';
import SkeletonForm from '../../../../components/form-builder/skeleton-form';
import { FormBuilder } from '../../../../components/form-builder';
import { FileList } from '../../../../components/file-list';
import { NotesFormData } from './form-data';
import { AllPermissions, Layout } from '../../../../common-service';
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
import { RootState } from '../../../../store/store';
import { useSelector } from 'react-redux';
import { useManageUserList } from '../../../../admin/service';

const MAX_FILE_SIZE_MB = 100;
const RESTRICTED_EXTENSIONS = /\.(exe|bat|cmd|sh|bash)$/i;

const ACCEPTED_FILE_TYPES = [
  'text/csv',
  'application/vnd.ms-excel', // .xls
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
  'application/pdf', // .pdf
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
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
  const [disableFiscalYear, setDisableFiscalYear] = useState<boolean>(false);
  const [existingFile, setExistingFile] = useState<{
    name: string;
    url: string;
    size: string;
    format: string;
  } | null>(null);
  const [auditInfo, setAuditInfo] = useState<{
    rid: string;
    r_number: string;
    created_on: string;
    created_by: string;
    updated_on: string;
    updated_by: string;
  }>({
    rid: '',
    r_number: '',
    created_on: '',
    created_by: '',
    updated_on: '',
    updated_by: '',
  });

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const accountId = searchParams.get('accountId') || '';
  const entityLevel = searchParams.get('entityLevel') || '';
  const entityId = searchParams.get('entityId') || '';
  const entityFiscalYear =
    searchParams.get('projectFiscalYear') ||
    searchParams.get('caseFiscalYear') ||
    '';
  const sourcePath = searchParams.get('source') || '';

  const isFromGlobalNotes = sourcePath?.toLowerCase() === 'notes';

  const createNote = useCreateNote();
  const updateNote = useUpdateNote();
  const { data: noteData, isLoading } = useNoteDetails(
    accountId,
    noteId,
    isEditView
  );

  // User List Api
  const { data: userListData, isLoading: userListLoading } = useManageUserList({
    page: 1,
    limit: 2000,
    sortBy: 'first_name',
    sortOrder: 'ASC',
  });

  const minYear = 1950;
  const currentYear = new Date().getFullYear();
  const fiscalYears = getFiscalYears(currentYear - minYear + 1);

  // Permissions
  const { permission } = useSelector((state: RootState) => state.permission);

  const notesEditFields = useMemo(
    () =>
      permission?.find((item) => item.name === AllPermissions.NOTES_VIEW_EDIT)
        ?.fields ?? [],
    [permission]
  );

  const permissionMap = useMemo(() => {
    const map: Record<string, { read: boolean; edit: boolean }> = {};
    notesEditFields.forEach((item) => {
      map[item.name] = { read: item.read ?? false, edit: item.edit ?? false };
    });
    return map;
  }, [notesEditFields]);

  const noteFormData = useMemo(
    () => ({
      ...(noteData && {
        title: noteData?.title || '',
        notes_owner: noteData?.notes_owner || '',
        descriptions: noteData?.descriptions || '',
        fiscal_year: noteData?.fiscal_year || '',
        rid: noteData?.rid || '',
        r_number: noteData?.r_number || '',
        related_to: noteData?.attachment_level || '',
        related_to_name: noteData?.attached_to || '',
        created_on: formatDateToYYYYMMDDWithTime(
          noteData?.created_datetime || '-'
        ),
        updated_on: noteData?.modified_datetime
          ? formatDateToYYYYMMDDWithTime(noteData?.modified_datetime || '-')
          : '-',
        created_by: noteData?.created_by_name || '-',
        updated_by: noteData?.modified_by_name || '-',
      }),
    }),
    [noteData]
  );

  const userListOptions = useMemo(() => {
    return (
      userListData?.data?.users?.map((item) => ({
        value: item.rid,
        label: `${item.first_name} ${item.last_name}`,
      })) || []
    );
  }, [userListData]);

  useEffect(() => {
    if (isEditView && noteData) {
      const disableLevel =
        noteData?.attachment_level?.toLowerCase() === 'project' ||
        noteData?.attachment_level?.toLowerCase() === 'project_resource' ||
        noteData?.attachment_level?.toLowerCase() === 'project_task' ||
        noteData?.attachment_level?.toLowerCase() === 'case';
      setDisableFiscalYear(disableLevel);
    }
  }, [noteData, isEditView]);

  useEffect(() => {
    if (isEditView && noteData) {
      if (
        noteData?.browse_file &&
        noteData?.document_name &&
        noteData?.size_in_mb &&
        noteData?.format
      ) {
        setExistingFile({
          name: noteData?.document_name || '',
          url: noteData?.browse_file,
          size: noteData?.size_in_mb ? `${noteData.size_in_mb} MB` : '-',
          format: noteData?.format || '',
        });
      }
      setAuditInfo({
        rid: noteData?.rid || '',
        r_number: noteData?.r_number || '',
        created_by: noteData?.created_by_name || '',
        updated_by: noteData?.modified_by_name || '-',
        created_on: formatDateToYYYYMMDDWithTime(
          noteData?.created_datetime || '-'
        ),
        updated_on: noteData?.modified_datetime
          ? formatDateToYYYYMMDDWithTime(noteData?.modified_datetime || '-')
          : '-',
      });
    }
  }, [isEditView, noteData]);

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
      if (/\s/.test(file.name)) {
        showError(
          `"${file.name}" is invalid. File name must not contain spaces.`
        );
        continue;
      }

      const isAcceptedType =
        ACCEPTED_FILE_TYPES.includes(file.type) ||
        /\.(csv|xls|xlsx|pdf|docx)$/i.test(file.name);

      if (!isAcceptedType) {
        showError(
          `"${file.name}" is not a valid file. Only .csv, .xls, .xlsx, .pdf, or .docx files are allowed.`
        );
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
      setExistingFile(null);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (selectedFiles.length > 0) return;
    setMessage(null);
    const validFiles = validateFiles(e.dataTransfer.files);
    if (validFiles.length > 0) {
      setSelectedFiles([validFiles[0]]);
      setExistingFile(null);
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
    if (selectedFiles.length === 0) {
      setMessage(null);
    }

    // File validation only if a file is selected
    if (!existingFile && selectedFiles.length > 0) {
      const file = selectedFiles[0];
      if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
        showError(
          `"${file.name}" exceeds the ${MAX_FILE_SIZE_MB}MB limit. Please upload a smaller file.`
        );
        return;
      }
    }

    // build payload fields
    const accountRid = noteData?.account_rid || accountId || '';
    const attachTo = noteData?.attach_to || entityId;
    const attachmentLevel = noteData?.attachment_level || entityLevel;
    const fiscalYear = entityFiscalYear || data?.fiscal_year;
    const title = data?.title || '';
    const notesOwner = data?.notes_owner || '';
    const descriptions = data?.descriptions || '';

    const formData = new FormData();
    if (selectedFiles.length > 0) {
      formData.append('notes', selectedFiles[0]);
    }
    formData.append('account_rid', accountRid);
    formData.append('attach_to', attachTo);
    formData.append('attachment_level', attachmentLevel);
    formData.append('fiscal_year', String(fiscalYear));
    formData.append('title', title);
    formData.append('notes_owner', notesOwner);
    formData.append('descriptions', descriptions);

    if (!existingFile && isEditView && selectedFiles.length === 0) {
      formData.append('is_file_deleted', 'true');
    }

    if (isEditView) {
      formData.append('rid', noteData?.rid || '');
      updateNote.mutate(formData);
    } else {
      createNote.mutate(formData);
    }
  };

  const formConfig = NotesFormData(
    isEditView,
    fiscalYears,
    userListOptions,
    !!entityFiscalYear,
    disableFiscalYear,
    isFromGlobalNotes,
    permissionMap
  );

  const goBack = () => {
    window.history.back();
  };

  const formLoading = isLoading || userListLoading;

  const hideAttachments =
    isEditView &&
    !permissionMap?.['browse_file']?.read &&
    !permissionMap?.['browse_file']?.edit;
  const disableAttachments =
    isEditView &&
    permissionMap?.['browse_file']?.read &&
    !permissionMap?.['browse_file']?.edit;

  return (
    <div>
      <div className='h-[50px] flex items-center justify-between px-10 sticky top-0 z-10 bg-white border-b border-[#CBD6E2]'>
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
                  ? `${sourcePath}${isEditView ? ` > ${noteData?.r_number}` : ''}`
                  : `Note ${isEditView ? `> ${noteData?.r_number}` : ''}`}
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
          <div
            style={{
              pointerEvents:
                createNote.isPending || updateNote.isPending ? 'none' : 'all',
            }}
          >
            <FormBuilder
              loading={false}
              data={formConfig}
              values={isEditView ? { ...noteFormData } : {}}
              outData={handleSubmitData}
              formRef={formRef}
              layout={Layout.TYPE_1}
            />

            <div
              className={`mt-4 ${hideAttachments ? 'hidden' : 'block'}`}
              style={{
                pointerEvents: disableAttachments ? 'none' : 'all',
              }}
            >
              <div className='border capitalize h-[30px] border-box border-[#CBD6E2] font-bold text-[14px] text-[#2D3E4F] leading-[21px] tracking-[0%] align-middle py-1 bg-[#ECECEC] px-10'>
                Attachment
              </div>

              <div className='flex flex-col items-center justify-center gap-4 px-4 py-5'>
                <div
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onClick={openFileDialog}
                  className={`h-[116px] w-[502px] border-[2px] border-dashed rounded-[8px] flex flex-col items-center justify-center gap-2
              ${selectedFiles.length > 0 || existingFile ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              ${message?.type === 'error' ? 'border-red-600 bg-[#FEF2F2]' : 'border-[#0176D3] bg-[#F4F6F9]'}
            `}
                  style={{
                    pointerEvents:
                      selectedFiles.length > 0 || existingFile ? 'none' : 'all',
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
                    accept='.csv,.xls,.xlsx,.pdf,.docx'
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
                  existingFiles={existingFile ? [existingFile] : []}
                  onRemoveExistingFile={() => setExistingFile(null)}
                  disabled={disableAttachments}
                />
              </div>
            </div>

            <div className={`${isEditView ? 'block' : 'hidden'}`}>
              <div
                className={`border capitalize h-[30px] border-box border-[#CBD6E2] font-bold text-[14px] text-[#2D3E4F] leading-[21px] tracking-[0%] align-middle py-1 bg-[#ECECEC] px-10`}
              >
                Audit Information
              </div>
              <div className='grid md:grid-cols-3 gap-x-4 gap-y-[2px] px-10 pt-1 mb-4'>
                {[
                  {
                    label: 'Record ID',
                    value: auditInfo.rid,
                    hide:
                      !permissionMap?.['rid']?.read &&
                      !permissionMap?.['rid']?.edit,
                  },
                  {
                    label: 'Created On',
                    value: auditInfo.created_on,
                    hide:
                      !permissionMap?.['created_datetime']?.read &&
                      !permissionMap?.['created_datetime']?.edit,
                  },
                  {
                    label: 'Created By',
                    value: auditInfo.created_by,
                    hide:
                      !permissionMap?.['created_by_name']?.read &&
                      !permissionMap?.['created_by_name']?.edit,
                  },
                  {
                    label: 'Note ID',
                    value: auditInfo.r_number,
                    hide:
                      !permissionMap?.['r_number']?.read &&
                      !permissionMap?.['r_number']?.edit,
                  },
                  {
                    label: 'Updated On',
                    value: auditInfo.updated_on,
                    hide:
                      !permissionMap?.['modified_datetime']?.read &&
                      !permissionMap?.['modified_datetime']?.edit,
                  },
                  {
                    label: 'Updated By',
                    value: auditInfo.updated_by,
                    hide:
                      !permissionMap?.['modified_by_name']?.read &&
                      !permissionMap?.['modified_by_name']?.edit,
                  },
                ]
                  .filter((field) => !field.hide)
                  .map((field, idx) => (
                    <div key={idx}>
                      <label className='text-[13px] text-[#2D3E4F] font-semibold leading-[21px] md:text-left mt-1 block'>
                        {field.label}
                      </label>
                      <div className='placeholder-[#7D98B6] bg-gray-100 text-black w-full sm:text-sm px-3 h-[32px] border border-[#CBD6E2] rounded-xs flex items-center cursor-default select-none text-nowrap overflow-hidden'>
                        <span className='overflow-hidden text-ellipsis whitespace-nowrap'>
                          {field.value || '-'}
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotesForm;
