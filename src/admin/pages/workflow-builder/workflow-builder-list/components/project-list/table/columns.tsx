import { ListTableColumn } from '../../../../../../../components/table/types';
import { Project } from '../../../../../../../consultant/types/project';

export const getAllProjectListColumns = (
  permissionMap: Record<string, { read: boolean; edit: boolean }>,
  accountPermissionMap: Record<string, { read: boolean; edit: boolean }>
): ListTableColumn<Project>[] => [
  {
    id: 'project_code',
    editId: 'project_code',
    label: 'Project Code',
    sortable: true,
    sortId: 'project_code',
    width: 260,
    sticky: true,
    hide:
      !permissionMap?.['project_code']?.read &&
      !permissionMap?.['project_code']?.edit,
    sx: {
      position: 'sticky',
      left: 0,
      background: '#fff',
      zIndex: 10,
      borderRight: '1px solid #CBD6E2 !important',
      borderBottom: '1px solid #CBD6E2 !important',
    },
    render: (row: Project) => {
      const displayCode = row.fiscal_year
        ? `FY${row.fiscal_year} - ${row.project_code}`
        : row.project_code;
      return displayCode;
    },
  },
  {
    id: 'project_name',
    editId: 'project_name',
    label: 'Project Name',
    sortable: true,
    hide:
      !permissionMap?.['project_name']?.read &&
      !permissionMap?.['project_name']?.edit,
    sortId: 'project_name',
    width: 160,
    render: (row: Project) => {
      const isChild = row._level !== undefined && row._level === 1;
      return isChild ? row.project_name : '-';
    },
  },
  {
    id: 'account_name',
    label: 'Account Name',
    sortable: true,
    sortId: 'account_name',
    width: 150,
    hide:
      !accountPermissionMap?.['account_name']?.read &&
      !accountPermissionMap?.['account_name']?.edit,
    render: (row: Project) => {
      const isChild = row._level !== undefined && row._level === 1;
      return isChild ? row.account_name : '-';
    },
  },
  {
    id: 'fiscal_year',
    editId: 'fiscal_year',
    label: 'Fiscal Year',
    sortable: true,
    hide:
      !permissionMap?.['fiscal_year']?.read &&
      !permissionMap?.['fiscal_year']?.edit,
    sortId: 'fiscal_year',
    width: 130,
    sx: {
      textAlign: 'left',
    },
    render: (row: Project) => {
      const isChild = row._level !== undefined && row._level === 1;
      if (!isChild) return '-';
      const displayYear = row.fiscal_year ? `FY-${row.fiscal_year}` : '-';
      return <span>{displayYear}</span>;
    },
  },
  {
    id: 'r_number',
    label: 'Project ID',
    sortable: true,
    sortId: 'r_number',
    width: 140,
    hide:
      !permissionMap?.['r_number']?.read && !permissionMap?.['r_number']?.edit,
  },
];
