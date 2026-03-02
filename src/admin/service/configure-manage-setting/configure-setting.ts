import { useMutation, useQuery } from '@tanstack/react-query';
import { userServiceApi } from '../../../api/api';
import { getConfigureSettingUrl, updateCOnfigureSettingUrl } from '../urls';
import { ConfigureManageSettingApiResponse } from '../../types';
import { UpdateUserResponse, UserDetail } from '../../types/manage-user';

export const fetchManageSettingDetail =
  async (): Promise<ConfigureManageSettingApiResponse> => {
    try {
      const { data } =
        await userServiceApi.get<ConfigureManageSettingApiResponse>(
          getConfigureSettingUrl()
        );
      return data;
    } catch (error) {
      console.error('Error fetching setting details:', error);
      throw error;
    }
  };
export const useManageSettingDetails = () => {
  return useQuery<ConfigureManageSettingApiResponse, Error>({
    queryKey: ['admin-manage-settings'],
    queryFn: () => fetchManageSettingDetail(),
    retry: 0,
    refetchOnWindowFocus: false,
    gcTime: 0,
    staleTime: 0,
  });
};

export const updateManageSettings = async (
  body: Partial<UserDetail>
): Promise<UpdateUserResponse> => {
  try {
    const { data } = await userServiceApi.post<UpdateUserResponse>(
      updateCOnfigureSettingUrl(),
      body
    );
    return data;
  } catch (error) {
    console.error('Error fetching user details:', error);
    throw error;
  }
};

export const useUpdateManageSettings = () => {
  return useMutation<UpdateUserResponse, Error, Partial<UserDetail>>({
    mutationFn: (body) => updateManageSettings(body),
  });
};
