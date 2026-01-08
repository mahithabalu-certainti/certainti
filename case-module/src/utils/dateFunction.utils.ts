export const formValidDate = (startMonth: string, endMonth : string, fiscalYear : number, startDate : string, endDate : string) => {
  let validStartDate : string = ``
  let validEndDate : string = ``
  let start = parseInt(startMonth);
  let end = parseInt(endMonth)
  if(start === end || start > end) {
    validStartDate = `${fiscalYear - 1}-${startMonth}-${startDate}`
    validEndDate = `${fiscalYear}-${endMonth}-${endDate}`
  }
  else if (start < end) {
    validStartDate = `${fiscalYear}-${startMonth}-${startDate}`
    validEndDate = `${fiscalYear}-${endMonth}-${endDate}`
  }
  return {
    startDate : validStartDate,
    endDate : validEndDate
  }
}