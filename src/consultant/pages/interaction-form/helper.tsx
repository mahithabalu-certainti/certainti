import { REGEX_PATTERNS } from '../../../common-utils';
import { InteractionData, InteractionTableColumn } from './types';

export const getQuestionTableColumns = (
  isEditView: boolean
): InteractionTableColumn[] => [
  {
    name: 'questionNo',
    label: 'Question No.',
    width: '100px',
    hide: !isEditView,
  },
  {
    name: 'question',
    label: 'Interaction Questions',
    width: '400px',
    required: true,
  },
  { name: 'mandatory', label: 'Option(Default) / Mandatory', width: '220px' },
  {
    name: 'notes',
    label: 'Notes',
    width: '300px',
    hide: false,
  },
  {
    name: 'action',
    label: 'Action',
    width: '90px',
    align: 'center',
    hide: false,
  },
];

interface FormErrors {
  projectCode?: string;
  projectName?: string;
  fiscalYear?: string;
}

export const validateInteractionForm = (
  formData: InteractionData,
  source: string | null
): { isValid: boolean; updatedData: InteractionData } => {
  let isValid = true;
  const errors: FormErrors = {};

  // Validate project fields when source is account
  if (source === 'account') {
    if (!formData.projectCode) {
      errors.projectCode = 'Project Code is required';
      isValid = false;
    }
    if (!formData.projectName) {
      errors.projectName = 'Project Name is required';
      isValid = false;
    }
    if (!formData.fiscalYear) {
      errors.fiscalYear = 'Fiscal Year is required';
      isValid = false;
    }
  }

  // Validate questions
  const updatedQuestions = formData.questions.map((question) => {
    const questionErrors: {
      question?: string;
      mandatory?: string;
      notes?: string;
    } = {};

    if (!question.question.trim()) {
      questionErrors.question = 'Interaction Questions is required';
      isValid = false;
    }

    if (!REGEX_PATTERNS.MAX_2000.test(question.notes)) {
      questionErrors.notes = 'Max length exceeded';
      isValid = false;
    }

    return {
      ...question,
      errors:
        Object.keys(questionErrors).length > 0 ? questionErrors : undefined,
    };
  });

  const updatedData: InteractionData = {
    ...formData,
    questions: updatedQuestions,
    errors: Object.keys(errors).length > 0 ? errors : undefined,
  };

  return { isValid, updatedData };
};
