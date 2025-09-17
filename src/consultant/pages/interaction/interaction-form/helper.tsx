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
  StatusTypeEnum,
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
    width: '10%',
    hide: !isEditView,
  },
  {
    name: 'question',
    label: 'Interaction Questions',
    width: '57%',
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

export const hasFormValuesChanged = (
  formData: InteractionFormData,
  interactionData: InteractionDetails | undefined
): boolean => {
  if (!interactionData) return true;

  const getNormalizedQuestions = (questions: InteractionFormQuestion[]) =>
    questions.map((q) => ({
      question: q.question,
      notes: q.notes,
      is_mandatory: q.is_mandatory,
      question_seq_num: q.question_seq_num,
      is_editable: q.is_editable,
      rid: q.rid,
    }));

  const questionsChanged =
    JSON.stringify(getNormalizedQuestions(formData.questions)) !==
    JSON.stringify(getNormalizedQuestions(interactionData.questions));

  return questionsChanged;
};

export const validateInteractionForm = (
  formData: InteractionFormData,
  source: string | null
): { isValid: boolean; errors: InteractionFormErrors } => {
  let isValid = true;
  const newErrors: InteractionFormErrors = {};
  const questionErrors: InteractionQuestionErrors[] = [];

  // Validate project fields when source is account
  if (source === 'account' || source === 'global') {
    if (!formData.accountName && source === 'global') {
      newErrors.accountName = 'Account Name is required';
      isValid = false;
    }
    if (!formData.projectCode && source === 'global') {
      newErrors.projectCode = 'Project Code is required';
      isValid = false;
    }
  }

  // Validate questions
  formData.questions.forEach((question) => {
    const currentQuestionErrors: InteractionQuestionErrors = {};

    if (!question.question.trim()) {
      currentQuestionErrors.question = 'Interaction Questions is required';
      isValid = false;
    }

    if (!REGEX_PATTERNS.MAX_2000.test(question.question)) {
      currentQuestionErrors.question =
        'Interaction Questions must be within 2000 characters';
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

export const questionsTransformPayload = (
  formQuestions: InteractionFormQuestion[],
  isEdit: boolean = false,
  existingQuestions: InteractionQuestion[] = []
): InteractionQuestionPayload[] => {
  const transformedQuestions: InteractionQuestionPayload[] = [];
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

export const getStatusId = (
  formData: Partial<InteractionFormData>,
  isEditView: boolean,
  isDraftStatus: boolean,
  saveFlag: StatusActionEnum,
  currentStatusId: string,
  statusOptions: { label: string; value: string; disable: boolean }[]
): string => {
  if (formData.status && formData.status !== currentStatusId) {
    return formData.status;
  }

  if (isEditView && !isDraftStatus) {
    if (saveFlag === StatusActionEnum.Create) {
      const updatedStatus = statusOptions.find(
        (option) =>
          option.label.toLowerCase() === StatusTypeEnum.question_updated
      );
      return updatedStatus?.value || '';
    }
    return currentStatusId;
  }

  if (saveFlag === StatusActionEnum.Draft) {
    const draftStatus = statusOptions.find(
      (option) => option.label.toLowerCase() === StatusTypeEnum.draft
    );
    return draftStatus?.value || '';
  }

  if (saveFlag === StatusActionEnum.Create) {
    const createStatus = statusOptions.find(
      (option) => option.label.toLowerCase() === StatusTypeEnum.created
    );
    return createStatus?.value || '';
  }

  return currentStatusId;
};

export const transFormPayload = (
  accountId: string,
  formData: Partial<InteractionFormData>,
  isEditView: boolean,
  statusRid: string,
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
    status_rid: statusRid,
    questions: transformedQuestions,
    fiscal_year: formData.fiscalYear || interactionData?.fiscal_year,
  };

  if (isEditView && interactionData) {
    return {
      ...basePayload,
      interaction_rid: interactionData.interaction_rid || formData.rid,
    };
  }

  return basePayload;
};

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
