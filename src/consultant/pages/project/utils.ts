export const transformProjectData = (data: any): any[] => {
  const project = data?.project;

  return [
    {
      items: [
        { label: 'Project ID', value: project?.rid },
        { label: 'Country', value: project?.country_name },
      ],
    },
    {
      items: [
        {
          label: 'Project Number',
          value: project?.r_number || '-',
        },
        { label: 'Currency', value: project?.currency_name },
      ],
    },
    {
      items: [
        {
          label: 'Project Code',
          value: project?.project_code || '-',
        },
        { label: 'Industry', value: project?.industry_rid_name || 'NA' },
      ],
    },
    {
      items: [
        { label: 'Account ID', value: project?.account_rid },
        { label: 'Program Name', value: project?.program_name },
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
