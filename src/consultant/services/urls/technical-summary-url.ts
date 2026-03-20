import {
  TechnicalSummaryExportListParams,
  TechnicalSummaryListURLParams,
} from '../../types';

export const getTechnicalSummaryListURL = ({
  page,
  limit,
  sortOrder,
  sortBy,
  account_rid,
  project_fiscal_rid,
  project_rid,
  filters,
}: TechnicalSummaryListURLParams): string => {
  const baseUrl = '/api/interactions/technicalSummary/list';
  const searchParams = new URLSearchParams();

  if (account_rid !== undefined) {
    searchParams.set('account_rid', account_rid.toString());
  }
  if (project_fiscal_rid !== undefined) {
    searchParams.set('project_fiscal_rid', project_fiscal_rid.toString());
  }
  if (project_rid !== undefined) {
    searchParams.set('project_rid', project_rid.toString());
  }

  if (page !== undefined) searchParams.set('page', page.toString());
  if (limit !== undefined) searchParams.set('limit', limit.toString());
  if (filters && Object.keys(filters).length > 0) {
    searchParams.set('filters', JSON.stringify(filters));
  }
  if (sortBy !== undefined) searchParams.set('sortBy', sortBy);
  if (sortOrder !== undefined) searchParams.set('sortOrder', sortOrder);
  const queryString = searchParams.toString();
  return queryString ? `${baseUrl}?${queryString}` : baseUrl;
};

export const getTechnicalSummaryDetailsURL = ({
  tech_summary_rid,
  account_rid,
  project_fiscal_rid,
  case_rid,
}: {
  tech_summary_rid: string;
  account_rid: string;
  project_fiscal_rid: string;
  case_rid?: string;
}): string => {
  const baseUrl = '/api/interactions/technicalSummary/details';
  const searchParams = new URLSearchParams();

  if (tech_summary_rid) {
    searchParams.set('tech_summary_rid', tech_summary_rid.toString());
  }
  if (account_rid) {
    searchParams.set('account_rid', account_rid.toString());
  }
  if (project_fiscal_rid) {
    searchParams.set('project_fiscal_rid', project_fiscal_rid.toString());
  }
  if (case_rid) {
    searchParams.set('case_rid', case_rid.toString());
  }
  const queryString = searchParams.toString();
  return queryString ? `${baseUrl}?${queryString}` : baseUrl;
};

export const getTechnicalSummaryExportListURL = ({
  sortBy,
  sortOrder,
  filters,
  account_rid,
  project_fiscal_rid,
  timezone,
  case_rid,
}: TechnicalSummaryExportListParams): string => {
  const baseUrl = '/api/interactions/technicalSummary/export';
  const searchParams = new URLSearchParams();

  if (account_rid !== undefined) {
    searchParams.set('account_rid', account_rid.toString());
  }
  if (project_fiscal_rid !== undefined) {
    searchParams.set('project_fiscal_rid', project_fiscal_rid.toString());
  }
  if (case_rid !== undefined) {
    searchParams.set('case_rid', case_rid.toString());
  }
  if (filters && Object.keys(filters).length > 0) {
    searchParams.set('filters', JSON.stringify(filters));
  }
  if (sortBy !== undefined) searchParams.set('sortBy', sortBy);
  if (sortOrder !== undefined) searchParams.set('sortOrder', sortOrder);
  if (timezone !== undefined) searchParams.set('timezone', timezone);
  const queryString = searchParams.toString();
  return queryString ? `${baseUrl}?${queryString}` : baseUrl;
};
