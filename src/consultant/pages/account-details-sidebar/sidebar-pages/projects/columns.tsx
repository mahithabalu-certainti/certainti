import {
  costDisplay,
  formatDateToYYYYMMDDWithTime,
  valueDisplay,
  REGEX_PATTERNS,
} from '../../../../../common-utils';
import {
  DependencyRowData,
  ListTableColumn,
} from '../../../../../components/table/types';
import { ListOption } from '../../../../../components/table/types';
import { OthersEnum } from '../../../../types';
import { Project } from '../../../../types/project';
import { DATE_CONFIG } from '../../../resource-form/form-data';

const getFiscalYears = (range: number) => {
  const currentYear = new Date().getFullYear();
  return Array.from({ length: range }, (_, i) => {
    const year = currentYear - i;
    return { label: `FY-${year}`, value: year };
  });
};

const fiscalYears = getFiscalYears(DATE_CONFIG.COST_FISCAL_YEARS_RANGE);
export const formatDateToYMD = (dateString: string): string => {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return ''; // Handle invalid dates
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
};
export const getProjectColumns = (
  onClick: (row: Project) => void,
  memoizedProjectTypes: ListOption[],
  memoizedClassification: ListOption[],
  handleEdit: (row: Project, field?: string | null, section?: string) => void,
  permissionMap: Record<string, { read: boolean; edit: boolean }>,
  accountInActive?: boolean
): ListTableColumn<Project>[] => [
    {
      id: 'project_code',
      editId: 'project_code',
      label: 'Project Code',
      sortable: true,
      sortId: 'project_code',
      width: 260,
      sticky: true,
      editable:
        permissionMap?.['project_code']?.read &&
        permissionMap?.['project_code']?.edit &&
        !accountInActive,
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
          <span
            onClick={() => onClick(row)}
            className={
              row.fiscal_year
                ? 'cursor-pointer !text-[#1755E7] !underline hover:underline hover:text-[#1755E7]'
                : ''
            }
          >
            {displayCode}
          </span>
        ) : (
          displayCode
        );
      },
      field: {
        type: 'text',
        required: true,
        placeholder: 'Enter Project Code',
        validation: [
          {
            regex: REGEX_PATTERNS.MIN_5,
            errorMessage: 'Project code must be more than 4 characters long',
          },
          {
            regex: REGEX_PATTERNS.MAX_50,
            errorMessage: 'Max length exceeded',
          },
          {
            regex: REGEX_PATTERNS.PROJECT_NAME,
            errorMessage:
              "Only allows letters, numbers, spaces, hyphens (-), ampersands (&), periods (.), apostrophes ('), commas (,) and underscore(_)",
          },
        ],
      },
    },
    {
      id: 'project_name',
      editId: 'project_name',
      label: 'Name',
      sortable: true,
      sortId: 'project_name',
      width: 160,
      editable:
        permissionMap?.['project_name']?.read &&
        permissionMap?.['project_name']?.edit &&
        !accountInActive,
      hide:
        !permissionMap?.['project_name']?.read &&
        !permissionMap?.['project_name']?.edit,
      field: {
        type: 'text',
        required: false,
        placeholder: 'Enter Name',
        validation: [
          {
            regex: REGEX_PATTERNS.MIN_4,
            errorMessage: 'Name must be more than 3 characters long',
          },
          {
            regex: REGEX_PATTERNS.MAX_255,
            errorMessage: 'Max length exceeded',
          },
          {
            regex: REGEX_PATTERNS.PROJECT_NAME,
            errorMessage:
              "Only allows letters, numbers, spaces, hyphens (-), ampersands (&), periods (.), apostrophes ('), commas (,) and underscore(_)",
          },
        ],
      },
    },
    {
      id: 'project_type_name',
      editId: 'project_type_rid',
      label: 'Project Type',
      sortable: true,
      sortId: 'project_type_rid',
      width: 160,
      editable:
        permissionMap?.['project_type_rid']?.read &&
        permissionMap?.['project_type_rid']?.edit &&
        !accountInActive,
      hide:
        !permissionMap?.['project_type_rid']?.read &&
        !permissionMap?.['project_type_rid']?.edit,
      field: {
        type: 'select',
        required: true,
        placeholder: '',
        options: memoizedProjectTypes,
      },
    },
    {
      id: 'fiscal_year',
      editId: 'fiscal_year',
      label: 'Fiscal Year',
      sortable: true,
      editable:
        permissionMap?.['fiscal_year']?.read &&
        permissionMap?.['fiscal_year']?.edit &&
        !accountInActive,
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
      field: {
        type: 'select',
        required: true,
        placeholder: '',
        options: fiscalYears,
      },
    },
    {
      id: 'classification_name',
      editId: 'project_classification_rid',
      label: 'Project Classification',
      sortable: true,
      sortId: 'classification_name',
      editable:
        permissionMap?.['project_classification_rid']?.read &&
        permissionMap?.['project_classification_rid']?.edit &&
        !accountInActive,
      hide:
        !permissionMap?.['project_classification_rid']?.read &&
        !permissionMap?.['project_classification_rid']?.edit,
      width: 170,
      render: (row: Project) =>
        row.project_classification_other
          ? `${row.classification_name} - ${row.project_classification_other}`
          : row.classification_name,
      field: {
        type: 'select',
        required: false,
        placeholder: 'Choose Classification',
        options: memoizedClassification,
        getFieldData: (rowData: DependencyRowData) => {
          return String(rowData.project_classification_rid);
        },
        dependencies: [
          {
            dependsOn: 'classification_name',
            condition: (value) => {
              const found = memoizedClassification.find(
                (opt) => String(opt.value) === String(value)
              );
              return found?.label.toLowerCase() === OthersEnum.Other;
            },
            action: 'show_modal',
            modalFields: [
              {
                id: 'project_classification_other',
                label: 'Classification-Other',
                type: 'text',
                required: true,
                placeholder: 'Enter Classification-Other',
                validation: [
                  {
                    regex: REGEX_PATTERNS.MIN_3,
                    errorMessage:
                      'Classification-Other must be more than 2 characters long',
                  },
                  {
                    regex: REGEX_PATTERNS.MAX_255,
                    errorMessage: 'Max length exceeded',
                  },
                  {
                    regex: REGEX_PATTERNS.PROJECT_NAME,
                    errorMessage:
                      "Only allows letters, numbers, spaces, hyphens (-), ampersands (&), periods (.), apostrophes ('), commas (,) and underscore(_)",
                  },
                ],
              },
            ],
          },
        ],
      },
    },
    {
      id: 'project_client_group',
      editId: 'project_client_group',
      label: 'Customer Group',
      sortable: true,
      sortId: 'project_client_group',
      width: 160,
      editable:
        permissionMap?.['project_client_group']?.read &&
        permissionMap?.['project_client_group']?.edit &&
        !accountInActive,
      hide:
        !permissionMap?.['project_client_group']?.read &&
        !permissionMap?.['project_client_group']?.edit,
      field: {
        type: 'text',
        required: false,
        placeholder: 'Enter Customer Group',
        validation: [
          {
            regex: REGEX_PATTERNS.MIN_4,
            errorMessage: 'Customer Group must be more than 3 characters long',
          },
          {
            regex: REGEX_PATTERNS.MAX_255,
            errorMessage: 'Max length exceeded',
          },
          {
            regex: REGEX_PATTERNS.PROJECT_NAME,
            errorMessage:
              "Only allows letters, numbers, spaces, hyphens (-), ampersands (&), periods (.), apostrophes ('), commas (,) and underscore(_)",
          },
        ],
      },
    },
    {
      id: 'project_group',
      editId: 'project_group',
      label: 'Project Group',
      sortable: true,
      sortId: 'project_group',
      editable:
        permissionMap?.['project_group']?.read &&
        permissionMap?.['project_group']?.edit &&
        !accountInActive,
      hide:
        !permissionMap?.['project_group']?.read &&
        !permissionMap?.['project_group']?.edit,
      width: 160,
      field: {
        type: 'text',
        required: false,
        placeholder: 'Enter Project Group',
        validation: [
          {
            regex: REGEX_PATTERNS.MIN_4,
            errorMessage: 'Project group must be more than 3 characters long',
          },
          {
            regex: REGEX_PATTERNS.MAX_255,
            errorMessage: 'Max length exceeded',
          },
          {
            regex: REGEX_PATTERNS.PROJECT_NAME,
            errorMessage:
              "Only allows letters, numbers, spaces, hyphens (-), ampersands (&), periods (.), apostrophes ('), commas (,) and underscore(_)",
          },
        ],
      },
    },
    {
      id: 'total_effort',
      editId: 'total_effort',
      label: 'Project Effort (Hours)',
      sortable: true,
      sortId: 'total_effort',
      width: 170,
      editable:
        permissionMap?.['total_effort']?.read &&
        permissionMap?.['total_effort']?.edit &&
        !accountInActive,
      hide:
        !permissionMap?.['total_effort']?.read &&
        !permissionMap?.['total_effort']?.edit,
      sx: {
        textAlign: 'right',
      },
      render: (row: Project) =>
        row.total_effort ? valueDisplay(row.total_effort) : '-',
      field: {
        type: 'text',
        required: false,
        placeholder: 'Enter Project Effort',
        validation: [
          {
            regex: REGEX_PATTERNS.EFFORTS_NUMBER,
            errorMessage:
              'Only positive numbers allowed, up to 16 digits and 2 decimal places',
          },
        ],
      },
    },
    {
      id: 'total_cost',
      editId: 'total_cost',
      label: 'Project Cost',
      sortable: true,
      sortId: 'total_cost',
      width: 130,
      editable:
        permissionMap?.['total_cost']?.read &&
        permissionMap?.['total_cost']?.edit &&
        !accountInActive,
      hide:
        !permissionMap?.['total_cost']?.read &&
        !permissionMap?.['total_cost']?.edit,
      sx: {
        textAlign: 'right',
      },
      render: (row: Project) =>
        row.total_cost ? costDisplay(row.total_cost, row.currency_symbol) : '-',
      field: {
        type: 'text',
        required: false,
        placeholder: 'Enter Project Cost',
        validation: [
          {
            regex: REGEX_PATTERNS.EFFORTS_NUMBER,
            errorMessage:
              'Project Cost must be a positive integer with up to 16 digits and 2 decimal places',
          },
        ],
      },
    },
    {
      id: 'total_cost_fte',
      editId: 'total_cost_fte',
      label: 'FTE Cost',
      sortable: true,
      sortId: 'total_cost_fte',
      width: 140,
      editable:
        permissionMap?.['total_cost_fte']?.read &&
        permissionMap?.['total_cost_fte']?.edit &&
        !accountInActive,
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
      field: {
        type: 'text',
        required: false,
        placeholder: 'Enter FTE Cost',
        validation: [
          {
            regex: REGEX_PATTERNS.EFFORTS_NUMBER,
            errorMessage:
              'Only positive numbers allowed, up to 16 digits and 2 decimal places',
          },
        ],
      },
    },
    {
      id: 'total_cost_subcon',
      editId: 'total_cost_subcon',
      label: 'SubCon Cost',
      sortable: true,
      sortId: 'total_cost_subcon',
      width: 140,
      editable:
        permissionMap?.['total_cost_subcon']?.read &&
        permissionMap?.['total_cost_subcon']?.edit &&
        !accountInActive,
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
      field: {
        type: 'text',
        required: false,
        placeholder: 'Enter Sub Con Cost',
        validation: [
          {
            regex: REGEX_PATTERNS.EFFORTS_NUMBER,
            errorMessage:
              'Sub Con Cost must be a positive integer up to 16 digits and 2 decimal places',
          },
        ],
      },
    },
    {
      id: 'total_cost_nonlabor',
      editId: 'total_cost_nonlabor',
      label: 'Non-Labor Cost',
      sortable: true,
      sortId: 'total_cost_nonlabor',
      editable:
        permissionMap?.['total_cost_nonlabor']?.read &&
        permissionMap?.['total_cost_nonlabor']?.edit &&
        !accountInActive,
      hide:
        !permissionMap?.['total_cost_nonlabor']?.read &&
        !permissionMap?.['total_cost_nonlabor']?.edit,
      width: 140,
      sx: {
        textAlign: 'right',
      },
      render: (row: Project) =>
        row.total_cost_nonlabor
          ? costDisplay(row.total_cost_nonlabor, row.currency_symbol)
          : '-',
      field: {
        type: 'text',
        required: false,
        placeholder: 'Enter Non Labor Cost',
        validation: [
          {
            regex: REGEX_PATTERNS.EFFORTS_NUMBER,
            errorMessage:
              'Non Labor Cost must be a positive integer with up to 16 digits and 2 decimal places',
          },
        ],
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
      render: (row: Project) =>
        row.qre_final ? costDisplay(row.qre_final, row.currency_symbol) : '-',
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
      id: 'project_point_of_contact',
      label: 'Project Point of Contact',
      sortable: true,
      sortId: 'project_point_of_contact',
      width: 200,
      hide:
        !permissionMap?.['key_contacts']?.read &&
        !permissionMap?.['key_contacts']?.edit,
      render: (row: Project & { _level?: number }) => {
        const isClickable =
          permissionMap?.['key_contacts']?.read &&
          permissionMap?.['key_contacts']?.edit &&
          row._level !== undefined &&
          row._level === 1;
        return isClickable ? (
          <div
            onDoubleClick={() =>
              handleEdit(row, row.project_point_of_contact, 'key_contacts_list')
            }
            className='!h-[31px] !min-h[31px] pt-1.5'
          >
            {row.project_point_of_contact}
          </div>
        ) : (
          <span>{row.project_point_of_contact}</span>
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
        const isClickable =
          permissionMap?.['key_contacts']?.read &&
          permissionMap?.['key_contacts']?.edit &&
          row._level !== undefined &&
          row._level === 1;
        return isClickable ? (
          <div
            onDoubleClick={() =>
              handleEdit(row, row.technical_point_of_contact, 'key_contacts_list')
            }
            className='!h-[31px] !min-h[31px] pt-1.5'
          >
            {row.technical_point_of_contact}
          </div>
        ) : (
          <span>{row.technical_point_of_contact}</span>
        );
      },
    },
    {
      id: 'comments',
      editId: 'comments',
      label: 'Comments',
      sortable: true,
      sortId: 'comments',
      width: 200,
      editable:
        permissionMap?.['comments']?.read &&
        permissionMap?.['comments']?.edit &&
        !accountInActive,
      hide:
        !permissionMap?.['comments']?.read && !permissionMap?.['comments']?.edit,
      field: {
        type: 'textarea',
        required: false,
        placeholder: 'Enter Comments',
        validation: [
          {
            regex: REGEX_PATTERNS.MAX_2000,
            errorMessage: 'Maximum 2000 characters allowed',
          },
        ],
      },
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
