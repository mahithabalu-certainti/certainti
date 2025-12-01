import React, { useState, useEffect } from 'react';
import { SearchBlackIcon } from '../../assets';

type SearchBarProps = {
  initialSearchText?: string;
  onSearch: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  hide?: boolean;
  reset?: boolean;
  onReset?: () => void;
  setCurrentPage?: (page: number) => void;
};

const SearchBar: React.FC<SearchBarProps> = React.memo(
  ({
    initialSearchText = '',
    onSearch,
    placeholder = 'Search',
    disabled = false,
    hide = false,
    reset = false,
    onReset,
    setCurrentPage,
  }) => {
    const [text, setText] = useState<string>(initialSearchText);

    useEffect(() => {
      if (reset) {
        setText('');
        onSearch('');
        onReset?.();
        setCurrentPage?.(0);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [reset, onSearch, onReset]);

    const triggerSearch = () => {
      if (!disabled) {
        onSearch(text);
        setCurrentPage?.(0);
      }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' && !disabled) {
        e.preventDefault();
        triggerSearch();
      }
    };

    if (hide) return null;

    return (
      <div
        className={`flex items-center border border-[#CBD6E2] rounded-xs w-[200px] h-[24px] box-border bg-white ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
      >
        <input
          type='text'
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            if (e.target.value === '') {
              onSearch('');
              setCurrentPage?.(0);
            }
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className='flex-1 text-[12px] placeholder:text-[12px] pl-2.5 pr-2 h-full outline-none bg-white focus-within:border-1 focus-within:border-blue-400'
        />
        <button
          onClick={triggerSearch}
          disabled={disabled}
          className={`flex items-center justify-center w-[30px] h-full border-l border-[#CBD6E2] rounded-r-xs bg-gradient-to-b from-white to-[#E4E6E7] hover:from-[#f0f0f0] hover:to-[#d4d6d7] active:scale-95 transition-all duration-200 ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
        >
          <SearchBlackIcon alt='search' className='w-4 h-4' />
        </button>
      </div>
    );
  }
);

export default SearchBar;
