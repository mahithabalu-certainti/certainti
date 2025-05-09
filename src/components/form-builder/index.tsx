import { Autocomplete, Checkbox, Skeleton, TextField } from '@mui/material';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import dayjs, { Dayjs } from 'dayjs';

import { CountryCode, parsePhoneNumberFromString } from 'libphonenumber-js';
import React, { useEffect } from 'react';
import PhoneInput, { CountryData } from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import {
  arrowDownIcon,
  calendarIcon,
  closeIcon,
  searchBlackIcon,
} from '../../assets';

import { useLocation } from 'react-router-dom';
import { FieldTypes, Layout, OnChange } from '../../common-service';
import { ALLOWED_COUNTRIES } from '../../common-utils';
import { FormType, FormTypeFields, SelectOption } from '../../consultant/types';

interface FormBuilderProps {
  data: FormType[];
  formRef: React.RefObject<HTMLFormElement>;
  loading?: boolean;
  values?: Record<string, string | string[] | boolean | number | null | object>;
  layout?: Layout;
  outData: (e: object) => void;
  onChange?: (params: OnChange) => void;
}

export const FormBuilder: React.FC<FormBuilderProps> = ({
  data,
  formRef,
  values,
  loading = false,
  layout,
  onChange,
  outData,
}) => {
  const location = useLocation();
  const { state } = location;
  const [formData, setFormData] = React.useState<FormType[]>();
  const [constructFormData, setConstructFormData] = React.useState<
    Record<string, FieldTypes>
  >({});

  const CommonSkeleton = (
    <Skeleton variant='rounded' width='100%' height={32} />
  );
  useEffect(() => {
    setFormData((prevFormData = []) => {
      return data.map((newSection) => {
        const oldSection = prevFormData.find(
          (s) => s.sectionName === newSection.sectionName
        );

        return {
          ...newSection,
          fields: newSection.fields.map((newField) => {
            const oldField = oldSection?.fields.find(
              (f) => f.name === newField.name
            );

            return {
              ...newField,
              error: oldField?.error ?? newField.error,
              disabled: oldField?.disabled ?? newField.disabled,
              value: oldField?.value ?? newField.value,
            };
          }),
        };
      });
    });

    // Only set initial form data if constructFormData is empty
    if (Object.values(constructFormData).every((value) => !value)) {
      let constructFormData = {};
      data.forEach((section) => {
        section.fields.forEach((field) => {
          constructFormData = {
            ...constructFormData,
            [field.name]: values?.[field.name] || '',
          };
        });
      });

      setConstructFormData(constructFormData);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, values, state]);

  const getFields = (field: FormTypeFields) => {
    const isError = field.error ? 'border-red-500' : 'border-gray-300';
    const fontSize = '0.875rem';
    const fieldValue = (constructFormData[field.name] as string) || '';
    const fieldDisabled = field.disabled ? ' bg-gray-100' : '';

    const handleChange = (value: FieldTypes, countryCode?: FieldTypes) => {
      const newData = {
        ...constructFormData,
        [field.name]: value,
        ...(countryCode !== undefined && {
          [`${field.name}_countryCode`]: countryCode,
        }),
      };

      if (field.resetDependsFields?.length) {
        field.resetDependsFields.forEach((fieldEntry) => {
          fieldEntry
            .split(',')
            .map((f) => f.trim())
            .forEach((f) => {
              newData[f] = '';
            });
        });
      }

      // update value when change depends fields
      if (field.defaultSelect) {
        if (field.defaultSelect.matchedValue === value) {
          newData[field.defaultSelect.key] = field.defaultSelect.ifMatchValue;
        } else {
          newData[field.defaultSelect.key] =
            field.defaultSelect.ifNotMatchValue;
        }
      }

      if (field.onChange && onChange) {
        onChange({ fieldName: field.name, fieldValue: value });
      }

      setFormData((prevFormData) => {
        return prevFormData?.map((section) => ({
          ...section,
          fields: section.fields.map((f) => {
            const updatedField = { ...f };

            if (f.name === field.name) {
              updatedField.error = '';
            }

            if (f.dependsRequired?.key === field.name) {
              const shouldDisable =
                value === f.dependsRequired.disableDependsField;

              updatedField.disabled = shouldDisable;

              if (shouldDisable) {
                newData[f.name] = '';
              }
            }

            return updatedField;
          }),
        }));
      });

      setConstructFormData(newData);
    };

    if (field.isLoading) {
      return CommonSkeleton;
    }

    switch (field.type) {
      case 'text':
        return (
          <input
            type={field.type}
            name={field.name}
            placeholder={field.placeholder}
            autoComplete='off'
            className={
              'placeholder-custom-color w-full sm:text-sm px-2 h-[32px] border border-[#CBD6E2] rounded-xs' +
              isError +
              fieldDisabled
            }
            disabled={field.disabled}
            onChange={(e) => handleChange(e.target.value)}
            value={fieldValue}
          />
        );
      case 'select':
        return (
          <div className='relative w-full'>
            <select
              name={field.name}
              className={
                'custom-select-no-arrow w-full sm:text-sm px-1.5 py-[6px] border-1 ' +
                (fieldValue === '' ? 'text-[#7D98B6] ' : '') +
                isError +
                fieldDisabled
              }
              onChange={(e) => handleChange(e.target.value)}
              value={fieldValue}
              disabled={field.disabled}
            >
              <option value='' className='text-gray-500'>
                {field.placeholder}
              </option>
              {field?.options?.map((option, i) => (
                <option key={i} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <img
              src={arrowDownIcon}
              alt='dropdown arrow'
              className='absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none'
              style={{
                width: 15,
                height: 15,
              }}
            />
          </div>
        );
      case 'textarea':
        return (
          <textarea
            className={
              'placeholder-custom-color w-full sm:text-sm p-2 border border-[#CBD6E2] rounded-xs h-[95px] resize-none ' +
              isError +
              fieldDisabled
            }
            name={field.name}
            placeholder={field.placeholder}
            onChange={(e) => handleChange(e.target.value)}
            disabled={field.disabled}
            value={fieldValue}
          />
        );
      case 'autocomplete':
        return (
          <div className='relative'>
            <img
              src={searchBlackIcon}
              alt='search'
              className='absolute top-1/2 right-3 -translate-y-1/2 z-10'
            />
            <Autocomplete
              options={field.options || []}
              disableClearable
              popupIcon={null}
              slotProps={{ paper: { style: { fontSize } } }}
              onChange={(_e, newValue: SelectOption) => {
                handleChange(newValue?.value || '');
              }}
              value={
                field.options?.find((opt) => opt.value === fieldValue) || {
                  label: '',
                  value: '',
                }
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  variant='outlined'
                  size='small'
                  sx={{
                    '& .MuiOutlinedInput-root': { borderRadius: 0, fontSize },
                  }}
                  placeholder={field.placeholder}
                  error={!!field.error}
                />
              )}
            />
          </div>
        );
      case 'checkbox':
        return (
          <div className='flex gap-4'>
            {field?.options?.map((option, i) => (
              <label key={i} className='m-0'>
                <Checkbox
                  sx={{ p: 0.75 }}
                  size='small'
                  checked={
                    (constructFormData[field.name] as string[])?.includes(
                      option.value
                    ) || false
                  }
                  disabled={field.disabled}
                  onChange={() => {
                    const currentValues =
                      (constructFormData[field.name] as string[]) || [];
                    const newValues = currentValues.includes(option.value)
                      ? currentValues.filter((v) => v !== option.value)
                      : [...currentValues, option.value];
                    handleChange(newValues);
                  }}
                />
                <span className='text-[13px] text-[#7D98B6]'>
                  {option.label}
                </span>
              </label>
            ))}
          </div>
        );
      case 'radio':
        return (
          <div className='flex gap-4 mt-1.5'>
            {field?.options?.map((option, i) => (
              <label key={i} className='flex gap-2 cursor-pointer'>
                <input
                  type='radio'
                  name={field.name}
                  value={option.value}
                  checked={constructFormData[field.name] === option.value}
                  disabled={field.disabled}
                  onChange={(e) => {
                    handleChange(e.target.value);
                  }}
                />
                <span className='text-[13px] text-[#7D98B6]'>
                  {option.label}
                </span>
              </label>
            ))}
          </div>
        );
      case 'date': {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const startDateValue: string | undefined | any =
          constructFormData['financial_start_date'] ||
          constructFormData['resource_startdate'];
        const today: Dayjs = dayjs();
        const isEndDateField =
          field.name === 'financial_end_date' || field.name === 'resource_enddate';
        const parsedStartDate = startDateValue
          ? dayjs(startDateValue, 'MM/DD/YYYY')
          : undefined;

        const customMinDate: Dayjs | undefined =
          isEndDateField && parsedStartDate
            ? parsedStartDate.add(1, 'day')
            : field?.minDate
              ? dayjs(field.minDate)
              : undefined;

        const customMaxDate: Dayjs | undefined =
          isEndDateField && startDateValue
            ? today
            : field?.maxDate
              ? dayjs(field.maxDate)
              : undefined;

        return (
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DatePicker
              className={fieldDisabled}
              minDate={customMinDate}
              maxDate={customMaxDate}
              value={dayjs(fieldValue, 'MM/DD/YYYY')}
              disabled={field.disabled}
              format='MM/DD/YYYY'
              onChange={(newValue) => {
                handleChange(
                  newValue ? dayjs(newValue).format('MM/DD/YYYY') : null
                );
              }}
              shouldDisableDate={
                field.disableFutureDates
                  ? (date) => dayjs(date).isAfter(today, 'day')
                  : undefined
              }
              slots={{
                openPickerIcon: () => (
                  <img src={calendarIcon} alt='calendar' className='w-4 h-4' />
                ),
                clearIcon: () => (
                  <img src={closeIcon} alt='calendar' className='w-2.5 h-2.5' />
                ),
              }}
              slotProps={{
                field: { clearable: !field.disabled },
                day: {
                  sx: {
                    '&.MuiPickersDay-today': {
                      border: 'none',
                      backgroundColor: 'inherit',
                    },
                  },
                },
                textField: {
                  fullWidth: true,
                  size: 'small',
                  disabled: field.disabled,
                  sx: {
                    '& .MuiOutlinedInput-root': {
                      height: '32px',
                      borderRadius: '2px',
                      '& input': {
                        fontWeight: 400,
                        fontSize: '13px',
                        lineHeight: '21px',
                        '& ::placeholder': {
                          color: '#7D98B6 !important',
                        },
                        color: 'black !important',
                        WebkitTextFillColor: 'black !important',

                        '&[value="MM/DD/YYYY"]': {
                          color: '#7D98B6 !important',
                          WebkitTextFillColor: '#7D98B6 !important',
                        },
                      },
                      '&.Mui-disabled': {
                        '& input': {
                          color: 'black',
                          WebkitTextFillColor: 'black',
                        },
                      },
                    },
                  },
                  placeholder: field.placeholder,
                  error: !!field.error,
                  // onBlur: (event) => {
                  //   //For cache typed data
                  //   const value = event.target.value;
                  //   if (value !== 'MM/DD/YYYY') {
                  //     //For Avoid default data
                  //     handleChange(value);
                  //   }
                  // },
                },
              }}
            />
          </LocalizationProvider>
        );
      }
      case 'fiscalDate':
        return (
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DatePicker
              className={fieldDisabled}
              value={dayjs(fieldValue, 'DD/MM/YYYY')}
              disabled={field.disabled}
              format='MM/DD'
              views={['month', 'day']}
              open={false}
              onChange={(newValue) => {
                handleChange(dayjs(newValue).format('DD/MM/YYYY'));
              }}
              slots={{
                clearIcon: () => (
                  <img src={closeIcon} alt='calendar' className='w-2.5 h-2.5' />
                ),
              }}
              slotProps={{
                field: { clearable: !field.disabled },
                textField: {
                  fullWidth: true,
                  size: 'small',
                  disabled: field.disabled,
                  sx: {
                    '& .MuiOutlinedInput-root': {
                      height: '32px',
                      borderRadius: '2px',
                      '& input': {
                        fontWeight: 400,
                        fontSize: '13px',
                        lineHeight: '21px',
                        '& ::placeholder': {
                          color: '#7D98B6 !important',
                        },
                        color: 'black !important',
                        WebkitTextFillColor: 'black !important',
                        '&[value="MM/DD"]': {
                          color: '#7D98B6 !important',
                          WebkitTextFillColor: '#7D98B6 !important',
                        },
                      },
                      '&.Mui-disabled': {
                        '& input': {
                          color: 'black',
                          WebkitTextFillColor: 'black',
                        },
                      },
                      '& .MuiIconButton-edgeEnd': {
                        display: 'none',
                      },
                    },
                  },
                  placeholder: field.placeholder,
                  error: !!field.error,
                },
              }}
            />
          </LocalizationProvider>
        );
      case 'phone':
        return (
          <PhoneInput
            country='us'
            onlyCountries={ALLOWED_COUNTRIES}
            value={fieldValue}
            onChange={(phone, country: CountryData) =>
              handleChange(phone, country.countryCode)
            }
            inputClass={`placeholder-custom-color !w-full !text-[13px] !p-2 !pl-12 !border !h-[32px] !rounded-xs ${
              field.error ? '!border-red-500' : '!border-gray-300'
            }${field.disabled ? ' !bg-gray-100' : ''}`}
            buttonClass={`!bg-transparent !border-r ${field.error ? '!border-red-500' : '!border-gray-300'} !rounded-tl-xs !rounded-bl-xs !hover:bg-transparent !shadow-none !px-0 !m-0`}
            containerClass='!w-full'
            inputProps={{
              name: field.name,
              disabled: field.disabled,
              placeholder: field.placeholder,
            }}
          />
        );
      default:
        return null;
    }
  };

  const validatePhoneNumber = (phone: string, countryCode: string) => {
    const country_code = countryCode?.toUpperCase() as CountryCode;
    const phoneNumber = parsePhoneNumberFromString(`+${phone}`, country_code);

    if (!phoneNumber) {
      return { isValid: false, error: 'Invalid phone number format' };
    }

    if (!phoneNumber.isPossible()) {
      return {
        isValid: false,
        error: 'Phone number length is not valid for the selected country',
      };
    }

    if (!phoneNumber.isValid()) {
      return {
        isValid: false,
        error: 'Phone number does not match the selected country format',
      };
    }

    return { isValid: true, error: '' };
  };

  const isValidDate = (
    dateString: string,
    format: string = 'DD/MM/YYYY'
  ): boolean => {
    return dayjs(dateString, format, true).isValid();
  };

  const validateRegex = (regex: RegExp | string, value: string) => {
    const pattern = regex instanceof RegExp ? regex : new RegExp(regex || '');
    return !pattern.test(value);
  };

  const submitData = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    let hasError = false;

    const dataValidation = formData?.map((section) => {
      if (section.hide) return section;
      return {
        ...section,
        fields: section.fields.map((field) => {
          if (field.hide) return field;
          // Check if field has a value based on its type
          let hasValue: boolean = Boolean(
            constructFormData[field.name]?.toString().trim()
          );
          if (field.type === 'checkbox') {
            hasValue = (constructFormData[field.name] as string[])?.length > 0;
          }
          if (field.type === 'date' || field.type === 'fiscalDate') {
            hasValue = Boolean(constructFormData[field.name]);
          }
          // Validate required fields
          if (field.required && !hasValue) {
            hasError = true;
            return { ...field, error: 'Field is required' };
          }

          if (field.type === 'phone') {
            const value = constructFormData[field.name] as string;
            const countryCode = constructFormData[
              `${field.name}_countryCode`
            ] as string;

            if (field.required && !value) {
              hasError = true;
              return { ...field, error: 'Phone number is required' };
            }

            if (value) {
              const validation = validatePhoneNumber(value, countryCode);
              if (!validation.isValid) {
                hasError = true;
                return { ...field, error: validation.error };
              }
            }
          }

          // Date validation
          if (field.type === 'fiscalDate' && constructFormData[field.name]) {
            const dateValue = constructFormData[field.name] as string;

            if (!isValidDate(dateValue)) {
              hasError = true;
              return {
                ...field,
                error: 'Invalid date',
              };
            }
          }

          if (field.type === 'date') {
            // cost date validation
            const dateValue = constructFormData[field.name] as string;
            if (field?.startValue && constructFormData[field.name]) {
              const dateValue = constructFormData[field.name] as string;
              if (
                dayjs(dateValue).isBefore(dayjs(field?.minDate)) ||
                dayjs(dateValue).isAfter(dayjs(field?.maxDate))
              ) {
                hasError = true;
                return {
                  ...field,
                  error: `${field.name === 'skill_start_date' ? 'Start date' : 'Effective date'} must be within the last 7 years from today`,
                };
              }
            }
            // Check if this date must be after another (start date vs end date)
            if (field.endDateValue && constructFormData[field.name]) {
              const endDateRaw = constructFormData[field.name] as string;
              const startDateRaw = field.startDateLabel
                ? (constructFormData[field.startDateLabel] as string)
                : '';

              const endDate = dayjs(endDateRaw?.trim());
              const startDate = dayjs(startDateRaw?.trim());
              if (
                endDate.isValid() &&
                (dayjs(endDate).isBefore(dayjs(field?.minDate)) ||
                  dayjs(endDate).isAfter(dayjs(field?.maxDate)))
              ) {
                hasError = true;
                return {
                  ...field,
                  error: 'End date must be within the last 7 years from today',
                };
              }
              if (
                endDate.isValid() &&
                !endDate.isSame(startDate) &&
                !endDate.isAfter(startDate)
              ) {
                hasError = true;
                return { ...field, error: 'End date must be after effective date'};
              }
            }

            if (dateValue) {
              if (
                field.disableFutureDates &&
                dayjs(dateValue).isAfter(dayjs(), 'day')
              ) {
                hasError = true;
                return {
                  ...field,
                  error: `${field.name === 'resource_startdate' ? 'Resource effective from' : 'This date'} cannot be in the future`,
                };
              }
              if (dateValue && !isValidDate(dateValue, 'MM/DD/YYYY')) {
                hasError = true;
                return {
                  ...field,
                  error: 'Please enter a valid date.',
                };
              }
            }
          }

          // Depends Required Validation
          if (
            field.dependsRequired?.key &&
            constructFormData[field.dependsRequired.key] ===
              field.dependsRequired?.matchedValue &&
            !hasValue
          ) {
            hasError = true;
            return { ...field, error: field.dependsRequired.errorMessage };
          }

          if (field.type === 'date' && constructFormData[field.name]) {
            const dateValue = constructFormData[field.name] as string;

            // Check if future dates are disabled
            if (
              field.disableFutureDates &&
              dayjs(dateValue).isAfter(dayjs(), 'day')
            ) {
              hasError = true;
              return {
                ...field,
                error: `${field.name === 'resource_startdate' ? 'Resource effective from' : 'This date'} cannot be in the future`,
              };
            }
            const currentDate = dayjs();

            if (field.name === 'resource_enddate' && dayjs(dateValue).isAfter(currentDate, 'day')) {
              hasError = true;
              return {
                ...field,
                error: 'Resource end date cannot be in the future',
              };
            }

            // Check if date is before the minimum allowed date (1-1-1950)
            const minAllowedDate = dayjs('1-1-1950', 'D-M-YYYY');
            if (dayjs(dateValue).isBefore(minAllowedDate, 'day')) {
              hasError = true;
              return {
                ...field,
                error:
                  field.name === 'resource_startdate'
                      ? 'Resource effective from cannot be before 01-01-1950'
                      : 'Date cannot be before 01-01-1950',
              };
            }

            // Check if both start and end dates are either provided or not provided
            if (
              field.name === 'resource_startdate' ||
              field.name === 'resource_enddate'
            ) {
              const startDate = constructFormData[
                'resource_startdate'
              ] as string;
              const endDate = constructFormData['resource_enddate'] as string;

              // Check if one is provided without the other
              if ((startDate && !endDate) || (!startDate && endDate)) {
                hasError = true;
                return {
                  ...field,
                  error: 'Both resource effective from and resource end dates must be provided',
                };
              }

              // If both are provided, validate the relationship
              if (startDate && endDate) {
                const start = dayjs(startDate);
                const end = dayjs(endDate);

                // Check if dates are the same
                if (start.isSame(end, 'day')) {
                  hasError = true;
                  return {
                    ...field,
                    error:
                    field.name === 'resource_startdate'
                      ? 'Resource effective from cannot be the same as resource end date'
                      : 'Resource end date cannot be the same as resource effective from',
                  };
                }

                // Check if start date is after end date
                if (start.isAfter(end, 'day')) {
                  hasError = true;
                  return {
                    ...field,
                    error:
                      field.name === 'resource_startdate'
                        ? 'Resource effective from cannot be after resource end date'
                        : 'Resource end date cannot be before resource effective from',
                  };
                }
              }
            }

            // Check if end date is after start date (strictly greater)
            if (
              field.greaterThan &&
              constructFormData[field.greaterThan.field] &&
              !dayjs(dateValue).isAfter(
                dayjs(constructFormData[field.greaterThan.field] as string)
              )
            ) {
              hasError = true;
              return {
                ...field,
                error:
                  field.greaterThan.message ||
                  'Date must be strictly after the reference field',
              };
            }
          }

         // Start & end not be same Validation
         if (field.toBeNotSame) {
          const currentFieldDate = dayjs(
            constructFormData[field.name]?.toString() || '',
            'MM/DD'
          );
          const differentThanFieldDate = dayjs(
            constructFormData[field.toBeNotSame.key]?.toString() || '',
            'MM/DD'
          );

          if (
            currentFieldDate.isValid() &&
            differentThanFieldDate.isValid()
          ) {
            if (
              currentFieldDate.date() === differentThanFieldDate.date() &&
              currentFieldDate.month() === differentThanFieldDate.month()
            ) {
              hasError = true;
              return {
                ...field,
                error: field.toBeNotSame.errorMessage,
              };
            }
          }
        }

          // Validate regex if present and field has value
          const value = constructFormData[field.name] as string;
          if (field.regex && value) {
            if (validateRegex(field.regex, value)) {
              hasError = true;
              return {
                ...field,
                error: field.regexErrorMessage || 'Invalid format',
              };
            }
          }
          // Validate Dynamic Error Handling
          if (field.errorHandling && value) {
            const errorHandler = field.errorHandling.find((handler) => {
              return validateRegex(handler.regex, value);
            });
            if (errorHandler) {
              hasError = true;
              return {
                ...field,
                error: errorHandler.errorMessage,
              };
            }
          }

          if (field.type === 'text' && value) {
            const emojiRegex = /[\p{Emoji_Presentation}\uFE0F]/gu;
            if (emojiRegex.test(value)) {
              hasError = true;
              return {
                ...field,
                error: 'Emojis are not accepted',
              };
            }
          }

          if (field.lengthRequired?.key && value) {
            const minPattern = field.lengthRequired.minMatchedValue;
            const maxPattern = field.lengthRequired.maxMatchedValue;

            if (!minPattern.test(value)) {
              hasError = true;
              return {
                ...field,
                error: field.lengthRequired.minErrorMessage,
              };
            }

            if (!maxPattern.test(value)) {
              hasError = true;
              return {
                ...field,
                error: field.lengthRequired.maxErrorMessage,
              };
            }
          }

          return { ...field, error: '' };
        }),
      };
    });
    setFormData(dataValidation);

    if (!hasError) {
      //If there is no error then only submit the data
      const cleanedData = Object.fromEntries(
        Object.entries(constructFormData).filter(
          ([key]) => !key.endsWith('_countryCode')
        )
      );
      outData(cleanedData);
    }
  };

  if (loading) {
    //Skeleton loader
    return (
      <div className='grid md:grid-cols-2 gap-6'>
        {[...Array(8)].map((_, index) => (
          <React.Fragment key={index}>{CommonSkeleton}</React.Fragment>
        ))}
      </div>
    );
  }

  return (
    <form onSubmit={submitData} ref={formRef}>
      {formData?.map((section, i) => {
        const isHalf = section.fillType === 'half';
        if (section.hide) return null;
        return (
          <div key={i}>
            {section.sectionName && (
              <h4
                className={`font-semibold text-base text-[#2D3E4F] leading-[21px] tracking-[0%] align-middle mb-6 py-2 bg-[#DCE8FF] text-[14px] ${layout === Layout.TYPE_1 ? 'px-10' : 'px-4'}`}
              >
                {section.sectionName}
              </h4>
            )}
            <div
              className={`grid md:grid-cols-${isHalf ? '2' : '1'} gap-4 ${layout === Layout.TYPE_1 ? 'px-10' : 'px-6'} mb-6`}
            >
              {section.fields.map((field, j) => {
                if (field.hide) return null;
                return (
                  <div key={j} className='grid md:grid-cols-12 gap-4'>
                    <label
                      className={`text-sm text-[#65686F] font-normal leading-[21px] tracking-[0] md:text-right mt-1.5 ${isHalf ? 'col-span-4' : 'col-span-2'}`}
                      htmlFor={field.name}
                    >
                      {field.label}
                      {field.required && (
                        <span className='text-red-500'> *</span>
                      )}
                    </label>
                    <div className={isHalf ? 'col-span-8' : 'col-span-10'}>
                      {getFields(field)}
                      {field.error && (
                        <span className='text-red-500 text-sm col-span-full'>
                          {field.error}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </form>
  );
};
