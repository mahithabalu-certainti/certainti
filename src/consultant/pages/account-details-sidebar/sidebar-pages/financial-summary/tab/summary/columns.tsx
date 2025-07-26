import { ListTableColumn } from '../../../../../../../components/table/types';
import {
  SummaryClaimJurisdiction,
  SummaryDetailedMetric,
  SummaryResourceMetric,
} from '../../../../../../types';

export const getResourceMetricColumns =
  (): ListTableColumn<SummaryResourceMetric>[] => [
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
    },
  ];

export const getDetailedMetricColumns =
  (): ListTableColumn<SummaryDetailedMetric>[] => [
    {
      id: 'metric_name',
      label: 'Metrics',
      sortable: false,
      sortId: 'metric_name',
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
      id: 'project_level',
      label: 'Project Level',
      sortable: false,
      sortId: 'project_level',
      width: '25%',
      sx: {
        textAlign: 'right',
      },
    },
    {
      id: 'project_resource_level',
      label: 'Project Resource Level',
      sortable: false,
      sortId: 'project_resource_level',
      width: '25%',
      sx: {
        textAlign: 'right',
      },
    },
    {
      id: 'project_task_level',
      label: 'Project Task Level',
      sortable: false,
      sortId: 'project_task_level',
      width: '25%',
      sx: {
        textAlign: 'right',
      },
    }
  ];

export const getClaimJurisdictionColumns =
  (): ListTableColumn<SummaryClaimJurisdiction>[] => [
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
    },
    {
      id: 'rd_credits_fte',
      label: 'RD Credits - FTE',
      sortable: false,
      sortId: 'rd_credits_fte',
      width: '25%',
      sx: {
        textAlign: 'right',
      },
    },
    {
      id: 'rd_credits_subcon',
      label: 'RD Credits - SubCon',
      sortable: false,
      sortId: 'rd_credits_subcon',
      width: '25%',
      sx: {
        textAlign: 'right',
      },
    },
    {
      id: 'rd_credits_nonlabor',
      label: 'RD Credits - NonLabor',
      sortable: false,
      sortId: 'rd_credits_nonlabor',
      width: '25%',
      sx: {
        textAlign: 'right',
      },
    },
  ];
