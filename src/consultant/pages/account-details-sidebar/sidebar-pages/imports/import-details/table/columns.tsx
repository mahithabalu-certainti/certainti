import { ListTableColumn } from '../../../../../../../components/table/types';
import { ImportErrorRecord } from '../../../../../../types/imports';

export const importsErrorColumns: ListTableColumn<ImportErrorRecord>[] = [
  {
    id: 'id',
    sortId: 'id',
    label: 'File ID',
    width: 300,
    sortable: false,
    sticky: true,
    sx: {
      position: 'sticky',
      left: 0,
      background: '#fff',
      zIndex: 10,
      borderRight: '1px solid #CBD6E2',
      borderBottom: '1px solid #CBD6E2 !important',
    },
  },
  {
    id: 'reason',
    sortId: 'reason',
    label: 'Reason',
    width: 300,
    sortable: false,
  },
  {
    id: 'description',
    sortId: 'description',
    label: 'Description',
    width: 300,
    sortable: false,
  },
];
