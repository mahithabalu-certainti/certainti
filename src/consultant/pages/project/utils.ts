/* eslint-disable @typescript-eslint/no-explicit-any */
interface DisplayColumn {
  items: Array<{
    label: string;
    value: string;
    className?: string;
  }>;
}
export const transformProjectData = (data: any): DisplayColumn[] => {
  const project = data?.project;
  const status = project?.status_name.toLowerCase();
  return [
    {
      items: [
        {
          label: 'Project ID',
          value: project?.r_number || '-',
          className: `${status === 'active' ? 'text-[#199806]' : 'text-[#f44336]'}`,
        },
        // {
        //   label: 'Project Code',
        //   value: project?.project_code || '-',
        // },
      ],
    },
    {
      items: [
        // {
        //   label: 'Project ID',
        //   value: project?.r_number || '-',
        //   className: `${status === 'active' ? 'text-[#199806]' : 'text-[#f44336]'}`,
        // },
        {
          label: 'Project Code',
          value: project?.project_code || '-',
        },
      ],
    },

    {
      items: [
        // {
        //   label: 'Name',
        //   value: project?.project_name || '-',
        // },
        { label: 'Account Name', value: project?.account_name },
      ],
    },
    {
      items: [
        {
          label: 'Country / Currency',
          value: `${project?.country_code || '-'} / ${project?.currency_name || '-'}`,
        },
      ],
    },

    {
      items: [
        {
          label: 'Industry',
          value: project?.industry_name || project?.industry_rid_name || '-',
        },
        // {
        //   label: 'Status',
        //   value:
        //     project?.project_status.charAt(0).toUpperCase() +
        //     project?.project_status.slice(1),
        // },
      ],
    },
  ];
};
