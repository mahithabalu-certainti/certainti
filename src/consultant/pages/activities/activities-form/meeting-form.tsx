import React from 'react';
import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { MeetingIcon, UploadIcon } from '../../../../assets';
import SingleSkeleton from '../../../../components/skeleton-component/singleskeleton';
import TextButton from '../../../../components/button/text-button';
import SkeletonForm from '../../../../components/form-builder/skeleton-form';
import { useParams, useSearchParams } from 'react-router-dom';
import { useToast } from '../../../../hooks';
import {
  useCreateActivityMeeting,
  useMeetingActivityDetails,
  useUpdateActivityMeeting,
} from '../../../services/activities/activities-service';
import { useGetUserOptions, UserOption } from '../../../services/case-team';
import { MeetingAttendees } from '../../../../components';
import dayjs, { Dayjs } from 'dayjs';
import StyledDateTimePicker from '../../../../components/form-builder/date-time-picker';
import { FileList } from '../../../../components/file-list';
import { MenuItem, Select } from '@mui/material';
import { COMMON_MENU_PROPS, getSelectStyles } from './helper';
import { formatDateToYYYYMMDDWithTime } from '../../../../common-utils';

// Types
interface SuggestionState {
  suggestions: UserOption[];
  highlightedIndex: number;
  anchorEl: HTMLElement | null;
}

interface MeetingFormData {
  attendees: string[];
  subject: string;
  files: File[];
  effective_start_datetime: string;
  effective_end_datetime: string;
  time_zone?: string;
  recurrence_type: string;
  recurrence_interval: string;
  recurrence_days: string[];
  rid: string;
  meeting_rid: string;
  created_on: string;
  created_by: string;
  updated_on: string;
  updated_by: string;
}

interface MeetingFormErrors {
  attendees?: string;
  subject?: string;
  effective_start_datetime?: string;
  effective_end_datetime?: string;
  time_zone?: string;
  recurrence_type?: string;
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

const MeetingForm: React.FC = () => {
  const { activityId } = useParams();
  const [searchParams] = useSearchParams();
  const { successToast } = useToast();

  const [formData, setFormData] = useState<MeetingFormData>({
    attendees: [],
    subject: '',
    files: [],
    effective_start_datetime: '',
    effective_end_datetime: '',
    recurrence_type: 'none',
    recurrence_interval: '1',
    recurrence_days: [],
    rid: '',
    meeting_rid: '',
    created_on: '',
    created_by: '',
    updated_on: '',
    updated_by: '',
  });

  const [errors, setErrors] = useState<MeetingFormErrors>({});
  const [attendeesInput, setAttendeesInput] = useState<string>('');
  const [message, setMessage] = useState<{
    type: 'error' | 'success';
    text: string;
  } | null>(null);
  const [existingFiles, setExistingFiles] = useState<ExistingFile[]>([]); // Changed to array

  const isEditView = location.pathname.split('/').includes('edit');
  const systemTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const sourcePath = searchParams.get('source') || '';
  const accountId = searchParams.get('accountId') || '';
  const entityLevel = searchParams.get('entityLevel') || '';
  const entityId = searchParams.get('entityId') || '';

  const [attendeesSuggestions, setAttendeesSuggestions] =
    useState<SuggestionState>({
      suggestions: [],
      highlightedIndex: 0,
      anchorEl: null,
    });

  // File input ref
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Refs
  const userListOptions = useGetUserOptions(accountId, true);
  const createMeeting = useCreateActivityMeeting();
  const updateMeeting = useUpdateActivityMeeting();
  const { data: meetingData, isLoading } = useMeetingActivityDetails(
    entityId,
    activityId || '',
    true
  );
  const commonSuccess = createMeeting.isSuccess || updateMeeting.isSuccess;

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
        isEditView
          ? 'Meeting updated successfully'
          : 'Meeting created successfully'
      );
      goBack();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [commonSuccess, isEditView]);

  useEffect(() => {
    if (meetingData && isEditView) {
      setFormData((prev) => ({
        ...prev,
        attendees: meetingData.meeting_participants || [],
        subject: meetingData.subject || '',
        // effective_start_datetime: meetingData.effective_start_datetime || '',
        // effective_end_datetime: meetingData.effective_end_datetime || '',
        // recurrence_type: meetingData.recurrence_type || 'none',
        // recurrence_interval: meetingData.recurrence_interval || '1',
        // recurrence_days: meetingData.recurrence_days || [],
        rid: meetingData.activity_rid || '',
        meeting_rid: meetingData.r_number || '',
        created_on: formatDateToYYYYMMDDWithTime(
          meetingData.created_datetime || ''
        ),
        created_by: meetingData.created_by || '',
        updated_on: formatDateToYYYYMMDDWithTime(
          meetingData.modified_datetime || ''
        ),
        updated_by: meetingData.modified_by || '',
      }));

      // Set existing file data if available - now as array
      if (meetingData?.attachments?.length) {
        const mappedFiles = meetingData.attachments.map((file) => ({
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
  }, [isEditView, meetingData]);

  const isValidEmail = useCallback((email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
  }, []);

  // File validation function
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
      // Don't clear existing files when adding new ones
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

  const addAttendee = useCallback(
    (
      _field: 'attendees' | 'call_participants' | 'caller_id' | 'organizer',
      email: string
    ) => {
      if (!email.trim() || !isValidEmail(email)) {
        return;
      }

      const cleanEmail = email.trim();

      if (formData.attendees?.includes(cleanEmail)) {
        return;
      }

      setFormData((prev) => ({
        ...prev,
        attendees: [...(prev.attendees || []), cleanEmail],
      }));

      setAttendeesInput('');
      setAttendeesSuggestions((prev) => ({ ...prev, anchorEl: null }));
      setErrors((prev) => ({ ...prev, attendees: '' }));
    },
    [isValidEmail, formData.attendees]
  );

  const removeAttendee = useCallback(
    (
      _field: 'attendees' | 'call_participants' | 'caller_id' | 'organizer',
      index: number
    ) => {
      setFormData((prev) => ({
        ...prev,
        attendees: (prev.attendees || []).filter((_, i) => i !== index),
      }));
    },
    []
  );

  const handleAttendeesInputChange = useCallback((value: string) => {
    setAttendeesInput(value);
  }, []);

  const handleAttendeesKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (
        e.key === 'Backspace' &&
        attendeesInput.trim() === '' &&
        formData.attendees.length > 0
      ) {
        e.preventDefault();
        removeAttendee('attendees', formData.attendees.length - 1);
        return;
      }

      if (!attendeesSuggestions.anchorEl) {
        if ((e.key === 'Enter' || e.key === 'Tab') && attendeesInput.trim()) {
          e.preventDefault();
          if (
            isValidEmail(attendeesInput) &&
            !formData.attendees.includes(attendeesInput.trim())
          ) {
            addAttendee('attendees', attendeesInput.trim());
          }
        }
        return;
      }

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setAttendeesSuggestions((prev) => ({
            ...prev,
            highlightedIndex: Math.min(
              prev.highlightedIndex + 1,
              prev.suggestions.length - 1
            ),
          }));
          break;

        case 'ArrowUp':
          e.preventDefault();
          setAttendeesSuggestions((prev) => ({
            ...prev,
            highlightedIndex: Math.max(prev.highlightedIndex - 1, 0),
          }));
          break;

        case 'Enter':
        case 'Tab':
          e.preventDefault();
          if (
            attendeesSuggestions.suggestions[
              attendeesSuggestions.highlightedIndex
            ]
          ) {
            const selectedSuggestion =
              attendeesSuggestions.suggestions[
                attendeesSuggestions.highlightedIndex
              ];
            addAttendee('attendees', selectedSuggestion.email);
          }
          break;

        case 'Escape':
          e.preventDefault();
          setAttendeesSuggestions((prev) => ({ ...prev, anchorEl: null }));
          break;
      }
    },
    [
      formData.attendees,
      removeAttendee,
      isValidEmail,
      addAttendee,
      attendeesInput,
      attendeesSuggestions,
    ]
  );

  // Handle input changes
  const handleInputChange = (
    field: keyof MeetingFormData,
    value: string | string[] | File[]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field as keyof MeetingFormErrors]: '' }));
  };

  const handleSubjectChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    handleInputChange('subject', value);
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

  const handleRecurrenceIntervalChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    handleInputChange('recurrence_interval', e.target.value);
  };

  const handleRecurrenceDaysChange = (day: string) => {
    setFormData((prev) => {
      const currentDays = [...prev.recurrence_days];
      const dayIndex = currentDays.indexOf(day);

      if (dayIndex > -1) {
        currentDays.splice(dayIndex, 1);
      } else {
        currentDays.push(day);
      }

      return { ...prev, recurrence_days: currentDays };
    });
  };

  // Remove single existing file
  const removeExistingFile = (index: number) => {
    setExistingFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const validateForm = (): boolean => {
    const newErrors: MeetingFormErrors = {};

    if (!formData.attendees || formData.attendees.length === 0) {
      newErrors.attendees =
        'Field is required. Please include at least one attendee.';
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

    // File validation only if files are selected
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

    if (isEditView && meetingData?.attachments) {
      const currentExistingIds = existingFiles.map((file) => file.rid);

      deletedFileIds = meetingData.attachments
        .map((att) => att.rid)
        .filter((rid) => !currentExistingIds.includes(rid));
    }

    // Append basic fields
    formDataToSend.append('account_rid', accountId);
    formDataToSend.append('attach_to', entityId);
    formDataToSend.append('attachment_level', entityLevel);
    formDataToSend.append('activity_type', 'Meeting');
    formDataToSend.append('attendees', JSON.stringify(formData.attendees));
    formDataToSend.append('subject', formData.subject);
    formDataToSend.append(
      'effective_start_datetime',
      formData.effective_start_datetime
    );
    formDataToSend.append(
      'effective_end_datetime',
      formData.effective_end_datetime
    );
    formDataToSend.append('time_zone', systemTimezone);
    formDataToSend.append('recurrence_type', formData.recurrence_type);
    formDataToSend.append('recurrence_interval', formData.recurrence_interval);
    formDataToSend.append(
      'recurrence_days',
      JSON.stringify(formData.recurrence_days)
    );

    // Append files
    formData.files.forEach((file) => {
      formDataToSend.append('files', file);
    });

    if (deletedFileIds.length > 0) {
      formDataToSend.append('deleted_file_ids', JSON.stringify(deletedFileIds));
    }

    if (isEditView && meetingData) {
      formDataToSend.append('activity_rid', meetingData?.activity_rid || '');
      updateMeeting.mutate(formDataToSend);
    } else {
      createMeeting.mutate(formDataToSend);
    }
  };

  const formLoading = isLoading || userListOptions.isLoading;

  const recurrenceTypes = [
    { value: 'none', label: 'None' },
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' },
  ];

  const daysOfWeek = [
    { value: 'monday', label: 'Monday' },
    { value: 'tuesday', label: 'Tuesday' },
    { value: 'wednesday', label: 'Wednesday' },
    { value: 'thursday', label: 'Thursday' },
    { value: 'friday', label: 'Friday' },
    { value: 'saturday', label: 'Saturday' },
    { value: 'sunday', label: 'Sunday' },
  ];

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
          <MeetingIcon
            alt='meeting-icon'
            className='w-7 h-7 p-1.5 [&>path]:stroke-white bg-[#FF5F5F] rounded-[2px]'
          />
          <div className='w-[90%]'>
            {isLoading ? (
              <div className='ml-2'>
                <SingleSkeleton width={150} height={12} />
              </div>
            ) : (
              <div className='font-semibold text-[12px] leading-[20px] ml-2 mb-[-6px] text-[#7D98B6]'>
                {sourcePath
                  ? `${sourcePath}${isEditView ? ` > ${meetingData?.r_number}` : ''}`
                  : `Meeting ${isEditView ? `> ${meetingData?.r_number}` : ''}`}
              </div>
            )}
            <h5 className='text-[16px] font-bold ml-2 text-[#2D3E4F]'>
              {isEditView ? 'Edit Meeting' : 'Create Meeting'}
            </h5>
          </div>
        </div>
        <div className='flex gap-3'>
          <TextButton
            label='Save'
            loading={createMeeting.isPending || updateMeeting.isPending}
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
            disabled={createMeeting.isPending || updateMeeting.isPending}
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
              Meeting Information
            </div>

            {/* Attendees Field */}
            <div className='px-10'>
              <MeetingAttendees
                label='Attendees'
                field='attendees'
                values={formData.attendees}
                inputValue={attendeesInput}
                onInputChange={handleAttendeesInputChange}
                onAddAttendee={addAttendee}
                onRemoveAttendee={removeAttendee}
                onKeyDown={handleAttendeesKeyDown}
                suggestions={attendeesSuggestions}
                setSuggestions={setAttendeesSuggestions}
                errors={errors?.attendees}
                userOptions={userOptions}
                otherFields={{
                  attendees: formData.attendees,
                }}
                required={true}
                isValidEmail={isValidEmail}
              />
            </div>

            {/* Subject Field */}
            <div className='grid md:grid-cols-1 gap-x-4 px-10 pt-3'>
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

            <div className='grid md:grid-cols-3 gap-x-4 gap-y-3 px-10 pt-3'>
              {/* Start DateTime */}
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

              {/* End DateTime */}
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

              {/* Recurrence Type */}
              <div>
                <label
                  className={`text-[13px] text-[#2D3E4F] font-semibold leading-[21px] tracking-[0] md:text-left mt-1`}
                  htmlFor='recurrence_type'
                >
                  Recurrence Type
                  <span className='text-red-500'> *</span>
                </label>

                <Select
                  name='category'
                  value={formData.recurrence_type}
                  onChange={(e) =>
                    handleInputChange('recurrence_type', e.target.value)
                  }
                  displayEmpty
                  fullWidth
                  size='small'
                  className={`custom-select-no-arrow sm:text-sm ${
                    formData.recurrence_type === ''
                      ? 'text-[#7D98B6]'
                      : 'text-black'
                  } ${errors?.recurrence_type ? 'border-red-500 bg-[#FEF2F2]' : ''}`}
                  MenuProps={COMMON_MENU_PROPS}
                  sx={getSelectStyles(
                    !!errors?.recurrence_type,
                    formData.recurrence_type === ''
                  )}
                >
                  <MenuItem
                    value=''
                    sx={{ color: '#425A76', fontSize: '13px', fontWeight: 500 }}
                  >
                    Choose Recurrence Type
                  </MenuItem>

                  {recurrenceTypes?.map((option, i) => (
                    <MenuItem
                      key={`${option.value}-${i}`}
                      value={option.value}
                      title={option.label}
                      sx={{
                        color: '#425A76',
                        fontSize: '13px',
                        fontWeight: 500,
                      }}
                    >
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>

                {errors?.recurrence_type && (
                  <span className='text-[12px] text-red-400 col-span-full'>
                    {errors.recurrence_type}
                  </span>
                )}
              </div>
            </div>

            <div className='grid md:grid-cols-3 gap-x-4 gap-y-3 px-10 pt-3'>
              {/* Recurrence Interval */}
              <div>
                <label
                  htmlFor='recurrence_interval'
                  className='text-[13px] text-[#2D3E4F] font-semibold leading-[21px]'
                >
                  Recurrence Interval
                </label>

                <input
                  type='number'
                  min='1'
                  value={formData.recurrence_interval}
                  onChange={handleRecurrenceIntervalChange}
                  disabled={formData.recurrence_type === 'none'}
                  className='w-full sm:text-sm px-3 h-[32px] border border-[#CBD6E2] rounded-xs disabled:bg-gray-100'
                />
              </div>

              {/* Recurrence Days – span full width */}
              {formData.recurrence_type === 'weekly' && (
                <div className='col-span-2 mt-2'>
                  <label className='text-[13px] text-[#2D3E4F] font-semibold leading-[21px]'>
                    Recurrence Days
                  </label>

                  <div className='flex flex-wrap gap-3 mt-2'>
                    {daysOfWeek.map((day) => (
                      <label
                        key={day.value}
                        className='flex items-center gap-2 cursor-pointer'
                      >
                        <input
                          type='checkbox'
                          checked={formData.recurrence_days.includes(day.value)}
                          onChange={() => handleRecurrenceDaysChange(day.value)}
                          className='w-4 h-4 cursor-pointer'
                        />
                        <span className='text-[13px] text-[#2D3E4F]'>
                          {day.label}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* File Attachments Section */}
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
                    accept='.csv,.xls,.xlsx,.pdf,.doc,.docx,.jpeg,.jpg,.png,.gif,.txt'
                    className='hidden'
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    multiple
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

            {/* Audit Information for Edit View */}
            <div className={`${isEditView ? 'block pt-5' : 'hidden'}`}>
              <div
                className={`border capitalize h-[30px] border-box border-[#CBD6E2] font-bold text-[14px] text-[#2D3E4F] leading-[21px] tracking-[0%] align-middle py-1 bg-[#ECECEC] px-10`}
              >
                Audit Information
              </div>
              <div className='grid md:grid-cols-3 gap-x-4 gap-y-3 px-10 pt-1 mb-4'>
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
                    label: 'Meeting ID',
                    value: formData.meeting_rid,
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

export default MeetingForm;
