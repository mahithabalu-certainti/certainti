import { formatDateToYYYYMMDDWithTime } from '../../../../common-utils';
import { ListTableColumn } from '../../../../components/table/types';

export interface GeoBasedRuleList {
  rid: string;
  rule_name: string;
  country: string;
  region: string;
  created_datetime: string;
  modified_datetime: string;
}

export const getGeoBasedRuleColumns =
  (): ListTableColumn<GeoBasedRuleList>[] => [
    {
      id: 'rule_name',
      label: 'Rule Name',
      sortId: 'rule_name',
      sortable: true,
      // field: {
      //     type: 'text',
      //     placeholder: 'Enter Rule Name',
      // }
    },
    {
      id: 'country',
      sortId: 'country',
      label: 'Country',
      sortable: true,
    },
    {
      id: 'region',
      sortId: 'region',
      label: 'Region',
      sortable: true,
    },
    {
      id: 'is_federal',
      sortId: 'is_federal',
      label: 'Federal',
      sortable: true,
    },
    {
      id: 'effective_start_date',
      sortId: 'effective_start_date',
      label: 'Effective Start Date',
      sortable: true,
    },
    {
      id: 'effective_end_date',
      sortId: 'effective_end_date',
      label: 'Effective End Date',
      sortable: true,
    },
    {
      id: 'created_datetime',
      sortId: 'created_datetime',
      label: 'Created On',
      sortable: true,
      render: (row: GeoBasedRuleList) =>
        row.created_datetime
          ? formatDateToYYYYMMDDWithTime(row.created_datetime)
          : '-',
    },
    {
      id: 'modified_datetime',
      sortId: 'modified_datetime',
      label: 'Updated On',
      sortable: true,
      render: (row: GeoBasedRuleList) =>
        row.modified_datetime
          ? formatDateToYYYYMMDDWithTime(row.modified_datetime)
          : '-',
    },
  ];
