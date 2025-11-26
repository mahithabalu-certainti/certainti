import React from 'react';
import { DateTimePicker, renderTimeViewClock } from '@mui/x-date-pickers';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import { CalendarIcon, CloseIcon } from '../../assets';

export interface StyledDateTimePickerProps {
  value: string | Dayjs | null;
  onChange: (value: Dayjs | null) => void;
  error?: boolean;
  helperText?: string;
  disabled?: boolean;
  placeholder?: string;
  disableFutureDates?: boolean;
  disableBeforeDates?: boolean;
  minDate?: string | Dayjs;
  maxDate?: string | Dayjs;
}

const StyledDateTimePicker: React.FC<StyledDateTimePickerProps> = ({
  value,
  onChange,
  error = false,
  helperText = '',
  disabled = false,
  placeholder = 'YYYY-MM-DD hh:mm aa',

  disableFutureDates = false,
  disableBeforeDates = false,
  minDate,
  maxDate,
}) => {
  const today = dayjs().startOf('day');

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <DateTimePicker
        value={value ? dayjs(value) : null}
        onChange={(v) => onChange(v ? dayjs(v) : null)}
        disabled={disabled}
        format='YYYY-MM-DD hh:mm A'
        viewRenderers={{
          hours: renderTimeViewClock,
          minutes: renderTimeViewClock,
          seconds: renderTimeViewClock,
        }}
        /** NEW DATE LIMITING LOGIC */
        disableFuture={disableFutureDates}
        minDate={
          disableBeforeDates ? today : minDate ? dayjs(minDate) : undefined
        }
        maxDate={maxDate ? dayjs(maxDate) : undefined}
        className={`${error ? 'border-red-500 bg-[#FEF2F2]' : ''}`}
        slots={{
          openPickerIcon: () => (
            <CalendarIcon alt='calendar' className='w-4 h-4' />
          ),
          clearIcon: () => <CloseIcon alt='clear' className='w-2.5 h-2.5' />,
        }}
        slotProps={{
          field: { clearable: !disabled },
          clearButton: { tabIndex: -1 },
          openPickerButton: { tabIndex: -1 },

          textField: {
            fullWidth: true,
            size: 'small',
            error,
            placeholder,
            disabled,
            onKeyDown: (e) => {
              if (e.key.length === 1 && /[a-zA-Z]/.test(e.key)) {
                e.preventDefault();
              }
            },
            sx: {
              '& .MuiOutlinedInput-root': {
                height: '32px',
                borderRadius: '2px',
                '& input': {
                  fontWeight: 400,
                  fontSize: '13px',
                  lineHeight: '21px',
                  paddingLeft: '11px',
                  color: 'black !important',
                  WebkitTextFillColor: 'black !important',
                  '&[value=""]': {
                    color: '#5A6875 !important',
                    WebkitTextFillColor: '#5A6875 !important',
                  },
                  '&::placeholder': {
                    color: '#5A6875 !important',
                  },
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  border: '1px solid #CBD6E2',
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  border: '2px solid #60A5FA',
                },
                '&.Mui-disabled input': {
                  color: 'black',
                  WebkitTextFillColor: 'black',
                },
              },
            },
          },
        }}
      />
      {error && <span className='text-[12px] text-red-400'>{helperText}</span>}
    </LocalizationProvider>
  );
};

export default StyledDateTimePicker;
