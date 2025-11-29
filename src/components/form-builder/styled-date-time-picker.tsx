import React from 'react';
import {
  DateTimePicker,
  DatePicker,
  TimePicker,
  renderTimeViewClock,
  ClockIcon,
} from '@mui/x-date-pickers';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import { CalendarIcon, CloseIcon } from '../../assets';

// Type
type PickerView = 'year' | 'month' | 'day' | 'hours' | 'minutes' | 'seconds';

export interface StyledDateTimePickerProps {
  value: string | Dayjs | null;
  onChange: (value: Dayjs | null) => void;
  error?: boolean;
  helperText?: string;
  disabled?: boolean;
  placeholder?: string;

  // Date & Time Restrictions
  disableFuture?: boolean;
  disablePast?: boolean;
  minDate?: string | Dayjs;
  maxDate?: string | Dayjs;
  minTime?: string | Dayjs;
  maxTime?: string | Dayjs;

  // Disable Specific Dates/Times
  shouldDisableDate?: (date: Dayjs) => boolean;
  shouldDisableTime?: (time: Dayjs, type: PickerView) => boolean;
  disableDates?: (string | Dayjs)[];
  disableTimes?: (string | Dayjs)[];

  // Mode & Format
  mode?: 'date' | 'time' | 'datetime';
  format?: string;

  // View Controls
  openTo?: PickerView;
  views?: PickerView[];
  hideCalendar?: boolean;
  hideTime?: boolean;

  // Time Specific
  ampm?: boolean;
  minutesStep?: number;

  // Validation
  required?: boolean;
  readOnly?: boolean;

  // Events
  onOpen?: () => void;
  onClose?: () => void;
  onError?: (error: unknown, value: Dayjs | null) => void;
}

const StyledDateTimePicker: React.FC<StyledDateTimePickerProps> = ({
  value,
  onChange,
  error = false,
  helperText = '',
  disabled = false,
  placeholder,

  // Date & Time Restrictions
  disableFuture = false,
  disablePast = false,
  minDate,
  maxDate,
  minTime,
  maxTime,

  // Disable Specific Dates/Times
  shouldDisableDate,
  shouldDisableTime,
  disableDates = [],
  disableTimes = [],

  // Mode & Format
  mode = 'datetime',
  format,

  // View Controls
  openTo,
  views,

  // Time Specific
  ampm = true,
  minutesStep = 1,

  // Validation
  required = false,
  readOnly = false,

  // Events
  onOpen,
  onClose,
  onError,
}) => {
  const today = dayjs().startOf('day');
  const now = dayjs();

  // Default placeholders based on mode
  const defaultPlaceholders: Record<'date' | 'time' | 'datetime', string> = {
    date: 'YYYY-MMM-DD',
    time: 'hh:mm aa',
    datetime: 'YYYY-MMM-DD hh:mm aa',
  };

  const finalPlaceholder = placeholder || defaultPlaceholders[mode];

  // Default formats based on mode
  const defaultFormats: Record<'date' | 'time' | 'datetime', string> = {
    date: 'YYYY-MMM-DD',
    time: ampm ? 'hh:mm A' : 'HH:mm',
    datetime: ampm ? 'YYYY-MMM-DD hh:mm A' : 'YYYY-MMM-DD HH:mm',
  };

  const finalFormat = format || defaultFormats[mode];

  // Default views based on mode
  const defaultViews: Record<'date' | 'time' | 'datetime', PickerView[]> = {
    date: ['year', 'month', 'day'],
    time: ['hours', 'minutes'],
    datetime: ['year', 'month', 'day', 'hours', 'minutes'],
  };

  const finalViews = views || defaultViews[mode];

  // Enhanced shouldDisableDate function
  const enhancedShouldDisableDate = (date: Dayjs): boolean => {
    // Check custom disable function
    if (shouldDisableDate && shouldDisableDate(date)) {
      return true;
    }

    // Check disabled dates array
    const isInDisabledDates = disableDates.some((disabledDate) =>
      dayjs(disabledDate).isSame(date, 'day')
    );

    if (isInDisabledDates) {
      return true;
    }

    return false;
  };

  // Enhanced shouldDisableTime function
  const enhancedShouldDisableTime = (
    time: Dayjs,
    type: PickerView
  ): boolean => {
    // Check custom disable function
    if (shouldDisableTime && shouldDisableTime(time, type)) {
      return true;
    }

    // Check disabled times array
    const isInDisabledTimes = disableTimes.some((disabledTime) => {
      const disabledTimeObj = dayjs(disabledTime);
      if (type === 'hours') {
        return disabledTimeObj.isSame(time, 'hour');
      } else if (type === 'minutes') {
        return disabledTimeObj.isSame(time, 'minute');
      }
      return false;
    });

    if (isInDisabledTimes) {
      return true;
    }

    return false;
  };

  // Calculate min/max datetime based on mode with proper time validation
  const getMinDateTime = (): Dayjs | undefined => {
    if (mode === 'time' && minTime) {
      return dayjs(minTime);
    }

    let minDateTime: Dayjs | undefined;

    if (minDate) {
      minDateTime = dayjs(minDate);
    } else if (disablePast && mode !== 'time') {
      minDateTime = today;
    }

    // Combine date and time for datetime mode
    if (mode === 'datetime' && minDateTime && minTime) {
      const timePart = dayjs(minTime);
      minDateTime = minDateTime
        .hour(timePart.hour())
        .minute(timePart.minute())
        .second(timePart.second());
    }

    return minDateTime;
  };

  const getMaxDateTime = (): Dayjs | undefined => {
    if (mode === 'time' && maxTime) {
      return dayjs(maxTime);
    }

    let maxDateTime: Dayjs | undefined;

    if (maxDate) {
      maxDateTime = dayjs(maxDate);
    } else if (disableFuture && mode !== 'time') {
      maxDateTime = today;
    }

    // Combine date and time for datetime mode
    if (mode === 'datetime' && maxDateTime && maxTime) {
      const timePart = dayjs(maxTime);
      maxDateTime = maxDateTime
        .hour(timePart.hour())
        .minute(timePart.minute())
        .second(timePart.second());
    }

    return maxDateTime;
  };

  // Smart time validation for current date - FIXED VERSION
  const getTimeValidationProps = () => {
    const minDateTime = getMinDateTime();
    const maxDateTime = getMaxDateTime();

    // For time mode, handle current time validation differently
    if (mode === 'time' && disablePast) {
      return {
        // Don't use minTime as it disables entire hours
        // Use granular shouldDisableTime instead
        shouldDisableTime: (time: Dayjs, type: PickerView) => {
          // First check custom disable function
          if (enhancedShouldDisableTime(time, type)) {
            return true;
          }

          // If disablePast is true, disable past times with granular control
          if (disablePast) {
            if (type === 'hours') {
              // Only disable hours that are completely in the past
              return time.hour() < now.hour();
            } else if (type === 'minutes') {
              // For current hour, only disable minutes that are in the past
              if (time.hour() === now.hour()) {
                return time.minute() < now.minute();
              }
              // For hours before current hour, all minutes are disabled (handled by hour disabling)
              return false;
            }
          }

          return false;
        },
      };
    }

    // For datetime mode with current date
    if (mode === 'datetime' && minDateTime?.isSame(today, 'day')) {
      return {
        shouldDisableTime: (time: Dayjs, type: PickerView) => {
          // First check custom disable function
          if (enhancedShouldDisableTime(time, type)) {
            return true;
          }

          // Disable past times for today with granular control
          if (type === 'hours') {
            // Only disable hours that are completely in the past
            return time.hour() < now.hour();
          } else if (type === 'minutes') {
            // For current hour, only disable minutes that are in the past
            if (time.hour() === now.hour()) {
              return time.minute() < now.minute();
            }
            // For hours before current hour, all minutes are disabled (handled by hour disabling)
            return false;
          }

          return false;
        },
      };
    }

    // Default case - use minTime/maxTime for non-current dates
    return {
      minTime: minDateTime,
      maxTime: maxDateTime,
      shouldDisableTime: enhancedShouldDisableTime,
    };
  };

  const timeValidationProps = getTimeValidationProps();

  // Common props for all picker types
  const commonProps = {
    value: value ? dayjs(value) : null,
    onChange: (v: Dayjs | null) => onChange(v ? dayjs(v) : null),
    disabled,
    readOnly,
    onOpen,
    onClose,
    onError: onError as (error: unknown, value: Dayjs | null) => void,
    className: `${error ? 'border-red-500 bg-[#FEF2F2]' : ''}`,
    reduceAnimations: true,
    slots: {
      openPickerIcon: () =>
        mode === 'time' ? (
          <ClockIcon sx={{ color: '#B4C3D5', fontSize: 18 }} />
        ) : (
          <CalendarIcon alt='calendar' className='w-4 h-4' />
        ),
      clearIcon: () => <CloseIcon alt='clear' className='w-2.5 h-2.5' />,
    },
    slotProps: {
      field: {
        clearable: !disabled && !readOnly && !required,
      },
      clearButton: {
        tabIndex: -1,
        disabled: disabled || readOnly,
      },
      openPickerButton: {
        tabIndex: -1,
        disabled: disabled || readOnly,
      },
      textField: {
        fullWidth: true,
        size: 'small' as const,
        error,
        placeholder: finalPlaceholder,
        disabled,
        required,
        inputProps: {
          readOnly,
        },
        onKeyDown: (e: React.KeyboardEvent) => {
          if (readOnly) {
            e.preventDefault();
            return;
          }

          if (e.key.length === 1 && /[a-zA-Z]/.test(e.key)) {
            e.preventDefault();
          }
        },
        sx: {
          '& .MuiOutlinedInput-root': {
            height: '32px',
            borderRadius: '2px',
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: error ? '#EF4444 !important' : '#CBD6E2 !important',
            },
            '& input': {
              fontWeight: 400,
              fontSize: '13px',
              lineHeight: '21px',
              paddingLeft: '11px',
              color:
                readOnly || disabled
                  ? '#6B7280 !important'
                  : 'black !important',
              WebkitTextFillColor:
                readOnly || disabled
                  ? '#6B7280 !important'
                  : 'black !important',
              '&[value=""]': {
                color: '#00295C !important',
                WebkitTextFillColor: '#00295C !important',
              },
              '&::placeholder': {
                color: '#00295C !important',
              },
            },
            '&:hover .MuiOutlinedInput-notchedOutline': {
              border: readOnly ? '1px solid #CBD6E2' : '1px solid #CBD6E2',
            },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              border: readOnly ? '1px solid #CBD6E2' : '2px solid #60A5FA',
            },
            '&.Mui-disabled input': {
              color: '#6B7280',
              WebkitTextFillColor: '#6B7280',
            },
          },
        },
      },
    },
  };

  const renderPicker = () => {
    const minDateTime = getMinDateTime();
    const maxDateTime = getMaxDateTime();

    // Default openTo values that show hours first
    const defaultOpenTo: Record<'date' | 'time' | 'datetime', string> = {
      date: 'day',
      time: 'hours', // Open to hours first
      datetime: 'day',
    };

    switch (mode) {
      case 'date':
        return (
          <DatePicker
            {...commonProps}
            format={finalFormat}
            disableFuture={disableFuture}
            disablePast={disablePast}
            minDate={minDateTime}
            maxDate={maxDateTime}
            shouldDisableDate={enhancedShouldDisableDate}
            openTo={(openTo as 'day' | 'month' | 'year') || defaultOpenTo.date}
            views={finalViews as ['year', 'month', 'day']}
          />
        );

      case 'time':
        return (
          <TimePicker
            {...commonProps}
            format={finalFormat}
            ampm={ampm}
            minutesStep={minutesStep}
            // Only use minTime/maxTime for non-current time scenarios
            minTime={
              mode === 'time' && !disablePast
                ? timeValidationProps.minTime
                : undefined
            }
            maxTime={timeValidationProps.maxTime}
            shouldDisableTime={timeValidationProps.shouldDisableTime}
            openTo={
              (openTo as 'hours' | 'minutes' | 'seconds') || defaultOpenTo.time
            }
            views={finalViews as ['hours', 'minutes']}
            viewRenderers={{
              hours: renderTimeViewClock,
              minutes: renderTimeViewClock,
              seconds: renderTimeViewClock,
            }}
          />
        );

      case 'datetime':
      default:
        return (
          <DateTimePicker
            {...commonProps}
            format={finalFormat}
            minutesStep={minutesStep}
            disableFuture={disableFuture}
            disablePast={disablePast}
            minDate={minDateTime}
            maxDate={maxDateTime}
            // For datetime, only use minTime for non-current dates
            minTime={
              minDateTime?.isSame(today, 'day')
                ? undefined
                : timeValidationProps.minTime
            }
            maxTime={timeValidationProps.maxTime}
            shouldDisableDate={enhancedShouldDisableDate}
            shouldDisableTime={timeValidationProps.shouldDisableTime}
            openTo={
              (openTo as
                | 'day'
                | 'month'
                | 'year'
                | 'hours'
                | 'minutes'
                | 'seconds') || defaultOpenTo.datetime
            }
            views={finalViews as ['year', 'month', 'day', 'hours', 'minutes']}
            viewRenderers={{
              hours: renderTimeViewClock,
              minutes: renderTimeViewClock,
              seconds: renderTimeViewClock,
            }}
          />
        );
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <div className='relative'>
        {renderPicker()}
        {error && helperText && (
          <span className='text-[12px] text-red-400 block mt-1'>
            {helperText}
          </span>
        )}
        {required && !value && !error && (
          <span className='text-[12px] text-gray-500 block mt-1'>
            This field is required
          </span>
        )}
      </div>
    </LocalizationProvider>
  );
};

export default StyledDateTimePicker;
