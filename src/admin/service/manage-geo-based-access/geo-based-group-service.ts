import { useMutation, useQuery } from '@tanstack/react-query';
import { caseServiceApi } from '../../../api/api';
import { UserListParams } from '../../types/manage-user';
import { buildQueryString } from '../helpers';
import { GeoBasedApiResponse } from '../../types/geo-based-rule';

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

const getFormConfigListUrl = (countryId: string, isFederal: boolean) => {
    return `/api/jurisdictions/config/details/new?country_rid=${countryId}&is_federal=${isFederal}`;
};

export const fetchFormConfigList = async (
    countryId: string,
    isFederal: boolean | null | undefined
) => {
    const response = await caseServiceApi.get<GeoBasedApiResponse>(
        getFormConfigListUrl(countryId, isFederal as boolean)
    );
    return response.data
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
    isFederal: boolean | null | undefined
) => {
    return useQuery<GeoBasedApiResponse, Error>({
        queryKey: ['formConfigList', countryId, isFederal],
        queryFn: () => fetchFormConfigList(countryId, isFederal),
        staleTime: 0,
        gcTime: 0,
        retry: 0,
        enabled: !!(countryId && isFederal !== null && isFederal !== undefined),
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
const getJurisdictionsDetailsUrl = (configId: string, creditConfigGroupRid: string) => {
    return `/api/jurisdictions/config/details?config_rid=${configId}&credit_config_group_rid=${creditConfigGroupRid}`;
};
export const fetchJurisdictionsDetails = async (
    configId: string,
    creditConfigGroupRid: string
) => {
    const response = await caseServiceApi.get<GeoBasedApiResponse>(
        getJurisdictionsDetailsUrl(configId, creditConfigGroupRid)
    );
    return response.data
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
        enabled: !!(configId && creditConfigGroupRid !== null && creditConfigGroupRid !== undefined),
    });
};