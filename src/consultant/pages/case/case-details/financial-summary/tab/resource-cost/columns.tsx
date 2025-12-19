import { costDisplay } from '../../../../../../../common-utils';
import { ListTableColumn } from '../../../../../../../components/table/types';
import { ProjectFinancialResourceCostList } from '../../../../../../types';

export const getFinancialResourceCostColumns = (
  permissionMap: Record<string, { read: boolean; edit: boolean }>,
  currencySymbol?: string
): ListTableColumn<ProjectFinancialResourceCostList>[] => [
  {
    id: 'project_code',
    sortId: 'project_code',
    label: 'Project Number',
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
    hide:
      !permissionMap?.['project_code']?.edit &&
      !permissionMap?.['project_code']?.read,
  },
  {
    id: 'fiscal_year',
    sortId: 'fiscal_year',
    label: 'Fiscal Year',
    width: 130,
    sortable: false,
    render: (row: ProjectFinancialResourceCostList) =>
      row.fiscal_year ? `FY-${row.fiscal_year}` : '-',
    hide:
      !permissionMap?.['fiscal_year']?.edit &&
      !permissionMap?.['fiscal_year']?.read,
  },
  {
    id: 'project_ref_id',
    sortId: 'project_ref_id',
    label: 'Project Ref ID',
    width: 130,
    sortable: true,
    // hide:
    //   !permissionMap?.['project_ref_id']?.edit &&
    //   !permissionMap?.['project_ref_id']?.read,
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
    id: 'resource_ref_id',
    sortId: 'resource_ref_id',
    label: 'Resource Ref ID',
    width: 150,
    sortable: true,
    // hide:
    //   !permissionMap?.['resource_ref_id']?.edit &&
    //   !permissionMap?.['resource_ref_id']?.read,
  },
  {
    id: 'resource_name',
    sortId: 'resource_name',
    label: 'Resource Name',
    width: 160,
    sortable: true,
    hide:
      !permissionMap?.['resource_name']?.edit &&
      !permissionMap?.['resource_name']?.read,
  },
  {
    id: 'resource_type_name',
    sortId: 'resource_type_name',
    label: 'Resource Type',
    width: 130,
    sortable: true,
    hide:
      !permissionMap?.['resource_type_name']?.edit &&
      !permissionMap?.['resource_type_name']?.read,
  },
  {
    id: 'total_cost_pro_res',
    sortId: 'total_cost_pro_res',
    label: 'Cost',
    width: 110,
    sortable: true,
    sx: {
      textAlign: 'right',
    },
    hide:
      !permissionMap?.['total_cost_pro_res']?.edit &&
      !permissionMap?.['total_cost_pro_res']?.read,
    render: (row: ProjectFinancialResourceCostList) =>
      row.total_cost_pro_res
        ? costDisplay(row.total_cost_pro_res, currencySymbol)
        : '-',
  },
  {
    id: 'rd_percent_final',
    sortId: 'rd_percent_final',
    label: 'RD %',
    width: 130,
    sortable: true,
    sx: {
      textAlign: 'right',
    },
    hide:
      !permissionMap?.['rd_percent_final']?.edit &&
      !permissionMap?.['rd_percent_final']?.read,
  },
  {
    id: 'qre_final',
    sortId: 'qre_final',
    label: 'QRE',
    width: 110,
    sortable: true,
    sx: {
      textAlign: 'right',
    },
    hide:
      !permissionMap?.['qre_final']?.edit &&
      !permissionMap?.['qre_final']?.read,
    render: (row: ProjectFinancialResourceCostList) =>
      row.qre_final ? costDisplay(row.qre_final, currencySymbol) : '-',
  },
  {
    id: 'rd_credits_total',
    sortId: 'rd_credits_total',
    label: 'RD Credit',
    width: 130,
    sortable: true,
    sx: {
      textAlign: 'right',
    },
    hide:
      !permissionMap?.['rd_credits_total']?.edit &&
      !permissionMap?.['rd_credits_total']?.read,
    render: (row: ProjectFinancialResourceCostList) =>
      row.rd_credits_total
        ? costDisplay(row.rd_credits_total, currencySymbol)
        : '-',
  },
];
