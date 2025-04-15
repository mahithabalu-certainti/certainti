import { Autocomplete, Checkbox, Skeleton, TextField } from '@mui/material';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import dayjs from 'dayjs';
import { CountryCode, parsePhoneNumberFromString } from 'libphonenumber-js';
import React, { useEffect } from 'react';
import PhoneInput, { CountryData } from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import { calendarIcon, searchBlackIcon } from '../../assets';
import { FieldTypes, OnChange } from '../../common-service';
import { ALLOWED_COUNTRIES } from '../../common-utils';
import {
  FormType,
  FormTypeFields,
  selectOptions,
} from '../../consultant/types';

interface FormBuilderProps {
  data: FormType[];
  formRef: React.RefObject<HTMLFormElement>;
  loading?: boolean;
  values?: Record<string, string | string[] | boolean | number | null>;
  outData: (e: object) => void;
  onChange?: (params: OnChange) => void;
}

export const FormBuilder: React.FC<FormBuilderProps> = ({
  data,
  formRef,
  values,
  loading,
  onChange,
  outData,
}) => {
  const [formData, setFormData] = React.useState<FormType[]>();
  const [constructFormData, setConstructFormData] = React.useState<
    Record<string, FieldTypes>
  >({});

  console.log('data', data);
  console.log('values', values);
  useEffect(() => {
    setFormData(data);
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
  }, [data, values]);

  const getFields = (field: FormTypeFields) => {
    const isError = field.error ? 'border-red-500' : 'border-gray-300';
    const fontSize = '0.875rem';
    const fieldValue = (constructFormData[field.name] as string) || '';
    const fieldDisabled = field.disabled ? ' bg-gray-100' : '';

    const handleChange = (value: FieldTypes, countryCode?: FieldTypes) => {
      setConstructFormData((prevData) => {
        const newData = {
          ...prevData,
          [field.name]: value,
          ...(countryCode !== undefined && {
            [`${field.name}_countryCode`]: countryCode,
          }),
        };
        if (field.onChange && onChange) {
          onChange({ fieldName: field.name, fieldValue: value });
        }
        return newData;
      });
    };

    switch (field.type) {
      case 'text':
        return (
          <input
            type={field.type}
            name={field.name}
            placeholder={field.placeholder}
            autoComplete='off'
            className={
              'w-full sm:text-sm p-2 border-1 ' + isError + fieldDisabled
            }
            disabled={field.disabled}
            onChange={(e) => handleChange(e.target.value)}
            value={fieldValue}
          />
        );
      case 'select':
        return (
          <select
            name={field.name}
            className={
              'w-full sm:text-sm p-2 border-1 ' +
              (fieldValue === '' ? 'text-gray-500 ' : '') +
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
        );
      case 'textarea':
        return (
          <textarea
            className={
              'w-full sm:text-sm p-2 border-1 resize-none ' +
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
              onChange={(_e, newValue: selectOptions) => {
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
                <span className='text-sm text-gray-400'>{option.label}</span>
              </label>
            ))}
          </div>
        );
      case 'radio':
        return (
          <div className='flex gap-4 mt-1'>
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
                <span className='text-sm text-gray-400'>{option.label}</span>
              </label>
            ))}
          </div>
        );
      case 'date':
        return (
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DatePicker
              value={dayjs(fieldValue, 'DD/MM/YYYY')}
              disabled={field.disabled}
              onChange={(newValue) => {
                handleChange(dayjs(newValue).format('DD/MM/YYYY'));
              }}
              shouldDisableDate={(date) => dayjs(date).isBefore(dayjs(), 'day')}
              slots={{
                openPickerIcon: () => (
                  <img src={calendarIcon} alt='calendar' className='w-6 h-5' />
                ),
              }}
              slotProps={{
                textField: {
                  fullWidth: true,
                  size: 'small',
                  disabled: true,
                  InputProps: {
                    onPaste: (e: React.ClipboardEvent<HTMLInputElement>) => {
                      e.preventDefault();
                      return false;
                    },
                  },
                  sx: {
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 0,
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
            countryCodeEditable={false}
            value={fieldValue}
            onChange={(phone, country: CountryData) =>
              handleChange(phone, country.countryCode)
            }
            inputClass={`!w-full !text-sm !p-2 !pl-12 !border !h-[38px] !rounded-[0px] ${
              field.error ? '!border-red-500' : '!border-gray-300'
            }${field.disabled ? ' !bg-gray-100' : ''}`}
            buttonClass={`!bg-transparent !border-r ${field.error ? '!border-red-500' : '!border-gray-300'} !rounded-[0px] !hover:bg-transparent !shadow-none !px-0 !m-0`}
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

  const submitData = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    let hasError = false;
    const dataValidation = formData?.map((section) => ({
      ...section,
      fields: section.fields.map((field) => {
        // Check if field has a value based on its type
        let hasValue: boolean = Boolean(
          constructFormData[field.name]?.toString().trim()
        );
        if (field.type === 'checkbox') {
          hasValue = (constructFormData[field.name] as string[])?.length > 0;
        }
        if (field.type === 'date') {
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

        // Date custom Validation
        if (
          field.greaterThan &&
          (constructFormData[field.greaterThan.key] || '') >
            (constructFormData[field.name] || '')
        ) {
          hasError = true;
          return {
            ...field,
            error: field.greaterThan.errorMessage,
          };
        }

        // Validate regex if present and field has value
        const value = constructFormData[field.name] as string;
        if (field.regex && value) {
          const pattern =
            field.regex instanceof RegExp
              ? field.regex
              : new RegExp(field.regex);
          if (!pattern.test(value)) {
            hasError = true;
            return {
              ...field,
              error: field.regexErrorMessage || 'Invalid format',
            };
          }
        }

        return { ...field, error: '' };
      }),
    }));

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
          <Skeleton key={index} variant='rounded' width='100%' height={40} />
        ))}
      </div>
    );
  }

  return (
    <form onSubmit={submitData} ref={formRef}>
      {formData?.map((it, i) => {
        const isHalf = it.fillType === 'half';
        return (
          <div key={i}>
            <h4 className={`font-medium mb-4 ${i !== 0 ? 'mt-10' : ''}`}>
              {it.sectionName}
            </h4>
            <div className={`grid md:grid-cols-${isHalf ? '2' : '1'} gap-4`}>
              {it.fields.map((field, j) => (
                <div key={j} className='grid md:grid-cols-12 gap-4'>
                  <label
                    className={`text-sm text-gray-500 md:text-right mt-1 ${isHalf ? 'col-span-4' : 'col-span-2'}`}
                    htmlFor={field.name}
                  >
                    {field.label}
                    {field.required && <span className='text-red-500'> *</span>}
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
              ))}
            </div>
          </div>
        );
      })}
    </form>
  );
};
