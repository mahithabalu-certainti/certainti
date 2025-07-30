import { useEffect, useMemo, useState } from 'react';
import TabPanel from '../../../account-details-sidebar/components/tab';
import { CreateResourceIcon, ResourceProfileIcon } from '../../../../../assets';
import { useSelector } from 'react-redux';
import { RootState } from '../../../../../store/store';
import {
  useProjectResourceDetail,
  useProjectResources,
} from '../../../../services/project-resources/project-resource-service';
import {
  PROJECT_RESOURCE_CREATE,
  PROJECT_RESOURCE_EDIT,
} from '../../../../../routes';
import { getProjectResourcesColumns } from './list/columns';
import { ProjectResourcesListType } from '../../../../types/project-resources';
import { useNavigate, useSearchParams } from 'react-router-dom';
import ProjectResourceTableHeader from './project-resource-list-header';
import ProjectResourceDetails from './details/project-resource-detail';
import { ResourceTabs } from '../../../account-details-sidebar/sidebar-pages/resources/resources';
import {
  AllModules,
  AllPermissions,
  useGetAllCountries,
} from '../../../../../common-service';
import { ListTable } from '../../../../../components/table';
import { FiscalYearType } from '../../../../types/project';
import { checkPermission } from '../../../../../common-utils';
import { AccessRestricted } from '../../../../../components/account-restricted';
import { resourceClient } from '../../../../../api/graphql/clients/client';
import { useMutation } from '@apollo/client';
import { UPDATE_PROJECT_RESOURCE } from '../../../../../api/graphql/queries/project-query';
import {
  CellEditData,
  FieldChangeEvent,
  FieldChangeValue,
} from '../../../../../components/table/types';
import { useToast } from '../../../../../hooks';
import { useGetProjectResourceCode } from '../../../../services/project-resources/project-resources-form-service';
import { ExportType, SelectOption } from '../../../../types';
// import { useGetResourceType } from '../../../../services/resource-list';
import { useFetchState } from '../../../../services/account';
import { AttachmentsListExportParams } from '../../../../types/attachment';

const BUTTON_STYLES = {
  height: '24px !important',
  fontSize: '13px',
  fontWeight: 600,
};

const projectTabs: ResourceTabs[] = [
  {
    id: AllPermissions.ACCOUNT_PROJECTS_OVERVIEW,
    name: 'Overview',
    hide: false,
  },
  {
    id: AllPermissions.ACCOUNT_PROJECTS_TIMELINE,
    name: 'Timeline',
    hide: false,
    disable: true,
  },
];

export const ProjectResources = ({
  projectID,
  accountID,
  projectFiscalYear,
  setExportType,
  setAttachmentParams,
}: {
  projectID?: string;
  accountID?: string;
  projectFiscalYear?: FiscalYearType;
  setExportType?: (type: ExportType) => void;
  setAttachmentParams: React.Dispatch<
    React.SetStateAction<AttachmentsListExportParams>
  >;
}) => {
  const { errorToast } = useToast();
  const [showFilter, setShowFilter] = useState<boolean>(false);
  const [
    projectsTabs,
    // setProjectsTabs
  ] = useState(projectTabs);
  const [sortFilterCount, setSortFilterCount] = useState<number>(0);
  const [appliedFilters, setAppliedFilters] = useState<
    Record<string, string | number | boolean>
  >({});
  const [currentPage, setCurrentPage] = useState(0);
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('DESC');
  const [sortField, setSortField] = useState<string>('resource_code');
  const [rowsPerPage, setRowsPerPage] = useState(100);
  const [projectResData, setProjectResData] =
    useState<ProjectResourcesListType | null>(null);
  const [showProjectResourceDetails, setShowProjectResourceDetails] =
    useState<boolean>(false);
  const [currentCountry, setCurrentCountry] = useState<string>('');

  const [searchParams] = useSearchParams();
  const { fiscalYear } = useSelector<RootState, { fiscalYear: string }>(
    (state: RootState) => state.account
  );
  const [projectResourceList, setProjectResourceList] = useState<
    ProjectResourcesListType[]
  >([]);
  const [updateProjectResourceMutation] = useMutation(UPDATE_PROJECT_RESOURCE, {
    client: resourceClient,
  });

  const convertedFiscalYear = fiscalYear !== 'FY-All' ? Number(fiscalYear) : 0;

  const navigate = useNavigate();
  // const [searchParams] = useSearchParams();
  const fileId = searchParams.get('page');

  const viewDetails = fileId === 'details';

  const [refreshProjectsTrigger, setRefreshProjectsTrigger] = useState<number>(
    Date.now()
  );
  const { data, isLoading, error } = useProjectResources(
    {
      page: currentPage + 1,
      limit: rowsPerPage,
      sortBy: sortField,
      sortOrder: sortOrder,
      filters: appliedFilters,
      fiscalYear: convertedFiscalYear,
      accountNumber: accountID,
      projectid: projectID,
    },
    undefined,
    refreshProjectsTrigger
  );
  // const detailsResourceId = searchParams.get('pro_res_id');
  // Permission Mangement
  const { modules, permission } = useSelector(
    (state: RootState) => state.permission
  );
  const projectIsEnable = checkPermission(
    modules,
    AllModules.PROJECT_RESOURCES
  );

  const projectViewEditFields = useMemo(
    () =>
      permission.find(
        (item) => item.name === AllPermissions.PROJECTS_RESOURCES_VIEW_EDIT
      )?.fields ?? [],
    [permission]
  );
  const permissionMap = useMemo(() => {
    const map: Record<string, { read: boolean; edit: boolean }> = {};
    projectViewEditFields.forEach((item) => {
      map[item.name] = { read: item.read ?? false, edit: item.edit ?? false };
    });
    return map;
  }, [projectViewEditFields]);

  const {
    data: resourceDetails,
    isLoading: isDetailsLoading,
    error: detailsError,
  } = useProjectResourceDetail(
    projectResData?.account_rid as string,
    projectResData?.rid as string
  );
  // const resourceData = resourceDetails?.data?.projectResource;
  const resourceData = useMemo(() => {
    return resourceDetails?.data?.projectResource;
  }, [resourceDetails]);

  const totalItems = data?.count || 0;

  useEffect(() => {
    if (data) {
      setProjectResourceList(data?.projectResources || []);
    }
  }, [data]);
  useEffect(() => {
    if (setExportType) {
      setExportType('project_resource');
    }
    setAttachmentParams({
      sortBy: sortField,
      sortOrder: sortOrder,
      filters: appliedFilters,
    });
  }, [sortField, sortOrder, appliedFilters]);
  const { data: projectResourceCodeOptions } = useGetProjectResourceCode(
    accountID as string
  );
  // const projectResourceTypeOptions = useGetResourceType();
  const countriesList = useGetAllCountries();
  const region = useFetchState(currentCountry);
  const memoizedProjectResourceCode: SelectOption[] = useMemo(
    () =>
      projectResourceCodeOptions?.data?.resourceCodes.map((item) => ({
        label: item.resource_code,
        value: item.resource_code,
      })) || [],
    [projectResourceCodeOptions?.data?.resourceCodes]
  );
  const countryOptions: SelectOption[] = useMemo(() => {
    return (
      countriesList.data?.data.country.map((item) => ({
        label: item.country_name,
        value: item.rid,
      })) || []
    );
  }, [countriesList]);

  const memoizedState: SelectOption[] = useMemo(
    () =>
      region.data?.data.states.map((state) => ({
        label: state.state_name,
        value: state.rid,
      })) || [],
    [region.data?.data.states]
  );
  const handleFieldChange = async (event: FieldChangeEvent) => {
    if (event.columnId === 'country_name' && event.value) {
      setCurrentCountry(String(event.value));
    }
  };
  const handleCountry = (country: string) => {
    setCurrentCountry(country);
  };

  const handleProjectResourceDetailEdit = () => {
    if (resourceData) {
      const path = PROJECT_RESOURCE_EDIT.replace(
        ':resourceId',
        resourceData.rid
      );
      const queryParams = new URLSearchParams({
        account_Id: resourceData.account_rid,
        project_Id: resourceData.project_rid,
      });
      navigate(`${path}?${queryParams.toString()}`);
    }
  };
  const handleEditProjectResource = (row: ProjectResourcesListType) => {
    const path = row?.rid
      ? PROJECT_RESOURCE_EDIT.replace(':resourceId', row.rid)
      : PROJECT_RESOURCE_EDIT;
    const PFY = projectFiscalYear;
    const queryParams = new URLSearchParams({
      account_Id: row?.account_rid || '',
      project_Id: row?.project_rid || '',
      PFY: PFY ? JSON.stringify(PFY) : '',
      source: 'editProjectResource',
    });
    navigate(`${path}?${queryParams.toString()}`);
  };

  const handleSorting = (sortBy: string, sortOrder: 'asc' | 'desc') => {
    const defaultSortField = 'resource_code';
    const defaultSortOrder = 'ASC';
    const apiOrder = sortOrder === 'asc' ? 'ASC' : 'DESC';

    if (!sortBy) {
      setSortFilterCount(0);
      setSortOrder(defaultSortOrder);
      setSortField(defaultSortField);
    } else {
      // setSortFilterCount(1);
      setSortOrder(apiOrder);
      setSortField(sortBy);
    }
  };

  useEffect(() => {
    // update sub tab when refereshing the page
    const page = searchParams.get('page');

    if (page) {
      setShowProjectResourceDetails(true);
    }
  }, [searchParams]);

  const actionMenuItems = [
    {
      label: 'Edit',
      onClick: (row: ProjectResourcesListType) =>
        handleEditProjectResource(row),
    },
  ];
  const isResourceCreateViewEnable = checkPermission(
    permission,
    AllPermissions.PROJECTS_RESOURCES_CREATE
  );

  const headerButtons = [
    {
      label: viewDetails ? 'Edit' : 'New',
      variant: 'outlined' as const,
      onClick: () =>
        viewDetails
          ? handleProjectResourceDetailEdit()
          : handleCreateProjectResource(),
      sx: { ...BUTTON_STYLES, width: '48px', minWidth: '48px' },
      hide: viewDetails ? false : !isResourceCreateViewEnable,
    },
  ];
  const handleFilter = () => {
    setShowFilter(!showFilter);
  };

  const handleBackClick = () => {
    setShowProjectResourceDetails(!showProjectResourceDetails);
    setProjectResData(null);
    setShowFilter(false);
    // clear query params
    searchParams.delete('pro_res_id');
    searchParams.delete('page');
    navigate({
      pathname: location.pathname,
      search: searchParams.toString(),
    });
  };

  const PFY = projectFiscalYear;
  const currency_rid = searchParams.get('currency_rid');
  const handleCreateProjectResource = () => {
    const account_Id = accountID ?? ''; // fallback to empty string
    const project_Id = projectID ?? '';
    const queryParams = new URLSearchParams({
      account_Id,
      project_Id,
      PFY: JSON.stringify(PFY),
      source: 'createProjectResource',
      currency_rid: currency_rid ?? '',
    });
    navigate(`${PROJECT_RESOURCE_CREATE}?${queryParams.toString()}`);
  };

  const handleProjectResourceClick = (row: ProjectResourcesListType) => {
    searchParams.set('page', 'details');
    searchParams.set('pro_res_id', row?.rid ?? '');
    navigate({ search: searchParams.toString() });
    setProjectResData(row);
    setShowProjectResourceDetails(true);
    setShowFilter(false);
  };
  useEffect(() => {
    const resourceId = searchParams.get('pro_res_id');
    if (resourceId && !projectResData) {
      const found = projectResourceList.find((item) => item.rid === resourceId);
      if (found) {
        setProjectResData(found);
        setShowProjectResourceDetails(true);
        setShowFilter(false);
      }
    }
  }, [projectResourceList, searchParams, projectResData]);

  const projectResourcesColumns = getProjectResourcesColumns(
    handleProjectResourceClick,
    memoizedProjectResourceCode,
    // memoizedProjectTypes,
    countryOptions,
    memoizedState,
    handleCountry,
    region.isPending,
    permissionMap
  );
  const onRefreshClick = () => {
    setRefreshProjectsTrigger(Date.now());
  };

  const handleCellEdit = async (rowId: string, updates: CellEditData[]) => {
    const previousProject = [...projectResourceList];

    const selectedProject = projectResourceList.find(
      (pro) => pro.rid === rowId
    );
    // let hasResourceTye = false;
    let hasCountry = false;
    let hasRegion = false;

    const updateData = updates.reduce<Record<string, FieldChangeValue>>(
      (acc, item) => {
        acc[item.editId || item.columnId] = item.value;
        // if (item.columnId === 'resource_type_name') hasResourceTye = true;
        if (item.columnId === 'country_name') hasCountry = true;
        if (item.columnId === 'region_name') hasRegion = true;
        return acc;
      },
      {
        account_rid: selectedProject?.account_rid,
        project_rid: selectedProject?.project_rid,
        project_resource_rid: rowId,
      }
    );

    if (hasCountry && !hasRegion) {
      updateData['region_rid'] = '';
    }

    try {
      const res = await updateProjectResourceMutation({
        variables: { data: updateData },
      });

      const result = res.data?.updateProjectResource;

      if (result?.statusCode === 200 && result.data) {
        const updatedParentData = result.data;

        const newProjects = projectResourceList.map((project) => {
          if (project.rid === updatedParentData.rid) {
            return updatedParentData;
          }
          return project;
        });

        setProjectResourceList(newProjects);
      } else {
        errorToast(result?.statusMessage || 'Failed to update filed');
        setProjectResourceList(previousProject);
      }
    } catch (error) {
      errorToast((error as Error)?.message || 'Failed to update filed');
      setProjectResourceList(previousProject);
    }
  };

  if (!projectIsEnable) return <AccessRestricted />;

  return (
    <div className='w-full pt-2 pb-2 pl-2 pr-4 bg'>
      <TabPanel
        value={'project-resources'}
        appliedFilters={appliedFilters}
        setAppliedFilters={(data) => {
          setAppliedFilters(data);
          setShowFilter(false);
        }}
        showFilter={showFilter}
        filterVisibility={!viewDetails}
        handleFilter={handleFilter}
        setCurrentPage={setCurrentPage}
        resourceTab={projectsTabs}
        showRefresh={!viewDetails}
        onRefreshClick={onRefreshClick}
        handleSorting={handleSorting}
        sortFilterCount={sortFilterCount}
        setSortFilterCount={setSortFilterCount}
        keyProjectTask={'ProjectResources'}
        projectResourceAccountID={accountID}
      />
      <>
        <ProjectResourceTableHeader
          value={
            viewDetails ? 'project-resource-details' : 'projects-resources'
          }
          title={'Project Resource'}
          titleIcon={
            viewDetails ? <ResourceProfileIcon /> : <CreateResourceIcon />
          }
          count={totalItems}
          showBackArrow={viewDetails}
          headerButtons={headerButtons}
          projectResourceNumber={resourceData?.r_number}
          onBackClick={handleBackClick}
        />
        <div className='border border-[#CBD6E2]'>
          {showProjectResourceDetails ? (
            <ProjectResourceDetails
              resourceData={resourceDetails?.data?.projectResource || undefined}
              isDetailsLoading={isDetailsLoading}
              detailsError={detailsError}
              permission={permission}
            />
          ) : (
            <ListTable
              data={projectResourceList}
              columns={projectResourcesColumns}
              actionMenuItems={actionMenuItems}
              getRowId={(row: ProjectResourcesListType): string =>
                row.rid || ''
              }
              hoverHighlight={false}
              tableStyle={{
                height: '100%',
                maxHeight: 'calc(100vh - 290px)',
                overflow: 'auto',
              }}
              stickyHeader={true}
              stickyColumnsCount={1}
              actionWidth={60}
              actionDisplayMode='dropdown'
              loading={isLoading}
              error={error ? 'Failed to load projects' : undefined}
              rowsPerPageOptions={[25, 50, 100]}
              rowsPerPage={rowsPerPage}
              currentPage={currentPage ?? 1}
              totalItems={data?.count || 0}
              onPageChange={setCurrentPage}
              onRowsPerPageChange={setRowsPerPage}
              sortBy={sortField}
              sortOrder={sortOrder}
              onSort={handleSorting}
              selectable={false}
              onSelectionChange={(selectedIds: unknown) =>
                console.log('Selected:', selectedIds)
              }
              component='project resources'
              onCellEdit={handleCellEdit}
              onFieldChange={handleFieldChange}
            />
          )}
        </div>
      </>
    </div>
  );
};
