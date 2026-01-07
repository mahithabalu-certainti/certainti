export const getRDCreditPreviewURL = (
  accountRid: string,
  caseRid: string,
  stateRid: string
): string => {
  return `/api/rd-credit/${accountRid}/case/${caseRid}${stateRid ? `/state/${stateRid}` : ''}/preview`;
};

export const getRDCreditStatusURL = (
  accountRid: string,
  caseRid: string
): string => {
  return `/api/rd-credit/${accountRid}/case/${caseRid}/status`;
};

export const getRDCreditInitiateURL = (): string => {
  return `/api/rd-credit/process/initiate`;
};

export const getFinancialHighlightsURL = (): string => {
  return `/api/rd-credit/federal/calculate`;
};