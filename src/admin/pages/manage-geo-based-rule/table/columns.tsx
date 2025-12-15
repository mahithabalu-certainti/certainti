import { formatDateToYYYYMMDDWithTime } from '../../../../common-utils';
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
    label: 'Rule Name',
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
    render: (row: GeoBasedRule) =>
      row.created_datetime
        ? formatDateToYYYYMMDDWithTime(row.created_datetime)
        : '-',
  },
  {
    id: 'modified_datetime',
    sortId: 'modified_datetime',
    label: 'Updated On',
    sortable: true,
    render: (row: GeoBasedRule) =>
      row.modified_datetime
        ? formatDateToYYYYMMDDWithTime(row.modified_datetime)
        : '-',
  },
];
