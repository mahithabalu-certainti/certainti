import { REGEX_PATTERNS } from '../../../../common-utils';
import {
  ChecklistTemplateDetails,
  ChecklistTemplateFormPayload,
  ChecklistTemplateQuestion,
  ChecklistTemplateQuestionPayload,
  QustionActionType,
  CreateTemplatePayload,
} from '../../../types';

export const COMMON_SELECT_STYLES = {
  height: '32px',
  fontSize: '13px',
  padding: '6px 4px',
  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
    border: '2px solid #60A5FA',
  },
  '& .MuiOutlinedInput-root': {
    '&.Mui-focused': { boxShadow: 'none' },
  },
  '.MuiSelect-select': {
    padding: '6px 6px',
  },
  '&.Mui-disabled': { backgroundColor: '#f3f4f6' },
  '& .MuiOutlinedInput-notchedOutline': {
    borderRadius: '2px',
  },
  '&:hover .MuiOutlinedInput-notchedOutline': {
    border: '1px solid #CBD6E2',
  },
  '& .MuiSvgIcon-root': {
    color: '#7D98B6',
  },
};

export const COMMON_MENU_PROPS = {
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
};

export interface ChecklistTemplateFormData {
  checklist_name: string;
  description: string;
  status: string;
  questions: ChecklistTemplateFormQuestion[];
  rid?: string;
  checklist_rid?: string;
  created_on?: string;
  created_by?: string;
  updated_on?: string;
  updated_by?: string;
}

export interface ChecklistTemplateFormQuestion {
  question_seq_num: string;
  question: string;
  description: string;
  // is_mandatory: boolean;
  // is_editable?: boolean;
  // notes: string;
  rid?: string;
}

export interface ChecklistTemplateFormErrors {
  checklist_name?: string;
  description?: string;
  status?: string;
  questions?: ChecklistTemplateQuestionErrors[];
}

export interface ChecklistTemplateQuestionErrors {
  question?: string;
  // mandatory?: string;
  // notes?: string;
}

export interface ChecklistTemplateFormTableColumn {
  name: string;
  label: string;
  width?: string;
  align?: 'left' | 'right' | 'center';
  required?: boolean;
  disabled?: boolean;
  hide?: boolean;
}

export enum QuestionUpdate {
  Add = 'ADD',
  Edit = 'EDIT',
  Delete = 'DELETE',
}

export const getQuestionTableColumns = (
  isEditView: boolean
): ChecklistTemplateFormTableColumn[] => [
  {
    name: 'questionNo',
    label: 'Question No.',
    width: '10%',
    hide: !isEditView,
  },
  {
    name: 'question',
    label: 'Checklist Questions',
    width: '40%',
    required: true,
  },
  {
    name: 'description',
    label: 'Description',
    width: '40%',
    required: true,
  },
  // { name: 'mandatory', label: 'Mandatory', width: '5%' },
  // {
  //   name: 'notes',
  //   label: 'Notes',
  //   width: '23%',
  //   hide: false,
  // },
  {
    name: 'action',
    label: 'Action',
    width: '5%',
    align: 'center',
    hide: false,
  },
];

export const shouldHideField = (
  fieldName: string,
  isEditView: boolean,
  permissionMap: Record<string, { read: boolean; edit: boolean }>
): boolean => {
  if (!permissionMap || !permissionMap[fieldName]) {
    return false;
  }

  const fieldPermissions = permissionMap[fieldName];
  if (isEditView) {
    return !fieldPermissions.read && !fieldPermissions.edit;
  }
  return false;
};

export const shouldDisableField = (
  fieldName: string,
  isEditView: boolean,
  permissionMap: Record<string, { read: boolean; edit: boolean }>
): boolean => {
  if (!permissionMap || !permissionMap[fieldName]) {
    return false;
  }

  const fieldPermissions = permissionMap[fieldName];
  if (isEditView) {
    return fieldPermissions.read && !fieldPermissions.edit;
  }
  return false;
};

export const validateTemplateForm = (
  formData: ChecklistTemplateFormData
): { isValid: boolean; errors: ChecklistTemplateFormErrors } => {
  let isValid = true;
  const newErrors: ChecklistTemplateFormErrors = {};
  const questionErrors: ChecklistTemplateQuestionErrors[] = [];

  // Validate required fields
  if (!formData.checklist_name.trim()) {
    newErrors.checklist_name = 'Field is required';
    isValid = false;
  } else {
    if (!REGEX_PATTERNS.MIN_3.test(formData.checklist_name)) {
      newErrors.checklist_name =
        'Checklist Name must be more than 2 characters long';
      isValid = false;
    } else if (!REGEX_PATTERNS.MAX_64.test(formData.checklist_name)) {
      newErrors.checklist_name = 'Checklist Name must not exceed 64 characters';
      isValid = false;
    } else if (
      !REGEX_PATTERNS.TEMPLATE_NAME_REGEX.test(formData.checklist_name)
    ) {
      newErrors.checklist_name =
        "Checklist Name must contain only letters, numbers, spaces, apostrophes('), and hyphens(-).";
      isValid = false;
    }
  }

  if (!REGEX_PATTERNS.MAX_2000.test(formData.description)) {
    newErrors.description = 'Description must be within 2000 characters';
    isValid = false;
  }

  if (!formData.status) {
    newErrors.status = 'Field is required';
    isValid = false;
  }

  // Validate questions
  formData.questions.forEach((question) => {
    const currentQuestionErrors: ChecklistTemplateQuestionErrors = {};

    if (!question.question.trim()) {
      currentQuestionErrors.question = 'Field is required';
      isValid = false;
    }

    if (!REGEX_PATTERNS.MAX_2000.test(question.question)) {
      currentQuestionErrors.question =
        'Checklist Question must be within 2000 characters';
      isValid = false;
    }

    // if (!REGEX_PATTERNS.MAX_2000.test(question.notes)) {
    //   currentQuestionErrors.notes = 'Notes must be within 2000 characters';
    //   isValid = false;
    // }

    questionErrors.push(currentQuestionErrors);
  });

  newErrors.questions = questionErrors;

  return { isValid, errors: newErrors };
};

export const questionsTransformPayload = (
  formQuestions: ChecklistTemplateFormQuestion[],
  isEdit: boolean = false,
  existingQuestions: ChecklistTemplateQuestion[] = []
): ChecklistTemplateQuestionPayload[] => {
  const transformedQuestions: ChecklistTemplateQuestionPayload[] = [];
  const retainedRids = new Set<string>();
  const seenQuestionNos = new Set<string>();

  // Process form questions first
  formQuestions.forEach(({ question_seq_num, ...question }) => {
    if (seenQuestionNos.has(question_seq_num)) {
      return;
    }
    seenQuestionNos.add(question_seq_num);

    if (isEdit && question.rid) {
      retainedRids.add(question.rid);
      transformedQuestions.push({
        ...question,
        action_type: QustionActionType.Edit,
      });
    } else if (!question.rid) {
      transformedQuestions.push({
        ...question,
        action_type: QustionActionType.Add,
      });
    }
  });

  if (isEdit) {
    existingQuestions.forEach(({ question_seq_num, ...existingQues }) => {
      if (
        existingQues.rid &&
        !retainedRids.has(existingQues.rid) &&
        !seenQuestionNos.has(question_seq_num)
      ) {
        transformedQuestions.push({
          rid: existingQues.rid,
          question: existingQues.question || '',
          // notes: existingQues.notes || '',
          // is_mandatory: existingQues.is_mandatory ?? false,
          action_type: QustionActionType.Delete,
        });
        seenQuestionNos.add(question_seq_num);
      }
    });
  }

  return transformedQuestions;
};

export const transformChecklistTemplatePayload = (
  formData: ChecklistTemplateFormData,
  isEditView: boolean = false,
  originalData?: ChecklistTemplateDetails
): ChecklistTemplateFormPayload => {
  const transformedQuestions = questionsTransformPayload(
    formData.questions,
    isEditView,
    originalData?.questions || []
  );

  const payload: ChecklistTemplateFormPayload = {
    checklist_name: formData.checklist_name,
    description: formData.description,
    status_rid: formData.status,
    questions: transformedQuestions,
  };

  if (isEditView && originalData) {
    return {
      ...payload,
      checklist_rid: originalData.rid,
    };
  }

  return payload;
};

export const transformToNewCreateTemplatePayload = (
  formData: ChecklistTemplateFormData
): CreateTemplatePayload => {
  const payload: CreateTemplatePayload = {
    checklist_name: formData.checklist_name,
    checklist_description: formData.description,
    status_rid: formData.status,
    checklist_items: formData.questions.map((question, index) => ({
      checklist_item_name: question.question,
      sequence_no: index + 1,
      description: question.description || question.question,
      action_type: 'add' as const,
    })),
  };

  return payload;
};

export const getSelectStyles = (hasError: boolean, isEmpty: boolean) => ({
  ...COMMON_SELECT_STYLES,
  '.MuiSelect-select': {
    ...COMMON_SELECT_STYLES['.MuiSelect-select'],
    color: isEmpty ? '#7D98B6' : 'black',
  },
  '& .MuiOutlinedInput-notchedOutline': {
    border: hasError ? '1px solid #ef4444' : '1px solid #CBD6E2',
    borderRadius: '2px',
  },
  '&:hover .MuiOutlinedInput-notchedOutline': {
    border: hasError ? '1px solid #ef4444' : '1px solid #CBD6E2',
  },
});
