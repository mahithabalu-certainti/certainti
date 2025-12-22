import {
  formatDateToYYYYMMDDWithTime,
  getDateFormat,
} from '../../../../common-utils';
import { ListTableColumn } from '../../../../components/table/types';
import { GeoBasedRule } from '../../../types/geo-based-rule';

export const getGeoBasedRuleColumns = (
  permissionMap: Record<string, { read: boolean; edit: boolean }>
): ListTableColumn<GeoBasedRule>[] => [
    {
      id: 'r_number',
      label: 'Geo Based ID',
      sortId: 'r_number',
      sortable: true,
      hide:
        !permissionMap?.['r_number']?.read && !permissionMap?.['r_number']?.edit,
    },
    {
      id: 'config_name',
      label: 'Configuration Name',
      sortId: 'config_name',
      sortable: true,
      width: 250,
      hide:
        !permissionMap?.['config_name']?.read &&
        !permissionMap?.['config_name']?.edit,
      render: (row: GeoBasedRule) => {
        let displayText = 'C-';
        if (row.country_code) {
          displayText += row.country_code;
          if (row.state_name) {
            displayText += `-${row.state_name}`;
          }
          displayText += '-';
        }
        displayText += row.config_name || '';
        return displayText || '-';
      },
    },
    {
      id: 'country_name',
      sortId: 'country_name',
      label: 'Country',
      sortable: true,
      hide:
        !permissionMap?.['country_rid']?.read &&
        !permissionMap?.['country_rid']?.edit,
    },
    {
      id: 'state_name',
      sortId: 'state_name',
      label: 'Region',
      sortable: true,
      hide:
        !permissionMap?.['state_rid']?.read &&
        !permissionMap?.['state_rid']?.edit,
    },
    {
      id: 'is_federal',
      sortId: 'is_federal',
      label: 'Federal',
      sortable: true,
      width: 100,
      hide:
        !permissionMap?.['is_federal']?.read &&
        !permissionMap?.['is_federal']?.edit,
      render: (row: GeoBasedRule) => (row.is_federal ? 'Yes' : 'No'),
    },
    {
      id: 'effective_start_date',
      sortId: 'effective_start_date',
      label: 'Effective Start Date',
      sortable: true,
      editable: true,
      hide:
        !permissionMap?.['effective_start_date']?.read &&
        !permissionMap?.['effective_start_date']?.edit,
      editId: 'effective_start_date',
      render: (row: GeoBasedRule) =>
        row.effective_start_date
          ? getDateFormat(row.effective_start_date)
          : '-',
      field: {
        type: 'date',
        required: true,
        placeholder: 'YYYY-MM-DD',
        dateConfig: {
          disableFutureDates: false,
          // minDate: fiscalDate?.startMin,
          // maxDate: fiscalDate?.startMax,
        },
        //   getFieldData: (rowData: DependencyRowData) => {
        //     handleGetFiscalYear?.(String(rowData.fiscal_year));
        //     return String(rowData.effective_from);
        //   },
        //   resetDependentFields: ['end_date'],
        //   dependencies: [
        //     {
        //       dependsOn: ['fiscal_year'],
        //       condition: (value) => !value,
        //       action: 'disabled',
        //       message: 'Please select a fiscal year first',
        //     },
        //     {
        //       dependsOn: ['end_date'],
        //       action: 'enable',
        //       condition: (value) => !value,
        //       message: '',
        //     },
        //   ],
      },
    },
    {
      id: 'effective_end_date',
      sortId: 'effective_end_date',
      label: 'Effective End Date',
      sortable: true,
      editable: true,
      hide:
        !permissionMap?.['effective_end_date']?.read &&
        !permissionMap?.['effective_end_date']?.edit,
      editId: 'effective_end_date',
      render: (row: GeoBasedRule) =>
        row.effective_end_date
          ? getDateFormat(row.effective_end_date)
          : '-',
      field: {
        type: 'date',
        required: false,
        placeholder: 'YYYY-MM-DD',
      },
    },
    {
      id: 'created_user_name',
      sortId: 'created_user_name',
      label: 'Created By',
      sortable: true,
      hide:
        !permissionMap?.['created_by']?.read &&
        !permissionMap?.['created_by']?.edit,
    },
    {
      id: 'created_datetime',
      sortId: 'created_datetime',
      label: 'Created On',
      sortable: true,
      width: 220,
      hide:
        !permissionMap?.['created_datetime']?.read &&
        !permissionMap?.['created_datetime']?.edit,
      render: (row: GeoBasedRule) =>
        row.created_datetime
          ? formatDateToYYYYMMDDWithTime(row.created_datetime)
          : '-',
    },
    {
      id: 'modified_user_name',
      sortId: 'modified_user_name',
      label: 'Updated By',
      sortable: true,
      hide:
        !permissionMap?.['modified_by']?.read &&
        !permissionMap?.['modified_by']?.edit,
    },
    {
      id: 'modified_datetime',
      sortId: 'modified_datetime',
      label: 'Updated On',
      sortable: true,
      width: 220,
      hide:
        !permissionMap?.['modified_datetime']?.read &&
        !permissionMap?.['modified_datetime']?.edit,
      render: (row: GeoBasedRule) =>
        row.modified_datetime
          ? formatDateToYYYYMMDDWithTime(row.modified_datetime)
          : '-',
    },
    {
      id: 'status_name',
      sortId: 'status_name',
      label: 'Status',
      width: 130,
      sortable: true,
      hide:
        !permissionMap?.['status_rid']?.edit &&
        !permissionMap?.['status_rid']?.read,
      render: (row: GeoBasedRule) => (
        <span
          className={`${row.status_name === 'Active'
            ? 'text-[#199806]'
            : row.status_name === 'In-Active'
              ? 'text-[#f44336] '
              : ''
            }`}
        >
          {row.status_name || '-'}
        </span>
      ),
    },
  ];
