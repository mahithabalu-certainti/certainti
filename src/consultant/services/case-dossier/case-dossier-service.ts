import { useQuery, UseQueryResult } from '@tanstack/react-query';
import {
  ResourceSummaryItem,
  ResourceSummaryListURLParams,
  DossierSummary,
  ClosingRemarksItems,
  ClosingRemarksResponse,
} from '../../types';
import {
  ResourceSummaryMockData,
  DossierSummaryMockData,
} from '../../mockdata/dossier';
import { caseServiceApi } from '../../../api/api';
import { getClosingRemarksListURL } from '../urls/dossier-url';



// Resource Summary
export const fetchResourceSummaryList = async (
  params?: ResourceSummaryListURLParams
): Promise<{ resourceSummary: ResourceSummaryItem[]; count: number }> => {
  // const response = await caseServiceApi.get<ResourceSummaryListResponse>(
  //   ResourceSummaryListURL(params)
  // );

  // Mock usage
  console.log('resource-summary-list-params', params);
  await new Promise((resolve) => setTimeout(resolve, 1500));

  return {
    resourceSummary: ResourceSummaryMockData.data.resourceSummary,
    count: ResourceSummaryMockData.data.count,
  };
};

export const useResourceSummaryList = (
  params: ResourceSummaryListURLParams,
  refreshList?: number
): UseQueryResult<
  { resourceSummary: ResourceSummaryItem[]; count: number },
  Error
> => {
  return useQuery<
    { resourceSummary: ResourceSummaryItem[]; count: number },
    Error
  >({
    queryKey: ['resource-summary-list', params, refreshList],
    queryFn: () => fetchResourceSummaryList(params),
    retry: 0,
    gcTime: 0,
    enabled: !!params.accountRid && !!params.caseRid,
  });
};


// Dossier Summary
export const fetchDossierSummary = async (
  accountRid: string,
  caseRid: string
): Promise<DossierSummary> => {
  // const response = await caseServiceApi.get<DossierSummaryResponse>(
  //   `/api/dossier/summary?account_rid=${accountRid}&case_rid=${caseRid}`
  // );

  // Mock usage
  console.log('dossier-summary-params', { accountRid, caseRid });
  await new Promise((resolve) => setTimeout(resolve, 1500));

  return DossierSummaryMockData.data.dossierSummary;
};

export const useDossierSummary = (
  accountRid: string,
  caseRid: string
): UseQueryResult<DossierSummary, Error> => {
  return useQuery<DossierSummary, Error>({
    queryKey: ['dossier-summary', accountRid, caseRid],
    queryFn: () => fetchDossierSummary(accountRid, caseRid),
    retry: 0,
    gcTime: 0,
    enabled: !!accountRid && !!caseRid,
  });
};






export const downloadPdfFromBase64 = (
  base64Data: string,
  filename: string = 'rd-form.pdf'
): void => {
  try {
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


// closing remarks list
export const fetchClosingRemarksList = async (
  accountid: string,
  caseid: string
): Promise<{ closingRemarks: ClosingRemarksItems[]; count: number }> => {
  const response = await caseServiceApi.get<ClosingRemarksResponse>(
    getClosingRemarksListURL(accountid, caseid)
  );
  return {
    closingRemarks: response.data.data.closing_remarks,
    count: response.data.data.closing_remarks.length,
  };
};

export const useClosingRemarksList = (
  accountId: string,
  caseId: string,
  refreshList?: number
): UseQueryResult<
  { closingRemarks: ClosingRemarksItems[]; count: number },
  Error
> => {
  return useQuery<
    { closingRemarks: ClosingRemarksItems[]; count: number },
    Error
  >({
    queryKey: ['closing-remarks-list', accountId, caseId, refreshList],
    queryFn: () => fetchClosingRemarksList(accountId, caseId),
    retry: 0,
    gcTime: 0,
    enabled: !!accountId && !!caseId,
  });
};