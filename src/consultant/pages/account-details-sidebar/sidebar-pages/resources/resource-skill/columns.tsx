import { REGEX_PATTERNS } from '../../../../../../common-utils';
import {
  ListOption,
  TableField,
} from '../../../../../../components/table/types';
import { OthersEnum } from '../../../../../types';
import { ResourceSkillList } from '../../../../../types/resource-skill';
import { dateFormatToYYYYMMDD } from '../utils';

export interface ResourceSkillTableColumn<T> {
  id: string;
  label: string;
  width?: string | number;
  sortId: string;
  sortable?: boolean;
  sticky?: boolean;
  sx?: React.CSSProperties;
  editable?: boolean;
  render?: (row: T) => React.ReactNode;
  field?: TableField;
}

export const getResourceSkillColumns = (
  skillLevelOptions: ListOption[],
  skillTypeOptions: ListOption[],
  skillSubTypeOptions: ListOption[]
): ResourceSkillTableColumn<ResourceSkillList>[] => [
  {
    id: 'start_date',
    sortId: 'start_date',
    label: 'Effective Date',
    width: 130,
    sortable: true,
    render: (row: ResourceSkillList) => (
      <span>{dateFormatToYYYYMMDD(row.start_date as string) || '-'}</span>
    ),
    sticky: true,
    sx: {
      position: 'sticky',
      left: 0,
      background: '#fff',
      zIndex: 10,
      borderRight: '1px solid #CBD6E2 !important',
      borderBottom: '1px solid #CBD6E2 !important',
    },
    editable: true,
    field: {
      type: 'date',
      required: false,
      placeholder: 'YYYY-MM-DD',
      dateConfig: {
        disableFutureDates: true,
        minDate: '1950-01-01',
      },
    },
  },
  {
    id: 'skill_type_name',
    sortId: 'skill_type_name',
    label: 'Skill Type',
    width: 180,
    sortable: true,
    editable: true,
    field: {
      type: 'select',
      required: true,
      placeholder: 'Choose Skill Type',
      options: skillTypeOptions,
      // Reset skill subtype when skill type changes
      resetDependentFields: ['skill_subtype_name'],
      // Enable onChange callback to fetch skill subtypes
      onChange: true,
      dependencies: [
        {
          dependsOn: ['skill_type_name', 'skill_subtype_name'],
          condition: (value, rowData) => {
            // CRITICAL: Only show modal if BOTH fields have values
            const skillType = value; // Current skill_type value
            const skillSubtype = rowData.skill_subtype_name;

            // Check if both fields have values (not empty/null/undefined)
            const bothFieldsHaveValues =
              skillType &&
              skillType !== '' &&
              skillSubtype &&
              skillSubtype !== '';

            if (!bothFieldsHaveValues) {
              return false; // Don't show modal if either field is empty
            }

            const typeFound = skillTypeOptions.find(
              (opt) => String(opt.value) === String(skillType)
            );
            const subtypeFound = skillSubTypeOptions.find(
              (opt) => String(opt.value) === String(skillSubtype)
            );

            // Show modal if either is "Others"
            const shouldShowModal =
              typeFound?.label.toLowerCase() === OthersEnum.Others ||
              subtypeFound?.label.toLowerCase() === OthersEnum.Others;

            return shouldShowModal;
          },
          action: 'show_modal',
          modalFields: [
            {
              id: 'skill_type_others',
              label: 'Skill Type(Others)',
              type: 'text',
              required: true,
              placeholder: 'Skill Type(Others)',
              validation: [
                {
                  regex: REGEX_PATTERNS.MIN_3,
                  errorMessage: 'Skill type must more than 2 characters.',
                },
                {
                  regex: REGEX_PATTERNS.MAX_64,
                  errorMessage: 'Max length exceeded.',
                },
                {
                  regex:
                    REGEX_PATTERNS.NO_LEADING_OR_TRAILING_SPECIAL_EXTENDED_REGEX,
                  errorMessage:
                    'Cannot start or end with a space or special character',
                },
                {
                  regex: REGEX_PATTERNS.SKILL_OTHERS_ALLOWED_CHARS_REGEX,
                  errorMessage:
                    "Only letters, hyphens (-), apostrophes ('), periods (.), underscores (_), and spaces are allowed.",
                },
              ],
            },
            {
              id: 'skill_subtype_others',
              label: 'Skill SubType(Others)',
              type: 'text',
              required: true,
              placeholder: 'Skill SubType(Others)',
              validation: [
                {
                  regex: REGEX_PATTERNS.MIN_3,
                  errorMessage: 'Skill subtype must more than 2 characters.',
                },
                {
                  regex: REGEX_PATTERNS.MAX_64,
                  errorMessage: 'Max length exceeded.',
                },
                {
                  regex:
                    REGEX_PATTERNS.NO_LEADING_OR_TRAILING_SPECIAL_EXTENDED_REGEX,
                  errorMessage:
                    'Cannot start or end with a space or special character',
                },
                {
                  regex: REGEX_PATTERNS.SKILL_OTHERS_ALLOWED_CHARS_REGEX,
                  errorMessage:
                    "Only letters, hyphens (-), apostrophes ('), periods (.), underscores (_), and spaces are allowed.",
                },
              ],
            },
          ],
        },
      ],
    },
  },
  {
    id: 'skill_subtype_name',
    sortId: 'skill_subtype_name',
    label: 'Skill SubType',
    width: 180,
    sortable: true,
    editable: true,
    field: {
      type: 'select',
      required: true,
      placeholder: 'Choose Skill SubType',
      options: skillSubTypeOptions,
      dependencies: [
        {
          dependsOn: 'skill_type_name',
          condition: (value) => !value,
          action: 'disabled',
          message: 'Please select a skill type first',
        },
        {
          dependsOn: ['skill_type_name', 'skill_subtype_name'],
          condition: (value, rowData) => {
            // CRITICAL: Only show modal if BOTH fields have values
            const skillType = rowData.skill_type_name;
            const skillSubtype = value; // Current skill_subtype value
            // Check if both fields have values (not empty/null/undefined)
            const bothFieldsHaveValues =
              skillType &&
              skillType !== '' &&
              skillSubtype &&
              skillSubtype !== '';

            if (!bothFieldsHaveValues) {
              return false; // Don't show modal if either field is empty
            }

            const typeFound = skillTypeOptions.find(
              (opt) => String(opt.value) === String(skillType)
            );
            const subtypeFound = skillSubTypeOptions.find(
              (opt) => String(opt.value) === String(skillSubtype)
            );

            // Show modal if either is "Others"
            const shouldShowModal =
              typeFound?.label.toLowerCase() === OthersEnum.Others ||
              subtypeFound?.label.toLowerCase() === OthersEnum.Others;
            return shouldShowModal;
          },
          action: 'show_modal',
          modalFields: [
            {
              id: 'skill_type_others',
              label: 'Skill Type(Others)',
              type: 'text',
              required: true,
              placeholder: 'Skill Type(Others)',
              validation: [
                {
                  regex: REGEX_PATTERNS.MIN_3,
                  errorMessage: 'Skill type must more than 2 characters.',
                },
                {
                  regex: REGEX_PATTERNS.MAX_64,
                  errorMessage: 'Max length exceeded.',
                },
                {
                  regex:
                    REGEX_PATTERNS.NO_LEADING_OR_TRAILING_SPECIAL_EXTENDED_REGEX,
                  errorMessage:
                    'Cannot start or end with a space or special character',
                },
                {
                  regex: REGEX_PATTERNS.SKILL_OTHERS_ALLOWED_CHARS_REGEX,
                  errorMessage:
                    "Only letters, hyphens (-), apostrophes ('), periods (.), underscores (_), and spaces are allowed.",
                },
              ],
            },
            {
              id: 'skill_subtype_others',
              label: 'Skill SubType(Others)',
              type: 'text',
              required: true,
              placeholder: 'Skill SubType(Others)',
              validation: [
                {
                  regex: REGEX_PATTERNS.MIN_3,
                  errorMessage: 'Skill subtype must more than 2 characters.',
                },
                {
                  regex: REGEX_PATTERNS.MAX_64,
                  errorMessage: 'Max length exceeded.',
                },
                {
                  regex:
                    REGEX_PATTERNS.NO_LEADING_OR_TRAILING_SPECIAL_EXTENDED_REGEX,
                  errorMessage:
                    'Cannot start or end with a space or special character',
                },
                {
                  regex: REGEX_PATTERNS.SKILL_OTHERS_ALLOWED_CHARS_REGEX,
                  errorMessage:
                    "Only letters, hyphens (-), apostrophes ('), periods (.), underscores (_), and spaces are allowed.",
                },
              ],
            },
          ],
        },
      ],
    },
  },
  {
    id: 'skill_level_name',
    sortId: 'skill_level_name',
    label: 'Skill Level',
    width: 140,
    sortable: true,
    editable: true,
    field: {
      type: 'select',
      required: false,
      placeholder: 'Choose Skill Level',
      options: skillLevelOptions,
    },
  },
  {
    id: 'skill_details',
    sortId: 'skill_details',
    label: 'Skill Details',
    width: 180,
    sortable: true,
    editable: true,
    field: {
      type: 'textarea',
      required: true,
      placeholder: 'Enter Skill Details',
      validation: [
        {
          regex: REGEX_PATTERNS.MAX_2000,
          errorMessage: 'Input must be between 1 and 2,000 characters.',
        },
      ],
    },
  },
  {
    id: 'r_number',
    sortId: 'r_number',
    label: 'Skill ID',
    width: 130,
    sortable: true,
  },
];
