import { costDisplay, valueDisplay } from '../../../../../../../common-utils';
import { ListTableColumn } from '../../../../../../../components/table/types';
import { TimesheetResourceListType } from '../../../../../../types/timesheet-projects';

export const getResourceTabTableColumns = (
  permissionMap?: Record<string, { read: boolean; edit: boolean }>,
): ListTableColumn<TimesheetResourceListType>[] =>
  [
    {
      id: 'resource_code',
      label: 'Resource Code',
      sortable: true,
      sortId: 'resource_code',
      width: 180,
      sticky: true,
      hide:
        !permissionMap?.['resource_code']?.read &&
        !permissionMap?.['resource_code']?.edit,
      sx: {
        position: 'sticky',
        left: 0,
        background: '#fff',
        zIndex: 10,
        borderRight: '1px solid #CBD6E2 !important',
        borderBottom: '1px solid #CBD6E2 !important',
      },
    },
    {
      id: 'country_name',
      label: 'Resource Country',
      sortable: true,
      hide:
        !permissionMap?.['country_rid']?.read &&
        !permissionMap?.['country_rid']?.edit,
      sortId: 'country_name',
      width: 160,
    },
    {
      id: 'region_name',
      label: 'Resource Region',
      sortable: true,
      hide:
        !permissionMap?.['region_rid']?.read &&
        !permissionMap?.['region_rid']?.edit,
      sortId: 'region_name',
      width: 160,
      render: (row: TimesheetResourceListType) => {
        return row.region_name
      },
    },

    {
      id: 'total_hours_pro_res',
      label: 'Effort (Hours)',
      sortable: true,
      hide:
        !permissionMap?.['total_hours_pro_res']?.read &&
        !permissionMap?.['total_hours_pro_res']?.edit,
      sortId: 'total_hours_pro_res',
      width: 170,
      sx: {
        textAlign: 'right',
      },
      render: (row: TimesheetResourceListType) =>
        row.total_hours_pro_res ? valueDisplay(row.total_hours_pro_res) : '-',

    },
    {
      id: 'total_cost_pro_res',
      label: 'Cost',
      sortable: true,
      hide:
        !permissionMap?.['total_cost_pro_res']?.read &&
        !permissionMap?.['total_cost_pro_res']?.edit,
      sortId: 'total_cost_pro_res',
      width: 130,
      sx: {
        textAlign: 'right',
      },
      render: (row: TimesheetResourceListType) =>
        row.total_cost_pro_res ? costDisplay(row.total_cost_pro_res, row.currency_symbol) : '-',
    },
    {
      id: 'qre_percent',
      label: 'QRE %',
      sortable: true,
      sortId: 'qre_percent',
      width: 130,
      sx: {
        textAlign: 'right',
      },
      hide: !permissionMap?.['qre_percent']?.read && !permissionMap?.['qre_percent']?.edit,
      render: (row: TimesheetResourceListType) => (row.qre_percent ? row.qre_percent : '-'),
    },
    {
      id: 'qre_final',
      label: 'QRE',
      sortable: true,
      sortId: 'qre_final',
      width: 130,
      sx: {
        textAlign: 'right',
      },
      hide:
        !permissionMap?.['qre_final']?.read &&
        !permissionMap?.['qre_final']?.edit,
      render: (row: TimesheetResourceListType) =>
        row.qre_final ? costDisplay(row.qre_final, row.currency_symbol) : '-',
    },
    {
      id: 'description',
      label: 'Comments',
      sortable: true,
      sortId: 'description',
      width: 200,
      hide:
        !permissionMap?.['description']?.read && !permissionMap?.['description']?.edit,
    },

  ];