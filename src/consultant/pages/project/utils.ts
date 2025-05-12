export const transformProjectData = (data: any): any[] => {
    const project = data?.accountById;
  
    return [
      {
        items: [
          { label: "Project ID", value: project?.r_number },
          { label: "Country", value: project?.country?.country_name },
        ],
      },
      {
        items: [
          {
            label: "Project Number",
            value: project?.project_number || "-",
          },
          { label: "Currency", value: project?.currency.currency_code },
        ],
      },
      {
        items: [
          {
            label: "Project Ref ID",
            value: project?.project_ref_id || "-",
          },
          { label: "Industry", value: project?.industry },
        ],
      },
      {
        items: [
          { label: "Account ID", value: project?.account_id },
          { label: "Program Name", value: project?.program_name },
        ],
      },
      {
        items: [
          { label: "Account Name", value: project?.account_name },
          {
            label: "Status",
            value:
              project?.status.charAt(0).toUpperCase() + project?.status.slice(1),
          },
        ],
      },
    ];
  };
  