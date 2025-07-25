import { ListTableColumn } from '../../../../../../components/table/types';
import {
  SummaryDetailedMetric,
  SummaryQRE,
  SummaryRdCredits,
  SummaryRdPercent,
  SummaryResourceMetric,
} from '../../../../../types';

export const getResourceMetricColumns =
  (): ListTableColumn<SummaryResourceMetric>[] => [
    {
      id: 'metric',
      label: 'Metric',
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
    },
    {
      id: 'fte',
      label: 'FTE',
      sortable: false,
      sortId: 'fte',
      width: '28%',
    },
    {
      id: 'sub_con',
      label: 'Sub Con',
      sortable: false,
      sortId: 'sub_con',
      width: '28%',
    },
    {
      id: 'non_labor',
      label: 'Non Labor',
      sortable: false,
      sortId: 'non_labor',
      width: '28%',
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
      width: '22%',
      sx: {
        textAlign: 'right',
      },
    },
    {
      id: 'project_resource_level',
      label: 'Project Resource Level',
      sortable: false,
      sortId: 'project_resource_level',
      width: '22%',
      sx: {
        textAlign: 'right',
      },
    },
    {
      id: 'project_task_level',
      label: 'Project Task Level',
      sortable: false,
      sortId: 'project_task_level',
      width: '22%',
      sx: {
        textAlign: 'right',
      },
    },
    {
      id: 'approved',
      label: 'Approved',
      sortable: false,
      sortId: 'approved',
      width: '22%',
    },
  ];

export const getRdPercentColumns = (): ListTableColumn<SummaryRdPercent>[] => [
  {
    id: 'rd_percent_potential',
    label: 'RD Percent Potential',
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
    },
  },
  {
    id: 'rd_percent_adjustment',
    label: 'RD Percent Adjustment',
    sortable: false,
    sortId: 'rd_percent_adjustment',
    width: '30%',
    sx: {
      textAlign: 'right',
    },
  },
  {
    id: 'rd_percent_final',
    label: 'RD Percent Final',
    sortable: false,
    sortId: 'rd_percent_final',
    width: '30%',
    sx: {
      textAlign: 'right',
    },
  },
];

export const getQREColumns = (): ListTableColumn<SummaryQRE>[] => [
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
    },
  },
  {
    id: 'qre_sub_con',
    label: 'QRE Sub Con',
    sortable: false,
    sortId: 'qre_sub_con',
    width: '25%',
  },
  {
    id: 'qre_non_labor',
    label: 'QRE Non Labor',
    sortable: false,
    sortId: 'qre_non_labor',
    width: '25%',
  },
  {
    id: 'qre_final',
    label: 'QRE Final',
    sortable: false,
    sortId: 'qre_final',
    width: '25%',
  },
];

export const getRdCreditsColumns = (): ListTableColumn<SummaryRdCredits>[] => [
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
    },
  },
  {
    id: 'rd_credits_sub_con',
    label: 'RD Credits Sub Con',
    sortable: false,
    sortId: 'rd_credits_sub_con',
    width: '25%',
  },
  {
    id: 'rd_credits_non_labor',
    label: 'RD Credits Non Labor',
    sortable: false,
    sortId: 'rd_credits_non_labor',
    width: '25%',
  },
  {
    id: 'rd_credits_total',
    label: 'RD Credits Total',
    sortable: false,
    sortId: 'rd_credits_total',
    width: '25%',
  },
];
