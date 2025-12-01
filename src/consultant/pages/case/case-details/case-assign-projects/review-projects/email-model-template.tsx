/* eslint-disable @typescript-eslint/no-explicit-any */
import React, {
  useRef,
  useState,
  useCallback,
  useEffect,
  useMemo,
} from 'react';
import TextButton from '../../../../../../components/button/text-button';
import {
  Box,
  List,
  ListItem,
  ListItemText,
  Popover,
  Chip,
  Paper,
} from '@mui/material';
import ReactQuill from 'react-quill';
import { CloseIcon } from '../../../../../../assets';
import {
  useEmailTemplatePreview,
  useSendProjectsForReview,
} from '../../../../../services/cases-assign-projects/review-project-service';
import { useParams, useSearchParams } from 'react-router-dom';
import { useGetUserOptions } from '../../../../../services/case-team';
import { ReviewProject } from '../../../../../types/assign-projects';
import { SortDirection } from '../../../../../../components/table/types';
import { useToast } from '../../../../../../hooks';

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

// Types for email recipients
interface CaseOwner {
  rid: string;
  name: string;
  email: string;
}

interface SuggestionState {
  suggestions: CaseOwner[];
  highlightedIndex: number;
}

// Interface for API response
interface TemplatePreviewData {
  to_email: string[];
  cc_email: string[];
  subject: string;
  body_html: string;
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
  });
  const [errors, setErrors] = useState<any>({});

  const { caseId } = useParams();
  const [searchParams] = useSearchParams();
  const accountID = searchParams.get('accountID') ?? '';
  // Email input states
  const [toInput, setToInput] = useState('');
  const [ccInput, setCcInput] = useState('');

  const [toSuggestions, setToSuggestions] = useState<SuggestionState>({
    suggestions: [],
    highlightedIndex: 0,
  });
  const [ccSuggestions, setCcSuggestions] = useState<SuggestionState>({
    suggestions: [],
    highlightedIndex: 0,
  });

  const [showToSuggestions, setShowToSuggestions] = useState(false);
  const [showCcSuggestions, setShowCcSuggestions] = useState(false);

  // Refs
  const quillRef = useRef<ReactQuill>(null);
  const mentionPopoverRef = useRef<HTMLDivElement>(null);
  const quillContainerRef = useRef<HTMLDivElement>(null);
  const subjectInputRef = useRef<HTMLInputElement>(null);
  const subjectMentionPopoverRef = useRef<HTMLDivElement>(null);
  const toInputRef = useRef<HTMLInputElement>(null);
  const ccInputRef = useRef<HTMLInputElement>(null);
  const toSuggestionsRef = useRef<HTMLDivElement>(null);
  const ccSuggestionsRef = useRef<HTMLDivElement>(null);

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

  const caseOwnerOptions = userEmailOptions.data || [];

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
      });
      setToInput('');
      setCcInput('');
      setErrors({});
    }
  }, [isOpen]);

  const selectedProjectIds = selectedRows.map((project) => project.rid);
  const sendProjectEmail = useSendProjectsForReview();

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

    // Get the first email from "to" field for recipient_name (you might want to adjust this logic)
    const recipientName =
      formData.to.length > 0 ? formData.to[0].split('@')[0] : 'User';

    const params = {
      case_rid: caseId || '',
      account_rid: accountID,
      to_email: formData.to, // Use the array directly from formData.to
      cc_email: formData.cc, // Use the array directly from formData.cc
      recipient_name: recipientName,
      subject: formData.subject,
      body_html: formData.emailBody,
      project_id: selectedProjectIds,
      sort_by: sortBy,
      sort_order: sortOrder,
      filters: appliedFilters,
    };

    sendProjectEmail.mutate(params, {
      onSuccess: (data) => {
        console.log('Email sent successfully:', data);
        successToast(data?.message || 'Email sent successfully'); // Use data.message
        handleClose();
        setSelectedRows([]);
        setClearSelectedRows?.((prev) => !prev);
      },
      onError: (error) => {
        console.error('Failed to send email:', error);
        // You might want to show an error toast here
      },
    });
  };

  // Mock data for placeholders - replace with your actual data source
  const allPlaceholders = useMemo((): PlaceholderSuggestion[] => {
    return [
      { rid: '1', placeholder_key: 'customer_name', applicable_to: 'both' },
      { rid: '2', placeholder_key: 'order_number', applicable_to: 'both' },
      { rid: '3', placeholder_key: 'due_date', applicable_to: 'body' },
      { rid: '4', placeholder_key: 'amount', applicable_to: 'body' },
      { rid: '5', placeholder_key: 'company_name', applicable_to: 'both' },
    ];
  }, []);

  // Get all selected emails to avoid duplicates
  const allSelectedEmails = useMemo(() => {
    return [...formData.to, ...formData.cc];
  }, [formData.to, formData.cc]);

  const normalizeQuillValue = (value: string): string => {
    if (!value) return '';

    const cleaned = value
      .replace(/<(.|\n)*?>/g, '') // remove all HTML tags
      .replace(/&nbsp;/g, '') // remove non-breaking spaces
      .trim();

    // If nothing left after cleaning, treat it as empty string
    return cleaned.length === 0 ? '' : value;
  };

  // Email validation
  const isValidEmail = useCallback((email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
  }, []);

  // Filter email suggestions
  const filterEmailSuggestions = useCallback(
    (searchText: string): CaseOwner[] => {
      if (!searchText.trim()) return [];

      const lowerSearch = searchText.toLowerCase();
      const filtered = caseOwnerOptions.filter(
        (owner) =>
          (owner.name.toLowerCase().includes(lowerSearch) ||
            owner?.email?.toLowerCase().includes(lowerSearch)) &&
          !allSelectedEmails.includes(owner.email)
      );

      // Add typed email as option if valid
      const typedEmail = searchText.trim();
      if (
        isValidEmail(typedEmail) &&
        !filtered.some((s) => s.email === typedEmail) &&
        !allSelectedEmails.includes(typedEmail)
      ) {
        filtered.push({
          rid: 'typed',
          name: typedEmail,
          email: typedEmail,
        });
      }

      return filtered.filter((owner): owner is CaseOwner => !!owner.email);
    },
    [caseOwnerOptions, allSelectedEmails, isValidEmail]
  );

  // Handle TO input changes
  const handleToInputChange = useCallback(
    (value: string) => {
      setToInput(value);

      // If only '@' → show full list
      if (value === '@') {
        setToSuggestions({
          suggestions: caseOwnerOptions.filter(
            (o): o is CaseOwner => !!o.email
          ),
          highlightedIndex: 0,
        });
        setShowToSuggestions(true);
        return;
      }

      // If value starts with '@' but has more characters
      if (value.startsWith('@')) {
        const query = value.substring(1); // Remove '@'
        const suggestions = filterEmailSuggestions(query);
        setToSuggestions({
          suggestions,
          highlightedIndex: 0,
        });
        setShowToSuggestions(suggestions.length > 0);
        return;
      }

      // Normal behavior
      if (value.trim()) {
        const suggestions = filterEmailSuggestions(value);
        setToSuggestions({
          suggestions,
          highlightedIndex: 0,
        });
        setShowToSuggestions(suggestions.length > 0);
      } else {
        setShowToSuggestions(false);
        setToSuggestions({ suggestions: [], highlightedIndex: 0 });
      }
    },
    [filterEmailSuggestions, caseOwnerOptions]
  );

  // Handle CC input changes
  const handleCcInputChange = useCallback(
    (value: string) => {
      setCcInput(value);

      // If only '@' → show full list
      if (value === '@') {
        setCcSuggestions({
          suggestions: caseOwnerOptions.filter(
            (o): o is CaseOwner => !!o.email
          ),
          highlightedIndex: 0,
        });
        setShowCcSuggestions(true);
        return;
      }

      // If value starts with '@' but has more characters
      if (value.startsWith('@')) {
        const query = value.substring(1); // Remove '@'
        const suggestions = filterEmailSuggestions(query);
        setCcSuggestions({
          suggestions,
          highlightedIndex: 0,
        });
        setShowCcSuggestions(suggestions.length > 0);
        return;
      }

      // Normal behavior
      if (value.trim()) {
        const suggestions = filterEmailSuggestions(value);
        setCcSuggestions({
          suggestions,
          highlightedIndex: 0,
        });
        setShowCcSuggestions(suggestions.length > 0);
      } else {
        setShowCcSuggestions(false);
        setCcSuggestions({ suggestions: [], highlightedIndex: 0 });
      }
    },
    [filterEmailSuggestions, caseOwnerOptions]
  );

  // Add email to field
  const addEmailToField = useCallback(
    (field: 'to' | 'cc', email: string) => {
      if (
        !email.trim() ||
        !isValidEmail(email) ||
        allSelectedEmails.includes(email)
      ) {
        return;
      }

      const cleanEmail = email.trim();
      setFormData((prev: typeof formData) => ({
        ...prev,
        [field]: [...prev[field], cleanEmail],
      }));

      // Clear input and close suggestions
      if (field === 'to') {
        setToInput('');
        setShowToSuggestions(false);
        setToSuggestions({ suggestions: [], highlightedIndex: 0 });
        toInputRef.current?.focus();
      } else {
        setCcInput('');
        setShowCcSuggestions(false);
        setCcSuggestions({ suggestions: [], highlightedIndex: 0 });
        ccInputRef.current?.focus();
      }

      setErrors((prev: Record<string, string>) => ({ ...prev, [field]: '' }));
    },
    [allSelectedEmails, isValidEmail]
  );

  // Handle TO keyboard events
  const handleToKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (!showToSuggestions) {
        if ((e.key === 'Enter' || e.key === 'Tab') && toInput.trim()) {
          e.preventDefault();
          if (isValidEmail(toInput)) {
            addEmailToField('to', toInput.trim());
          }
        }
        return;
      }

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setToSuggestions((prev) => ({
            ...prev,
            highlightedIndex: Math.min(
              prev.highlightedIndex + 1,
              prev.suggestions.length - 1
            ),
          }));
          break;

        case 'ArrowUp':
          e.preventDefault();
          setToSuggestions((prev) => ({
            ...prev,
            highlightedIndex: Math.max(prev.highlightedIndex - 1, 0),
          }));
          break;

        case 'Enter':
        case 'Tab':
          e.preventDefault();
          if (toSuggestions.suggestions[toSuggestions.highlightedIndex]) {
            const selectedSuggestion =
              toSuggestions.suggestions[toSuggestions.highlightedIndex];
            addEmailToField('to', selectedSuggestion.email);
          }
          break;

        case 'Escape':
          e.preventDefault();
          setShowToSuggestions(false);
          break;
      }
    },
    [showToSuggestions, toInput, toSuggestions, isValidEmail, addEmailToField]
  );

  // Handle CC keyboard events
  const handleCcKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (!showCcSuggestions) {
        if ((e.key === 'Enter' || e.key === 'Tab') && ccInput.trim()) {
          e.preventDefault();
          if (isValidEmail(ccInput)) {
            addEmailToField('cc', ccInput.trim());
          }
        }
        return;
      }

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setCcSuggestions((prev) => ({
            ...prev,
            highlightedIndex: Math.min(
              prev.highlightedIndex + 1,
              prev.suggestions.length - 1
            ),
          }));
          break;

        case 'ArrowUp':
          e.preventDefault();
          setCcSuggestions((prev) => ({
            ...prev,
            highlightedIndex: Math.max(prev.highlightedIndex - 1, 0),
          }));
          break;

        case 'Enter':
        case 'Tab':
          e.preventDefault();
          if (ccSuggestions.suggestions[ccSuggestions.highlightedIndex]) {
            const selectedSuggestion =
              ccSuggestions.suggestions[ccSuggestions.highlightedIndex];
            addEmailToField('cc', selectedSuggestion.email);
          }
          break;

        case 'Escape':
          e.preventDefault();
          setShowCcSuggestions(false);
          break;
      }
    },
    [showCcSuggestions, ccInput, ccSuggestions, isValidEmail, addEmailToField]
  );

  // Handle suggestion click
  const handleEmailSuggestionClick = useCallback(
    (field: 'to' | 'cc', email: string) => {
      addEmailToField(field, email);
    },
    [addEmailToField]
  );

  // Remove recipient
  const removeRecipient = useCallback((field: 'to' | 'cc', index: number) => {
    setFormData((prev: typeof formData) => ({
      ...prev,
      [field]: prev[field].filter((_: string, i: number) => i !== index),
    }));
  }, []);

  // Handle input changes
  // const handleInputChange = (
  //   field: keyof typeof formData,
  //   value: string | string[]
  // ) => {
  //   if (field === 'emailBody') {
  //     value = normalizeQuillValue(value as string);
  //   }

  //   setFormData((prev) => ({ ...prev, [field]: value }));
  //   setErrors((prev) => ({ ...prev, [field]: '' }));
  // };

  // Handle Quill editor changes for mention functionality
  const handleEmailBodyChange = (value: string) => {
    const normalizedValue = normalizeQuillValue(value);
    setFormData((prev: typeof formData) => ({
      ...prev,
      emailBody: normalizedValue,
    }));
    setErrors((prev: any) => ({ ...prev, emailBody: '' }));

    // Check for "@" trigger for mentions (use setTimeout to avoid blocking)
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
        quill.insertText(atIndex, `{{${placeholder.placeholder_key}}}`, {
          bold: true,
        });

        const placeholderLength = `{{${placeholder.placeholder_key}}}`.length;

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
        const placeholderText = `{{${placeholder.placeholder_key}}}`;
        const newValue = textBeforeAt + placeholderText + ' ' + textAfterCursor;

        setFormData((prev: typeof formData) => ({
          ...prev,
          subject: newValue,
        }));

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

  // Close email suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;

      // Check TO field
      if (
        !toInputRef.current?.contains(target) &&
        !toSuggestionsRef.current?.contains(target)
      ) {
        setShowToSuggestions(false);
      }

      // Check CC field
      if (
        !ccInputRef.current?.contains(target) &&
        !ccSuggestionsRef.current?.contains(target)
      ) {
        setShowCcSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

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

  const handleClose = () => {
    // Reset form when closing
    setFormData({
      to: [],
      cc: [],
      subject: '',
      emailBody: '',
      rid: '',
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
      <div
        className='bg-white flex flex-col justify-between rounded-lg shadow-lg w-[65%] my-1.5 p-3'
        style={{ maxHeight: '600px' }}
      >
        <div className='flex justify-between items-center pb-1 border-b border-[#CBD6E2]'>
          <h2 className='text-[16px] font-bold text-[#2D3E4F]'>{title}</h2>
        </div>

        <div className='flex-1 overflow-auto'>
          {/* To Email Field */}
          <div className='grid grid-cols-1 px-4 pt-4'>
            <label
              htmlFor='to'
              className='text-[13px] text-[#2D3E4F] font-semibold leading-[21px]'
            >
              To<span className='text-red-500'> *</span>
            </label>
            <div className='relative'>
              <div
                className={`flex flex-wrap items-center gap-2 p-2 border rounded-[2px] min-h-[32px] max-h-[95px] overflow-y-auto bg-white ${
                  errors?.to
                    ? 'border-red-500 bg-red-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                {/* Display selected emails as chips */}
                {formData.to.map((email: string, index: number) => (
                  <Chip
                    key={index}
                    label={email}
                    size='small'
                    onDelete={() => removeRecipient('to', index)}
                    deleteIcon={<CloseIcon />}
                    className='bg-blue-400 text-blue-900'
                    sx={{
                      fontSize: '12px',
                      height: '18px',
                      '& .MuiChip-deleteIcon': {
                        fontSize: '12px',
                        cursor: 'pointer',
                      },
                    }}
                  />
                ))}

                {/* Input field for TO */}
                <input
                  ref={toInputRef}
                  type='text'
                  value={toInput}
                  onChange={(e) => handleToInputChange(e.target.value)}
                  onKeyDown={handleToKeyDown}
                  onFocus={() => {
                    if (
                      toInput.trim() &&
                      toSuggestions.suggestions.length > 0
                    ) {
                      setShowToSuggestions(true);
                    }
                  }}
                  placeholder='Type email or name...'
                  className='flex-1 min-w-[120px] border-none outline-none bg-transparent text-sm'
                />
              </div>

              {/* Suggestions Dropdown for TO */}
              {showToSuggestions && toSuggestions.suggestions.length > 0 && (
                <Paper
                  ref={toSuggestionsRef}
                  className='absolute z-50 min-w-[250px] max-w-[400px] top-full left-0 mt-1'
                  sx={{
                    maxHeight: '300px',
                    overflowY: 'auto',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                  }}
                >
                  <List sx={{ padding: 0 }}>
                    {toSuggestions.suggestions.map((suggestion, index) => (
                      <ListItem
                        key={`${suggestion.rid}-${index}`}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          handleEmailSuggestionClick('to', suggestion.email);
                        }}
                        onMouseEnter={() =>
                          setToSuggestions((prev) => ({
                            ...prev,
                            highlightedIndex: index,
                          }))
                        }
                        sx={{
                          cursor: 'pointer',
                          backgroundColor:
                            index === toSuggestions.highlightedIndex
                              ? '#e0e7ff'
                              : 'transparent',
                          '&:hover': {
                            backgroundColor: '#e0e7ff',
                          },
                          padding: '8px 12px',
                          borderBottom:
                            index !== toSuggestions.suggestions.length - 1
                              ? '1px solid #f0f0f0'
                              : 'none',
                        }}
                      >
                        <ListItemText
                          primary={suggestion.name}
                          secondary={suggestion.email}
                          primaryTypographyProps={{
                            fontSize: '13px',
                            fontWeight:
                              index === toSuggestions.highlightedIndex
                                ? 600
                                : 400,
                          }}
                          secondaryTypographyProps={{
                            fontSize: '12px',
                            color: '#666',
                          }}
                        />
                      </ListItem>
                    ))}
                  </List>
                </Paper>
              )}
            </div>

            {errors?.to && (
              <span className='text-xs text-red-500'>{errors.to}</span>
            )}
          </div>

          {/* CC Email Field */}
          <div className='grid grid-cols-1 px-4 pt-4'>
            <label
              htmlFor='cc'
              className='text-[13px] text-[#2D3E4F] font-semibold leading-[21px]'
            >
              CC
            </label>
            <div className='relative'>
              <div
                className={`flex flex-wrap items-center gap-2 p-2 border rounded-[2px] min-h-[32px] max-h-[95px] overflow-y-auto bg-white ${
                  errors?.cc
                    ? 'border-red-500 bg-red-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                {/* Display selected emails as chips */}
                {formData.cc.map((email: string, index: number) => (
                  <Chip
                    key={index}
                    label={email}
                    size='small'
                    onDelete={() => removeRecipient('cc', index)}
                    deleteIcon={<CloseIcon />}
                    className='bg-blue-100 text-blue-900'
                    sx={{
                      fontSize: '13px',
                      height: '28px',
                      '& .MuiChip-deleteIcon': {
                        fontSize: '16px',
                        cursor: 'pointer',
                      },
                    }}
                  />
                ))}

                {/* Input field for CC */}
                <input
                  ref={ccInputRef}
                  type='text'
                  value={ccInput}
                  onChange={(e) => handleCcInputChange(e.target.value)}
                  onKeyDown={handleCcKeyDown}
                  onFocus={() => {
                    if (
                      ccInput.trim() &&
                      ccSuggestions.suggestions.length > 0
                    ) {
                      setShowCcSuggestions(true);
                    }
                  }}
                  placeholder='Type email or name...'
                  className='flex-1 min-w-[120px] border-none outline-none bg-transparent text-sm'
                />
              </div>

              {/* Suggestions Dropdown for CC */}
              {showCcSuggestions && ccSuggestions.suggestions.length > 0 && (
                <Paper
                  ref={ccSuggestionsRef}
                  className='absolute z-50 min-w-[250px] max-w-[400px] top-full left-0 mt-1'
                  sx={{
                    maxHeight: '300px',
                    overflowY: 'auto',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                  }}
                >
                  <List sx={{ padding: 0 }}>
                    {ccSuggestions.suggestions.map((suggestion, index) => (
                      <ListItem
                        key={`${suggestion.rid}-${index}`}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          handleEmailSuggestionClick('cc', suggestion.email);
                        }}
                        onMouseEnter={() =>
                          setCcSuggestions((prev) => ({
                            ...prev,
                            highlightedIndex: index,
                          }))
                        }
                        sx={{
                          cursor: 'pointer',
                          backgroundColor:
                            index === ccSuggestions.highlightedIndex
                              ? '#e0e7ff'
                              : 'transparent',
                          '&:hover': {
                            backgroundColor: '#e0e7ff',
                          },
                          padding: '8px 12px',
                          borderBottom:
                            index !== ccSuggestions.suggestions.length - 1
                              ? '1px solid #f0f0f0'
                              : 'none',
                        }}
                      >
                        <ListItemText
                          primary={suggestion.name}
                          secondary={suggestion.email}
                          primaryTypographyProps={{
                            fontSize: '13px',
                            fontWeight:
                              index === ccSuggestions.highlightedIndex
                                ? 600
                                : 400,
                          }}
                          secondaryTypographyProps={{
                            fontSize: '12px',
                            color: '#666',
                          }}
                        />
                      </ListItem>
                    ))}
                  </List>
                </Paper>
              )}
            </div>

            {errors?.cc && (
              <span className='text-xs text-red-500'>{errors.cc}</span>
            )}
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
              <span className='text-[12px] text-red-400'>{errors.subject}</span>
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
                  {subjectMentionState.suggestions.map((suggestion, index) => (
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
                  ))}
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
                modules={{
                  toolbar: [
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
                          primary={`{{${suggestion.placeholder_key}}}`}
                          primaryTypographyProps={{
                            fontSize: '13px',
                            fontWeight:
                              index === mentionState.selectionIndex ? 600 : 400,
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
        </div>

        <div className='flex gap-3 mt-6 justify-end'>
          <TextButton
            label='Cancel'
            onClick={handleClose}
            disabled={false}
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
    </div>
  );
};

export default EmailModalTemplate;
