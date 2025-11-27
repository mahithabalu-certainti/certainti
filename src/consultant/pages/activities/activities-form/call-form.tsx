import React, { useRef } from 'react';
import { useState, useCallback, useMemo, useEffect } from 'react';
import { CallLogIcon, UploadIcon } from '../../../../assets';
import SingleSkeleton from '../../../../components/skeleton-component/singleskeleton';
import TextButton from '../../../../components/button/text-button';
import SkeletonForm from '../../../../components/form-builder/skeleton-form';
import { useParams, useSearchParams } from 'react-router-dom';
import { useToast } from '../../../../hooks';
import {
  useCreateActivityCall,
  useCallActivityDetails,
  useUpdateActivityCall,
} from '../../../services/activities/activities-service';
import { useGetUserOptions, UserOption } from '../../../services/case-team';
import { FileList, MeetingAttendees } from '../../../../components';
import dayjs, { Dayjs } from 'dayjs';
import StyledDateTimePicker from '../../../../components/form-builder/date-time-picker';
import { formatDateToYYYYMMDDWithTime } from '../../../../common-utils';

// Types
interface SuggestionState {
  suggestions: UserOption[];
  highlightedIndex: number;
  anchorEl: HTMLElement | null;
}

interface CallFormData {
  call_participants: string[];
  caller_id: string;
  subject: string;
  files: File[];
  effective_start_datetime: string;
  effective_end_datetime: string;
  minutes_of_meeting: string;
  call_platform: string;
  time_zone?: string;
  rid: string;
  call_rid: string;
  created_on: string;
  created_by: string;
  updated_on: string;
  updated_by: string;
}

interface CallFormErrors {
  call_participants?: string;
  caller_id?: string;
  subject?: string;
  effective_start_datetime?: string;
  effective_end_datetime?: string;
  minutes_of_meeting?: string;
  call_platform?: string;
}

interface ExistingFile {
  name: string;
  url: string;
  size: string;
  format: string;
  rid: string;
}

// File validation constants
const MAX_FILE_SIZE_MB = 100;
const RESTRICTED_EXTENSIONS = /\.(exe|bat|cmd|sh|bash)$/i;

const ACCEPTED_FILE_TYPES = [
  'text/csv',
  'application/vnd.ms-excel', // .xls
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
  'application/pdf', // .pdf
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
  'image/jpeg',
  'image/png',
  'image/gif',
  'text/plain',
  'application/msword', // .doc
];

const CallForm: React.FC = () => {
  const { activityId } = useParams();
  const [searchParams] = useSearchParams();
  const { successToast } = useToast();

  const [formData, setFormData] = useState<CallFormData>({
    call_participants: [],
    caller_id: '',
    subject: '',
    files: [],
    effective_start_datetime: '',
    effective_end_datetime: '',
    minutes_of_meeting: '',
    call_platform: '',
    rid: '',
    call_rid: '',
    created_on: '',
    created_by: '',
    updated_on: '',
    updated_by: '',
  });

  const [errors, setErrors] = useState<CallFormErrors>({});
  const [participantsInput, setParticipantsInput] = useState<string>('');
  const [callerInput, setCallerInput] = useState<string>('');
  const [message, setMessage] = useState<{
    type: 'error' | 'success';
    text: string;
  } | null>(null);
  const [existingFiles, setExistingFiles] = useState<ExistingFile[]>([]);

  const isEditView = location.pathname.split('/').includes('edit');
  const sourcePath = searchParams.get('source') || '';
  const accountId = searchParams.get('accountId') || '';
  const entityLevel = searchParams.get('entityLevel') || '';
  const entityId = searchParams.get('entityId') || '';

  const [participantsSuggestions, setParticipantsSuggestions] =
    useState<SuggestionState>({
      suggestions: [],
      highlightedIndex: 0,
      anchorEl: null,
    });

  const [callerSuggestions, setCallerSuggestions] = useState<SuggestionState>({
    suggestions: [],
    highlightedIndex: 0,
    anchorEl: null,
  });

  // File input ref
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const userListOptions = useGetUserOptions(accountId, true);
  const createCall = useCreateActivityCall();
  const updateCall = useUpdateActivityCall();
  const { data: callData, isLoading } = useCallActivityDetails(
    entityId,
    activityId || '',
    true
  );
  const commonSuccess = createCall.isSuccess || updateCall.isSuccess;

  const userOptions = useMemo(() => {
    return (
      userListOptions?.data?.map((item) => ({
        rid: item.rid,
        name: item?.name || '',
        email: item?.email || '',
      })) || []
    );
  }, [userListOptions]);

  useEffect(() => {
    if (commonSuccess) {
      successToast(
        isEditView ? 'Call updated successfully' : 'Call created successfully'
      );
      goBack();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [commonSuccess, isEditView]);

  useEffect(() => {
    if (callData && isEditView) {
      setFormData((prev) => ({
        ...prev,
        call_participants: callData.call_participants || [],
        caller_id: callData.caller_id || '',
        subject: callData.subject || '',
        // effective_start_datetime: callData.effective_start_datetime || '',
        // effective_end_datetime: callData.effective_end_datetime || '',
        minutes_of_meeting: callData.minutes_of_meeting || '',
        call_platform: callData.call_platform || '',
        rid: callData.activity_rid || '',
        call_rid: callData.r_number || '',
        created_on: formatDateToYYYYMMDDWithTime(
          callData.created_datetime || ''
        ),
        created_by: callData.created_by || '',
        updated_on: formatDateToYYYYMMDDWithTime(
          callData.modified_datetime || ''
        ),
        updated_by: callData.modified_by || '',
      }));

      // Set existing file data if available
      if (callData?.attachments?.length) {
        const mappedFiles = callData.attachments.map((file) => ({
          name: file.document_name || '',
          url: file.browse_file || '',
          size: file.size ? `${file.size} MB` : '-',
          format: file.format || '',
          rid: file.rid,
        }));
        setExistingFiles(mappedFiles);
      } else {
        setExistingFiles([]);
      }
    }
  }, [isEditView, callData]);

  const isValidEmail = useCallback((email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
  }, []);

  // // File validation function
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
        /\.(csv|xls|xlsx|pdf|docx|doc|jpeg|jpg|png|gif|txt)$/i.test(file.name);

      if (!isAcceptedType) {
        showError(
          `"${file.name}" is not a valid file. Only .csv, .xls, .xlsx, .pdf, .doc, .docx, images, or .txt files are allowed.`
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

  const showError = (text: string) => {
    setMessage({ type: 'error', text });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(null);
    const validFiles = validateFiles(e.target.files);
    if (validFiles.length > 0) {
      setFormData((prev) => ({
        ...prev,
        files: [...prev.files, ...validFiles],
      }));
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setMessage(null);
    const validFiles = validateFiles(e.dataTransfer.files);
    if (validFiles.length > 0) {
      setFormData((prev) => ({
        ...prev,
        files: [...prev.files, ...validFiles],
      }));
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  // Remove single existing file
  const removeExistingFile = (index: number) => {
    setExistingFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const addParticipant = useCallback(
    (
      _field: 'attendees' | 'call_participants' | 'caller_id' | 'organizer',
      email: string
    ) => {
      if (!email.trim() || !isValidEmail(email)) {
        return;
      }

      const cleanEmail = email.trim();

      if (formData.call_participants?.includes(cleanEmail)) {
        return;
      }

      setFormData((prev) => ({
        ...prev,
        call_participants: [...(prev.call_participants || []), cleanEmail],
      }));

      setParticipantsInput('');
      setParticipantsSuggestions((prev) => ({ ...prev, anchorEl: null }));
      setErrors((prev) => ({ ...prev, call_participants: '' }));
    },
    [isValidEmail, formData.call_participants]
  );

  const removeParticipant = useCallback(
    (
      _field: 'attendees' | 'call_participants' | 'caller_id' | 'organizer',
      index: number
    ) => {
      setFormData((prev) => ({
        ...prev,
        call_participants: (prev.call_participants || []).filter(
          (_, i) => i !== index
        ),
      }));
    },
    []
  );

  const addCaller = useCallback(
    (
      _field: 'attendees' | 'call_participants' | 'caller_id' | 'organizer',
      email: string
    ) => {
      if (!email.trim() || !isValidEmail(email)) {
        return;
      }

      const cleanEmail = email.trim();
      setFormData((prev) => ({
        ...prev,
        caller_id: cleanEmail,
      }));

      setCallerInput('');
      setCallerSuggestions((prev) => ({ ...prev, anchorEl: null }));
      setErrors((prev) => ({ ...prev, caller_id: '' }));
    },
    [isValidEmail]
  );

  const removeCaller = useCallback(() => {
    setFormData((prev) => ({
      ...prev,
      caller_id: '',
    }));
    setCallerInput('');
  }, []);

  const handleParticipantsInputChange = useCallback((value: string) => {
    setParticipantsInput(value);
  }, []);

  const handleCallerInputChange = useCallback((value: string) => {
    setCallerInput(value);
  }, []);

  const handleParticipantsKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (
        e.key === 'Backspace' &&
        participantsInput.trim() === '' &&
        formData.call_participants.length > 0
      ) {
        e.preventDefault();
        removeParticipant(
          'call_participants',
          formData.call_participants.length - 1
        );
        return;
      }

      if (!participantsSuggestions.anchorEl) {
        if (
          (e.key === 'Enter' || e.key === 'Tab') &&
          participantsInput.trim()
        ) {
          e.preventDefault();
          if (
            isValidEmail(participantsInput) &&
            !formData.call_participants.includes(participantsInput.trim())
          ) {
            addParticipant('call_participants', participantsInput.trim());
          }
        }
        return;
      }

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setParticipantsSuggestions((prev) => ({
            ...prev,
            highlightedIndex: Math.min(
              prev.highlightedIndex + 1,
              prev.suggestions.length - 1
            ),
          }));
          break;

        case 'ArrowUp':
          e.preventDefault();
          setParticipantsSuggestions((prev) => ({
            ...prev,
            highlightedIndex: Math.max(prev.highlightedIndex - 1, 0),
          }));
          break;

        case 'Enter':
        case 'Tab':
          e.preventDefault();
          if (
            participantsSuggestions.suggestions[
              participantsSuggestions.highlightedIndex
            ]
          ) {
            const selectedSuggestion =
              participantsSuggestions.suggestions[
                participantsSuggestions.highlightedIndex
              ];
            addParticipant('call_participants', selectedSuggestion.email);
          }
          break;

        case 'Escape':
          e.preventDefault();
          setParticipantsSuggestions((prev) => ({ ...prev, anchorEl: null }));
          break;
      }
    },
    [
      formData.call_participants,
      removeParticipant,
      isValidEmail,
      addParticipant,
      participantsInput,
      participantsSuggestions,
    ]
  );

  const handleCallerKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (!callerSuggestions.anchorEl) {
        if ((e.key === 'Enter' || e.key === 'Tab') && callerInput.trim()) {
          e.preventDefault();
          if (isValidEmail(callerInput)) {
            addCaller('caller_id', callerInput.trim());
          }
        }
        return;
      }

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setCallerSuggestions((prev) => ({
            ...prev,
            highlightedIndex: Math.min(
              prev.highlightedIndex + 1,
              prev.suggestions.length - 1
            ),
          }));
          break;

        case 'ArrowUp':
          e.preventDefault();
          setCallerSuggestions((prev) => ({
            ...prev,
            highlightedIndex: Math.max(prev.highlightedIndex - 1, 0),
          }));
          break;

        case 'Enter':
        case 'Tab':
          e.preventDefault();
          if (
            callerSuggestions.suggestions[callerSuggestions.highlightedIndex]
          ) {
            const selectedSuggestion =
              callerSuggestions.suggestions[callerSuggestions.highlightedIndex];
            addCaller('caller_id', selectedSuggestion.email);
          }
          break;

        case 'Escape':
          e.preventDefault();
          setCallerSuggestions((prev) => ({ ...prev, anchorEl: null }));
          break;
      }
    },
    [isValidEmail, addCaller, callerInput, callerSuggestions]
  );

  // Handle input changes
  const handleInputChange = (
    field: keyof CallFormData,
    value: string | string[] | File[]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field as keyof CallFormErrors]: '' }));
  };

  const handleSubjectChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    handleInputChange('subject', value);
  };

  const handleMinutesOfMeetingChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    const value = e.target.value;
    handleInputChange('minutes_of_meeting', value);
  };

  const handleCallPlatformChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    handleInputChange('call_platform', value);
  };

  const handleDateTimeChange = (
    field: 'effective_start_datetime' | 'effective_end_datetime',
    value: Dayjs | null
  ) => {
    if (value && value.isValid()) {
      const isoString = value.toISOString();
      handleInputChange(field, isoString);
    } else {
      handleInputChange(field, '');
    }
  };

  const validateForm = (): boolean => {
    const newErrors: CallFormErrors = {};

    if (
      !formData.call_participants ||
      formData.call_participants.length === 0
    ) {
      newErrors.call_participants =
        'Field is required. Please include at least one participant.';
    }

    if (!formData.caller_id.trim()) {
      newErrors.caller_id = 'Field is required';
    }

    if (!formData.subject.trim()) {
      newErrors.subject = 'Field is required';
    }

    if (!formData.effective_start_datetime) {
      newErrors.effective_start_datetime = 'Field is required';
    }

    if (!formData.effective_end_datetime) {
      newErrors.effective_end_datetime = 'Field is required';
    }

    if (formData.effective_start_datetime && formData.effective_end_datetime) {
      const start = new Date(formData.effective_start_datetime);
      const end = new Date(formData.effective_end_datetime);

      if (end <= start) {
        newErrors.effective_end_datetime =
          'End datetime must be after start datetime';
      }
    }

    if (!formData.call_platform.trim()) {
      newErrors.call_platform = 'Field is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const goBack = () => {
    window.history.back();
  };

  const handleSubmit = () => {
    if (!validateForm()) {
      return;
    }

    // // File validation only if files are selected
    if (formData.files.length > 0) {
      for (const file of formData.files) {
        if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
          showError(
            `"${file.name}" exceeds the ${MAX_FILE_SIZE_MB}MB limit. Please upload a smaller file.`
          );
          return;
        }
      }
    }

    // Prepare FormData for API
    const formDataToSend = new FormData();

    let deletedFileIds: string[] = [];

    if (isEditView && callData?.attachments) {
      const currentExistingIds = existingFiles.map((file) => file.rid);

      deletedFileIds = callData.attachments
        .map((att) => att.rid)
        .filter((rid) => !currentExistingIds.includes(rid));
    }

    // Append basic fields from the API image
    formDataToSend.append('account_rid', accountId);
    formDataToSend.append('attach_to', entityId);
    formDataToSend.append('attachment_level', entityLevel);
    formDataToSend.append('activity_type', 'call');
    formDataToSend.append(
      'call_participants',
      JSON.stringify(formData.call_participants)
    );
    formDataToSend.append('caller_id', formData.caller_id);
    formDataToSend.append('subject', formData.subject);
    formDataToSend.append('minutes_of_meeting', formData.minutes_of_meeting);
    formDataToSend.append('call_platform', formData.call_platform);
    formDataToSend.append(
      'effective_start_datetime',
      formData.effective_start_datetime
    );
    formDataToSend.append(
      'effective_end_datetime',
      formData.effective_end_datetime
    );

    // Append files
    formData.files.forEach((file) => {
      formDataToSend.append('files', file);
    });

    if (deletedFileIds.length > 0) {
      formDataToSend.append('deleted_file_ids', JSON.stringify(deletedFileIds));
    }

    if (isEditView && callData) {
      formDataToSend.append('activity_rid', callData?.activity_rid || '');
      updateCall.mutate(formDataToSend);
    } else {
      createCall.mutate(formDataToSend);
    }
  };

  const formLoading = isLoading || userListOptions.isLoading;

  // Convert string dates to Dayjs objects for DateTimePicker
  const startDate = formData.effective_start_datetime
    ? dayjs(formData.effective_start_datetime)
    : null;
  const endDate = formData.effective_end_datetime
    ? dayjs(formData.effective_end_datetime)
    : null;

  return (
    <div>
      <div className='h-[50px] flex items-center justify-between px-10 sticky top-0 z-10 bg-white border-b border-[#CBD6E2]'>
        <div className='flex items-center w-[80%] max-w-[80%]'>
          <CallLogIcon
            alt='call-icon'
            className='w-7 h-7 p-1.5 [&>path]:stroke-white bg-[#AF78FF] rounded-[2px]'
          />
          <div className='w-[90%]'>
            {isLoading ? (
              <div className='ml-2'>
                <SingleSkeleton width={150} height={12} />
              </div>
            ) : (
              <div className='font-semibold text-[12px] leading-[20px] ml-2 mb-[-6px] text-[#7D98B6]'>
                {sourcePath
                  ? `${sourcePath}${isEditView ? ` > ${callData?.r_number}` : ''}`
                  : `Call ${isEditView ? `> ${callData?.r_number}` : ''}`}
              </div>
            )}
            <h5 className='text-[16px] font-bold ml-2 text-[#2D3E4F]'>
              {isEditView ? 'Edit Call' : 'Create Call'}
            </h5>
          </div>
        </div>
        <div className='flex gap-3'>
          <TextButton
            label='Save'
            loading={createCall.isPending || updateCall.isPending}
            onClick={handleSubmit}
            sx={{
              width: '75px',
              minWidth: '75px',
              fontSize: '13px',
              fontWeight: 400,
            }}
          />
          <TextButton
            label='Cancel'
            onClick={goBack}
            disabled={createCall.isPending || updateCall.isPending}
            sx={{
              width: '75px',
              minWidth: '75px',
              fontSize: '12px',
              fontWeight: 400,
            }}
          />
        </div>
      </div>
      <div className={`${isEditView ? 'pb-6' : 'pb-4'}`}>
        {formLoading ? (
          <SkeletonForm />
        ) : (
          <form>
            <div className='border capitalize h-[30px] border-box border-[#CBD6E2] font-bold text-[14px] text-[#2D3E4F] leading-[21px] tracking-[0%] align-middle py-1 bg-[#ECECEC] px-10'>
              Call Information
            </div>

            <div className='px-10'>
              <MeetingAttendees
                label='Call Participants'
                field='call_participants'
                values={formData.call_participants}
                inputValue={participantsInput}
                onInputChange={handleParticipantsInputChange}
                onAddAttendee={addParticipant}
                onRemoveAttendee={removeParticipant}
                onKeyDown={handleParticipantsKeyDown}
                suggestions={participantsSuggestions}
                setSuggestions={setParticipantsSuggestions}
                errors={errors?.call_participants}
                userOptions={userOptions}
                otherFields={{
                  call_participants: formData.call_participants,
                  caller_id: formData.caller_id,
                }}
                required={true}
                isValidEmail={isValidEmail}
              />
            </div>

            {/* Subject Field */}
            <div className='grid md:grid-cols-3 gap-x-4 gap-y-3 px-10 pt-3'>
              <MeetingAttendees
                label='Caller ID'
                field='caller_id'
                values={formData.caller_id ? [formData.caller_id] : []}
                inputValue={callerInput}
                onInputChange={handleCallerInputChange}
                onAddAttendee={addCaller}
                onRemoveAttendee={removeCaller}
                onKeyDown={handleCallerKeyDown}
                suggestions={callerSuggestions}
                setSuggestions={setCallerSuggestions}
                errors={errors?.caller_id}
                userOptions={userOptions}
                otherFields={{
                  call_participants: formData.call_participants,
                  caller_id: formData.caller_id,
                }}
                required={true}
                isValidEmail={isValidEmail}
                singleSelect={true}
                className='!pt-0'
              />
              <div>
                <label
                  htmlFor='subject'
                  className='text-[13px] text-[#2D3E4F] font-semibold leading-[21px]'
                >
                  Subject<span className='text-red-500'> *</span>
                </label>
                <input
                  type='text'
                  name='subject'
                  placeholder='Enter Subject'
                  value={formData.subject}
                  onChange={handleSubjectChange}
                  autoComplete='off'
                  className={`placeholder-custom-color disabled:bg-gray-100 placeholder-[#7D98B6] truncate overflow-hidden text-ellipsis whitespace-nowrap outline-none focus:border-2 focus:border-blue-400 w-full sm:text-sm px-3 h-[32px] border border-[#CBD6E2] rounded-xs ${errors?.subject ? 'border-red-500 bg-[#FEF2F2]' : ''}`}
                />
                {errors?.subject && (
                  <span className='text-[12px] text-red-400'>
                    {errors.subject}
                  </span>
                )}
              </div>

              {/* Call Platform Field */}
              <div>
                <label
                  htmlFor='call_platform'
                  className='text-[13px] text-[#2D3E4F] font-semibold leading-[21px]'
                >
                  Call Platform<span className='text-red-500'> *</span>
                </label>
                <input
                  type='text'
                  name='call_platform'
                  placeholder='Enter Call Platform (e.g., teams, zoom, etc.)'
                  value={formData.call_platform}
                  onChange={handleCallPlatformChange}
                  autoComplete='off'
                  className={`placeholder-custom-color disabled:bg-gray-100 placeholder-[#7D98B6] truncate overflow-hidden text-ellipsis whitespace-nowrap outline-none focus:border-2 focus:border-blue-400 w-full sm:text-sm px-3 h-[32px] border border-[#CBD6E2] rounded-xs ${errors?.call_platform ? 'border-red-500 bg-[#FEF2F2]' : ''}`}
                />
                {errors?.call_platform && (
                  <span className='text-[12px] text-red-400'>
                    {errors.call_platform}
                  </span>
                )}
              </div>

              <div>
                <label
                  htmlFor='effective_start_datetime'
                  className='text-[13px] text-[#2D3E4F] font-semibold leading-[21px]'
                >
                  Start Date & Time<span className='text-red-500'> *</span>
                </label>
                <StyledDateTimePicker
                  value={startDate}
                  onChange={(value) =>
                    handleDateTimeChange('effective_start_datetime', value)
                  }
                  error={!!errors?.effective_start_datetime}
                  helperText={errors?.effective_start_datetime}
                  disableBeforeDates={true}
                />
              </div>

              <div>
                <label
                  htmlFor='effective_end_datetime'
                  className='text-[13px] text-[#2D3E4F] font-semibold leading-[21px]'
                >
                  End Date & Time<span className='text-red-500'> *</span>
                </label>
                <StyledDateTimePicker
                  value={endDate}
                  onChange={(value) =>
                    handleDateTimeChange('effective_end_datetime', value)
                  }
                  error={!!errors?.effective_end_datetime}
                  helperText={errors?.effective_end_datetime}
                  disableBeforeDates={true}
                />
              </div>
            </div>

            {/* Minutes of Meeting Field */}
            <div className='grid md:grid-cols-1 gap-x-4 gap-y-[2px] px-10 pt-3'>
              <label
                htmlFor='minutes_of_meeting'
                className='text-[13px] text-[#2D3E4F] font-semibold leading-[21px]'
              >
                Minutes of Meeting
              </label>
              <textarea
                name='minutes_of_meeting'
                placeholder='Enter Minutes of Meeting'
                value={formData.minutes_of_meeting}
                onChange={handleMinutesOfMeetingChange}
                autoComplete='off'
                className={`outline-none placeholder-custom-color h-[95px] w-full sm:text-sm py-2 px-3 resize-none focus:border-2 focus:border-blue-400 border border-[#CBD6E2] rounded-xs ${
                  errors?.minutes_of_meeting
                    ? 'border-red-500 bg-[#FEF2F2] focus:!bg-[#FEF2F2]'
                    : ''
                }`}
              />
              {errors?.minutes_of_meeting && (
                <span className='text-[12px] text-red-400'>
                  {errors.minutes_of_meeting}
                </span>
              )}
            </div>

            {/* File Attachments Section */}
            <div>
              <div className='mt-6 border capitalize h-[30px] border-box border-[#CBD6E2] font-bold text-[14px] text-[#2D3E4F] leading-[21px] tracking-[0%] align-middle py-1 bg-[#ECECEC] px-10'>
                Attachments
              </div>
              <div className='px-10 mt-3'>
                <div className='flex flex-col items-center justify-center gap-4 px-4 py-5'>
                  <div
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onClick={openFileDialog}
                    className={`h-[116px] w-[502px] border-[2px] border-dashed rounded-[8px] flex flex-col items-center justify-center gap-2 cursor-pointer
                    ${message?.type === 'error' ? 'border-red-600 bg-[#FEF2F2]' : 'border-[#0176D3] bg-[#F4F6F9]'}
                  `}
                  >
                    <UploadIcon
                      alt='Upload Icon'
                      className='w-[36px] h-[24px]'
                    />
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
                      accept='.csv,.xls,.xlsx,.pdf,.doc,.docx,.jpeg,.jpg,.png,.gif,.txt'
                      className='hidden'
                      ref={fileInputRef}
                      onChange={handleFileSelect}
                      multiple
                    />
                  </div>

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
                    selectedFiles={formData.files}
                    setSelectedFiles={(files) =>
                      handleInputChange('files', files)
                    }
                    existingFiles={existingFiles}
                    onRemoveExistingFile={removeExistingFile}
                    disabled={false}
                  />
                </div>
              </div>
            </div>

            {/* Audit Information for Edit View */}
            <div className={`${isEditView ? 'block pt-5' : 'hidden'}`}>
              <div
                className={`border capitalize h-[30px] border-box border-[#CBD6E2] font-bold text-[14px] text-[#2D3E4F] leading-[21px] tracking-[0%] align-middle py-1 bg-[#ECECEC] px-10`}
              >
                Audit Information
              </div>
              <div className='grid md:grid-cols-3 gap-x-4 gap-y-[2px] px-10 pt-1 mb-4'>
                {[
                  {
                    label: 'Record ID',
                    value: formData.rid,
                    hide: false,
                  },
                  {
                    label: 'Created On',
                    value: formData.created_on,
                    hide: false,
                  },
                  {
                    label: 'Created By',
                    value: formData.created_by,
                    hide: false,
                  },
                  {
                    label: 'Call ID',
                    value: formData.call_rid,
                    hide: false,
                  },
                  {
                    label: 'Updated On',
                    value: formData.updated_on,
                    hide: false,
                  },
                  {
                    label: 'Updated By',
                    value: formData.updated_by,
                    hide: false,
                  },
                ]
                  .filter((field) => !field.hide)
                  .map((field, idx) => (
                    <div key={idx}>
                      <label className='text-[13px] text-[#2D3E4F] font-semibold leading-[21px] md:text-left mt-1 block'>
                        {field.label}
                      </label>
                      <div className='placeholder-[#7D98B6] bg-gray-100 text-black w-full sm:text-sm px-3 h-[32px] border border-[#CBD6E2] rounded-xs flex items-center cursor-default text-nowrap overflow-hidden'>
                        <span className='overflow-hidden text-ellipsis whitespace-nowrap'>
                          {field.value || '-'}
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default CallForm;
