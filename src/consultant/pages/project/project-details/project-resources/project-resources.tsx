/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useMemo, useState } from 'react';
import TabPanel from '../../../account-details-sidebar/components/tab';
import { AcceptIcon, RejectIcon, ResourcesIcon } from '../../../../../assets';
import { useSelector } from 'react-redux';
import { RootState } from '../../../../../store/store';
import {
  useProjectResourceDetail,
  useProjectResources,
  useUpdateProjectResourceStatus,
} from '../../../../services/project-resources/project-resource-service';
import {
  CHECKLIST_CREATE,
  NOTES_CREATE,
  PROJECT_RESOURCE_CREATE,
  PROJECT_RESOURCE_EDIT,
} from '../../../../../routes';
import { getProjectResourcesColumns } from './list/columns';
import { ProjectResourcesListType } from '../../../../types/project-resources';
import { generatePath, useNavigate, useSearchParams } from 'react-router-dom';
import ProjectResourceTableHeader from './project-resource-list-header';
import ProjectResourceDetails from './details/project-resource-detail';
import {
  AllMenus,
  AllModules,
  AllPermissions,
  OverviewTabs,
  useGetAllCountries,
} from '../../../../../common-service';
import {
  ListTable,
  ManageColumnsPopover,
} from '../../../../../components/table';
import { checkPermission } from '../../../../../common-utils';
import { AccessRestricted } from '../../../../../components/account-restricted';
import { resourceClient } from '../../../../../api/graphql/clients/client';
import { useMutation } from '@apollo/client';
import { UPDATE_PROJECT_RESOURCE } from '../../../../../api/graphql/queries/project-query';
import {
  CellEditData,
  FieldChangeEvent,
  FieldChangeValue,
  ShowHideTableColumn,
} from '../../../../../components/table/types';
import { useToast } from '../../../../../hooks';
import { useGetProjectResourceCode } from '../../../../services/project-resources/project-resources-form-service';
import {
  ActivityDropdownItem,
  ColorCode,
  ExportType,
  FormFiscalDateType,
  SelectOption,
} from '../../../../types';
// import { useGetResourceType } from '../../../../services/resource-list';
import { useFetchState } from '../../../../services/account';
import { AttachmentsListExportParams } from '../../../../types/attachment';
import Uploads from '../../../../../components/Attachments/upload';
import Timeline from '../../../../../pages/timeline/timeline';

enum ActionEnum {
  ACCEPT = 'accept',
  REJECT = 'reject',
}

const BUTTON_STYLES = {
  height: '24px !important',
  fontSize: '13px',
};

const projectTabs: OverviewTabs[] = [
  {
    id: AllPermissions.ACCOUNT_PROJECTS_OVERVIEW,
    name: 'Overview',
    hide: false,
    key: 'overview',
  },
  {
    id: AllPermissions.ACCOUNT_PROJECTS_TIMELINE,
    name: 'Timeline',
    hide: false,
    // disable: true,
    key: 'timeline',
  },
];

export const ProjectResources = ({
  projectID,
  accountData,
  projectFiscalDate,
  setExportType,
  setAttachmentParams,
  projectCode,
  accountOrProjectInActive,
  projectFiscalYear,
  activityMenuItems,
  isProjectSignedOff,
}: {
  projectID?: string;
  accountData?: {
    accountID: string;
    accountName: string;
    accountNumber: string;
  };
  projectFiscalDate?: FormFiscalDateType;
  setExportType?: (type: ExportType) => void;
  setAttachmentParams: React.Dispatch<
    React.SetStateAction<AttachmentsListExportParams>
  >;
  projectCode?: string;
  accountOrProjectInActive?: boolean;
  projectFiscalYear?: number | string;
  activityMenuItems: ActivityDropdownItem[];
  isProjectSignedOff?: boolean;
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
  const [detailrefecth, setDetailRefetch] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('ASC');
  const [sortField, setSortField] = useState<string>('resource_code');
  const [rowsPerPage, setRowsPerPage] = useState(100);
  const [projectResData, setProjectResData] =
    useState<ProjectResourcesListType | null>(null);
  const [showProjectResourceDetails, setShowProjectResourceDetails] =
    useState<boolean>(false);
  const [currentCountry, setCurrentCountry] = useState<string>('');
  const [columnAnchorEl, setColumnAnchorEl] =
    React.useState<HTMLButtonElement | null>(null);
  // const [actionFlag, setActionFlag] = useState<null | ActionEnum>(null);
  const [loadingRows, setLoadingRows] = useState<
    Record<string, ActionEnum | null>
  >({});
  const isModalOpen = Boolean(columnAnchorEl);
  const handleColumnVisibility = (
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    setColumnAnchorEl(event.currentTarget);
  };

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
  const isTimeLineView = searchParams.get('timelineview') === 'true';
  const [searchText, setSearchText] = useState('');

  const convertedFiscalYear = fiscalYear !== 'FY-All' ? Number(fiscalYear) : 0;

  const navigate = useNavigate();
  const fileId = searchParams.get('page');
  const resID = searchParams.get('pro_res_id');
  const checkDetail = fileId === 'details' && resID;
  const viewDetails = !!checkDetail;
  const accountID =
    accountData?.accountID || searchParams.get('accountID') || '';
  const activeMenuPath = searchParams.get('activeMenu') || '';
  const originPath = searchParams.get('origin') || '';

  const [refreshProjectsTrigger, setRefreshProjectsTrigger] = useState<number>(
    Date.now()
  );
  const { data, isLoading, error, refetch } = useProjectResources(
    {
      page: currentPage + 1,
      limit: rowsPerPage,
      sortBy: sortField,
      sortOrder: sortOrder,
      filters: appliedFilters,
      fiscalYear: convertedFiscalYear,
      accountNumber: accountID,
      projectid: projectID,
      search: searchText,
    },
    undefined,
    refreshProjectsTrigger
  );
  // const detailsResourceId = searchParams.get('pro_res_id');
  // Permission Mangement
  const { modules, permission, menus } = useSelector(
    (state: RootState) => state.permission
  );
  const projectIsEnable = checkPermission(
    modules,
    AllModules.PROJECT_RESOURCES
  );
  const isProjectResourceFieldsEditable = useMemo(
    () =>
      permission
        .find(
          (item) => item.name === AllPermissions.PROJECTS_RESOURCES_VIEW_EDIT
        )
        ?.fields?.some((field) => field.edit),
    [permission]
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
    projectResData?.account_rid || accountID || '',
    projectResData?.rid || resID || '',
    detailrefecth as number
    // searchText as string
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
      search: searchText,
    });
  }, [sortField, sortOrder, appliedFilters, searchText]);
  const { data: projectResourceCodeOptions } = useGetProjectResourceCode(
    accountID as string,
    projectID as string
  );
  const { successToast } = useToast();
  const updateStatusAccept = useUpdateProjectResourceStatus();
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
  const handleDetailReFetch = () => {
    setDetailRefetch(Date.now());
  };
  const handleProjectResourceDetailEdit = () => {
    if (resourceData) {
      const path = PROJECT_RESOURCE_EDIT.replace(
        ':resourceId',
        resourceData.rid
      );
      const PFY = projectFiscalDate;
      const queryParams = new URLSearchParams({
        account_Id: resourceData.account_rid,
        project_Id: resourceData?.project_fiscal_rid,
        projectCode: projectCode ?? '',
        PFY: PFY ? JSON.stringify(PFY) : '',
        account_name: accountData?.accountName || '',
        account_number: accountData?.accountNumber || '',
      });
      navigate(`${path}?${queryParams.toString()}`);
    }
  };
  const handleEditProjectResource = (row: ProjectResourcesListType) => {
    const path = row?.rid
      ? PROJECT_RESOURCE_EDIT.replace(':resourceId', row.rid)
      : PROJECT_RESOURCE_EDIT;
    const PFY = projectFiscalDate;
    const queryParams = new URLSearchParams({
      account_Id: row?.account_rid || '',
      project_Id: row?.project_fiscal_rid || '',
      account_name: accountData?.accountName || '',
      account_number: accountData?.accountNumber || '',
      PFY: PFY ? JSON.stringify(PFY) : '',
      projectCode: projectCode ?? '',
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
      setSortFilterCount(1);
      setSortOrder(apiOrder);
      setSortField(sortBy);
    }
  };

  const handleSort = (sortBy: string, sortOrder: 'asc' | 'desc') => {
    const apiOrder = sortOrder === 'asc' ? 'ASC' : 'DESC';
    setSortOrder(apiOrder);
    setSortField(sortBy);
  };

  useEffect(() => {
    const page = searchParams.get('page');
    if (page === 'details' && resID) {
      setShowProjectResourceDetails(true);
    } else {
      setShowProjectResourceDetails(false);
    }
  }, [searchParams]);
  const calculateAutoValue = ({
    salary = '0',
    bonus = '0',
    insurance = '0',
    total_cost_pro_res = '0',
    deductions = '0',
  }: {
    salary?: string;
    bonus?: string;
    insurance?: string;
    total_cost_pro_res?: string;
    deductions?: string;
  }) => {
    const s = parseFloat(salary) || 0;
    const b = parseFloat(bonus) || 0;
    const i = parseFloat(insurance) || 0;
    const r = parseFloat(total_cost_pro_res) || 0;
    const d = parseFloat(deductions) || 0;
    return s + b + i + r - d;
  };
  const actionMenuItems = [
    {
      label: 'Edit',
      onClick: (row: ProjectResourcesListType) =>
        handleEditProjectResource(row),
      hide: !isProjectResourceFieldsEditable,
      disabled: accountOrProjectInActive || isProjectSignedOff,
    },
  ];
  const isResourceCreateViewEnable = checkPermission(
    permission,
    AllPermissions.PROJECTS_RESOURCES_CREATE
  );
  const isAttachmentViewEnableMenu = checkPermission(
    menus,
    AllMenus.ATTACHMENTS
  );
  const isAttachmentViewEnableMenuModule = checkPermission(
    modules,
    AllModules.ATTACHMENTS
  );
  const isAttachmentViewEnablepeormission = checkPermission(
    permission,
    AllPermissions.ATTACHMENT_VIEW_EDIT
  );

  const isNoteCreateEnable = checkPermission(
    permission,
    AllPermissions.NOTES_CREATE
  );

  const isChecklistCreateEnable = checkPermission(
    permission,
    AllPermissions.CHECKLIST_CREATE
  );

  const handleOpen = () => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('attachment_entity', 'project_resource');
    navigate({
      pathname: location.pathname,
      search: newParams.toString(),
    });
  };
  const handleBackClick = () => {
    if (originPath === 'case_dossier') {
      window.history.back();
    } else {
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
    }
  };

  const showUploads =
    searchParams.get('attachment_entity') === 'project_resource';

  const handleCreateNote = () => {
    const projectResourceId = searchParams.get('pro_res_id');
    const path = generatePath(NOTES_CREATE, {
      module: 'project',
    });
    const queryParams = new URLSearchParams({
      accountId: accountID,
      entityLevel: 'project_resource',
      entityId: projectResourceId || '',
      projectFiscalYear: projectFiscalYear?.toString() || '',
      source: `Project Resource > ${resourceData?.r_number}`,
      ...(!activeMenuPath ? {} : { activeMenu: activeMenuPath }),
    });
    navigate(`${path}?${queryParams.toString()}`);
  };

  const handleCreateChecklist = () => {
    const projectResourceId = searchParams.get('pro_res_id');
    const path = generatePath(CHECKLIST_CREATE, {
      module: 'project',
    });
    const queryParams = new URLSearchParams({
      accountId: accountID,
      entityLevel: 'project_resource',
      entityId: projectResourceId || '',
      projectFiscalYear: projectFiscalYear?.toString() || '',
      source: `Project Resource > ${resourceData?.r_number}`,
      ...(!activeMenuPath ? {} : { activeMenu: activeMenuPath }),
    });
    navigate(`${path}?${queryParams.toString()}`);
  };

  const headerButtons = [
    {
      label: 'Add Attachment',
      variant: 'outlined' as const,
      onClick: () => handleOpen(),
      disabled: accountOrProjectInActive,
      sx: { ...BUTTON_STYLES, width: '120px', minWidth: '48px' },
      hide:
        !viewDetails ||
        !isAttachmentViewEnableMenu ||
        !isAttachmentViewEnableMenuModule ||
        !isAttachmentViewEnablepeormission,
    },
    {
      label: 'Add Note',
      variant: 'outlined' as const,
      onClick: () => handleCreateNote(),
      disabled: accountOrProjectInActive,
      sx: { ...BUTTON_STYLES, width: '80px', minWidth: '80px' },
      hide: !viewDetails || !isNoteCreateEnable,
    },
    {
      label: 'Add Checklist',
      variant: 'outlined' as const,
      onClick: () => handleCreateChecklist(),
      disabled: accountOrProjectInActive,
      sx: { ...BUTTON_STYLES, width: '105px', minWidth: '105px' },
      hide: !viewDetails || !isChecklistCreateEnable,
    },
    {
      label: viewDetails ? 'Edit' : 'New',
      variant: 'outlined' as const,
      onClick: () =>
        viewDetails
          ? handleProjectResourceDetailEdit()
          : handleCreateProjectResource(),
      sx: { ...BUTTON_STYLES, width: '48px', minWidth: '48px' },
      hide: viewDetails
        ? !isProjectResourceFieldsEditable
        : !isResourceCreateViewEnable,
      disabled: accountOrProjectInActive || isProjectSignedOff,
    },
    {
      label: 'Show/Hide Fields',
      variant: 'outlined' as const,
      disabled: false,
      onClick: handleColumnVisibility,
      sx: { ...BUTTON_STYLES, width: '125px', minWidth: '125px' },
      hide: viewDetails ? true : false,
    },
    {
      label:
        originPath === 'case_dossier'
          ? 'Back To Dossier'
          : 'Back To Project Resources',
      variant: 'outlined' as const,
      disabled: false,
      onClick: handleBackClick,
      sx: { ...BUTTON_STYLES, width: 'auto', padding: '0px 9px' },
      hide: viewDetails ? false : true,
    },
  ];
  const handleFilter = () => {
    setShowFilter(!showFilter);
  };

  const PFY = projectFiscalDate;
  const currency_rid = searchParams.get('currency_rid');
  const handleCreateProjectResource = () => {
    const account_Id = accountID ?? ''; // fallback to empty string
    const project_Id = projectID ?? '';
    const queryParams = new URLSearchParams({
      account_Id,
      project_Id,
      account_name: accountData?.accountName || '',
      account_number: accountData?.accountNumber || '',
      PFY: JSON.stringify(PFY),
      source: 'createProjectResource',
      currency_rid: currency_rid ?? '',
      projectCode: projectCode ?? '',
    });
    navigate(`${PROJECT_RESOURCE_CREATE}?${queryParams.toString()}`);
  };

  const handleProjectResourceClick = (row: ProjectResourcesListType) => {
    searchParams.set('page', 'details');
    searchParams.set('pro_res_id', row?.rid ?? '');
    navigate({ search: searchParams.toString() }, { replace: true });
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
    permissionMap,
    accountOrProjectInActive,
    isProjectSignedOff
  );
  const onRefreshClick = () => {
    setRefreshProjectsTrigger(Date.now());
  };

  const handleCellEdit = async (rowId: string, updates: CellEditData[]) => {
    const previousProject = [...projectResourceList];

    const selectedProject = projectResourceList.find(
      (pro) => pro.rid === rowId
    );
    if (!selectedProject) return;

    let netCost = '';

    // let hasResourceTye = false;
    let hasCountry = false;
    let hasRegion = false;

    const updateData = updates.reduce<Record<string, FieldChangeValue>>(
      (acc, item) => {
        acc[item.editId || item.columnId] = item.value;
        // if (item.columnId === 'resource_type_name') hasResourceTye = true;
        if (item.columnId === 'country_name') hasCountry = true;
        if (item.columnId === 'region_name') hasRegion = true;
        if (item.columnId === 'total_cost_pro_res') {
          const total = calculateAutoValue({
            salary: String(selectedProject.salary),
            bonus: String(selectedProject.bonus),
            insurance: String(selectedProject.insurance),
            total_cost_pro_res: String(item.value),
            deductions: String(selectedProject.deductions),
          });
          netCost = total.toString();
        }
        return acc;
      },
      {
        account_rid: selectedProject?.account_rid,
        project_fiscal_rid: selectedProject?.project_fiscal_rid,
        project_resource_rid: rowId,
      }
    );

    if (hasCountry && !hasRegion) {
      updateData['region_rid'] = '';
    }
    if (netCost) {
      updateData['net_total_cost_pro_res'] = netCost;
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

  const RestrictedColumns = [
    {
      id: 'resource_code',
      canHide: false,
      canDrag: false,
    },
  ];

  const handlePopoverClose = () => {
    setColumnAnchorEl(null);
  };

  const modalId = isModalOpen
    ? 'project-resource-list-column-visibility-popover'
    : undefined;

  const [columnVisibility, setColumnVisibility] = useState<
    Record<string, boolean>
  >(
    Object.fromEntries(
      projectResourcesColumns.map((col) => [col.id, !col.hide])
    )
  );

  const [columnOrder, setColumnOrder] = useState(
    projectResourcesColumns.map((col) => col.id)
  );

  const handleColumnsChange = (updatedColumns: ShowHideTableColumn[]) => {
    const newVisibility = Object.fromEntries(
      updatedColumns.map((col) => [col.id, !col.hide])
    );
    setColumnVisibility(newVisibility);
    setColumnOrder(updatedColumns.map((col) => col.id));
  };

  const visibleColumns = columnOrder
    .map((id) => projectResourcesColumns.find((col) => col.id === id)!)
    .filter((col) => columnVisibility[col.id]);
  const handleAccept = (row: ProjectResourcesListType) => {
    // Set loading for this specific row
    setLoadingRows((prev) => ({
      ...prev,
      [row.rid as string]: ActionEnum.ACCEPT,
    }));

    const payload = {
      rid: row?.rid || '',
      accountId: accountData?.accountID || '',
      action: 'accept',
      type: row?.status_name || '',
      resourceCode: row?.resource_code,
    };

    updateStatusAccept.mutate(payload, {
      onSuccess: (data) => {
        successToast(data?.statusMessage || 'Status updated successfully');
        refetch();
        // Clear loading for this specific row
        setLoadingRows((prev) => ({ ...prev, [row.rid as string]: null }));
      },
      onError: () => {
        // Clear loading for this specific row on error too
        setLoadingRows((prev) => ({ ...prev, [row.rid as string]: null }));
      },
    });
  };

  const handleReject = (row: ProjectResourcesListType) => {
    // Set loading for this specific row
    setLoadingRows((prev) => ({
      ...prev,
      [row.rid as string]: ActionEnum.REJECT,
    }));

    const payload = {
      rid: row?.rid || '',
      accountId: accountData?.accountID || '',
      action: 'reject',
      type: row?.status_name || '',
      resourceCode: row?.resource_code,
    };

    updateStatusAccept.mutate(payload, {
      onSuccess: (data) => {
        successToast(data?.statusMessage || 'Status updated successfully');
        refetch();
        // Clear loading for this specific row
        setLoadingRows((prev) => ({ ...prev, [row.rid as string]: null }));
      },
      onError: () => {
        // Clear loading for this specific row on error too
        setLoadingRows((prev) => ({ ...prev, [row.rid as string]: null }));
      },
    });
  };
  const hideStatusAction =
    !permissionMap?.['status_action']?.edit &&
    !permissionMap?.['status_action']?.read;

  const getConditionMenuItems = (row: ProjectResourcesListType) => {
    let statusLabel = '';
    switch (row.status_name) {
      case 'Duplicate':
        statusLabel = 'Duplicate';
        break;
      case 'Anomaly':
        statusLabel = 'Anomaly';
        break;
      default:
        return [];
    }

    // Get the loading state for this specific row
    const rowAction = loadingRows[row.rid as string];
    const isRowLoading = !!rowAction;

    return [
      {
        label: statusLabel ? `Accept ${statusLabel}` : 'Accept',
        onClick: () => handleAccept(row),
        icon: AcceptIcon,
        loading: rowAction === ActionEnum.ACCEPT,
        disabled: isRowLoading || updateStatusAccept.isPending,
        className:
          'inline-flex items-center gap-1 px-2 py-1 rounded text-[12px] cursor-pointer h-[24px] bg-[#3EA72F1A] hover:bg-[#3EA72F] hover:text-[#fff] min-w-[140px] max-w-[140px] disabled:opacity-60 disabled:cursor-default',
      },
      {
        label: statusLabel ? `Reject ${statusLabel}` : 'Reject',
        onClick: () => handleReject(row),
        icon: RejectIcon,
        loading: rowAction === ActionEnum.REJECT,
        disabled: isRowLoading || updateStatusAccept.isPending,
        className:
          'inline-flex items-center gap-1 px-2 py-1 rounded text-[12px] cursor-pointer h-[24px] bg-[#FF3C031A] hover:bg-[#FF3C03] hover:text-[#fff]min-w-[140px] max-w-[140px] disabled:opacity-60 disabled:cursor-default',
      },
    ];
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
        filterVisibility={!viewDetails && !showUploads}
        handleFilter={handleFilter}
        setCurrentPage={setCurrentPage}
        resourceTab={projectsTabs}
        showRefresh={!viewDetails}
        onRefreshClick={onRefreshClick}
        handleSorting={handleSorting}
        sortFilterCount={sortFilterCount}
        setSortFilterCount={setSortFilterCount}
        projectResourceAccountID={accountID}
        projectResourceProjectID={projectID}
        showSearch={viewDetails ? false : true}
        onSearch={(text) => setSearchText(text)}
        showAddActivity={!viewDetails && !showUploads}
        activityMenuItems={activityMenuItems}
        hideTabPanel={showUploads}
      />
      {isTimeLineView ? (
        <div className='border border-[#CBD6E2] rounded-[2px] overflow-auto'>
          <Timeline entitytype='project' />
        </div>
      ) : (
        <>
          {showUploads ? (
            <Uploads
              accountId={accountID}
              attachID={resID}
              onUploadSuccess={handleDetailReFetch}
              projectFiscalYear={projectFiscalYear}
            />
          ) : (
            <>
              <ProjectResourceTableHeader
                value={
                  viewDetails
                    ? 'project-resource-details'
                    : 'projects-resources'
                }
                title={viewDetails ? 'Project Resource' : 'Project Resources'}
                titleIcon={
                  <ResourcesIcon
                    alt='project-header-icon'
                    className={`[&>path]:stroke-[${ColorCode.accountTextColor}] w-[14px] h-[14px]`}
                  />
                }
                count={totalItems}
                showBackArrow={viewDetails}
                headerButtons={headerButtons}
                projectResourceNumber={resourceData?.r_number}
                onBackClick={handleBackClick}
                iconBg={ColorCode.projectBgColor}
                bgType='circle'
              />
              <div className='border border-[#CBD6E2]'>
                {showProjectResourceDetails ? (
                  <ProjectResourceDetails
                    resourceData={
                      resourceDetails?.data?.projectResource || undefined
                    }
                    attachment={resourceDetails?.data?.attachment || []}
                    isDetailsLoading={isDetailsLoading}
                    detailsError={detailsError}
                    permission={permission}
                  />
                ) : (
                  <>
                    <ManageColumnsPopover
                      anchorEl={columnAnchorEl}
                      open={isModalOpen}
                      popoverId={modalId}
                      onClose={handlePopoverClose}
                      columns={projectResourcesColumns}
                      onColumnsChange={handleColumnsChange}
                      columnRestrictions={RestrictedColumns}
                    />
                    <ListTable
                      data={projectResourceList}
                      columns={visibleColumns}
                      actionMenuItems={actionMenuItems}
                      getRowId={(row: ProjectResourcesListType): string =>
                        row.rid || ''
                      }
                      hoverHighlight={false}
                      tableStyle={{
                        height: '100%',
                        maxHeight: 'calc(100vh - 380px)',
                        overflow: 'auto',
                      }}
                      stickyHeader={true}
                      stickyColumnsCount={1}
                      actionWidth={60}
                      actionDisplayMode='dropdown'
                      conditionMenuItems={
                        !hideStatusAction
                          ? (row: ProjectResourcesListType) =>
                              getConditionMenuItems(row)
                          : undefined
                      }
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
                      onSort={handleSort}
                      selectable={false}
                      onSelectionChange={(selectedIds: unknown) =>
                        console.log('Selected:', selectedIds)
                      }
                      component='project resources'
                      onCellEdit={handleCellEdit}
                      onFieldChange={handleFieldChange}
                    />
                  </>
                )}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
};
