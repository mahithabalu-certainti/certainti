/* eslint-disable @typescript-eslint/no-explicit-any */
import React, {
  useRef,
  useState,
  useCallback,
  useEffect,
  useMemo,
} from 'react';
import TextButton from '../../../../../../components/button/text-button';
import { Box, List, ListItem, ListItemText, Popover } from '@mui/material';
import ReactQuill from 'react-quill';
import { useParams, useSearchParams } from 'react-router-dom';
import { ReviewProject } from '../../../../../types/assign-projects';
import { SortDirection } from '../../../../../../components/table/types';
import { useToast } from '../../../../../../hooks';
import {
  useGetUserOptions,
  UserOption,
} from '../../../../../services/case-team';
import {
  useEmailTemplatePreview,
  useSendProjectsForReview,
} from '../../../../../services/cases-assign-projects/review-project-service';
import { EmailRecipients } from '../../../../../../components';
import { CloseIcon, DocumentIcon } from '../../../../../../assets'; // Import icons

// Types for placeholder suggestions
interface PlaceholderSuggestion {
  rid: string;
  placeholder_key: string;
  applicable_to?: 'body' | 'subject' | 'both';
}

interface MentionState {
  show: boolean;
  position: { top: number; left: number } | null;
  search: string;
  suggestions: PlaceholderSuggestion[];
  selectionIndex: number;
}

interface EmailModalProps {
  title: string;
  isOpen: boolean;
  onClose: () => void;
  selectedRows: ReviewProject[];
  setSelectedRows: React.Dispatch<React.SetStateAction<ReviewProject[]>>;
  setClearSelectedRows?: React.Dispatch<React.SetStateAction<boolean>>;
  appliedFilters: Record<string, string | number | boolean | string[]>;
  sortBy?: string;
  sortOrder?: SortDirection;
}

// Interface for API response
interface TemplatePreviewData {
  to_email: string[];
  cc_email: string[];
  subject: string;
  body_html: string;
}

// Types for suggestion state
interface SuggestionState {
  suggestions: UserOption[];
  highlightedIndex: number;
  anchorEl: HTMLElement | null;
}

// Attachment interface
interface Attachment {
  id: string;
  file: File | null;
  name: string;
  size: string;
  url?: string;
  existing?: boolean;
}

const EmailModalTemplate: React.FC<EmailModalProps> = ({
  title,
  isOpen,
  onClose,
  selectedRows,
  setSelectedRows,
  setClearSelectedRows,
  appliedFilters,
  sortBy,
  sortOrder,
}) => {
  const [formData, setFormData] = useState<any>({
    to: [],
    cc: [],
    subject: '',
    emailBody: '',
    rid: '',
    attachments: [], // Added attachments field
  });
  const [errors, setErrors] = useState<any>({});

  const { caseId } = useParams();
  const [searchParams] = useSearchParams();
  const accountID = searchParams.get('accountID') ?? '';

  // Email input states
  const [toInput, setToInput] = useState('');
  const [ccInput, setCcInput] = useState('');

  // Updated suggestion states to match EmailRecipients interface
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

  // Refs
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

  const { successToast } = useToast();

  // API hooks
  const { data } = useEmailTemplatePreview({
    account_rid: accountID || '',
    case_rid: caseId || '',
    category_name: 'Review Projects',
  });

  const userEmailOptions = useGetUserOptions(accountID);

  // Extract template data from API response
  const templateData: TemplatePreviewData | null = useMemo(() => {
    if (data?.data?.templatePreview) {
      return data.data.templatePreview;
    }
    return null;
  }, [data]);

  const userOptions = useMemo(() => {
    return (userEmailOptions.data || []).map((item) => ({
      rid: item.rid,
      name: item?.name || '',
      email: item?.email || '',
    }));
  }, [userEmailOptions.data]);

  // Populate form with API data when modal opens and data is available
  useEffect(() => {
    if (isOpen && templateData) {
      console.log('Populating form with template data:', templateData);

      setFormData({
        to: templateData.to_email || [],
        cc: templateData.cc_email || [],
        subject: templateData.subject || '',
        emailBody: templateData.body_html || '',
        rid: '',
        attachments: [],
      });
    }
  }, [isOpen, templateData]);

  // Reset form when closing modal
  useEffect(() => {
    if (!isOpen) {
      setFormData({
        to: [],
        cc: [],
        subject: '',
        emailBody: '',
        rid: '',
        attachments: [],
      });
      setToInput('');
      setCcInput('');
      setErrors({});
    }
  }, [isOpen]);

  const selectedProjectIds = selectedRows.map((project) => project.rid);
  const sendProjectEmail = useSendProjectsForReview();

  // Mock data for placeholders
  const allPlaceholders = useMemo((): PlaceholderSuggestion[] => {
    return [
      { rid: '1', placeholder_key: 'customer_name', applicable_to: 'both' },
      { rid: '2', placeholder_key: 'order_number', applicable_to: 'both' },
      { rid: '3', placeholder_key: 'due_date', applicable_to: 'body' },
      { rid: '4', placeholder_key: 'amount', applicable_to: 'body' },
      { rid: '5', placeholder_key: 'company_name', applicable_to: 'both' },
    ];
  }, []);

  const normalizeQuillValue = (value: string): string => {
    if (!value) return '';

    const cleaned = value
      .replace(/<(.|\n)*?>/g, '')
      .replace(/&nbsp;/g, '')
      .trim();

    return cleaned.length === 0 ? '' : value;
  };

  // Email validation
  const isValidEmail = useCallback((email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
  }, []);

  // Filter email suggestions
  const filterSuggestions = useCallback(
    (searchText: string, currentField: 'to' | 'cc'): UserOption[] => {
      if (!searchText.trim()) return [];

      const lowerSearch = searchText.toLowerCase();

      const currentFieldEmails = formData[currentField] || [];

      const filtered = userOptions.filter(
        (user) =>
          (user.name.toLowerCase().includes(lowerSearch) ||
            user.email.toLowerCase().includes(lowerSearch)) &&
          !currentFieldEmails.includes(user.email)
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

  // Generic input change handler
  const handleRecipientInputChange = useCallback(
    (
      field: 'to' | 'cc',
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
          anchorEl: document.getElementById(`${field}-input`),
        }));
        return;
      }

      // If value starts with '@' but has more characters
      if (value.startsWith('@')) {
        const query = value.substring(1);
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

  // Add email to field
  const addEmailToField = useCallback(
    (field: 'to' | 'cc' | 'bcc', email: string) => {
      if (
        !email.trim() ||
        !isValidEmail(email) ||
        formData[field]?.includes(email.trim())
      ) {
        return;
      }

      const cleanEmail = email.trim();

      setFormData((prev: typeof formData) => ({
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

      setErrors((prev: any) => ({ ...prev, [field]: '' }));
    },
    [isValidEmail, formData]
  );

  // Remove recipient
  const removeRecipient = useCallback(
    (field: 'to' | 'cc' | 'bcc', index: number) => {
      setFormData((prev: typeof formData) => ({
        ...prev,
        [field]: (prev[field] || []).filter(
          (_: string, i: number) => i !== index
        ),
      }));
    },
    []
  );

  // Generic key down handler
  const handleRecipientKeyDown = useCallback(
    (
      e: React.KeyboardEvent<HTMLInputElement>,
      field: 'to' | 'cc',
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

  // Attachment handler - similar to EmailForm
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
        setFormData((prev: typeof formData) => ({
          ...prev,
          attachments: [...prev.attachments, ...newAttachments],
        }));
      }
    };
  }, []);

  // Remove attachment
  const removeAttachment = (id: string) => {
    setFormData((prev: typeof formData) => ({
      ...prev,
      attachments: prev.attachments.filter((att: Attachment) => att.id !== id),
    }));
  };

  // Quill modules with attachment button
  const modules = useMemo(
    () => ({
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
    }),
    [handleAttachment]
  );

  // Handle Quill editor changes for mention functionality
  const handleEmailBodyChange = (value: string) => {
    const normalizedValue = normalizeQuillValue(value);
    setFormData((prev: typeof formData) => ({
      ...prev,
      emailBody: normalizedValue,
    }));
    setErrors((prev: any) => ({ ...prev, emailBody: '' }));

    // Check for "@" trigger for mentions
    setTimeout(() => handleMentionTrigger(), 0);
  };

  // Handle subject field changes with @ mention detection
  const handleSubjectChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormData((prev: typeof formData) => ({ ...prev, subject: value }));
    setErrors((prev: any) => ({ ...prev, subject: '' }));

    // Check for "@" trigger for mentions
    setTimeout(() => handleSubjectMentionTrigger(), 0);
  };

  // Filter placeholders based on search
  const filterPlaceholders = useCallback(
    (search: string): PlaceholderSuggestion[] => {
      if (!search) return allPlaceholders;

      return allPlaceholders.filter((placeholder) =>
        placeholder.placeholder_key.toLowerCase().includes(search.toLowerCase())
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

      textAfterAt = text.substring(atIndex + 1);
      const spaceIndex = textAfterAt.indexOf(' ');

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

  // Insert selected placeholder
  const insertPlaceholder = useCallback(
    (placeholder: PlaceholderSuggestion) => {
      const quill = quillRef.current?.getEditor();
      if (!quill) return;

      const selection = quill.getSelection();
      if (!selection) return;

      const text = quill.getText(0, selection.index);
      const atIndex = text.lastIndexOf('@');

      if (atIndex !== -1) {
        const textToDelete = selection.index - atIndex;
        quill.deleteText(atIndex, textToDelete);

        quill.insertText(atIndex, `{{${placeholder.placeholder_key}}}`, {
          bold: true,
        });

        const placeholderLength = `{{${placeholder.placeholder_key}}}`.length;

        quill.insertText(atIndex + placeholderLength, ' ', { bold: false });

        quill.setSelection({
          index: atIndex + placeholderLength + 1,
          length: 0,
        });

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
        const placeholderText = `{{${placeholder.placeholder_key}}}`;
        const newValue = textBeforeAt + placeholderText + ' ' + textAfterCursor;

        setFormData((prev: typeof formData) => ({
          ...prev,
          subject: newValue,
        }));

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

  // Handle send email with attachments
  const handleSendClick = () => {
    // Validate required fields
    const newErrors: any = {};
    if (formData.to.length === 0) newErrors.to = 'To email is required';
    if (!formData.subject.trim()) newErrors.subject = 'Subject is required';
    if (!formData.emailBody.trim())
      newErrors.emailBody = 'Email Content is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Get the first email from "to" field for recipient_name
    const recipientName =
      formData.to.length > 0 ? formData.to[0].split('@')[0] : 'User';

    // Prepare FormData for API
    const formDataToSend = new FormData();

    // Append basic fields
    formDataToSend.append('account_rid', accountID);
    formDataToSend.append('case_rid', caseId || '');
    formDataToSend.append('to_email', JSON.stringify(formData.to));
    formDataToSend.append('cc_email', JSON.stringify(formData.cc));
    formDataToSend.append('recipient_name', recipientName);
    formDataToSend.append('subject', formData.subject);
    formDataToSend.append('body_html', formData.emailBody);
    formDataToSend.append('project_id', JSON.stringify(selectedProjectIds));

    if (sortBy) formDataToSend.append('sort_by', sortBy);
    if (sortOrder) formDataToSend.append('sort_order', sortOrder);
    formDataToSend.append('filters', JSON.stringify(appliedFilters));

    // Append attachments
    formData.attachments.forEach((attachment: Attachment) => {
      if (attachment.file) {
        formDataToSend.append('files', attachment.file);
      }
    });

    sendProjectEmail.mutate(formDataToSend, {
      onSuccess: (data) => {
        successToast(data?.statusMessage || 'Email sent successfully');
        handleClose();
        setSelectedRows([]);
        setClearSelectedRows?.((prev) => !prev);
      },
      onError: (error) => {
        console.error('Failed to send email:', error);
      },
    });
  };

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

      const isInsidePopover =
        mentionPopoverRef.current && mentionPopoverRef.current.contains(target);

      if (isInsidePopover) {
        return;
      }

      const isInsideQuill =
        quillContainerRef.current && quillContainerRef.current.contains(target);

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

      const isInsidePopover =
        subjectMentionPopoverRef.current &&
        subjectMentionPopoverRef.current.contains(target);

      if (isInsidePopover) {
        return;
      }

      const isInsideInput =
        subjectInputRef.current && subjectInputRef.current.contains(target);

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

  const handleClose = () => {
    setFormData({
      to: [],
      cc: [],
      subject: '',
      emailBody: '',
      rid: '',
      attachments: [],
    });
    setToInput('');
    setCcInput('');
    setErrors({});
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className='fixed inset-0 flex items-center justify-center bg-black/50'
      style={{ zIndex: 999 }}
    >
      <React.Suspense fallback={null}>
        <div
          className='bg-white flex flex-col justify-between rounded-lg shadow-lg w-[65%] my-1.5 p-3'
          style={{ maxHeight: '600px' }}
        >
          <div className='flex justify-between items-center pb-1 border-b border-[#CBD6E2]'>
            <h2 className='text-[16px] font-bold text-[#2D3E4F]'>{title}</h2>
          </div>

          <div className='flex-1 overflow-auto'>
            {/* TO & CC Fields using EmailRecipients component */}
            <div className='px-4'>
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
                disabled={false}
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
                disabled={false}
              />
            </div>

            {/* Subject Field */}
            <div className='relative grid grid-cols-1 px-4 pt-4'>
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
                autoComplete='off'
                className={`placeholder-custom-color placeholder-[#7D98B6] truncate overflow-hidden text-ellipsis whitespace-nowrap outline-none focus:border-2 focus:border-blue-400 w-full sm:text-sm px-3 h-[32px] border border-[#CBD6E2] rounded-xs ${errors?.subject ? 'border-red-500 bg-[#FEF2F2]' : ''}`}
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
                            primary={`{{${suggestion.placeholder_key}}}`}
                            primaryTypographyProps={{
                              fontSize: '13px',
                              fontWeight:
                                index === subjectMentionState.selectionIndex
                                  ? 600
                                  : 400,
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

            {/* Email Content */}
            <div className='review-email-template-editor grid grid-cols-1 px-4 pt-4 relative'>
              <label
                htmlFor='email_body'
                className='text-[13px] text-[#2D3E4F] font-semibold leading-[21px]'
              >
                Email Content<span className='text-red-500'> *</span>
              </label>
              <div
                className='review-email-body-editor w-full relative'
                ref={quillContainerRef}
              >
                <ReactQuill
                  ref={quillRef}
                  value={formData.emailBody}
                  onChange={handleEmailBodyChange}
                  theme='snow'
                  placeholder='Enter Email Content'
                  className={`rounded-[2px] ${errors?.emailBody ? 'border border-red-500 bg-[#FEF2F2]' : 'bg-white'}`}
                  modules={modules}
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
                            primary={`{{${suggestion.placeholder_key}}}`}
                            primaryTypographyProps={{
                              fontSize: '13px',
                              fontWeight:
                                index === mentionState.selectionIndex
                                  ? 600
                                  : 400,
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

            {/* Attachments Section - Similar to EmailForm */}
            {formData.attachments.length > 0 && (
              <div className='px-4 py-4'>
                <div className='flex items-center gap-2 mb-2'>
                  <span className='text-sm font-medium text-gray-700'>
                    Attachments ({formData.attachments.length})
                  </span>
                </div>
                <div className='space-y-2 max-h-[130px] overflow-y-auto'>
                  {formData.attachments.map((attachment: Attachment) => (
                    <div
                      key={attachment.id}
                      className='flex items-center justify-between p-2 bg-gray-50 border border-gray-200 rounded-md'
                    >
                      <div className='flex items-center gap-2'>
                        <DocumentIcon className='w-6 h-6' />
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
                        className='flex items-center justify-center h-6 w-6 hover:bg-gray-200 rounded-full cursor-pointer disabled:cursor-default disabled:hover:bg-transparent transition-colors'
                      >
                        <CloseIcon className='w-3 h-3' />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className='flex gap-3 mt-6 justify-end'>
            <TextButton
              label='Cancel'
              onClick={handleClose}
              disabled={sendProjectEmail.isPending}
              sx={{
                width: '75px',
                minWidth: '75px',
                fontSize: '12px',
                fontWeight: 400,
              }}
            />
            <TextButton
              label='Send'
              onClick={handleSendClick}
              loading={sendProjectEmail.isPending}
              sx={{
                width: '64px',
                minWidth: '64px',
                fontSize: '13px',
                fontWeight: 400,
              }}
            />
          </div>
        </div>
      </React.Suspense>
    </div>
  );
};

export default EmailModalTemplate;
