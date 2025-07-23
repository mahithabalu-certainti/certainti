import { useApiMutationSericve } from '../../../api/mutation';
import { SettingsUpdateURL } from '../urls/settings-url';

interface SettingsPayload {
  account_rid: string;
  flag: string;
  fiscal_start_date?: string;
  fiscal_end_date?: string;
  max_ai_interactions: number;
  autosend_interaction: boolean;
  auto_access_rd: boolean;
  blended_rate_fte: string;
  blended_rate_subcon: string;
}

interface UpdateSettingsResponse {
  statusMessage: string;
}
export const useUpdateSettings = () => {
  return useApiMutationSericve<UpdateSettingsResponse, SettingsPayload>(
    SettingsUpdateURL,
    'put'
  );
};
