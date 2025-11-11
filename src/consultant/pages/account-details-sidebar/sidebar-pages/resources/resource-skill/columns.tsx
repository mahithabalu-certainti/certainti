import { getDateFormat, REGEX_PATTERNS } from '../../../../../../common-utils';
import TextButton from '../../../../../../components/button/text-button';
import {
  DependencyRowData,
  ListOption,
  ListTableColumn,
} from '../../../../../../components/table/types';
import { OthersEnum } from '../../../../../types';
import { ResourceSkillList } from '../../../../../types/resource-skill';

export const getResourceSkillColumns = (
  skillLevelOptions: ListOption[],
  skillTypeOptions: ListOption[],
  skillSubTypeOptions: ListOption[],
  handleSkillType: (rid: string) => void,
  skillTypeLoading: boolean,
  subTypeLoading: boolean,
  permissionMap: Record<string, { read: boolean; edit: boolean }>,
  accountInActive: boolean,
  handleAttachmentClick?: (rowId: string) => void,
  handleCreateNote?: (row: string) => void,
  handleCreateChecklist?: (row: string) => void,
  resourceInActive?: boolean,
  attachmentCreateEnable?: boolean,
  isNoteCreateEnable?: boolean,
  isChecklistCreateEnable?: boolean
): ListTableColumn<ResourceSkillList>[] => [
  {
    id: 'start_date',
    editId: 'start_date',
    sortId: 'start_date',
    label: 'Effective Date',
    width: 160,
    sortable: true,
    render: (row: ResourceSkillList) => (
      <span>{getDateFormat(row.start_date as string) || '-'}</span>
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
    editable:
      permissionMap?.['start_date']?.edit &&
      permissionMap?.['start_date']?.read &&
      !accountInActive,
    hide:
      !permissionMap?.['start_date']?.edit &&
      !permissionMap?.['start_date']?.read,
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
    editId: 'skill_type_rid',
    sortId: 'skill_type_name',
    label: 'Skill Type',
    width: 180,
    sortable: true,
    editable:
      permissionMap?.['skill_type_rid']?.edit &&
      permissionMap?.['skill_type_rid']?.read &&
      !accountInActive,
    hide:
      !permissionMap?.['skill_type_rid']?.edit &&
      !permissionMap?.['skill_type_rid']?.read,
    render: (row: ResourceSkillList) =>
      row.skill_type_others
        ? `${row.skill_type_name} - ${row.skill_type_others}`
        : row.skill_type_name,
    field: {
      type: 'select',
      required: true,
      placeholder: 'Choose Skill Type',
      options: skillTypeOptions,
      loading: skillTypeLoading,
      resetDependentFields: ['skill_subtype_name'],
      onChange: true,
      getFieldData: (rowData: DependencyRowData) => {
        handleSkillType(String(rowData.skill_type_rid));
        return String(rowData.skill_type_rid);
      },
      dependencies: [
        {
          dependsOn: 'skill_subtype_name',
          condition: (value) => !value,
          action: 'enable',
          message: '',
        },
        {
          dependsOn: ['skill_subtype_name', 'skill_type_name'],
          condition: (value, rowData) => {
            const skillSubtype = rowData.skill_subtype_name;
            const skillType = value;
            const bothFieldsHaveValues =
              skillType &&
              skillType !== '' &&
              skillSubtype &&
              skillSubtype !== '';

            if (!bothFieldsHaveValues) {
              return false;
            }

            const typeFound = skillTypeOptions.find(
              (opt) => String(opt.value) === String(skillType)
            );
            const subtypeFound = skillSubTypeOptions.find(
              (opt) => String(opt.value) === String(skillSubtype)
            );

            const directlyShowModal =
              String(skillType).toLowerCase() === OthersEnum.Others ||
              String(skillSubtype).toLowerCase() === OthersEnum.Others;

            // Show modal if either is "Others"
            const shouldShowModal =
              typeFound?.label.toLowerCase() === OthersEnum.Others ||
              subtypeFound?.label.toLowerCase() === OthersEnum.Others;
            return shouldShowModal || directlyShowModal;
          },
          action: 'show_modal',
          modalFields: [
            {
              id: 'skill_type_others',
              editId: 'skill_type_others',
              label: 'Skill Type(Others)',
              type: 'text',
              required: true,
              placeholder: 'Enter Skill Type(Others)',
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
              editId: 'skill_subtype_others',
              label: 'Skill SubType(Others)',
              type: 'text',
              required: true,
              placeholder: 'Enter Skill SubType(Others)',
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
    editId: 'skill_subtype_rid',
    sortId: 'skill_subtype_name',
    label: 'Skill SubType',
    width: 180,
    sortable: true,
    editable:
      permissionMap?.['skill_subtype_rid']?.edit &&
      permissionMap?.['skill_subtype_rid']?.read &&
      !accountInActive,
    hide:
      !permissionMap?.['skill_subtype_rid']?.edit &&
      !permissionMap?.['skill_subtype_rid']?.read,
    render: (row: ResourceSkillList) =>
      row.skill_subtype_others
        ? `${row.skill_subtype_name} - ${row.skill_subtype_others}`
        : row.skill_subtype_name,
    field: {
      type: 'select',
      required: true,
      placeholder: 'Choose Skill SubType',
      options: skillSubTypeOptions,
      loading: subTypeLoading,
      getFieldData: (rowData: DependencyRowData) => {
        return String(rowData.skill_subtype_rid);
      },
      dependencies: [
        {
          dependsOn: 'skill_type_name',
          condition: (value) => !value,
          action: 'enable',
          message: '',
        },
        {
          dependsOn: ['skill_type_name', 'skill_subtype_name'],
          condition: (value, rowData) => {
            const skillType = rowData.skill_type_name;
            const skillSubtype = value;
            const bothFieldsHaveValues =
              skillType &&
              skillType !== '' &&
              skillSubtype &&
              skillSubtype !== '';

            if (!bothFieldsHaveValues) {
              return false;
            }

            const typeFound = skillTypeOptions.find(
              (opt) => String(opt.value) === String(skillType)
            );
            const subtypeFound = skillSubTypeOptions.find(
              (opt) => String(opt.value) === String(skillSubtype)
            );

            const directlyShowModal =
              String(skillType).toLowerCase() === OthersEnum.Others ||
              String(skillSubtype).toLowerCase() === OthersEnum.Others;

            // Show modal if either is "Others"
            const shouldShowModal =
              typeFound?.label.toLowerCase() === OthersEnum.Others ||
              subtypeFound?.label.toLowerCase() === OthersEnum.Others;
            return shouldShowModal || directlyShowModal;
          },
          action: 'show_modal',
          modalFields: [
            {
              id: 'skill_type_others',
              editId: 'skill_type_others',
              label: 'Skill Type(Others)',
              type: 'text',
              required: true,
              placeholder: 'Enter Skill Type(Others)',
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
              editId: 'skill_subtype_others',
              label: 'Skill SubType(Others)',
              type: 'text',
              required: true,
              placeholder: 'Enter Skill SubType(Others)',
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
    editId: 'skill_level_rid',
    sortId: 'skill_level_name',
    label: 'Skill Level',
    width: 140,
    sortable: true,
    editable:
      permissionMap?.['skill_level_rid']?.edit &&
      permissionMap?.['skill_level_rid']?.read &&
      !accountInActive,
    hide:
      !permissionMap?.['skill_level_rid']?.edit &&
      !permissionMap?.['skill_level_rid']?.read,
    field: {
      type: 'select',
      required: false,
      placeholder: 'Choose Skill Level',
      options: skillLevelOptions,
    },
  },
  {
    id: 'skill_details',
    editId: 'skill_details',
    sortId: 'skill_details',
    label: 'Skill Details',
    width: 180,
    sortable: true,
    editable:
      permissionMap?.['skill_details']?.edit &&
      permissionMap?.['skill_details']?.read &&
      !accountInActive,
    hide:
      !permissionMap?.['skill_details']?.edit &&
      !permissionMap?.['skill_details']?.read,
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
    hide:
      !permissionMap?.['r_number']?.edit && !permissionMap?.['r_number']?.read,
  },
  {
    id: 'attachments',
    sortId: 'attachments',
    label: 'Attachments',
    width: 100,
    sortable: false,
    hide: !attachmentCreateEnable,
    render: (row) => (
      <TextButton
        label='Add'
        disabled={accountInActive ? accountInActive : resourceInActive}
        sx={{ width: '45px', minWidth: '45px', maxWidth: '45px', ml: 2.5 }}
        onClick={() => handleAttachmentClick?.(row.rid ?? '')}
      />
    ),
  },
  {
    id: 'notes',
    sortId: 'notes',
    label: 'Notes',
    width: 80,
    sortable: false,
    sx: {
      textAlign: 'center',
    },
    hide: !isNoteCreateEnable,
    render: (row) => (
      <TextButton
        label='Add'
        disabled={accountInActive ? accountInActive : resourceInActive}
        sx={{ width: '45px', minWidth: '45px', maxWidth: '45px' }}
        onClick={() => handleCreateNote?.(row.rid ?? '')}
      />
    ),
  },
  {
    id: 'checklists',
    sortId: 'checklists',
    label: 'Checklists',
    width: 80,
    sortable: false,
    sx: {
      textAlign: 'center',
    },
    hide: !isChecklistCreateEnable,
    render: (row) => (
      <TextButton
        label='Add'
        disabled={accountInActive ? accountInActive : resourceInActive}
        sx={{ width: '45px', minWidth: '45px', maxWidth: '45px' }}
        onClick={() => handleCreateChecklist?.(row.rid ?? '')}
      />
    ),
  },
];
