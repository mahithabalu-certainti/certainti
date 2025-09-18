export interface InteractionHistoryRequest {
  page: number;
  limit: number;
  sort: string;
  sort_by: 'asc' | 'desc';
  filters: Record<string, unknown>;
  account_rid: string;
  interaction_rid: string;
}

export interface InteractionHistoryItem {
  rid: string;
  action: string;
  date: string;
  [key: string]: unknown; // Add index signature
}

export interface InteractionHistoryResponse {
  statusCode: number;
  statusCodeValue: string;
  statusMessage: string;
  data: {
    page: number;
    limit: number;
    total_records: number;
    data: {
      interaction_rnumber: string;
      project_code: string;
      project_name: string;
      response_source: string | null;
      interaction_history: InteractionHistoryItem[];
    };
  };
}
