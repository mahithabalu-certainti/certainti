import { costDisplay, valueDisplay } from '../../../../../../common-utils';
import { ListTableColumn } from '../../../../../../components/table/types';
import {
  SummaryClaimJurisdiction,
  SummaryDetailedMetric,
  SummaryQRE,
  SummaryRdCredits,
  SummaryRdPercent,
  SummaryResourceMetric,
} from '../../../../../types';

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
    hide: !permissionMap?.['metric']?.edit && !permissionMap?.['metric']?.read,
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
    hide: !permissionMap?.['fte']?.edit && !permissionMap?.['fte']?.read,
    render: (row: SummaryResourceMetric) =>
      row.fte ? valueDisplay(row.fte) : '-',
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
    hide: !permissionMap?.['subcon']?.edit && !permissionMap?.['subcon']?.read,
    render: (row: SummaryResourceMetric) =>
      row.subcon ? valueDisplay(row.subcon) : '-',
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
    hide:
      !permissionMap?.['nonlabor']?.edit && !permissionMap?.['nonlabor']?.read,
    render: (row: SummaryResourceMetric) =>
      row.nonlabor ? valueDisplay(row.nonlabor) : '-',
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
  },
  {
    id: 'project_level',
    label: 'Project Level',
    sortable: false,
    sortId: 'project_level',
    width: '28%',
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
        : valueDisplay(row.project_level) || '-',
  },
  {
    id: 'project_resource_level',
    label: 'Project Resource Level',
    sortable: false,
    sortId: 'project_resource_level',
    width: '28%',
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
    width: '28%',
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
];

export const getRdPercentColumns = (
  permissionMap: Record<string, { read: boolean; edit: boolean }>
): ListTableColumn<SummaryRdPercent>[] => [
  {
    id: 'rd_percent_potential',
    label: 'QRE Percent Potential',
    sortable: false,
    sortId: 'rd_percent_potential',
    width: '30%',
    sticky: true,
    sx: {
      position: 'sticky',
      left: 0,
      background: '#fff',
      zIndex: 10,
      borderRight: '1px solid #CBD6E2 !important',
      borderBottom: '1px solid #CBD6E2 !important',
      textAlign: 'right',
    },
    hide:
      !permissionMap?.['rd_percent_potential']?.edit &&
      !permissionMap?.['rd_percent_potential']?.read,
  },
  {
    id: 'rd_percent_adjustment',
    label: 'QRE Percent Adjustment',
    sortable: false,
    sortId: 'rd_percent_adjustment',
    width: '30%',
    sx: {
      textAlign: 'right',
    },
    hide:
      !permissionMap?.['rd_percent_adjustment']?.edit &&
      !permissionMap?.['rd_percent_adjustment']?.read,
  },
  {
    id: 'rd_percent_final',
    label: 'QRE Percent Final',
    sortable: false,
    sortId: 'rd_percent_final',
    width: '30%',
    sx: {
      textAlign: 'right',
    },
    hide:
      !permissionMap?.['rd_percent_final']?.edit &&
      !permissionMap?.['rd_percent_final']?.read,
  },
];

export const getQREColumns = (
  permissionMap: Record<string, { read: boolean; edit: boolean }>,
  currencySymbol?: string
): ListTableColumn<SummaryQRE>[] => [
  {
    id: 'qre_fte',
    label: 'QRE FTE',
    sortable: false,
    sortId: 'qre_fte',
    width: '25%',
    sticky: true,
    sx: {
      position: 'sticky',
      left: 0,
      background: '#fff',
      zIndex: 10,
      borderRight: '1px solid #CBD6E2 !important',
      borderBottom: '1px solid #CBD6E2 !important',
      textAlign: 'right',
    },
    hide:
      !permissionMap?.['qre_fte']?.edit && !permissionMap?.['qre_fte']?.read,
    render: (row: SummaryQRE) =>
      row.qre_fte ? costDisplay(row.qre_fte, currencySymbol) : '-',
  },
  {
    id: 'qre_subcon',
    label: 'QRE Sub Con',
    sortable: false,
    sortId: 'qre_subcon',
    width: '25%',
    sx: {
      textAlign: 'right',
    },
    hide:
      !permissionMap?.['qre_subcon']?.edit &&
      !permissionMap?.['qre_subcon']?.read,
    render: (row: SummaryQRE) =>
      row.qre_subcon ? costDisplay(row.qre_subcon, currencySymbol) : '-',
  },
  {
    id: 'qre_nonlabor',
    label: 'QRE Non Labor',
    sortable: false,
    sortId: 'qre_nonlabor',
    width: '25%',
    sx: {
      textAlign: 'right',
    },
    hide:
      !permissionMap?.['qre_nonlabor']?.edit &&
      !permissionMap?.['qre_nonlabor']?.read,
    render: (row: SummaryQRE) =>
      row.qre_nonlabor ? costDisplay(row.qre_nonlabor, currencySymbol) : '-',
  },
  {
    id: 'qre_final',
    label: 'QRE Final',
    sortable: false,
    sortId: 'qre_final',
    width: '25%',
    sx: {
      textAlign: 'right',
    },
    hide:
      !permissionMap?.['qre_final']?.edit &&
      !permissionMap?.['qre_final']?.read,
    render: (row: SummaryQRE) =>
      row.qre_final ? costDisplay(row.qre_final, currencySymbol) : '-',
  },
];

export const getRdCreditsColumns = (
  permissionMap: Record<string, { read: boolean; edit: boolean }>,
  currencySymbol?: string
): ListTableColumn<SummaryRdCredits>[] => [
  {
    id: 'rd_credits_fte',
    label: 'RD Credits FTE',
    sortable: false,
    sortId: 'rd_credits_fte',
    width: '25%',
    sticky: true,
    sx: {
      position: 'sticky',
      left: 0,
      background: '#fff',
      zIndex: 10,
      borderRight: '1px solid #CBD6E2 !important',
      borderBottom: '1px solid #CBD6E2 !important',
      textAlign: 'right',
    },
    hide:
      !permissionMap?.['rd_credits_fte']?.edit &&
      !permissionMap?.['rd_credits_fte']?.read,
    render: (row: SummaryRdCredits) =>
      row.rd_credits_fte
        ? costDisplay(row.rd_credits_fte, currencySymbol)
        : '-',
  },
  {
    id: 'rd_credits_subcon',
    label: 'RD Credits Sub Con',
    sortable: false,
    sortId: 'rd_credits_subcon',
    width: '25%',
    sx: {
      textAlign: 'right',
    },
    hide:
      !permissionMap?.['rd_credits_subcon']?.edit &&
      !permissionMap?.['rd_credits_subcon']?.read,
    render: (row: SummaryRdCredits) =>
      row.rd_credits_subcon
        ? costDisplay(row.rd_credits_subcon, currencySymbol)
        : '-',
  },
  {
    id: 'rd_credits_nonlabor',
    label: 'RD Credits Non Labor',
    sortable: false,
    sortId: 'rd_credits_nonlabor',
    width: '25%',
    sx: {
      textAlign: 'right',
    },
    hide:
      !permissionMap?.['rd_credits_nonlabor']?.edit &&
      !permissionMap?.['rd_credits_nonlabor']?.read,
    render: (row: SummaryRdCredits) =>
      row.rd_credits_nonlabor
        ? costDisplay(row.rd_credits_nonlabor, currencySymbol)
        : '-',
  },
  {
    id: 'rd_credits_total',
    label: 'RD Credits Final',
    sortable: false,
    sortId: 'rd_credits_total',
    width: '25%',
    sx: {
      textAlign: 'right',
    },
    hide:
      !permissionMap?.['rd_credits_total']?.edit &&
      !permissionMap?.['rd_credits_total']?.read,
    render: (row: SummaryRdCredits) =>
      row.rd_credits_total
        ? costDisplay(row.rd_credits_total, currencySymbol)
        : '-',
  },
];

export const getClaimJurisdictionColumns = (
  permissionMap: Record<string, { read: boolean; edit: boolean }>,
  currencySymbol?: string
): ListTableColumn<SummaryClaimJurisdiction>[] => [
  {
    id: 'name',
    label: 'Claim Jurisdiction',
    sortable: false,
    sortId: 'name',
    width: '25%',
    sticky: true,
    sx: {
      position: 'sticky',
      left: 0,
      background: '#fff',
      zIndex: 10,
      borderRight: '1px solid #CBD6E2 !important',
      borderBottom: '1px solid #CBD6E2 !important',
    },
    hide: !permissionMap?.['name']?.edit && !permissionMap?.['name']?.read,
  },
  {
    id: 'claim_rd_credits_fte',
    label: 'RD Credits - FTE',
    sortable: false,
    sortId: 'claim_rd_credits_fte',
    width: '25%',
    sx: {
      textAlign: 'right',
    },
    hide:
      !permissionMap?.['claim_rd_credits_fte']?.edit &&
      !permissionMap?.['claim_rd_credits_fte']?.read,
    render: (row: SummaryClaimJurisdiction) =>
      row.claim_rd_credits_fte
        ? costDisplay(row.claim_rd_credits_fte, currencySymbol)
        : '-',
  },
  {
    id: 'claim_rd_credits_subcon',
    label: 'RD Credits - SubCon',
    sortable: false,
    sortId: 'claim_rd_credits_subcon',
    width: '25%',
    sx: {
      textAlign: 'right',
    },
    hide:
      !permissionMap?.['claim_rd_credits_subcon']?.edit &&
      !permissionMap?.['claim_rd_credits_subcon']?.read,
    render: (row: SummaryClaimJurisdiction) =>
      row.claim_rd_credits_subcon
        ? costDisplay(row.claim_rd_credits_subcon, currencySymbol)
        : '-',
  },
  {
    id: 'claim_rd_credits_nonlabor',
    label: 'RD Credits - NonLabor',
    sortable: false,
    sortId: 'claim_rd_credits_nonlabor',
    width: '25%',
    sx: {
      textAlign: 'right',
    },
    hide:
      !permissionMap?.['claim_rd_credits_nonlabor']?.edit &&
      !permissionMap?.['claim_rd_credits_nonlabor']?.read,
    render: (row: SummaryClaimJurisdiction) =>
      row.claim_rd_credits_nonlabor
        ? costDisplay(row.claim_rd_credits_nonlabor, currencySymbol)
        : '-',
  },
];
