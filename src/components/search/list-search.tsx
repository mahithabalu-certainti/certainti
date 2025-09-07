import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ListSearchProps, SearchState, SearchSuggestion } from './types';
import { SearchBlackIcon } from '../../assets';

export const ListSearch: React.FC<ListSearchProps> = ({
  searchableColumns,
  onSearch,
  placeholder = 'Search...',
  disabled = false,
  hidden = false,
  suggestions = true,
  suggestionData = [],
  maxSuggestions = 5,
  className = '',
  clearOnSearch = false,
}) => {
  const [searchState, setSearchState] = useState<SearchState>({
    query: '',
    activeColumns: new Set(searchableColumns.map((col) => col.id)),
    showSuggestions: false,
    selectedSuggestionIndex: -1,
  });

  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionRef = useRef<HTMLDivElement>(null);

  // Filter suggestions
  const filteredSuggestions = React.useMemo(() => {
    return suggestions
      ? suggestionData
          .filter(
            (suggestion) =>
              searchState.activeColumns.has(suggestion.column) &&
              suggestion.value
                .toLowerCase()
                .includes(searchState.query.toLowerCase())
          )
          .slice(0, maxSuggestions)
      : [];
  }, [
    suggestions,
    suggestionData,
    searchState.activeColumns,
    searchState.query,
    maxSuggestions,
  ]);

  // Handle input change
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setSearchState((prev) => ({
        ...prev,
        query: value,
        showSuggestions: suggestions && value.length > 0,
        selectedSuggestionIndex: -1,
      }));
    },
    [suggestions]
  );

  // Execute search
  const executeSearch = useCallback(() => {
    if (searchState.query.trim()) {
      const searchParams: Record<string, string> = {};

      searchableColumns.forEach((column) => {
        if (searchState.activeColumns.has(column.id)) {
          searchParams[column.searchKey] = searchState.query.trim();
        }
      });

      onSearch(searchParams);

      if (clearOnSearch) {
        setSearchState((prev) => ({
          ...prev,
          query: '',
          showSuggestions: false,
        }));
      } else {
        setSearchState((prev) => ({
          ...prev,
          showSuggestions: false,
        }));
      }
    }
  }, [
    searchState.query,
    searchState.activeColumns,
    searchableColumns,
    onSearch,
    clearOnSearch,
  ]);

  // Handle key events
  const handleKeyPress = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        if (
          searchState.selectedSuggestionIndex >= 0 &&
          filteredSuggestions.length > 0
        ) {
          const selectedSuggestion =
            filteredSuggestions[searchState.selectedSuggestionIndex];
          setSearchState((prev) => ({
            ...prev,
            query: selectedSuggestion.value,
            showSuggestions: false,
          }));
          setTimeout(executeSearch, 0);
        } else {
          executeSearch();
        }
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSearchState((prev) => ({
          ...prev,
          selectedSuggestionIndex: Math.min(
            prev.selectedSuggestionIndex + 1,
            filteredSuggestions.length - 1
          ),
        }));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSearchState((prev) => ({
          ...prev,
          selectedSuggestionIndex: Math.max(
            prev.selectedSuggestionIndex - 1,
            -1
          ),
        }));
      } else if (e.key === 'Escape') {
        setSearchState((prev) => ({
          ...prev,
          showSuggestions: false,
          selectedSuggestionIndex: -1,
        }));
      }
    },
    [searchState.selectedSuggestionIndex, filteredSuggestions, executeSearch]
  );

  // Handle suggestion click
  const handleSuggestionClick = useCallback(
    (suggestion: SearchSuggestion) => {
      setSearchState((prev) => ({
        ...prev,
        query: suggestion.value,
        showSuggestions: false,
      }));
      setTimeout(executeSearch, 0);
    },
    [executeSearch]
  );

  // Click outside closes suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionRef.current &&
        !suggestionRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setSearchState((prev) => ({
          ...prev,
          showSuggestions: false,
        }));
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus shows suggestions
  const handleFocus = useCallback(() => {
    if (suggestions && searchState.query.length > 0) {
      setSearchState((prev) => ({
        ...prev,
        showSuggestions: true,
      }));
    }
  }, [suggestions, searchState.query]);

  if (hidden) {
    return null;
  }

  return (
    <div className={`relative ${className}`}>
      <div
        className={`
            flex items-center border border-[#CBD6E2] rounded-xs w-[200px] h-[24px] box-border
            focus-within:border-2 focus-within:border-blue-400
            ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}
          `}
      >
        {/* Input */}
        <input
          ref={inputRef}
          type='text'
          value={searchState.query}
          onChange={handleInputChange}
          onKeyDown={handleKeyPress}
          onFocus={handleFocus}
          placeholder={placeholder}
          disabled={disabled}
          className={`
            flex-1 sm:text-sm pl-1 pr-2 h-full outline-none 
            ${disabled ? 'bg-gray-100 text-gray-400' : 'bg-white'}
          `}
        />

        {/* Search button */}
        <button
          onClick={executeSearch}
          disabled={disabled}
          className='flex items-center justify-center w-[30px] h-full border-l border-[#CBD6E2] rounded-r-xs transition-all duration-200'
          style={{
            background: 'linear-gradient(180deg, #FFFFFF 0%, #E4E6E7 100%)',
          }}
        >
          <SearchBlackIcon alt='search' className='w-4 h-4' />
        </button>
      </div>

      {/* Suggestions dropdown */}
      {suggestions &&
        searchState.showSuggestions &&
        filteredSuggestions.length > 0 && (
          <div
            ref={suggestionRef}
            className='
              absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg 
              max-h-60 overflow-auto
            '
          >
            {filteredSuggestions.map((suggestion, index) => {
              const columnLabel =
                searchableColumns.find((col) => col.id === suggestion.column)
                  ?.label || suggestion.column;

              return (
                <div
                  key={`${suggestion.column}-${suggestion.value}-${index}`}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className={`
                    px-4 py-2 cursor-pointer flex items-center justify-between text-sm
                    ${
                      index === searchState.selectedSuggestionIndex
                        ? 'bg-blue-50 text-blue-700 font-medium'
                        : 'hover:bg-gray-50'
                    }
                    ${
                      index === filteredSuggestions.length - 1
                        ? ''
                        : 'border-b border-gray-100'
                    }
                  `}
                >
                  <span className='flex-1'>
                    {suggestion.displayText || suggestion.value}
                  </span>
                  <span className='text-xs text-gray-500 ml-2'>
                    in {columnLabel}
                  </span>
                </div>
              );
            })}
          </div>
        )}
    </div>
  );
};
