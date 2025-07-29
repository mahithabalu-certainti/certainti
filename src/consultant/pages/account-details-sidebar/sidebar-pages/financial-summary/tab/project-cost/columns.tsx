import { ListTableColumn } from '../../../../../../../components/table/types';
import { FinancialProjectCostList } from '../../../../../../types/account-financial';

export const getFinancialProjectCostColumns = (
  permissionMap: Record<string, { read: boolean; edit: boolean }>
): ListTableColumn<FinancialProjectCostList>[] => {
  return [
    {
      id: 'project_code',
      sortId: 'project_code',
      label: 'Project Code',
      width: 130,
      sticky: true,
      sortable: true,
      sx: {
        position: 'sticky',
        left: 0,
        background: '#fff',
        zIndex: 10,
        borderRight: '1px solid #CBD6E2 !important',
        borderBottom: '1px solid #CBD6E2 !important',
      },
      hide:
        !permissionMap?.['project_code']?.edit &&
        !permissionMap?.['project_code']?.read,
    },
    {
      id: 'fiscal_year',
      sortId: 'fiscal_year',
      label: 'Fiscal Year',
      width: 130,
      sortable: true,
      hide:
        !permissionMap?.['fiscal_year']?.edit &&
        !permissionMap?.['fiscal_year']?.read,
      render: (row: FinancialProjectCostList) =>
        row.fiscal_year ? `FY-${row.fiscal_year}` : '-',
    },
    {
      id: 'project_name',
      sortId: 'project_name',
      label: 'Project Name',
      width: 130,
      sortable: true,
      hide:
        !permissionMap?.['project_name']?.edit &&
        !permissionMap?.['project_name']?.read,
    },
    {
      id: 'r_number',
      sortId: 'r_number',
      label: 'Project ID',
      width: 130,
      sortable: true,
      hide:
        !permissionMap?.['r_number']?.edit &&
        !permissionMap?.['r_number']?.read,
    },
    {
      id: 'total_cost_fte_prj',
      sortId: 'total_cost_fte_prj',
      label: 'FTE Cost',
      width: 130,
      sortable: true,
      hide:
        !permissionMap?.['total_cost_fte_prj']?.edit &&
        !permissionMap?.['total_cost_fte_prj']?.read,
    },
    {
      id: 'total_cost_subcon_prj',
      sortId: 'total_cost_subcon_prj',
      label: 'Sub Con Cost',
      width: 130,
      sortable: true,
      hide:
        !permissionMap?.['total_cost_subcon_prj']?.edit &&
        !permissionMap?.['total_cost_subcon_prj']?.read,
    },
    {
      id: 'total_cost_nonlabor_prj',
      sortId: 'total_cost_nonlabor_prj',
      label: 'Non Labor Cost',
      width: 130,
      sortable: true,
      hide:
        !permissionMap?.['total_cost_nonlabor_prj']?.edit &&
        !permissionMap?.['total_cost_nonlabor_prj']?.read,
    },
    {
      id: 'total_cost_prj',
      sortId: 'total_cost_prj',
      label: 'Project Cost',
      width: 130,
      sortable: true,
      hide:
        !permissionMap?.['total_cost_prj']?.edit &&
        !permissionMap?.['total_cost_prj']?.read,
    },
    {
      id: 'rd_percent_final',
      sortId: 'rd_percent_final',
      label: 'RD %',
      width: 130,
      sortable: true,
      hide:
        !permissionMap?.['rd_percent_final']?.edit &&
        !permissionMap?.['rd_percent_final']?.read,
    },
    {
      id: 'qre_final',
      sortId: 'qre_final',
      label: 'Project QRE',
      width: 130,
      sortable: true,
      hide:
        !permissionMap?.['qre_final']?.edit &&
        !permissionMap?.['qre_final']?.read,
    },
    {
      id: 'rd_credits_total',
      sortId: 'rd_credits_total',
      label: 'RD Credit',
      width: 130,
      sortable: true,
      hide:
        !permissionMap?.['rd_credits_total']?.edit &&
        !permissionMap?.['rd_credits_total']?.read,
    },
  ];
};
