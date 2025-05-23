export const transformProjectData = (data: any): any[] => {
  const project = data?.project;

  return [
    {
      items: [
        {
          label: 'Project Number',
          value: project?.r_number || 'NA',
        },
        { label: 'Country', value: project?.country_name || 'NA' },
      ],
    },
    {
      items: [
        {
          label: 'Project Code',
          value: project?.project_code || 'NA',
        },
        { label: 'Currency', value: project?.currency_name || 'NA' },
      ],
    },
    {
      items: [
        {
          label: 'Program Name',
          value: project?.program_name,
        },
        { label: 'Industry', value: project?.industry_rid_name || 'NA' },
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
