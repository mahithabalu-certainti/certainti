import { useState, useRef, useEffect } from 'react';
import { arrowDownIcon } from '../../assets';

interface FiscalYearOption {
  label: string;
  value: string;
}

interface Props {
  fiscalYear: string;
  fiscalYearsDropDown: FiscalYearOption[];
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
}

const FiscalYearDropdown = ({
  fiscalYear,
  fiscalYearsDropDown,
  onChange,
}: Props) => {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleSelect = (value: string) => {
    const event = {
      target: { value },
    } as React.ChangeEvent<HTMLSelectElement>;
    onChange(event);
    setOpen(false);
  };

  const selectedLabel =
    fiscalYearsDropDown.find((fy) => fy.value === fiscalYear)?.label || 'FY-All';

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div
      className="relative inline-block text-left w-[107px] min-w-[107px] max-w-[107px] mx-2 font-medium z-50"
      ref={dropdownRef}
    >
      <button
        onClick={() => setOpen((prev) => !prev)}
        className={`${
          open ? 'bg-[#FFFFFF33] border-t border-l border-r border-[#CBD6E2]' : 'bg-transparent'
        } text-white text-[13px] font-normal px-3 h-[32px] w-full flex justify-center items-center gap-1.5 cursor-pointer focus:outline-none rounded-t-xs hover:bg-[#FFFFFF33] hover:rounded-xs whitespace-nowrap`}
        aria-haspopup="true"
        aria-expanded={open}
      >
        {selectedLabel}
        <img
          src={arrowDownIcon}
          alt="dropdown arrow"
          className={`transition-transform duration-300 ${
            open ? 'rotate-180' : ''
          }`}
          style={{ width: 15, height: 15, filter: 'brightness(0) invert(1)' }}
        />
      </button>

      {open && (
        <div
          className="absolute w-full bg-white border-b border-l border-r rounded-b-xs shadow-lg"
          style={{ borderColor: '#CBD6E2' }}
        >
          {fiscalYearsDropDown.map((fy) => (
            <div
              key={fy.value}
              onClick={() => handleSelect(fy.value)}
              className="px-4 h-[29px] flex items-center text-[#425A76] text-[13px] font-normal hover:bg-gray-100 cursor-pointer"
            >
              {fy.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FiscalYearDropdown;
