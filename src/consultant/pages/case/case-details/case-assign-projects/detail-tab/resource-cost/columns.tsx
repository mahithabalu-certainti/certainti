import { costDisplay } from "../../../../../../../common-utils";
import { ListTableColumn } from "../../../../../../../components/table/types";
import { ProjectFinancialResourceCostList } from "../../../../../../types";


export const getFinancialResourceCostColumns = (
  permissionMap: Record<string, { read: boolean; edit: boolean }>,
  currencySymbol?: string
): ListTableColumn<ProjectFinancialResourceCostList>[] => [
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
      hide:
        !permissionMap?.['resource_code']?.edit &&
        !permissionMap?.['resource_code']?.read,
    },
    {
      id: 'resource_name',
      label: 'Resource name',
      sortable: true,
      sortId: 'resource_name',
      width: 160,
      hide:
        !permissionMap?.['resource_name']?.edit &&
        !permissionMap?.['resource_name']?.read,
    },
    {
      id: 'resource_type_name',
      label: 'Resource Type',
      sortable: true,
      sortId: 'resource_type_name',
      width: 140,
      hide:
        !permissionMap?.['resource_type_rid']?.edit &&
        !permissionMap?.['resource_type_rid']?.read,
    },
    {
      id: 'country_name',
      label: 'Country',
      sortable: true,
      sortId: 'country_name',
      width: 160,
      hide:
        !permissionMap?.['country_rid']?.edit &&
        !permissionMap?.['country_rid']?.read,
    },
    {
      id: 'region_name',
      label: 'Region',
      sortable: true,
      sortId: 'region_name',
      width: 160,
      hide:
        !permissionMap?.['region_rid']?.edit &&
        !permissionMap?.['region_rid']?.read,
    },
    {
      id: 'total_cost_pro_res',
      label: 'Net Resource Cost',
      sortable: true,
      sortId: 'total_cost_pro_res',
      width: 160,
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
      label: 'RD %',
      sortable: true,
      sortId: 'rd_percent_final',
      width: 140,
      sx: {
        textAlign: 'right',
      },
      hide:
        !permissionMap?.['rd_percent_final']?.edit &&
        !permissionMap?.['rd_percent_final']?.read,
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
      hide:
        !permissionMap?.['qre_final']?.edit &&
        !permissionMap?.['qre_final']?.read,
      render: (row: ProjectFinancialResourceCostList) =>
        row.qre_final ? costDisplay(row.qre_final, currencySymbol) : '-',
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
      hide:
        !permissionMap?.['rd_credits_total']?.edit &&
        !permissionMap?.['rd_credits_total']?.read,
      render: (row: ProjectFinancialResourceCostList) =>
        row.rd_credits_total
          ? costDisplay(row.rd_credits_total, currencySymbol)
          : '-',
    },
  ];
