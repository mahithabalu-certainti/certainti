import { RowData } from './table';

export interface QrePercentHistoryItem extends RowData {
  rid: string;
  version: number;
  type: string;
  contents: string;
  qre_percent: number;
  created_datetime: string;
  [key: string]: unknown;
}

export interface QrePercentHistoryResponse {
  data: {
    qre_history: QrePercentHistoryItem[];
    total_result: number;
  };
  statusCode: number;
  statusMessage: string;
}

export interface QrePercentHistoryParams {
  account_rid: string;
  page?: number;
  limit?: number;
  sort?: string;
  sort_by?: 'ASC' | 'DESC';
  filter: Record<string, unknown>;
}
