import { costDisplay, valueDisplay } from '../../../../../../../common-utils';
import { ListTableColumn } from '../../../../../../../components/table/types';
import { TimesheetResourceListType } from '../../../../../../types/timesheet-projects';

export const getResourceTabTableColumns = (
  permissionMap?: Record<string, { read: boolean; edit: boolean }>
): ListTableColumn<TimesheetResourceListType>[] => [
    {
      id: 'resource_code',
      label: 'Resource Code',
      sortable: true,
      sortId: 'resource_code',
      width: 150,
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
      id: 'resource_name',
      sortId: 'resource_name',
      label: 'Name',
      width: 200,
      sortable: true,
      hide:
        !permissionMap?.['resource_name']?.edit &&
        !permissionMap?.['resource_name']?.read,
    },
    {
      id: 'resource_type_name',
      sortId: 'resource_type_rid',
      label: 'Resource Type',
      width: 140,
      sortable: true,
      hide:
        !permissionMap?.['resource_type_rid']?.edit &&
        !permissionMap?.['resource_type_rid']?.read,
    },
    {
      id: 'resource_orgname',
      sortId: 'resource_orgname',
      label: 'Org Name',
      width: 160,
      sortable: true,
      hide:
        !permissionMap?.['resource_orgname']?.edit &&
        !permissionMap?.['resource_orgname']?.read,
    },
    {
      id: 'resource_designation',
      sortId: 'resource_designation',
      label: 'Designation',
      width: 200,
      sortable: true,
      hide:
        !permissionMap?.['resource_designation']?.edit &&
        !permissionMap?.['resource_designation']?.read,
    },
    {
      id: 'resource_role',
      sortId: 'resource_role',
      label: 'Role',
      width: 200,
      sortable: true,
      hide:
        !permissionMap?.['resource_role']?.edit &&
        !permissionMap?.['resource_role']?.read,
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
        return row.region_name;
      },
    },

    {
      id: 'total_project_hours',
      label: 'Total Project Hours',
      sortable: true,
      hide:
        !permissionMap?.['total_project_hours']?.read &&
        !permissionMap?.['total_project_hours']?.edit,
      sortId: 'total_project_hours',
      width: 160,
      sx: {
        textAlign: 'right',
      },
      render: (row: TimesheetResourceListType) =>
        row.total_project_hours ? valueDisplay(row.total_project_hours) : '-',
    },
    {
      id: 'estimated_rd_hours',
      label: 'Estimated R&D Hours',
      sortable: true,
      hide:
        !permissionMap?.['estimated_rd_hours']?.read &&
        !permissionMap?.['estimated_rd_hours']?.edit,
      sortId: 'estimated_rd_hours',
      width: 180,
      sx: {
        textAlign: 'right',
      },
      render: (row: TimesheetResourceListType) =>
        row.estimated_rd_hours
          ? costDisplay(row.estimated_rd_hours, row.currency_symbol)
          : '-',
    },
    {
      id: 'status_name',
      label: 'Status',
      sortable: true,
      sortId: 'status_name',
      width: 150,
      sx: {
        textAlign: 'right',
      },
      hide:
        !permissionMap?.['status_name']?.read &&
        !permissionMap?.['status_name']?.edit,
      render: (row: TimesheetResourceListType) => (
        <span
          className={`${row.status_name === 'Active' ? 'text-[#199806]' : 'text-[#f44336]'
            }`}
        >
          {row.status_name || '-'}
        </span>
      ),
    },
    {
      id: 'comments',
      label: 'Comments',
      sortable: true,
      sortId: 'comments',
      width: 200,
      hide:
        !permissionMap?.['comments']?.read &&
        !permissionMap?.['comments']?.edit,
    },
    {
      id: 'r_number',
      sortId: 'r_number',
      label: 'Resource ID',
      width: 150,
      sortable: true,
      hide:
        !permissionMap?.['r_number']?.edit && !permissionMap?.['r_number']?.read,
    },
  ];
