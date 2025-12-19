import { useEffect, useMemo, useState } from 'react';
import {
  GetProjectTypeApiResponse,
  Project,
  ProjectFiscalSummary,
  // ProjectList,
  ProjectListParams,
} from '../../../../types/project';
import { getAllProjectListColumns } from './columns';
import { useAllProjects } from '../../../../services/project';
import { RootState } from '../../../../../store/store';
import { useSelector } from 'react-redux';
import { generatePath, useNavigate } from 'react-router-dom';
import { PROJECT_DETAILS } from '../../../../../routes';
import {
  ActionItem,
  CellEditData,
  FieldChangeValue,
  ListTableColumn,
  ShowHideTableColumn,
} from '../../../../../components/table/types';
import { EditIcon } from '../../../../../assets';
import {
  REGEX_PATTERNS,
  reshapeGlobalFilter,
} from '../../../../../common-utils';
import { ClassificationApiResponse, FilterState } from '../../../../types';
import {
  ListTable,
  ManageColumnsPopover,
} from '../../../../../components/table';
import { useMutation } from '@apollo/client';
import { UPDATE_PROJECT } from '../../../../../api/graphql/queries/project-query';
import { resourceClient } from '../../../../../api/graphql/clients/client';
import { useToast } from '../../../../../hooks';
import { AllPermissions } from '../../../../../common-service';

interface IProjectTableProps {
  appliedFilters: Record<string, string | number | boolean>;
  tableParams: ProjectListParams;
  isProjectEditEnable?: boolean;
  isProjectDeleteEnable?: boolean;
  setTableParams: React.Dispatch<React.SetStateAction<ProjectListParams>>;
  setTotalCount: React.Dispatch<React.SetStateAction<number>>;
  refreshProjectsTrigger?: number;
  toggleEnabled?: boolean;
  dropdownOptions: {
    classification: ClassificationApiResponse | undefined;
    projectType: GetProjectTypeApiResponse | undefined;
  };
  columnAnchorEl: HTMLButtonElement | null;
  setColumnAnchorEl: React.Dispatch<
    React.SetStateAction<HTMLButtonElement | null>
  >;
  searchValue: string;
}

export const ProjectTable: React.FC<IProjectTableProps> = ({
  appliedFilters,
  tableParams,
  isProjectEditEnable,
  // isProjectDeleteEnable,
  setTableParams,
  setTotalCount,
  refreshProjectsTrigger,
  // toggleEnabled, // Commented for it may use in future
  dropdownOptions,
  setColumnAnchorEl,
  columnAnchorEl,
  searchValue,
}) => {
  const navigate = useNavigate();
  const { errorToast } = useToast();
  const { fiscalYear, filters } = useSelector<
    RootState,
    { filters: unknown; fiscalYear: string }
  >((state: RootState) => state.account);
  const [allProjectList, setAllProjectList] = useState<Project[]>([]);

  const convertedFiscalYear = fiscalYear !== 'FY-All' ? Number(fiscalYear) : 0;
  const [updateProjectMutation] = useMutation(UPDATE_PROJECT, {
    client: resourceClient,
  });

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
        globalFilters: reshapeGlobalFilter(filters as FilterState),
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
  }, [refreshProjectsTrigger]);

  const getRowId = (row: Project) => {
    if (row._level === 1 && 'project_fiscal_rid' in row) {
      return row.project_fiscal_rid || '';
    }
    return row.project_rid || '';
  };

  const handleEdit = (
    account: Project,
    fieldValue?: string | null,
    section?: string
  ) => {
    const sendState = fieldValue || section;
    const accountID = account?.account_rid ?? '';
    const projectID = account?.project_fiscal_rid ?? '';
    const queryParams = new URLSearchParams({
      accountID,
      projectID,
      source: 'project',
      type: 'global',
    });

    navigate(
      `/project/edit/${projectID}?${queryParams.toString()}`,
      sendState
        ? {
            state: {
              field: fieldValue || '',
              section: fieldValue ? '' : section,
            },
          }
        : undefined
    );
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
      projectid: project?.project_fiscal_rid ?? '',
    });
    // Create query parameter
    const queryParams = new URLSearchParams({
      accountID: project?.account_rid ?? '',
      source: 'project',
      currency_rid: project?.currency_rid ?? '',
    });

    navigate(`${path}?${queryParams.toString()}`);
  };

  const memoizedClassification = useMemo(
    () =>
      dropdownOptions.classification?.data?.projectClassifications.map(
        (data) => ({
          label: data.classification_name,
          value: data.rid,
        })
      ) || [],
    [dropdownOptions.classification?.data?.projectClassifications]
  );

  const memoizedProjectTypes = useMemo(
    () =>
      dropdownOptions?.projectType?.data?.projectType.map((item) => ({
        label: item.project_type_name,
        value: item.rid,
      })) || [],
    [dropdownOptions?.projectType?.data?.projectType]
  );

  const projectColumns = useMemo(
    () =>
      getAllProjectListColumns(
        handleAccountName,
        memoizedProjectTypes,
        memoizedClassification,
        handleEdit,
        permissionMap,
        accountPermissionMap
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [memoizedProjectTypes, memoizedClassification]
  );

  const [visibleColumns, setVisibleColumns] = useState<
    ListTableColumn<Project>[]
  >(projectColumns.filter((col) => !col.hide));

  useEffect(() => {
    const updatedColumns = projectColumns.filter((col) => !col.hide);
    setVisibleColumns(updatedColumns);
  }, [memoizedProjectTypes, memoizedClassification, projectColumns]);

  const actionButtons: ActionItem<Project>[] = [
    {
      label: 'Edit',
      onClick: (row: Project) => handleEdit(row),
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
    //   onClick: (row: Project) => console.log('Delete row', row),
    //   icon: deleteIcon,
    //   hide: !isProjectDeleteEnable,
    // },
  ];

  const handleCellEdit = async (rowId: string, updates: CellEditData[]) => {
    // Save the old state to revert if needed
    const previousProject = [...allProjectList];

    // Find parent project
    const parentProject = allProjectList.find((project) =>
      project.ProjectFiscal?.some(
        (fiscal) => fiscal.project_fiscal_rid === rowId
      )
    );

    if (!parentProject) return;

    // Find the child fiscal
    const childFiscal = parentProject.ProjectFiscal.find(
      (fiscal) => fiscal.project_fiscal_rid === rowId
    );
    if (!childFiscal) return;

    const updateData = updates.reduce<Record<string, FieldChangeValue>>(
      (acc, item) => {
        acc[item.editId || item.columnId] = item.value;
        return acc;
      },
      {
        account_rid: parentProject.account_rid,
        project_rid: childFiscal.project_rid,
        project_fiscal_rid: childFiscal.project_fiscal_rid,
        global_fiscal_year: convertedFiscalYear || 0,
      }
    );

    const isClassificationUpdated = updates.some(
      (item) => item.columnId === 'classification_name'
    );
    const hasClassificationOther = updates.some(
      (item) => item.columnId === 'project_classification_other'
    );

    if (isClassificationUpdated && !hasClassificationOther) {
      updateData['project_classification_other'] = '';
    }

    // Calculate total_cost if any cost field is updated
    const isCostFieldUpdated = updates.some(
      (item) =>
        item.columnId === 'total_cost_fte' ||
        item.columnId === 'total_cost_subcon' ||
        item.columnId === 'total_cost_nonlabor'
    );

    if (isCostFieldUpdated) {
      // Get current values from childFiscal or updateData
      const fteCost =
        updateData['total_cost_fte'] ?? childFiscal.total_cost_fte ?? 0;
      const subconCost =
        updateData['total_cost_subcon'] ?? childFiscal.total_cost_subcon ?? 0;
      const nonLaborCost =
        updateData['total_cost_nonlabor'] ??
        childFiscal.total_cost_nonlabor ??
        0;

      // Convert to numbers and ensure they are valid
      const fteCostNum = parseFloat(fteCost as string) || 0;
      const subconCostNum = parseFloat(subconCost as string) || 0;
      const nonLaborCostNum = parseFloat(nonLaborCost as string) || 0;

      // Calculate total_cost
      const totalCost = fteCostNum + subconCostNum + nonLaborCostNum;

      // Validate total_cost
      const totalCostString = totalCost.toFixed(2);
      if (!REGEX_PATTERNS.EFFORTS_NUMBER.test(totalCostString)) {
        errorToast(
          'Invalid total cost calculated. Must be a positive number with up to 16 digits and 2 decimal places.'
        );
        return;
      }

      // Add total_cost to updateData
      updateData['total_cost'] = totalCostString;
    }

    try {
      const res = await updateProjectMutation({
        variables: { data: updateData },
      });

      const result = res.data?.updateSpecificProjectDetails;

      if (result?.statusCode === 200 && result.data) {
        const updatedParentData = result.data;

        const newProjects = allProjectList.map((project) => {
          if (project.project_rid === updatedParentData.project_rid) {
            return {
              ...project,
              ...updatedParentData,
              ProjectFiscal: project.ProjectFiscal.map((fiscal) => {
                const updatedFiscal = updatedParentData.ProjectFiscal?.find(
                  (data: ProjectFiscalSummary) =>
                    data.project_fiscal_rid === fiscal.project_fiscal_rid
                );
                return updatedFiscal ? { ...fiscal, ...updatedFiscal } : fiscal;
              }),
            };
          }
          return project;
        });

        setAllProjectList(newProjects);
      } else {
        errorToast(result?.statusMessage || 'Failed to update filed');
        setAllProjectList(previousProject);
      }
    } catch (error) {
      errorToast((error as Error)?.message || 'Failed to update filed');
      setAllProjectList(previousProject);
    }
  };

  const RestrictedColumns = [
    {
      id: 'project_code',
      canHide: false,
      canDrag: false,
    },
  ];

  const handleColumnsChange = (updatedColumns: ShowHideTableColumn[]) => {
    setVisibleColumns(
      updatedColumns.filter((col) => !col.hide) as ListTableColumn<Project>[]
    );
  };

  const handlePopoverClose = () => {
    setColumnAnchorEl(null);
  };

  const isModalOpen = Boolean(columnAnchorEl);
  const modalId = isModalOpen ? 'project-column-visibility-popover' : undefined;

  return (
    <div className='border-t border-[#CBD6E2] h-full'>
      <ManageColumnsPopover
        anchorEl={columnAnchorEl}
        open={isModalOpen}
        popoverId={modalId}
        onClose={handlePopoverClose}
        columns={projectColumns}
        onColumnsChange={handleColumnsChange}
        columnRestrictions={RestrictedColumns}
      />
      <ListTable
        data={allProjectList as Project[]}
        columns={visibleColumns}
        getRowId={getRowId}
        hoverHighlight={false}
        tableStyle={{
          height: '100%',
          maxHeight: 'calc(100vh - 180px)',
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
        onSelectionChange={(selectedIds) =>
          console.log('Selected:', selectedIds)
        }
        actionWidth={60}
        actionDisplayMode='dropdown'
        actionMenuItems={actionButtons}
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
        onCellEdit={handleCellEdit}
      />
    </div>
  );
};
