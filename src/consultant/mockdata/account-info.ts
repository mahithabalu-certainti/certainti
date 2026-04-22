export const accountData = [
  { label: 'Account ID', value: '1001002' },
  { label: 'Parent Name', value: 'True Tech AI Solutions Inc - Global' },
  { label: 'Account Number', value: 'ACC002' },
  { label: 'Account Name', value: 'True Tech AI Solutions Inc - US' },
  { label: 'Industry', value: 'Information Technology' },
  { label: 'Country', value: 'USA' },
  { label: 'Currency', value: 'USD' },
  { label: 'Is Parent Account', value: 'NO' },
  { label: 'Primary Contact', value: 'Benjamin Samuel' },
  { label: 'Status', value: 'Active' },
];

export const mockFinanceData = {
  fiscalYear: 'FY-2024',
  eligibleProjects: 91,
  resourceMetrics: {
    noOfResources: 0, // Not used in this example as we're displaying in a different way
    fte: 460,
    subCon: 280,
    nonLabor: 37,
  },
  fteHours: {
    projectLevel: 822667,
    projectResourceLevel: 'Not Available',
    projectTaskLevel: 745333,
    approved: 822667,
  },
  fteCost: {
    projectLevel: 30966000,
    projectResourceLevel: 30516333,
    projectTaskLevel: 30516333,
    approved: 30966000,
  },
  subConHours: {
    projectLevel: 542960,
    projectResourceLevel: 537477,
    projectTaskLevel: 537477,
    approved: 537477,
  },
  subConCost: {
    projectLevel: 22804320,
    projectResourceLevel: 22681873,
    projectTaskLevel: 22681873,
    approved: 22681873,
  },
  nonLaborCost: {
    projectLevel: 12843000,
    projectResourceLevel: 9765000,
    projectTaskLevel: 'Not Applicable',
    approved: 9765000,
  },
  jurisdictionCredits: [
    {
      jurisdictionName: 'Federal',
      fteCreditAmount: 22887250,
      subConCreditAmount: 13609124,
      nonLaborCreditAmount: 3906000,
      totalCreditAmount: 40402374,
    },
    {
      jurisdictionName: 'Statewise',
      fteCreditAmount: 20598525,
      subConCreditAmount: 12248212,
      nonLaborCreditAmount: 390600,
      totalCreditAmount: 33237337,
    },
    {
      jurisdictionName: 'Grand Total',
      fteCreditAmount: 43485775,
      subConCreditAmount: 25857336,
      nonLaborCreditAmount: 4296600,
      totalCreditAmount: 75639711,
    },
  ],
};
