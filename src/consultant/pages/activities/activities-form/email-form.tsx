import React from 'react';
import { useRef, useState, useCallback, useMemo, useEffect } from 'react';
import { CloseIcon, DocumentIcon, DraftEmailIcon } from '../../../../assets';
import SingleSkeleton from '../../../../components/skeleton-component/singleskeleton';
import TextButton from '../../../../components/button/text-button';
import SkeletonForm from '../../../../components/form-builder/skeleton-form';
import ReactQuill, { Quill } from 'react-quill';
import {
  useCreateActivityEmail,
  useEmailActivityDetails,
  useGetEmailTemplateItems,
  useUpdateActivityEmail,
} from '../../../services/activities/activities-service';
import { useParams, useSearchParams } from 'react-router-dom';
import { useToast } from '../../../../hooks';
import {
  ActivityEmailFormData,
  ActivityEmailFormErrors,
  getAutocompleteStyles,
  normalizeQuillValue,
  shouldDisableField,
  shouldHideField,
  validateActivityEmailForm,
} from './helper';
import { useGetUserOptions, UserOption } from '../../../services/case-team';
import { EmailRecipients } from '../../../../components';
import {
  formatDateToYYYYMMDDWithTime,
  REGEX_PATTERNS,
} from '../../../../common-utils';
import {
  getPermissionMap,
  parseToStringArray,
} from '../activities-list/helper';
import { useEmailTemplateDetails } from '../../../../admin/service/email-template/email-template-service';
import { Autocomplete, Skeleton, TextField } from '@mui/material';
import { ArrowDropDownIcon } from '@mui/x-date-pickers';
import ConfirmationPopup from '../../../../common-utils/confirmation-popup';
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

enum FlagTypeEnum {
  draft = 'Draft',
  send = 'Sent',
}

const icons = Quill.import('ui/icons');

icons['attachment'] = `
  <svg 
    class="ql-stroke" 
    width="16" 
    height="16" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    stroke-width="1.5" 
    stroke-linecap="round" 
    stroke-linejoin="round"
  >
    <path d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
  </svg>
`;

interface EmailFormProps {
  isFrom?: string;
  onCloseModal?: () => void;
  sourceDetails?: ActivitySourceDetails;
}

const EmailForm: React.FC<EmailFormProps> = ({
  isFrom,
  onCloseModal,
  sourceDetails,
}) => {
  const { activityId } = useParams();
  const [searchParams] = useSearchParams();
  const { successToast } = useToast();
  const [formData, setFormData] = useState<ActivityEmailFormData>({
    to: [],
    subject: '',
    emailBody: '',
    attachments: [],
    cc: [],
    rid: '',
    email_rid: '',
    created_on: '',
    created_by: '',
    updated_on: '',
    updated_by: '',
    email_template_rid: '',
  });
  const [activeFlag, setActiveFlag] = useState<FlagTypeEnum | null>(null);
  const [errors, setErrors] = useState<ActivityEmailFormErrors>({});
  const [toInput, setToInput] = useState<string>('');
  const [ccInput, setCcInput] = useState<string>('');

  const isEditView = location.pathname.split('/').includes('edit');
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

  const [toSuggestions, setToSuggestions] = useState<SuggestionState>({
    suggestions: [],
    highlightedIndex: 0,
    anchorEl: null,
  });
  const [ccSuggestions, setCcSuggestions] = useState<SuggestionState>({
    suggestions: [],
    highlightedIndex: 0,
    anchorEl: null,
  });

  const [currentTemplate, setCurrentTemplate] = useState<{
    label: string;
    value: string;
  }>({
    label: 'Choose Template',
    value: '',
  });
  const [confirmationState, setConfirmationState] = useState<{
    isOpen: boolean;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
  }>({
    isOpen: false,
    message: '',
    onConfirm: () => {},
    onCancel: () => {},
  });

  // Permission
  const { permission } = useSelector((state: RootState) => state.permission);
  const permissionMap = useMemo(
    () => getPermissionMap(permission, AllPermissions.ACTIVITY_EMAIL_VIEW_EDIT),
    [permission]
  );

  // Refs
  const quillRef = useRef<ReactQuill>(null);
  const quillContainerRef = useRef<HTMLDivElement>(null);

  const userListOptions = useGetUserOptions(accountId, true);
  const createEmail = useCreateActivityEmail();
  const updateEmail = useUpdateActivityEmail();
  const { data: emailData, isLoading } = useEmailActivityDetails(
    accountId,
    activityId || '',
    true
  );

  // Email templates
  const emailTemplates = useGetEmailTemplateItems();

  const { data: templateDetails, isLoading: templateLoading } =
    useEmailTemplateDetails(currentTemplate.value);

  const isEmailConfigured = sourceDetails?.isEmailConfigured
    ? sourceDetails?.isEmailConfigured
    : searchParams.get('isEmailConfigured') === 'true' ||
      emailData?.is_email_configured;

  const userOptions = useMemo(() => {
    return (
      userListOptions?.data?.map((item) => ({
        rid: item.rid,
        name: item?.name,
        email: item?.email,
      })) || []
    );
  }, [userListOptions]);

  const templateOptions = useMemo(
    () =>
      emailTemplates.data?.data?.emailTemplates?.map((template) => ({
        label: template.template_name,
        value: template.rid,
      })) || [],
    [emailTemplates.data?.data]
  );

  useEffect(() => {
    if (emailData && isEditView) {
      setFormData((prev) => ({
        ...prev,
        to: parseToStringArray(emailData.to_email) || [],
        cc: parseToStringArray(emailData.cc_emails) || [],
        subject: emailData.subject || '',
        emailBody: emailData.body_html || '',
        created_on: formatDateToYYYYMMDDWithTime(
          emailData.created_datetime || ''
        ),
        created_by: emailData.created_by || '',
        updated_on: formatDateToYYYYMMDDWithTime(
          emailData.modified_datetime || ''
        ),
        updated_by: emailData.modified_by || '',
        rid: emailData.activity_rid || '',
        email_rid: emailData.activity_rid || '',
        attachments:
          emailData.attachments?.map((att) => ({
            id: att.rid,
            file: null,
            name: `${att.document_name}${att.format}`,
            size: att.size ? `${att.size} MB` : '-',
            url: att.browse_file,
            existing: true,
          })) || [],
      }));
    }
  }, [emailData, isEditView]);

  // Handle template selection and populate form
  useEffect(() => {
    if (templateDetails && currentTemplate.value && !isEditView) {
      setFormData((prev) => ({
        ...prev,
        subject: templateDetails.subject,
        emailBody: templateDetails.body_html,
        email_template_rid: currentTemplate.value,
      }));
    }
  }, [templateDetails, currentTemplate.value, isEditView]);

  const isValidEmail = useCallback((email: string): boolean => {
    const emailRegex = REGEX_PATTERNS.EMAIL;
    return emailRegex.test(email.trim());
  }, []);

  const filterSuggestions = useCallback(
    (searchText: string, currentField: 'to' | 'cc' | 'bcc'): UserOption[] => {
      if (!searchText.trim()) return [];

      const lowerSearch = searchText.toLowerCase();

      // Get emails that are already in the current field (to prevent duplicates within same field)
      const currentFieldEmails = formData[currentField] || [];

      const filtered = userOptions.filter(
        (user) =>
          (user.name.toLowerCase().includes(lowerSearch) ||
            user.email.toLowerCase().includes(lowerSearch)) &&
          !currentFieldEmails.includes(user.email) // Only filter duplicates within same field
      );

      // Add typed email as option if valid
      const typedEmail = searchText.trim();
      if (
        isValidEmail(typedEmail) &&
        !filtered.some((s) => s.email === typedEmail) &&
        !currentFieldEmails.includes(typedEmail)
      ) {
        filtered.push({
          rid: 'typed',
          name: typedEmail,
          email: typedEmail,
        });
      }

      return filtered;
    },
    [userOptions, formData, isValidEmail]
  );

  // Generic input change handler for all recipient fields
  const handleRecipientInputChange = useCallback(
    (
      field: 'to' | 'cc' | 'bcc',
      value: string,
      setInput: React.Dispatch<React.SetStateAction<string>>,
      setSuggestions: React.Dispatch<React.SetStateAction<SuggestionState>>
    ) => {
      setInput(value);

      // If only '@' → show full list
      if (value === '@') {
        setSuggestions((prev) => ({
          ...prev,
          suggestions: userOptions.filter(
            (user) => !formData[field]?.includes(user.email)
          ),
          highlightedIndex: 0,
          anchorEl: document.getElementById(`${field}-input`), // Use ID to target input
        }));
        return;
      }

      // If value starts with '@' but has more characters
      if (value.startsWith('@')) {
        const query = value.substring(1); // Remove '@'
        const suggestions = filterSuggestions(query, field);
        setSuggestions((prev) => ({
          ...prev,
          suggestions,
          highlightedIndex: 0,
          anchorEl:
            suggestions.length > 0
              ? document.getElementById(`${field}-input`)
              : null,
        }));
        return;
      }

      // Normal behavior
      if (value.trim()) {
        const suggestions = filterSuggestions(value, field);
        setSuggestions((prev) => ({
          ...prev,
          suggestions,
          highlightedIndex: 0,
          anchorEl:
            suggestions.length > 0
              ? document.getElementById(`${field}-input`)
              : null,
        }));
      } else {
        setSuggestions((prev) => ({
          ...prev,
          suggestions: [],
          highlightedIndex: 0,
          anchorEl: null,
        }));
      }
    },
    [filterSuggestions, userOptions, formData]
  );

  // Wrapper functions for each field
  const handleToInputChange = useCallback(
    (value: string) => {
      handleRecipientInputChange('to', value, setToInput, setToSuggestions);
    },
    [handleRecipientInputChange]
  );

  const handleCcInputChange = useCallback(
    (value: string) => {
      handleRecipientInputChange('cc', value, setCcInput, setCcSuggestions);
    },
    [handleRecipientInputChange]
  );

  // Handle input changes
  const handleInputChange = (
    field: keyof ActivityEmailFormData,
    value: string | string[]
  ) => {
    if (field === 'emailBody') {
      value = normalizeQuillValue(value as string);
    }

    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  // Handle Quill editor changes
  const handleEmailBodyChange = (value: string) => {
    setFormData((prev) => ({ ...prev, emailBody: value }));
    setErrors((prev) => ({ ...prev, emailBody: '' }));
  };

  // Handle subject field changes
  const handleSubjectChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    handleInputChange('subject', value);
  };

  const addEmailToField = useCallback(
    (field: 'to' | 'cc' | 'bcc', email: string) => {
      if (!email.trim() || !isValidEmail(email)) {
        return;
      }

      const cleanEmail = email.trim();

      // Allow duplicates across TO, CC, and BCC (like Outlook/Gmail), but prevent within same field
      if (formData[field]?.includes(cleanEmail)) {
        return; // Prevent duplicate within same field
      }

      setFormData((prev) => ({
        ...prev,
        [field]: [...(prev[field] || []), cleanEmail],
      }));

      // Clear input and close menu
      switch (field) {
        case 'to':
          setToInput('');
          setToSuggestions((prev) => ({ ...prev, anchorEl: null }));
          break;
        case 'cc':
          setCcInput('');
          setCcSuggestions((prev) => ({ ...prev, anchorEl: null }));
          break;
      }

      setErrors((prev) => ({ ...prev, [field]: '' }));
    },
    [isValidEmail, formData]
  );

  const removeRecipient = useCallback(
    (field: 'to' | 'cc' | 'bcc', index: number) => {
      setFormData((prev) => ({
        ...prev,
        [field]: (prev[field] || []).filter((_, i) => i !== index),
      }));
    },
    []
  );

  // Generic key down handler for all recipient fields
  const handleRecipientKeyDown = useCallback(
    (
      e: React.KeyboardEvent<HTMLInputElement>,
      field: 'to' | 'cc' | 'bcc',
      inputValue: string,
      suggestions: SuggestionState,
      setSuggestions: React.Dispatch<React.SetStateAction<SuggestionState>>
    ) => {
      if (
        e.key === 'Backspace' &&
        inputValue.trim() === '' &&
        (formData[field] ?? []).length > 0
      ) {
        e.preventDefault();
        const list = formData[field] ?? [];
        removeRecipient(field, list.length - 1);
        return;
      }

      if (!suggestions.anchorEl) {
        if ((e.key === 'Enter' || e.key === 'Tab') && inputValue.trim()) {
          e.preventDefault();
          if (
            isValidEmail(inputValue) &&
            !formData[field]?.includes(inputValue.trim())
          ) {
            addEmailToField(field, inputValue.trim());
          }
        }
        return;
      }

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSuggestions((prev) => ({
            ...prev,
            highlightedIndex: Math.min(
              prev.highlightedIndex + 1,
              prev.suggestions.length - 1
            ),
          }));
          break;

        case 'ArrowUp':
          e.preventDefault();
          setSuggestions((prev) => ({
            ...prev,
            highlightedIndex: Math.max(prev.highlightedIndex - 1, 0),
          }));
          break;

        case 'Enter':
        case 'Tab':
          e.preventDefault();
          if (suggestions.suggestions[suggestions.highlightedIndex]) {
            const selectedSuggestion =
              suggestions.suggestions[suggestions.highlightedIndex];
            addEmailToField(field, selectedSuggestion.email);
          }
          break;

        case 'Escape':
          e.preventDefault();
          setSuggestions((prev) => ({ ...prev, anchorEl: null }));
          break;
      }
    },
    [formData, removeRecipient, isValidEmail, addEmailToField]
  );

  // Wrapper functions for each field
  const handleToKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      handleRecipientKeyDown(e, 'to', toInput, toSuggestions, setToSuggestions);
    },
    [handleRecipientKeyDown, toInput, toSuggestions]
  );

  const handleCcKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      handleRecipientKeyDown(e, 'cc', ccInput, ccSuggestions, setCcSuggestions);
    },
    [handleRecipientKeyDown, ccInput, ccSuggestions]
  );

  // Attachment handler
  const handleAttachment = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '*/*';
    input.multiple = true;
    input.click();

    input.onchange = () => {
      const files = Array.from(input.files || []);
      if (files.length > 0) {
        const newAttachments = files.map((file) => ({
          id: Date.now() + Math.random().toString(36),
          file,
          name: file.name,
          size: (file.size / 1024).toFixed(1) + ' KB',
        }));
        setFormData((prev) => ({
          ...prev,
          attachments: [...prev.attachments, ...newAttachments],
        }));
      }
    };
  }, []);

  // Remove attachment
  const removeAttachment = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      attachments: prev.attachments.filter((att) => att.id !== id),
    }));
  };

  const validateForm = (): boolean => {
    const { isValid, errors: validationErrors } =
      validateActivityEmailForm(formData, toInput, ccInput);
    setErrors(validationErrors);
    return isValid;
  };

  const goBack = () => {
    if (isFrom === 'modal') {
      onCloseModal?.();
    } else {
      window.history.back();
    }
  };

  const modules = {
    toolbar: {
      container: [
        [{ header: [1, 2, 3, 4, 5, 6, false] }],
        [{ font: [] }],
        [{ size: [] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ color: [] }, { background: [] }],
        [{ script: 'sub' }, { script: 'super' }],
        ['blockquote', 'code-block'],
        [{ list: 'ordered' }, { list: 'bullet' }],
        [{ indent: '-1' }, { indent: '+1' }],
        [{ direction: 'rtl' }],
        [{ align: [] }],
        ['link', 'image', 'video'],
        ['attachment'],
        ['clean'],
      ],
      handlers: { attachment: handleAttachment },
    },
  };

  const handleSubmit = (flag: FlagTypeEnum) => {
    if (!validateForm()) {
      return;
    }
    setActiveFlag(flag);
    // Prepare FormData for API
    const formDataToSend = new FormData();

    // Simple direct computation
    let deletedFileIds: string[] = [];
    if (isEditView && emailData?.attachments) {
      const currentExistingIds = formData.attachments
        .filter((att) => att.existing)
        .map((att) => att.id);

      deletedFileIds = emailData.attachments
        .map((att) => att.rid)
        .filter((rid) => !currentExistingIds.includes(rid));
    }

    // Append basic fields
    formDataToSend.append('account_rid', accountId);
    formDataToSend.append('attach_to', entityId);
    formDataToSend.append('attachment_level', entityLevel);
    formDataToSend.append('activity_type', 'email');
    formDataToSend.append('to_email', JSON.stringify(formData.to));
    formDataToSend.append('cc_email', JSON.stringify(formData.cc));
    formDataToSend.append('subject', formData.subject);
    formDataToSend.append('body_html', formData.emailBody);
    formDataToSend.append('email_status', flag);

    // Append attachments
    formData.attachments.forEach((attachment) => {
      if (attachment.file) {
        formDataToSend.append('files', attachment.file);
      }
    });

    if (deletedFileIds.length > 0) {
      formDataToSend.append('deleted_file_ids', JSON.stringify(deletedFileIds));
    }

    if (isEditView && emailData) {
      formDataToSend.append('activity_rid', emailData.activity_rid || '');

      updateEmail.mutate(formDataToSend, {
        onSuccess: async () => {
          setActiveFlag(null);
          const message =
            flag === FlagTypeEnum.draft
              ? 'Email draft has been updated successfully.'
              : 'Email has been sent successfully.';

          successToast(message);
          goBack();
        },
        onError: () => {
          setActiveFlag(null);
        },
      });
    } else {
      createEmail.mutate(formDataToSend, {
        onSuccess: async () => {
          setActiveFlag(null);
          const message =
            flag === FlagTypeEnum.draft
              ? 'Email draft has been saved successfully.'
              : 'Email has been sent successfully.';

          successToast(message);
          goBack();
        },
        onError: () => {
          setActiveFlag(null);
        },
      });
    }
  };

  const formLoading = isLoading || userListOptions.isLoading;
  const emailBodyDisabled = shouldDisableField(
    'body_html',
    isEditView,
    permissionMap
  );

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
    <div className={`${templateLoading ? 'pointer-events-none' : ''}`}>
      <div
        className={`h-[50px] flex items-center justify-between ${isFrom === 'modal' ? 'px-6 rounded-t-2xl' : 'px-10'} sticky top-0 z-10 bg-white border-b border-[#CBD6E2]`}
      >
        <div className='flex items-center w-[80%] max-w-[80%]'>
          <DraftEmailIcon
            alt='email-icon'
            className='w-7 h-7 p-1.5 [&>path]:stroke-white bg-[#FF73C3] rounded-[2px]'
          />
          <div className='w-[90%]'>
            {isLoading ? (
              <div className='ml-2'>
                <SingleSkeleton width={150} height={12} />
              </div>
            ) : (
              <div className='font-semibold text-[12px] leading-[20px] ml-2 mb-[-6px] text-[#7D98B6]'>
                {sourcePath
                  ? `${sourcePath}${isEditView ? ` > ${emailData?.r_number}` : ''}`
                  : `Email ${isEditView ? `> ${emailData?.r_number}` : ''}`}
              </div>
            )}
            <h5 className='text-[16px] font-bold ml-2 text-[#2D3E4F]'>
              {isEditView ? 'Edit Email' : 'Create Email'}
            </h5>
          </div>
        </div>
        <div className='flex gap-3'>
          {!isEditView &&
            (emailTemplates?.isLoading ? (
              <Skeleton
                variant='rounded'
                width='160px'
                height={25}
                sx={{ borderRadius: '2px' }}
              />
            ) : (
              <Autocomplete
                disableClearable
                forcePopupIcon
                popupIcon={<ArrowDropDownIcon />}
                slotProps={{
                  paper: { style: { fontSize: '12px' } },
                  popupIndicator: {
                    disableRipple: true,
                    disableFocusRipple: true,
                    sx: {
                      transition: 'transform 0.25s ease-in-out',
                      backgroundColor: 'transparent !important',
                      '&:hover': {
                        backgroundColor: 'transparent !important',
                      },
                      '&.MuiAutocomplete-popupIndicatorOpen': {
                        transform: 'rotate(180deg)',
                      },
                    },
                  },
                }}
                options={templateOptions}
                size='small'
                sx={getAutocompleteStyles(false, currentTemplate.value === '')}
                onChange={(_e, newValue) => {
                  if (currentTemplate.value) {
                    setConfirmationState({
                      isOpen: true,
                      message:
                        'The current subject and email content will be replaced with template content. Are you sure you want to continue?',
                      onConfirm: () => {
                        setCurrentTemplate(newValue);
                      },
                      onCancel: () => {
                        setCurrentTemplate(currentTemplate);
                      },
                    });
                  } else {
                    setCurrentTemplate(newValue);
                  }
                }}
                value={currentTemplate}
                renderOption={(props, option) => (
                  <li {...props} key={option.value} title={option.label}>
                    {option.label}
                  </li>
                )}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    variant='outlined'
                    size='small'
                    placeholder={currentTemplate.label || 'Choose Template'}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 0,
                        fontSize: '12px',
                        height: '25px',
                      },
                    }}
                  />
                )}
              />
            ))}
          <TextButton
            label='Save as Draft'
            loading={
              activeFlag === FlagTypeEnum.draft &&
              (createEmail.isPending || updateEmail.isPending)
            }
            disabled={activeFlag !== null && activeFlag !== FlagTypeEnum.draft}
            onClick={() => handleSubmit(FlagTypeEnum.draft)}
            sx={{
              width: '110px',
              minWidth: '110px',
              fontSize: '13px',
              fontWeight: 400,
            }}
          />
          <TextButton
            label='Send'
            loading={
              activeFlag === FlagTypeEnum.send &&
              (createEmail.isPending || updateEmail.isPending)
            }
            disabled={
              !isEmailConfigured ||
              (activeFlag !== null && activeFlag !== FlagTypeEnum.send)
            }
            onClick={() => handleSubmit(FlagTypeEnum.send)}
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
            disabled={createEmail.isPending || updateEmail.isPending}
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
        className={`${isFrom === 'modal' ? 'min-h-[500px] max-h-[550px] overflow-y-auto scrollbar-transparent' : ''} ${isEditView ? 'pb-6' : 'pb-4'}`}
      >
        {formLoading ? (
          <SkeletonForm />
        ) : (
          <form>
            <div
              className={`border capitalize h-[30px] border-box border-[#CBD6E2] font-bold text-[14px] text-[#2D3E4F] leading-[21px] tracking-[0%] align-middle py-1 bg-[#ECECEC] ${isFrom === 'modal' ? 'px-6' : 'px-10'}`}
            >
              Email Information
            </div>

            {/* TO & CC Fields using reusable component */}
            <div className={`${isFrom === 'modal' ? 'px-6' : 'px-10'}`}>
              <EmailRecipients
                label='To'
                field='to'
                values={formData.to}
                inputValue={toInput}
                onInputChange={handleToInputChange}
                onAddEmail={addEmailToField}
                onRemoveEmail={removeRecipient}
                onKeyDown={handleToKeyDown}
                suggestions={toSuggestions}
                setSuggestions={setToSuggestions}
                errors={errors?.to}
                userOptions={userOptions}
                otherFields={{
                  to: formData.to,
                  cc: formData.cc,
                }}
                required={true}
                isValidEmail={isValidEmail}
                disabled={shouldDisableField(
                  'to_email',
                  isEditView,
                  permissionMap
                )}
                hide={shouldHideField('to_email', isEditView, permissionMap)}
              />
              <EmailRecipients
                label='CC'
                field='cc'
                values={formData.cc}
                inputValue={ccInput}
                onInputChange={handleCcInputChange}
                onAddEmail={addEmailToField}
                onRemoveEmail={removeRecipient}
                onKeyDown={handleCcKeyDown}
                suggestions={ccSuggestions}
                setSuggestions={setCcSuggestions}
                errors={errors?.cc}
                userOptions={userOptions}
                otherFields={{
                  to: formData.to,
                  cc: formData.cc,
                }}
                isValidEmail={isValidEmail}
                disabled={shouldDisableField(
                  'cc_email',
                  isEditView,
                  permissionMap
                )}
                hide={shouldHideField('cc_email', isEditView, permissionMap)}
              />
            </div>

            {/* Subject Field */}
            <div
              className={`grid md:grid-cols-1 gap-x-4 gap-y-[2px] ${isFrom === 'modal' ? 'px-6' : 'px-10'} pt-4`}
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
                required
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

            {/* Email Body */}
            <div
              className={`email-template-editor grid grid-cols-1 ${isFrom === 'modal' ? 'px-6' : 'px-10'} pt-4 relative`}
              style={{
                display: shouldHideField('body_html', isEditView, permissionMap)
                  ? 'none'
                  : 'block',
              }}
            >
              <label
                htmlFor='email_body'
                className='text-[13px] text-[#2D3E4F] font-semibold leading-[21px]'
              >
                Email Content<span className='text-red-500'> *</span>
              </label>
              <div
                className='email-body-editor w-full relative'
                ref={quillContainerRef}
              >
                <ReactQuill
                  ref={quillRef}
                  value={formData.emailBody}
                  onChange={handleEmailBodyChange}
                  theme='snow'
                  readOnly={emailBodyDisabled}
                  placeholder='Enter Email Content'
                  className={`rounded-[2px] ${
                    errors?.emailBody
                      ? 'border border-red-500 bg-[#FEF2F2]'
                      : emailBodyDisabled
                        ? 'bg-gray-100 cursor-default'
                        : 'bg-white'
                  }`}
                  modules={
                    emailBodyDisabled
                      ? {
                          toolbar: false,
                        }
                      : modules
                  }
                  formats={[
                    'header',
                    'font',
                    'size',
                    'bold',
                    'italic',
                    'underline',
                    'strike',
                    'color',
                    'background',
                    'script',
                    'blockquote',
                    'code-block',
                    'list',
                    'bullet',
                    'indent',
                    'direction',
                    'align',
                    'link',
                    'image',
                    'video',
                    'clean',
                  ]}
                />

                {errors?.emailBody && (
                  <span className='text-[12px] text-red-400'>
                    {errors.emailBody}
                  </span>
                )}
              </div>
            </div>

            {/* Attachments */}
            {formData.attachments.length > 0 && (
              <div
                className={`${isFrom === 'modal' ? 'px-6' : 'px-10'} py-6 ${hideAttachments ? 'hidden' : 'block'}`}
              >
                <div className='flex items-center gap-2 mb-2'>
                  <span className='text-sm font-medium text-gray-700'>
                    Attachments ({formData.attachments.length})
                  </span>
                </div>
                <div className='space-y-2 max-h-[130px] overflow-y-auto'>
                  {formData.attachments.map((attachment) => (
                    <div
                      key={attachment.id}
                      className='flex items-center justify-between p-2 bg-gray-50 border border-gray-200 rounded-md'
                    >
                      <div className='flex items-center gap-2'>
                        <React.Suspense fallback={null}>
                          <DocumentIcon className='w-6 h-6' />
                        </React.Suspense>
                        <div className='flex flex-col'>
                          <span className='text-sm font-medium text-gray-700 truncate max-w-[300px]'>
                            {attachment.name}
                          </span>
                          <span className='text-xs text-gray-500'>
                            {attachment.size}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => removeAttachment(attachment.id)}
                        disabled={disableAttachments}
                        className='flex items-center justify-center h-6 w-6 hover:bg-gray-200 rounded-full cursor-pointer disabled:cursor-default disabled:hover:bg-transparent transition-colors'
                      >
                        <React.Suspense fallback={null}>
                          <CloseIcon className='w-3 h-3' />
                        </React.Suspense>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Audit Information for Edit View */}
            <div className={`${isEditView ? 'block pt-5' : 'hidden'}`}>
              <div
                className={`border capitalize h-[30px] border-box border-[#CBD6E2] font-bold text-[14px] text-[#2D3E4F] leading-[21px] tracking-[0%] align-middle py-1 bg-[#ECECEC] ${isFrom === 'modal' ? 'px-6' : 'px-10'}`}
              >
                Audit Information
              </div>
              <div className='grid md:grid-cols-3 gap-x-4 gap-y-[2px] px-10 pt-1 mb-4'>
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
                    label: 'Email ID',
                    value: formData.email_rid,
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
      <ConfirmationPopup
        isOpen={confirmationState.isOpen}
        message={confirmationState.message}
        onConfirm={() => {
          confirmationState.onConfirm();
          setConfirmationState((prev) => ({
            ...prev,
            isOpen: false,
            message: '',
          }));
        }}
        onCancel={() => {
          confirmationState.onCancel();
          setConfirmationState((prev) => ({
            ...prev,
            isOpen: false,
            message: '',
          }));
        }}
      />
    </div>
  );
};

export default EmailForm;
