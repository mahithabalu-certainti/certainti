import {
  useState,
  useRef,
  useEffect,
  useMemo,
  useCallback,
  Suspense,
} from 'react';
import { ArrowDownDisabledIcon, FiscalYearArrowIcon } from '../../assets';

interface FiscalYearOption {
  label: string;
  value: string;
}

interface Props {
  fiscalYear: string;
  fiscalYearsDropDown: FiscalYearOption[];
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
}

const FormFiscalYearDropdown = ({
  fiscalYear,
  fiscalYearsDropDown,
  onChange,
}: Props) => {
  const currentYear = new Date().getFullYear();
  const years = fiscalYearsDropDown.map((fy) => Number(fy.value));
  const minYear = Math.min(...years);
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
    return fiscalYearsDropDown
      .map((fy) => ({ value: Number(fy.value), label: fy.label }))
      .filter(
        (fy) => fy.value >= fiscalYearRange && fy.value < fiscalYearRange + 10
      )
      .sort((a, b) => a.value - b.value);
  }, [fiscalYearsDropDown, fiscalYearRange]);

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
      className='relative inline-block text-left font-medium z-50 w-full'
      ref={dropdownRef}
    >
      <button
        type='button'
        onClick={() => setOpen((prev) => !prev)}
        className='bg-white text-[#2D3E4F] text-[13px] font-normal w-full px-3 h-[32px] flex justify-between items-center cursor-pointer focus:border-[2px] focus:border-[#60A5FA] focus:bg-white rounded-[2px] border border-[#CBD6E2]'
        aria-haspopup='true'
        aria-expanded={open}
      >
        <span
          className={`${
            !fiscalYear && 'text-[#7D98B6]'
          } text-[13px] font-normal`}
        >
          {selectedLabel}
        </span>
        <ArrowDownDisabledIcon
          alt='dropdown arrow'
          className={`transition-transform duration-300 ${
            open ? 'rotate-180' : ''
          }`}
          style={{ width: 15, height: 15 }}
        />
      </button>
      <Suspense fallback={null}>
        {open && (
          <div className='absolute right-0 mt-1 w-[308px] min-w-[308px] max-w-[261px] p-5 bg-white border border-[#CBD6E2] rounded-[2px] h-[204px]'>
            {yearsInDecade.length > 0 && (
              <div className='flex items-center justify-between text-[#425A76]'>
                <div className='flex items-center gap-x-4'>
                  <button
                    type='button'
                    disabled={fiscalYearRange <= minYear}
                    className='cursor-pointer disabled:cursor-not-allowed'
                    onClick={handlePrevDecade}
                  >
                    <FiscalYearArrowIcon
                      alt='less-than'
                      className={`${
                        fiscalYearRange <= minYear ? 'invert grayscale' : ''
                      }`}
                    />
                  </button>
                  <span className='text-[#2D3E4F] text-[15px] font-bold'>
                    {fiscalYearRange} -{' '}
                    {Math.min(currentYear, fiscalYearRange + 9)}
                  </span>
                  <button
                    type='button'
                    disabled={fiscalYearRange + 9 >= maxYear}
                    className='cursor-pointer disabled:cursor-not-allowed'
                    onClick={handleNextDecade}
                  >
                    <FiscalYearArrowIcon
                      className={`rotate-[180deg] ${
                        fiscalYearRange + 9 >= maxYear ? 'invert grayscale' : ''
                      }`}
                      alt='greater-than'
                    />
                  </button>
                </div>
              </div>
            )}
            <div className='flex items-center gap-x-9 gap-y-3 mt-4 flex-wrap'>
              {yearsInDecade.map((fy) => (
                <button
                  key={fy.value}
                  className={`w-16 h-[20px] cursor-pointer disabled:text-gray-300 text-[#425A76] text-[14px] font-medium ${
                    Number(selectedYear) === fy.value
                      ? 'bg-[#425A76] text-[#FFFFFF] rounded-[30px]'
                      : ''
                  }`}
                  onClick={() => handleYearClick(fy.value)}
                  disabled={fy.value > currentYear}
                >
                  {fy.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </Suspense>
    </div>
  );
};

export default FormFiscalYearDropdown;
