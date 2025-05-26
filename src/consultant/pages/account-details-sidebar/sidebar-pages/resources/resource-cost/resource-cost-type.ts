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
  resourceCost: ResourceCostList
): ResourceCostType {
  const convertedCost: ResourceCostType = {
    accountRid: resourceCost.account_rid,
    resourceType: resourceCost.resource_type,
    resourceFullName: resourceCost.resource_name,
    resourceCostNumber: resourceCost.r_number,
    resourceRID: resourceCost.resource_rid,
    resourceRefId: resourceCost.resource_ref_id,
    currency: resourceCost.currency_code,
    startDate: resourceCost.effective_date,
    endDate: resourceCost.end_date,
    annualCost: resourceCost.annual_cost?.toString() ?? '',
    semiAnnualCost: resourceCost.semi_annual_cost?.toString() ?? '',
    monthlyCost: resourceCost.monthly_cost?.toString() ?? '',
    weeklyCost: resourceCost.weekly_cost?.toString() ?? '',
    biWeeklyCost: resourceCost.bi_weekly_cost?.toString() ?? '',
    dailyCost: resourceCost.daily_cost?.toString() ?? '',
    hourlyCost: resourceCost.hourly_cost?.toString() ?? '',
    costRid: resourceCost.rid,
    fiscal_year: resourceCost.fiscal_year,
  };

  return convertedCost;
}
