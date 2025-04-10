import { Dropdown } from '../../../../components';

export const FiscalYearDropdown = () => {
  const currentYear = new Date().getFullYear();
  const fiscalYears = Array.from({ length: 6 }, (_, i) => {
    const year = currentYear - i;
    return { value: `FY-${year}`, label: `FY-${year}` };
  });
  return (
    <Dropdown
      options={fiscalYears}
      defaultValue={`FY-${currentYear}`}
      onChange={(value) => console.log('Selected:', value)}
    />
  );
};
