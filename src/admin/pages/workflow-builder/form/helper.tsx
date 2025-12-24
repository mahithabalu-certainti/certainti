import { CreateRulePayload, RuleDetails } from '../../../types';

/// RULE BUILDER TYPES

// Enum for condition types
export enum ConditionTypeEnum {
  if = 'if',
  then = 'then',
  else_if = 'else-if',
}

export type LogicalOperator = 'AND' | 'OR';

export enum ActionTypeEnum {
  InApp = 'In App',
  Email = 'Email',
}

export interface Trigger {
  id: string;
  name: string;
  description: string;
  category: string;
  badge?: string;
  requiresConfig?: boolean;
}

export interface Condition {
  id: string;
  category: string;
  name: string;
  field: string;
  fieldName?: string; // Display name for field
  operator: string;
  operatorName?: string; // Display name for operator
  value: string | string[];
  valueName?: string; // Display name for value
  conditionTypeId?: string;
  logicalOperator?: LogicalOperator;
}

export interface ConditionCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  fields: ConditionField[];
}

export interface ConditionField {
  id: string;
  name: string;
  type:
    | 'text'
    | 'number'
    | 'boolean'
    | 'select'
    | 'multiselect'
    | 'date'
    | 'logical';
  operators: string[];
  options?: { value: string; label: string }[];
  placeholder?: string;
}

export interface Action {
  id: string;
  name: string;
  description?: string;
  category: string;
  icon?: string;
  badge?: 'NEW' | 'POPULAR';
  // Add any additional fields you need for action configuration
  fields?: ActionField[];
}

export interface ActionField {
  id: string;
  label: string;
  type: 'text' | 'select' | 'multiselect' | 'number' | 'date';
  options?: { value: string; label: string }[];
  placeholder?: string;
  required?: boolean;
}

export interface RuleComponent {
  id: string;
  type: 'condition' | 'action' | 'branch';
  data: Condition | Action | { name: string };
}

export type ComponentType = 'for-each' | 'if' | 'then' | null;

export interface ConditionType {
  rid: string;
  name: string;
  condition_type: string; // 'if' or 'then' or other types
  description?: string;
}
export interface Template {
  rid: string;
  channel: string;
  // Add other template properties as needed
}
export interface Rule {
  id: string;
  name: string;
  r_number?: string;
  trigger: Trigger | null;
  conditions: Condition[];
  actions: Action[];
  isActive: boolean;
  conditionType?: ConditionType | null;
  // Map of actionId -> template value
  actionTemplates?: Record<string, Template | undefined>;
}

export const transformRuleToPayload = (rule: Rule) => {
  // If condition type is THEN, send empty conditions array
  const condition_categories =
    rule.conditionType?.condition_type?.toLowerCase() === ConditionTypeEnum.then
      ? []
      : rule.conditions.map((condition, index) => {
          const categoryOperator =
            index > 0 ? condition.logicalOperator || 'AND' : undefined;

          return {
            category_rid: condition.category,
            ...(categoryOperator
              ? { category_operator: categoryOperator }
              : {}),
            field_rid: condition.field,
            operator_rid: condition.operator,
            value_rid: Array.isArray(condition.value)
              ? condition.value.join(',')
              : condition.value,
          };
        });

  // Extract template RIDs dynamically - only include if they exist
  let inAppTemplateRid: string | undefined;
  let emailTemplateRid: string | undefined;

  if (rule.actionTemplates) {
    // Find In-App template
    const inAppTemplate = Object.values(rule.actionTemplates).find(
      (template) =>
        template &&
        (template.channel === 'In App' || template.channel === 'in_app')
    );
    inAppTemplateRid = inAppTemplate?.rid;

    // Find Email template
    const emailTemplate = Object.values(rule.actionTemplates).find(
      (template) =>
        template &&
        (template.channel === 'Email' || template.channel === 'email')
    );
    emailTemplateRid = emailTemplate?.rid;
  }

  // Build payload with conditional inclusion of template RIDs
  const payload: CreateRulePayload = {
    rule_name: rule.name,
    description: '',
    trigger_type: 1,
    scope_type_rid: rule.trigger?.category || '',
    event_rid: rule.trigger?.id || '',
    condition_rid: rule.conditionType?.rid || '',
    condition_categories,
    action_rid: rule.actions.map((action) => action.id),
  };

  // Only add in_app_template_rid if it exists
  if (inAppTemplateRid) {
    payload.in_app_template_rid = inAppTemplateRid;
  }

  // Only add email_template_rid if it exists
  if (emailTemplateRid) {
    payload.email_template_rid = emailTemplateRid;
  }

  return payload;
};

/**
 * Transform API response to Rule format for UI
 * Converts backend API response into frontend Rule structure for editing
 * All RIDs are preserved for saving back to the API
 */
export const transformApiResponseToRule = (data: RuleDetails): Rule => {
  // Extract trigger information with all RIDs
  const trigger: Trigger | null = data?.event
    ? {
        id: data.event.event_rid,
        name: data.event.event_name,
        description: data.event.description || '',
        category: data.rule.scope_type_rid, // Use scope_type_rid from rule
        badge: undefined,
        requiresConfig: false,
      }
    : null;

  // Extract condition type with RID
  const conditionType: ConditionType | null = data?.condition
    ? {
        rid: data.condition.condition_rid,
        name: data.condition.condition_name,
        condition_type: data.condition.condition_type,
        description: data.condition.description || '',
      }
    : null;

  // Transform conditions to flat conditions array
  // All RIDs are preserved for each condition
  const conditions: Condition[] = [];

  if (data?.conditions) {
    data.conditions.forEach((conditionItem, index: number) => {
      const condition: Condition = {
        id: `${conditionItem.category_rid}-${conditionItem.field_rid}-${index}`, // Generate unique ID
        category: conditionItem.category_rid, // Category RID preserved
        name: conditionItem.category_name,
        field: conditionItem.field_rid, // Field RID preserved
        fieldName: conditionItem.field_description || conditionItem.field_name, // Use field_description if available, fallback to field_name
        operator: conditionItem.operator_rid, // Operator RID preserved
        operatorName: conditionItem.operator_name,
        value: conditionItem.value_rid, // Value RID preserved
        valueName: conditionItem.value_name,
        conditionTypeId: data.condition?.condition_rid,
        logicalOperator: conditionItem.category_operator || undefined,
      };
      conditions.push(condition);
    });
  }

  // Transform actions with all RIDs preserved
  const actions: Action[] = data?.actions
    ? data.actions.map((action) => ({
        id: action.action_rid, // Action RID preserved
        name: action.action_name,
        description: action.description || '',
        category: action?.action_type_rid || '',
        icon: undefined,
        badge: undefined,
      }))
    : [];

  // Map action templates if they exist in the rule
  const actionTemplates: Record<string, Template | undefined> = {};

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ruleData = data.rule as any;

  if (ruleData.in_app_template_rid) {
    const inAppAction = actions.find(
      (a) => a.name === ActionTypeEnum.InApp || a.name === 'In App'
    );
    if (inAppAction) {
      actionTemplates[inAppAction.name] = { // Use action.name as key
        rid: ruleData.in_app_template_rid,
        channel: 'In App',
      };
    }
  }

  if (ruleData.email_template_rid) {
    const emailAction = actions.find(
      (a) => a.name === ActionTypeEnum.Email || a.name === 'Email'
    );
    if (emailAction) {
      actionTemplates[emailAction.name] = { // Use action.name as key
        rid: ruleData.email_template_rid,
        channel: 'Email',
      };
    }
  }

  // Construct the Rule object with all RIDs preserved
  const rule: Rule = {
    id: data.rule.rid, // Rule RID preserved
    name: data.rule.rule_name,
    r_number: data.rule.r_number || undefined, // R Number preserved
    trigger,
    conditions,
    actions,
    isActive: data.rule.is_active || false,
    conditionType,
    actionTemplates:
      Object.keys(actionTemplates).length > 0 ? actionTemplates : undefined,
  };

  return rule;
};

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
      maxHeight: 200,
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

export const PROJECT_COLORS = [
  '#40E0D0',
  '#FFA500',
  '#EEEE00',
  '#00BFFF',
  '#FF7256',
  '#CCCC33',
  '#DDA0DD',
  '#66CDAA',
  '#FFDAB9',
  '#CDB38B',
  '#98FB98',
  '#FFD700',
  '#B0E0E6',
  '#C5B8FF',
  '#BDB76B',
  '#66CDAA',
  '#EEE0E5',
  '#FFA07A',
  '#7FFFD4',
  '#FFB6C1',
  '#32CD32',
  '#CDB5CD',
  '#A2CD5A',
];

export const blendWithWhite = (hex: string, alpha = 0.6) => {
  const r = parseInt(hex.substring(1, 3), 16);
  const g = parseInt(hex.substring(3, 5), 16);
  const b = parseInt(hex.substring(5, 7), 16);

  const newR = Math.round(r * (1 - alpha) + 255 * alpha);
  const newG = Math.round(g * (1 - alpha) + 255 * alpha);
  const newB = Math.round(b * (1 - alpha) + 255 * alpha);

  return (
    '#' +
    newR.toString(16).padStart(2, '0') +
    newG.toString(16).padStart(2, '0') +
    newB.toString(16).padStart(2, '0')
  );
};

export const getCategoryColor = (categoryName: string): string => {
  const hash = getHash(categoryName.toLowerCase().trim());
  const index = hash % PROJECT_COLORS.length;
  return blendWithWhite(PROJECT_COLORS[index]);
};

// --------------------------------------------------------------
// --------------------------------------------------------
//  Utility: Hash for fallback color
// --------------------------------------------------------
const getHash = (str: string): number => {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 33) ^ str.charCodeAt(i);
  }
  return hash >>> 0;
};

export const getDynamicSvgIcon = (
  name: string,
  size = 16,
  iconColor?: string
): JSX.Element => {
  const normalized = name.toLowerCase().trim();

  const hash = getHash(name);
  const color = iconColor ?? `#2A2A2A`;
  const shapeType = hash % 8;

  const isEmail = /\b(mail|email|gmail|outlook|inbox|message|compose)\b/i.test(
    normalized
  );
  const isStatus =
    /\b(status|state|progress|health|stage|phase|condition)\b/i.test(
      normalized
    );
  const isCode =
    /\b(git|github|gitlab|code|repo|deploy|merge|commit|branch)\b/i.test(
      normalized
    );
  const isChat =
    /\b(chat|comment|reply|slack|discord|dm|message|discussion)\b/i.test(
      normalized
    );
  const isVideo = /\b(zoom|meet|video|call|conference|webinar|camera)\b/i.test(
    normalized
  );
  const isPayment =
    /\b(pay|payment|invoice|billing|money|revenue|price|finance)\b/i.test(
      normalized
    );
  const isCloud =
    /\b(cloud|drive|dropbox|storage|folder|file|document|sync|upload)\b/i.test(
      normalized
    );
  const isLock =
    /\b(lock|secure|auth|password|key|shield|access|permission)\b/i.test(
      normalized
    );
  const isUser = /\b(user|profile|account|member|team|owner|assignee)\b/i.test(
    normalized
  );

  const isTask =
    /\b(task|todo|activity|assignment|checklist|work item)\b/i.test(normalized);
  const isProject = /\b(project|initiative|milestone|phase|sprint)\b/i.test(
    normalized
  );
  const isMeeting = /\b(meeting|schedule|calendar|appointment|event)\b/i.test(
    normalized
  );
  const isFileEvent = /\b(file|upload|download|attachment|pdf|image)\b/i.test(
    normalized
  );
  const isCommentEvent = /\b(comment|reply|note|mention|feedback)\b/i.test(
    normalized
  );
  const isCase = /\b(case|ticket|issue|incident|support)\b/i.test(normalized);
  const isIntegration =
    /\b(api|integration|sync|connector|fetch|push|pull|mapping)\b/i.test(
      normalized
    );
  const isAI = /\b(ai|automation|predict|classify|summary|model|auto)\b/i.test(
    normalized
  );
  const isSLA = /\b(sla|breach|overdue|deadline|due|time|aging)\b/i.test(
    normalized
  );
  const isValidation =
    /\b(validate|validation|verify|approved|failed|rules)\b/i.test(normalized);
  const isError =
    /\b(error|fail|failed|exception|invalid|warning|crash)\b/i.test(normalized);

  // 📧 Email
  if (isEmail) {
    return (
      <svg
        width={size}
        height={size}
        viewBox='0 0 24 24'
        fill='none'
        stroke={color}
        strokeWidth='2'
      >
        <rect x='3' y='6' width='18' height='12' rx='2' />
        <path d='M3 8l9 6 9-6' />
      </svg>
    );
  }

  // 📊 Status (activity)
  if (isStatus) {
    return (
      <svg
        width={size}
        height={size}
        viewBox='0 0 24 24'
        fill='none'
        stroke={color}
        strokeWidth='2'
      >
        <path d='M3 12h4l2-4 4 8 2-4h4' />
      </svg>
    );
  }

  // 💻 Code / Git
  if (isCode) {
    return (
      <svg
        width={size}
        height={size}
        viewBox='0 0 24 24'
        fill='none'
        stroke={color}
        strokeWidth='2'
      >
        <path d='M9 18l-6-6 6-6' />
        <path d='M15 6l6 6-6 6' />
      </svg>
    );
  }

  // 💬 Chat
  if (isChat) {
    return (
      <svg
        width={size}
        height={size}
        viewBox='0 0 24 24'
        fill='none'
        stroke={color}
        strokeWidth='2'
      >
        <rect x='3' y='4' width='18' height='12' rx='2' />
        <path d='M8 16l-2 4 4-3' />
      </svg>
    );
  }

  // 🎥 Video Meetings
  if (isVideo) {
    return (
      <svg
        width={size}
        height={size}
        viewBox='0 0 24 24'
        fill='none'
        stroke={color}
        strokeWidth='2'
      >
        <rect x='4' y='7' width='13' height='10' rx='2' />
        <path d='M17 10l4 3-4 3v-6z' fill={color} />
      </svg>
    );
  }

  // 💰 Payment / Finance
  if (isPayment) {
    return (
      <svg
        width={size}
        height={size}
        viewBox='0 0 24 24'
        fill='none'
        stroke={color}
        strokeWidth='2.3'
      >
        <line x1='12' y1='2' x2='12' y2='22' />
        <path d='M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6' />
      </svg>
    );
  }

  // ☁ Cloud / Storage / File
  if (isCloud) {
    return (
      <svg
        width={size}
        height={size}
        viewBox='0 0 24 24'
        fill='none'
        stroke={color}
        strokeWidth='2'
      >
        <path d='M7 14a5 5 0 1110 0h2a4 4 0 11-2 7H9a4 4 0 110-7h2z' />
      </svg>
    );
  }

  // 🔐 Lock / Security
  if (isLock) {
    return (
      <svg
        width={size}
        height={size}
        viewBox='0 0 24 24'
        fill='none'
        stroke={color}
        strokeWidth='2'
      >
        <rect x='7' y='11' width='10' height='9' rx='2' />
        <path d='M8 11V8a4 4 0 118 0v3' />
      </svg>
    );
  }

  // 📝 Task (increased stroke weight)
  if (isTask) {
    return (
      <svg
        width={size}
        height={size}
        viewBox='0 0 24 24'
        xmlns='http://www.w3.org/2000/svg'
      >
        <g fill='none' fillRule='evenodd'>
          <path
            d='M10,4.5 C10,4.77614237 9.77614237,5 9.5,5 C9.22385763,5 9,4.77614237 9,4.5 C9,3.67157288 9.67157288,3 10.5,3 L13.5,3 C14.3284271,3 15,3.67157288 15,4.5 C15,4.77614237 14.7761424,5 14.5,5 C14.2238576,5 14,4.77614237 14,4.5 C14,4.22385763 13.7761424,4 13.5,4 L10.5,4 C10.2238576,4 10,4.22385763 10,4.5 Z
             M6.5,4 C6.77614237,4 7,4.22385763 7,4.5 C7,4.77614237 6.77614237,5 6.5,5 C5.67157288,5 5,5.67157288 5,6.5 L5,18.5 C5,19.3284271 5.67157288,20 6.5,20 L17.5,20 C18.3284271,20 19,19.3284271 19,18.5 L19,6.5 C19,5.67157288 18.3284271,5 17.5,5 C17.2238576,5 17,4.77614237 17,4.5 C17,4.22385763 17.2238576,4 17.5,4 C18.8807119,4 20,5.11928813 20,6.5 L20,18.5 C20,19.8807119 18.8807119,21 17.5,21 L6.5,21 C5.11928813,21 4,19.8807119 4,18.5 L4,6.5 C4,5.11928813 5.11928813,4 6.5,4 Z'
            fill={color}
            stroke={color}
            strokeWidth='0.8'
            strokeLinejoin='round'
          />

          <path
            d='M15.1464466,9.14644661 C15.3417088,8.95118446 15.6582912,8.95118446 15.8535534,9.14644661 C16.0488155,9.34170876 16.0488155,9.65829124 15.8535534,9.85355339 L10.8535534,14.8535534 C10.6582912,15.0488155 10.3417088,15.0488155 10.1464466,14.8535534 L8.14644661,12.8535534 C7.95118446,12.6582912 7.95118446,12.3417088 8.14644661,12.1464466 C8.34170876,11.9511845 8.65829124,11.9511845 8.85355339,12.1464466 L10.5,13.7928932 L15.1464466,9.14644661 Z'
            fill={color}
            stroke={color}
            strokeWidth='0.9'
            strokeLinecap='round'
            strokeLinejoin='round'
          />
        </g>
      </svg>
    );
  }

  // 👤 User
  if (isUser) {
    return (
      <svg
        width={size}
        height={size}
        viewBox='0 0 24 24'
        fill='none'
        stroke={color}
        strokeWidth='2'
      >
        <circle cx='12' cy='8' r='3' />
        <path d='M5 20c1-4 4-6 7-6s6 2 7 6' />
      </svg>
    );
  }

  // 📁 Project
  if (isProject) {
    return (
      <svg
        width={size}
        height={size}
        viewBox='0 0 24 24'
        fill='none'
        stroke={color}
        strokeWidth='2'
      >
        <rect x='2' y='7' width='20' height='14' rx='2' />
        <path d='M2 7l4-4h6l3 4' />
      </svg>
    );
  }

  // 🎥 Meeting
  if (isMeeting) {
    return (
      <svg
        width={size}
        height={size}
        viewBox='0 0 24 24'
        fill='none'
        stroke={color}
        strokeWidth='2'
      >
        <rect x='4' y='7' width='13' height='10' rx='2' />
        <path d='M17 10l4 3-4 3v-6z' fill={color} />
      </svg>
    );
  }

  // 📎 File Events
  if (isFileEvent) {
    return (
      <svg
        width={size}
        height={size}
        viewBox='0  0 24 24'
        fill='none'
        stroke={color}
        strokeWidth='2'
      >
        <path d='M6 3h8l4 4v14H6z' />
        <path d='M14 3v4h4' />
      </svg>
    );
  }

  // 💬 Comments
  if (isCommentEvent) {
    return (
      <svg
        width={size}
        height={size}
        viewBox='0 0 24 24'
        fill='none'
        stroke={color}
        strokeWidth='2'
      >
        <rect x='4' y='4' width='16' height='12' rx='3' />
        <path d='M8 16l-2 4 4-3' />
      </svg>
    );
  }

  // 🎫 Case / Ticket
  if (isCase) {
    return (
      <svg
        width={size}
        height={size}
        viewBox='0 0 24 24'
        fill='none'
        stroke={color}
        strokeWidth='2'
      >
        <path d='M3 7h18v12H3z' />
        <path d='M8 7V5h8v2' />
      </svg>
    );
  }

  // 🔗 Integration
  if (isIntegration) {
    return (
      <svg
        width={size}
        height={size}
        viewBox='0 0 24 24'
        fill='none'
        stroke={color}
        strokeWidth='2'
      >
        <circle cx='8' cy='12' r='3' />
        <circle cx='16' cy='12' r='3' />
        <path d='M11 12h2' />
      </svg>
    );
  }

  // 🤖 AI / Automation
  if (isAI) {
    return (
      <svg
        width={size}
        height={size}
        viewBox='0 0 24 24'
        fill='none'
        stroke={color}
        strokeWidth='2'
      >
        <circle cx='12' cy='12' r='6' />
        <circle cx='12' cy='12' r='3' fill={color} opacity='0.4' />
        <path d='M15 9a5 5 0 010 6' />
      </svg>
    );
  }

  // ⏱ SLA / Time / Deadline
  if (isSLA) {
    return (
      <svg
        width={size}
        height={size}
        viewBox='0 0 24 24'
        fill='none'
        stroke={color}
        strokeWidth='2'
      >
        <circle cx='12' cy='12' r='8' />
        <path d='M12 7v5l4 2' />
      </svg>
    );
  }

  // 🧪 Validation
  if (isValidation) {
    return (
      <svg
        width={size}
        height={size}
        viewBox='0 0 24 24'
        fill='none'
        stroke={color}
        strokeWidth='2'
      >
        <path d='M12 3l9 5v6c0 5-4 8-9 9-5-1-9-4-9-9V8z' />
      </svg>
    );
  }

  // ⚠ Error / Warning
  if (isError) {
    return (
      <svg
        width={size}
        height={size}
        viewBox='0  0 24 24'
        fill='none'
        stroke={color}
        strokeWidth='2'
      >
        <path d='M12 9v4' />
        <circle cx='12' cy='17' r='1' />
        <path d='M10.3 2.3L1 20h22L13.7 2.3a2 2 0 00-3.4 0z' />
      </svg>
    );
  }

  switch (shapeType) {
    case 0:
      return (
        <svg width={size} height={size} viewBox='0 0 24 24' fill={color}>
          <circle cx='12' cy='12' r='9' />
        </svg>
      );
    case 1:
      return (
        <svg width={size} height={size} viewBox='0 0 24 24' fill={color}>
          <rect x='5' y='5' width='14' height='14' rx='3' />
        </svg>
      );
    case 2:
      return (
        <svg width={size} height={size} viewBox='0 0 24 24' fill={color}>
          <polygon points='12,3 21,20 3,20' />
        </svg>
      );
    default:
      return (
        <svg width={size} height={size} viewBox='0 0 24 24' fill={color}>
          <path d='M4 12L12 4L20 12L12 20L4 12Z' />
        </svg>
      );
  }
};
