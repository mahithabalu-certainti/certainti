import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { interactionServiceApi } from '../../../api/api';
import {
  RdAssessmentStatusItem,
  RdAssessmentStatusListApiResponse,
  RdAssessmentStatusListURLParams,
  RdAssessmentStatusExportURLParams,
  ExportRdAssessmentStatusListResponse,
} from '../../types';

export const fetchRdAssessmentStatusList = async (
  params: RdAssessmentStatusListURLParams
): Promise<{
  auditInfo: RdAssessmentStatusItem[];
  count: number;
}> => {
  const response =
    await interactionServiceApi.post<RdAssessmentStatusListApiResponse>(
      `/api/interactions/rdAssessmentAudit/list`,
      params
    );
  return {
    auditInfo: response.data.data.auditInfo,
    count: response.data.data.count,
  };
};

export const useRdAssessmentStatusList = (
  params: RdAssessmentStatusListURLParams,
  shouldFetch: boolean,
  refreshList?: number
): UseQueryResult<
  { auditInfo: RdAssessmentStatusItem[]; count: number },
  Error
> => {
  return useQuery<
    { auditInfo: RdAssessmentStatusItem[]; count: number },
    Error
  >({
    queryKey: ['rd-assessment-status-list', params, refreshList],
    queryFn: () => fetchRdAssessmentStatusList(params),
    retry: 0,
    gcTime: 0,
    enabled: shouldFetch && !!params.account_rid,
  });
};

export const ExportRdAssessmentStatusList = async (
  params: RdAssessmentStatusExportURLParams
): Promise<void> => {
  try {
    const filename = 'rd_assessment_status_records.xlsx';
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    const response =
      await interactionServiceApi.post<ExportRdAssessmentStatusListResponse>(
        '/api/interactions/rdAssessmentAudit/export',
        { ...params, timezone }
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
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error('Export failed:', error);
  }
};
