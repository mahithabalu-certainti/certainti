import { ListTableColumn } from '../../../../../../../components/table/types';
import { ProjectDocumentItem } from '../../../../../../types';

export const getProjectDocumentsColumns =
  () //   permissionMap: Record<string, { read: boolean; edit: boolean }>
  : ListTableColumn<ProjectDocumentItem>[] => [
    {
      id: 'r_number',
      label: 'Project Number',
      sortable: true,
      sortId: 'r_number',
      width: 160,
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
      id: 'project_ref_id',
      label: 'Project Ref Id',
      sortable: true,
      sortId: 'project_ref_id',
      width: 180,
    },
    {
      id: 'project_name',
      label: 'Project Name',
      sortable: true,
      sortId: 'project_name',
      width: 200,
    },
    {
      id: 'document_number',
      label: 'Document Number',
      sortable: true,
      sortId: 'document_number',
      width: 180,
    },
    {
      id: 'document_type',
      label: 'Document Type',
      sortable: true,
      sortId: 'document_type',
      width: 160,
    },
    {
      id: 'document_name',
      label: 'Document Name',
      sortable: true,
      sortId: 'document_name',
      width: 200,
    },
  ];
