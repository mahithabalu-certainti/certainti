import { REGEX_PATTERNS } from '../../../../common-utils';
import {
  InteractionDetails,
  InteractionFormData,
  InteractionFormErrors,
  InteractionFormPayload,
  InteractionFormQuestion,
  InteractionFormTableColumn,
  InteractionQuestion,
  InteractionQuestionErrors,
  InteractionQuestionPayload,
  QuestionUpdate,
  StatusActionEnum,
} from '../../../types';

export interface ProjectDetails {
  project_code: string;
  project_name: string;
  fiscal_year: number;
  account_name: string;
  account_rid: string;
  project_rid: string;
  project_fiscal_rid: string;
}

export const getQuestionTableColumns = (
  isEditView: boolean
): InteractionFormTableColumn[] => [
  {
    name: 'questionNo',
    label: 'Question No.',
    width: '7%',
    hide: !isEditView,
  },
  {
    name: 'question',
    label: 'Interaction Questions',
    width: '60%',
    required: true,
  },
  { name: 'mandatory', label: 'Mandatory', width: '8%' },
  {
    name: 'notes',
    label: 'Notes',
    width: '20%',
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

export const validateInteractionForm = (
  formData: InteractionFormData,
  source: string | null,
  isEditView: boolean
): { isValid: boolean; errors: InteractionFormErrors } => {
  let isValid = true;
  const newErrors: InteractionFormErrors = {};
  const questionErrors: InteractionQuestionErrors[] = [];

  // Validate project fields when source is account
  if (source === 'account') {
    if (!formData.projectCode) {
      newErrors.projectCode = 'Project Code is required';
      isValid = false;
    }
    if (!formData.fiscalYear) {
      newErrors.fiscalYear = 'Fiscal Year is required';
      isValid = false;
    }
  }

  if (!formData.status && isEditView) {
    newErrors.status = 'Status is required';
    isValid = false;
  }

  // Validate questions
  formData.questions.forEach((question) => {
    const currentQuestionErrors: InteractionQuestionErrors = {};

    if (!question.question.trim()) {
      currentQuestionErrors.question = 'Interaction Questions is required';
      isValid = false;
    }

    if (!REGEX_PATTERNS.MAX_2000.test(question.notes)) {
      currentQuestionErrors.notes = 'Max length exceeded';
      isValid = false;
    }

    questionErrors.push(currentQuestionErrors);
  });

  newErrors.questions = questionErrors;

  return { isValid, errors: newErrors };
};

export const questionsTransformPayload = (
  formQuestions: InteractionFormQuestion[],
  isEdit: boolean = false,
  existingQuestions: InteractionQuestion[] = []
): InteractionQuestionPayload[] => {
  const transformedQuestions: InteractionQuestionPayload[] = [];
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
        action_type: QuestionUpdate.Edit,
      });
    } else if (!question.rid) {
      transformedQuestions.push({
        ...question,
        action_type: QuestionUpdate.Add,
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
          action_type: QuestionUpdate.Delete,
        });
        seenQuestionNos.add(question_seq_num);
      }
    });
  }

  return transformedQuestions;
};

export const transFormPayload = (
  accountId: string,
  formData: Partial<InteractionFormData>,
  isEditView: boolean,
  saveFlag: StatusActionEnum,
  interactionData?: InteractionDetails,
  projectData?: ProjectDetails
): InteractionFormPayload => {
  const transformedQuestions = questionsTransformPayload(
    formData.questions || [],
    isEditView,
    interactionData?.questions || []
  );

  const basePayload: InteractionFormPayload = {
    account_rid: accountId || projectData?.account_rid || '',
    project_rid: projectData?.project_rid || interactionData?.project_rid || '',
    project_fiscal_rid:
      projectData?.project_fiscal_rid ||
      interactionData?.project_fiscal_rid ||
      '',
    questions: transformedQuestions,
  };

  if (isEditView && interactionData) {
    return {
      ...basePayload,
      interaction_rid: interactionData.interaction_rid || formData.rid,
      status_rid: formData.status || interactionData.status,
    };
  }

  return {
    ...basePayload,
    fiscal_year: formData.fiscalYear,
    status_action: saveFlag,
    interaction_type_rid: 'D001-d37a864c-8853-4441-a146-72cc6fa6ce78',
  };
};
