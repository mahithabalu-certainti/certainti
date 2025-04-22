import { fiscalYears } from '../../../../common-utils';
import { Dropdown } from '../../../../components';

interface FiscalYearDropdownProps{
  setFiscalYearValue: (value:number)=>void
}

export const FiscalYearDropdown:React.FC <FiscalYearDropdownProps> = ({setFiscalYearValue}) => {
  const currentYear = new Date().getFullYear();
  return (
    <Dropdown
      options={fiscalYears}
      defaultValue={`FY-${currentYear}`}
      onChange={(value) => setFiscalYearValue(Number(value))}
    />
  );
};
