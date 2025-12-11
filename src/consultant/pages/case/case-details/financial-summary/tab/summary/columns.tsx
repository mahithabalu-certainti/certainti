import { costDisplay } from '../../../../../../../common-utils';
import { ListTableColumn } from '../../../../../../../components/table/types';
import {
  ClaimJurisdiction,
  SummaryDetailedMetric,
  SummaryResourceMetric,
} from '../../../../../../types';

export const getResourceMetricColumns = (
  permissionMap: Record<string, { read: boolean; edit: boolean }>
): ListTableColumn<SummaryResourceMetric>[] => [
    {
      id: 'metric',
      label: 'Metrics',
      sortable: false,
      sortId: 'metric',
      width: '16%',
      sticky: true,
      sx: {
        position: 'sticky',
        left: 0,
        background: '#fff',
        zIndex: 10,
        borderRight: '1px solid #CBD6E2 !important',
        borderBottom: '1px solid #CBD6E2 !important',
      },
      hide: !permissionMap?.['metric']?.read,
    },
    {
      id: 'fte',
      label: 'FTE',
      sortable: false,
      sortId: 'fte',
      width: '28%',
      sx: {
        textAlign: 'right',
      },
      hide: !permissionMap?.['fte']?.read,
    },
    {
      id: 'subcon',
      label: 'Sub Con',
      sortable: false,
      sortId: 'subcon',
      width: '28%',
      sx: {
        textAlign: 'right',
      },
      hide: !permissionMap?.['subcon']?.read,
    },
    {
      id: 'nonlabor',
      label: 'Non Labor',
      sortable: false,
      sortId: 'nonlabor',
      width: '28%',
      sx: {
        textAlign: 'right',
      },
      hide: !permissionMap?.['nonlabor']?.read,
    },
  ];

export const getDetailedMetricColumns = (
  currencySymbol?: string
): ListTableColumn<SummaryDetailedMetric>[] => [
    {
      id: 'metric_name',
      label: 'Metrics',
      sortable: false,
      sortId: 'metric_name',
      width: '20%',
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
      id: 'project_level',
      label: 'Project Level',
      sortable: false,
      sortId: 'project_level',
      width: '20%',
      sx: {
        textAlign: 'right',
      },
      render: (row: SummaryDetailedMetric) =>
        row.metric_name &&
          row.project_level &&
          (row.metric_name === 'FTE Cost' ||
            row.metric_name === 'Sub Con Cost' ||
            row.metric_name === 'Non Labor Cost')
          ? costDisplay(row.project_level, currencySymbol)
          : row.project_level || '-',
    },
    {
      id: 'project_resource_level',
      label: 'Project Resource Level',
      sortable: false,
      sortId: 'project_resource_level',
      width: '20%',
      sx: {
        textAlign: 'right',
      },
      render: (row: SummaryDetailedMetric) =>
        row.metric_name &&
          row.project_resource_level &&
          (row.metric_name === 'FTE Cost' ||
            row.metric_name === 'Sub Con Cost' ||
            row.metric_name === 'Non Labor Cost')
          ? costDisplay(row.project_resource_level, currencySymbol)
          : row.project_resource_level || '-',
    },
    {
      id: 'project_task_level',
      label: 'Project Task Level',
      sortable: false,
      sortId: 'project_task_level',
      width: '20%',
      sx: {
        textAlign: 'right',
      },
      render: (row: SummaryDetailedMetric) =>
        row.metric_name &&
          row.project_task_level &&
          (row.metric_name === 'FTE Cost' ||
            row.metric_name === 'Sub Con Cost' ||
            row.metric_name === 'Non Labor Cost')
          ? costDisplay(row.project_task_level, currencySymbol)
          : row.project_task_level || '-',
    },
    {
      id: 'approved',
      label: 'Approved',
      sortable: false,
      sortId: 'approved',
      width: '20%',
      sx: {
        textAlign: 'right',
      },
      render: (row: SummaryDetailedMetric) =>
        row.metric_name &&
          row.approved &&
          (row.metric_name === 'FTE Cost' ||
            row.metric_name === 'Sub Con Cost' ||
            row.metric_name === 'Non Labor Cost')
          ? costDisplay(row.approved, currencySymbol)
          : row.approved || '-',
    },
  ];

export const getClaimJurisdictionColumns = (
  permissionMap: Record<string, { read: boolean; edit: boolean }>,
  currencySymbol?: string
): ListTableColumn<ClaimJurisdiction>[] => [
    {
      id: 'name',
      label: 'Claim Jurisdiction',
      sortable: false,
      sortId: 'name',
      width: '20%',
      sticky: true,
      sx: {
        position: 'sticky',
        left: 0,
        background: '#fff',
        zIndex: 10,
        borderRight: '1px solid #CBD6E2 !important',
        borderBottom: '1px solid #CBD6E2 !important',
      },
      hide: !permissionMap?.['name']?.read,
    },
    {
      id: 'rd_credits_fte',
      label: 'RD Credits - FTE',
      sortable: false,
      sortId: 'rd_credits_fte',
      width: '20%',
      sx: {
        textAlign: 'right',
      },
      hide: !permissionMap?.['rd_credits_fte']?.read,
      render: (row: ClaimJurisdiction) =>
        row.rd_credits_fte
          ? costDisplay(row.rd_credits_fte, currencySymbol)
          : '-',
    },
    {
      id: 'rd_credits_subcon',
      label: 'RD Credits - SubCon',
      sortable: false,
      sortId: 'rd_credits_subcon',
      width: '20%',
      sx: {
        textAlign: 'right',
      },
      hide: !permissionMap?.['rd_credits_subcon']?.read,
      render: (row: ClaimJurisdiction) =>
        row.rd_credits_subcon
          ? costDisplay(row.rd_credits_subcon, currencySymbol)
          : '-',
    },
    {
      id: 'rd_credits_nonlabor',
      label: 'RD Credits - NonLabor',
      sortable: false,
      sortId: 'rd_credits_nonlabor',
      width: '20%',
      sx: {
        textAlign: 'right',
      },
      hide: !permissionMap?.['rd_credits_nonlabor']?.read,
      render: (row: ClaimJurisdiction) =>
        row.rd_credits_nonlabor
          ? costDisplay(row.rd_credits_nonlabor, currencySymbol)
          : '-',
    },
    {
      id: 'rd_credits_total',
      label: 'RD Credits - Total',
      sortable: false,
      sortId: 'rd_credits_total',
      width: '20%',
      sx: {
        textAlign: 'right',
      },
      render: (row: ClaimJurisdiction) =>
        row.rd_credits_total
          ? costDisplay(row.rd_credits_total, currencySymbol)
          : '-',
    },
  ];
