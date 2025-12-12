import { useQuery } from "@tanstack/react-query";
import { caseServiceApi } from "../../../api/api";
import { UserGroupApiResponse } from "../../types";
import { UserListParams } from "../../types/manage-user";
import { buildQueryString } from "../helpers";


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
    const response = await caseServiceApi.get<UserGroupApiResponse>(url);
    return response.data;
};

export const useGeoBasedList = (
    params: UserListParams = {},
    refreshUserGroupTrigger?: number
) => {
    return useQuery<UserGroupApiResponse, Error>({
        queryKey: ['geoBasedList', params,],
        queryFn: () => fetchGeoBasedList(params),
        staleTime: 0, // No cache
        gcTime: 0, // Immediately remove from cache
        retry: 0,
        // enabled: !!refreshUserGroupTrigger,
    });
};