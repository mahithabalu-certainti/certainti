import React, { useState, useRef, useEffect } from 'react';
import { DropdownOption } from './types';
import { AddIcon } from '../../assets';

interface DropdownMenuProps {
  options: DropdownOption[];
  className?: string;
}

const DropdownMenu: React.FC<DropdownMenuProps> = ({
  options,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const visibleOptions = options.filter((option) => !option.hidden);

  if (visibleOptions.length === 0) return null;

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className='p-1 rounded-md hover:bg-white/20 transition-colors duration-200'
        aria-label='More options'
      >
        <AddIcon size={18} className='text-white' />
      </button>

      {isOpen && (
        <div className='absolute right-0 top-8 z-50 bg-white rounded-lg shadow-lg border border-gray-200 py-2 min-w-48'>
          {visibleOptions.map((option) => (
            <button
              key={option.id}
              onClick={() => {
                if (!option.disabled) {
                  option.action();
                  setIsOpen(false);
                }
              }}
              disabled={option.disabled}
              className={`
                w-full px-4 py-2 text-left text-sm transition-colors duration-150 flex items-center gap-2
                ${
                  option.disabled
                    ? 'text-gray-400 cursor-not-allowed'
                    : option.variant === 'danger'
                      ? 'text-red-600 hover:bg-red-50'
                      : 'text-gray-700 hover:bg-gray-50'
                }
              `}
            >
              {option.icon}
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default DropdownMenu;
