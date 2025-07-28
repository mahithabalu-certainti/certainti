import { ListTableColumn } from '../../../../../../components/table/types';
import { ProjectFinancialResourceCostList } from '../../../../../types';

export const getFinancialResourceCostColumns =
  (): ListTableColumn<ProjectFinancialResourceCostList>[] => [
    {
      id: 'resource_code',
      label: 'Resource Code',
      sortable: true,
      sortId: 'resource_code',
      width: 140,
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
      id: 'resource_name',
      label: 'Resource name',
      sortable: true,
      sortId: 'resource_name',
      width: 160,
    },
    {
      id: 'resource_type_name',
      label: 'Resource Type',
      sortable: true,
      sortId: 'resource_type_name',
      width: 140,
    },
    {
      id: 'country_name',
      label: 'Country',
      sortable: true,
      sortId: 'country_name',
      width: 160,
    },
    {
      id: 'region_name',
      label: 'Region',
      sortable: true,
      sortId: 'region_name',
      width: 160,
    },
    {
      id: 'total_cost_pro_res',
      label: 'Cost',
      sortable: true,
      sortId: 'total_cost_pro_res',
      width: 140,
      sx: {
        textAlign: 'right',
      },
    },
    {
      id: 'rd_percent_final',
      label: 'RD %',
      sortable: true,
      sortId: 'rd_percent_final',
      width: 140,
      sx: {
        textAlign: 'right',
      },
    },
    {
      id: 'qre_final',
      label: 'Project QRE',
      sortable: true,
      sortId: 'qre_final',
      width: 140,
      sx: {
        textAlign: 'right',
      },
    },
    {
      id: 'rd_credits_total',
      label: 'RD Credit',
      sortable: true,
      sortId: 'rd_credits_total',
      width: 140,
      sx: {
        textAlign: 'right',
      },
    },
  ];
