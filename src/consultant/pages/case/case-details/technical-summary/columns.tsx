import { formatDateToYYYYMMDDWithTime } from '../../../../../common-utils';
import { ListTableColumn } from '../../../../../components/table/types';
import { TechnicalSummaryList } from '../../../../types';

export const getTechnicalSummaryListColumns = (
  handleView?: (row: TechnicalSummaryList) => void,
  permissionMap?: Record<string, { read: boolean; edit: boolean }>
): ListTableColumn<TechnicalSummaryList>[] => [
  {
    id: 'r_number',
    sortId: 'r_number',
    label: 'Sequence Number',
    width: 160,
    sortable: true,
    sticky: true,
    hide:
      !permissionMap?.['r_number']?.edit && !permissionMap?.['r_number']?.read,
    sx: {
      position: 'sticky',
      left: 32,
      background: '#fff',
      zIndex: 10,
      borderRight: '1px solid #CBD6E2',
      borderBottom: '1px solid #CBD6E2 !important',
    },
    render: (row: TechnicalSummaryList) =>
      handleView ? (
        <span
          onClick={() => handleView(row)}
          className='cursor-pointer !text-[#1755E7] !underline hover:underline hover:text-[#1755E7]'
        >
          {row.r_number}
        </span>
      ) : (
        row.r_number
      ),
  },
  {
    id: 'project_code',
    sortId: 'project_code',
    label: 'Project Code',
    width: 160,
    sortable: true,
    // hide:
    //   !permissionMap?.['project_code']?.edit &&
    //   !permissionMap?.['project_code']?.read,
  },
  {
    id: 'project_name',
    sortId: 'project_name',
    label: 'Project Name',
    width: 160,
    sortable: true,
    // hide:
    //   !permissionMap?.['project_name']?.edit &&
    //   !permissionMap?.['project_name']?.read,
  },
  {
    id: 'version',
    sortId: 'version',
    label: 'Summary Version',
    width: 160,
    sortable: true,
    sx: { textAlign: 'right' },
    hide:
      !permissionMap?.['version']?.edit && !permissionMap?.['version']?.read,
  },
  {
    id: 'created_user_name',
    sortId: 'created_user_name',
    label: 'Created By',
    width: 160,
    sortable: false,
    hide:
      !permissionMap?.['created_by']?.edit &&
      !permissionMap?.['created_by']?.read,
  },
  {
    id: 'created_datetime',
    sortId: 'created_datetime',
    label: 'Created On',
    width: 200,
    sortable: true,
    hide:
      !permissionMap?.['created_datetime']?.edit &&
      !permissionMap?.['created_datetime']?.read,
    render: (row: TechnicalSummaryList) =>
      formatDateToYYYYMMDDWithTime(row.created_datetime),
  },
  // {
  //   id: 'modified_user_name',
  //   sortId: 'modified_user_name',
  //   label: 'Updated By',
  //   width: 160,
  //   sortable: true,
  //   hide:
  //     !permissionMap?.['modified_by']?.edit &&
  //     !permissionMap?.['modified_by']?.read,
  // },
  // {
  //   id: 'modified_datetime',
  //   sortId: 'modified_datetime',
  //   label: 'Updated On',
  //   width: 200,
  //   sortable: true,
  //   hide:
  //     !permissionMap?.['modified_datetime']?.edit &&
  //     !permissionMap?.['modified_datetime']?.read,
  //   render: (row: TechnicalSummaryList) =>
  //     formatDateToYYYYMMDDWithTime(row.modified_datetime),
  // },
];
