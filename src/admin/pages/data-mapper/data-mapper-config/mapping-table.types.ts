export interface ObjectItem {
  rid: string;
  parent_object: string;
  object_name: string;
  ref_table: string;
  field_name: string | null;
  field_type: 'line-item' | 'table-item' | string;
}

export interface BracketItem {
  type: 'chip' | 'operator' | 'manual' | 'number' | 'bracket';
  value: string;
  nestedItems?: BracketItem[];
}

export interface ConditionalClause {
  type: 'IF' | 'ELSE_IF' | 'ELSE';
  condition?: string;
  expressions?: FieldExpression[];
  inputValue?: string;
  showAutocomplete?: boolean;
  autocompleteIndex?: number;
  result: string;
  error?: string;
  returnExpressions?: FieldExpression[];
  returnInputValue?: string;
  returnShowAutocomplete?: boolean;
  returnAutocompleteIndex?: number;
  returnError?: string;
}

export interface ConditionalExpression {
  clauses: ConditionalClause[];
}

export interface FieldExpression {
  type:
    | 'chip'
    | 'operator'
    | 'manual'
    | 'function'
    | 'number'
    | 'conditional'
    | 'bracket'
    | 'sumOf';
  value: string;
  functionType?: 'MIN' | 'MAX';
  functionArgs?: string[];
  conditionalData?: ConditionalExpression;
  bracketItems?: BracketItem[];
  sumOfArg?: { type: 'chip' | 'manual'; value: string };
}

export interface ObjectRidMap {
  [key: number]: string | number;
}

export interface MappingItem {
  rid: string;
  field_label: string;
  field_id: string | null;
  calculation_config: ObjectRidMap | null;
  field_type: 'line-item' | 'table-item' | string;
  fieldExpressions?: FieldExpression[];
  inputValue?: string;
  fieldIdError?: string;
  targetError?: string;
  status?: string;
}

// ─── Popover state shapes ─────────────────────────────────────────────────────

export interface FunctionPopoverState {
  rid: string;
  type: 'MIN' | 'MAX';
  args: FieldExpression[];
  inputValue: string;
  anchorEl: HTMLElement | null;
  editingIndex?: number;
  error?: string;
}

export interface ConditionalPopoverState {
  rid: string;
  clauses: ConditionalClause[];
  anchorEl: HTMLElement | null;
  editingIndex?: number;
  error?: string;
}

export interface BracketPopoverState {
  rid: string;
  items: BracketItem[];
  inputValue: string;
  anchorEl: HTMLElement | null;
  editingIndex?: number;
  error?: string;
  showAutocomplete?: boolean;
  autocompleteIndex?: number;
  nestedMode?: boolean;
  nestedItems?: BracketItem[];
  source?: 'main' | 'clause-condition' | 'clause-return';
  clauseIndex?: number;
  clauseChipEditIndex?: number;
}

export interface SumOfPopoverState {
  rid: string;
  inputValue: string;
  anchorEl: HTMLElement | null;
  editingIndex?: number;
  error?: string;
  showAutocomplete?: boolean;
  autocompleteIndex?: number;
  selectedArg?: { type: 'chip' | 'manual'; value: string };
}
