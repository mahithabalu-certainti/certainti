import { InteractionList } from '../../consultant/types';
import { ListTableColumn } from '../table/types';

export const getReInitiateConfirmColumns =
  (): ListTableColumn<InteractionList>[] => [
    {
      id: 'r_number',
      sortId: 'r_number',
      label: 'Interaction ID',
      width: 130,
      sortable: false,
    },
    {
      id: 'interaction_level_name',
      sortId: 'interaction_level_name',
      label: 'Interaction Level',
      width: 110,
      sortable: false,
    },
    {
      id: 'fiscal_year',
      sortId: 'fiscal_year',
      label: 'Fiscal Year',
      width: 80,
      sortable: false,
    },
    {
      id: 'key_contact_name',
      sortId: 'key_contact_name',
      label: 'Key Contact Name',
      width: 180,
      sortable: false,
      render: (row: InteractionList) => row?.key_contact_name || '-',
    },
    {
      id: 'key_contact_email',
      sortId: 'key_contact_email',
      label: 'Key Contact Email',
      width: 280,
      sortable: false,
      render: (row: InteractionList) => row?.key_contact_email || '-',
    },
  ];
