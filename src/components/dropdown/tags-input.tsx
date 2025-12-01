import React, { useState, useCallback, useRef } from 'react';
import {
  Chip,
  ClickAwayListener,
  List,
  ListItemButton,
  ListItemText,
  Paper,
  Popper,
} from '@mui/material';

// Types
interface TagOption {
  id: string;
  name: string;
  color: string;
  is_new_tag?: boolean;
}

interface TagsInputProps {
  label: string;
  values: string[];
  availableTags: TagOption[];
  onTagsChange: (tags: string[]) => void;
  onAddCustomTag: (newTags: TagOption[]) => void;
  errors?: string;
  disabled?: boolean;
}

const TagsInput: React.FC<TagsInputProps> = ({
  label,
  values,
  availableTags,
  onTagsChange,
  onAddCustomTag,
  errors,
  disabled = false,
}) => {
  const [inputValue, setInputValue] = useState('');
  const [tagError, setTagError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<{
    suggestions: TagOption[];
    highlightedIndex: number;
    anchorEl: HTMLElement | null;
  }>({
    suggestions: [],
    highlightedIndex: 0,
    anchorEl: null,
  });

  const inputRef = useRef<HTMLInputElement>(null);

  const handleSuggestionClick = useCallback(
    (tagName: string) => {
      // Ensure we don't add the '#' if it's a new tag suggestion
      const cleanTagName =
        tagName.startsWith('#') && tagName.length > 1
          ? tagName.substring(1)
          : tagName;

      // Validation: Check if tag length exceeds 50 characters
      if (cleanTagName.length > 50) {
        setTagError('Tags too long (max 50 characters)');
        return;
      }

      if (!values.includes(cleanTagName)) {
        onTagsChange([...values, cleanTagName]);
      }
      setInputValue('');
      setTagError(null); // Clear any previous errors
      setSuggestions({
        suggestions: [],
        highlightedIndex: 0,
        anchorEl: null,
      });
    },
    [values, onTagsChange]
  );

  const removeTag = useCallback(
    (index: number) => {
      const newTags = values.filter((_, i) => i !== index);
      onTagsChange(newTags);
    },
    [values, onTagsChange]
  );

  const filterSuggestions = useCallback(
    (searchText: string): TagOption[] => {
      if (!searchText.trim()) return [];

      const lowerSearch = searchText.toLowerCase();
      const currentTags = values;

      // If user types '#', show all available tags
      if (searchText === '#') {
        return availableTags.filter((tag) => !currentTags.includes(tag.name));
      }

      // If user types '#something', filter tags starting with the text after #
      if (searchText.startsWith('#') && searchText.length > 1) {
        const query = searchText.substring(1).toLowerCase();
        const filtered = availableTags.filter((tag) => {
          const nameMatch = tag.name.toLowerCase().includes(query);
          return nameMatch && !currentTags.includes(tag.name);
        });

        // Also allow adding the typed tag as a new tag (without the #)
        const typedTag = query.trim();
        if (
          !filtered.some((t) => t.name.toLowerCase() === typedTag) &&
          !currentTags.includes(typedTag)
        ) {
          filtered.push({
            id: '',
            name: typedTag, // This will be without the #
            color: '#3B82F6',
            is_new_tag: true,
          });
        }

        return filtered;
      }

      // Normal behavior - filter by name match
      const filtered = availableTags.filter((tag) => {
        const nameMatch = tag.name.toLowerCase().includes(lowerSearch);
        return nameMatch && !currentTags.includes(tag.name);
      });

      // If user typed a new tag, allow adding it as suggestion
      const typedTag = searchText.trim();
      if (
        !filtered.some((t) => t.name === typedTag) &&
        !currentTags.includes(typedTag)
      ) {
        filtered.push({
          id: '',
          name: typedTag,
          color: '#3B82F6',
          is_new_tag: true,
        });
      }

      return filtered;
    },
    [availableTags, values]
  );

  const handleInputChange = useCallback(
    (value: string) => {
      setInputValue(value);

      // Clear error when user starts typing again
      if (tagError) {
        setTagError(null);
      }

      // If only '#' → show all tags
      if (value === '#') {
        setSuggestions({
          suggestions: availableTags.filter(
            (tag) => !values.includes(tag.name)
          ),
          highlightedIndex: 0,
          anchorEl: inputRef.current,
        });
        return;
      }

      // If value starts with '#' but has more characters
      if (value.startsWith('#') && value.length > 1) {
        const query = value.substring(1);
        const filteredSuggestions = filterSuggestions(`#${query}`);
        setSuggestions({
          suggestions: filteredSuggestions,
          highlightedIndex: 0,
          anchorEl: filteredSuggestions.length > 0 ? inputRef.current : null,
        });
        return;
      }

      // Normal behavior
      if (value.trim()) {
        const filteredSuggestions = filterSuggestions(value);
        setSuggestions({
          suggestions: filteredSuggestions,
          highlightedIndex: 0,
          anchorEl: filteredSuggestions.length > 0 ? inputRef.current : null,
        });
      } else {
        setSuggestions({
          suggestions: [],
          highlightedIndex: 0,
          anchorEl: null,
        });
      }
    },
    [availableTags, values, filterSuggestions, tagError]
  );

  const handleInputKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      // Handle Enter key when there are suggestions and one is selected
      if (
        e.key === 'Enter' &&
        suggestions.anchorEl &&
        suggestions.suggestions.length > 0
      ) {
        e.preventDefault();
        if (suggestions.suggestions[suggestions.highlightedIndex]) {
          const selectedSuggestion =
            suggestions.suggestions[suggestions.highlightedIndex];
          handleSuggestionClick(selectedSuggestion.name);
        }
        return;
      }

      // Handle Enter key for direct input (no suggestions or no selection)
      if (e.key === 'Enter' && inputValue.trim()) {
        e.preventDefault();

        // Validation: Check if tag length exceeds 50 characters
        if (inputValue.trim().length > 50) {
          setTagError('Tags too long (max 50 characters)');
          return;
        }

        let tagName = inputValue.trim();

        // Remove '#' from the beginning if present for new tags
        if (tagName.startsWith('#') && tagName.length > 1) {
          tagName = tagName.substring(1);
        }

        if (!values.includes(tagName)) {
          // Check if it's a new tag
          if (!availableTags.find((t) => t.name === tagName)) {
            onAddCustomTag([
              ...availableTags,
              {
                id: '',
                name: tagName,
                color: '#3B82F6',
                is_new_tag: true,
              },
            ]);
          }
          onTagsChange([...values, tagName]);
          setInputValue('');
          setTagError(null); // Clear any previous errors
          setSuggestions({
            suggestions: [],
            highlightedIndex: 0,
            anchorEl: null,
          });
        }
        return;
      }

      // Clear error when user starts typing again
      if (tagError && e.key !== 'Enter') {
        setTagError(null);
      }

      if (e.key === 'Backspace' && inputValue === '' && values.length > 0) {
        e.preventDefault();
        removeTag(values.length - 1);
        return;
      }

      if (!suggestions.anchorEl) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSuggestions((prev) => ({
            ...prev,
            highlightedIndex: Math.min(
              prev.highlightedIndex + 1,
              prev.suggestions.length - 1
            ),
          }));
          break;

        case 'ArrowUp':
          e.preventDefault();
          setSuggestions((prev) => ({
            ...prev,
            highlightedIndex: Math.max(prev.highlightedIndex - 1, 0),
          }));
          break;

        case 'Tab':
          e.preventDefault();
          if (suggestions.suggestions[suggestions.highlightedIndex]) {
            const selectedSuggestion =
              suggestions.suggestions[suggestions.highlightedIndex];
            handleSuggestionClick(selectedSuggestion.name);
          }
          break;

        case 'Escape':
          e.preventDefault();
          setSuggestions({
            suggestions: [],
            highlightedIndex: 0,
            anchorEl: null,
          });
          break;
      }
    },
    [
      inputValue,
      values,
      availableTags,
      onAddCustomTag,
      onTagsChange,
      removeTag,
      suggestions,
      handleSuggestionClick,
      tagError,
    ]
  );

  const getPlaceholderText = () => {
    if (values.length === 0) return 'Type # to see all tags...';
    return '';
  };

  // Combine external errors with internal validation errors
  const displayError = errors || tagError;

  return (
    <div className='grid grid-cols-1'>
      <label className='text-[13px] text-[#2D3E4F] font-semibold leading-[21px]'>
        {label}
      </label>
      <div className='relative'>
        <div
          className={`flex flex-wrap items-start gap-2 px-3 border rounded-[2px]
              min-h-[62px] py-1.5 max-h-[95px] overflow-y-auto
              ${
                displayError
                  ? 'border-red-500 bg-[#FEF2F2]'
                  : disabled
                    ? '!bg-gray-100 cursor-default border-[#CBD6E2]'
                    : 'border-[#CBD6E2] hover:border-[#CBD6E2] bg-white'
              } focus-within:!border-2 focus-within:!border-blue-400`}
          style={{ pointerEvents: disabled ? 'none' : 'all' }}
        >
          {/* Display selected tags as chips */}
          {values.map((tag, index) => (
            <Chip
              key={index}
              label={tag}
              size='small'
              onDelete={disabled ? undefined : () => removeTag(index)}
              sx={{
                fontSize: '12px',
                fontWeight: 600,
                height: '20px',
                background: '#DBEAFE',
                borderRadius: '2px',
                '& .MuiChip-deleteIcon': {
                  fontSize: '14px',
                  cursor: disabled ? 'default' : 'pointer',
                  '&:hover': { color: disabled ? 'inherit' : '#FA8072' },
                },
              }}
            />
          ))}

          {/* Input field */}
          <input
            ref={inputRef}
            type='text'
            value={inputValue}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyDown={handleInputKeyDown}
            placeholder={getPlaceholderText()}
            disabled={disabled}
            className='flex-1 min-w-[120px] border-none outline-none bg-transparent text-[13px] placeholder-[#7D98B6] focus:outline-none disabled:bg-gray-100'
          />
        </div>

        {/* Popper for suggestions */}
        <ClickAwayListener
          onClickAway={() => setSuggestions({ ...suggestions, anchorEl: null })}
        >
          <Popper
            open={
              Boolean(suggestions.anchorEl) &&
              suggestions.suggestions.length > 0
            }
            anchorEl={suggestions.anchorEl}
            placement='bottom-start'
            style={{ zIndex: 1300 }}
            modifiers={[
              { name: 'offset', options: { offset: [0, 6] } },
              {
                name: 'preventOverflow',
                options: { altAxis: true, padding: 8 },
              },
            ]}
          >
            <Paper
              elevation={3}
              sx={{
                maxWidth: 400,
                minWidth: 250,
                maxHeight: 300,
                overflow: 'auto',
                boxShadow: '0 6px 20px rgba(0,0,0,0.12)',
                borderRadius: '6px',
                border: '1px solid #E5E7EB',
                p: 0,
              }}
            >
              <List disablePadding>
                {suggestions.suggestions.map((suggestion, index) => (
                  <ListItemButton
                    key={`${suggestion.id}-${index}`}
                    selected={index === suggestions.highlightedIndex}
                    onMouseEnter={() =>
                      setSuggestions({
                        ...suggestions,
                        highlightedIndex: index,
                      })
                    }
                    onClick={() => {
                      handleSuggestionClick(suggestion.name);
                      setTimeout(() => inputRef.current?.focus(), 0);
                    }}
                    sx={{
                      borderRadius: '4px',
                      mx: 0.5,
                      my: 0.5,
                      p: 0,
                      px: 1.5,
                      transition: 'all .12s',
                      bgcolor: 'transparent',
                      '&:hover': { bgcolor: '#f7f7f7' },
                    }}
                  >
                    <ListItemText
                      primary={
                        <div className='flex items-center justify-between'>
                          <span className='font-medium text-[13px] text-[#2A2A2A]'>
                            {suggestion.name}
                          </span>
                          {suggestion.is_new_tag && (
                            <span
                              className='text-[11px] font-semibold text-nowrap text-[#425A76] ml-2 px-2 py-[1px] rounded-[2px]'
                              style={{
                                background: '#FEF3C7',
                              }}
                            >
                              New Tag
                            </span>
                          )}
                        </div>
                      }
                    />
                  </ListItemButton>
                ))}
              </List>
            </Paper>
          </Popper>
        </ClickAwayListener>
      </div>

      {displayError && (
        <span className='text-[12px] mt-0.5 text-red-400'>{displayError}</span>
      )}
    </div>
  );
};

export default TagsInput;
