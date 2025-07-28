import { ListTableColumn } from '../../../../../../components/table/types';
import { FinancialResourceCost } from '../../../../../types';

export const getFinancialResourceCostColumns =
  (): ListTableColumn<FinancialResourceCost>[] => [
    {
      id: 'project_code',
      label: 'Project Code',
      sortable: false,
      sortId: 'project_code',
      width: 130,
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
      id: 'project_name',
      label: 'Project Name',
      sortable: false,
      sortId: 'project_name',
      width: 130,
    },
    {
      id: 'project_id',
      label: 'Project ID',
      sortable: false,
      sortId: 'project_id',
      width: 130,
    },
    {
      id: 'resource_code',
      label: 'Resource Code',
      sortable: false,
      sortId: 'resource_code',
      width: 130,
    },
    {
      id: 'resource_name',
      label: 'Resource name',
      sortable: false,
      sortId: 'resource_name',
      width: 130,
    },
    {
      id: 'resource_type',
      label: 'Resource Type',
      sortable: false,
      sortId: 'resource_type',
      width: 130,
    },
    {
      id: 'country',
      label: 'Country',
      sortable: false,
      sortId: 'country',
      width: 130,
    },
    {
      id: 'region',
      label: 'Region',
      sortable: false,
      sortId: 'region',
      width: 130,
    },
    {
      id: 'cost',
      label: 'Cost',
      sortable: false,
      sortId: 'cost',
      width: 130,
    },
    {
      id: 'rd',
      label: 'RD %',
      sortable: false,
      sortId: 'rd',
      width: 130,
    },
    {
      id: 'project_qre',
      label: 'Project QRE',
      sortable: false,
      sortId: 'rd',
      width: 130,
    },
    {
      id: 'rd_credit',
      label: 'RD Credit',
      sortable: false,
      sortId: 'rd_credit',
      width: 130,
    },
  ];
