import { useQuery, UseQueryResult } from '@tanstack/react-query';
import {
  ProjectFinancialResourceCostList,
  ProjectFinancialResourceCostResponse,
  ProjectFinancialResourceExportParams,
  ProjectFinancialResourceListParams,
  ProjectFinancialSummary,
  ProjectFinancialSummaryListParams,
  ProjectFinancialSummaryResponse,
} from '../../types';
import { resourceServiceApi } from '../../../api/api';
import {
  ProjectFinancialResourceCostExportURL,
  ProjectFinancialResourceCostURL,
} from '../urls';

const FinancialSummaryURL = () => {
  return `/api/financialHighlight/project`;
};

export const fetchProjectFinancialSummary = async (
  params: ProjectFinancialSummaryListParams
): Promise<ProjectFinancialSummary> => {
  const response =
    await resourceServiceApi.post<ProjectFinancialSummaryResponse>(
      FinancialSummaryURL(),
      params
    );
  return response.data.data;
};

export const useProjectFinancialSummary = (
  params: ProjectFinancialSummaryListParams,
  refreshSummary?: number
): UseQueryResult<ProjectFinancialSummary, Error> => {
  return useQuery<ProjectFinancialSummary, Error>({
    queryKey: ['projectFinancialSummary', params, refreshSummary],
    queryFn: () => fetchProjectFinancialSummary(params),
    retry: 0,
    gcTime: 0,
    enabled:
      !!params.account_rid &&
      !!params.project_fiscal_rid &&
      !!params.fiscal_year,
  });
};

export const fetchProjectFinancialResourceCost = async (
  params: ProjectFinancialResourceListParams
): Promise<{
  projectResourceFiscal: ProjectFinancialResourceCostList[];
  count: number;
}> => {
  const response =
    await resourceServiceApi.get<ProjectFinancialResourceCostResponse>(
      ProjectFinancialResourceCostURL(params)
    );
  return {
    projectResourceFiscal: response.data.data.projectResourceFiscal,
    count: response.data.data.count,
  };
};

export const useProjectFinancialResourceCost = (
  params: ProjectFinancialResourceListParams,
  refresTrigger?: number
): UseQueryResult<
  {
    projectResourceFiscal: ProjectFinancialResourceCostList[];
    count: number;
  },
  Error
> => {
  return useQuery<
    {
      projectResourceFiscal: ProjectFinancialResourceCostList[];
      count: number;
    },
    Error
  >({
    queryKey: ['projectFinancialResource', params, refresTrigger],
    queryFn: () => fetchProjectFinancialResourceCost(params),
    retry: 0,
    gcTime: 0,
    enabled:
      !!params.accountNumber &&
      !!params.accountRid &&
      !!params.projectRid &&
      !!params.fiscalYear,
  });
};

export const exportFinancialResourceCost = async (
  params: ProjectFinancialResourceExportParams
) => {
  try {
    const response = await resourceServiceApi.get(
      ProjectFinancialResourceCostExportURL(params)
    );
    const base64Data = response.data?.data;

    if (!base64Data) {
      console.error('No base64 data found in the response.');
      return;
    }

    const binary = atob(base64Data);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }

    const blob = new Blob([bytes], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'financial_resource_cost_records.xlsx';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error('Export failed:', error);
  }
};
