/* eslint-disable @typescript-eslint/no-explicit-any */
import { ListTableColumn } from '../../../../components/table/types';
import { ManageAccountList } from '../../../types/manage-account';

export const manageUserAccountListColumns = () // selectedUserRid: any
: ListTableColumn<any>[] => [
  {
    id: 'project_code',
    sortId: 'project_code',
    label: 'Project Code',
    width: '45%',
    sortable: true,
    sticky: true,
    sx: {
      textAlign: 'left',
      position: 'sticky',
      left: 0,
      background: '#fff',
      zIndex: 10,
      borderRight: '1px solid #CBD6E2 !important',
      borderBottom: '1px solid #CBD6E2 !important',
    },
    render: (row: ManageAccountList) => {
      return row.project_code;
    },
  },
  {
    id: 'project_name',
    sortId: 'project_name',
    label: 'Project Name',
    width: '40%',
    sortable: true,
    sticky: true,
    sx: {
      textAlign: 'left',
      position: 'sticky',
      left: 0,
      background: '#fff',
      zIndex: 10,
      borderRight: '1px solid #CBD6E2 !important',
      borderBottom: '1px solid #CBD6E2 !important',
    },
    render: (row: ManageAccountList) => {
      return row.project_name;
    },
  },
];
