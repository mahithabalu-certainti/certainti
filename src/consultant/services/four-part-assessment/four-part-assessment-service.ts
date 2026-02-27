import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { caseServiceApi } from '../../../api/api';
import {
  FourPartAssessmentList,
  FourPartAssessmentListApiResponse,
  FourPartAssessmentListURLParams,
  FourPartAssessmentDetails,
  FourPartAssessmentDetailsResponse,
  FourPartAssessmentListExportURLParams,
  ExportFourPartAssessmentListResponse,
} from '../../types';
import {
  FourPartAssessmentListURL,
  getFourPartAssessmentExportListURL,
} from '../urls';
import {
  mockFourPartAssessmentDetails,
  mockFourPartAssessmentList,
} from '../../mockdata/four-part-assessment';

const USE_MOCK = true; // Toggle this to switch between mock and real API

export const fetchFourPartAssessmentList = async (
  params: FourPartAssessmentListURLParams
): Promise<{
  fourPartAssessment: FourPartAssessmentList[];
  count: number;
}> => {
  if (USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 1500));
    return {
      fourPartAssessment: mockFourPartAssessmentList.data.four_part_assessment,
      count: mockFourPartAssessmentList.data.total_results,
    };
  }

  const response = await caseServiceApi.get<FourPartAssessmentListApiResponse>(
    FourPartAssessmentListURL(params)
  );
  return {
    fourPartAssessment: response.data.data.four_part_assessment,
    count: response.data.data.total_results,
  };
};

export const useFourPartAssessmentList = (
  params: FourPartAssessmentListURLParams,
  shouldFetch: boolean,
  refreshList?: number
): UseQueryResult<
  { fourPartAssessment: FourPartAssessmentList[]; count: number },
  Error
> => {
  return useQuery<
    { fourPartAssessment: FourPartAssessmentList[]; count: number },
    Error
  >({
    queryKey: ['four-part-assessment-list', params, refreshList],
    queryFn: () => fetchFourPartAssessmentList(params),
    retry: 0,
    gcTime: 0,
    enabled:
      shouldFetch &&
      !!params.attachmentLevel &&
      !!params.accountRid &&
      !!params.entityId,
  });
};

const fetchFourPartAssessmentDetails = async (
  entityId: string,
  fourPartAssessmentId: string
): Promise<FourPartAssessmentDetails> => {
  if (USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 1500));
    return mockFourPartAssessmentDetails.data;
  }

  const response = await caseServiceApi.get<FourPartAssessmentDetailsResponse>(
    `/api/four-part-assessment/details?account_rid=${entityId}&rid=${fourPartAssessmentId}`
  );

  return response.data.data;
};

export const useFourPartAssessmentDetails = (
  entityId?: string,
  fourPartAssessmentId?: string,
  isEnable?: boolean
): UseQueryResult<FourPartAssessmentDetails | undefined, Error> => {
  return useQuery<FourPartAssessmentDetails | undefined, Error>({
    queryKey: [
      'four-part-assessment-details',
      entityId,
      fourPartAssessmentId,
      isEnable,
    ],
    queryFn: () =>
      fetchFourPartAssessmentDetails(entityId!, fourPartAssessmentId!),
    retry: 0,
    gcTime: 0,
    enabled: !!fourPartAssessmentId && !!entityId && isEnable,
  });
};

export const ExportFourPartAssessmentList = async (
  params: FourPartAssessmentListExportURLParams
): Promise<void> => {
  try {
    const filename = 'four_part_assessment_list.xlsx';
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    const response =
      await caseServiceApi.get<ExportFourPartAssessmentListResponse>(
        getFourPartAssessmentExportListURL({ ...params, timezone })
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
