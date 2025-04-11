// import { ResourceCostList } from '../../../types/resourceCost';

import { ResourceCostList } from "../../../../../types/resourceCost";

export interface RenderCostRowProps {
  resourceCost: ResourceCostType[];
}

export interface ResourceCostType {
  resourceCostNumber?: string;
  resourceRefId?: string;
  currency?: string;
  startDate?: string;
  endDate?: string;
  annualCompensation?: number | string;
  semiAnnualCompensation?: number | string;
  monthlyCompensation?: number | string;
  biWeeklyCompensation?: number | string;
  weeklyCompensation?: number | string;
  dailyCompensation?: number | string;
  hourlyCompensation?: number | string;
}

export function convertResourceCost(
  resourceCost: ResourceCostList[]
): ResourceCostType[] {
  const resourceCostList: ResourceCostType[] = [];

  function processResourceCost(cost: ResourceCostList): void {
    const convertedCost: ResourceCostType = {
      resourceCostNumber: cost.resource_cost_number,
      resourceRefId: cost.resource_ref_id,
      currency: cost.currency,
      startDate: cost.start_date,
      endDate: cost.end_date,
      annualCompensation: cost.annual_compensation?.toString() ?? '',
      semiAnnualCompensation: cost.semi_annual_compensation?.toString() ?? '',
      monthlyCompensation: cost.monthly_compensation?.toString() ?? '',
      weeklyCompensation: cost.weekly_compensation?.toString() ?? '',
      biWeeklyCompensation: cost.bi_weekly_compensation?.toString() ?? '',
      dailyCompensation: cost.daily_compensation?.toString() ?? '',
      hourlyCompensation: cost.hourly_compensation?.toString() ?? '',
    };
    resourceCostList.push(convertedCost);
  }

  resourceCost.forEach((cost) => {
    processResourceCost(cost);
  });

  return resourceCostList;
}
