// types.ts
export type ResourceMetrics = {
  noOfResources: number;
  fte: number;
  subCon: number;
  nonLabor: number;
};

export type ProjectMetrics = {
  projectLevel: number | string;
  projectResourceLevel: number | string;
  projectTaskLevel: number | string;
  approved: number | string;
};

export type JurisdictionCredits = {
  jurisdictionName: string;
  fteCreditAmount: number;
  subConCreditAmount: number;
  nonLaborCreditAmount: number;
  totalCreditAmount: number;
};

export interface RDDashboardProps {
  fiscalYear: string;
  eligibleProjects: number;
  resourceMetrics: ResourceMetrics;
  fteHours: ProjectMetrics;
  fteCost: ProjectMetrics;
  subConHours: ProjectMetrics;
  subConCost: ProjectMetrics;
  nonLaborCost: ProjectMetrics;
  jurisdictionCredits: JurisdictionCredits[];
}

// utils.ts
export const formatNumber = (num: number | string): string => {
  if (typeof num === 'string') {
    return num;
  }
  return num.toLocaleString();
};

export const formatCurrency = (amount: number | string): string => {
  if (typeof amount === 'string') {
    return amount;
  }
  return `$${amount.toLocaleString()}`;
};

export const a11yProps = (index: number) => {
  return {
    id: `rd-tab-${index}`,
    'aria-controls': `rd-tabpanel-${index}`,
  };
};
