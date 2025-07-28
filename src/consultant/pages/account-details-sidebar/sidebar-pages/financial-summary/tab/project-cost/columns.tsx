import { ListTableColumn } from '../../../../../../../components/table/types';
import { FinancialProjectCostList } from '../../../../../../types';

export const getFinancialProjectCostColumns =
  (): ListTableColumn<FinancialProjectCostList>[] => [
    {
      id: 'project_code',
      editId: 'project_code',
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
    },
    {
      id: 'fiscal_year',
      editId: 'fiscal_year',
      sortId: 'fiscal_year',
      label: 'Fiscal Year',
      width: 130,
      sortable: true,
      render: (row: FinancialProjectCostList) => {
        if (typeof row.fiscal_year === 'number') {
          return `FY-${row.fiscal_year}`;
        }
        return '-';
      },
    },
    {
      id: 'project_name',
      editId: 'project_name',
      sortId: 'project_name',
      label: 'Project Name',
      width: 130,
      sortable: true,
    },
    {
      id: 'r_number',
      editId: 'r_number',
      sortId: 'r_number',
      label: 'Project ID',
      width: 130,
      sortable: true,
    },
    {
      id: 'total_cost_fte_prj',
      editId: 'total_cost_fte_prj',
      sortId: 'total_cost_fte_prj',
      label: 'FTE Cost',
      width: 130,
      sortable: true,
    },
    {
      id: 'total_cost_subcon_prj',
      editId: 'total_cost_subcon_prj',
      sortId: 'total_cost_subcon_prj',
      label: 'Sub Con Cost',
      width: 130,
      sortable: true,
    },
    {
      id: 'total_cost_nonlabor_prj',
      editId: 'total_cost_nonlabor_prj',
      sortId: 'total_cost_nonlabor_prj',
      label: 'Non Labor Cost',
      width: 130,
      sortable: true,
    },
    {
      id: 'total_cost_prj',
      editId: 'total_cost_prj',
      sortId: 'total_cost_prj',
      label: 'Project Cost',
      width: 130,
      sortable: true,
    },
    {
      id: 'rd_percent_final',
      editId: 'rd_percent_final',
      sortId: 'rd_percent_final',
      label: 'RD %',
      width: 130,
      sortable: true,
    },
    {
      id: 'qre_final',
      editId: 'qre_final',
      sortId: 'qre_final',
      label: 'Project QRE',
      width: 130,
      sortable: true,
    },
    {
      id: 'rd_credits_total',
      editId: 'rd_credits_total',
      sortId: 'rd_credits_total',
      label: 'RD Credit',
      width: 130,
      sortable: true,
    },
  ];
