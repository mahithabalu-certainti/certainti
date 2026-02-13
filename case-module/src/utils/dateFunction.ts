export const calculateFiscalYearDateRange = (startMonth: string, endMonth : string, fiscalYear : number, startDate : string, endDate : string) => {
  let validStartDate : string = ''
  let validEndDate : string = ''
  const paddedStartMonth = startMonth.padStart(2, '0');
  const paddedEndMonth = endMonth.padStart(2, '0');
  const paddedStartDate = startDate.padStart(2, '0');
  const paddedEndDate = endDate.padStart(2, '0');
  let start = parseInt(startMonth);
  let end = parseInt(endMonth)
  if(start === end || start > end) {
    validStartDate = `${fiscalYear - 1}-${paddedStartMonth}-${paddedStartDate}`
    validEndDate = `${fiscalYear}-${paddedEndMonth}-${paddedEndDate}`
  }
  else if (start < end) {
    validStartDate = `${fiscalYear}-${paddedStartMonth}-${paddedStartDate}`
    validEndDate = `${fiscalYear}-${paddedEndMonth}-${paddedEndDate}`
  }
  return {
    startDate : validStartDate,
    endDate : validEndDate
  }
}