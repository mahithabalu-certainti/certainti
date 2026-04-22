import React from 'react';
import { useCallback, useRef } from 'react';
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
interface UserOption {
  rid: string;
  name: string;
  email: string;
}

interface SuggestionState {
  suggestions: UserOption[];
  highlightedIndex: number;
  anchorEl: HTMLElement | null;
}

interface EmailRecipientsProps {
  label: string;
  field: 'to' | 'cc' | 'bcc';
  values: string[];
  inputValue: string;
  onInputChange: (value: string) => void;
  onAddEmail: (field: 'to' | 'cc' | 'bcc', email: string) => void;
  onRemoveEmail: (field: 'to' | 'cc' | 'bcc', index: number) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  suggestions: SuggestionState;
  setSuggestions: (suggestions: SuggestionState) => void;
  errors?: string;
  userOptions: UserOption[];
  otherFields: {
    to: string[];
    cc: string[];
    bcc?: string[];
  };
  required?: boolean;
  isValidEmail: (email: string) => boolean;
  hide?: boolean;
  disabled?: boolean;
  className?: string;
}

const EmailRecipients: React.FC<EmailRecipientsProps> = ({
  label,
  field,
  values,
  inputValue,
  onInputChange,
  onAddEmail,
  onRemoveEmail,
  onKeyDown,
  suggestions,
  setSuggestions,
  errors,
  userOptions,
  otherFields,
  required = false,
  isValidEmail,
  hide = false,
  disabled = false,
  className = '',
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSuggestionClick = useCallback(
    (email: string) => {
      onAddEmail(field, email);
    },
    [field, onAddEmail]
  );

  const filterSuggestions = useCallback(
    (searchText: string): UserOption[] => {
      if (!searchText.trim()) return [];

      const lowerSearch = searchText.toLowerCase();

      const currentFieldEmails = values;

      const isEmailFormat = isValidEmail(searchText.trim());

      const filtered = userOptions.filter((user) => {
        const nameMatch = user.name.toLowerCase().includes(lowerSearch);
        const emailMatch = user.email.toLowerCase().includes(lowerSearch);

        return (
          (nameMatch || emailMatch) && !currentFieldEmails.includes(user.email)
        );
      });

      // If user typed a valid email, ALSO allow adding typed email as suggestion
      const typedEmail = searchText.trim();
      if (
        isEmailFormat &&
        !filtered.some((s) => s.email === typedEmail) &&
        !currentFieldEmails.includes(typedEmail)
      ) {
        filtered.push({
          rid: 'typed',
          name: 'Use this email address:', // chip will show email if not matched
          email: typedEmail,
        });
      }

      return filtered;
    },
    [userOptions, values, isValidEmail]
  );

  const handleInputChange = useCallback(
    (value: string) => {
      onInputChange(value);

      // If only '@' → show full list
      if (value === '@') {
        setSuggestions({
          suggestions: userOptions.filter(
            (user) => !values.includes(user.email)
          ),
          highlightedIndex: 0,
          anchorEl: inputRef.current,
        });
        return;
      }

      // If value starts with '@' but has more characters
      if (value.startsWith('@')) {
        const query = value.substring(1); // Remove '@'
        const filteredSuggestions = filterSuggestions(query);
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
    [onInputChange, setSuggestions, userOptions, values, filterSuggestions]
  );

  const isEmailInOtherField = (
    currentField: 'to' | 'cc' | 'bcc',
    email: string
  ): boolean => {
    return Object.entries(otherFields).some(
      ([otherField, emails]) =>
        otherField !== currentField && (emails || []).includes(email)
    );
  };

  const getOtherFieldName = (currentField: 'to' | 'cc' | 'bcc'): string => {
    const fieldMap = {
      to: 'TO',
      cc: 'CC',
      bcc: 'BCC',
    };

    const otherFieldsList = Object.keys(otherFields).filter(
      (f) => f !== currentField
    ) as Array<'to' | 'cc' | 'bcc'>;
    return otherFieldsList.map((f) => fieldMap[f]).join('/');
  };

  const getChipColor = (field: 'to' | 'cc' | 'bcc') => {
    switch (field) {
      case 'to':
        return '#B3ECFF';
      case 'cc':
        return '#FFE4B3';
      case 'bcc':
        return '#D1FFB3';
      default:
        return '#B3ECFF';
    }
  };

  const getChipLabel = (email: string) => {
    const match = userOptions.find((u) => u.email === email);
    return match ? match.name : email;
  };

  const getFieldColorForEmail = (email: string): string => {
    if (otherFields.to?.includes(email)) return getChipColor('to');
    if (otherFields.cc?.includes(email)) return getChipColor('cc');
    if (otherFields.bcc?.includes(email)) return getChipColor('bcc');
    return '#E5E7EB';
  };

  if (hide) {
    return null;
  }

  return (
    <div className={`grid grid-cols-1 pt-4 ${className}`}>
      <label
        htmlFor={field}
        className='text-[13px] text-[#2D3E4F] font-semibold leading-[21px]'
      >
        {label}
        {required && <span className='text-red-500'> *</span>}
      </label>
      <div className='relative'>
        <div
          className={`flex flex-wrap items-center gap-2 px-3 border rounded-[2px]
              min-h-[24px] py-1.5 max-h-[95px] overflow-y-auto
              ${
                errors
                  ? 'border-red-500 bg-[#FEF2F2]'
                  : disabled
                    ? '!bg-gray-100 cursor-default border-[#CBD6E2]'
                    : 'border-[#CBD6E2] hover:border-[#CBD6E2] bg-white'
              } focus-within:!border-2 focus-within:!border-blue-400`}
          style={{ pointerEvents: disabled ? 'none' : 'all' }}
        >
          {/* Display selected emails as chips */}
          {values.map((email, index) => (
            <Chip
              key={index}
              label={getChipLabel(email)}
              size='small'
              onDelete={() => onRemoveEmail(field, index)}
              sx={{
                fontSize: '12px',
                fontWeight: 600,
                height: '18px',
                background: getChipColor(field),
                borderRadius: '2px',
                '& .MuiChip-deleteIcon': {
                  fontSize: '14px',
                  cursor: 'pointer',
                  '& :hover': { color: '#FA8072' },
                },
              }}
            />
          ))}

          {/* Input field */}
          <input
            ref={inputRef}
            id={`${field}-input`}
            type='text'
            value={inputValue}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder={
              values.length === 0 ? 'Type @ to view suggestions…' : ''
            }
            className='flex-1 border-none outline-none bg-transparent text-[13px] placeholder-[#7D98B6] focus:outline-none'
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
                    key={`${suggestion.rid}-${index}`}
                    selected={index === suggestions.highlightedIndex}
                    onMouseEnter={() =>
                      setSuggestions({
                        ...suggestions,
                        highlightedIndex: index,
                      })
                    }
                    onClick={() => {
                      handleSuggestionClick(suggestion.email);
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
                          {isEmailInOtherField(field, suggestion.email) && (
                            <span
                              className='text-[11px] font-semibold text-[#425A76] ml-2 px-2 py-[1px] rounded-[2px]'
                              style={{
                                background: getFieldColorForEmail(
                                  suggestion.email
                                ),
                              }}
                            >
                              {getOtherFieldName(field)}
                            </span>
                          )}
                        </div>
                      }
                      secondary={
                        <span className='text-[12px] text-[#425A76]'>
                          {suggestion.email}
                        </span>
                      }
                    />
                  </ListItemButton>
                ))}
              </List>
            </Paper>
          </Popper>
        </ClickAwayListener>
      </div>

      {errors && <span className='text-[12px] text-red-400'>{errors}</span>}
    </div>
  );
};

export default EmailRecipients;
