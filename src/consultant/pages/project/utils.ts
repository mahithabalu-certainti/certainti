interface DisplayColumn {
  items: Array<{
    label: string;
    value: string;
  }>;
}
export const transformProjectData = (data: any): DisplayColumn[] => {
  const project = data?.project;

  return [
    {
      items: [
        {
          label: 'Project Number',
          value: project?.r_number || '-',
        },
        { label: 'Country', value: project?.country_name || '-' },
      ],
    },
    {
      items: [
        {
          label: 'Project Code',
          value: project?.project_code || '-',
        },
        { label: 'Currency', value: project?.currency_name || '-' },
      ],
    },
    {
      items: [
        {
          label: 'Program Name',
          value: project?.program_name || '-',
        },
        { label: 'Industry', value: project?.industry_rid_name || '-' },
      ],
    },
    {
      items: [
        { label: 'Account Name', value: project?.account_name },
        {
          label: 'Status',
          value:
            project?.project_status.charAt(0).toUpperCase() +
            project?.project_status.slice(1),
        },
      ],
    },
  ];
};
