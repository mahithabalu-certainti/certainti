/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect } from 'react';
import { ProjectList, ProjectListParams } from '../../../../types/project';
import { ListTable } from '../../../../../components/table';
import { getAllProjectListColumns } from './columns';
import { useAllProjects } from '../../../../services/project';
import { RootState } from '../../../../../store/store';
import { useSelector } from 'react-redux';
import { generatePath, useNavigate } from 'react-router-dom';
import { PROJECT, PROJECT_DETAILS } from '../../../../../routes';
import { ActionItem } from '../../../../../components/table/types';
import { deleteIcon, editIcon } from '../../../../../assets';

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

  const getRowId = (row: ProjectList) => row.rid;

  const handleEdit = (project: ProjectList) => {
    navigate(PROJECT + '/edit/' + project.rid, {
      state: { project },
    });
  };

  const handleSort = (sortBy: string, sortOrder: 'asc' | 'desc') => {
    const apiOrder = sortOrder === 'asc' ? 'ASC' : 'DESC';
    setTableParams((prev) => ({
      ...prev,
      sortBy,
      sortOrder: apiOrder,
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

  const handleProject = (project: ProjectList) => {
    const path = generatePath(PROJECT_DETAILS, {
      projectid: project?.rid,
    });
    navigate(path, {
      state: { accountID: project?.account_rid, projectID: project?.rid },
    });
  };

  const projectColumns = getAllProjectListColumns(handleProject);

  const actionButtons: ActionItem<any>[] = [
    {
      label: 'Edit',
      onClick: (row: any) => handleEdit(row),
      icon: editIcon,
      iconStyle: {
        filter:
          'brightness(0) saturate(100%) invert(25%) sepia(16%) saturate(592%) hue-rotate(164deg) brightness(93%) contrast(91%)',
      },
    },
    {
      label: 'Delete',
      onClick: (row: any) => console.log('Delete row', row),
      icon: deleteIcon,
    },
  ];

  return (
    <ListTable
      data={data?.projects as any}
      columns={projectColumns}
      getRowId={getRowId}
      hoverHighlight={false}
      stickyHeader={true}
      stickyColumnsCount={2}
      selectable={true}
      onSelectionChange={(selectedIds) => console.log('Selected:', selectedIds)}
      actionWidth={100}
      actionDisplayMode='dropdown'
      actionMenuItems={actionButtons}
      loading={isLoading}
      error={isError ? 'Failed to load projects' : undefined}
      rowsPerPage={tableParams.limit}
      currentPage={tableParams.page}
      totalItems={totalItems}
      onPageChange={handlePageChange}
      onRowsPerPageChange={handleRowsPerPageChange}
      sortBy={tableParams.sortBy}
      sortOrder={tableParams.sortOrder}
      onSort={handleSort}
    />
  );
};
