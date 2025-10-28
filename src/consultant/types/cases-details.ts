export interface CasesDetails {
  rid: string;
  case_name: string;
  case_description: string;
  case_type: string;
}

export interface caseformPayload {
  case_name: string;
  description: string;
  case_type: string;
  rid: string;
  owner: string;
  fiscal_year: string;
  country: string;
  state: string;
}

export interface createCasesApiResponse {
  statusCode: number;
  statusCodeValue: string;
  statusMessage: string;
  data: {
    cases: casesResponseDetails[];
  };
}

export type casesResponseDetails = {
  rid: string;
  case_name: string;
  case_description: string;
  case_type: string;
  owner: string;
  fiscal_year: string;
  country: string;
};
