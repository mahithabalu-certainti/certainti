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
  fiscalYearsDropDown: FiscalYearOption[];
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
}

const FiscalYearDropdown = ({
  fiscalYear,
  fiscalYearsDropDown,
  onChange,
}: Props) => {
  const currentYear = new Date().getFullYear();
  const minYear = 2000;
  const [open, setOpen] = useState(false);
  const [selectedYear, setSelectedYear] = useState(fiscalYear);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [fiscalYearRange, setFiscalYearRange] = useState(2020);

  const yearsInDecade = useMemo(() => {
    const years = [];
    for (let i = 0; i <= 9; i++) {
      years.push(fiscalYearRange + i);
    }
    return years;
  }, [fiscalYearRange]);

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

  // const handleSelect = (value: string) => {
  //   const event = {
  //     target: { value },
  //   } as React.ChangeEvent<HTMLSelectElement>;
  //   onChange(event);
  //   setOpen(false);
  // };

  const selectedLabel =
    fiscalYearsDropDown.find((fy) => fy.value === fiscalYear)?.label ||
    'Choose Fiscal Year';

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
      className='relative inline-block text-left  mx-2 font-medium z-50'
      ref={dropdownRef}
    >
      <button
        type='button'
        onClick={() => setOpen((prev) => !prev)}
        className={`${open || Number(selectedYear) ? 'bg-[#FFFFFF26]' : 'bg-transparent'}
        text-white text-[13px] font-normal w-[107px] min-w-[107px] px-3 h-[25px] flex justify-center items-center gap-1.5 cursor-pointer focus:outline-none rounded-[2px] hover:bg-[#FFFFFF33] hover:rounded-xs whitespace-nowrap`}
        aria-haspopup='true'
        aria-expanded={open}
      >
        {selectedLabel}
        <ArrowDownIcon
          alt='dropdown arrow'
          className={`transition-transform duration-300 ${
            open ? 'rotate-180' : ''
          }`}
          style={{ width: 15, height: 15, filter: 'brightness(0) invert(1)' }}
        />
      </button>
      <Suspense fallback={null}>
        {open && (
          <div
            className='absolute right-0 mt-1 w-[261px] min-w-[261px] max-w-[261px] p-5 bg-white border border-[#CBD6E2] rounded-[8px] h-[204px]'
            style={{ borderColor: '#CBD6E2' }}
          >
            <div className='flex items-center justify-between text-[#425A76]'>
              <div className='flex items-center gap-x-4'>
                <button
                  type='button'
                  disabled={yearsInDecade.includes(minYear)}
                  className='cursor-pointer disabled:cursor-not-allowed'
                  onClick={handlePrevDecade}
                >
                  <FiscalYearArrowIcon
                    alt='less-than'
                    className={`${yearsInDecade.includes(minYear) ? 'invert grayscale' : ''}`}
                  />
                </button>
                <span className='text-[#2D3E4F] text-[15px] font-bold'>
                  {fiscalYearRange} - {fiscalYearRange + 9}
                </span>
                <button
                  type='button'
                  disabled={yearsInDecade.includes(currentYear)}
                  className='cursor-pointer disabled:cursor-not-allowed'
                  onClick={handleNextDecade}
                >
                  <FiscalYearArrowIcon
                    className={`rotate-[180deg] ${yearsInDecade.includes(currentYear) ? 'invert grayscale' : ''}`}
                    alt='less-than'
                  />
                </button>
              </div>

              <button
                type='button'
                className={`h-[20px] w-[32px] text-[#425A76] text-[14px] font-bold cursor-pointer ${selectedYear === 'FY-All' ? 'bg-[#425A76] text-[#FFFFFF] rounded-[30px]' : ''}`}
                onClick={handleAllClick}
              >
                All
              </button>
            </div>
            <div className='flex items-center gap-x-9 gap-y-3 mt-4 flex-wrap'>
              {yearsInDecade.map((year) => (
                <button
                  className={`w-11 h-[20px] cursor-pointer disabled:text-gray-300 text-[#425A76] text-[14px] font-medium ${Number(selectedYear) === year ? 'bg-[#425A76] text-[#FFFFFF] rounded-[30px]' : ''}`}
                  key={year}
                  onClick={() => handleYearClick(year)}
                  disabled={year > currentYear}
                >
                  {year}
                </button>
              ))}
            </div>
            {/* {fiscalYearsDropDown.map((fy) => (
            <div
              key={fy.value}
              onClick={() => handleSelect(fy.value)}
              className="px-4 h-[29px] flex items-center text-[#425A76] text-[13px] font-normal hover:bg-gray-100 cursor-pointer"
            >
              {fy.label}
            </div>
          ))} */}
          </div>
        )}
      </Suspense>
    </div>
  );
};

export default FiscalYearDropdown;
