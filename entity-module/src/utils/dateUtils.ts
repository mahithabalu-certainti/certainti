// Utility to parse mm/dd and year to YYYY-MM-DD
export function parseFiscalDate(mmdd: string, year: number): string {
  const [mm, dd] = mmdd.split('/');
  if (!mm || !dd) return '';
  // Pad month and day to 2 digits
  const paddedMonth = mm.padStart(2, '0');
  const paddedDay = dd.padStart(2, '0');
  return `${year}-${paddedMonth}-${paddedDay}`;
}

// Utility to calculate the fiscal end year based on start and end mm/dd and fiscal year
export function getFiscalEndYear(fiscalStart: string, fiscalEnd: string, fiscalYear: number): number {
  const [startMonthStr] = fiscalStart.split('/');
  const [endMonthStr] = fiscalEnd.split('/');
  const startMonth = parseInt(startMonthStr || '0', 10);
  const endMonth = parseInt(endMonthStr || '0', 10);
  if (isNaN(startMonth) || isNaN(endMonth)) return fiscalYear;
  return endMonth < startMonth ? fiscalYear + 1 : fiscalYear;
}