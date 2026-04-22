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
  phone?: string;
}

interface SuggestionState {
  suggestions: UserOption[];
  highlightedIndex: number;
  anchorEl: HTMLElement | null;
}

interface MeetingAttendeesProps {
  label: string;
  field: 'attendees' | 'call_participants' | 'caller_id' | 'organizer';
  values: string[];
  inputValue: string;
  onInputChange: (value: string) => void;
  onAddAttendee: (
    field: 'attendees' | 'call_participants' | 'caller_id' | 'organizer',
    email: string
  ) => void;
  onRemoveAttendee: (
    field: 'attendees' | 'call_participants' | 'caller_id' | 'organizer',
    index: number
  ) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  suggestions: SuggestionState;
  setSuggestions: (suggestions: SuggestionState) => void;
  errors?: string;
  userOptions: UserOption[];
  otherFields: {
    attendees?: string[];
    call_participants?: string[];
    caller_id?: string[] | string;
    organizer?: string[];
  };
  required?: boolean;
  isValidEmail: (email: string) => boolean;
  hide?: boolean;
  disabled?: boolean;
  className?: string;
  singleSelect?: boolean;
  maxSelections?: number;
  allowPhoneNumber?: boolean;
  isValidPhoneNumber?: (phone: string) => boolean;
}

const MeetingAttendees: React.FC<MeetingAttendeesProps> = ({
  label,
  field,
  values,
  inputValue,
  onInputChange,
  onAddAttendee,
  onRemoveAttendee,
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
  singleSelect = false,
  maxSelections,
  allowPhoneNumber = false,
  isValidPhoneNumber,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  // Check if field is reached maximum selections
  const isMaxSelectionsReached = maxSelections
    ? values.length >= maxSelections
    : false;
  const isSingleSelectReached = singleSelect && values.length >= 1;

  const handleSuggestionClick = useCallback(
    (email: string) => {
      if (isMaxSelectionsReached || isSingleSelectReached) return;

      // Call the parent handler to add the attendee
      onAddAttendee(field, email);

      // Clear input and suggestions after selection
      onInputChange('');
      setSuggestions({
        suggestions: [],
        highlightedIndex: 0,
        anchorEl: null,
      });
    },
    [
      field,
      onAddAttendee,
      onInputChange,
      setSuggestions,
      isMaxSelectionsReached,
      isSingleSelectReached,
    ]
  );

  const filterSuggestions = useCallback(
    (searchText: string): UserOption[] => {
      if (!searchText.trim() || isMaxSelectionsReached || isSingleSelectReached)
        return [];

      const lowerSearch = searchText.toLowerCase();
      const currentFieldEmails = values;
      const isEmailFormat = isValidEmail(searchText.trim());
      const isPhoneFormat =
        allowPhoneNumber && isValidPhoneNumber
          ? isValidPhoneNumber(searchText.trim())
          : false;

      const filtered = userOptions.filter((user) => {
        const nameMatch = user.name.toLowerCase().includes(lowerSearch);
        const emailMatch = user.email.toLowerCase().includes(lowerSearch);
        const phoneMatch =
          allowPhoneNumber && user.phone
            ? user.phone.toLowerCase().includes(lowerSearch)
            : false;

        // Check if user's email or phone is already in current field
        const alreadyAdded =
          currentFieldEmails.includes(user.email) ||
          (allowPhoneNumber &&
            user.phone &&
            currentFieldEmails.includes(user.phone));

        return (nameMatch || emailMatch || phoneMatch) && !alreadyAdded;
      });

      // If user typed a valid email, ALSO allow adding typed email as suggestion
      const typedValue = searchText.trim();
      if (
        isEmailFormat &&
        !filtered.some((s) => s.email === typedValue) &&
        !currentFieldEmails.includes(typedValue)
      ) {
        filtered.push({
          rid: 'typed',
          name: 'Use this email address:',
          email: typedValue,
        });
      }

      // If user typed a valid phone number, ALSO allow adding typed phone as suggestion
      if (
        allowPhoneNumber &&
        isPhoneFormat &&
        !filtered.some(
          (s) => s.phone === typedValue || s.email === typedValue
        ) &&
        !currentFieldEmails.includes(typedValue)
      ) {
        // Add + prefix if not present for UI consistency
        const phoneWithPlus = typedValue.startsWith('+')
          ? typedValue
          : `+${typedValue}`;

        filtered.push({
          rid: 'typed-phone',
          name: 'Use this phone number:',
          email: phoneWithPlus,
          phone: phoneWithPlus,
        });
      }

      return filtered;
    },
    [
      userOptions,
      values,
      isValidEmail,
      isMaxSelectionsReached,
      isSingleSelectReached,
      allowPhoneNumber,
      isValidPhoneNumber,
    ]
  );

  const handleInputChange = useCallback(
    (value: string) => {
      if (isMaxSelectionsReached || isSingleSelectReached) return;

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
        const query = value.substring(1);
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
    [
      onInputChange,
      setSuggestions,
      userOptions,
      values,
      filterSuggestions,
      isMaxSelectionsReached,
      isSingleSelectReached,
    ]
  );

  const isEmailInOtherField = (
    currentField: 'attendees' | 'call_participants' | 'caller_id' | 'organizer',
    email: string
  ): boolean => {
    return Object.entries(otherFields).some(
      ([otherField, emails]) =>
        otherField !== currentField &&
        (Array.isArray(emails) ? emails.includes(email) : emails === email)
    );
  };

  const getOtherFieldName = (
    currentField: 'attendees' | 'call_participants' | 'caller_id' | 'organizer'
  ): string => {
    const fieldMap = {
      attendees: 'Attendees',
      call_participants: 'Participants',
      caller_id: 'Caller',
      organizer: 'Organizer',
    };

    const otherFieldsList = Object.keys(otherFields).filter(
      (f) => f !== currentField
    ) as Array<'attendees' | 'call_participants' | 'caller_id' | 'organizer'>;
    return otherFieldsList.map((f) => fieldMap[f]).join('/');
  };

  const getChipColor = (
    field: 'attendees' | 'call_participants' | 'caller_id' | 'organizer'
  ) => {
    switch (field) {
      case 'attendees':
        return '#E6E6FA'; // Lavender
      case 'call_participants':
        return '#FFF0F5'; // Lavender blush
      case 'caller_id':
        return '#F0FFF0'; // Honeydew
      case 'organizer':
        return '#F5F5DC'; // Beige
      default:
        return '#E6E6FA';
    }
  };

  const getChipLabel = (value: string) => {
    // Try to find by email first
    let match = userOptions.find((u) => u.email === value);

    // If allowPhoneNumber is enabled and no email match, try to find by phone
    if (!match && allowPhoneNumber) {
      match = userOptions.find((u) => u.phone === value);
    }

    return match ? match.name : value;
  };

  const getFieldColorForEmail = (email: string): string => {
    if (
      Array.isArray(otherFields.attendees) &&
      otherFields.attendees.includes(email)
    )
      return getChipColor('attendees');
    if (
      Array.isArray(otherFields.call_participants) &&
      otherFields.call_participants.includes(email)
    )
      return getChipColor('call_participants');
    if (
      otherFields.caller_id === email ||
      (Array.isArray(otherFields.caller_id) &&
        otherFields.caller_id.includes(email))
    )
      return getChipColor('caller_id');
    if (
      Array.isArray(otherFields.organizer) &&
      otherFields.organizer.includes(email)
    )
      return getChipColor('organizer');
    return '#E5E7EB';
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (isMaxSelectionsReached || isSingleSelectReached) {
      if (e.key !== 'Backspace' && e.key !== 'Delete') {
        e.preventDefault();
        return;
      }
    }
    onKeyDown(e);
  };

  const getPlaceholderText = () => {
    if (isMaxSelectionsReached)
      return `Maximum ${maxSelections} selections reached`;
    if (isSingleSelectReached) return 'Only one selection allowed';
    if (values.length === 0) {
      return allowPhoneNumber
        ? `Type @ to view suggestions or enter email / phone…`
        : `Type @ to view suggestions…`;
    }
    return '';
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
        {(maxSelections || singleSelect) && (
          <span className='text-xs text-gray-500 ml-2'>
            ({values.length}
            {maxSelections ? `/${maxSelections}` : ''}
            {singleSelect ? '/1' : ''})
          </span>
        )}
      </label>
      <div className='relative'>
        <div
          className={`flex flex-wrap items-center gap-2 px-3 border rounded-[2px]
              min-h-[32px] py-1.5 max-h-[95px] overflow-y-auto
              ${
                errors
                  ? 'border-red-500 bg-[#FEF2F2]'
                  : disabled
                    ? '!bg-gray-100 border-[#CBD6E2] cursor-default'
                    : 'border-[#CBD6E2] hover:border-[#CBD6E2] bg-white'
              } focus-within:!border-2 focus-within:!border-blue-400`}
          style={{
            pointerEvents: disabled ? 'none' : 'all',
          }}
        >
          {/* Display selected emails as chips */}
          {values.map((email, index) => (
            <Chip
              key={index}
              label={getChipLabel(email)}
              size='small'
              onDelete={
                disabled ? undefined : () => onRemoveAttendee(field, index)
              }
              sx={{
                fontSize: '12px',
                fontWeight: 600,
                height: '20px',
                background: getChipColor(field),
                borderRadius: '2px',
                '& .MuiChip-deleteIcon': {
                  fontSize: '14px',
                  cursor: disabled ? 'default' : 'pointer',
                  '& :hover': { color: disabled ? 'inherit' : '#FA8072' },
                },
              }}
            />
          ))}

          {/* Input field - only show if not reached limit */}
          {!(isMaxSelectionsReached || isSingleSelectReached) && (
            <input
              ref={inputRef}
              id={`${field}-input`}
              type='text'
              value={inputValue}
              onChange={(e) => handleInputChange(e.target.value)}
              onKeyDown={handleInputKeyDown}
              placeholder={getPlaceholderText()}
              disabled={disabled}
              className='flex-1 min-w-[120px] border-none outline-none bg-transparent text-[13px] placeholder-[#7D98B6] focus:outline-none disabled:bg-gray-100'
            />
          )}
        </div>

        {/* Popper for suggestions */}
        <ClickAwayListener
          onClickAway={() => setSuggestions({ ...suggestions, anchorEl: null })}
        >
          <Popper
            open={
              Boolean(suggestions.anchorEl) &&
              suggestions.suggestions.length > 0 &&
              !isMaxSelectionsReached &&
              !isSingleSelectReached
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
                        <div className='flex flex-col'>
                          <span className='text-[12px] text-[#425A76]'>
                            {suggestion.email}
                          </span>
                          {allowPhoneNumber &&
                            suggestion.phone &&
                            suggestion.phone !== suggestion.email && (
                              <span className='text-[12px] text-[#425A76]'>
                                {suggestion.phone}
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

      {errors && (
        <span className='text-[12px] mt-0.5 text-red-400'>{errors}</span>
      )}
    </div>
  );
};

export default MeetingAttendees;
