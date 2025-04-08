import { IResourceCost, IUpdateResourceCost } from "../../utils/types";

export interface IResourceCostService {
  resourceCostList(
    page: number,
    limit: number,
    search: string,
    filters: Record<string, string>,
    sortBy: string,
    sortOrder: string
  ): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { resourceCost: any; count: number };
  }>;

  createResourceCost(resourceCostData: IResourceCost): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { resourceCost: any };
  }>;

  updateResourceCost(resourceCostData: IUpdateResourceCost): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { affectedCounts: number };
  }>;

  resourceCostById(id: string): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { resourceCostById: any };
  }>;
}
