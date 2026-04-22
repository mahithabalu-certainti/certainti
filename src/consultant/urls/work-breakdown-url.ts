export const getWorkBreakdownURL = (
  accountId: string,
  caseId: string
): string => {
  return `workBreakdown/${accountId}/${caseId}`;
};
