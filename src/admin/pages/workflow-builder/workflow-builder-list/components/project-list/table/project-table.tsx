import { useEffect, useMemo, useState } from 'react';
import {
  Project,
  ProjectListParams,
} from '../../../../../../../consultant/types/project';
import { useSelector } from 'react-redux';
import { RootState } from '../../../../../../../store/store';
import { AllPermissions } from '../../../../../../../common-service';
import { getAllProjectListColumns } from './columns';
import { ListTable } from '../../../../../../../components/table';
import { useAllProjects } from '../../../../../../../consultant/services/project';

interface IProjectTableProps {
  appliedFilters: Record<string, string | number | boolean>;
  tableParams: ProjectListParams;
  isProjectEditEnable?: boolean;
  isProjectDeleteEnable?: boolean;
  setTableParams: React.Dispatch<React.SetStateAction<ProjectListParams>>;
  setTotalCount: React.Dispatch<React.SetStateAction<number>>;
  refreshProjectsTrigger?: number;
  searchValue: string;
  onSelectionChange?: (selectedIds: string[]) => void;
  initialSelectedIds?: string[];
}

export const ProjectTable: React.FC<IProjectTableProps> = ({
  appliedFilters,
  tableParams,
  setTableParams,
  setTotalCount,
  refreshProjectsTrigger,
  searchValue,
  onSelectionChange,
  initialSelectedIds,
}) => {
  const { fiscalYear, filters } = useSelector<
    RootState,
    { filters: unknown; fiscalYear: string }
  >((state: RootState) => state.account);
  const [allProjectList, setAllProjectList] = useState<Project[]>([]);

  const convertedFiscalYear = fiscalYear !== 'FY-All' ? Number(fiscalYear) : 0;

  //permissions
  const { permission } = useSelector((state: RootState) => state.permission);
  const projectViewEditFields = useMemo(
    () =>
      permission.find((item) => item.name === AllPermissions.PROJECTS_VIEW_EDIT)
        ?.fields ?? [],
    [permission]
  );
  const permissionMap = useMemo(() => {
    const map: Record<string, { read: boolean; edit: boolean }> = {};
    projectViewEditFields.forEach((item) => {
      map[item.name] = { read: item.read ?? false, edit: item.edit ?? false };
    });
    return map;
  }, [projectViewEditFields]);

  const accountViewEditFields = useMemo(
    () =>
      permission.find((item) => item.name === AllPermissions.ACCOUNTS_VIEW_EDIT)
        ?.fields ?? [],
    [permission]
  );
  const accountPermissionMap = useMemo(() => {
    const map: Record<string, { read: boolean; edit: boolean }> = {};
    accountViewEditFields.forEach((item) => {
      map[item.name] = { read: item.read ?? false, edit: item.edit ?? false };
    });
    return map;
  }, [accountViewEditFields]);

  useEffect(() => {
    setTableParams((prev) => {
      const newParams: Partial<ProjectListParams> = {
        ...prev,
        page: 1,
        filters: appliedFilters,
        fiscalYear: convertedFiscalYear,
      };

      if (searchValue) {
        newParams.search = searchValue;
      } else {
        delete newParams.search;
      }

      return newParams as ProjectListParams;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appliedFilters, fiscalYear, filters, searchValue]);

  const { data, isPending, isError, mutate } = useAllProjects();
  const totalItems = data?.count || 0;

  useEffect(() => {
    if (refreshProjectsTrigger) {
      mutate(
        {
          ...tableParams,
          bothParentAndChild: false,
        },
        {
          onSuccess: (data) => {
            setTotalCount(data?.count || 0);
            setAllProjectList(
              data.projects.map((project) => ({
                ...project,
                ProjectFiscal:
                  project.ProjectFiscal?.map((fiscal) => ({
                    ...fiscal,
                    account_status_name: project.account_status_name,
                  })) || [],
              }))
            );
          },
        }
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshProjectsTrigger]);

  const handleselectedList = (ids: string[]) => {
    // Filter to get only child IDs (project_fiscal_rid)
    // Child IDs are from ProjectFiscal array, parent IDs are project_rid
    const childIds = ids.filter((id) => {
      // Check if this ID exists in any ProjectFiscal array
      return allProjectList.some((project) =>
        project.ProjectFiscal?.some(
          (fiscal) => fiscal.project_fiscal_rid === id
        )
      );
    });

    onSelectionChange?.(childIds);
  };

  const getRowId = (row: Project) => {
    if (row._level === 1 && 'project_fiscal_rid' in row) {
      return row.project_fiscal_rid || '';
    }
    return row.project_rid || '';
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

  const projectColumns = getAllProjectListColumns(
    permissionMap,
    accountPermissionMap
  );

  return (
    <div>
      <ListTable
        data={allProjectList as Project[]}
        columns={projectColumns}
        getRowId={getRowId}
        hoverHighlight={false}
        tableStyle={{
          height: '100%',
          maxHeight: 'calc(100vh - 400px)',
          overflow: 'auto',
        }}
        stickyHeader={true}
        stickyColumnsCount={2}
        selectable={true}
        expandAllParent={true}
        expandable={true}
        childrenKey='ProjectFiscal'
        maxNestingLevel={2}
        editDisableLevel={[0]}
        onSelectionChange={(selectedIds) => {
          handleselectedList(selectedIds);
        }}
        initialSelectedIds={initialSelectedIds}
        actionWidth={60}
        actionDisplayMode='dropdown'
        actionMenuItems={[]}
        loading={isPending}
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
    </div>
  );
};
