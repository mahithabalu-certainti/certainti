import { getDateFormat } from '../../../../common-utils';
import { ListTableColumn } from '../../../../components/table/types';
import { ManageProfileList } from '../../../types';

export const profileColumns: ListTableColumn<ManageProfileList>[] = [
  {
    id: 'profile_name',
    editId: 'profile_name',
    sortId: 'profile_name',
    label: 'Profile Name',
    width: 300,
    sortable: true,
    editable: true,
    sx: {
      position: 'sticky',
      left: '32px',
      background: '#fff',
      zIndex: 10,
      borderRight: '1px solid #CBD6E2',
      borderBottom: '1px solid #CBD6E2 !important',
    },
    field: {
      type: 'text',
      required: true,
      placeholder: 'Enter Profile Name',
      validation: [
        {
          regex: /^.{2,64}$/,
          errorMessage:
            'The profile name must contain a minimum of 2 and a maximum of 64 characters.',
        },
        {
          regex: /^[A-Za-z\s\-_]+$/,
          errorMessage:
            'Profile name can only contain letters, spaces, hyphens (-) and underscores (_).',
        },
        {
          regex: /^[A-Za-z](?:[A-Za-z\s\-_]*[A-Za-z])?$/,
          errorMessage:
            'Profile name cannot begin or end with a space or special character.',
        },
        {
          regex: /^(?!.*(--|__))[A-Za-z\s\-_]+$/,
          errorMessage:
            'Profile name cannot contain consecutive special characters.',
        },
      ],
    },
  },
  {
    id: 'profile_description',
    editId: 'profile_description',
    sortId: 'profile_description',
    label: 'Profile Description',
    width: 500,
    sortable: true,
    editable: true,
    field: {
      type: 'textarea',
      required: true,
      placeholder: 'Enter Profile Description',
      validation: [
        {
          regex: /^.{50,}$/,
          errorMessage: 'Profile Description must be more than 49 characters.',
        },
        {
          regex: /^.{50,2000}$/,
          errorMessage:
            'Profile Description must be between 50 and 2000 characters.',
        },
      ],
    },
  },
  {
    id: 'created_datetime',
    sortId: 'created_on',
    label: 'Created On',
    width: 160,
    sortable: true,
    render: (row: ManageProfileList) => getDateFormat(row.created_datetime),
  },
  {
    id: 'created_by',
    sortId: 'created_by',
    label: 'Created By',
    width: 250,
    sortable: true,
  },
];
