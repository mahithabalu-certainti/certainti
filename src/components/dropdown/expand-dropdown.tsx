import React, { useEffect, useState } from 'react';
import { ClickAwayListener } from '@mui/material';
import { ExpandCollapseSelectOptions } from '../../common-service';
import { ArrowUpIcon } from '../../assets';

interface ExpandCollapseDropdownProps {
  label: string;
  selectedLabel: string;
  selectedValue: string;
  required: boolean;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  expandAll?: boolean;
  dropdownOptions: ExpandCollapseSelectOptions[];
}

const ExpandCollapseDropdown: React.FC<ExpandCollapseDropdownProps> = ({
  label,
  selectedValue,
  selectedLabel,
  required,
  onChange,
  placeholder = 'Choose an option',
  error,
  expandAll = false,
  dropdownOptions,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  const toggleGroup = (group: string) => {
    setOpenGroups((prev) => ({ ...prev, [group]: !prev[group] }));
  };

  useEffect(() => {
    if (dropdownOptions.length > 0 && expandAll) {
      const initialOpenState = dropdownOptions.reduce(
        (acc, group) => {
          acc[group.group] = true;
          return acc;
        },
        {} as { [key: string]: boolean }
      );
      setOpenGroups(initialOpenState);
    }
  }, [dropdownOptions, expandAll]);

  return (
    <ClickAwayListener onClickAway={() => setIsOpen(false)}>
      <div className='w-full'>
        <label className='text-[13px] text-[#2D3E4F] font-semibold leading-[21px] tracking-[0] md:text-left mt-1'>
          {label} {required && <span className='text-red-500'>*</span>}
        </label>

        <div className='relative'>
          <div
            tabIndex={0}
            className={`custom-select-no-arrow w-full !h-[32px] pl-3 pr-2.5 sm:text-sm flex items-center justify-between cursor-pointer
                ${selectedValue === '' ? 'text-[#7D98B6]' : 'text-black'} 
                ${error ? 'border-red-500 bg-[#FEF2F2]' : 'border-[#CBD6E2]'}
                border rounded-[2px] focus:outline-none focus:!border-2 focus:!border-[#60A5FA]
              `}
            onClick={() => setIsOpen(!isOpen)}
          >
            <span className='truncate max-w-[92%]'>
              {selectedLabel ? selectedLabel : placeholder}
            </span>
            <React.Suspense fallback={null}>
              <ArrowUpIcon
                alt={isOpen ? 'drop-arrowUp' : 'drop-arrowDown'}
                className='w-4'
                style={{
                  filter:
                    'invert(62%) sepia(15%) saturate(656%) hue-rotate(179deg) brightness(90%) contrast(87%)',
                  transform: isOpen ? 'rotate(0deg)' : 'rotate(180deg)',
                  transition: 'transform 0.3s ease',
                }}
              />
            </React.Suspense>
          </div>

          {isOpen && (
            <div
              className='absolute z-50 w-full mt-1 py-2 bg-white border border-[#CBD6E2] rounded-[4px] max-h-[300px] overflow-y-auto'
              style={{
                boxShadow:
                  'rgba(50, 50, 93, 0.25) 0px 2px 5px -1px, rgba(0, 0, 0, 0.3) 0px 1px 3px -1px',
              }}
            >
              <div className='p-0'>
                <div
                  className={`px-3 py-1.5 text-[13px] text-[#425A76] font-[500] cursor-pointer hover:bg-gray-100 ${selectedValue === '' ? 'bg-[#E5E8EA]' : ''}`}
                  onClick={() => {
                    onChange('');
                    setIsOpen(false);
                  }}
                >
                  {placeholder}
                </div>

                {dropdownOptions?.length > 0 &&
                  dropdownOptions.map((group) => (
                    <div key={group.group}>
                      <div
                        className='flex items-center gap-1 h-[32px] bg-gray-100 text-[#425A76] px-3 text-[13px] font-bold cursor-pointer'
                        title={group.group}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleGroup(group.group);
                        }}
                      >
                        <React.Suspense fallback={null}>
                          <ArrowUpIcon
                            alt={
                              openGroups[group.group] ? 'arrowUp' : 'arrowDown'
                            }
                            style={{
                              filter:
                                'invert(62%) sepia(15%) saturate(656%) hue-rotate(179deg) brightness(90%) contrast(87%)',
                              transform: openGroups[group.group]
                                ? 'rotate(180deg)'
                                : 'rotate(90deg)',
                              transition: 'transform 0.3s ease',
                            }}
                          />
                        </React.Suspense>
                        <span className='truncate'>{group.group}</span>
                      </div>

                      {openGroups[group.group] &&
                        group.options.map((option) => (
                          <div
                            key={option.value}
                            className={`px-6 py-2 text-[13px] font-medium text-[#425A76] truncate cursor-pointer hover:bg-gray-50 ${
                              selectedValue === option.value
                                ? 'bg-blue-50'
                                : 'bg-white'
                            }`}
                            title={option.label}
                            onClick={() => {
                              onChange(option.value);
                              setIsOpen(false);
                            }}
                          >
                            {option.label}
                          </div>
                        ))}
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>

        {error && (
          <span className='text-[12px] text-red-400 col-span-full'>
            {error}
          </span>
        )}
      </div>
    </ClickAwayListener>
  );
};

export default ExpandCollapseDropdown;
