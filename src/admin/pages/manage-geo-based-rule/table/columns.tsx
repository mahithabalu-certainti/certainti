import {
  formatDateToYYYYMMDDWithTime,
  getDateFormatYYYYMMDD,
} from '../../../../common-utils';
import { ListTableColumn } from '../../../../components/table/types';
import { GeoBasedRule } from '../../../types/geo-based-rule';

export const getGeoBasedRuleColumns = (): ListTableColumn<GeoBasedRule>[] => [
  {
    id: 'r_number',
    label: 'Geo Based ID',
    sortId: 'r_number',
    sortable: true,
  },
  {
    id: 'config_name',
    label: 'Config Name',
    sortId: 'config_name',
    sortable: true,
  },
  {
    id: 'country_name',
    sortId: 'country_name',
    label: 'Country',
    sortable: true,
  },
  {
    id: 'state_name',
    sortId: 'state_name',
    label: 'Region',
    sortable: true,
  },
  {
    id: 'is_federal',
    sortId: 'is_federal',
    label: 'Federal',
    sortable: true,
    render: (row: GeoBasedRule) => (row.is_federal ? 'Yes' : 'No'),
  },
  {
    id: 'effective_start_date',
    sortId: 'effective_start_date',
    label: 'Effective Start Date',
    sortable: true,
    editable: true,
    width: 220,
    editId: 'effective_start_date',
    render: (row: GeoBasedRule) =>
      row.effective_start_date
        ? getDateFormatYYYYMMDD(row.effective_start_date)
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
    // width: 220,
    sortable: true,
    editable: true,
    editId: 'effective_end_date',
    render: (row: GeoBasedRule) =>
      row.effective_end_date
        ? getDateFormatYYYYMMDD(row.effective_end_date)
        : '-',
    field: {
      type: 'date',
      required: false,
      placeholder: 'YYYY-MM-DD',
    },
  },
  {
    id: 'created_datetime',
    sortId: 'created_datetime',
    label: 'Created On',
    // width: 220,
    sortable: true,
    render: (row: GeoBasedRule) =>
      row.created_datetime
        ? formatDateToYYYYMMDDWithTime(row.created_datetime)
        : '-',
  },
  {
    id: 'modified_datetime',
    sortId: 'modified_datetime',
    label: 'Updated On',
    width: 220,
    sortable: true,
    render: (row: GeoBasedRule) =>
      row.modified_datetime
        ? formatDateToYYYYMMDDWithTime(row.modified_datetime)
        : '-',
  },
];
