export const formatNumberWithCommas = (num: number | string): string => {
  if (num !== null && num !== undefined && num !== '') {
    const parsed = typeof num === 'string' ? parseFloat(num) : num;
    if (!isNaN(parsed)) {
      return parsed.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    }
  }
  return '-';
};
