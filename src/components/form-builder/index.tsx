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
  CalendarIcon,
  CloseIcon,
  KeyContactRemoveIcon,
  KeyContactAddIcon,
  // SearchBlackIcon, /* It may use in future, based on client confirmation */
  VerticalSeparatorIcon,
  ErrorInfoIcon,
} from '../../assets';

import { useLocation } from 'react-router-dom';
import { FieldTypes, Layout, OnChange } from '../../common-service';
import {
  FormType,
  FormTypeFields,
  GroupFields,
  KeyContactHeader,
  SelectOption,
} from '../../consultant/types';
import ConfirmationPopup from '../../common-utils/confirmation-popup';
import TextButton from '../button/text-button';
import { ArrowDropDownIcon } from '@mui/x-date-pickers/icons';
import FiscalYearDropdown from '../fiscal-dropdown/form-fiscal-dropdown';

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
  logo?: File | null;
  keyContactHeaders?: KeyContactHeader[];
  highlight?: { field: string; section: string };
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
  keyContactHeaders = [],
  newContactLength,
  highlight,
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
    confirmLabel?: string;
  }>({ isOpen: false, message: '', onConfirm: () => {}, confirmLabel: '' });

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
        if (
          field.assignDefaultValue &&
          field.defaultValue &&
          field.clearValue
        ) {
          const { key, matchedValue } = field.clearValue;
          if (constructFormData[key] === matchedValue) {
            setConstructFormData((prev) => ({
              ...prev,
              [field.name]: field.defaultValue || '',
            }));
          } else {
            setConstructFormData((prev) => ({
              ...prev,
              [field.name]: '',
            }));
          }
        }
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData]);

  useEffect(() => {
    if (Object.keys(constructFormData).length === 0) return;
    const keyContactSection = formData?.find(
      (section) => section.sectionName === 'key_contacts_list'
    );

    if (!keyContactSection) return;
    const isFromAccount = formData?.find((item) => item.from === 'account');
    const fieldsPerRow = newContactLength ?? 8;
    const rowCount = Math.ceil(keyContactSection.fields.length / fieldsPerRow);

    for (let rowIndex = 0; rowIndex < rowCount; rowIndex++) {
      const baseIndex = rowIndex * fieldsPerRow;
      const statusIndex = isFromAccount ? 7 : 6;
      const nameField = keyContactSection.fields[baseIndex];
      const roleField = keyContactSection.fields[baseIndex + 1];
      const emailField = keyContactSection.fields[baseIndex + 2];
      const primaryField = keyContactSection.fields[baseIndex + 4];
      const includeInCommField = keyContactSection.fields[baseIndex + 5];
      const statusField = keyContactSection.fields[baseIndex + statusIndex];

      if (
        !nameField ||
        !emailField ||
        !roleField ||
        !primaryField ||
        !includeInCommField ||
        !statusField
      )
        continue;

      const includeInCommValue =
        constructFormData[includeInCommField.name] === 'yes';
      const nameValue =
        constructFormData[nameField.name]?.toString().trim() || '';
      const emailValue =
        constructFormData[emailField.name]?.toString().trim() || '';
      const isPrimary = constructFormData[primaryField.name] === 'yes';

      // Name and Email requirements:
      // - If Include In Communications is Yes: Both are required
      // - If Include In Communications is No: At least one is required (either name or email)
      const nameRequired =
        includeInCommValue || (!includeInCommValue && !emailValue);
      const emailRequired =
        includeInCommValue || (!includeInCommValue && !nameValue);

      // Role is required when is Primary is true
      const roleRequired = isPrimary;

      // Check if we need to update any fields
      const shouldUpdateName = nameField.required !== nameRequired;
      const shouldUpdateEmail = emailField.required !== emailRequired;
      const shouldUpdateRole = roleField.required !== roleRequired;

      if (shouldUpdateName || shouldUpdateEmail || shouldUpdateRole) {
        setFormData((prevFormData) =>
          prevFormData?.map((section) => {
            if (section.sectionName === 'key_contacts_list') {
              return {
                ...section,
                fields: section.fields.map((field) => {
                  if (field.name === nameField.name && shouldUpdateName) {
                    return { ...field, required: nameRequired };
                  }
                  if (field.name === emailField.name && shouldUpdateEmail) {
                    return { ...field, required: emailRequired };
                  }
                  if (field.name === roleField.name && shouldUpdateRole) {
                    return { ...field, required: roleRequired };
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

  const handleRemoveKeyContactRow = (rowIndexToRemove: number) => {
    const fieldsPerRow = newContactLength ?? 8;

    setFormData((prevFormData) => {
      if (!prevFormData) return prevFormData;

      const keyContactSection = prevFormData.find(
        (section) => section.sectionName === 'key_contacts_list'
      );
      if (!keyContactSection) return prevFormData;

      const startIndex = rowIndexToRemove * fieldsPerRow;
      const newFields = [...keyContactSection.fields];

      // Remove group
      newFields.splice(startIndex, fieldsPerRow);

      // If nothing remains, clear section
      if (newFields.length === 0) {
        return prevFormData.map((section) =>
          section.sectionName === 'key_contacts_list'
            ? { ...section, fields: [] }
            : section
        );
      }

      // Re-index remaining
      const reindexedFields = newFields.map((field, idx) => {
        const newRowIndex = Math.floor(idx / fieldsPerRow);
        const baseName = field.name.replace(/_\d+$/, '');

        return {
          ...field,
          name: `${baseName}_${newRowIndex}`,
        };
      });

      return prevFormData.map((section) => {
        if (section.sectionName === 'key_contacts_list') {
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

      const newData: Record<string, FieldTypes> = {};

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

  const handleAddKeyContact = () => {
    const isFromAccount = formData?.find((item) => item.from === 'account');
    const fieldsPerRow = newContactLength ?? 8;
    // Update constructFormData with default values for the new row
    setConstructFormData((prevData) => {
      if (!prevData) return prevData;
      const newRowIndex = Math.floor(
        (formData?.find((s) => s.sectionName === 'key_contacts_list')?.fields
          .length || 0) / fieldsPerRow
      );

      const newData = { ...prevData };
      newData[`key_contact_name_${newRowIndex}`] = '';
      newData[`key_contact_role_${newRowIndex}`] = '';
      newData[`key_contact_email_${newRowIndex}`] = '';
      newData[`key_contact_rid_${newRowIndex}`] = '';
      newData[`is_primary_contact_${newRowIndex}`] = 'no';
      newData[`include_in_communication_${newRowIndex}`] = 'no';
      if (isFromAccount) {
        newData[`interaction_cc_recipient_${newRowIndex}`] = 'no';
      }
      newData[`key_contact_status_${newRowIndex}`] = 'active';
      newData[`button_${newRowIndex}`] = '';

      return newData;
    });
  };

  const getFields = (field: FormTypeFields) => {
    const isError = field.error ? 'border-red-500 bg-[#FEF2F2]' : '';
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

      if (field.dependantLabel) {
        setConstructFormData((prev) => {
          const newState = { ...prev, [field.name]: value };

          // Clear dependent field when is_consultant_firm is changed to No
          if (field.name === 'is_consultant_firm' && value === 'no') {
            newState[field.dependantLabel as string] = ''; // clear org_id
          }

          return newState;
        });
      }

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

      // Handle Include In Communications changes
      if (field.name.startsWith('include_in_communication_')) {
        const currentIndex = parseInt(field.name.split('_').pop() || '0', 10);
        const newIncludeValue = value === 'yes';
        const statusField = `key_contact_status_${currentIndex}`;
        const currentStatus = constructFormData[statusField];
        const ccRecipientField = `interaction_cc_recipient_${currentIndex}`;
        const isCCRecipient = constructFormData[ccRecipientField] === 'yes';

        // Skip validation if the contact is inactive
        if (currentStatus === 'inactive') {
          setConstructFormData(newData);
          return;
        }

        // Check if another active contact already has 'include_in_communication' set to 'yes'
        const otherIncludeExists = Object.keys(constructFormData).some(
          (key) => {
            if (
              key.startsWith('include_in_communication_') &&
              key !== field.name
            ) {
              const otherIndex = parseInt(key.split('_').pop() || '0', 10);
              const otherStatusField = `key_contact_status_${otherIndex}`;
              const otherStatus = constructFormData[otherStatusField];
              return (
                constructFormData[key] === 'yes' && otherStatus === 'active'
              );
            }
            return false;
          }
        );

        // Build confirmation based on conflicts
        if (newIncludeValue && (isCCRecipient || otherIncludeExists)) {
          let message = '';
          const updatedData = { ...constructFormData };

          if (isCCRecipient && otherIncludeExists) {
            message =
              'Only one active contact can be set as Interaction Recipient. Would you like to proceed?';
            // "This contact is already marked as 'Interaction CC Recipient', and another active contact is already marked as 'Interaction Recipient'. This contact will be marked as the only 'Interaction Recipient' and CC Recipient will be removed. Do you want to continue?";
            updatedData[ccRecipientField] = 'no';

            // Clear others' Interaction Recipient
            Object.keys(updatedData).forEach((key) => {
              if (
                key.startsWith('include_in_communication_') &&
                key !== field.name
              ) {
                const otherIndex = parseInt(key.split('_').pop() || '0', 10);
                const otherStatusField = `key_contact_status_${otherIndex}`;
                const otherStatus = constructFormData[otherStatusField];
                if (otherStatus === 'active') {
                  updatedData[key] = 'no';
                }
              }
            });
          } else if (isCCRecipient) {
            message =
              "'Interaction CC Recipient' must be 'No' when a contact is marked as 'Interaction Recipient'.";
            updatedData[ccRecipientField] = 'no';
          } else if (otherIncludeExists) {
            message =
              'Only one active contact can be set as Interaction Recipient. Would you like to proceed?';

            Object.keys(updatedData).forEach((key) => {
              if (
                key.startsWith('include_in_communication_') &&
                key !== field.name
              ) {
                const otherIndex = parseInt(key.split('_').pop() || '0', 10);
                const otherStatusField = `key_contact_status_${otherIndex}`;
                const otherStatus = constructFormData[otherStatusField];
                if (otherStatus === 'active') {
                  updatedData[key] = 'no';
                }
              }
            });
          }

          updatedData[field.name] = 'yes'; // finally mark this contact as recipient

          setConfirmationState({
            isOpen: true,
            message,
            onConfirm: () => {
              setConstructFormData(updatedData);
            },
          });
          return;
        }
      }

      // Prevent Interaction Recipient from also being Interaction CC Recipient
      if (
        field.name.startsWith('interaction_cc_recipient_') &&
        value === 'yes'
      ) {
        const currentIndex = parseInt(field.name.split('_').pop() || '0', 10);
        const interactionRecipientField = `include_in_communication_${currentIndex}`;
        const statusField = `key_contact_status_${currentIndex}`;
        const currentStatus = constructFormData[statusField];
        const isRecipient =
          constructFormData[interactionRecipientField] === 'yes';

        if (currentStatus === 'inactive') {
          setConstructFormData(newData);
          return;
        }

        if (isRecipient) {
          setConfirmationState({
            isOpen: true,
            message:
              "'Interaction CC Recipient' must be 'No' when a contact is marked as 'Interaction Recipient'.",
            onConfirm: () => {
              setConstructFormData((prev) => ({
                ...prev,
                [field.name]: 'no',
              }));
            },
            confirmLabel: 'Okay',
          });
          return; // Prevent changing to 'yes'
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
                    }
                  }
                });

                newData[isPrimaryField] = 'yes';

                setFormData((prevFormData) =>
                  prevFormData?.map((section) => ({
                    ...section,
                    fields: section.fields.map((f) => {
                      if (f.name === isPrimaryField)
                        return { ...f, value: 'yes' };
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
                    }
                  }
                });

                setConstructFormData(newData);
              },
            });
            return;
          }
        }
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
        const commFieldName = `include_in_communication_${currentIndex}`;
        const currentCommValue = constructFormData[commFieldName] === 'yes';
        const ccField = `interaction_cc_recipient_${currentIndex}`;
        const currentCCValue = constructFormData[ccField] === 'yes';

        if (previousStatus === 'inactive' && newStatus === 'active') {
          newData[statusField] = 'active';

          const primaryConflict =
            isPrimary &&
            currentRole &&
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

          const commConflict =
            currentCommValue &&
            Object.keys(constructFormData).some((key) => {
              if (
                key.startsWith('include_in_communication_') &&
                key !== commFieldName
              ) {
                const otherIndex = parseInt(key.split('_').pop() || '0', 10);
                const otherStatusField = `key_contact_status_${otherIndex}`;
                return (
                  constructFormData[key] === 'yes' &&
                  constructFormData[otherStatusField] === 'active'
                );
              }
              return false;
            });

          const ccConflict = currentCommValue && currentCCValue;

          // Build final message
          let combinedMessage = '';
          if (primaryConflict && commConflict && ccConflict) {
            combinedMessage =
              "This contact is marked as both 'Interaction Recipient' and 'Interaction CC Recipient', and also a Primary Contact with the same role exists. Only one of each is allowed. 'Interaction CC Recipient' will be reset to 'No'. Do you want to proceed?";
          } else if (ccConflict) {
            combinedMessage =
              "'Interaction CC Recipient' must be 'No' when a contact is marked as 'Interaction Recipient'.";
          } else if (primaryConflict && commConflict) {
            combinedMessage =
              'A Primary Contact with the same role and an active Interaction Recipient already exists. Would you like to proceed?';
          } else if (primaryConflict) {
            combinedMessage =
              'Primary Contact with the same role already exists. Would you like to proceed?';
          } else if (commConflict) {
            combinedMessage =
              'Only one active contact can be set as Interaction Recipient. Would you like to proceed?';
          }

          if (primaryConflict || commConflict || ccConflict) {
            setConfirmationState({
              isOpen: true,
              message: combinedMessage,
              onConfirm: () => {
                // Reset CC Recipient if there's a CC conflict
                if (ccConflict) {
                  newData[ccField] = 'no';
                }

                // Resolve primary contact conflict
                if (primaryConflict) {
                  Object.keys(newData).forEach((key) => {
                    if (
                      key.startsWith('is_primary_contact_') &&
                      key !== isPrimaryField &&
                      constructFormData[key] === 'yes'
                    ) {
                      const otherIndex = parseInt(
                        key.split('_').pop() || '0',
                        10
                      );
                      const otherRoleKey = `key_contact_role_${otherIndex}`;
                      const otherStatusKey = `key_contact_status_${otherIndex}`;
                      if (
                        constructFormData[otherRoleKey] === currentRole &&
                        constructFormData[otherStatusKey] === 'active'
                      ) {
                        newData[key] = 'no';
                      }
                    }
                  });
                }

                // Resolve interaction recipient conflict
                if (commConflict) {
                  Object.keys(newData).forEach((key) => {
                    if (
                      key.startsWith('include_in_communication_') &&
                      key !== commFieldName
                    ) {
                      const otherIndex = parseInt(
                        key.split('_').pop() || '0',
                        10
                      );
                      const otherStatusField = `key_contact_status_${otherIndex}`;
                      if (constructFormData[otherStatusField] === 'active') {
                        newData[key] = 'no';
                      }
                    }
                  });
                }

                // Set the current contact as active + selected values
                newData[statusField] = 'active';
                if (isPrimary) newData[isPrimaryField] = 'yes';
                if (currentCommValue) newData[commFieldName] = 'yes';

                setConstructFormData(newData);
              },
            });
            return;
          }

          // No conflicts — just update
          setConstructFormData(newData);
        } else {
          newData[statusField] = newStatus;
          setConstructFormData(newData);
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
            // Handle name/email error clearing when Include In Communications is No
            if (
              field.name.startsWith('key_contact_name_') ||
              field.name.startsWith('key_contact_email_')
            ) {
              const currentIndex = parseInt(
                field.name.split('_').pop() || '0',
                10
              );
              const includeInCommField = `include_in_communication_${currentIndex}`;
              const includeInCommValue =
                constructFormData[includeInCommField] === 'yes';

              if (!includeInCommValue) {
                const nameField = `key_contact_name_${currentIndex}`;
                const emailField = `key_contact_email_${currentIndex}`;

                // If either name or email is being changed and has a value, clear errors for both
                if (
                  (field.name === nameField && value) ||
                  (field.name === emailField && value)
                ) {
                  if (f.name === nameField || f.name === emailField) {
                    updatedField.error = '';
                  }
                }
              }
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
        setFormData((prevFormData) => {
          return prevFormData?.map((section) => ({
            ...section,
            fields: section.fields.map((f) => {
              const updatedField = { ...f };

              // clear error message when change field
              if (f.name === field.name) {
                updatedField.error = '';
              }

              return updatedField;
            }),
          }));
        });
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
          <div className='w-full flex items-center justify-between gap-2'>
            <input
              id='upload-logo'
              type={field.type}
              name={field.name}
              autoComplete='off'
              className='hidden'
              disabled={field.disabled}
              onChange={handleFileChange}
            />

            <div className='flex items-center  justify-between w-[74%] sm:text-sm px-3 h-[32px] border border-[#CBD6E2] rounded-xs overflow-hidden'>
              <span
                className={`${logo && logo.name ? 'text-[#000000]' : 'text-[#7D98B6]'} truncate`}
              >
                {logo ? logo.name : 'No file selected'}
              </span>
              {logo && (
                <CloseIcon
                  alt='close-icon'
                  className='w-2.5 h-2.5 ml-2 cursor-pointer hover:brightness-90'
                  onClick={() => {
                    const fileInput = document.getElementById(
                      'upload-logo'
                    ) as HTMLInputElement;
                    if (fileInput) fileInput.value = '';

                    if (field.name === 'logo') {
                      onChange?.({ fieldName: 'logo', fieldValue: null });
                    }
                  }}
                />
              )}
            </div>

            <TextButton
              label='Browse'
              sx={{
                height: '32px !important',
                minWidth: '26%',
                maxWidth: '26%',
                fontSize: '13px',
                fontWeight: '400',
              }}
              disabled={field.disabled}
              onClick={() => {
                const logoFileInput = document.getElementById(
                  'upload-logo'
                ) as HTMLInputElement;
                logoFileInput?.click();
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
        if (field.isFiscalYear) {
          return (
            <div className='w-full'>
              <FiscalYearDropdown
                fiscalYear={String(fieldValue)}
                fiscalYearsDropDown={field.options || []}
                onChange={(e) => handleChange(e.target.value)}
              />
            </div>
          );
        }

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
              {field.placeholder && (
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
              )}
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
            {/* <SearchBlackIcon // It may use in future, based on client confirmation
              alt='search'
              className='absolute top-1/2 right-3 -translate-y-1/2 z-10'
            /> */}
            <Autocomplete
              options={field.options || []}
              disableClearable
              popupIcon={<ArrowDropDownIcon />}
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
              size='small'
              sx={{
                height: '32px',
                fontSize: '13px',
                '&.MuiAutocomplete-root .MuiOutlinedInput-root': {
                  height: '32px',
                },
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
                '& svg': {
                  color: '#7D98B6',
                },
              }}
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
        const startDateValue: FieldTypes | undefined = keyStart
          ? constructFormData[keyStart]
          : undefined;
        const today: Dayjs = dayjs();
        const isEndDateField = field.name === keyEnd;
        const parsedStartDate = startDateValue
          ? dayjs(startDateValue as string, 'YYYY-MM-DD')
          : undefined;

        const customMinDate: Dayjs | undefined = (() => {
          if (isEndDateField && parsedStartDate) {
            return parsedStartDate.add(1, 'day');
          }
          return field?.minDate ? dayjs(field.minDate) : undefined;
        })();

        const customMaxDate: Dayjs | undefined = (() => {
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
                  <CalendarIcon alt='calendar' className='w-4 h-4' />
                ),
                clearIcon: () => (
                  <CloseIcon alt='calendar' className='w-2.5 h-2.5' />
                ),
              }}
              slotProps={{
                field: { clearable: !field.disabled },
                clearButton: {
                  tabIndex: -1, // disable tab focus for clear button
                },
                openPickerButton: {
                  tabIndex: -1, // prevent focus on calendar icon
                },
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
              value={dayjs(fieldValue, 'MM/DD')}
              disabled={field.disabled}
              format='MM/DD'
              views={['month', 'day']}
              open={false}
              onChange={(newValue) => {
                handleChange(dayjs(newValue).format('MM/DD'));
              }}
              slots={{
                clearIcon: () => (
                  <CloseIcon alt='calendar' className='w-2.5 h-2.5' />
                ),
              }}
              slotProps={{
                field: { clearable: !field.disabled },
                clearButton: {
                  tabIndex: -1, // disable tab focus for clear button
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
            value={fieldValue}
            onChange={(phone, country: CountryData) =>
              handleChange(phone, country.countryCode)
            }
            inputClass={`!outline-none placeholder:text-[13px] placeholder:color[#425A76] placeholder:font-medium !w-full !text-[13px] !p-2 !pl-12 !h-[32px] !rounded-xs ${field.error ? '!border-red-500' : ''}${field.disabled ? ' !bg-gray-100' : ''}`}
            buttonClass={`!bg-transparent !border-r ${field.error ? '!border-red-500' : '!border-gray-300'} !rounded-tl-xs !rounded-bl-xs !hover:bg-transparent !shadow-none !px-0 !m-0`}
            containerClass='!w-full focus-within:outline-none focus-within:!border-1 focus-within:!border-blue-400 !rounded-xs'
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
            className='flex items-center cursor-pointer gap-1 bg-[#EAF0F5] h-[30px] rounded-[2px] color-[#2D3E4F] px-2 text-[12px] font-semibold disabled:cursor-default'
            type='button'
            disabled={field.disabled}
            onClick={(e) => {
              e.stopPropagation();
              field.onClick?.(e);
              handleAddKeyContact();
            }}
          >
            <span>
              <KeyContactAddIcon alt='add-btn' className='w-5 h-5' />
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
            const allowedMimeTypes = [
              'image/png',
              'image/svg+xml',
              'image/jpeg',
            ];
            const allowedExtensions = ['.png', '.svg', '.jpg'];
            const maxFileSize = 1 * 1024 * 1024; // 1 MB

            const fileName = logo.name.toLowerCase();
            const fileExtension = fileName.substring(fileName.lastIndexOf('.'));

            const isExtensionValid = allowedExtensions.includes(fileExtension);
            const isMimeTypeValid = allowedMimeTypes.includes(logo.type);

            // Reject if MIME type is not valid or if the extension is not exactly .jpg
            if (
              !isMimeTypeValid ||
              !isExtensionValid ||
              fileExtension === '.jpeg'
            ) {
              hasError = true;
              return {
                ...field,
                error: 'Only PNG, SVG, and JPG  files are allowed.',
              };
            }

            if (logo.size >= maxFileSize) {
              hasError = true;
              return {
                ...field,
                error: 'File size must be less than 1 MB.',
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
            if (!isValidDate(dateValue, 'MM/DD')) {
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
                const fiscalYearStart = field.minDate
                  ? dayjs(field.minDate, 'YYYY-MM-DD').startOf('day')
                  : dayjs(`${selectedFiscalYear}-01-01`, 'YYYY-MM-DD').startOf(
                      'day'
                    );

                const fiscalYearEnd = field.maxDate
                  ? dayjs(field.maxDate, 'YYYY-MM-DD').endOf('day')
                  : dayjs(`${selectedFiscalYear}-12-31`, 'YYYY-MM-DD').endOf(
                      'day'
                    );

                if (dateValue) {
                  const currentDate = dayjs(dateValue, 'YYYY-MM-DD');
                  const startDateValue = constructFormData[
                    'financial_start_date'
                  ] as string;

                  // Check against fiscal year bounds
                  if (
                    currentDate.isBefore(fiscalYearStart, 'day') ||
                    currentDate.isAfter(fiscalYearEnd, 'day')
                  ) {
                    hasError = true;
                    return {
                      ...field,
                      error: `${field.name === 'financial_start_date' ? 'Effective' : 'End'} date must be within the selected fiscal year (${selectedFiscalYear})`,
                    };
                  }

                  if (
                    field.minDate &&
                    currentDate.isBefore(dayjs(field.minDate), 'day') &&
                    startDateValue
                  ) {
                    hasError = true;
                    return {
                      ...field,
                      error: `Effective date cannot be before ${dayjs(field.minDate).format('YYYY-MM-DD')}`,
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
                      error: `${field.name === 'financial_start_date' ? 'Effective' : 'End'} date cannot be after ${dayjs(field.maxDate).format('YYYY-MM-DD')}`,
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
                      error: 'End date cannot be the same as Effective date',
                    };
                  }

                  if (endDate.isBefore(startDate, 'day')) {
                    hasError = true;
                    return {
                      ...field,
                      error: 'End date must be after Effective date',
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
                    error: 'Both Effective date and end date must be provided',
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
            // Handle project resource and task dates validation
            if (field.name === 'start_date' || field.name === 'end_date') {
              const startDate = constructFormData['start_date'] as string;
              const endDate = constructFormData['end_date'] as string;
              if (dateValue) {
                const currentDate = dayjs(dateValue, 'YYYY-MM-DD');

                if (
                  field.minDate &&
                  currentDate.isBefore(dayjs(field.minDate), 'day') &&
                  startDate
                ) {
                  hasError = true;
                  return {
                    ...field,
                    error: `Effective date cannot be before ${dayjs(field.minDate).format('YYYY-MM-DD')}`,
                  };
                }

                if (
                  field.maxDate &&
                  currentDate.isAfter(dayjs(field.maxDate), 'day')
                ) {
                  hasError = true;
                  return {
                    ...field,
                    error: `${field.name === 'start_date' ? 'Effective' : 'End'} date cannot be after ${dayjs(field.maxDate).format('YYYY-MM-DD')}`,
                  };
                }
              }

              if ((startDate && !endDate) || (!startDate && endDate)) {
                hasError = true;
                return {
                  ...field,
                  error: 'Both Effective From and End Date must be be provided',
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
                      field.name === 'start_date'
                        ? 'Effective From cannot be the same as End Date'
                        : 'End Date cannot be the same as Effective From',
                  };
                }

                if (start.isAfter(end, 'day')) {
                  hasError = true;
                  return {
                    ...field,
                    error:
                      field.name === 'start_date'
                        ? 'Effective From cannot be after End Date'
                        : 'End Date cannot be before Effective From',
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
    const newContactColumn = newContactLength ? 8 : 7;
    const visibleFields = section.fields.filter(
      (field) => !field.name.startsWith('key_contact_rid_')
    );
    const hasFields = visibleFields.length > 0;
    // const headerFields = visibleFields.slice(0, 7);
    const headerFields = keyContactHeaders.slice(0, newContactColumn);
    const fieldRows = chunkFields(visibleFields, newContactColumn);
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
            {hasFields ? (
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
                {fieldRows.map((row, rowIndex) => {
                  const shouldHighlight = row.some(
                    (field) =>
                      field.name.startsWith('key_contact_name_') &&
                      constructFormData[field.name] === highlight?.field
                  );
                  return (
                    <TableRow
                      key={rowIndex}
                      className={
                        shouldHighlight
                          ? 'animate-[fade-bg-white_3s_forwards]'
                          : ''
                      }
                    >
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
                                backgroundColor: field?.disabled
                                  ? '#f3f4f6 !important'
                                  : 'inherit',
                                '&:focus': {
                                  border: field.error
                                    ? '1px solid #fb2c36'
                                    : '1px solid #60A5FA',
                                },
                              },
                              '& .MuiOutlinedInput-notchedOutline': {
                                border: field.error
                                  ? '1px solid #ef4444'
                                  : 'none !important',
                              },
                              '&:hover .MuiOutlinedInput-notchedOutline': {
                                border: field.error
                                  ? '1px solid #ef4444'
                                  : 'none !important',
                              },
                              '& .MuiOutlinedInput-root': {
                                '&.Mui-focused .MuiOutlinedInput-notchedOutline':
                                  {
                                    border: '1px solid #60A5FA !important',
                                  },
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
                                disableHoverListener={field.disabled}
                                arrow
                                placement='top'
                              >
                                <button
                                  type='button'
                                  disabled={field.disabled}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    field.onClick?.(e);
                                    handleRemoveKeyContactRow(rowIndex);
                                  }}
                                  style={{
                                    cursor: field.disabled
                                      ? 'default'
                                      : 'pointer',
                                    background: 'transparent',
                                    border: 'none',
                                    padding: 0,
                                    marginTop: '6px',
                                  }}
                                  aria-label='Remove contact'
                                >
                                  {field.iconUrl ? (
                                    <field.iconUrl
                                      alt='Icon'
                                      style={{ width: 20, height: 20 }}
                                    />
                                  ) : (
                                    <KeyContactRemoveIcon
                                      alt='Remove'
                                      style={{ width: 20, height: 20 }}
                                    />
                                  )}
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
                                      <ErrorInfoIcon
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
                  );
                })}
              </TableBody>
            ) : (
              <TableBody>
                <TableRow>
                  <TableCell
                    colSpan={8}
                    align='center'
                    sx={{ height: '32px', padding: '0px', color: '#7d98b6' }}
                  >
                    No key contacts added
                  </TableCell>
                </TableRow>
              </TableBody>
            )}
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
                      <VerticalSeparatorIcon alt-='separtor' />
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
                  className={`${i === 0 ? 'border-b' : 'border'} ${highlight?.section === section.sectionName ? 'animate-[fade-bg_3s_forwards]' : ''} capitalize h-[30px] border-box border-[#CBD6E2] font-bold text-[14px] text-[#2D3E4F] leading-[21px] tracking-[0%] align-middle py-1 ${admin ? 'bg-[#FCFCFC]' : 'bg-[#ECECEC]'}  ${layout === Layout.TYPE_1 ? 'px-10' : 'px-4'}`}
                >
                  {section.sectionName.replace(/_/g, ' ')}
                </h4>
              )}
              <>
                {!section.sectionName
                  ? loadSectionsWithoutTitle(section)
                  : section.sectionName === 'key_contacts_list'
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
        confirmLabel={confirmationState.confirmLabel}
      />
    </>
  );
};
