// import { ResourceCostList } from '../../../types/resourceCost';

import { ResourceCostList } from '../../../../../types/resource-cost';

export interface RenderCostRowProps {
  resourceCost: ResourceCostType[];
}

export interface ResourceCostType {
  accountRid?: string;
  costRid?: string;
  resourceRID?: string;
  resourceType?: string;
  resourceFullName?: string;
  resourceCostNumber?: string;
  resourceRefId?: string;
  currency?: string;
  startDate?: string;
  endDate?: string;
  annualCost?: number | string;
  semiAnnualCost?: number | string;
  monthlyCost?: number | string;
  biWeeklyCost?: number | string;
  weeklyCost?: number | string;
  dailyCost?: number | string;
  hourlyCost?: number | string;
  fiscal_year?: string;
}

export function convertResourceCost(
  resourceCost: ResourceCostList[]
): ResourceCostType[] {
  const resourceCostList: ResourceCostType[] = [];

  function processResourceCost(cost: ResourceCostList): void {
    const convertedCost: ResourceCostType = {
      accountRid: cost.account_rid,
      resourceType: cost.resource_type,
      resourceFullName: cost.resource_name,
      resourceCostNumber: cost.r_number,
      resourceRID: cost.resource_rid,
      resourceRefId: cost.resource_ref_id,
      currency: cost.currency_code,
      startDate: cost.effective_date,
      endDate: cost.end_date,
      annualCost: cost.annual_cost?.toString() ?? '',
      semiAnnualCost: cost.semi_annual_cost?.toString() ?? '',
      monthlyCost: cost.monthly_cost?.toString() ?? '',
      weeklyCost: cost.weekly_cost?.toString() ?? '',
      biWeeklyCost: cost.bi_weekly_cost?.toString() ?? '',
      dailyCost: cost.daily_cost?.toString() ?? '',
      hourlyCost: cost.hourly_cost?.toString() ?? '',
      costRid: cost.rid,
      fiscal_year: cost.fiscal_year,
    };
    resourceCostList.push(convertedCost);
  }

  resourceCost.forEach((cost) => {
    processResourceCost(cost);
  });

  return resourceCostList;
}
