export interface InteractionTableColumn {
  name: string;
  label: string;
  width?: string;
  align?: 'left' | 'right' | 'center';
  required?: boolean;
  disabled?: boolean;
  hide?: boolean;
}

export interface ProjectDetails {
  project_code: string;
  project_name: string;
  fiscal_year: number;
  account_name: string;
}

export interface InteractionQuestion {
  questionNo: string;
  question: string;
  mandatory: boolean;
  notes: string;
  errors?: {
    question?: string;
    mandatory?: string;
    notes?: string;
  };
}

export interface InteractionData {
  id?: string;
  accountName: string;
  projectCode: string;
  projectName: string;
  fiscalYear: number;
  questions: InteractionQuestion[];
  status?: string;
  rid?: string;
  interaction_id?: string;
  created_on?: string;
  created_by?: string;
  errors?: {
    projectCode?: string;
    projectName?: string;
    fiscalYear?: string;
  };
}
