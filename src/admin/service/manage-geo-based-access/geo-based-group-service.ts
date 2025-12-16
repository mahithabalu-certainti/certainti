import { useMutation, useQuery } from '@tanstack/react-query';
import { caseServiceApi } from '../../../api/api';
import { UserListParams } from '../../types/manage-user';
import { buildQueryString } from '../helpers';
import { GeoBasedApiResponse } from '../../types/geo-based-rule';
import {
    ExportTaskTemplateResponse,
    TaskTemplateListParams,
} from '../../types';

export const getGeoBasedListUrl = (params: UserListParams = {}): string => {
    const defaultParams: UserListParams = {
        page: 1,
        limit: 10,
        sortBy: 'createdAt',
        sortOrder: 'DESC',
        ...params,
    };

    const queryParams = {
        ...defaultParams,
    };
    return `/api/jurisdictions/config/list?${buildQueryString(queryParams)}`;
};

export const fetchGeoBasedList = async (params: UserListParams = {}) => {
    const queryParams = {
        page: params.page || 1,
        limit: params.limit || 10,
        // sortBy: params.sortBy || 'createdAt',
        // sortOrder: params.sortOrder || 'DESC',
        // filters: params.filters || {},
        // search: params.search || '',
        // ...(params.filters && { filters: params.filters }),
        // ...(params.searchTerm && { search: params.searchTerm }),
    };

    const url = getGeoBasedListUrl(queryParams);
    const response = await caseServiceApi.get<GeoBasedApiResponse>(url);
    return response.data;
};

export const useGeoBasedList = (
    params: UserListParams = {},
    refreshUserGroupTrigger?: number
) => {
    return useQuery<GeoBasedApiResponse, Error>({
        queryKey: ['geoBasedList', params, refreshUserGroupTrigger],
        queryFn: () => fetchGeoBasedList(params),
        staleTime: 0, // No cache
        gcTime: 0, // Immediately remove from cache
        retry: 0,
        // enabled: !!refreshUserGroupTrigger,
    });
};

const getFormConfigListUrl = (
    countryId: string,
    isFederal: boolean,
    regionId?: string
) => {
    // If federal, don't include region_rid in the URL
    if (isFederal) {
        return `/api/jurisdictions/config/details/new?country_rid=${countryId}&is_federal=${isFederal}`;
    }
    // If not federal, include region_rid
    return `/api/jurisdictions/config/details/new?country_rid=${countryId}&state_rid=${regionId}&is_federal=${isFederal}`;
};

export const fetchFormConfigList = async (
    countryId: string,
    isFederal: boolean | null | undefined,
    regionId?: string
) => {
    const response = await caseServiceApi.get<GeoBasedApiResponse>(
        getFormConfigListUrl(countryId, isFederal as boolean, regionId)
    );
    return response.data;
};

export const createGeoBasedRule = async (
    payload: any // Replace with specific payload type if available
) => {
    const response = await caseServiceApi.post(
        '/api/jurisdictions/config/create',
        payload
    );
    return response.data;
};

export const useFormConfigList = (
    countryId: string,
    isFederal: boolean | null | undefined,
    regionId?: string
) => {
    // Enable query based on conditions:
    // - If federal (true): only need country
    // - If not federal (false): need both country and region
    const shouldFetch =
        countryId &&
        isFederal !== null &&
        isFederal !== undefined &&
        (isFederal === true || (isFederal === false && regionId));

    return useQuery<GeoBasedApiResponse, Error>({
        queryKey: ['formConfigList', countryId, isFederal, regionId],
        queryFn: () => fetchFormConfigList(countryId, isFederal, regionId),
        staleTime: 0,
        gcTime: 0,
        retry: 0,
        enabled: !!shouldFetch,
    });
};

export const useCreateGeoBasedRule = () => {
    return useMutation({
        mutationFn: createGeoBasedRule,
    });
};

export const updateGeoBasedRule = async (
    payload: any // Replace with specific payload type if available
) => {
    const response = await caseServiceApi.post(
        '/api/jurisdictions/config/update',
        payload
    );
    return response.data;
};

export const useUpdateGeoBasedRule = () => {
    return useMutation({
        mutationFn: updateGeoBasedRule,
    });
};
const getJurisdictionsDetailsUrl = (
    configId: string,
    creditConfigGroupRid: string
) => {
    return `/api/jurisdictions/config/details?config_rid=${configId}&credit_config_group_rid=${creditConfigGroupRid}`;
};
export const fetchJurisdictionsDetails = async (
    configId: string,
    creditConfigGroupRid: string
) => {
    const response = await caseServiceApi.get<GeoBasedApiResponse>(
        getJurisdictionsDetailsUrl(configId, creditConfigGroupRid)
    );
    return response.data;
};
export const useJurisdictionsDetails = (
    configId: string,
    creditConfigGroupRid: string
) => {
    return useQuery<GeoBasedApiResponse, Error>({
        queryKey: ['jurisdictionsDetails', configId, creditConfigGroupRid],
        queryFn: () => fetchJurisdictionsDetails(configId, creditConfigGroupRid),
        staleTime: 0,
        gcTime: 0,
        retry: 0,
        enabled: !!(
            configId &&
            creditConfigGroupRid !== null &&
            creditConfigGroupRid !== undefined
        ),
    });
};

export const getConfigExportUrl = () => '/api/jurisdictions/config/export';

export const ExportConfigRuleList = async (
    params: TaskTemplateListParams
): Promise<void> => {
    try {
        const filename = `config_rule_list.xlsx`;
        const response = await caseServiceApi.post<ExportTaskTemplateResponse>(
            getConfigExportUrl(),
            params
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
