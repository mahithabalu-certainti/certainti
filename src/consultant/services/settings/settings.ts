import { useApiMutationSericve } from '../../../api/mutation';
import {
  AccountSettingsUpdateURL,
  ProjectSettingsUpdateURL,
} from '../urls/settings-url';

interface SettingsPayload {
  account_rid: string;
  flag: string;
  fiscal_start_date?: string;
  fiscal_end_date?: string;
  max_ai_interactions: number | undefined;
  autosend_interaction: boolean;
  auto_access_rd: boolean;
  blended_rate_fte: string;
  blended_rate_subcon: string;
  update_all_projects?: string;
}

interface UpdateSettingsResponse {
  statusMessage: string;
}

export const useProjectUpdateSettings = () => {
  return useApiMutationSericve<UpdateSettingsResponse, SettingsPayload>(
    ProjectSettingsUpdateURL,
    'put'
  );
};

export const useAccountUpdateSettings = () => {
  return useApiMutationSericve<UpdateSettingsResponse, SettingsPayload>(
    AccountSettingsUpdateURL,
    'put'
  );
};
