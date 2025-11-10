export const getWorkBreakdownURL = (
  accountID: string,
  caseID: string
): string => {
  return `/api/cases/workBreakdown/${accountID}/${caseID}`;
};
