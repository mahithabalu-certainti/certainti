import {
  useState,
  useRef,
  useEffect,
  useMemo,
  useCallback,
  Suspense,
} from 'react';
import { ArrowDownIcon, FiscalYearArrowIcon } from '../../assets';

interface FiscalYearOption {
  label: string;
  value: string;
}

interface Props {
  fiscalYear: string;
  fiscalYearsOptions: FiscalYearOption[];
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  isGlobal?: boolean;
  className?: string;
  placeholder?: string;
  position?: 'first' | 'last';
  disabled?: boolean;
}

const FiscalYearDropdown = ({
  fiscalYear,
  fiscalYearsOptions,
  isGlobal = false,
  onChange,
  className = '',
  placeholder = 'FY-All',
  position,
  disabled,
}: Props) => {
  const currentYear = new Date().getFullYear();
  const years = fiscalYearsOptions.map((fy) => Number(fy.value));
  const excludedFyall = years.filter((year) => year !== 0);
  const minYear = Math.min(...excludedFyall);
  const maxYear = Math.max(...years);

  const [open, setOpen] = useState(false);
  const [selectedYear, setSelectedYear] = useState(fiscalYear || '');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [fiscalYearRange, setFiscalYearRange] = useState(0);

  useEffect(() => {
    const base = Number(fiscalYear) || currentYear;
    setFiscalYearRange(base - (base % 10));
    if (fiscalYear) {
      setSelectedYear(fiscalYear);
    }
  }, [fiscalYear, currentYear]);

  const yearsInDecade = useMemo(() => {
    return fiscalYearsOptions
      .map((fy) => ({ value: Number(fy.value), label: fy.label }))
      .filter(
        (fy) => fy.value >= fiscalYearRange && fy.value < fiscalYearRange + 10
      )
      .sort((a, b) => a.value - b.value);
  }, [fiscalYearsOptions, fiscalYearRange]);

  const handlePrevDecade = useCallback(() => {
    setFiscalYearRange((prev) => prev - 10);
  }, []);

  const handleNextDecade = useCallback(() => {
    setFiscalYearRange((prev) => prev + 10);
  }, []);

  const handleYearClick = useCallback(
    (value: number) => {
      const event = {
        target: { value: value.toString() },
      } as React.ChangeEvent<HTMLSelectElement>;
      setSelectedYear(value.toString());
      onChange(event);
      setOpen(false);
    },
    [onChange]
  );

  const handleAllClick = useCallback(() => {
    setSelectedYear('FY-All');
    onChange({
      target: { value: 'FY-All' },
    } as React.ChangeEvent<HTMLSelectElement>);
    setOpen(false);
  }, [onChange]);

  const selectedLabel =
    fiscalYearsOptions.find((fy) => fy.value === fiscalYear)?.label ||
    placeholder;

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
      className={`relative inline-block text-left  mx-2 font-medium z-50 ${className ? className : ''}`}
      ref={dropdownRef}
    >
      <button
        type='button'
        onClick={() => setOpen((prev) => !prev)}
        className={`${open || Number(selectedYear) || disabled ? 'bg-[#FFFFFF26]' : 'bg-transparent'}
          ${className ? 'text-[#425A76] font-semibold' : 'text-white'}
         text-[13px] font-normal w-[107px] min-w-[107px] px-3 h-[25px] flex justify-center items-center gap-1.5 cursor-pointer focus:outline-none rounded-[2px] hover:bg-[#FFFFFF33] hover:rounded-xs whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed`}
        aria-haspopup='true'
        aria-expanded={open}
        disabled={disabled}
      >
        {selectedLabel}
        <ArrowDownIcon
          alt='dropdown arrow'
          className={`transition-transform duration-300 ${
            open ? 'rotate-180' : ''
          }`}
          style={{
            width: 15,
            height: 15,
            filter: isGlobal ? 'brightness(0) invert(1)' : '',
          }}
        />
      </button>
      <Suspense fallback={null}>
        {open && (
          <div
            className={`absolute right-0 mt-1 w-[261px] min-w-[261px] max-w-[261px] p-5 bg-white border border-[#CBD6E2] rounded-[8px] h-[204px] ${position === 'first' ? 'left-0' : 'right-0'}`}
            style={{ borderColor: '#CBD6E2' }}
          >
            <div className='flex items-center justify-between text-[#425A76]'>
              <div className='flex items-center gap-x-4'>
                <button
                  type='button'
                  disabled={fiscalYearRange <= minYear}
                  className='cursor-pointer disabled:cursor-default'
                  onClick={handlePrevDecade}
                >
                  <FiscalYearArrowIcon
                    alt='less-than'
                    className={`${yearsInDecade.some((year) => year.value === minYear) ? 'invert grayscale' : ''}`}
                  />
                </button>
                <span className='text-[#2D3E4F] text-[15px] font-bold'>
                  {fiscalYearRange} - {Math.min(fiscalYearRange + 9, maxYear)}
                </span>
                <button
                  type='button'
                  disabled={yearsInDecade.some(
                    (year) => year.value === currentYear
                  )}
                  className='cursor-pointer disabled:cursor-default'
                  onClick={handleNextDecade}
                >
                  <FiscalYearArrowIcon
                    className={`rotate-[180deg] ${yearsInDecade.some((year) => year.value === currentYear) ? 'invert grayscale' : ''}`}
                    alt='less-than'
                  />
                </button>
              </div>
              {isGlobal && (
                <button
                  type='button'
                  className={`h-[22px] w-[32px] text-[#425A76] text-[14px] font-bold cursor-pointer ${selectedYear === 'FY-All' ? 'bg-[#425A76] text-[#FFFFFF] rounded-[30px]' : ''} disabled:opacity-50 disabled:cursor-not-allowed`}
                  onClick={handleAllClick}
                  disabled={disabled}
                >
                  All
                </button>
              )}
            </div>
            <div className='grid grid-cols-3 mt-4'>
              {yearsInDecade.map((year) => (
                <div
                  key={year.value}
                  className='col-span-1 mb-3 flex justify-center'
                >
                  <button
                    className={`w-12 h-[20px] cursor-pointer disabled:text-gray-300 text-[#425A76] text-[14px] font-medium ${
                      Number(selectedYear) === year.value
                        ? 'bg-[#425A76] text-[#FFFFFF] rounded-[30px]'
                        : ''
                    }`}
                    onClick={() => handleYearClick(year.value)}
                    disabled={
                      year.value > currentYear ||
                      (disabled && year.value !== Number(selectedYear))
                    }
                  >
                    {year.value}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </Suspense>
    </div>
  );
};

export default FiscalYearDropdown;
