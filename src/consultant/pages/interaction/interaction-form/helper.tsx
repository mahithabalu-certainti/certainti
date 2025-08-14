import { REGEX_PATTERNS } from '../../../../common-utils';
import {
  InteractionDetails,
  InteractionFormData,
  InteractionFormErrors,
  InteractionFormQuestion,
  InteractionFormTableColumn,
  InteractionQuestion,
  InteractionQuestionErrors,
  QuestionUpdate,
} from '../../../types';

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
): InteractionFormQuestion[] => {
  const transformedQuestions: InteractionFormQuestion[] = [];
  const retainedRids = new Set<string>();
  const seenQuestionNos = new Set<string>();

  // Process form questions first
  formQuestions.forEach((question) => {
    if (seenQuestionNos.has(question.questionNo)) {
      return;
    }
    seenQuestionNos.add(question.questionNo);

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
    existingQuestions.forEach((existingQuestion) => {
      if (
        existingQuestion.rid &&
        !retainedRids.has(existingQuestion.rid) &&
        !seenQuestionNos.has(existingQuestion.question_seq_num)
      ) {
        transformedQuestions.push({
          questionNo: existingQuestion.question_seq_num,
          question: existingQuestion.question || '',
          mandatory: existingQuestion.is_mandatory ?? false,
          notes: existingQuestion.notes || '',
          rid: existingQuestion.rid,
          action_type: QuestionUpdate.Delete,
        });
        seenQuestionNos.add(existingQuestion.question_seq_num);
      }
    });
  }

  return transformedQuestions;
};

export const transFormPayload = (
  formData: Partial<InteractionFormData>,
  isEditView: boolean,
  interactionData?: InteractionDetails,
  saveFlag?: 'submit' | 'draft'
): InteractionFormData => {
  const transformedQuestions = questionsTransformPayload(
    formData.questions || [],
    isEditView,
    interactionData?.questions || []
  );

  const basePayload: InteractionFormData = {
    projectCode: formData.projectCode || '',
    projectName: formData.projectName || '',
    fiscalYear: formData.fiscalYear || 0,
    questions: transformedQuestions,
    accountName: formData.accountName || '',
    flag: saveFlag,
  };

  if (isEditView && interactionData) {
    return {
      ...basePayload,
      rid: interactionData.rid,
      status: formData.status,
    };
  }

  return basePayload;
};
