import { costDisplay, REGEX_PATTERNS } from '../../../../common-utils';
import {
  DependencyRowData,
  ListOption,
  ListTableColumn,
} from '../../../../components/table/types';
import { AccountList, OthersEnum } from '../../../types/account';
import { formatNumberWithCommas } from './utils';

export const getAccountColumns = (
  onClick: (row: AccountList) => void,
  countryOptions: ListOption[],
  industryOptions: ListOption[],
  handleEdit: (row: AccountList, field?: string, section?: string) => void,
  permissionMap: Record<string, { read: boolean; edit: boolean }>
): ListTableColumn<AccountList>[] => [
  {
    id: 'account_name',
    editId: 'account_name',
    sortId: 'account_name',
    label: 'Account Name',
    width: 250,
    sortable: true,
    sticky: true,
    editable:
      permissionMap?.['account_name']?.read &&
      permissionMap?.['account_name']?.edit,
    hide:
      !permissionMap?.['account_name']?.read &&
      !permissionMap?.['account_name']?.edit,
    sx: {
      position: 'sticky',
      left: '32px',
      background: '#fff',
      zIndex: 10,
      borderRight: '1px solid #CBD6E2',
      borderBottom: '1px solid #CBD6E2 !important',
    },
    render: (row: AccountList & { _level?: number }) => {
      const isClickable = row._level === undefined || row._level < 2;

      return isClickable ? (
        <span
          onClick={() => onClick(row)}
          className={`cursor-pointer ${row._level === 1 ? '!text-[#1755E7] !underline !text-[13px] !font-semibold' : ''}`}
        >
          {row.account_name}
        </span>
      ) : (
        <span className='cursor-default !no-underline !text-[13px] !font-semibold !text-[#425A76]'>
          {row.account_name}
        </span>
      );
    },
    field: {
      type: 'text',
      required: true,
      placeholder: 'Enter Name',
      validation: [
        {
          regex: REGEX_PATTERNS.MIN_ACCOUNT_NAME_REGEX,
          errorMessage: 'Name must be more than 2 characters long',
        },
        {
          regex: REGEX_PATTERNS.MAX_ACCOUNT_NAME_REGEX,
          errorMessage: 'Max length exceeded',
        },
        {
          regex: REGEX_PATTERNS.ACCOUNT_NAME,
          errorMessage:
            "Only allows letters, numbers, spaces, hyphens (-), ampersands (&), periods (.), apostrophes ('), and commas (,).",
        },
      ],
    },
  },
  {
    id: 'industry',
    editId: 'industry_rid',
    sortId: 'industry',
    label: 'Industry',
    width: 200,
    sortable: true,
    editable:
      permissionMap?.['industry_rid']?.read &&
      permissionMap?.['industry_rid']?.edit,
    hide:
      !permissionMap?.['industry_rid']?.read &&
      !permissionMap?.['industry_rid']?.edit,
    field: {
      type: 'select',
      required: true,
      placeholder: 'Choose Industry',
      options: industryOptions,
      getFieldData: (rowData: DependencyRowData) => {
        const industryId = rowData.industry
          ? (rowData.industry as { rid: string }).rid
          : '';
        return String(industryId);
      },
      dependencies: [
        {
          dependsOn: 'industry',
          condition: (value) => {
            const found = industryOptions.find(
              (opt) => String(opt.value) === String(value)
            );
            return found?.label.toLowerCase() === OthersEnum.Other;
          },
          action: 'show_modal',
          modalFields: [
            {
              id: 'industry_name_other',
              editId: 'industry_name_other',
              label: 'Industry-other',
              type: 'text',
              required: true,
              placeholder: 'Enter Industry-other',
              validation: [
                {
                  regex: REGEX_PATTERNS.MIN_3,
                  errorMessage:
                    'Industry-other must be more than 2 characters long',
                },
                {
                  regex: REGEX_PATTERNS.MAX_255,
                  errorMessage: 'Max length exceeded',
                },
                {
                  regex: REGEX_PATTERNS.ALLOWED_CHARS_EXTENDED_NAME_REGEX,
                  errorMessage:
                    "Only allows letters, numbers, spaces, hyphens (-), ampersands (&), periods (.), apostrophes ('), and commas (,).",
                },
              ],
            },
          ],
        },
      ],
    },
    render: (row: AccountList) =>
      row.industry_name_other
        ? `${row.industry?.industry_name} - ${row.industry_name_other}`
        : row.industry?.industry_name,
  },
  {
    id: 'country',
    editId: 'country_rid',
    sortId: 'country',
    label: 'Country',
    width: 150,
    sortable: true,
    editable:
      permissionMap?.['country_rid']?.read &&
      permissionMap?.['country_rid']?.edit,
    hide:
      !permissionMap?.['country_rid']?.read &&
      !permissionMap?.['country_rid']?.edit,
    field: {
      type: 'select',
      required: false,
      placeholder: 'Choose Country',
      options: countryOptions,
      getFieldData: (rowData: DependencyRowData) => {
        const countryId = rowData.country
          ? (rowData.country as { rid: string }).rid
          : '';
        return String(countryId);
      },
    },
    render: (row: AccountList) => row.country?.country_name || '-',
  },
  {
    id: 'total_projects',
    sortId: 'total_projects',
    label: 'Total Projects',
    width: 150,
    sortable: true,
    sx: {
      textAlign: 'right',
    },
    hide:
      !permissionMap?.['total_projects']?.read &&
      !permissionMap?.['total_projects']?.edit,
    render: (row: AccountList) =>
      row.total_projects ? (row.total_projects).toLocaleString() : '-',
  },
  {
    id: 'total_project_hours',
    sortId: 'total_project_hours',
    label: 'Total Project Hours',
    width: 180,
    sortable: true,
    sx: {
      textAlign: 'right',
    },
    hide:
      !permissionMap?.['total_project_hours']?.read &&
      !permissionMap?.['total_project_hours']?.edit,
    render: (row: AccountList) =>
      formatNumberWithCommas(row.total_project_hours),
  },
  {
    id: 'total_project_cost',
    sortId: 'total_project_cost',
    label: 'Total Cost',
    width: 150,
    sortable: true,
    sx: {
      textAlign: 'right',
    },
    hide:
      !permissionMap?.['total_project_cost']?.read &&
      !permissionMap?.['total_project_cost']?.edit,

    render: (row: AccountList) =>
      costDisplay(row.total_project_cost, row.currency?.currency_symbol),
  },
  {
    id: 'qualifying_project_hours_fed',
    sortId: 'qualifying_project_hours_fed',
    label: 'Estimated R&D Hours',
    width: 200,
    sortable: true,
    hide:
      !permissionMap?.['qualifying_project_hours_fed']?.read &&
      !permissionMap?.['qualifying_project_hours_fed']?.edit,
    sx: {
      textAlign: 'right',
    },
  },
  {
    id: 'qualifying_project_qre_fed',
    sortId: 'qualifying_project_qre_fed',
    label: 'QRE Final',
    width: 140,
    sortable: true,
    hide:
      !permissionMap?.['qualifying_project_qre_fed']?.read &&
      !permissionMap?.['qualifying_project_qre_fed']?.edit,
    sx: {
      textAlign: 'right',
    },
    render: (row: AccountList) =>
      costDisplay(
        row.qualifying_project_qre_fed,
        row.currency?.currency_symbol
      ),
  },
  {
    id: 'qualifying_project_rd_credits_fed',
    sortId: 'qualifying_project_rd_credits_fed',
    label: 'Estimated R&D Credits',
    width: 200,
    sortable: true,
    sx: {
      textAlign: 'right',
    },
    hide:
      !permissionMap?.['qualifying_project_rd_credits_fed']?.read &&
      !permissionMap?.['qualifying_project_rd_credits_fed']?.edit,
    render: (row: AccountList) =>
      costDisplay(
        row.qualifying_project_rd_credits_fed,
        row.currency?.currency_symbol
      ),
  },
  {
    id: 'total_projects_rd_credits',
    sortId: 'total_projects_rd_credits',
    label: 'Actual R&D Credits',
    width: 180,
    sortable: true,
    sx: {
      textAlign: 'right',
    },
    hide:
      !permissionMap?.['total_projects_rd_credits']?.read &&
      !permissionMap?.['total_projects_rd_credits']?.edit,
    render: (row: AccountList) =>
      costDisplay(row.total_projects_rd_credits, row.currency?.currency_symbol),
  },
  {
    id: 'finance_executive',
    sortId: 'finance_executive',
    label: 'Finance Executive',
    width: 200,
    sortable: true,
    hide:
      !permissionMap?.['keyContacts']?.read &&
      !permissionMap?.['keyContacts']?.edit,
    render: (row: AccountList & { _level?: number }) => {
      const isClickable =
        permissionMap?.['keyContacts']?.read &&
        permissionMap?.['keyContacts']?.edit &&
        (row._level === undefined || row._level < 2);
      return isClickable ? (
        <div
          onDoubleClick={() =>
            handleEdit(row, row.finance_executive, 'key_contacts_list')
          }
          className='!h-[31px] !min-h[31px] pt-1.5'
        >
          {row.finance_executive}
        </div>
      ) : (
        <span>{row.finance_executive}</span>
      );
    },
  },
  {
    id: 'finance_lead',
    sortId: 'finance_lead',
    label: 'Finance Lead',
    width: 160,
    sortable: true,
    hide:
      !permissionMap?.['keyContacts']?.read &&
      !permissionMap?.['keyContacts']?.edit,
    render: (row: AccountList & { _level?: number }) => {
      const isClickable =
        permissionMap?.['keyContacts']?.read &&
        permissionMap?.['keyContacts']?.edit &&
        (row._level === undefined || row._level < 2);
      return isClickable ? (
        <div
          onDoubleClick={() =>
            handleEdit(row, row.finance_lead, 'key_contacts_list')
          }
          className='!h-[31px] !min-h[31px] pt-1.5'
        >
          {row.finance_lead}
        </div>
      ) : (
        <span>{row.finance_lead}</span>
      );
    },
  },
  {
    id: 'professional_services_consultant',
    sortId: 'professional_services_consultant',
    label: 'Professional Services Consultant',
    width: 250,
    sortable: true,
    hide:
      !permissionMap?.['keyContacts']?.read &&
      !permissionMap?.['keyContacts']?.edit,
    render: (row: AccountList & { _level?: number }) => {
      const isClickable =
        permissionMap?.['keyContacts']?.read &&
        permissionMap?.['keyContacts']?.edit &&
        (row._level === undefined || row._level < 2);
      return isClickable ? (
        <div
          onDoubleClick={() =>
            handleEdit(
              row,
              row.professional_services_consultant,
              'key_contacts_list'
            )
          }
          className='!h-[31px] !min-h[31px] pt-1.5'
        >
          {row.professional_services_consultant}
        </div>
      ) : (
        <span>{row.professional_services_consultant}</span>
      );
    },
  },
  {
    id: 'r_number',
    sortId: 'r_number',
    label: 'Account ID',
    width: 120,
    sortable: true,
    hide:
      !permissionMap?.['r_number']?.read && !permissionMap?.['r_number']?.edit,
  },
];
