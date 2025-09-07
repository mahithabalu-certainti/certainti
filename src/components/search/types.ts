export interface SearchableColumn {
  id: string;
  label: string;
  searchKey: string;
}

export interface SearchSuggestion {
  column: string;
  value: string;
  displayText: string;
}

export interface ListSearchProps {
  searchableColumns: SearchableColumn[];
  onSearch: (searchParams: Record<string, string>) => void;
  placeholder?: string;
  disabled?: boolean;
  hidden?: boolean;
  suggestions?: boolean;
  suggestionData?: SearchSuggestion[];
  maxSuggestions?: number;
  className?: string;
  clearOnSearch?: boolean;
}

export interface SearchState {
  query: string;
  activeColumns: Set<string>;
  showSuggestions: boolean;
  selectedSuggestionIndex: number;
}
