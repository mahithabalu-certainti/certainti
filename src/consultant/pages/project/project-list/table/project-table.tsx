/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { Project, ProjectList, ProjectListParams } from "../../../../types/project";
import { Table } from "../../../../../components/table";
import { getProjectColumns } from "./columns";
import { useAllProjects } from "../../../../services/project";
import { RootState } from "../../../../../store/store";
import { useSelector } from "react-redux";
import { generatePath, useNavigate } from "react-router-dom";
import { PROJECT, PROJECT_DETAILS } from "../../../../../routes";

interface IProjectTableProps {
  appliedFilters: Record<string, any>;
  tableParams: ProjectListParams;
  setTableParams: React.Dispatch<React.SetStateAction<ProjectListParams>>;
  setTotalCount: React.Dispatch<React.SetStateAction<number>>;
}

export const ProjectTable: React.FC<IProjectTableProps> = ({
  appliedFilters,
  tableParams,
  setTableParams,
  setTotalCount,
}) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const navigate = useNavigate();
  const { fiscalYear } = useSelector<
    RootState,
    { filters: unknown; fiscalYear: string }
  >((state: RootState) => state.account);

  const convertedFiscalYear = fiscalYear !== 'FY-All' ? Number(fiscalYear) : 0;

  useEffect(() => {
    setTableParams((prev) => ({
      ...prev,
      page: 1,
      filters: appliedFilters,
      fiscalYear: convertedFiscalYear,
    }));
  }, [appliedFilters, fiscalYear]);

  const { data, isLoading, isError } = useAllProjects(tableParams);
  const totalItems = data?.count || 0;

  const convertProjectListData = (data: ProjectList[]): Project[] => {
    if (!data) return [];

    return data.map((item) => ({
      id: item.id,
      accountNumber: item.account_number,
      accountName: item.account_name,
      projectNumber: item.r_number,
      projectRefId: item.project_ref_id,
      industry: item.industry,
      projectStartDate: item.project_startdate,
      projectEndDate: item.project_enddate,
      projectType: item.project_type,
      projectClassification: item.project_classification,
      projectClientGroup: item.project_client_group,
      projectGroup: item.project_group,
      status: item.project_status,
    }));
  };

  useEffect(() => {
    if (data) {
      setProjects(convertProjectListData(data?.projects || []));
      setTotalCount(data?.count || 0);
    }
  }, [data]);

  const getRowId = (row: Project) => row.id;

  const handleEdit = (project: Project) => {
    navigate(PROJECT + '/edit/' + project.id, {
      state: { project },
    });
  };

  const handleDelete = (project: Project) => {
    console.log("Delete project:", project.id);
  };

  const handleSort = (sortBy: string, sortOrder: "ASC" | "DESC") => {
    setTableParams((prev) => ({
      ...prev,
      sortBy,
      sortOrder,
    }));
  };

  const handlePageChange = (newPage: number) => {
    setTableParams((prev) => ({
      ...prev,
      page: newPage + 1,
    }));
  };

  const handleRowsPerPageChange = (newLimit: number) => {
    setTableParams((prev) => ({
      ...prev,
      limit: newLimit,
      page: 1,
    }));
  };

  const handleProject = (project: Project) => {
    const path = generatePath(PROJECT_DETAILS, {
      projectid: project.id,
    });
    navigate(path, {
      state: { accountId: project.accountNumber },
    });
  };

  const projectColumns = getProjectColumns(handleProject);

  return (
    <Table
      data={projects}
      columns={projectColumns}
      getRowId={getRowId}
      actionRenderFlag="dropdown-menu"
      disableTextHover={true}
      headerHeight={50}
      rowHeight={42}
      // Selection
      selectable={true}
      onSelectionChange={(selectedIds) => console.log("Selected:", selectedIds)}
      // Actions
      onEdit={handleEdit}
      onDelete={handleDelete}
      // State
      loading={isLoading}
      error={isError ? "Failed to load projects" : undefined}
      // Pagination
      rowsPerPage={tableParams.limit}
      currentPage={(tableParams.page ?? 1) - 1}
      totalItems={totalItems}
      onPageChange={handlePageChange}
      onRowsPerPageChange={handleRowsPerPageChange}
      // Sorting
      sortBy={tableParams.sortBy}
      sortOrder={tableParams.sortOrder}
      onSort={handleSort}
    />
  );
};
