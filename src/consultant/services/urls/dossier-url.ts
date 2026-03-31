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
  const resolvedStateRid = stateRid && stateRid.trim() ? stateRid : "''";

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

export const getSignOffFinancialHighlightsURL = (isRdform: boolean): string => {
  return `/api/${isRdform ? 'rdformMapper' : 'cases/financialWorking'}/signoff`;
};
export const getUserPreferenceURL = (): string => {
  return `/api/rd-credit/federal/userPreference`;
};

export const getClosingRemarksListURL = () // accountRid: string,
// caseRid: string
: string => {
  return `/api/cases/closureRemarks`;
};

export const getDossierVersionListURL = (): string => {
  return `api/cases/dossier/version`;
};

export const getRDFormMapperURL = (): string => {
  return `/api/rdFormMapper/process/initiate`;
};

export const getRDFormMapperGenerateURL = (
  accountRid: string,
  caseRid: string,
  fiscalYear: number
): string => {
  return `/api/rdFormMapper/rdForms/generate?account_rid=${accountRid}&case_rid=${caseRid}&fiscal_year=${fiscalYear}`;
};

export const getRDFormMapperPreviewURL = (
  accountRid: string,
  caseRid: string,
  countryRid: string,
  isFederal: boolean = true,
  stateRid?: string
): string => {
  let url = `/api/rdFormMapper/preview?account_rid=${accountRid}&case_rid=${caseRid}&is_federal=${isFederal}&country_rid=${countryRid}`;
  if (stateRid) {
    url += `&state_rid=${stateRid}`;
  }
  return url;
};

export const getDossierInitiateURL = (): string => {
  return `/api/cases/dossier/create`;
};
export const getDossierSheetStatusURL = (): string => {
  return `/api/cases/dossierPackage`;
};

export const getRdFormRevokeURL = () => {
  return `/api/cases/approvals/revoke`;
};
