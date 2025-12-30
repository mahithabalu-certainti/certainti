import React, {
  useEffect,
  useMemo,
  useState,
  useRef,
  useCallback,
} from 'react';
import { EmailTemplateIcon } from '../../../../assets';
import SingleSkeleton from '../../../../components/skeleton-component/singleskeleton';
import TextButton from '../../../../components/button/text-button';
import SkeletonForm from '../../../../components/form-builder/skeleton-form';
import {
  MenuItem,
  Select,
  Popover,
  List,
  ListItem,
  ListItemText,
  Box,
} from '@mui/material';
import { EmailTemplateFormData, EmailTemplateFormErrors } from '../../../types';
import ReactQuill from 'react-quill';
import {
  COMMON_MENU_PROPS,
  getSelectStyles,
  normalizeQuillValue,
  shouldDisableField,
  shouldHideField,
  transformEmailTemplatePayload,
  validateEmailTemplateForm,
} from './helper';
import { AllPermissions, useGetStatus } from '../../../../common-service';
import { useParams } from 'react-router-dom';
import {
  useCreateEmailTemplate,
  useEmailTemplateDetails,
  useGetCategoryPlaceholder,
  useGetEmailCategory,
  useGetEmailPlaceholder,
  useUpdateEmailTemplateDetails,
} from '../../../service/email-template/email-template-service';
import { useToast } from '../../../../hooks';
import { formatDateToYYYYMMDDWithTime } from '../../../../common-utils';
import { useSelector } from 'react-redux';
import { RootState } from '../../../../store/store';
import { colorCode } from '../../../../consultant/types';

// Types for placeholder suggestions
interface PlaceholderSuggestion {
  rid: string;
  placeholder_key: string;
  display_name: string;
  applicable_to?: 'body' | 'subject' | 'both';
}

interface MentionState {
  show: boolean;
  position: { top: number; left: number } | null;
  search: string;
  suggestions: PlaceholderSuggestion[];
  selectionIndex: number;
}

const EmailTemplateForm: React.FC = () => {
  const { templateId } = useParams();
  const { successToast } = useToast();
  const [formData, setFormData] = useState<EmailTemplateFormData>({
    templateName: '',
    subject: '',
    description: '',
    status: '',
    emailBody: '',
    category: '',
    rid: '',
    template_rid: '',
    created_on: '',
    created_by: '',
    updated_on: '',
    updated_by: '',
  });

  const [errors, setErrors] = useState<EmailTemplateFormErrors>({});
  const isEditView = location.pathname.split('/').slice(-2, -1)[0] === 'edit';

  const { permission } = useSelector((state: RootState) => state.permission);

  // Refs for Quill and mention popover
  const quillRef = useRef<ReactQuill>(null);
  const mentionPopoverRef = useRef<HTMLDivElement>(null);
  const quillContainerRef = useRef<HTMLDivElement>(null);
  const subjectInputRef = useRef<HTMLInputElement>(null);
  const subjectMentionPopoverRef = useRef<HTMLDivElement>(null);

  // Mention state management
  const [mentionState, setMentionState] = useState<MentionState>({
    show: false,
    position: null,
    search: '',
    suggestions: [],
    selectionIndex: 0,
  });

  // Subject mention state management
  const [subjectMentionState, setSubjectMentionState] = useState<MentionState>({
    show: false,
    position: null,
    search: '',
    suggestions: [],
    selectionIndex: 0,
  });

  const emailTemplateStatus = useGetStatus();
  const createEmailTemplate = useCreateEmailTemplate();
  const updateEmailTemplate = useUpdateEmailTemplateDetails();

  const emailCategory = useGetEmailCategory();
  const emailPlaceholder = useGetEmailPlaceholder();
  const categoryPlaceholder = useGetCategoryPlaceholder(formData.category);

  const { data: emailTemplateData, isLoading } = useEmailTemplateDetails(
    templateId || ''
  );

  const commonSuccess =
    createEmailTemplate.isSuccess || updateEmailTemplate.isSuccess;

  // Get all available placeholders for mention suggestions
  const allPlaceholders = useMemo((): PlaceholderSuggestion[] => {
    return (
      emailPlaceholder.data?.data?.placeHolders?.map((p) => ({
        rid: p.rid,
        placeholder_key: p.placeholder_key,
        display_name: p.display_name,
      })) || []
    );
  }, [emailPlaceholder.data]);

  // Get required placeholders for current category
  const requiredPlaceholders = useMemo((): PlaceholderSuggestion[] => {
    return (
      categoryPlaceholder.data?.data?.placeholders?.map((p) => ({
        rid: p.placeholder_rid,
        placeholder_key: p.placeholder_key,
        display_name: p.display_name,
        applicable_to: p.applicable_to || 'body', // Default to 'body' if not provided
      })) || []
    );
  }, [categoryPlaceholder.data]);

  const statusOptions = useMemo(
    () =>
      emailTemplateStatus.data?.data?.status.map((status) => ({
        label: status.status_name,
        value: status.rid,
      })) || [],
    [emailTemplateStatus.data?.data?.status]
  );

  const categoryOptions = useMemo(
    () =>
      emailCategory.data?.data?.categories.map((status) => ({
        label: status.category_name,
        value: status.rid,
      })) || [],
    [emailCategory.data?.data?.categories]
  );

  // Permission
  const emailTemplateViewEditFields = useMemo(
    () =>
      permission.find(
        (item) => item.name === AllPermissions.EMAIL_TEMPLATES_VIEW_EDIT
      )?.fields ?? [],
    [permission]
  );

  const permissionMap = useMemo(() => {
    const map: Record<string, { read: boolean; edit: boolean }> = {};
    emailTemplateViewEditFields.forEach((item) => {
      map[item.name] = { read: item.read ?? false, edit: item.edit ?? false };
    });
    return map;
  }, [emailTemplateViewEditFields]);

  useEffect(() => {
    if (commonSuccess) {
      successToast(
        isEditView
          ? 'Email Template updated successfully'
          : 'Email Template created successfully'
      );
      goBack();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [commonSuccess, isEditView]);

  useEffect(() => {
    if (emailTemplateData && isEditView) {
      setFormData((prev) => ({
        ...prev,
        templateName: emailTemplateData?.email_template_name,
        status: emailTemplateData.status_rid,
        category: emailTemplateData.category_rid,
        subject: emailTemplateData.subject,
        description: emailTemplateData.email_template_description,
        emailBody: emailTemplateData.body_html,
        rid: emailTemplateData.email_template_rid,
        template_rid: emailTemplateData.r_number,
        created_by: emailTemplateData.created_by,
        created_on: formatDateToYYYYMMDDWithTime(
          emailTemplateData.created_datetime
        ),
        updated_by: emailTemplateData.modified_by || '',
        updated_on: formatDateToYYYYMMDDWithTime(
          emailTemplateData.modified_datetime || ''
        ),
      }));
    }
  }, [isEditView, emailTemplateData]);

  // Handle category change - reset mention state
  const handleInputChange = (
    field: keyof EmailTemplateFormData,
    value: string
  ) => {
    if (field === 'emailBody') {
      value = normalizeQuillValue(value);
    }

    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: '' })); // clear field error on change

    // If category is changed, reset mention state
    if (field === 'category') {
      setMentionState((prev) => ({
        ...prev,
        show: false,
        search: '',
        suggestions: [],
        selectionIndex: 0,
      }));
      setSubjectMentionState((prev) => ({
        ...prev,
        show: false,
        search: '',
        suggestions: [],
        selectionIndex: 0,
      }));
    }
  };

  // Handle Quill editor changes for mention functionality
  const handleEmailBodyChange = (value: string) => {
    const normalizedValue = normalizeQuillValue(value);
    setFormData((prev) => ({ ...prev, emailBody: normalizedValue }));
    setErrors((prev) => ({ ...prev, emailBody: '' }));

    // Check for "@" trigger for mentions (use setTimeout to avoid blocking)
    setTimeout(() => handleMentionTrigger(), 0);
  };

  // Handle subject field changes with @ mention detection
  const handleSubjectChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    handleInputChange('subject', value);

    // Check for "@" trigger for mentions
    setTimeout(() => handleSubjectMentionTrigger(), 0);
  };

  // Filter placeholders based on search
  const filterPlaceholders = useCallback(
    (search: string): PlaceholderSuggestion[] => {
      if (!search) return allPlaceholders;

      const searchLower = search.toLowerCase();
      return allPlaceholders.filter(
        (placeholder) =>
          placeholder.placeholder_key.toLowerCase().includes(searchLower) ||
          placeholder.display_name.toLowerCase().includes(searchLower)
      );
    },
    [allPlaceholders]
  );

  // Handle mention trigger logic
  const handleMentionTrigger = useCallback(() => {
    const quill = quillRef.current?.getEditor();
    if (!quill) return;

    const selection = quill.getSelection();
    if (!selection) return;

    const text = quill.getText(0, selection.index);
    const atIndex = text.lastIndexOf('@');
    let textAfterAt;

    if (atIndex !== -1) {
      // Check if we're already inside a placeholder or if @ is followed by {
      textAfterAt = text.substring(atIndex);
      if (textAfterAt.startsWith('@{{') || textAfterAt.includes('}}')) {
        setMentionState((prev) => ({
          ...prev,
          show: false,
          search: '',
          suggestions: [],
          selectionIndex: 0,
        }));
        return;
      }

      // Get text after @ for filtering
      textAfterAt = text.substring(atIndex + 1);
      const spaceIndex = textAfterAt.indexOf(' ');

      // If there's a space after @, don't show suggestions
      if (spaceIndex === 0) {
        setMentionState((prev) => ({
          ...prev,
          show: false,
          search: '',
          suggestions: [],
          selectionIndex: 0,
        }));
        return;
      }

      const searchText =
        spaceIndex === -1 ? textAfterAt : textAfterAt.substring(0, spaceIndex);

      // Show mention popover
      const bounds = quill.getBounds(selection.index);
      const editor = quill.root;
      const editorRect = editor.getBoundingClientRect();

      setMentionState((prev) => ({
        ...prev,
        show: true,
        position: {
          top: editorRect.top + bounds.top + bounds.height,
          left: editorRect.left + bounds.left,
        },
        search: searchText,
        suggestions: filterPlaceholders(searchText),
        selectionIndex: 0,
      }));
    } else {
      setMentionState((prev) => ({
        ...prev,
        show: false,
        search: '',
        suggestions: [],
        selectionIndex: 0,
      }));
    }
  }, [filterPlaceholders]);

  // Insert selected placeholder - Only bold the placeholder, not user text
  const insertPlaceholder = useCallback(
    (placeholder: PlaceholderSuggestion) => {
      const quill = quillRef.current?.getEditor();
      if (!quill) return;

      const selection = quill.getSelection();
      if (!selection) return;

      const text = quill.getText(0, selection.index);
      const atIndex = text.lastIndexOf('@');

      if (atIndex !== -1) {
        // Delete the @ and search text
        const textToDelete = selection.index - atIndex;
        quill.deleteText(atIndex, textToDelete);

        // Insert the placeholder with bold formatting
        quill.insertText(
          atIndex,
          `{{${placeholder.display_name || placeholder.placeholder_key}}}`,
          {
            bold: true,
          }
        );

        const placeholderLength =
          `{{${placeholder.display_name || placeholder.placeholder_key}}}`
            .length;

        // Insert a space after placeholder with normal formatting (no bold)
        quill.insertText(atIndex + placeholderLength, ' ', { bold: false });

        // Move cursor after the space
        quill.setSelection({
          index: atIndex + placeholderLength + 1,
          length: 0,
        });

        // Ensure the cursor position has no bold formatting
        quill.format('bold', false);
      }

      setMentionState((prev) => ({
        ...prev,
        show: false,
        search: '',
        suggestions: [],
        selectionIndex: 0,
      }));
    },
    []
  );

  // Handle subject mention trigger logic
  const handleSubjectMentionTrigger = useCallback(() => {
    const input = subjectInputRef.current;
    if (!input) return;

    const cursorPosition = input.selectionStart || 0;
    const text = input.value.substring(0, cursorPosition);
    const atIndex = text.lastIndexOf('@');

    if (atIndex !== -1) {
      const textAfterAt = text.substring(atIndex);

      // Check if we're already inside a placeholder
      if (textAfterAt.startsWith('@{{') || textAfterAt.includes('}}')) {
        setSubjectMentionState((prev) => ({
          ...prev,
          show: false,
          search: '',
          suggestions: [],
          selectionIndex: 0,
        }));
        return;
      }

      const searchText = text.substring(atIndex + 1);
      const spaceIndex = searchText.indexOf(' ');

      // If there's a space after @, don't show suggestions
      if (spaceIndex === 0) {
        setSubjectMentionState((prev) => ({
          ...prev,
          show: false,
          search: '',
          suggestions: [],
          selectionIndex: 0,
        }));
        return;
      }

      const search =
        spaceIndex === -1 ? searchText : searchText.substring(0, spaceIndex);

      // Get input position for popover
      const inputRect = input.getBoundingClientRect();
      const textBeforeCursor = text;
      const measureSpan = document.createElement('span');
      measureSpan.style.font = window.getComputedStyle(input).font;
      measureSpan.style.visibility = 'hidden';
      measureSpan.style.position = 'absolute';
      measureSpan.textContent = textBeforeCursor;
      document.body.appendChild(measureSpan);
      const textWidth = measureSpan.offsetWidth;
      document.body.removeChild(measureSpan);

      setSubjectMentionState((prev) => ({
        ...prev,
        show: true,
        position: {
          top: inputRect.bottom,
          left: Math.min(inputRect.left + textWidth, inputRect.right - 100),
        },
        search: search,
        suggestions: filterPlaceholders(search),
        selectionIndex: 0,
      }));
    } else {
      setSubjectMentionState((prev) => ({
        ...prev,
        show: false,
        search: '',
        suggestions: [],
        selectionIndex: 0,
      }));
    }
  }, [filterPlaceholders]);

  // Insert placeholder into subject field
  const insertSubjectPlaceholder = useCallback(
    (placeholder: PlaceholderSuggestion) => {
      const input = subjectInputRef.current;
      if (!input) return;

      const cursorPosition = input.selectionStart || 0;
      const text = input.value;
      const textBeforeCursor = text.substring(0, cursorPosition);
      const atIndex = textBeforeCursor.lastIndexOf('@');

      if (atIndex !== -1) {
        const textBeforeAt = text.substring(0, atIndex);
        const textAfterCursor = text.substring(cursorPosition);
        const placeholderText = `{{${placeholder.display_name || placeholder.placeholder_key}}}`;
        const newValue = textBeforeAt + placeholderText + ' ' + textAfterCursor;

        setFormData((prev) => ({ ...prev, subject: newValue }));

        // Set cursor position after placeholder and space
        setTimeout(() => {
          const newCursorPos = atIndex + placeholderText.length + 1;
          input.setSelectionRange(newCursorPos, newCursorPos);
          input.focus();
        }, 0);
      }

      setSubjectMentionState((prev) => ({
        ...prev,
        show: false,
        search: '',
        suggestions: [],
        selectionIndex: 0,
      }));
    },
    []
  );

  // Handle mouse selection from popover
  const handleSuggestionClick = useCallback(
    (e: React.MouseEvent, suggestion: PlaceholderSuggestion) => {
      e.preventDefault();
      e.stopPropagation();
      insertPlaceholder(suggestion);

      // Refocus the editor after selection
      setTimeout(() => {
        const quill = quillRef.current?.getEditor();
        if (quill) {
          quill.focus();
        }
      }, 0);
    },
    [insertPlaceholder]
  );

  // Handle mouse selection from subject popover
  const handleSubjectSuggestionClick = useCallback(
    (e: React.MouseEvent, suggestion: PlaceholderSuggestion) => {
      e.preventDefault();
      e.stopPropagation();
      insertSubjectPlaceholder(suggestion);
    },
    [insertSubjectPlaceholder]
  );

  // Handle keyboard events for mention popover
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!mentionState.show) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setMentionState((prev) => ({
            ...prev,
            selectionIndex: Math.min(
              prev.selectionIndex + 1,
              prev.suggestions.length - 1
            ),
          }));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setMentionState((prev) => ({
            ...prev,
            selectionIndex: Math.max(prev.selectionIndex - 1, 0),
          }));
          break;
        case 'Enter':
          e.preventDefault();
          if (mentionState.suggestions[mentionState.selectionIndex]) {
            insertPlaceholder(
              mentionState.suggestions[mentionState.selectionIndex]
            );
          }
          break;
        case 'Escape':
          e.preventDefault();
          setMentionState((prev) => ({
            ...prev,
            show: false,
            search: '',
            suggestions: [],
            selectionIndex: 0,
          }));
          break;
        case 'Tab':
          e.preventDefault();
          if (mentionState.suggestions[mentionState.selectionIndex]) {
            insertPlaceholder(
              mentionState.suggestions[mentionState.selectionIndex]
            );
          }
          break;
      }
    };

    if (mentionState.show) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [mentionState, insertPlaceholder]);

  // Handle keyboard events for subject mention popover
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!subjectMentionState.show) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSubjectMentionState((prev) => ({
            ...prev,
            selectionIndex: Math.min(
              prev.selectionIndex + 1,
              prev.suggestions.length - 1
            ),
          }));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSubjectMentionState((prev) => ({
            ...prev,
            selectionIndex: Math.max(prev.selectionIndex - 1, 0),
          }));
          break;
        case 'Enter':
          e.preventDefault();
          if (
            subjectMentionState.suggestions[subjectMentionState.selectionIndex]
          ) {
            insertSubjectPlaceholder(
              subjectMentionState.suggestions[
                subjectMentionState.selectionIndex
              ]
            );
          }
          break;
        case 'Escape':
          e.preventDefault();
          setSubjectMentionState((prev) => ({
            ...prev,
            show: false,
            search: '',
            suggestions: [],
            selectionIndex: 0,
          }));
          break;
        case 'Tab':
          e.preventDefault();
          if (
            subjectMentionState.suggestions[subjectMentionState.selectionIndex]
          ) {
            insertSubjectPlaceholder(
              subjectMentionState.suggestions[
                subjectMentionState.selectionIndex
              ]
            );
          }
          break;
      }
    };

    if (subjectMentionState.show) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [subjectMentionState, insertSubjectPlaceholder]);

  // Close mention popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;

      // Check if click is inside the popover
      const isInsidePopover =
        mentionPopoverRef.current && mentionPopoverRef.current.contains(target);

      // If click is inside popover, don't close
      if (isInsidePopover) {
        return;
      }

      // Check if click is inside the Quill editor
      const isInsideQuill =
        quillContainerRef.current && quillContainerRef.current.contains(target);

      // If click is outside both popover and editor, close the popover
      if (!isInsideQuill) {
        setMentionState((prev) => ({
          ...prev,
          show: false,
          search: '',
          suggestions: [],
          selectionIndex: 0,
        }));
      }
    };

    if (mentionState.show) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [mentionState.show]);

  // Close subject mention popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;

      // Check if click is inside the subject popover
      const isInsidePopover =
        subjectMentionPopoverRef.current &&
        subjectMentionPopoverRef.current.contains(target);

      // If click is inside popover, don't close
      if (isInsidePopover) {
        return;
      }

      // Check if click is inside the subject input
      const isInsideInput =
        subjectInputRef.current && subjectInputRef.current.contains(target);

      // If click is outside both popover and input, close the popover
      if (!isInsideInput) {
        setSubjectMentionState((prev) => ({
          ...prev,
          show: false,
          search: '',
          suggestions: [],
          selectionIndex: 0,
        }));
      }
    };

    if (subjectMentionState.show) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [subjectMentionState.show]);

  // Validate required placeholders based on applicable_to field
  const validateRequiredPlaceholders = (): Record<string, string> => {
    const placeholderErrors: Record<string, string> = {};

    if (!formData.category || requiredPlaceholders.length === 0) {
      return placeholderErrors;
    }

    // Group placeholders by applicable_to
    const bodyPlaceholders = requiredPlaceholders.filter(
      (placeholder) =>
        placeholder.applicable_to === 'body' ||
        placeholder.applicable_to === 'both'
    );

    const subjectPlaceholders = requiredPlaceholders.filter(
      (placeholder) =>
        placeholder.applicable_to === 'subject' ||
        placeholder.applicable_to === 'both'
    );

    // Validate body placeholders
    const missingBodyPlaceholders = bodyPlaceholders.filter((placeholder) => {
      const placeholderPattern = `{{${placeholder.display_name || placeholder.placeholder_key}}}`;
      return !formData.emailBody.includes(placeholderPattern);
    });

    if (missingBodyPlaceholders.length > 0) {
      const missingKeys = missingBodyPlaceholders
        .map((p) => `{{${p.display_name || p.placeholder_key}}}`)
        .join(', ');

      if (missingBodyPlaceholders.length === 1) {
        placeholderErrors.emailBody = `Required placeholder ${missingKeys} is missing in email body`;
      } else {
        placeholderErrors.emailBody = `The following required placeholders are missing in email body: ${missingKeys}`;
      }
    }

    // Validate subject placeholders
    const missingSubjectPlaceholders = subjectPlaceholders.filter(
      (placeholder) => {
        const placeholderPattern = `{{${placeholder.display_name || placeholder.placeholder_key}}}`;
        return !formData.subject.includes(placeholderPattern);
      }
    );

    if (missingSubjectPlaceholders.length > 0) {
      const missingKeys = missingSubjectPlaceholders
        .map((p) => `{{${p.display_name || p.placeholder_key}}}`)
        .join(', ');

      if (missingSubjectPlaceholders.length === 1) {
        placeholderErrors.subject = `Required placeholder ${missingKeys} is missing in subject`;
      } else {
        placeholderErrors.subject = `The following required placeholders are missing in subject: ${missingKeys}`;
      }
    }

    return placeholderErrors;
  };

  const validateForm = (): boolean => {
    const { isValid, errors: validationErrors } =
      validateEmailTemplateForm(formData);
    setErrors(validationErrors);

    // Additional validation for required placeholders based on applicable_to
    const placeholderErrors = validateRequiredPlaceholders();

    if (Object.keys(placeholderErrors).length > 0) {
      setErrors((prev) => ({
        ...prev,
        ...placeholderErrors,
      }));
      return false;
    }

    return isValid;
  };

  const goBack = () => {
    window.history.back();
  };

  const handleSubmit = () => {
    if (!validateForm()) {
      return;
    }
    const payload = transformEmailTemplatePayload(
      formData,
      isEditView,
      emailTemplateData
    );

    if (isEditView && emailTemplateData) {
      updateEmailTemplate.mutate(payload);
    } else {
      createEmailTemplate.mutate(payload);
    }
  };

  const formLoading = emailTemplateStatus.isPending || isLoading;
  const emailBodyDisabled = shouldDisableField(
    'body_html',
    isEditView,
    permissionMap
  );

  return (
    <div>
      <div className='h-[50px] flex items-center justify-between px-10 sticky top-0 z-10 bg-white'>
        <div className='flex items-center w-[80%] max-w-[80%]'>
        <EmailTemplateIcon
              alt='email-template-icon'
             className={`h-7 w-7 p-1.5 rounded [&>path]:stroke-[${colorCode.manageAccountTextColor}] bg-[${colorCode.manageTemplateBgcolor}]`}
            />
          <div className='w-[90%]'>
            {isLoading ? (
              <div className='ml-2'>
                <SingleSkeleton width={150} height={12} />
              </div>
            ) : (
              <div className='font-semibold text-[12px] leading-[20px] ml-2 mb-[-6px] text-[#7D98B6]'>
                {`Email Template ${isEditView ? `> ${emailTemplateData?.r_number}` : ''}`}
              </div>
            )}
            <h5 className='text-[16px] font-bold ml-2 mt-0.5 text-[#2D3E4F]'>
              {isEditView ? 'Edit Template' : 'Create Template'}
            </h5>
          </div>
        </div>
        <div className='flex gap-3'>
          <TextButton
            label='Save'
            loading={
              createEmailTemplate.isPending || updateEmailTemplate.isPending
            }
            onClick={handleSubmit}
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
            disabled={
              createEmailTemplate.isPending || updateEmailTemplate.isPending
            }
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
              Template Information
            </div>
            <div className='grid md:grid-cols-3 gap-x-4 gap-y-[2px] px-10 pt-4'>
              <div
                style={{
                  display: shouldHideField(
                    'email_template_name',
                    isEditView,
                    permissionMap
                  )
                    ? 'none'
                    : 'block',
                }}
              >
                <label
                  className={`text-[13px] text-[#2D3E4F] font-semibold leading-[21px] tracking-[0] md:text-left mt-1`}
                  htmlFor='template_name'
                >
                  Template Name
                  <span className='text-red-500'> *</span>
                </label>
                <input
                  type='text'
                  name='template_name'
                  required
                  placeholder='Enter Template Name'
                  value={formData.templateName}
                  onChange={(e) =>
                    handleInputChange('templateName', e.target.value)
                  }
                  disabled={shouldDisableField(
                    'email_template_name',
                    isEditView,
                    permissionMap
                  )}
                  autoComplete='off'
                  className={`placeholder-custom-color disabled:bg-gray-100 placeholder-[#7D98B6] truncate overflow-hidden text-ellipsis whitespace-nowrap outline-none focus:border-2 focus:border-blue-400 w-full sm:text-sm px-3 h-[32px] border border-[#CBD6E2] rounded-xs ${errors?.templateName ? 'border-red-500 bg-[#FEF2F2]' : ''}`}
                />
                {errors?.templateName && (
                  <span className='text-[12px] text-red-400 col-span-full'>
                    {errors.templateName}
                  </span>
                )}
              </div>

              <div
                style={{
                  display: shouldHideField(
                    'category_rid',
                    isEditView,
                    permissionMap
                  )
                    ? 'none'
                    : 'block',
                }}
              >
                <label
                  className={`text-[13px] text-[#2D3E4F] font-semibold leading-[21px] tracking-[0] md:text-left mt-1`}
                  htmlFor='category'
                >
                  Category
                  <span className='text-red-500'> *</span>
                </label>

                <Select
                  name='category'
                  value={formData.category}
                  onChange={(e) =>
                    handleInputChange('category', e.target.value)
                  }
                  displayEmpty
                  required
                  fullWidth
                  size='small'
                  className={`custom-select-no-arrow sm:text-sm ${
                    formData.category === '' ? 'text-[#7D98B6]' : 'text-black'
                  } ${errors?.category ? 'border-red-500 bg-[#FEF2F2]' : ''}`}
                  disabled={shouldDisableField(
                    'category_rid',
                    isEditView,
                    permissionMap
                  )}
                  MenuProps={COMMON_MENU_PROPS}
                  sx={getSelectStyles(
                    !!errors?.category,
                    formData.category === ''
                  )}
                >
                  <MenuItem
                    value=''
                    sx={{ color: '#425A76', fontSize: '13px', fontWeight: 500 }}
                  >
                    Choose Category
                  </MenuItem>

                  {categoryOptions?.map((option, i) => (
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

                {errors?.category && (
                  <span className='text-[12px] text-red-400 col-span-full'>
                    {errors.category}
                  </span>
                )}
              </div>

              <div
                style={{
                  display: shouldHideField(
                    'status_rid',
                    isEditView,
                    permissionMap
                  )
                    ? 'none'
                    : 'block',
                }}
              >
                <label
                  className={`text-[13px] text-[#2D3E4F] font-semibold leading-[21px] tracking-[0] md:text-left mt-1`}
                  htmlFor='status'
                >
                  Status
                  <span className='text-red-500'> *</span>
                </label>

                <Select
                  name='status'
                  value={formData.status}
                  onChange={(e) => handleInputChange('status', e.target.value)}
                  displayEmpty
                  required
                  fullWidth
                  size='small'
                  className={`custom-select-no-arrow sm:text-sm ${
                    formData.status === '' ? 'text-[#7D98B6]' : 'text-black'
                  } ${errors?.status ? 'border-red-500 bg-[#FEF2F2]' : ''}`}
                  disabled={shouldDisableField(
                    'status_rid',
                    isEditView,
                    permissionMap
                  )}
                  MenuProps={COMMON_MENU_PROPS}
                  sx={getSelectStyles(!!errors?.status, formData.status === '')}
                >
                  <MenuItem
                    value=''
                    sx={{ color: '#425A76', fontSize: '13px', fontWeight: 500 }}
                  >
                    Choose Status
                  </MenuItem>

                  {statusOptions?.map((option, i) => (
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

                {errors?.status && (
                  <span className='text-[12px] text-red-400 col-span-full'>
                    {errors.status}
                  </span>
                )}
              </div>
            </div>

            <div
              className='relative grid grid-cols-1 px-10 pt-4'
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
                ref={subjectInputRef}
                type='text'
                name='subject'
                required
                placeholder='Enter Subject'
                value={formData.subject}
                onChange={handleSubjectChange}
                disabled={shouldDisableField(
                  'subject',
                  isEditView,
                  permissionMap
                )}
                autoComplete='off'
                className={`placeholder-custom-color disabled:bg-gray-100 placeholder-[#7D98B6] truncate overflow-hidden text-ellipsis whitespace-nowrap outline-none focus:border-2 focus:border-blue-400 w-full sm:text-sm px-3 h-[32px] border border-[#CBD6E2] rounded-xs ${errors?.subject ? 'border-red-500 bg-[#FEF2F2]' : ''}`}
              />
              {errors?.subject && (
                <span className='text-[12px] text-red-400'>
                  {errors.subject}
                </span>
              )}

              <Popover
                open={subjectMentionState.show}
                anchorReference='anchorPosition'
                anchorPosition={
                  subjectMentionState.position
                    ? {
                        top: subjectMentionState.position.top,
                        left: subjectMentionState.position.left,
                      }
                    : undefined
                }
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'left',
                }}
                disableAutoFocus
                disableEnforceFocus
                PaperProps={{
                  ref: subjectMentionPopoverRef,
                  sx: {
                    marginTop: '4px',
                    boxShadow:
                      '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
                    border: '1px solid #e5e7eb',
                    borderRadius: '4px',
                    maxHeight: 200,
                    overflow: 'auto',
                  },
                }}
                sx={{
                  zIndex: 9999,
                  pointerEvents: 'auto',
                }}
              >
                <Box sx={{ width: 250 }}>
                  <List dense sx={{ py: 0 }}>
                    {subjectMentionState.suggestions.map(
                      (suggestion, index) => (
                        <ListItem
                          key={suggestion.rid}
                          onMouseDown={(e) =>
                            handleSubjectSuggestionClick(e, suggestion)
                          }
                          onMouseEnter={() =>
                            setSubjectMentionState((prev) => ({
                              ...prev,
                              selectionIndex: index,
                            }))
                          }
                          sx={{
                            cursor: 'pointer',
                            backgroundColor:
                              index === subjectMentionState.selectionIndex
                                ? '#f3f4f6'
                                : 'transparent',
                            '&:hover': {
                              backgroundColor: '#f3f4f6',
                            },
                            borderBottom: '1px solid #f3f4f6',
                            '&:last-child': {
                              borderBottom: 'none',
                            },
                          }}
                        >
                          <ListItemText
                            primary={`{{${suggestion.display_name || suggestion.placeholder_key}}}`}
                            // secondary={`{{${suggestion.placeholder_key}}}`}
                            primaryTypographyProps={{
                              fontSize: '13px',
                              fontWeight:
                                index === subjectMentionState.selectionIndex
                                  ? 600
                                  : 400,
                            }}
                            secondaryTypographyProps={{
                              fontSize: '11px',
                              color: '#7D98B6',
                            }}
                          />
                        </ListItem>
                      )
                    )}
                    {subjectMentionState.suggestions.length === 0 && (
                      <ListItem>
                        <ListItemText
                          primary='No placeholders found'
                          primaryTypographyProps={{
                            fontSize: '13px',
                            color: 'text.secondary',
                            fontStyle: 'italic',
                          }}
                        />
                      </ListItem>
                    )}
                  </List>
                </Box>
              </Popover>
            </div>

            {/* Email Body */}
            <div
              className='email-template-editor grid grid-cols-1 px-10 pt-4 relative'
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
                Email Body<span className='text-red-500'> *</span>
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
                  placeholder='Enter Email Body'
                  className={`rounded-[2px] ${
                    errors?.emailBody
                      ? 'border border-red-500 bg-[#FEF2F2]'
                      : emailBodyDisabled
                        ? 'bg-gray-100 cursor-default'
                        : 'bg-white'
                  }`}
                  modules={{
                    toolbar: emailBodyDisabled
                      ? false // disable toolbar
                      : [
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
                          ['clean'],
                        ],
                  }}
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

                <Popover
                  open={mentionState.show}
                  anchorReference='anchorPosition'
                  anchorPosition={
                    mentionState.position
                      ? {
                          top: mentionState.position.top,
                          left: mentionState.position.left,
                        }
                      : undefined
                  }
                  transformOrigin={{
                    vertical: 'top',
                    horizontal: 'left',
                  }}
                  disableAutoFocus
                  disableEnforceFocus
                  PaperProps={{
                    ref: mentionPopoverRef,
                    sx: {
                      marginTop: '4px',
                      boxShadow:
                        '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
                      border: '1px solid #e5e7eb',
                      borderRadius: '4px',
                      maxHeight: 200,
                      overflow: 'auto',
                    },
                  }}
                  sx={{
                    zIndex: 9999,
                    pointerEvents: 'auto',
                  }}
                >
                  <Box sx={{ width: 250 }}>
                    <List dense sx={{ py: 0 }}>
                      {mentionState.suggestions.map((suggestion, index) => (
                        <ListItem
                          key={suggestion.rid}
                          onMouseDown={(e) =>
                            handleSuggestionClick(e, suggestion)
                          }
                          onMouseEnter={() =>
                            setMentionState((prev) => ({
                              ...prev,
                              selectionIndex: index,
                            }))
                          }
                          sx={{
                            cursor: 'pointer',
                            backgroundColor:
                              index === mentionState.selectionIndex
                                ? '#f3f4f6'
                                : 'transparent',
                            '&:hover': {
                              backgroundColor: '#f3f4f6',
                            },
                            borderBottom: '1px solid #f3f4f6',
                            '&:last-child': {
                              borderBottom: 'none',
                            },
                          }}
                        >
                          <ListItemText
                            primary={`{{${suggestion.display_name || suggestion.placeholder_key}}}`}
                            // secondary={`{{${suggestion.placeholder_key}}}`}
                            primaryTypographyProps={{
                              fontSize: '13px',
                              fontWeight:
                                index === mentionState.selectionIndex
                                  ? 600
                                  : 400,
                            }}
                            secondaryTypographyProps={{
                              fontSize: '11px',
                              color: '#7D98B6',
                            }}
                          />
                        </ListItem>
                      ))}
                      {mentionState.suggestions.length === 0 && (
                        <ListItem>
                          <ListItemText
                            primary='No placeholders found'
                            primaryTypographyProps={{
                              fontSize: '13px',
                              color: 'text.secondary',
                              fontStyle: 'italic',
                            }}
                          />
                        </ListItem>
                      )}
                    </List>
                  </Box>
                </Popover>

                {errors?.emailBody && (
                  <span className='text-[12px] text-red-400'>
                    {errors.emailBody}
                  </span>
                )}
              </div>
            </div>

            <div
              className='grid grid-cols-1 px-10 pt-4'
              style={{
                display: shouldHideField(
                  'description',
                  isEditView,
                  permissionMap
                )
                  ? 'none'
                  : 'block',
              }}
            >
              <label
                htmlFor='description'
                className='text-[13px] text-[#2D3E4F] font-semibold leading-[21px]'
              >
                Description
              </label>
              <textarea
                name='description'
                required
                placeholder='Enter Description'
                value={formData.description}
                onChange={(e) =>
                  handleInputChange('description', e.target.value)
                }
                className={`outline-none placeholder-custom-color h-[95px] w-full sm:text-sm py-2 px-3 resize-none focus:border-2 focus:border-blue-400 border border-[#CBD6E2] rounded-xs ${
                  errors?.description
                    ? 'border-red-500 bg-[#FEF2F2] focus:!bg-[#FEF2F2]'
                    : ''
                }`}
                disabled={shouldDisableField(
                  'description',
                  isEditView,
                  permissionMap
                )}
                style={{
                  scrollbarWidth: 'thin',
                  scrollbarColor: '#9ca3af transparent',
                }}
              />
              {errors?.description && (
                <span className='text-[12px] text-red-400'>
                  {errors.description}
                </span>
              )}
            </div>

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
                      'created_by',
                      isEditView,
                      permissionMap
                    ),
                  },
                  {
                    label: 'Template ID',
                    value: formData.template_rid,
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
                      'modified_by',
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
                      <div className='placeholder-[#7D98B6] bg-gray-100 text-black w-full sm:text-sm px-3 h-[32px] border border-[#CBD6E2] rounded-xs flex items-center cursor-not-allowed select-none text-nowrap overflow-hidden'>
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

export default EmailTemplateForm;
