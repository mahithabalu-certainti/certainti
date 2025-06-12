/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  Autocomplete,
  Checkbox,
  MenuItem,
  Select,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
} from '@mui/material';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import dayjs, { Dayjs } from 'dayjs';

import { CountryCode, parsePhoneNumberFromString } from 'libphonenumber-js';
import React, { ChangeEvent, useEffect } from 'react';
import PhoneInput, { CountryData } from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import {
  calendarIcon,
  closeIcon,
  keyContactRemoveIcon,
  keyContactAddIcon,
  searchBlackIcon,
  verticalSeparatorIcon,
  errorInfoIcon,
} from '../../assets';

import { useLocation } from 'react-router-dom';
import { FieldTypes, Layout, OnChange } from '../../common-service';
import { ALLOWED_COUNTRIES } from '../../common-utils';
import {
  FormType,
  FormTypeFields,
  GroupFields,
  SelectOption,
} from '../../consultant/types';
import ConfirmationPopup from '../../common-utils/confirmation-popup';
import TextButton from '../button/text-button';

interface FormBuilderProps {
  data: FormType[];
  formRef: React.RefObject<HTMLFormElement>;
  loading?: boolean;
  values?: Record<string, string | string[] | boolean | number | null | object>;
  layout?: Layout;
  outData: (e: object) => void;
  onChange?: (params: OnChange) => void;
  keyStart?: string;
  keyEnd?: string;
  newContactLength?: number;
  admin?: boolean;
  logo?: File;
}

export const FormBuilder: React.FC<FormBuilderProps> = ({
  data,
  formRef,
  values,
  loading = false,
  layout,
  onChange,
  outData,
  keyStart,
  keyEnd,
  admin = false,
  logo,
}) => {
  const location = useLocation();
  const { state } = location;
  const [formData, setFormData] = React.useState<FormType[]>();
  const [constructFormData, setConstructFormData] = React.useState<
    Record<string, FieldTypes>
  >({});
  const [confirmationState, setConfirmationState] = React.useState<{
    isOpen: boolean;
    message: string;
    onConfirm: () => void;
  }>({ isOpen: false, message: '', onConfirm: () => { } });

  const CommonSkeleton = (
    <Skeleton variant='rounded' width='100%' height={32} />
  );

  useEffect(() => {
    //if field.name === 'resource_type' then disable resource_orgname
    if (constructFormData['resource_type'] === 'Full-Time') {
      const resourceOrgNameField = formData?.[0].fields.find(
        (f) => f.name === 'resource_orgname'
      );
      if (resourceOrgNameField) {
        resourceOrgNameField.disabled = true;
      }
    }
  }, [constructFormData, formData]);

  useEffect(() => {
    const keyContactSection = formData?.find(
      (section) => section.sectionName === 'Key Contacts List'
    );

    if (!keyContactSection) return;

    const fieldsPerRow = 8;
    const rowCount = Math.ceil(keyContactSection.fields.length / fieldsPerRow);

    for (let rowIndex = 0; rowIndex < rowCount; rowIndex++) {
      const baseIndex = rowIndex * fieldsPerRow;

      const nameField = keyContactSection.fields[baseIndex];
      const roleField = keyContactSection.fields[baseIndex + 1];
      const emailField = keyContactSection.fields[baseIndex + 2];
      const primaryField = keyContactSection.fields[baseIndex + 4];
      const includeInCommField = keyContactSection.fields[baseIndex + 5];
      const statusField = keyContactSection.fields[baseIndex + 6];

      if (
        !nameField ||
        !emailField ||
        !roleField ||
        !primaryField ||
        !includeInCommField ||
        !statusField
      )
        continue;

      // if (!constructFormData[statusField.name]) {
      //   setConstructFormData((prev) => ({
      //     ...prev,
      //     [statusField.name]: 'active', // Default status
      //   }));
      //   continue;
      // }

      const hasNameOrEmail =
        (constructFormData[nameField.name]?.toString().trim() || '') !== '' ||
        (constructFormData[emailField.name]?.toString().trim() || '') !== '';

      const isPrimary = constructFormData[primaryField.name] === 'yes';
      const isActive = constructFormData[statusField.name] === 'active';

      const shouldUpdateRole = roleField.required !== hasNameOrEmail;
      const shouldUpdatePrimary = primaryField.required !== hasNameOrEmail;
      const shouldUpdateEmail = emailField.required !== (isPrimary && isActive);
      const shouldUpdateIncludeInComm =
        includeInCommField.disabled !== (isPrimary && isActive);

      if (
        shouldUpdateRole ||
        shouldUpdatePrimary ||
        shouldUpdateEmail ||
        shouldUpdateIncludeInComm
      ) {
        setFormData((prevFormData) =>
          prevFormData?.map((section) => {
            if (section.sectionName === 'Key Contacts List') {
              return {
                ...section,
                fields: section.fields.map((field) => {
                  if (field.name === roleField.name && shouldUpdateRole) {
                    return { ...field, required: hasNameOrEmail };
                  }
                  if (field.name === primaryField.name && shouldUpdatePrimary) {
                    return { ...field, required: hasNameOrEmail };
                  }
                  if (field.name === emailField.name && shouldUpdateEmail) {
                    return { ...field, required: isPrimary && isActive };
                  }
                  if (
                    field.name === includeInCommField.name &&
                    shouldUpdateIncludeInComm
                  ) {
                    return {
                      ...field,
                      disabled: isPrimary && isActive,
                      value: isPrimary && isActive ? 'yes' : field.value,
                    };
                  }
                  return field;
                }),
              };
            }
            return section;
          })
        );
      }
    }
  }, [constructFormData, formData]);

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
              value: oldField?.value ?? newField.value,
              ...(newField.name.startsWith('include_in_communication_')
                ? { disabled: oldField?.disabled ?? newField.disabled }
                : {}),
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

  useEffect(() => {
    // updated default value into constuctFormData
    formData?.forEach((section) => {
      section.fields.forEach((field) => {
        if (field.assignDefaultValue && field.defaultValue) {
          setConstructFormData((prev) => ({
            ...prev,
            [field.name]: field.defaultValue || '',
          }));
        }
      });
    });
  }, [formData, constructFormData]);

  const handleRemoveKeyContactRow = (rowIndexToRemove: number) => {
    const fieldsPerRow = 8;

    setFormData((prevFormData) => {
      if (!prevFormData) return prevFormData;

      const keyContactSection = prevFormData.find(
        (section) => section.sectionName === 'Key Contacts List'
      );
      if (!keyContactSection) return prevFormData;

      const startIndex = rowIndexToRemove * fieldsPerRow;
      const newFields = [...keyContactSection.fields];
      newFields.splice(startIndex, fieldsPerRow);

      const reindexedFields = newFields.map((field, idx) => {
        const newRowIndex = Math.floor(idx / fieldsPerRow);
        const baseName = field.name.replace(/_\d+$/, '');

        return {
          ...field,
          name: `${baseName}_${newRowIndex}`,
        };
      });

      return prevFormData.map((section) => {
        if (section.sectionName === 'Key Contacts List') {
          return {
            ...section,
            fields: reindexedFields,
          };
        }
        return section;
      });
    });

    setConstructFormData((prevData) => {
      if (!prevData) return prevData;

      const newData: Record<string, any> = {};

      Object.entries(prevData).forEach(([key, value]) => {
        const match = key.match(/_(\d+)$/);
        if (match) {
          const idx = Number(match[1]);
          if (idx < rowIndexToRemove) {
            newData[key] = value;
          } else if (idx > rowIndexToRemove) {
            const baseKey = key.replace(/_\d+$/, '');
            newData[`${baseKey}_${idx - 1}`] = value;
          }
        } else {
          newData[key] = value;
        }
      });

      return newData;
    });
  };

  const getFields = (field: FormTypeFields) => {
    const isError = field.error
      ? 'border-red-500 bg-[#FEF2F2]'
      : 'bg-[#FFFFFF]';
    const fontSize = '0.875rem';
    const fieldValue = (constructFormData[field.name] as string) || '';
    const fieldDisabled = field.disabled ? ' bg-gray-100' : '';

    const handleChange = (value: FieldTypes, countryCode?: FieldTypes) => {
      if (
        field.name.startsWith('include_in_communication_') &&
        formData?.some((section) =>
          section.fields.some((f) => f.name === field.name && f.disabled)
        )
      ) {
        return; // Prevent changes if disabled
      }

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

      // if (field.name === 'org_id') {
      //   newData[field.name] = field.defaultValue || '';
      // }

      // update value when change depends fields
      if (field.defaultSelect) {
        if (field.defaultSelect.matchedValue === value) {
          newData[field.defaultSelect.key] = field.defaultSelect.ifMatchValue;
        } else {
          newData[field.defaultSelect.key] =
            field.defaultSelect.ifNotMatchValue;
        }
      }

      // 🔁 Role changed for a primary contact
      if (field.name.startsWith('key_contact_role_')) {
        const currentIndex = parseInt(field.name.split('_').pop() || '0', 10);
        const isPrimaryField = `is_primary_contact_${currentIndex}`;
        const newRole = value;
        const isPrimary = constructFormData[isPrimaryField] === 'yes';
        const currentStatusKey = `key_contact_status_${currentIndex}`;
        const currentStatus = constructFormData[currentStatusKey];

        if (isPrimary && newRole && currentStatus === 'active') {
          const conflictExists = Object.keys(constructFormData).some((key) => {
            if (
              key.startsWith('is_primary_contact_') &&
              key !== isPrimaryField &&
              constructFormData[key] === 'yes'
            ) {
              const otherIndex = parseInt(key.split('_').pop() || '0', 10);
              const otherRoleKey = `key_contact_role_${otherIndex}`;
              const otherStatusKey = `key_contact_status_${otherIndex}`;
              const otherRole = constructFormData[otherRoleKey];
              const otherStatus = constructFormData[otherStatusKey];

              return otherRole === newRole && otherStatus === 'active';
            }
            return false;
          });

          if (conflictExists) {
            setConfirmationState({
              isOpen: true,
              message:
                'Primary Contact with the same role already exists. Would you like to proceed?',
              onConfirm: () => {
                Object.keys(newData).forEach((key) => {
                  if (
                    key.startsWith('is_primary_contact_') &&
                    key !== isPrimaryField
                  ) {
                    const otherIndex = parseInt(
                      key.split('_').pop() || '0',
                      10
                    );
                    const otherRoleKey = `key_contact_role_${otherIndex}`;
                    const otherRole = constructFormData[otherRoleKey];
                    const otherStatusKey = `key_contact_status_${otherIndex}`;
                    const otherStatus = constructFormData[otherStatusKey];

                    if (
                      otherRole === newRole &&
                      newRole !== '' &&
                      otherStatus === 'active'
                    ) {
                      newData[key] = 'no';

                      const otherCommKey = `include_in_communication_${otherIndex}`;
                      const otherEmailKey = `key_contact_email_${otherIndex}`;
                      newData[otherCommKey] = 'no';

                      setFormData((prevFormData) =>
                        prevFormData?.map((section) => ({
                          ...section,
                          fields: section.fields.map((f) => {
                            if (f.name === otherCommKey)
                              return { ...f, disabled: false };
                            if (f.name === otherEmailKey)
                              return { ...f, required: false, error: '' };
                            return f;
                          }),
                        }))
                      );
                    }
                  }
                });

                newData[isPrimaryField] = 'yes';
                const commFieldName = `include_in_communication_${currentIndex}`;
                const emailFieldName = `key_contact_email_${currentIndex}`;
                newData[commFieldName] = 'yes';
                const otherStatusKey = `key_contact_status_${currentIndex}`;
                const otherStatus = constructFormData[otherStatusKey];

                setFormData((prevFormData) =>
                  prevFormData?.map((section) => ({
                    ...section,
                    fields: section.fields.map((f) => {
                      if (f.name === isPrimaryField)
                        return { ...f, value: 'yes' };
                      if (f.name === commFieldName)
                        return {
                          ...f,
                          disabled: otherStatus === 'active' ? true : false,
                        };
                      if (f.name === emailFieldName)
                        return {
                          ...f,
                          required: otherStatus === 'active' ? true : false,
                        };
                      return f;
                    }),
                  }))
                );

                setConstructFormData(newData);
              },
            });
            return;
          }
        }
      }

      // Handle setting is_primary_contact = yes
      if (field.name.startsWith('is_primary_contact_') && value === 'yes') {
        const currentIndex = parseInt(field.name.split('_').pop() || '0', 10);
        const currentRoleKey = `key_contact_role_${currentIndex}`;
        const selectedRole = constructFormData[currentRoleKey];
        const currentStatusKey = `key_contact_status_${currentIndex}`;
        const currentStatus = constructFormData[currentStatusKey];

        if (selectedRole && currentStatus === 'active') {
          const conflictExists = Object.keys(constructFormData).some((key) => {
            if (key.startsWith('is_primary_contact_') && key !== field.name) {
              const otherIndex = parseInt(key.split('_').pop() || '0', 10);
              const otherRoleKey = `key_contact_role_${otherIndex}`;
              const otherStatusKey = `key_contact_status_${otherIndex}`;
              const isPrimary = constructFormData[key] === 'yes';
              const otherRole = constructFormData[otherRoleKey];
              const otherStatus = constructFormData[otherStatusKey];

              return (
                selectedRole &&
                otherRole === selectedRole &&
                isPrimary &&
                otherStatus === 'active'
              );
            }
            return false;
          });

          if (conflictExists) {
            setConfirmationState({
              isOpen: true,
              message:
                'Primary Contact with the same role already exists. Would you like to proceed?',
              onConfirm: () => {
                Object.keys(newData).forEach((key) => {
                  if (
                    key.startsWith('is_primary_contact_') &&
                    key !== field.name
                  ) {
                    const otherIndex = parseInt(
                      key.split('_').pop() || '0',
                      10
                    );
                    const otherRoleKey = `key_contact_role_${otherIndex}`;
                    const otherRole = constructFormData[otherRoleKey];
                    const otherStatusKey = `key_contact_status_${otherIndex}`;
                    const otherStatus = constructFormData[otherStatusKey];

                    if (
                      otherRole === selectedRole &&
                      selectedRole !== '' &&
                      otherStatus === 'active'
                    ) {
                      newData[key] = 'no';
                      const otherCommKey = `include_in_communication_${otherIndex}`;
                      const otherEmailKey = `key_contact_email_${otherIndex}`;
                      newData[otherCommKey] = 'no';

                      setFormData((prevFormData) =>
                        prevFormData?.map((section) => ({
                          ...section,
                          fields: section.fields.map((f) => {
                            if (f.name === otherCommKey)
                              return { ...f, disabled: false };
                            if (f.name === otherEmailKey)
                              return { ...f, required: false, error: '' };
                            return f;
                          }),
                        }))
                      );
                    }
                  }
                });

                const commFieldName = `include_in_communication_${currentIndex}`;
                const emailFieldName = `key_contact_email_${currentIndex}`;
                newData[commFieldName] = 'yes';

                setFormData((prevFormData) =>
                  prevFormData?.map((section) => ({
                    ...section,
                    fields: section.fields.map((f) => {
                      if (f.name === commFieldName)
                        return { ...f, disabled: true };
                      if (f.name === emailFieldName)
                        return { ...f, required: true };
                      return f;
                    }),
                  }))
                );

                setConstructFormData(newData);
              },
            });
            return;
          }
        }
        // No conflict — proceed
        const commFieldName = `include_in_communication_${currentIndex}`;
        const emailFieldName = `key_contact_email_${currentIndex}`;

        newData[commFieldName] = 'yes';

        setFormData((prevFormData) =>
          prevFormData?.map((section) => ({
            ...section,
            fields: section.fields.map((f) => {
              if (f.name === commFieldName) return { ...f, disabled: true };
              if (f.name === emailFieldName) return { ...f, required: true };
              return f;
            }),
          }))
        );
      }

      // Handle is_primary_contact = no
      if (field.name.startsWith('is_primary_contact_') && value === 'no') {
        const currentIndex = parseInt(field.name.split('_').pop() || '0', 10);
        const commFieldName = `include_in_communication_${currentIndex}`;
        const emailFieldName = `key_contact_email_${currentIndex}`;

        setFormData((prevFormData) =>
          prevFormData?.map((section) => ({
            ...section,
            fields: section.fields.map((f) => {
              if (f.name === commFieldName) return { ...f, disabled: false };
              if (f.name === emailFieldName)
                return { ...f, required: false, error: '' };
              return f;
            }),
          }))
        );
      }

      // Set required for role/primary if name or email is filled
      if (
        field.name.startsWith('key_contact_name_') ||
        field.name.startsWith('key_contact_email_')
      ) {
        const currentIndex = parseInt(field.name.split('_').pop() || '0', 10);
        const hasName =
          (newData[`key_contact_name_${currentIndex}`]?.toString().trim() ||
            '') !== '';
        const hasEmail =
          (newData[`key_contact_email_${currentIndex}`]?.toString().trim() ||
            '') !== '';
        const requiredFlag = hasName || hasEmail;

        const roleFieldName = `key_contact_role_${currentIndex}`;
        const primaryFieldName = `is_primary_contact_${currentIndex}`;

        setFormData((prevFormData) =>
          prevFormData?.map((section) => {
            if (section.sectionName === 'Key Contacts List') {
              return {
                ...section,
                fields: section.fields.map((f) => {
                  if (f.name === roleFieldName || f.name === primaryFieldName) {
                    return { ...f, required: requiredFlag };
                  }
                  return f;
                }),
              };
            }
            return section;
          })
        );
      }

      if (field.name.startsWith('key_contact_status_')) {
        const currentIndex = parseInt(field.name.split('_').pop() || '0', 10);
        const statusField = field.name;
        const previousStatus = constructFormData[statusField];
        const newStatus = value;

        const isPrimaryField = `is_primary_contact_${currentIndex}`;
        const roleField = `key_contact_role_${currentIndex}`;
        const currentRole = constructFormData[roleField];
        const isPrimary = constructFormData[isPrimaryField] === 'yes';

        // Check if the popup needs to be shown
        const shouldShowPopup =
          previousStatus === 'inactive' &&
          newStatus === 'active' &&
          isPrimary &&
          Object.keys(constructFormData).some((key) => {
            if (
              key.startsWith('is_primary_contact_') &&
              key !== isPrimaryField &&
              constructFormData[key] === 'yes'
            ) {
              const index = parseInt(key.split('_').pop() || '0', 10);
              const roleKey = `key_contact_role_${index}`;
              const statusKey = `key_contact_status_${index}`;

              return (
                constructFormData[roleKey] === currentRole &&
                constructFormData[statusKey] === 'active'
              );
            }
            return false;
          });

        if (shouldShowPopup) {
          setConfirmationState({
            isOpen: true,
            message:
              'Primary Contact with the same role already exists. Would you like to proceed?',
            onConfirm: () => {
              const commFieldName = `include_in_communication_${currentIndex}`;
              const emailFieldName = `key_contact_email_${currentIndex}`;
              newData[statusField] = 'active';
              newData[commFieldName] = 'yes';

              // Deactivate other primary contacts with same role
              Object.keys(constructFormData).forEach((key) => {
                if (
                  key.startsWith('is_primary_contact_') &&
                  key !== isPrimaryField &&
                  constructFormData[key] === 'yes'
                ) {
                  const otherIndex = parseInt(key.split('_').pop() || '0', 10);
                  const otherRoleKey = `key_contact_role_${otherIndex}`;
                  const otherStatusKey = `key_contact_status_${otherIndex}`;
                  const otherCommKey = `include_in_communication_${otherIndex}`;
                  const otherEmailKey = `key_contact_email_${otherIndex}`;

                  if (
                    constructFormData[otherRoleKey] === currentRole &&
                    constructFormData[otherStatusKey] === 'active'
                  ) {
                    newData[key] = 'no';
                    newData[otherCommKey] = 'no';

                    setFormData((prev) =>
                      prev?.map((section) => ({
                        ...section,
                        fields: section.fields.map((f) => {
                          if (f.name === otherCommKey)
                            return { ...f, disabled: false };
                          if (f.name === otherEmailKey)
                            return { ...f, required: false, error: '' };
                          return f;
                        }),
                      }))
                    );
                  }
                }
              });

              setFormData((prev) =>
                prev?.map((section) => ({
                  ...section,
                  fields: section.fields.map((f) => {
                    if (f.name === statusField)
                      return { ...f, value: 'active' };
                    if (f.name === commFieldName)
                      return { ...f, disabled: true };
                    if (f.name === emailFieldName)
                      return { ...f, required: true };
                    return f;
                  }),
                }))
              );

              setConstructFormData(newData);
            },
          });

          return;
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

            // clear error message when change field
            if (f.name === field.name) {
              updatedField.error = '';
            }

            // If this field is part of a group and the value is being cleared
            if (field.group && !value && f.group === field.group) {
              updatedField.error = '';
            }
            // If this field is part of a group and a value is being set
            if (field.group && value && f.group === field.group) {
              // Clear error messages for all fields in the same group
              const otherFieldsInGroupHaveValue = section.fields
                .filter(
                  (groupField) =>
                    groupField.group === field.group &&
                    groupField.name !== field.name
                )
                .some((groupField) =>
                  constructFormData[groupField.name]?.toString().trim()
                );

              if (!otherFieldsInGroupHaveValue) {
                updatedField.error = '';
              }
            }
            // clear selected value when other field change
            if (
              f.clearValue?.key === field.name &&
              value === f.clearValue.matchedValue
            ) {
              newData[f.name] = '';
              updatedField.error = '';
            }

            return updatedField;
          }),
        }));
      });

      setConstructFormData(newData);
    };

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
      // Update the parent's state (if `handleChange` expects the file object)
      // or just the filename for display
      if (e.target.files && e.target.files.length > 0) {
        const file = e.target.files[0];
        if (field.onChange && onChange) {
          onChange({ fieldName: field.name, fieldValue: file }); // Update local state for display
        }
      }
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
              'placeholder-custom-color placeholder-[#7D98B6] outline-none focus:border-2 focus:border-blue-400 w-full sm:text-sm px-3 h-[32px] border border-[#CBD6E2] rounded-xs ' +
              isError +
              fieldDisabled
            }
            disabled={field.disabled}
            onChange={(e) => handleChange(e.target.value)}
            value={fieldValue || field.defaultValue || ''}
          />
        );
      case 'file':
        return (
          <div className='w-full flex items-center gap-2'>
            <input
              id='upload-logo'
              type={field.type}
              name={field.name}
              autoComplete='off'
              className={'hidden'}
              disabled={field.disabled}
              onChange={handleFileChange}
            />
            <div className='flex items-center w-[72%] sm:text-sm px-3 h-[32px] border border-[#CBD6E2] rounded-xs'>
              <span
                className={`${logo && logo.name ? 'text-[#000000]' : 'text-[#7D98B6]'} truncate`}
              >
                {' '}
                {/* Apply truncate directly to the span */}
                {logo ? logo.name : 'No file selected'}
              </span>
            </div>
            <TextButton
              // type='button'
              label='Browse'
              sx={{
                height: '32px !important',
                minWidth: '90px',
                maxWidth: '90px',
                fontSize: '13px',
                fontWeight: '400',
              }}
              // className='sm:text-sm min-w-[90px] h-[32px] px-2 box-border border border-[#CBD6E2] rounded-xs'
              onClick={() => {
                const logoFileInput = document.getElementById(
                  'upload-logo'
                ) as HTMLInputElement;
                logoFileInput.click();
              }}
            />
          </div>
        );
      case 'website':
        return (
          <input
            type={'text'}
            name={field.name}
            placeholder={field.placeholder}
            autoComplete='off'
            className={
              'focus:outline-none placeholder-custom-color placeholder-[#7D98B6] w-full sm:text-sm px-1 h-[32px]' +
              // isError +
              fieldDisabled
            }
            disabled={field.disabled}
            onChange={(e) => handleChange(e.target.value)}
            value={fieldValue || field.defaultValue || ''}
          />
        );
      case 'select': {
        const fieldValue =
          (constructFormData[field.name] || field.defaultValue) ?? '';
        return (
          <div className='w-full'>
            <Select
              name={field.name}
              className={
                'custom-select-no-arrow w-full h-full sm:text-sm px-1.5 py-[7px]  ' +
                (fieldValue === '' ? 'text-[#7D98B6] ' : '') +
                isError +
                fieldDisabled
              }
              onChange={(e) => handleChange(e.target.value)}
              value={fieldValue}
              disabled={field.disabled}
              displayEmpty
              fullWidth
              size='small'
              MenuProps={{
                PaperProps: {
                  sx: {
                    maxWidth: 300,
                    maxHeight: 300,
                    marginTop: '4px',
                    boxShadow:
                      'rgba(50, 50, 93, 0.25) 0px 2px 5px -1px, rgba(0, 0, 0, 0.3) 0px 1px 3px -1px',
                    '& .MuiMenuItem-root': {
                      fontSize: '13px',
                      padding: '6px 12px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    },
                  },
                },
              }}
              sx={{
                height: '32px',
                fontSize: '13px',
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  border: '2px solid #60A5FA',
                },
                '& .MuiOutlinedInput-root': {
                  '&.Mui-focused': {
                    boxShadow: 'none',
                  },
                },
                '.MuiSelect-select': {
                  padding: '6px 6px',
                  color: fieldValue === '' ? '#7D98B6' : 'black',
                },
                '&.Mui-disabled': {
                  backgroundColor: '#f3f4f6',
                },
                '& .MuiOutlinedInput-notchedOutline': {
                  border: field.error
                    ? '1px solid #ef4444'
                    : '1px solid #CBD6E2',
                  borderRadius: '2px',
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  border: field.error
                    ? '1px solid #ef4444'
                    : '1px solid #CBD6E2',
                },
                // '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                //   borderColor: field.error ? '#ef4444' : 'black',
                // },
                '& svg': {
                  color: '#7D98B6',
                },
              }}
            >
              <MenuItem
                value=''
                sx={{
                  color: '#425A76',
                  fontSize: '13px',
                  fontWeight: '500',
                }}
              >
                {field.placeholder}
              </MenuItem>
              {field?.options?.map((option, i) => (
                <MenuItem
                  sx={{
                    color: '#425A76',
                    fontSize: '13px',
                    fontWeight: '500',
                  }}
                  key={i}
                  value={option.value}
                  title={option.label}
                >
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </div>
        );
      }
      case 'textarea':
        return (
          <textarea
            className={
              // caret-blue-400 -  change cursor border color when focus
              'outline-none placeholder-custom-color w-full sm:text-sm py-2 px-3 border border-[#CBD6E2] rounded-xs h-[95px] resize-none focus:border-2 focus:border-blue-400 ' +
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
      case 'radio': {
        const fieldValue =
          (constructFormData[field.name] || field.defaultValue) ?? '';
        return (
          <div className='flex items-center gap-4 !h-[32px]'>
            {field?.options?.map((option, i) => (
              <label
                key={i}
                className={`flex gap-2 ${field.disabled ? 'cursor-default' : 'cursor-pointer'}`}
              >
                <input
                  type='radio'
                  name={field.name}
                  value={option.value}
                  checked={fieldValue === option.value}
                  disabled={field.disabled}
                  onChange={(e) => {
                    handleChange(e.target.value);
                  }}
                  className={`${field.disabled ? 'cursor-default' : 'cursor-pointer'}`}
                />
                <span className='text-[13px] text-[#7D98B6]'>
                  {option.label}
                </span>
              </label>
            ))}
          </div>
        );
      }
      case 'date': {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const startDateValue: string | undefined | any = keyStart
          ? constructFormData[keyStart]
          : undefined;
        const today: Dayjs = dayjs();
        const isEndDateField = field.name === keyEnd;
        const parsedStartDate = startDateValue
          ? dayjs(startDateValue, 'YYYY-MM-DD')
          : undefined;

        // Get the selected fiscal year from form data
        const selectedFiscalYear = constructFormData['fiscal_year'];
        const isFinancialDateField =
          field.name === 'financial_start_date' ||
          field.name === 'financial_end_date';

        const customMinDate: Dayjs | undefined = (() => {
          if (isFinancialDateField && selectedFiscalYear) {
            const fiscalYearStart = dayjs(
              `${selectedFiscalYear}-01-01`,
              'YYYY-MM-DD'
            );

            if (isEndDateField && parsedStartDate) {
              return parsedStartDate.add(1, 'day').isAfter(fiscalYearStart)
                ? parsedStartDate.add(1, 'day')
                : fiscalYearStart;
            }
            return fiscalYearStart;
          }
          if (isEndDateField && parsedStartDate) {
            return parsedStartDate.add(1, 'day');
          }
          return field?.minDate ? dayjs(field.minDate) : undefined;
        })();

        const customMaxDate: Dayjs | undefined = (() => {
          if (isFinancialDateField && selectedFiscalYear) {
            const fiscalYearEnd = dayjs(
              `${selectedFiscalYear}-12-31`,
              'YYYY-MM-DD'
            );

            if (field?.maxDate) {
              const maxDate = dayjs(field.maxDate);
              return fiscalYearEnd.isBefore(maxDate) ? fiscalYearEnd : maxDate;
            }
            return fiscalYearEnd;
          }
          if (isEndDateField && startDateValue) {
            return field?.maxDate
              ? dayjs(field.maxDate).isBefore(today)
                ? dayjs(field.maxDate)
                : today
              : today;
          }
          return field?.maxDate ? dayjs(field.maxDate) : undefined;
        })();

        return (
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DatePicker
              className={
                'placeholder:text-[13px] placeholder:text-[#425A76] placeholder:font-medium border border-[#CBD6E2]' +
                isError +
                fieldDisabled
              }
              minDate={customMinDate}
              maxDate={customMaxDate}
              value={dayjs(fieldValue, 'YYYY-MM-DD')}
              disabled={field.disabled}
              format='YYYY-MM-DD'
              // onOpen={() => {
              //   if (!fieldValue && isFinancialDateField && selectedFiscalYear) {
              //     // Show calendar from Jan 1 of fiscal year
              //     const date = dayjs().month(dayjs().month()).year(Number(selectedFiscalYear));
              //     handleChange(date.format('YYYY-MM-DD'));
              //   }
              // }}
              onChange={(newValue) => {
                handleChange(
                  newValue ? dayjs(newValue).format('YYYY-MM-DD') : null
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
                        pl: '11px',
                        '& ::placeholder': {
                          color: '#7D98B6 !important',
                        },
                        color: 'black !important',
                        WebkitTextFillColor: 'black !important',

                        '&[value="YYYY-MM-DD"]': {
                          color: '#7D98B6 !important',
                          WebkitTextFillColor: '#7D98B6 !important',
                        },
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        border: '1px solid #CBD6E2', // match default
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        border: '2px solid #60A5FA',
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
                  //   if (value !== 'YYYY-MM-DD') {
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
              className={
                'placeholder:text-[13px] placeholder:text-[#425A76] placeholder:font-medium border border-[#CBD6E2]' +
                isError +
                fieldDisabled
              }
              value={dayjs(fieldValue, 'DD/MM')}
              disabled={field.disabled}
              format='MM/DD'
              views={['month', 'day']}
              open={false}
              onChange={(newValue) => {
                handleChange(dayjs(newValue).format('DD/MM'));
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
                        pl: '12px',
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
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        border: '1px solid #CBD6E2', // match default
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        border: '2px solid #60A5FA',
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
            inputClass={`!outline-none placeholder:text-[13px] placeholder:color[#425A76] placeholder:font-medium !w-full !text-[13px] !p-2 !pl-12 !h-[32px] !rounded-xs ${field.error ? '!border-red-500' : ''}${field.disabled ? ' !bg-gray-100' : ''}`}
            buttonClass={`!bg-transparent !border-r ${field.error ? '!border-red-500' : '!border-gray-300'} !rounded-tl-xs !rounded-bl-xs !hover:bg-transparent !shadow-none !px-0 !m-0`}
            containerClass='!w-full focus-within:outline-none focus-within:!border-2 focus-within:!border-blue-400'
            inputProps={{
              name: field.name,
              disabled: field.disabled,
              placeholder: field.placeholder,
            }}
          />
        );
      case 'button':
        return (
          <button
            className='flex items-center cursor-pointer gap-1 bg-[#EAF0F5] h-[30px] rounded-[2px] color-[#2D3E4F] px-2 text-[12px] font-semibold'
            type='button'
            onClick={field.onClick}
          >
            <span>
              <img src={keyContactAddIcon} alt='add-btn' className='w-5 h-5' />
            </span>
            {field.name}
          </button>
        );
      case 'emptyFeild':
        return <></>;
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
    format: string = 'YYYY-MM-DD'
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

    //get group fields from formData
    const groupFields: GroupFields = new Map();
    formData?.forEach((section) => {
      section.fields.forEach((field) => {
        if (field.group) {
          if (!groupFields.has(field.group)) {
            groupFields.set(field.group, []);
          }
          groupFields.get(field.group)?.push(field.name);
        }
      });
    });
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

          if (field.type === 'file' && logo) {
            const allowedTypes = [
              'image/jpeg',
              'image/jpg', // 'image/jpeg' usually covers .jpg, but sometimes explicit for clarity
              'image/png',
              'image/svg+xml',
            ];
            const maxFileSize = 200 * 1024;

            if (logo?.type && !allowedTypes.includes(logo?.type)) {
              hasError = true;
              return {
                ...field,
                error:
                  'Invalid file type. Only JPG, JPEG, PNG, and SVG are allowed.',
              };
            }

            if (logo?.size && logo?.size > maxFileSize) {
              hasError = true;
              return {
                ...field,
                error: 'File size exceeds the limit of 200 KB.',
              };
            }
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
            if (!isValidDate(dateValue, 'DD/MM')) {
              hasError = true;
              return {
                ...field,
                error: 'Invalid date',
              };
            }
          }

          if (field.type === 'date') {
            const dateValue = constructFormData[field.name] as string;
            // cost date validation
            if (
              field.name === 'financial_start_date' ||
              field.name === 'financial_end_date'
            ) {
              const selectedFiscalYear = constructFormData[
                'fiscal_year'
              ] as string;

              if (selectedFiscalYear) {
                // Fiscal year bounds
                const fiscalYearStart = dayjs(
                  `${selectedFiscalYear}-01-01`,
                  'YYYY-MM-DD'
                );
                const fiscalYearEnd = dayjs(
                  `${selectedFiscalYear}-12-31`,
                  'YYYY-MM-DD'
                );

                if (dateValue) {
                  const currentDate = dayjs(dateValue, 'YYYY-MM-DD');

                  // Check against fiscal year bounds
                  if (
                    currentDate.isBefore(fiscalYearStart, 'day') ||
                    currentDate.isAfter(fiscalYearEnd, 'day')
                  ) {
                    hasError = true;
                    return {
                      ...field,
                      error: `${field.name === 'financial_start_date' ? 'Start' : 'End'} date must be within the selected fiscal year (${selectedFiscalYear})`,
                    };
                  }

                  // Check against maxDate (if specified)
                  if (
                    field.maxDate &&
                    currentDate.isAfter(dayjs(field.maxDate), 'day')
                  ) {
                    hasError = true;
                    return {
                      ...field,
                      error: `${field.name === 'financial_start_date' ? 'Start' : 'End'} date cannot be after ${dayjs(field.maxDate).format('YYYY-MM-DD')}`,
                    };
                  }
                }
              }

              // Validate financial end date against start date
              if (field.name === 'financial_end_date' && dateValue) {
                const startDateValue = constructFormData[
                  'financial_start_date'
                ] as string;

                if (startDateValue) {
                  const startDate = dayjs(startDateValue, 'YYYY-MM-DD');
                  const endDate = dayjs(dateValue, 'YYYY-MM-DD');

                  if (endDate.isSame(startDate, 'day')) {
                    hasError = true;
                    return {
                      ...field,
                      error: 'End date cannot be the same as start date',
                    };
                  }

                  if (endDate.isBefore(startDate, 'day')) {
                    hasError = true;
                    return {
                      ...field,
                      error: 'End date must be after start date',
                    };
                  }
                }
              }

              // Validate both financial dates are either provided or not provided
              if (
                field.name === 'financial_start_date' ||
                field.name === 'financial_end_date'
              ) {
                const startDate = constructFormData[
                  'financial_start_date'
                ] as string;
                const endDate = constructFormData[
                  'financial_end_date'
                ] as string;

                if ((startDate && !endDate) || (!startDate && endDate)) {
                  hasError = true;
                  return {
                    ...field,
                    error: 'Both start date and end date must be provided',
                  };
                }
              }
            }

            if (field?.startValue && constructFormData[field.name]) {
              const dateValue = constructFormData[field.name] as string;
              if (
                dayjs(dateValue).isBefore(dayjs(field?.minDate)) ||
                dayjs(dateValue).isAfter(dayjs(field?.maxDate))
              ) {
                hasError = true;
                return {
                  ...field,
                  error: `Effective date must be within the last 7 years from today`,
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
                return {
                  ...field,
                  error: 'End date must be after effective date',
                };
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
                  error: `${field.name === 'resource_startdate' ? 'Effective Date' : field.name === 'skill_start_date' || field.name === 'project_startdate' ? 'Start Date' : 'This date'} cannot be in the future`,
                };
              }
              if (dateValue && !isValidDate(dateValue, 'YYYY-MM-DD')) {
                hasError = true;
                return {
                  ...field,
                  error: 'Please enter a valid date.',
                };
              }
            }
          }

          if (field.type === 'date') {
            const dateValue = constructFormData[field.name] as string;

            // Check if future dates are disabled
            if (
              field.disableFutureDates &&
              dayjs(dateValue).isAfter(dayjs(), 'day')
            ) {
              hasError = true;
              return {
                ...field,
                error: `${field.name === 'resource_startdate' ? 'Effective Date' : field.name === 'project_startdate' ? 'Start Date' : 'This date'} cannot be in the future`,
              };
            }
            const currentDate = dayjs();

            if (
              (field.name === 'resource_enddate' ||
                field.name === 'project_enddate') &&
              dayjs(dateValue).isAfter(currentDate, 'day')
            ) {
              hasError = true;
              return {
                ...field,
                error: 'End Date cannot be in the future',
              };
            }

            // Check if date is before the minimum allowed date (1-1-1950)
            const minAllowedDate =
              field.name === 'project_startdate'
                ? dayjs('2000-01-01', 'YYYY-MM-DD')
                : dayjs('1-1-1950', 'D-M-YYYY');
            if (dayjs(dateValue).isBefore(minAllowedDate, 'day')) {
              hasError = true;
              return {
                ...field,
                error:
                  field.name === 'resource_startdate'
                    ? 'Effective Date cannot be before 1950-01-01'
                    : field.name === 'skill_start_date'
                      ? 'Start Date cannot be before 1950-01-01'
                      : field.name === 'project_startdate'
                        ? 'Start Date cannot be before 2000-01-01'
                        : field.name === 'project_enddate'
                          ? 'End Date cannot be before 2000-01-01'
                          : 'Date cannot be before 1950-01-01',
              };
            }
            // Check if both start and end dates are either provided or not provided
            // Handle project dates validation
            if (
              field.name === 'project_startdate' ||
              field.name === 'project_enddate'
            ) {
              const startDate = constructFormData[
                'project_startdate'
              ] as string;
              const endDate = constructFormData['project_enddate'] as string;

              if ((startDate && !endDate) || (!startDate && endDate)) {
                hasError = true;
                return {
                  ...field,
                  error: 'Both Start Date and End Date must be be provided',
                };
              }

              if (startDate && endDate) {
                const start = dayjs(startDate);
                const end = dayjs(endDate);

                if (start.isSame(end, 'day')) {
                  hasError = true;
                  return {
                    ...field,
                    error:
                      field.name === 'project_startdate'
                        ? 'Start Date cannot be the same as End Date'
                        : 'End Date cannot be the same as Start Date',
                  };
                }

                if (start.isAfter(end, 'day')) {
                  hasError = true;
                  return {
                    ...field,
                    error:
                      field.name === 'project_startdate'
                        ? 'Start Date cannot be after End Date'
                        : 'End Date cannot be before Start Date',
                  };
                }
              }
            }

            // Handle resource dates validation
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
                  error: 'Both Effective Date and End Date must be provided',
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
                        ? 'Effective Date cannot be the same as End Date'
                        : 'End Date cannot be the same as Effective Date',
                  };
                }

                // Check if start date is after end date
                if (start.isAfter(end, 'day')) {
                  hasError = true;
                  return {
                    ...field,
                    error:
                      field.name === 'resource_startdate'
                        ? 'Effective Date cannot be after End Date'
                        : 'End Date cannot be before Effective Date',
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
    //group field validation
    groupFields.forEach((fieldNames, groupName) => {
      // Filter out any fields that might be in hidden sections
      const visibleFields = fieldNames.filter((fieldName) => {
        let isVisible = false;
        dataValidation?.forEach((section) => {
          if (!section.hide) {
            section.fields.forEach((field) => {
              if (field.name === fieldName && !field.hide) {
                isVisible = true;
              }
            });
          }
        });
        return isVisible;
      });

      const filledFields = visibleFields.filter((fieldName) =>
        constructFormData[fieldName]?.toString().trim()
      );

      if (visibleFields.length > 0) {
        if (filledFields.length === 0) {
          // No fields filled - show error on all visible fields in group
          hasError = true;
          dataValidation?.forEach((section) => {
            if (!section.hide) {
              section.fields.forEach((field) => {
                if (field.group === groupName && !field.hide) {
                  field.error = `At least one field in the "${groupName}" group is required`;
                }
              });
            }
          });
        } else if (filledFields.length > 1) {
          // More than one field filled - show error on filled fields
          hasError = true;
          dataValidation?.forEach((section) => {
            if (!section.hide) {
              section.fields.forEach((field) => {
                if (
                  field.group === groupName &&
                  filledFields.includes(field.name) &&
                  !field.hide
                ) {
                  field.error = `Only one field in the "${groupName}" group can be filled`;
                }
              });
            }
          });
        }
      }
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

  const chunkFields = (arr: FormTypeFields[], chunkSize: number = 0) => {
    const chunks = [];
    for (let i = 0; i < arr.length; i += chunkSize) {
      chunks.push(arr.slice(i, i + chunkSize));
    }
    return chunks;
  };

  const loadKeyContactSection = (section: FormType) => {
    const visibleFields = section.fields.filter(
      (field) => !field.name.startsWith('key_contact_rid_')
    );
    const headerFields = visibleFields.slice(0, 7);
    const fieldRows = chunkFields(visibleFields, 7);
    return (
      <div className='px-10'>
        <TableContainer sx={{ overflowX: 'auto' }}>
          <Table className='border-l border-[#CBD6E2]'>
            <TableHead
              sx={{
                '& .MuiTableCell-root': {
                  fontWeight: 700,
                  fontSize: '13px',
                  color: '#2A2A2A',
                  padding: '0px 8px',
                  height: '29px',
                  boxSizing: 'border-box',
                },
              }}
            >
              <TableRow sx={{ height: 29 }}>
                {headerFields.map((field, j) => {
                  return (
                    <TableCell
                      sx={{
                        width: `${field.width}`,
                        minWidth: `${field.width}`,
                        maxWidth: `${field.width}`,
                        // textWrap: 'nowrap',
                      }}
                      key={`${field.name}_${j}`}
                    >
                      {field.label}
                    </TableCell>
                  );
                })}
              </TableRow>
            </TableHead>
            <TableBody
              sx={{
                '& .MuiTableCell-root': {
                  padding: '0px',
                  '& input': {
                    border: 'none',
                    outline: 'none',
                    boxShadow: 'none',
                    background: 'transparent',
                  },
                  '& radio': {
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  },
                },
              }}
            >
              {fieldRows.map((row, rowIndex) => (
                <TableRow key={rowIndex}>
                  {row.map((field, colIndex) => {
                    const isLastColumn = colIndex === row.length - 1;
                    const isRequired = field.required;
                    return (
                      <TableCell
                        sx={{
                          position: 'relative',
                          height: '32px !important',
                          width: `${field.width}`,
                          minWidth: `${field.width}`,
                          maxWidth: `${field.width}`,
                          paddingLeft:
                            `${field.type}` === 'iconButton' ||
                              `${field.type}` === 'radio'
                              ? '10px !important'
                              : 'none',
                          verticalAlign:
                            `${field.type}` === 'iconButton'
                              ? 'middle !important'
                              : 'top',
                          '& input': {
                            border: field.error
                              ? '1px solid #fb2c36 !important'
                              : 'none',
                            '&:focus': {
                              border: field.error
                                ? '1px solid #fb2c36'
                                : '1px solid #60A5FA',
                            },
                          },
                          '& .MuiOutlinedInput-notchedOutline': {
                            border: 'none !important',
                          },
                          '& .MuiOutlinedInput-root': {
                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                              border: '1px solid #60A5FA !important',
                            },
                          },
                          '&:hover .MuiOutlinedInput-notchedOutline': {
                            border: 'none',
                          },
                        }}
                        key={colIndex}
                        style={{
                          verticalAlign: 'top',
                          height: '32px !important',
                          backgroundColor: field.error
                            ? '#FEF2F2'
                            : 'transparent',
                        }}
                      >
                        {field.type === 'iconButton' && isLastColumn ? (
                          <Tooltip
                            title={'Remove contact'}
                            arrow
                            placement='top'
                          >
                            <button
                              type='button'
                              onClick={(e) => {
                                e.stopPropagation();
                                field.onClick?.(e);
                                handleRemoveKeyContactRow(rowIndex);
                              }}
                              style={{
                                cursor: 'pointer',
                                background: 'transparent',
                                border: 'none',
                                padding: 0,
                                marginTop: '6px',
                              }}
                              aria-label='Remove contact'
                            >
                              <img
                                src={field.iconUrl || keyContactRemoveIcon}
                                alt='Remove'
                                style={{ width: 20, height: 20 }}
                              />
                            </button>
                          </Tooltip>
                        ) : field.type === 'text' ? (
                          <div
                            className={`!h-[32px] !max-h-[32px] box-border relative ${field.error ? 'bg-[#FEF2F2]' : ''}`}
                          >
                            {getFields(field)}
                            {field.error && (
                              <Tooltip
                                title={field.error}
                                arrow
                                placement='top'
                                slotProps={{
                                  tooltip: {
                                    sx: {
                                      backgroundColor: '#FEF2F2',
                                      mr: 1,
                                    },
                                  },
                                }}
                              >
                                <span className='h-[28px] w-5 flex items-center justify-center absolute top-[3px] bg-[#FEF2F2] right-[2px] cursor-pointer'>
                                  <img
                                    src={errorInfoIcon}
                                    alt='error'
                                    className='w-5 h-3.5'
                                  />
                                </span>
                              </Tooltip>
                            )}
                            {isRequired && !field.error && (
                              <span className='absolute top-0 right-1 text-red-500 text-[16px]'>
                                *
                              </span>
                            )}
                          </div>
                        ) : (
                          <>
                            {getFields(field)}
                            {isRequired && (
                              <span className='absolute top-0 right-1 text-red-500 text-[16px]'>
                                *
                              </span>
                            )}
                          </>
                        )}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </div>
    );
  };

  const loadDefaultSections = (
    section: FormType,
    isHalf: boolean,
    index: number
  ) => {
    return (
      <div
        className={`grid md:grid-cols-3 gap-x-4 gap-y-[2px] ${layout === Layout.TYPE_1 ? 'px-10' : 'px-6'} ${!formData?.[index + 1]?.sectionName ? 'mb-1' : 'mb-4'} `}
      >
        {section.fields.map((field, j) => {
          if (field.hide) return null;
          return (
            <div
              key={j}
              className={`col-span-1 ${!isHalf ? 'md:col-span-3' : ''} flex flex-col`}
            >
              <label
                className={`text-[13px] text-[#2D3E4F] font-semibold leading-[21px] tracking-[0] md:text-left mt-1`}
                htmlFor={field.name}
              >
                {field.label}
                {field.required && <span className='text-red-500'> *</span>}
              </label>
              <div>
                {field.type === 'website' ? (
                  <div
                    className={`border border-[#CBD6E2] rounded-[2px] overflow-hidden focus-within:border-2 focus-within:border-blue-400 ${field.error ? 'border-red-500 bg-[#FEF2F2]' : ''}`}
                  >
                    <div className='h-[32px]  box-border flex items-center gap-[4px]'>
                      <span className='pl-[10px] text-[13px] text-[#425A76]'>
                        https://
                      </span>
                      <img src={verticalSeparatorIcon} alt-='separtor' />
                      {getFields(field)}
                    </div>
                  </div>
                ) : (
                  getFields(field)
                )}

                {field.error && (
                  <span className='text-[12px] text-red-400 col-span-full'>
                    {field.error}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const loadSectionsWithoutTitle = (section: FormType) => {
    return (
      <div
        className={`grid md:grid-cols-3 gap-x-4 gap-y-[2px] ${layout === Layout.TYPE_1 ? 'px-10' : 'px-6'} mb-4`}
      >
        {section.fields.map((field, j) => {
          if (field.hide) return null;
          return (
            <div key={j} className={`col-span-3 flex flex-col`}>
              <label
                className={`text-[13px] text-[#2D3E4F] font-semibold leading-[21px] tracking-[0] md:text-left`}
                htmlFor={field.name}
              >
                {field.label}
                {field.required && <span className='text-red-500'> *</span>}
              </label>
              <div className={`${!field.label ? 'mt-1.5' : ''}`}>
                {getFields(field)}
                {field.error && (
                  <span className='text-[12px] text-red-400 col-span-full'>
                    {field.error}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <>
      <form onSubmit={submitData} ref={formRef}>
        {formData?.map((section, i) => {
          const isHalf = section.fillType === 'half';
          if (section.hide) return null;
          return (
            <div key={i}>
              {section.sectionName && (
                <h4
                  className={`${i === 0 ? 'border-b' : 'border'} h-[30px] border-box border-[#CBD6E2] font-bold text-[14px] text-[#2D3E4F] leading-[21px] tracking-[0%] align-middle py-1 ${admin ? 'bg-[#FCFCFC]' : 'bg-[#ECECEC]'}  ${layout === Layout.TYPE_1 ? 'px-10' : 'px-4'}`}
                >
                  {section.sectionName}
                </h4>
              )}
              <>
                {!section.sectionName
                  ? loadSectionsWithoutTitle(section)
                  : section.sectionName === 'Key Contacts List'
                    ? loadKeyContactSection(section)
                    : loadDefaultSections(section, isHalf, i)}
              </>
            </div>
          );
        })}
      </form>
      <ConfirmationPopup
        isOpen={confirmationState.isOpen}
        message={confirmationState.message}
        onConfirm={() => {
          confirmationState.onConfirm();
          setConfirmationState((prev) => ({ ...prev, isOpen: false }));
        }}
        onCancel={() =>
          setConfirmationState((prev) => ({ ...prev, isOpen: false }))
        }
      />
    </>
  );
};
