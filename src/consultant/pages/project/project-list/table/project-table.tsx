/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect } from 'react';
import {
  // ProjectList,
  ProjectListParams,
} from '../../../../types/project';
import { getAllProjectListColumns } from './columns';
import { useAllProjects } from '../../../../services/project';
import { RootState } from '../../../../../store/store';
import { useSelector } from 'react-redux';
import { generatePath, useNavigate } from 'react-router-dom';
import { PROJECT_DETAILS } from '../../../../../routes';
import { ActionItem, Project } from '../../../../../components/table/types';
import { EditIcon } from '../../../../../assets';
import { reshapeGlobalFilter } from '../../../../../common-utils';
import { FilterState } from '../../../../types';
import { AccordionTable } from '../../../../../components/table';

interface IProjectTableProps {
  appliedFilters: Record<string, any>;
  tableParams: ProjectListParams;
  isProjectEditEnable?: boolean;
  isProjectDeleteEnable?: boolean;
  setTableParams: React.Dispatch<React.SetStateAction<ProjectListParams>>;
  setTotalCount: React.Dispatch<React.SetStateAction<number>>;
  refreshProjectsTrigger?: number;
  toggleEnabled?: boolean;
}

export const ProjectTable: React.FC<IProjectTableProps> = ({
  appliedFilters,
  tableParams,
  isProjectEditEnable,
  // isProjectDeleteEnable,
  setTableParams,
  setTotalCount,
  refreshProjectsTrigger,
  toggleEnabled,
}) => {
  const navigate = useNavigate();
  const { fiscalYear, filters } = useSelector<
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
      globalFilters: reshapeGlobalFilter(filters as FilterState),
    }));
  }, [appliedFilters, fiscalYear, filters]);

  const { data, isLoading, isError } = useAllProjects(
    { ...tableParams, bothParentAndChild: toggleEnabled },
    undefined,
    refreshProjectsTrigger
  );
  const totalItems = data?.count || 0;

  // Update total count when data changes
  useEffect(() => {
    if (data) {
      setTotalCount(data?.count || 0);
    }
  }, [data]);

  const getRowId = (row: Project) => row.project_rid;

  const handleEdit = (account: any) => {
    navigate(`/project/edit/${account?.project_fiscal_rid}`, {
      state: {
        accountID: account?.account_rid,
        projectID: account?.project_fiscal_rid,
        breadcrumbs: [{ label: 'Project' }, { label: account?.project_code }],
      },
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

  const handleAccountName = (project: Project) => {
    const path = generatePath(PROJECT_DETAILS, {
      projectid: project?.project_fiscal_rid ?? null,
    });
    navigate(path, {
      state: {
        accountID: project?.account_rid,
        projectID: project?.project_fiscal_rid,
      },
    });
  };

  const projectColumns = getAllProjectListColumns(handleAccountName);

  const actionButtons: ActionItem<any>[] = [
    {
      label: 'Edit',
      onClick: (row: any) => handleEdit(row),
      icon: EditIcon,
      iconStyle: {
        filter:
          'brightness(0) saturate(100%) invert(25%) sepia(16%) saturate(592%) hue-rotate(164deg) brightness(93%) contrast(91%)',
      },
      hide: !isProjectEditEnable,
    },
    // Delete functionality will be implemented later
    // {
    //   label: 'Delete',
    //   onClick: (row: any) => console.log('Delete row', row),
    //   icon: deleteIcon,
    //   hide: !isProjectDeleteEnable,
    // },
  ];

  return (
    <AccordionTable
      data={data?.projects as Project[]}
      columns={projectColumns}
      getRowId={getRowId}
      hoverHighlight={false}
      tableStyle={{ overflowY: 'hidden' }}
      stickyHeader={true}
      stickyColumnsCount={2}
      selectable={true}
      onSelectionChange={(selectedIds) => console.log('Selected:', selectedIds)}
      actionWidth={60}
      actionDisplayMode='dropdown'
      actionMenuItems={actionButtons}
      loading={isLoading}
      error={isError ? 'Failed to load projects' : undefined}
      rowsPerPageOptions={[25, 50, 100]}
      rowsPerPage={tableParams.limit}
      currentPage={(tableParams.page ?? 1) - 1}
      totalItems={totalItems}
      onPageChange={handlePageChange}
      onRowsPerPageChange={handleRowsPerPageChange}
      sortBy={tableParams.sortBy}
      sortOrder={tableParams.sortOrder}
      onSort={handleSort}
      component='global-project'
    />
  );
};
