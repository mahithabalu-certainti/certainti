import { ProjectDocumentsListURLParams } from '../../types';

export const ProjectDocumentListURL = ({
  page,
  sortBy,
  sortOrder,
  filters,
  limit,
  fiscalYear,
  accountRid,
  caseRid,
  search,
}: ProjectDocumentsListURLParams) => {
  const baseUrl = `/api/project-documents/list`;
  const searchParams = new URLSearchParams();

  searchParams.set('page', page.toString());
  searchParams.set('limit', limit.toString());
  searchParams.set('sortBy', sortBy as string);
  searchParams.set('sortOrder', sortOrder as string);
  if (fiscalYear) searchParams.set('fiscalYear', fiscalYear.toString());
  if (caseRid !== undefined) {
    searchParams.set('caseRid', caseRid);
  }
  if (accountRid !== undefined) {
    searchParams.set('accountRid', accountRid);
  }

  // Only add filters if the object has properties
  if (filters && Object.keys(filters).length > 0) {
    searchParams.set('filters', JSON.stringify(filters));
  }
  if (search) {
    searchParams.set('search', search);
  }

  return `${baseUrl}?${searchParams.toString()}`;
};

export const getRDCreditPreviewURL = (
  accountRid: string,
  caseRid: string,
  stateRid: string | null | undefined,
  type: string
): string => {
  const resolvedStateRid =
    stateRid && stateRid.trim() ? stateRid : "''";

  const baseUrl = `/api/rd-credit/preview/${accountRid}/${caseRid}/${resolvedStateRid}`;

  return `${baseUrl}?type=${encodeURIComponent(type)}`;
};


export const getRDCreditStatusURL = (
  accountRid: string,
  caseRid: string
): string => {
  return `/api/rd-credit/status/${accountRid}/${caseRid}`;
};

export const getRDCreditInitiateURL = (): string => {
  return `/api/rd-credit/process/initiate`;
};

export const getFinancialHighlightsURL = (): string => {
  return `/api/rd-credit/federal/calculate`;
};

export const getSignOffFinancialHighlightsURL = (): string => {
  return `/api/cases/financialWorking/signoff`;
};
export const getUserPreferenceURL = (): string => {
  return `/api/rd-credit/federal/userPreference`;
};

export const getClosingRemarksListURL = (
  accountRid: string,
  caseRid: string
): string => {
  return `/api/cases/closureRemarks/${accountRid}/${caseRid}`;
};

export const getRDFormMapperURL = (): string => {
  return `/api/rdFormMapper/process/initiate`;
};

export const getRDFormMapperPreviewURL = (
  accountRid: string,
  caseRid: string,
  countryRid: string,
  isFederal: boolean = true
): string => {
  return `/api/rdFormMapper/preview?account_rid=${accountRid}&case_rid=${caseRid}&is_federal=${isFederal}&country_rid=${countryRid}`;
};
