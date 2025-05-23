/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect } from 'react';
import { Project, ProjectListParams } from '../../../../types/project';
import { Table } from '../../../../../components/table';
import { getProjectColumns } from './columns';
import { useAllProjects } from '../../../../services/project';
import { RootState } from '../../../../../store/store';
import { useSelector } from 'react-redux';
import { generatePath, useNavigate } from 'react-router-dom';
import { PROJECT, PROJECT_DETAILS } from '../../../../../routes';

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

  useEffect(() => {
    if (data) {
      setTotalCount(data?.count || 0);
    }
  }, [data]);

  const getRowId = (row: Project) => row.id;

  const handleEdit = (project: Project) => {
    navigate(PROJECT + '/edit/' + project.id, {
      state: { project },
    });
  };

  const handleSort = (sortBy: string, sortOrder: 'ASC' | 'DESC') => {
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
      data={data?.projects || ([] as any)}
      columns={projectColumns}
      getRowId={getRowId}
      // Selection
      selectable={true}
      onSelectionChange={(selectedIds) => console.log('Selected:', selectedIds)}
      // Actions
      onEdit={handleEdit}
      // State
      loading={isLoading}
      error={isError ? 'Failed to load projects' : undefined}
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
