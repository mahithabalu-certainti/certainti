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
import { FileList } from '../../../../components/file-list';
import { MenuItem, Select } from '@mui/material';
import {
  COMMON_MENU_PROPS,
  getSelectStyles,
  shouldDisableField,
  shouldHideField,
} from './helper';
import {
  formatDateToYYYYMMDDWithTime,
  REGEX_PATTERNS,
} from '../../../../common-utils';
import StyledDateTimePicker from '../../../../components/form-builder/styled-date-time-picker';
import {
  getPermissionMap,
  parseToStringArray,
} from '../activities-list/helper';
import { useSelector } from 'react-redux';
import { RootState } from '../../../../store/store';
import { AllPermissions } from '../../../../common-service';
import { ActivitySourceDetails } from '../../../types';

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
  // New fields aligned with Microsoft Teams
  effective_startdate: string;
  start_time: string;
  end_time: string;
  recurrence_type: string;
  recurrence_interval: string;
  recurrence_days: string[];
  effective_enddate: string;
  // New monthly recurrence fields
  recurrence_day_of_month: string;
  recurrence_monthly_index: string;
  // Legacy fields for API compatibility
  time_zone?: string;
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
  effective_startdate?: string;
  start_time?: string;
  end_time?: string;
  effective_enddate?: string;
  recurrence_type?: string;
  recurrence_interval?: string;
  recurrence_days?: string;
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
];

interface MeetingFormProps {
  isFrom?: string;
  onCloseModal?: () => void;
  sourceDetails?: ActivitySourceDetails;
}

const MeetingForm: React.FC<MeetingFormProps> = ({
  isFrom,
  onCloseModal,
  sourceDetails,
}) => {
  const { activityId } = useParams();
  const [searchParams] = useSearchParams();
  const { successToast } = useToast();

  const [formData, setFormData] = useState<MeetingFormData>({
    attendees: [],
    subject: '',
    files: [],
    effective_startdate: '',
    start_time: '',
    end_time: '',
    recurrence_type: 'none',
    recurrence_interval: '1',
    recurrence_days: [],
    effective_enddate: '',
    // New monthly recurrence fields
    recurrence_day_of_month: '',
    recurrence_monthly_index: '',
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
  const [existingFiles, setExistingFiles] = useState<ExistingFile[]>([]);

  const isEditView = location.pathname.split('/').includes('edit');
  const systemTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const sourcePath = sourceDetails?.source
    ? sourceDetails?.source
    : searchParams.get('source') || '';
  const accountId = sourceDetails?.accountId
    ? sourceDetails?.accountId
    : searchParams.get('accountId') || '';
  const entityLevel = sourceDetails?.entityLevel
    ? sourceDetails?.entityLevel
    : searchParams.get('entityLevel') || '';
  const entityId = sourceDetails?.entityId
    ? sourceDetails?.entityId
    : searchParams.get('entityId') || '';

  const [attendeesSuggestions, setAttendeesSuggestions] =
    useState<SuggestionState>({
      suggestions: [],
      highlightedIndex: 0,
      anchorEl: null,
    });

  // File input ref
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Permission
  const { permission } = useSelector((state: RootState) => state.permission);
  const permissionMap = useMemo(
    () =>
      getPermissionMap(permission, AllPermissions.ACTIVITY_MEETING_VIEW_EDIT),
    [permission]
  );

  // Refs
  const userListOptions = useGetUserOptions(accountId, true);
  const createMeeting = useCreateActivityMeeting();
  const updateMeeting = useUpdateActivityMeeting();
  const { data: meetingData, isLoading } = useMeetingActivityDetails(
    accountId,
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

  // Get weekday name from date
  const getWeekdayName = useCallback((date: Dayjs): string => {
    return date.format('dddd').toLowerCase(); // returns 'monday', 'tuesday', etc.
  }, []);

  // Get month options based on start date (Microsoft Teams logic)
  const getMonthlyRecurrenceOptions = useCallback((startDate: Dayjs) => {
    const dayOfMonth = startDate.date();
    const weekdayName = startDate.format('dddd').toLowerCase();
    const weekOfMonth = Math.ceil(startDate.date() / 7);
    const isLastWeek = startDate.add(1, 'week').month() !== startDate.month();

    const position = isLastWeek
      ? 'last'
      : weekOfMonth === 1
        ? 'first'
        : weekOfMonth === 2
          ? 'second'
          : weekOfMonth === 3
            ? 'third'
            : 'fourth';

    return [
      {
        value: `day_${dayOfMonth}`,
        label: `On day ${dayOfMonth}`,
        type: 'day_of_month' as const,
        day: dayOfMonth,
      },
      {
        value: `${position}_${weekdayName}`,
        label: `On the ${position} ${weekdayName}`,
        type: 'monthly_index' as const,
        index: position,
        weekday: weekdayName,
      },
    ];
  }, []);

  // Update the monthlyRecurrenceOptions useMemo
  const monthlyRecurrenceOptions = useMemo(() => {
    if (!formData.effective_startdate) return [];
    const startDate = dayjs(formData.effective_startdate);
    return getMonthlyRecurrenceOptions(startDate);
  }, [formData.effective_startdate, getMonthlyRecurrenceOptions]);

  // Auto-set effective_enddate when recurrence_type is 'none'
  useEffect(() => {
    if (formData.recurrence_type === 'none' && formData.effective_startdate) {
      setFormData((prev) => ({
        ...prev,
        effective_enddate: formData.effective_startdate,
      }));
    }
  }, [formData.effective_startdate, formData.recurrence_type]);

  // Update the weekly recurrence useEffect
  useEffect(() => {
    if (formData.recurrence_type === 'weekly' && formData.effective_startdate) {
      const startDate = dayjs(formData.effective_startdate);
      const weekday = getWeekdayName(startDate);

      // Only add if not already present and we're not in the middle of clearing
      if (!formData.recurrence_days.includes(weekday)) {
        setFormData((prev) => ({
          ...prev,
          recurrence_days: [...prev.recurrence_days, weekday],
        }));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.effective_startdate, formData.recurrence_type, getWeekdayName]);

  // Replace the monthly recurrence useEffect with this corrected version
  useEffect(() => {
    // Only run this for NEW meetings (not edit view) or when there's no existing data
    if (
      formData.recurrence_type === 'monthly' &&
      formData.effective_startdate &&
      !isEditView // Only for new meetings
    ) {
      const startDate = dayjs(formData.effective_startdate);
      const dayOfMonth = startDate.date();
      const defaultOption = `day_${dayOfMonth}`;

      // Only set default if no selection exists
      if (formData.recurrence_days.length === 0) {
        setFormData((prev) => ({
          ...prev,
          recurrence_days: [defaultOption], // Keep option value for UI
          recurrence_day_of_month: String(dayOfMonth),
          recurrence_monthly_index: '',
        }));
      }
    }
  }, [
    formData.effective_startdate,
    formData.recurrence_type,
    formData.recurrence_days.length,
    isEditView,
  ]);

  // Auto-select all days for daily recurrence
  useEffect(() => {
    if (formData.recurrence_type === 'daily') {
      setFormData((prev) => ({
        ...prev,
        recurrence_days: [
          'monday',
          'tuesday',
          'wednesday',
          'thursday',
          'friday',
          'saturday',
          'sunday',
        ],
      }));
    }
  }, [formData.recurrence_type]);

  // Add this useEffect to handle initial monthly selection when start date is already set
  useEffect(() => {
    if (
      formData.recurrence_type === 'monthly' &&
      formData.effective_startdate &&
      formData.recurrence_days.length === 0 &&
      !isEditView // Only for new meetings
    ) {
      const startDate = dayjs(formData.effective_startdate);
      const dayOfMonth = startDate.date();
      const defaultOption = `day_${dayOfMonth}`;

      setFormData((prev) => ({
        ...prev,
        recurrence_days: [defaultOption], // Keep option value for UI
        recurrence_day_of_month: String(dayOfMonth),
        recurrence_monthly_index: '',
      }));
    }
  }, [
    formData.recurrence_type,
    formData.effective_startdate,
    formData.recurrence_days.length,
    isEditView, // Add isEditView to dependencies
  ]);

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
      // Convert legacy datetime fields to new date/time separate fields
      const startDatetime = meetingData.effective_start_datetime
        ? dayjs(meetingData.effective_start_datetime)
        : null;
      const endDatetime = meetingData.effective_end_datetime
        ? dayjs(meetingData.effective_end_datetime)
        : null;

      // Determine monthly recurrence fields based on recurrence_type and available data
      let recurrence_day_of_month = meetingData.recurrence_day_of_month
        ? String(meetingData.recurrence_day_of_month)
        : '';
      let recurrence_monthly_index = meetingData.recurrence_monthly_index || '';
      let recurrence_days =
        parseToStringArray(meetingData.recurrence_days) || [];

      // If it's monthly recurrence, set the appropriate fields based on API data
      if (meetingData.recurrence_type === 'monthly') {
        // CASE 1: If we have monthly_index, this means "On the first Thursday" pattern
        if (meetingData.recurrence_monthly_index) {
          // Get the weekday from recurrence_days or from start date
          let weekday = '';
          if (recurrence_days.length > 0) {
            weekday = recurrence_days[0]; // Use the first weekday from recurrence_days
          } else if (startDatetime) {
            weekday = getWeekdayName(startDatetime); // Fallback to start date weekday
          }

          if (weekday) {
            recurrence_days = [
              `${meetingData.recurrence_monthly_index}_${weekday}`,
            ];
            recurrence_day_of_month = ''; // Clear day_of_month for monthly_index pattern
          }
        }
        // CASE 2: If we have day_of_month, this means "On day X" pattern
        else if (meetingData.recurrence_day_of_month) {
          recurrence_days = [`day_${meetingData.recurrence_day_of_month}`];
          recurrence_monthly_index = '';
        }
        // CASE 3: Default to day of month based on start date
        else if (startDatetime) {
          const dayOfMonth = startDatetime.date();
          recurrence_day_of_month = String(dayOfMonth);
          recurrence_days = [`day_${dayOfMonth}`];
        }
      }

      setFormData((prev) => ({
        ...prev,
        attendees: parseToStringArray(meetingData.meeting_participants) || [],
        subject: meetingData.subject || '',
        effective_startdate: startDatetime
          ? startDatetime.format('YYYY-MM-DD')
          : '',
        // Use the separate time fields from API
        start_time: meetingData.efective_start_time || '',
        end_time: meetingData.efective_end_time || '',
        effective_enddate: endDatetime ? endDatetime.format('YYYY-MM-DD') : '',
        recurrence_type: meetingData.recurrence_type || 'none',
        recurrence_interval: String(meetingData.recurrence_interval || '1'),
        recurrence_days: recurrence_days,
        // New monthly recurrence fields - use API data directly
        recurrence_day_of_month: recurrence_day_of_month,
        recurrence_monthly_index: recurrence_monthly_index,
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

      // Set existing file data if available
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditView, meetingData]);

  const isValidEmail = useCallback((email: string): boolean => {
    const emailRegex = REGEX_PATTERNS.EMAIL;
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
      // Clear error only when adding attendee
      if (errors.attendees) {
        setErrors((prev) => ({ ...prev, attendees: '' }));
      }
    },
    [isValidEmail, formData.attendees, errors.attendees]
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

  // Handle input changes with field clearing logic
  const handleInputChange = (
    field: keyof MeetingFormData,
    value: string | string[] | File[]
  ) => {
    setFormData((prev) => {
      const newFormData = { ...prev, [field]: value };

      // Field clearing logic based on dependencies
      if (field === 'effective_startdate') {
        // When start date changes
        newFormData.start_time = '';
        newFormData.end_time = '';
        if (!value) {
          // Start date was cleared
          // Comprehensive reset of all date/time and recurrence fields
          newFormData.recurrence_type = 'none';
          newFormData.recurrence_interval = '1';
          newFormData.recurrence_days = [];
          newFormData.effective_enddate = '';
          newFormData.start_time = '';
          newFormData.end_time = '';
          // Clear monthly recurrence fields
          newFormData.recurrence_day_of_month = '';
          newFormData.recurrence_monthly_index = '';
        } else if (prev.recurrence_type !== 'daily') {
          // Only clear end date if not daily recurrence
          newFormData.effective_enddate = '';
        }
      } else if (field === 'recurrence_type') {
        const newRecurrenceType = value as string;

        // When recurrence type changes, clear dependent fields
        if (newRecurrenceType === 'none') {
          // For "none", clear interval and days, set end date to start date
          newFormData.recurrence_interval = '1';
          newFormData.recurrence_days = [];
          // Clear monthly recurrence fields
          newFormData.recurrence_day_of_month = '';
          newFormData.recurrence_monthly_index = '';
          if (newFormData.effective_startdate) {
            newFormData.effective_enddate = newFormData.effective_startdate;
          }
        } else if (newRecurrenceType === 'daily') {
          // For "daily", set all days, keep interval, clear end date
          newFormData.recurrence_days = [
            'monday',
            'tuesday',
            'wednesday',
            'thursday',
            'friday',
            'saturday',
            'sunday',
          ];
          newFormData.effective_enddate = '';
          // Clear monthly recurrence fields
          newFormData.recurrence_day_of_month = '';
          newFormData.recurrence_monthly_index = '';
        } else if (newRecurrenceType === 'weekly') {
          // For "weekly", clear days (will be auto-populated with start date's weekday), clear end date
          newFormData.recurrence_days = [];
          newFormData.effective_enddate = '';
          // Clear monthly recurrence fields
          newFormData.recurrence_day_of_month = '';
          newFormData.recurrence_monthly_index = '';
        } else if (newRecurrenceType === 'monthly') {
          // For "monthly", set default to "day_X" option based on start date, clear end date
          newFormData.effective_enddate = '';

          // Only auto-set defaults for new meetings, not edit view
          if (!isEditView) {
            // Clear monthly recurrence fields initially
            newFormData.recurrence_day_of_month = '';
            newFormData.recurrence_monthly_index = '';

            // Auto-select the "day_X" option if start date is available
            if (newFormData.effective_startdate) {
              const startDate = dayjs(newFormData.effective_startdate);
              const dayOfMonth = startDate.date();
              const defaultOption = `day_${dayOfMonth}`;
              newFormData.recurrence_days = [defaultOption]; // Keep option value for UI
              newFormData.recurrence_day_of_month = String(dayOfMonth);
            } else {
              newFormData.recurrence_days = []; // Empty array if no start date
            }
          }
        }
      } else if (field === 'start_time') {
        // When start time changes, clear end time
        newFormData.end_time = '';
      }

      return newFormData;
    });

    // Clear error only when the field is changed
    if (errors[field as keyof MeetingFormErrors]) {
      setErrors((prev) => ({
        ...prev,
        [field as keyof MeetingFormErrors]: '',
      }));
    }
  };

  const handleSubjectChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    handleInputChange('subject', value);
  };

  // Handle date changes - NO VALIDATION ON CHANGE
  const handleDateChange = (
    field: 'effective_startdate' | 'effective_enddate',
    value: Dayjs | null
  ) => {
    if (value && value.isValid()) {
      const dateString = value.format('YYYY-MM-DD');
      handleInputChange(field, dateString);
    } else {
      handleInputChange(field, '');
    }
  };

  // Handle time changes - NO VALIDATION ON CHANGE
  const handleTimeChange = (
    field: 'start_time' | 'end_time',
    value: Dayjs | null
  ) => {
    if (value && value.isValid()) {
      const timeString = value.format('HH:mm');
      handleInputChange(field, timeString);
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

  // Handle monthly recurrence day selection (radio button) - UPDATED
  const handleMonthlyRecurrenceChange = (value: string) => {
    const selectedOption = monthlyRecurrenceOptions.find(
      (opt) => opt.value === value
    );

    if (selectedOption) {
      if (selectedOption.type === 'day_of_month') {
        // For "On day X" option
        setFormData((prev) => ({
          ...prev,
          recurrence_days: [value], // Keep the option value for UI selection
          recurrence_day_of_month: String(selectedOption.day),
          recurrence_monthly_index: '',
        }));
      } else if (selectedOption.type === 'monthly_index') {
        // For "On the first Thursday" option
        setFormData((prev) => ({
          ...prev,
          recurrence_days: [value], // Keep the option value for UI selection
          recurrence_day_of_month: '',
          recurrence_monthly_index: selectedOption.index,
        }));
      }
    }
  };

  // Remove single existing file
  const removeExistingFile = (index: number) => {
    setExistingFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // Add this function for granular time disabling
  const getShouldDisableTime = (field: 'start_time' | 'end_time') => {
    const now = dayjs();
    const currentDate = now.format('YYYY-MM-DD');

    return (
      time: Dayjs,
      type: 'year' | 'month' | 'day' | 'hours' | 'minutes' | 'seconds'
    ) => {
      // For start time on current date
      if (
        field === 'start_time' &&
        formData.effective_startdate === currentDate
      ) {
        if (type === 'hours') {
          // Disable hours that are before current hour
          return time.hour() < now.hour();
        } else if (type === 'minutes') {
          // For current hour, disable minutes that are before current minute
          if (time.hour() === now.hour()) {
            return time.minute() < now.minute();
          }
          // For hours before current hour, all minutes are disabled (handled by hour disabling)
          return false;
        }
      }

      return false;
    };
  };

  // VALIDATION ONLY ON SUBMIT
  const validateForm = (): boolean => {
    const newErrors: MeetingFormErrors = {};
    const now = dayjs();
    const currentDate = now.format('YYYY-MM-DD');
    const currentTime = now.format('HH:mm');

    // Check for pending input in Attendees field
    if (attendeesInput.trim()) {
      newErrors.attendees =
        'Please confirm the entry by pressing Enter or clear the field to continue.';
    } else if (!formData.attendees || formData.attendees.length === 0) {
      newErrors.attendees =
        'Field is required. Please include at least one attendee.';
    }

    if (!formData.subject.trim()) {
      newErrors.subject = 'Field is required';
    }

    if (!formData.effective_startdate) {
      newErrors.effective_startdate = 'Field is required';
    }

    if (!formData.start_time) {
      newErrors.start_time = 'Field is required';
    }

    if (!formData.end_time) {
      newErrors.end_time = 'Field is required';
    }

    // Validate time logic with current date/time consideration
    if (
      formData.start_time &&
      formData.end_time &&
      formData.effective_startdate
    ) {
      const startDateTime = dayjs(
        `${formData.effective_startdate} ${formData.start_time}`
      );
      const endDateTime = dayjs(
        `${formData.effective_startdate} ${formData.end_time}`
      );

      // Check if start date is today and start time is in the past
      if (
        formData.effective_startdate === currentDate &&
        formData.start_time < currentTime
      ) {
        newErrors.start_time =
          "Start Time cannot be in the past for today's date";
      }

      // Check if end time is before or equal to start time
      if (
        endDateTime.isBefore(startDateTime) ||
        endDateTime.isSame(startDateTime)
      ) {
        newErrors.end_time = 'End Time must be after Start Time';
      }
    }

    // Recurrence validations
    if (formData.recurrence_type !== 'none') {
      if (!formData.effective_enddate) {
        newErrors.effective_enddate =
          'End Date is required for recurring meetings';
      }

      if (formData.effective_startdate && formData.effective_enddate) {
        const startDate = dayjs(formData.effective_startdate);
        const endDate = dayjs(formData.effective_enddate);

        if (endDate.isBefore(startDate)) {
          newErrors.effective_enddate =
            'End date must be on or after start date';
        }
      }

      if (
        formData.recurrence_interval === '' ||
        parseInt(formData.recurrence_interval) < 1
      ) {
        newErrors.recurrence_interval =
          'Field is required. Recurrence Interval must be at least 1.';
      }

      if (
        formData.recurrence_type === 'weekly' &&
        formData.recurrence_days.length === 0
      ) {
        newErrors.recurrence_days =
          'At least one day must be selected for weekly recurrence';
      }

      if (
        formData.recurrence_type === 'monthly' &&
        formData.recurrence_days.length === 0
      ) {
        newErrors.recurrence_days =
          'Please select a recurrence pattern for monthly recurrence';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const goBack = () => {
    if (isFrom === 'modal') {
      onCloseModal?.();
    } else {
      window.history.back();
    }
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

    // Prepare FormData for API - convert back to legacy format for API compatibility
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
    formDataToSend.append(
      'meeting_participants',
      JSON.stringify(formData.attendees)
    );
    formDataToSend.append('subject', formData.subject);
    formDataToSend.append('effective_start_date', formData.effective_startdate);
    formDataToSend.append('effective_end_date', formData.effective_enddate);
    formDataToSend.append('effective_start_time', formData.start_time);
    formDataToSend.append('effective_end_time', formData.end_time);
    formDataToSend.append('time_zone', systemTimezone);
    formDataToSend.append('recurrence_type', formData.recurrence_type);
    formDataToSend.append('recurrence_interval', formData.recurrence_interval);

    // Handle recurrence_days based on recurrence type and monthly selection
    if (formData.recurrence_type === 'monthly') {
      // For monthly recurrence with monthly_index (e.g., "first thursday"), send the weekday
      if (formData.recurrence_monthly_index) {
        // Extract the weekday from the selected option
        const selectedOption = monthlyRecurrenceOptions.find((opt) =>
          formData.recurrence_days.includes(opt.value)
        );
        if (selectedOption && selectedOption.type === 'monthly_index') {
          formDataToSend.append(
            'recurrence_days',
            JSON.stringify([selectedOption.weekday])
          );
        } else {
          // Fallback: send empty array
          formDataToSend.append('recurrence_days', JSON.stringify([]));
        }
      } else {
        // For monthly recurrence with day_of_month, send empty array
        formDataToSend.append('recurrence_days', JSON.stringify([]));
      }
    } else {
      // For other recurrence types, send the actual recurrence_days
      formDataToSend.append(
        'recurrence_days',
        JSON.stringify(formData.recurrence_days)
      );
    }

    // Append new monthly recurrence fields only when they have values
    if (formData.recurrence_day_of_month) {
      formDataToSend.append(
        'recurrence_day_of_month',
        formData.recurrence_day_of_month
      );
    }

    if (formData.recurrence_monthly_index) {
      formDataToSend.append(
        'recurrence_monthly_index',
        formData.recurrence_monthly_index
      );
    }

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
  const startDate = formData.effective_startdate
    ? dayjs(formData.effective_startdate)
    : null;
  const endDate = formData.effective_enddate
    ? dayjs(formData.effective_enddate)
    : null;
  const startTime = formData.start_time
    ? dayjs(`2000-01-01 ${formData.start_time}`)
    : null;
  const endTime = formData.end_time
    ? dayjs(`2000-01-01 ${formData.end_time}`)
    : null;

  // Show/hide logic based on recurrence type (Microsoft Teams behavior)
  const showRecurrenceInterval = formData.recurrence_type !== 'none';
  const showRecurrenceDays = formData.recurrence_type === 'weekly';
  const showMonthlyOptions = formData.recurrence_type === 'monthly';
  const showEffectiveEndDate = formData.recurrence_type !== 'none';
  const isDailyRecurrence = formData.recurrence_type === 'daily';

  const hideAttachments = shouldHideField(
    'attachments',
    isEditView,
    permissionMap
  );
  const disableAttachments = shouldDisableField(
    'attachments',
    isEditView,
    permissionMap
  );

  return (
    <div>
      <div
        className={`h-[50px] flex items-center justify-between ${isFrom === 'modal' ? 'px-6 rounded-t-2xl' : 'px-10'} sticky top-0 z-10 bg-white border-b border-[#CBD6E2]`}
      >
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
      <div
        className={`${isFrom === 'modal' ? 'min-h-[70vh] max-h-[75vh] overflow-y-auto scrollbar-transparent' : ''} ${isEditView ? 'pb-6' : 'pb-4'}`}
      >
        {formLoading ? (
          <SkeletonForm />
        ) : (
          <form>
            <div
              className={`border capitalize h-[30px] border-box border-[#CBD6E2] font-bold text-[14px] text-[#2D3E4F] leading-[21px] tracking-[0%] align-middle py-1 bg-[#ECECEC] ${isFrom === 'modal' ? 'px-6' : 'px-10'}`}
            >
              Meeting Information
            </div>

            {/* Attendees Field */}
            <div className={`${isFrom === 'modal' ? 'px-6' : 'px-10'}`}>
              <MeetingAttendees
                label='Meeting Participants'
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
                disabled={shouldDisableField(
                  'meeting_participants',
                  isEditView,
                  permissionMap
                )}
                hide={shouldHideField('to_email', isEditView, permissionMap)}
              />
            </div>

            {/* Subject Field */}
            <div
              className={`grid md:grid-cols-1 gap-x-4 ${isFrom === 'modal' ? 'px-6' : 'px-10'} pt-3`}
              style={{
                display: shouldHideField('subject', isEditView, permissionMap)
                  ? 'none'
                  : 'block',
              }}
            >
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
                disabled={shouldDisableField(
                  'subject',
                  isEditView,
                  permissionMap
                )}
                className={`placeholder-custom-color disabled:bg-gray-100 placeholder-[#7D98B6] truncate overflow-hidden text-ellipsis whitespace-nowrap outline-none focus:border-2 focus:border-blue-400 w-full sm:text-sm px-3 h-[32px] border border-[#CBD6E2] rounded-xs ${errors?.subject ? 'border-red-500 bg-[#FEF2F2]' : ''}`}
              />
              {errors?.subject && (
                <span className='text-[12px] text-red-400'>
                  {errors.subject}
                </span>
              )}
            </div>

            {/* Date & Time Section - Microsoft Teams Layout */}
            <div
              className={`grid md:grid-cols-3 gap-x-4 gap-y-3 ${isFrom === 'modal' ? 'px-6' : 'px-10'} pt-3`}
            >
              {/* Start Date */}
              <div
                style={{
                  display: shouldHideField(
                    'effective_start_datetime',
                    isEditView,
                    permissionMap
                  )
                    ? 'none'
                    : 'block',
                }}
              >
                <label
                  htmlFor='effective_startdate'
                  className='text-[13px] text-[#2D3E4F] font-semibold leading-[21px]'
                >
                  Start Date<span className='text-red-500'> *</span>
                </label>
                <StyledDateTimePicker
                  mode='date'
                  value={startDate}
                  onChange={(value) =>
                    handleDateChange('effective_startdate', value)
                  }
                  error={!!errors?.effective_startdate}
                  helperText={errors?.effective_startdate}
                  disablePast={true}
                  disabled={shouldDisableField(
                    'effective_start_datetime',
                    isEditView,
                    permissionMap
                  )}
                />
              </div>

              {/* Start Time */}
              <div
                style={{
                  display: shouldHideField(
                    'effective_start_time',
                    isEditView,
                    permissionMap
                  )
                    ? 'none'
                    : 'block',
                }}
              >
                <label
                  htmlFor='start_time'
                  className='text-[13px] text-[#2D3E4F] font-semibold leading-[21px]'
                >
                  Start Time<span className='text-red-500'> *</span>
                </label>
                <StyledDateTimePicker
                  mode='time'
                  value={startTime}
                  onChange={(value) => handleTimeChange('start_time', value)}
                  error={!!errors?.start_time}
                  helperText={errors?.start_time}
                  ampm={true}
                  disablePast={
                    formData.effective_startdate ===
                    dayjs().format('YYYY-MM-DD')
                  }
                  shouldDisableTime={getShouldDisableTime('start_time')}
                  openTo='hours' // Ensure it opens to hours first
                  disabled={shouldDisableField(
                    'effective_start_time',
                    isEditView,
                    permissionMap
                  )}
                />
              </div>

              {/* End Time */}
              <div
                style={{
                  display: shouldHideField(
                    'effective_end_time',
                    isEditView,
                    permissionMap
                  )
                    ? 'none'
                    : 'block',
                }}
              >
                <label
                  htmlFor='end_time'
                  className='text-[13px] text-[#2D3E4F] font-semibold leading-[21px]'
                >
                  End Time<span className='text-red-500'> *</span>
                </label>
                <StyledDateTimePicker
                  mode='time'
                  value={endTime}
                  onChange={(value) => handleTimeChange('end_time', value)}
                  error={!!errors?.end_time}
                  helperText={errors?.end_time}
                  ampm={true}
                  openTo='hours' // Ensure it opens to hours first
                  disabled={shouldDisableField(
                    'effective_end_time',
                    isEditView,
                    permissionMap
                  )}
                />
              </div>
            </div>

            {/* Recurrence Type */}
            <div
              className={`grid md:grid-cols-3 gap-x-4 gap-y-3 ${isFrom === 'modal' ? 'px-6' : 'px-10'} pt-3`}
            >
              <div
                style={{
                  display: shouldHideField(
                    'recurrence_type',
                    isEditView,
                    permissionMap
                  )
                    ? 'none'
                    : 'block',
                }}
              >
                <label
                  className={`text-[13px] text-[#2D3E4F] font-semibold leading-[21px] tracking-[0] md:text-left mt-1`}
                  htmlFor='recurrence_type'
                >
                  Recurrence Type
                  <span className='text-red-500'> *</span>
                </label>

                <Select
                  name='recurrence_type'
                  value={formData.recurrence_type}
                  onChange={(e) =>
                    handleInputChange('recurrence_type', e.target.value)
                  }
                  displayEmpty
                  fullWidth
                  size='small'
                  disabled={
                    !formData.effective_startdate ||
                    shouldDisableField(
                      'recurrence_type',
                      isEditView,
                      permissionMap
                    )
                  }
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

              {/* Recurrence Interval - Conditionally Shown */}
              {showRecurrenceInterval && (
                <div
                  style={{
                    display: shouldHideField(
                      'recurrence_interval',
                      isEditView,
                      permissionMap
                    )
                      ? 'none'
                      : 'block',
                  }}
                >
                  <label
                    htmlFor='recurrence_interval'
                    className='text-[13px] text-[#2D3E4F] font-semibold leading-[21px]'
                  >
                    Recurrence Interval<span className='text-red-500'> *</span>
                  </label>
                  <input
                    type='number'
                    min='1'
                    value={formData.recurrence_interval}
                    onChange={handleRecurrenceIntervalChange}
                    onKeyDown={(e) => {
                      if (['e', 'E', '+', '-', '.'].includes(e.key))
                        e.preventDefault();
                    }}
                    onPaste={(e) => {
                      if (!/^\d+$/.test(e.clipboardData.getData('text')))
                        e.preventDefault();
                    }}
                    disabled={shouldDisableField(
                      'recurrence_interval',
                      isEditView,
                      permissionMap
                    )}
                    className={`no-spinner placeholder-custom-color disabled:bg-gray-100 placeholder-[#7D98B6] truncate overflow-hidden text-ellipsis whitespace-nowrap outline-none focus:border-2 focus:border-blue-400 w-full sm:text-sm px-3 h-[32px] border border-[#CBD6E2] rounded-xs ${errors?.recurrence_interval ? 'border-red-500 bg-[#FEF2F2]' : ''}`}
                  />
                  {errors?.recurrence_interval && (
                    <span className='text-[12px] text-red-400'>
                      {errors.recurrence_interval}
                    </span>
                  )}
                </div>
              )}

              {/* Effective End Date - Conditionally Shown */}
              {showEffectiveEndDate && (
                <div
                  style={{
                    display: shouldHideField(
                      'effective_end_datetime',
                      isEditView,
                      permissionMap
                    )
                      ? 'none'
                      : 'block',
                  }}
                >
                  <label
                    htmlFor='effective_enddate'
                    className='text-[13px] text-[#2D3E4F] font-semibold leading-[21px]'
                  >
                    End Date<span className='text-red-500'> *</span>
                  </label>
                  <StyledDateTimePicker
                    mode='date'
                    value={endDate}
                    onChange={(value) =>
                      handleDateChange('effective_enddate', value)
                    }
                    error={!!errors?.effective_enddate}
                    helperText={errors?.effective_enddate}
                    disablePast={true}
                    minDate={startDate || undefined}
                    disabled={shouldDisableField(
                      'effective_end_datetime',
                      isEditView,
                      permissionMap
                    )}
                  />
                </div>
              )}
            </div>

            {/* Weekly Recurrence Days - Conditionally Shown */}
            {showRecurrenceDays && (
              <div
                style={{
                  display: shouldHideField(
                    'recurrence_days',
                    isEditView,
                    permissionMap
                  )
                    ? 'none'
                    : 'block',
                }}
              >
                <div
                  className={`grid md:grid-cols-1 gap-x-4 gap-y-3 ${isFrom === 'modal' ? 'px-6' : 'px-10'} pt-3`}
                >
                  <label className='text-[13px] text-[#2D3E4F] font-semibold leading-[21px]'>
                    Recurrence Days<span className='text-red-500'> *</span>
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
                          disabled={
                            isDailyRecurrence ||
                            shouldDisableField(
                              'recurrence_days',
                              isEditView,
                              permissionMap
                            )
                          }
                        />
                        <span className='text-[13px] text-[#2D3E4F]'>
                          {day.label}
                        </span>
                      </label>
                    ))}
                  </div>
                  {errors?.recurrence_days && (
                    <span className='text-[12px] text-red-400'>
                      {errors.recurrence_days}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Monthly Recurrence Options - Conditionally Shown */}
            {showMonthlyOptions && (
              <div
                style={{
                  display: shouldHideField(
                    'recurrence_days',
                    isEditView,
                    permissionMap
                  )
                    ? 'none'
                    : 'block',
                }}
              >
                <div
                  className={`grid md:grid-cols-1 gap-x-4 gap-y-3 ${isFrom === 'modal' ? 'px-6' : 'px-10'} pt-3`}
                >
                  <label className='text-[13px] text-[#2D3E4F] font-semibold leading-[21px]'>
                    Recurrence Days<span className='text-red-500'> *</span>
                  </label>
                  <div className='flex flex-col gap-2 mt-2'>
                    {monthlyRecurrenceOptions.map((option) => (
                      <label
                        key={option.value}
                        className='flex items-center gap-2 cursor-pointer'
                      >
                        <input
                          type='radio'
                          name='monthly_recurrence'
                          value={option.value}
                          checked={formData.recurrence_days.includes(
                            option.value
                          )} // Check by option value
                          onChange={() =>
                            handleMonthlyRecurrenceChange(option.value)
                          }
                          disabled={shouldDisableField(
                            'recurrence_days',
                            isEditView,
                            permissionMap
                          )}
                          className='w-4 h-4 cursor-pointer'
                        />
                        <span className='text-[13px] text-[#2D3E4F]'>
                          {option.label}
                        </span>
                      </label>
                    ))}
                  </div>
                  {errors?.recurrence_days && (
                    <span className='text-[12px] text-red-400'>
                      {errors.recurrence_days}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* File Attachments Section */}
            <div
              className={`mt-6 ${hideAttachments ? 'hidden' : 'block'}`}
              style={{
                pointerEvents: disableAttachments ? 'none' : 'all',
              }}
            >
              <div
                className={`border capitalize h-[30px] border-box border-[#CBD6E2] font-bold text-[14px] text-[#2D3E4F] leading-[21px] tracking-[0%] align-middle py-1 bg-[#ECECEC] ${isFrom === 'modal' ? 'px-6' : 'px-10'}`}
              >
                Attachments
              </div>
              <div className='px-10 mt-3'>
                <div className='flex flex-col items-center justify-center gap-4 px-4 py-5'>
                  <div
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onClick={openFileDialog}
                    className={`h-[116px] w-[502px] border-[2px] border-dashed rounded-[8px] flex flex-col items-center justify-center gap-2 cursor-pointer
                    ${message?.type === 'error' ? 'border-red-600 bg-[#FEF2F2]' : 'border-[#0176D3] bg-[#F4F6F9]'}  ${disableAttachments ? 'opacity-50' : 'opacity-100'}
                  `}
                  >
                    <React.Suspense fallback={null}>
                      <UploadIcon
                        alt='Upload Icon'
                        className='w-[36px] h-[24px]'
                      />
                    </React.Suspense>
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

                  <div className='max-h-[150px] overflow-y-auto'>
                    <FileList
                      fileInputRef={fileInputRef}
                      selectedFiles={formData.files}
                      setSelectedFiles={(files) =>
                        handleInputChange('files', files)
                      }
                      existingFiles={existingFiles}
                      onRemoveExistingFile={removeExistingFile}
                      disabled={disableAttachments}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Audit Information for Edit View */}
            <div className={`${isEditView ? 'block pt-5' : 'hidden'}`}>
              <div
                className={`border capitalize h-[30px] border-box border-[#CBD6E2] font-bold text-[14px] text-[#2D3E4F] leading-[21px] tracking-[0%] align-middle py-1 bg-[#ECECEC] ${isFrom === 'modal' ? 'px-6' : 'px-10'}`}
              >
                Audit Information
              </div>
              <div className='grid md:grid-cols-3 gap-x-4 gap-y-3 px-10 pt-1 mb-4'>
                {[
                  {
                    label: 'Record ID',
                    value: formData.rid,
                    hide: shouldHideField('rid', isEditView, permissionMap),
                  },
                  {
                    label: 'Created On',
                    value: formData.created_on,
                    hide: shouldHideField(
                      'created_datetime',
                      isEditView,
                      permissionMap
                    ),
                  },
                  {
                    label: 'Created By',
                    value: formData.created_by,
                    hide: shouldHideField(
                      'created_by_name',
                      isEditView,
                      permissionMap
                    ),
                  },
                  {
                    label: 'Meeting ID',
                    value: formData.meeting_rid,
                    hide: shouldHideField(
                      'r_number',
                      isEditView,
                      permissionMap
                    ),
                  },
                  {
                    label: 'Updated On',
                    value: formData.updated_on,
                    hide: shouldHideField(
                      'modified_datetime',
                      isEditView,
                      permissionMap
                    ),
                  },
                  {
                    label: 'Updated By',
                    value: formData.updated_by,
                    hide: shouldHideField(
                      'modified_by_name',
                      isEditView,
                      permissionMap
                    ),
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
