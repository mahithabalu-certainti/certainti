import { formatDateToYYYYMMDDWithTime } from '../../../../../../common-utils';
import { ListTableColumn } from '../../../../../../components/table/types';
import { ResponseInteractionList } from '../../../../../types';

export const getInteractionListColumns = (
  handleViewInteraction: (rid: ResponseInteractionList) => void
  // permissionMap: Record<string, { read: boolean; edit: boolean }>
): ListTableColumn<ResponseInteractionList>[] => [
  {
    id: 'response_source',
    sortId: 'response_source',
    label: 'Response Via',
    width: 120,
    sortable: true,
    sticky: true,
    // hide:
    //   !permissionMap?.['r_number']?.edit &&
    //   !permissionMap?.['r_number']?.read,
    sx: {
      position: 'sticky',
      left: 32,
      background: '#fff',
      zIndex: 10,
      borderRight: '1px solid #CBD6E2',
      borderBottom: '1px solid #CBD6E2 !important',
    },
    render: (row: ResponseInteractionList) => (
      <span
        onClick={() => handleViewInteraction(row)}
        className='cursor-pointer !text-[#1755E7] !underline hover:underline hover:text-[#1755E7]'
      >
        {row?.response_source}
      </span>
    ),
  },
  {
    id: 'response_on',
    sortId: 'response_on',
    label: 'Response On',
    width: 160,
    sortable: true,
    // hide:
    //   !permissionMap?.['iteration']?.edit &&
    //   !permissionMap?.['iteration']?.read,
    render: (row: ResponseInteractionList) => (
      <span>{formatDateToYYYYMMDDWithTime(row?.response_on)}</span>
    ),
  },
  {
    id: 'response_email',
    sortId: 'response_email',
    label: 'Response Email ID',
    width: 220,
    sortable: true,
    // hide:
    //   !permissionMap?.['interaction_age']?.edit && !permissionMap?.['interaction_age']?.read,
  },
  {
    id: 'response_by',
    sortId: 'response_by',
    label: 'Response By',
    width: 130,
    sortable: true,
    // hide:
    //   !permissionMap?.['recipient_email']?.edit &&
    //   !permissionMap?.['recipient_email']?.read,
  },
];
