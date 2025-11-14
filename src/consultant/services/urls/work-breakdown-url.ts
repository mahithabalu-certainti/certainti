export const getWorkBreakdownURL = (
  accountID: string,
  caseID: string
): string => {
  return `/api/cases/workBreakdown/${accountID}/${caseID}`;
};

export const getTaskDetailURL = (
  accountID: string,
  caseID: string,
  taskID: string
): string => {
  console.log('get Task Details URL called....');
  return `/api/cases/workBreakdown/task/${accountID}/${caseID}/${taskID}`;
};
