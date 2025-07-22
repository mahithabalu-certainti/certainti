import { ListTableColumn } from '../../../../../../../../components/table/types';
import { Radio } from '@mui/material';

interface AssignUsersColumnsProps {
  selectionState: Record<string, 'inclusion' | 'exclusion' | null>;
  handleInclusionChange: (userId: string) => void;
  handleExclusionChange: (userId: string) => void;
}

export const getAccountAssignUsersColumns = ({
  selectionState,
  handleInclusionChange,
  handleExclusionChange,
}: AssignUsersColumnsProps): ListTableColumn<any>[] => [
  {
    id: 'full_name',
    editId: 'full_name',
    sortId: 'full_name',
    label: 'User Full Name',
    width: 150,
    sortable: true,
    sticky: true,
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
    id: 'organization',
    sortId: 'organization',
    label: 'Organisation Name',
    width: 200,
    sortable: true,
  },
  {
    id: 'number_of_users',
    sortId: 'number_of_users',
    label: 'Number of Users',
    width: 140,
    sortable: true,
  },
  {
    id: 'inclusion',
    sortId: 'inclusion',
    label: 'Inclusion',
    width: 140,
    render: (row: any) => (
      <Radio
        checked={selectionState[row.rid] === 'inclusion'}
        onChange={() => handleInclusionChange(row.rid)}
        color='primary'
        sx={{
          '& .MuiSvgIcon-root': {
            fontSize: 20,
          },
          '& .MuiSvgIcon-root path': {
            display: 'none',
          },
          '&:not(.Mui-checked) .MuiSvgIcon-root': {
            border: '2px solid #C0C6CC',
            borderRadius: '50%',
          },
          '&.Mui-checked .MuiSvgIcon-root': {
            border: '5px solid #2A53DF',
            borderRadius: '50%',
            backgroundColor: '#fff',
          },
        }}
      />
    ),
  },
  {
    id: 'exclusion',
    sortId: 'exclusion',
    label: 'Exclusion',
    width: 140,
    render: (row: any) => (
      <Radio
        checked={selectionState[row.rid] === 'exclusion'}
        onChange={() => handleExclusionChange(row.rid)}
        color='primary'
        sx={{
          '& .MuiSvgIcon-root': {
            fontSize: 20,
          },
          '& .MuiSvgIcon-root path': {
            display: 'none',
          },
          '&:not(.Mui-checked) .MuiSvgIcon-root': {
            border: '2px solid #C0C6CC',
            borderRadius: '50%',
          },
          '&.Mui-checked .MuiSvgIcon-root': {
            border: '5px solid #2A53DF',
            borderRadius: '50%',
            backgroundColor: '#fff',
          },
        }}
      />
    ),
  },
];
