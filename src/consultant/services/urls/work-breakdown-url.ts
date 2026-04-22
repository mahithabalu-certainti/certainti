export const getWorkBreakdownURL = (
  accountID: string,
  caseID: string
): string => {
  return `/api/cases/workBreakdown/${accountID}/${caseID}`;
};

export const getTaskDetailURL = (): string => {
  return `/api/cases/task/details`;
};
