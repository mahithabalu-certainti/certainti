import { fiscalYears } from '../../../../common-utils';
import { Dropdown } from '../../../../components';

export const FiscalYearDropdown = () => {
  const currentYear = new Date().getFullYear();
  return (
    <Dropdown
      options={fiscalYears}
      defaultValue={`FY-${currentYear}`}
      onChange={(value) => console.log('Selected:', value)}
    />
  );
};
