import { formatDateToYYYYMMDDWithTime } from '../../../../../../../common-utils';
import { ListTableColumn } from '../../../../../../../components/table/types';
import { ClosingRemarksItems } from '../../../../../../types';

export const getClosingRemarksColumns =
  (): ListTableColumn<ClosingRemarksItems>[] => [
    {
      id: 'signoff_type_name',
      sortId: 'signoff_type_name',
      label: 'Approved Type',
      width: 180,
      sortable: true,
      // hide:
      //   !permissionMap?.['resource_name']?.read &&
      //   !permissionMap?.['resource_name']?.edit,
    },
    {
      id: 'created_by_name',
      sortId: 'created_by_name',
      label: 'Approved By',
      width: 180,
      sortable: true,
      // hide:
      //   !projectPermissionMap?.['project_code']?.read &&
      //   !projectPermissionMap?.['project_code']?.edit,
    },
    {
      id: 'signoff_at',
      sortId: 'signoff_at',
      label: 'Approved On',
      width: 200,
      sortable: true,
      // hide:
      //   !projectPermissionMap?.['project_name']?.read &&
      //   !projectPermissionMap?.['project_name']?.edit,
      render: (row: ClosingRemarksItems) => {
        return formatDateToYYYYMMDDWithTime(row.signoff_at);
      },
    },
  ];
