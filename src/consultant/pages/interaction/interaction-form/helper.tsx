import {
  costDisplay,
  formatDateToYYYYMMDDWithTime,
  REGEX_PATTERNS,
  valueDisplay,
} from '../../../../common-utils';
import {
  ListTableColumn,
} from '../../../../components/table/types';
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
import { Project } from '../../../types/project';

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

export const getProjectColumns = (
  permissionMap: Record<string, { read: boolean; edit: boolean }>
): ListTableColumn<Project>[] => [
  {
    id: 'project_code',
    editId: 'project_code',
    label: 'Project Code',
    sortable: true,
    sortId: 'project_code',
    width: 260,
    sticky: true,
    hide:
      !permissionMap?.['project_code']?.read &&
      !permissionMap?.['project_code']?.edit,
    sx: {
      position: 'sticky',
      left: 0,
      background: '#fff',
      zIndex: 10,
      borderRight: '1px solid #CBD6E2 !important',
      borderBottom: '1px solid #CBD6E2 !important',
    },
    render: (row: Project) => {
      const displayCode = row.fiscal_year
        ? `FY${row.fiscal_year} - ${row.project_code}`
        : row.project_code;
      const isClickable = row._level !== undefined && row._level === 1;
      return isClickable ? (
        <span className={row.fiscal_year ? '!text-[#1755E7]' : ''}>
          {displayCode}
        </span>
      ) : (
        displayCode
      );
    },
  },
  {
    id: 'project_name',
    editId: 'project_name',
    label: 'Name',
    sortable: true,
    sortId: 'project_name',
    width: 160,
    hide:
      !permissionMap?.['project_name']?.read &&
      !permissionMap?.['project_name']?.edit,
  },
  {
    id: 'project_type_name',
    editId: 'project_type_rid',
    label: 'Project Type',
    sortable: true,
    sortId: 'project_type_rid',
    width: 160,
    hide:
      !permissionMap?.['project_type_rid']?.read &&
      !permissionMap?.['project_type_rid']?.edit,
  },
  {
    id: 'fiscal_year',
    editId: 'fiscal_year',
    label: 'Fiscal Year',
    sortable: true,
    hide:
      !permissionMap?.['fiscal_year']?.read &&
      !permissionMap?.['fiscal_year']?.edit,
    sortId: 'fiscal_year',
    width: 130,
    sx: {
      textAlign: 'left',
    },
    render: (row: Project) => {
      const displayYear = row.fiscal_year ? `FY-${row.fiscal_year}` : '-';
      return <span>{displayYear}</span>;
    },
  },
  {
    id: 'classification_name',
    editId: 'project_classification_rid',
    label: 'Project Classification',
    sortable: true,
    sortId: 'classification_name',
    hide:
      !permissionMap?.['project_classification_rid']?.read &&
      !permissionMap?.['project_classification_rid']?.edit,
    width: 170,
    render: (row: Project) =>
      row.project_classification_other
        ? `${row.classification_name} - ${row.project_classification_other}`
        : row.classification_name,
  },
  {
    id: 'project_client_group',
    editId: 'project_client_group',
    label: 'Customer Group',
    sortable: true,
    sortId: 'project_client_group',
    width: 160,
    hide:
      !permissionMap?.['project_client_group']?.read &&
      !permissionMap?.['project_client_group']?.edit,
  },
  {
    id: 'project_group',
    editId: 'project_group',
    label: 'Project Group',
    sortable: true,
    sortId: 'project_group',
    hide:
      !permissionMap?.['project_group']?.read &&
      !permissionMap?.['project_group']?.edit,
    width: 160,
  },
  {
    id: 'total_effort',
    editId: 'total_effort',
    label: 'Project Effort (Hours)',
    sortable: true,
    sortId: 'total_effort',
    width: 170,
    hide:
      !permissionMap?.['total_effort']?.read &&
      !permissionMap?.['total_effort']?.edit,
    conditionallyEdit: [
      {
        key: 'total_effort',
        matchValue: [null, '0.00'],
      },
    ],
    sx: {
      textAlign: 'right',
    },
    render: (row: Project) =>
      row.total_effort ? valueDisplay(row.total_effort) : '-',
  },
  {
    id: 'total_cost',
    editId: 'total_cost',
    label: 'Project Cost',
    sortable: true,
    sortId: 'total_cost',
    width: 130,
    hide:
      !permissionMap?.['total_cost']?.read &&
      !permissionMap?.['total_cost']?.edit,
    sx: {
      textAlign: 'right',
    },
    render: (row: Project) =>
      row.total_cost ? costDisplay(row.total_cost, row.currency_symbol) : '-',
  },
  {
    id: 'total_cost_fte',
    editId: 'total_cost_fte',
    label: 'FTE Cost',
    sortable: true,
    sortId: 'total_cost_fte',
    width: 140,
    hide:
      !permissionMap?.['total_cost_fte']?.read &&
      !permissionMap?.['total_cost_fte']?.edit,
    sx: {
      textAlign: 'right',
    },
    render: (row: Project) =>
      row.total_cost_fte
        ? costDisplay(row.total_cost_fte, row.currency_symbol)
        : '-',
  },
  {
    id: 'total_cost_subcon',
    editId: 'total_cost_subcon',
    label: 'SubCon Cost',
    sortable: true,
    sortId: 'total_cost_subcon',
    width: 140,
    hide:
      !permissionMap?.['total_cost_subcon']?.read &&
      !permissionMap?.['total_cost_subcon']?.edit,
    sx: {
      textAlign: 'right',
    },
    render: (row: Project) =>
      row.total_cost_subcon
        ? costDisplay(row.total_cost_subcon, row.currency_symbol)
        : '-',
  },
  {
    id: 'total_cost_nonlabor',
    editId: 'total_cost_nonlabor',
    label: 'Non-Labor Cost',
    sortable: true,
    hide:
      !permissionMap?.['total_cost_nonlabor']?.read &&
      !permissionMap?.['total_cost_nonlabor']?.edit,
    sortId: 'total_cost_nonlabor',
    width: 140,
    sx: {
      textAlign: 'right',
    },
    render: (row: Project) =>
      row.total_cost_nonlabor
        ? costDisplay(row.total_cost_nonlabor, row.currency_symbol)
        : '-',
  },
  {
    id: 'project_point_of_contact',
    label: 'Project Point of Contact',
    sortable: true,
    sortId: 'project_point_of_contact',
    width: 200,
    hide:
      !permissionMap?.['key_contacts']?.read &&
      !permissionMap?.['key_contacts']?.edit,
    render: (row: Project & { _level?: number }) => {
      return (
        <span>
          {row.project_point_of_contact ? row.project_point_of_contact : '-'}
        </span>
      );
    },
  },
  {
    id: 'technical_point_of_contact',
    label: 'Technical Point of Contact',
    sortable: true,
    sortId: 'technical_point_of_contact',
    width: 210,
    hide:
      !permissionMap?.['key_contacts']?.read &&
      !permissionMap?.['key_contacts']?.edit,
    render: (row: Project & { _level?: number }) => {
      return (
        <span>
          {row.technical_point_of_contact
            ? row.technical_point_of_contact
            : '-'}
        </span>
      );
    },
  },
  {
    id: 'assessment_status',
    label: 'Assessment Status',
    sortable: true,
    sortId: 'assessment_status',
    width: 180,
    hide:
      !permissionMap?.['assessment_status']?.read &&
      !permissionMap?.['assessment_status']?.edit,
  },
  {
    id: 'qre_final',
    label: 'QRE %',
    sortable: true,
    sortId: 'qre_final',
    width: 130,
    sx: {
      textAlign: 'right',
    },
    hide:
      !permissionMap?.['qre_final']?.read &&
      !permissionMap?.['qre_final']?.edit,
    render: (row: Project) => (row.qre_final ? row.qre_final : '-'),
  },
  {
    id: 'qre',
    label: 'QRE',
    sortable: true,
    sortId: 'qre',
    width: 130,
    sx: {
      textAlign: 'right',
    },
    hide: !permissionMap?.['qre']?.read && !permissionMap?.['qre']?.edit,
    render: (row: Project) => (row.qre ? row.qre : '-'),
  },
  {
    id: 'comments',
    editId: 'comments',
    label: 'Comments',
    sortable: true,
    sortId: 'comments',
    width: 200,
    hide:
      !permissionMap?.['comments']?.read && !permissionMap?.['comments']?.edit,
  },
  {
    id: 'modified_datetime',
    label: 'Last Modified',
    sortable: true,
    sortId: 'modified_datetime',
    width: 190,
    hide:
      !permissionMap?.['modified_datetime']?.read &&
      !permissionMap?.['modified_datetime']?.edit,
    render: (row: Project) =>
      row.modified_datetime
        ? formatDateToYYYYMMDDWithTime(row.modified_datetime)
        : '-',
  },
  {
    id: 'r_number',
    label: 'Project ID',
    sortable: true,
    sortId: 'r_number',
    width: 140,
    hide:
      !permissionMap?.['r_number']?.read && !permissionMap?.['r_number']?.edit,
  },
];