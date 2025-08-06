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
  },
];

export const getDetailedMetricColumns =
  (): ListTableColumn<SummaryDetailedMetric>[] => [
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
  permissionMap: Record<string, { read: boolean; edit: boolean }>
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
  },
];

export const getRdCreditsColumns = (
  permissionMap: Record<string, { read: boolean; edit: boolean }>
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
  },
];

export const getClaimJurisdictionColumns = (
  permissionMap: Record<string, { read: boolean; edit: boolean }>
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
  },
];
