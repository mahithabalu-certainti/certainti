import { REGEX_PATTERNS } from '../../../../common-utils';
import {
  ActionType,
  InteractionTemplateDetails,
  InteractionTemplateQuestion,
  InteractionTemplateQuestionPayload,
  TemplateFormPayload,
} from '../../../types';

export interface TemplateFormData {
  templateName: string;
  interactionLevel: string;
  status: string;
  questions: TemplateFormQuestion[];
  rid?: string;
  template_rid?: string;
  created_on?: string;
  created_by?: string;
  updated_on?: string;
  updated_by?: string;
}

export interface TemplateFormQuestion {
  question_seq_num: string;
  question: string;
  is_mandatory: boolean;
  is_editable?: boolean;
  notes: string;
  rid?: string;
}

export interface TemplateFormErrors {
  templateName?: string;
  interactionLevel?: string;
  status?: string;
  questions?: TemplateQuestionErrors[];
}

export interface TemplateQuestionErrors {
  question?: string;
  mandatory?: string;
  notes?: string;
}

export interface TemplateFormTableColumn {
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
): TemplateFormTableColumn[] => [
    {
      name: 'questionNo',
      label: 'Question No.',
      width: '10%',
      hide: !isEditView,
    },
    {
      name: 'question',
      label: 'Interaction Questions',
      width: '57%',
      required: true,
    },
    // { name: 'mandatory', label: 'Mandatory', width: '5%' },
    {
      name: 'notes',
      label: 'Notes',
      width: '23%',
      hide: false,
    },
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
  formData: TemplateFormData
): { isValid: boolean; errors: TemplateFormErrors } => {
  let isValid = true;
  const newErrors: TemplateFormErrors = {};
  const questionErrors: TemplateQuestionErrors[] = [];

  // Validate required fields
  if (!formData.templateName.trim()) {
    newErrors.templateName = 'Field is required';
    isValid = false;
  } else {
    if (!REGEX_PATTERNS.MIN_3.test(formData.templateName)) {
      newErrors.templateName =
        'Template Name must be more than 2 characters long';
      isValid = false;
    } else if (!REGEX_PATTERNS.MAX_64.test(formData.templateName)) {
      newErrors.templateName = 'Template Name must not exceed 64 characters';
      isValid = false;
    } else if (
      !REGEX_PATTERNS.TEMPLATE_NAME_REGEX.test(formData.templateName)
    ) {
      newErrors.templateName =
        "Template Name must contain only letters, numbers, spaces, apostrophes('), and hyphens(-).";
      isValid = false;
    }
  }

  if (!formData.interactionLevel) {
    newErrors.interactionLevel = 'Field is required';
    isValid = false;
  }

  if (!formData.status) {
    newErrors.status = 'Field is required';
    isValid = false;
  }

  // Validate questions
  formData.questions.forEach((question) => {
    const currentQuestionErrors: TemplateQuestionErrors = {};

    if (!question.question.trim()) {
      currentQuestionErrors.question = 'Field is required';
      isValid = false;
    }

    if (!REGEX_PATTERNS.MAX_2000.test(question.question)) {
      currentQuestionErrors.question =
        'Interaction Question must be within 2000 characters';
      isValid = false;
    }

    if (!REGEX_PATTERNS.MAX_2000.test(question.notes)) {
      currentQuestionErrors.notes = 'Notes must be within 2000 characters';
      isValid = false;
    }

    questionErrors.push(currentQuestionErrors);
  });

  newErrors.questions = questionErrors;

  return { isValid, errors: newErrors };
};

export const hasTemplateFormChanged = (
  formData: TemplateFormData,
  originalData?: TemplateFormData
): boolean => {
  if (!originalData) return true;

  const getNormalizedQuestions = (questions: TemplateFormQuestion[]) =>
    questions.map((q) => ({
      question: q.question,
      notes: q.notes,
      is_mandatory: q.is_mandatory,
      is_editable: q.is_editable,
      rid: q.rid,
    }));

  const questionsChanged =
    JSON.stringify(getNormalizedQuestions(formData.questions)) !==
    JSON.stringify(getNormalizedQuestions(originalData.questions));

  const basicInfoChanged =
    formData.templateName !== originalData.templateName ||
    formData.interactionLevel !== originalData.interactionLevel ||
    formData.status !== originalData.status;

  return questionsChanged || basicInfoChanged;
};

export const questionsTransformPayload = (
  formQuestions: TemplateFormQuestion[],
  isEdit: boolean = false,
  existingQuestions: InteractionTemplateQuestion[] = []
): InteractionTemplateQuestionPayload[] => {
  const transformedQuestions: InteractionTemplateQuestionPayload[] = [];
  const retainedRids = new Set<string>();
  const seenQuestionNos = new Set<string>();

  // Process form questions first
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  formQuestions.forEach(({ question_seq_num, is_editable, ...question }) => {
    if (seenQuestionNos.has(question_seq_num)) {
      return;
    }
    seenQuestionNos.add(question_seq_num);

    if (isEdit && question.rid) {
      retainedRids.add(question.rid);
      transformedQuestions.push({
        ...question,
        action_type: ActionType.Edit,
      });
    } else if (!question.rid) {
      transformedQuestions.push({
        ...question,
        action_type: ActionType.Add,
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
          notes: existingQues.notes || '',
          is_mandatory: existingQues.is_mandatory ?? false,
          action_type: ActionType.Delete,
        });
        seenQuestionNos.add(question_seq_num);
      }
    });
  }

  return transformedQuestions;
};

export const transformTemplatePayload = (
  formData: TemplateFormData,
  isEditView: boolean = false,
  originalData?: InteractionTemplateDetails
): TemplateFormPayload => {
  const transformedQuestions = questionsTransformPayload(
    formData.questions,
    isEditView,
    originalData?.questions || []
  );

  const payload: TemplateFormPayload = {
    template_name: formData.templateName,
    interaction_level_rid: formData.interactionLevel,
    status_rid: formData.status,
    questions: transformedQuestions,
  };

  if (isEditView && originalData) {
    return {
      ...payload,
      template_rid: originalData.template_rid,
    };
  }

  return payload;
};
