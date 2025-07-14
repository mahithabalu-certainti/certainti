import { useQuery } from '@tanstack/react-query';
import { api } from '../../../api/api';
import { ResourceDetailsApiResponse } from '../../types';
import { ExportResourcelUrl, ResourceDetailURL } from '../urls';
import { ExportModule } from '../../types/resource-skill';
import {
  ExportResourceCostUrl,
  ExportResourceSkillUrl,
} from '../urls/resource-cost-skill-urls';

export const fetchResourceDetail = async (
  resourceId: string,
  accountNumber: string
): Promise<ResourceDetailsApiResponse> => {
  const response = await api.get<ResourceDetailsApiResponse>(
    ResourceDetailURL(resourceId, accountNumber)
  );
  return response.data;
};

export const useResourceDetail = (
  resourceId: string,
  accountNumber: string
) => {
  return useQuery<ResourceDetailsApiResponse, Error>({
    queryKey: ['resourceDetail', resourceId, accountNumber],
    queryFn: () => fetchResourceDetail(resourceId, accountNumber),
    retry: 0,
    gcTime: 0,
    enabled: !!resourceId && !!accountNumber,
  });
};

type ExportType = 'resource' | 'cost' | 'skill' | 'project' | 'attachments';
export const exportData = async (
  type: ExportType,
  params: ExportModule = {}
) => {
  let url = '';
  let filename = '';

  switch (type) {
    case 'resource':
      url = ExportResourcelUrl(params);
      filename = 'resource_records.xlsx';
      break;
    case 'cost':
      url = ExportResourceCostUrl(params);
      filename = 'resource_cost_records.xlsx';
      break;
    case 'skill':
      url = ExportResourceSkillUrl(params);
      filename = 'resource_skill_records.xlsx';
      break;
    default:
      console.error('Invalid export type');
      return;
  }

  try {
    const response = await api.get(url);
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
