/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import {
  generatePath,
  useLocation,
  useNavigate,
  useParams,
  useSearchParams,
} from 'react-router-dom';
import {
  CHECKLIST_CREATE,
  NOTES_CREATE,
  RESOURCE,
  RESOURCE_CREATE,
} from '../../../../../routes';
import { RootState } from '../../../../../store/store';
import {
  useGetResourceType,
  useResourceList,
} from '../../../../services/resource-list';
import { AccountData } from '../../../account-details/utils';
import TabPanel from '../../components/tab';
import { useMutation } from '@apollo/client';
import { UPDATE_RESOURCE } from '../../../../../api/graphql/queries/resource-query';
import { getResourceColumns } from './columns';
import ResourceSubComponents from './resource-sub-components';
import ResourceTableHeader from './resource-table-header';
import { ResourceCostList } from '../../../../types/resource-cost';
import {
  ExportModule,
  ResourceSkillList,
} from '../../../../types/resource-skill';
import { ResourceList } from '../../../../types/resource';
import {
  AllMenus,
  AllModules,
  AllPermissions,
  Permissions,
  useGetAllCountries,
  useGetAllDocumentInfo,
  useGetDocumentCategoryType,
  useGetStatus,
} from '../../../../../common-service';
import { checkPermission, getFiscalYears } from '../../../../../common-utils';
import {
  ListTable,
  ManageColumnsPopover,
} from '../../../../../components/table';
import { clearFilters } from '../../components/filter/utils';
import { AccessRestricted } from '../../../../../components/account-restricted';
import {
  CellEditData,
  FieldChangeEvent,
  FieldChangeValue,
  ListTableColumn,
  ShowHideTableColumn,
} from '../../../../../components/table/types';
import { useFetchState } from '../../../../services/account';
import { resourceClient } from '../../../../../api/graphql/clients/client';
import { useToast } from '../../../../../hooks';
import Uploads from '../../../../../components/Attachments/upload';
import {
  ActivityDropdownItem,
  ColorCode,
  ExportType,
  SelectOption,
} from '../../../../types';
import { FilterValue } from '../../components/filter/filterType';
import { ResourcesIcon } from '../../../../../assets';
import Timeline from '../../../../../pages/timeline/timeline';

const BUTTON_STYLES = {
  height: '24px !important',
  fontSize: '13px',
  borderRadius: '2px',
};

interface ResourceProps {
  permission?: Permissions[];
  accountDetails?: Record<string, any>;
  activeKey?: string;
  setTableParams?: React.Dispatch<React.SetStateAction<ExportModule>>;
  setExportType?: (type: ExportType) => void;
  activityMenuItems?: ActivityDropdownItem[];
}

export interface ResourceTabs {
  id: AllPermissions | AllMenus;
  name: string;
  hide: boolean;
  disable?: boolean;
  key: string;
}

export interface TabMenus {
  label: string;
  value: string;
  hide: boolean;
  id: AllModules | AllPermissions;
}

const resourceTabs: ResourceTabs[] = [
  {
    id: AllPermissions.ACCOUNTS_VIEW_EDIT,
    name: 'Overview',
    hide: false,
    key: 'overview',
  },
  {
    id: AllPermissions.ACCOUNTS_VIEW_EDIT,
    name: 'Timeline',
    hide: false,
    key: 'timeline',
  },
];

const tabs: TabMenus[] = [
  {
    label: 'Details',
    value: 'details',
    hide: false,
    id: AllPermissions.ACCOUNT_RESOURCES_VIEW_EDIT,
  },
  {
    label: 'Resource Cost',
    value: 'cost',
    hide: false,
    id: AllPermissions.ACCOUNT_RESOURCE_COST_EDIT_VIEW,
  },
  {
    label: 'Resource Skills',
    value: 'skill',
    hide: false,
    id: AllPermissions.ACCOUNT_RESOURCE_SKILL_VIEW_EDIT,
  },
  {
    label: 'Attachments',
    value: 'attachments',
    hide: false,
    id: AllPermissions.ATTACHMENT_VIEW_EDIT,
  },
  {
    label: 'Notes',
    value: 'notes',
    hide: false,
    id: AllPermissions.NOTES_VIEW_EDIT,
  },
  {
    label: 'Checklists',
    value: 'checklists',
    hide: false,
    id: AllPermissions.CHECKLIST_VIEW_EDIT,
  },
];

const Resource: React.FC<ResourceProps> = ({
  accountDetails,
  permission,
  setTableParams,
  setExportType,
  activityMenuItems,
}) => {
  const [resourceTab, setResourceTab] = useState(resourceTabs);
  const [tabMenus, setTabMenus] = useState<TabMenus[]>(tabs);
  const [viewResourceList, setViewResourceList] = useState<boolean>(true);
  const [resourceInActive, setResourceInActive] = useState<boolean>(false);
  // const [columns, setColumns] = useState<any>([]);
  const [showFilter, setShowFilter] = useState<boolean>(false);
  const [filterVisibility, setFilterVisibility] = useState<boolean>(true);
  const [value, setValue] = useState(''); // Resource inner tab value
  const [appliedFilters, setAppliedFilters] = useState<Record<string, any>>({});
  const [showBackArrow, setShowBackArrow] = useState<boolean>(false);
  const [resourceData, setResourceData] = useState<any>({});
  const [currentPage, setCurrentPage] = useState(0);
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('ASC');
  const [sortField, setSortField] = useState<string>('resource_code');
  const [costOrder, setCostOrder] = useState<'asc' | 'desc'>('asc');
  const [costorderBy, setCostOrderBy] =
    useState<keyof ResourceCostList>('fiscal_year');
  const [skillOrder, setSkillOrder] = useState<'asc' | 'desc'>('asc');
  const [skillOrderBy, setSkillOrderBy] =
    useState<keyof ResourceSkillList>('start_date');
  const [rowsPerPage, setRowsPerPage] = useState(100);
  const [count, setCount] = useState(0);
  const { fiscalYear } = useSelector<RootState, { fiscalYear: string }>(
    (state: RootState) => state.account
  );
  const [resourceNumber, setResourceNumber] = useState<string | null>(null);
  const convertedFiscalYear = fiscalYear !== 'FY-All' ? Number(fiscalYear) : 0;
  const accountInActive =
    accountDetails?.data?.accountById?.status?.status_name?.toLowerCase() !==
    'active';
  const [refreshTrigger, setRefreshTrigger] = useState<number>(Date.now());
  const [refreshCostTrigger, setRefreshCostTrigger] = useState<number>(
    Date.now()
  );
  const [refreshSkillTrigger, setRefreshSkillTrigger] = useState<number>(
    Date.now()
  );
  const [refreshAttachments, setRefreshAttachments] = useState<number>(
    Date.now()
  );
  const [refreshNotes, setRefreshNotes] = useState<number>(Date.now());
  const [attachmentsOrder, setAttachmentsOrder] = useState<'ASC' | 'DESC'>(
    'ASC'
  );
  const [searchText, setSearchText] = useState('');
  const [resetSearch, setResetSearch] = useState(false);

  const [attachmentsOrderBy, setAttachmentsOrderBy] =
    useState<string>('document_name');
  const [currentCategory, setCurrentCategory] = useState<string>('');
  const [sortFilterCount, setSortFilterCount] = useState<number>(0);
  const [currentCountry, setCurrentCountry] = useState<string>('');
  const [resourcesList, setResourcesList] = useState<ResourceList[]>([]);

  const [notesOrder, setNotesOrder] = useState<'ASC' | 'DESC'>('ASC');
  const [notesOrderBy, setNotesOrderBy] = useState<string>('r_number');

  //Checklist
  const [refreshChecklists, setRefreshChecklists] = useState<number>(
    Date.now()
  );
  const [checklistsOrder, setChecklistsOrder] = useState<'ASC' | 'DESC'>('ASC');
  const [checklistsOrderBy, setChecklistsOrderBy] =
    useState<string>('r_number');

  const [columnAnchorEl, setColumnAnchorEl] =
    React.useState<HTMLButtonElement | null>(null);
  const isModalOpen = Boolean(columnAnchorEl);

  const handleColumnVisibility = (
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    setColumnAnchorEl(event.currentTarget);
  };
  const [searchParams] = useSearchParams();
  const isTimeLineView = searchParams.get('timelineview') === 'true';
  const [updateResource] = useMutation(UPDATE_RESOURCE, {
    client: resourceClient,
  });
  const navigate = useNavigate();
  const { errorToast } = useToast();
  const location = useLocation();
  const { accountid } = useParams();
  const resId = searchParams.get('res_id');
  const source = searchParams.get('source');
  const activeMenuPath = searchParams.get('activeMenu') || '';
  const noteId = searchParams.get('note_id');
  const noteViewDetails = !!noteId;
  const checklistId = searchParams.get('checklist_id') || '';
  const checklistDetails = !!checklistId;

  // Permission Mangement
  const isAccountResourceFieldsEditable = useMemo(
    () =>
      permission
        ?.find(
          (item) => item.name === AllPermissions.ACCOUNT_RESOURCES_VIEW_EDIT
        )
        ?.fields?.some((field) => field.edit),
    [permission]
  );
  const isResourceDownloadEnable = checkPermission(
    permission || [],
    AllPermissions.ACCOUNT_RESOURCES_EXPORT
  );
  const isResourceCostDownloadEnable = checkPermission(
    permission || [],
    AllPermissions.ACCOUNT_RESOURCES_COST_EXPORT
  );
  const isResourceSkillDownloadEnable = checkPermission(
    permission || [],
    AllPermissions.ACCOUNT_RESOURCES_SKILL_EXPORT
  );
  const isResourceViewAllEnable = checkPermission(
    permission || [],
    AllPermissions.ACCOUNT_RESOURCES_VIEW_EDIT
  );
  const isResourceCreateEnable = checkPermission(
    permission || [],
    AllPermissions.ACCOUNT_RESOURCES_CREATE
  );
  const isResourceDeleteEnable = checkPermission(
    permission || [],
    AllPermissions.ACCOUNT_RESOURCES_DELETE
  );
  // const isResourceEditEnable = checkPermission(
  //   permission || [],
  //   AllPermissions.RESOURCE_EDIT
  // );
  const isResourceCostCreateEnable = checkPermission(
    permission || [],
    AllPermissions.ACCOUNT_RESOURCES_COST_CREATE
  );
  const isResourceSkillCreateEnable = checkPermission(
    permission || [],
    AllPermissions.ACCOUNT_RESOURCES_SKILL_CREATE
  );

  //permissions
  const resourceViewEditFields = useMemo(
    () =>
      permission?.find(
        (item) => item.name === AllPermissions.ACCOUNT_RESOURCES_VIEW_EDIT
      )?.fields ?? [],
    [permission]
  );

  const permissionMap = useMemo(() => {
    const map: Record<string, { read: boolean; edit: boolean }> = {};
    resourceViewEditFields.forEach((item) => {
      map[item.name] = { read: item.read ?? false, edit: item.edit ?? false };
    });
    return map;
  }, [resourceViewEditFields]);

  const {
    data: ResourceList,
    isLoading,
    error,
  } = useResourceList(
    {
      page: currentPage + 1,
      limit: rowsPerPage,
      accountNumber: accountDetails?.data?.accountById.r_number,
      sortBy: sortField,
      sortOrder: sortOrder,
      filters: appliedFilters,
      search: searchText,
    },
    isResourceViewAllEnable && value === '',
    refreshTrigger
  );

  const isResoureceOverviewHide = resourceTab[0].hide;
  const statusOptions = useGetStatus();
  const resourceTypeOptions = useGetResourceType();
  const countriesList = useGetAllCountries();
  const region = useFetchState(currentCountry);

  const memoizedStatus = useMemo(
    () =>
      statusOptions?.data?.data?.status.map((status) => ({
        label: status.status_name,
        value: status.rid,
      })) || [],
    [statusOptions?.data?.data?.status]
  );

  const memoizedResourceType = useMemo(
    () =>
      resourceTypeOptions?.data?.data?.resouceType.map((item) => ({
        label: item.resource_type_name,
        value: item.rid,
      })) || [],
    [resourceTypeOptions?.data?.data?.resouceType]
  );

  const countryOptions = useMemo(() => {
    return (
      countriesList.data?.data.country.map((item) => ({
        label: item.country_name,
        value: item.rid,
      })) || []
    );
  }, [countriesList]);

  const regionOptions = useMemo(
    () =>
      region.data?.data.states.map((region) => ({
        label: region.state_name,
        value: region.rid,
      })) || [],
    [region.data?.data.states]
  );

  useEffect(() => {
    const isHide = (tab: ResourceTabs | TabMenus) => {
      return (
        !permission?.find((item) => item.name === tab.id)?.is_enabled || false
      );
    };
    // updated sub tabs(Overview, Timeline)
    setResourceTab(
      resourceTabs.map((tab) => ({
        ...tab,
        hide: isHide(tab),
      }))
    );
    // updated sub tabs(Details, Cost, Skill)
    const updatedTabs = tabs.map((tab) => ({ ...tab, hide: isHide(tab) }));
    setTabMenus(updatedTabs);
  }, [permission]);

  useEffect(() => {
    if (searchParams.get('res_id') && ResourceList) {
      const resId = searchParams.get('res_id');
      const currentResource = ResourceList?.resource?.find(
        (resource: ResourceList) => resource.rid === resId
      );
      if (currentResource) {
        setResourceData(currentResource);
        setResourceNumber(currentResource.r_number ?? '');
      }
    }
  }, [searchParams, ResourceList]);
  useEffect(() => {
    if (setCount) {
      setCount(ResourceList?.count || 0);
    }
  }, [ResourceList, setCount]);

  useEffect(() => {
    if (ResourceList?.resource) {
      setResourcesList(ResourceList.resource);
    }
  }, [ResourceList]);
  const handleFilter = () => {
    setShowFilter(!showFilter);
  };

  const handleTabChange = (_: React.SyntheticEvent, newValue: string) => {
    // setValue(newValue);
    setShowFilter(false);
    setAppliedFilters({});
    setSortFilterCount(0);
    setCount(0);
    clearFilters(value || 'resource');
    setSearchText('');
    setResetSearch(true);
    // update the URL with the tab value
    searchParams.set('tab', newValue);
    searchParams.delete('attachment_entity');
    searchParams.delete('note_id');
    searchParams.delete('checklist_id');
    searchParams.delete('origin');
    navigate({ search: searchParams.toString() }, { replace: true });
    setCurrentPage(0);
  };

  const handleSearchReset = () => {
    setResetSearch(false);
  };

  const handleResourceClick = (row: any) => {
    setResourceData(row);
    setViewResourceList(false); // Always set to false to show resource details
    setShowBackArrow(true); // Always show back arrow when viewing resource details
    setShowFilter(false);
    // setFilterVisibility(false);
    setAppliedFilters({});
    setSortFilterCount(0);
    clearFilters(value || 'resource');
    // assign default tab value
    const activeTab = tabMenus.find((tab) => !tab.hide)?.value;
    setValue(activeTab as string);
  };

  useEffect(() => {
    // update the URL when open a resource sub tab
    if (
      !viewResourceList &&
      resourceData.rid &&
      searchParams.get('list') === 'resources'
    ) {
      searchParams.set('res_id', resourceData.rid);
      searchParams.set('tab', value);
      navigate({ search: searchParams.toString() }, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resourceData.rid, viewResourceList, value]);

  // useEffect(() => {
  //   setColumns(getResourceColumns(handleResourceClick));
  // }, []);

  useEffect(() => {
    // update sub tab when refereshing the page
    const tab = searchParams.get('tab');
    if (tab && searchParams.get('list') === 'resources') {
      setValue(tab);
      setViewResourceList(false);
      setShowBackArrow(true);
    }
  }, [searchParams]);

  const handleEdit = (resource: any) => {
    setFilterVisibility(false);
    navigate(RESOURCE + '/edit/' + resource.rid + `?account_id=${accountid}`, {
      state: { resource, accountDetails, resources: true },
    });
  };
  const handleOpen = () => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('attachment_entity', 'resource');
    navigate({
      pathname: location.pathname,
      search: newParams.toString(),
    });
  };
  const showUploads = searchParams.get('attachment_entity') === 'resource';
  const attachmentEntity = searchParams.get('attachment_entity');
  const actionMenuItems = [
    {
      label: 'Edit',
      onClick: handleEdit,
      disabled: accountInActive,
      hide: !isAccountResourceFieldsEditable,
    },
    {
      label: 'Delete',
      onClick: (row: any) => console.log('Delete', row),
      disabled: accountInActive || !isResourceDeleteEnable,
      // hide: !isResourceDeleteEnable,
      hide: true,
    },
    {
      label: 'View Summary',
      onClick: (row: any) => console.log('Summary', row),
      hide: true,
    },
    {
      label: 'View Activities',
      onClick: (row: any) => console.log('Activities', row),
      hide: true,
    },
    {
      label: 'View Notes',
      onClick: (row: any) => console.log('Notes', row),
      hide: true,
    },
  ];

  const handleCreateButtonEnable = () => {
    if (value === 'details' || value === '') {
      return !isResourceCreateEnable;
    } else if (value === 'cost') {
      return !isResourceCostCreateEnable;
    } else if (value === 'skill') {
      return !isResourceSkillCreateEnable;
    } else if (value === 'attachments') {
      return true;
    } else if (value === 'notes') {
      return true;
    } else if (value === 'checklists') {
      return true;
    }
    return accountInActive;
  };

  const handleDownloadButtonEnable = () => {
    if (value === 'details' || value === '') {
      return !isResourceDownloadEnable;
    } else if (value === 'cost') {
      return !isResourceCostDownloadEnable;
    } else if (value === 'skill') {
      return !isResourceSkillDownloadEnable;
    }
    return false;
  };

  const attachmentCreateEnable = checkPermission(
    permission || [],
    AllPermissions.ATTACHMENT_CREATE
  );

  const isNoteCreateEnable = checkPermission(
    permission || [],
    AllPermissions.NOTES_CREATE
  );

  const isChecklistCreateEnable = checkPermission(
    permission || [],
    AllPermissions.CHECKLIST_CREATE
  );

  const handleBackClick = () => {
    if (source === 'timesheet') {
      const timesheetId = searchParams.get('timesheet_id');
      const newSearchParams = new URLSearchParams();
      if (timesheetId) newSearchParams.set('timesheet_id', timesheetId);
      newSearchParams.set('tab', 'timesheet_project_resource');
      navigate(`/account/details/${accountid}?${newSearchParams.toString()}`, {
        replace: true,
      });
    } else {
      setViewResourceList(true); // Always set to true to show the resource list
      setShowBackArrow(false); // Always hide back arrow when showing resource list
      setShowFilter(false);
      setCount(ResourceList?.count || 0);
      // clear query params
      searchParams.delete('res_id');
      searchParams.delete('attachment_entity');
      searchParams.delete('tab');
      searchParams.delete('note_id');
      searchParams.delete('checklist_id');
      searchParams.delete('origin');
      navigate(
        {
          pathname: location.pathname,
          search: searchParams.toString(),
        },
        { replace: true }
      );
      setValue('');
      setFilterVisibility(true);
      setAppliedFilters({});
      setSortFilterCount(0);
      clearFilters('resource');
    }
  };

  const handleCreateNote = () => {
    const accountId = accountid ?? '';
    const resourceId = searchParams.get('res_id');
    const path = generatePath(NOTES_CREATE, {
      module: 'account',
    });
    const queryParams = new URLSearchParams({
      accountId,
      entityLevel: 'resource',
      entityId: resourceId || '',
      source: `Resource > ${resourceNumber}`,
      ...(!activeMenuPath ? {} : { activeMenu: activeMenuPath }),
    });
    navigate(`${path}?${queryParams.toString()}`);
  };

  const handleCreateChecklist = () => {
    const accountId = accountid ?? '';
    const resourceId = searchParams.get('res_id');
    const path = generatePath(CHECKLIST_CREATE, {
      module: 'account',
    });
    const queryParams = new URLSearchParams({
      accountId,
      entityLevel: 'resource',
      entityId: resourceId || '',
      source: `Resource > ${resourceNumber}`,
      ...(!activeMenuPath ? {} : { activeMenu: activeMenuPath }),
    });
    navigate(`${path}?${queryParams.toString()}`);
  };

  const headerButtons = [
    {
      label: 'Add Attachment',
      variant: 'outlined' as const,
      onClick: () => handleOpen(),
      sx: { ...BUTTON_STYLES, width: '120px', minWidth: '120px' },
      hide: !value || !attachmentCreateEnable,
      disabled: accountInActive ? accountInActive : resourceInActive,
    },
    {
      label: 'Add Note',
      variant: 'outlined' as const,
      onClick: () => handleCreateNote(),
      sx: { ...BUTTON_STYLES, width: '80px', minWidth: '80px' },
      hide: !value || !isNoteCreateEnable,
      disabled: accountInActive ? accountInActive : resourceInActive,
    },
    {
      label: 'Add Checklist',
      variant: 'outlined' as const,
      onClick: () => handleCreateChecklist(),
      sx: { ...BUTTON_STYLES, width: '105px', minWidth: '105px' },
      hide: !value || !isChecklistCreateEnable,
      disabled: accountInActive ? accountInActive : resourceInActive,
    },
    {
      label: value === 'details' ? 'Edit' : 'New',
      variant: 'outlined' as const,
      disabled: accountInActive,
      onClick:
        value === 'details'
          ? () => handleEditResource()
          : () => handleCreateResource(),
      sx: { ...BUTTON_STYLES, width: '48px', minWidth: '48px' },
      hide:
        value === 'details'
          ? !isAccountResourceFieldsEditable
          : handleCreateButtonEnable() || !!attachmentEntity,
    },
    {
      label: 'Show/Hide Fields',
      variant: 'outlined' as const,
      onClick: handleColumnVisibility,
      sx: { ...BUTTON_STYLES, width: '125px', minWidth: '125px' },
      hide:
        value === 'details' ||
        noteViewDetails ||
        checklistDetails ||
        !!attachmentEntity,
      disabled: false,
    },
    {
      label: 'Download',
      variant: 'outlined' as const,
      onClick: () => console.log('Download'),
      sx: {
        ...BUTTON_STYLES,
        width: '96px',
        minWidth: '96px',
        display: 'none',
      },
      hide: handleDownloadButtonEnable(),
    },
    {
      label: source === 'timesheet' ? 'Back To Timesheet' : 'Back To Resources',
      variant: 'outlined' as const,
      onClick: handleBackClick,
      sx: { ...BUTTON_STYLES, width: '125px', minWidth: '125px' },
      hide: !value,
      disabled: false,
    },
  ];

  const handleEditResource = () => {
    const resourceId = searchParams.get('res_id');
    const accNumber = accountDetails?.data?.accountById.r_number;
    navigate(
      RESOURCE +
        '/edit/' +
        resourceId +
        `?account_id=${accountid}&acc_number=${accNumber}`,
      {
        state: {
          resource: resourceData,
          accountDetails: accountDetails,
          resources: true,
        },
      }
    );
  };

  const handleCreateResource = () => {
    const resId = searchParams.get('res_id');
    if (value === 'cost') {
      navigate(`${RESOURCE}/cost/create${resId ? `?res_id=${resId}` : ''}`, {
        state: {
          ...accountDetails,
          resourceData,
          cost: true,
          sectionName: 'Financial Information',
        },
      });
    } else if (value === 'skill') {
      navigate(`${RESOURCE}/skill/create${resId ? `?res_id=${resId}` : ''}`, {
        state: {
          ...accountDetails,
          resourceData,
          skill: true,
          sectionName: 'Skill Information',
        },
      });
    } else {
      navigate(
        `${RESOURCE_CREATE}?account_id=${accountid}${resId ? `&res_id=${resId}` : ''}`,
        {
          state: { accountDetails, resourceCreate: true },
        }
      );
    }
  };

  // export function need handle in download btn export droopdown in parent

  useEffect(() => {
    const updatedParams: Partial<ExportModule> = {
      sortBy: '',
      sortOrder: 'DESC',
      resourceRid: searchParams.get('res_id') || '',
      rNumber: accountDetails?.data?.accountById?.r_number,
      filter: appliedFilters,
      search: searchText,
    };

    if (value === 'cost') {
      updatedParams.sortBy = costorderBy;
      updatedParams.sortOrder = costOrder.toUpperCase() as 'ASC' | 'DESC';
      setExportType?.('cost');
    } else if (value === 'skill') {
      updatedParams.sortBy = skillOrderBy;
      updatedParams.sortOrder = skillOrder.toUpperCase() as 'ASC' | 'DESC';
      setExportType?.('skill');
    } else if (value === 'attachments') {
      updatedParams.sortBy = attachmentsOrderBy;
      updatedParams.sortOrder = attachmentsOrder;
      setExportType?.('resource_attachments');
    } else if (value === 'notes') {
      updatedParams.sortBy = notesOrderBy;
      updatedParams.sortOrder = notesOrder;
      setExportType?.('resource_notes');
    } else if (value === 'checklists') {
      updatedParams.sortBy = checklistsOrderBy;
      updatedParams.sortOrder = checklistsOrder;
      setExportType?.('resource_checklist');
    } else {
      updatedParams.sortBy = sortField;
      updatedParams.sortOrder = sortOrder;
      setExportType?.('resource');
    }

    setTableParams?.((prev) => ({
      ...prev,
      ...updatedParams,
    }));
  }, [
    value,
    costOrder,
    costorderBy,
    skillOrder,
    skillOrderBy,
    sortField,
    sortOrder,
    searchParams,
    appliedFilters,
    setTableParams,
    setExportType,
    accountDetails?.data?.accountById?.r_number,
    attachmentsOrderBy,
    attachmentsOrder,
    notesOrderBy,
    notesOrder,
    searchText,
    checklistsOrderBy,
    checklistsOrder,
  ]);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const handleRowsPerPageChange = (newPageSize: number) => {
    setRowsPerPage(newPageSize);
    setCurrentPage(1);
  };

  const handleSortRequest = (property: string, sortOrder: 'asc' | 'desc') => {
    const apiOrder = sortOrder === 'asc' ? 'ASC' : 'DESC';
    setSortOrder(apiOrder);
    setSortField(property);
  };

  const handleFieldChange = async (event: FieldChangeEvent) => {
    if (event.columnId === 'country_name' && event.value) {
      setCurrentCountry(String(event.value));
    }
  };

  const getRowId = (row: ResourceList) => row.rid;

  const handleCountry = (country: string) => {
    setCurrentCountry(country);
  };

  const resourceColumns = useMemo(
    () =>
      getResourceColumns(
        memoizedStatus,
        memoizedResourceType,
        countryOptions,
        regionOptions,
        handleCountry,
        region.isPending,
        permissionMap,
        handleResourceClick,
        accountInActive
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [accountInActive, regionOptions]
  );

  const [visibleColumns, setVisibleColumns] = useState<
    ListTableColumn<ResourceList>[]
  >(resourceColumns.filter((col) => !col.hide));

  useEffect(() => {
    const updatedColumns = resourceColumns.filter((col) => !col.hide);
    setVisibleColumns(updatedColumns);
  }, [accountInActive, regionOptions, resourceColumns]);

  const onRefreshClick = () => {
    if (value === 'cost') {
      setRefreshCostTrigger(Date.now()); // Toggle the refreshTrigger to force re-fetch
    } else if (value === 'skill') {
      setRefreshSkillTrigger(Date.now()); // Toggle the refreshTrigger to force re-fetch
    } else if (value === 'attachments') {
      setRefreshAttachments(Date.now());
    } else if (value === 'notes') {
      setRefreshNotes(Date.now());
    } else if (value === 'checklists') {
      setRefreshChecklists(Date.now());
    } else {
      setRefreshTrigger(Date.now()); // Toggle the refreshTrigger to force re-fetch
    }
  };

  const handleSorting = (sortBy: string, sortOrder: 'asc' | 'desc') => {
    const defaultSortField =
      value === 'cost'
        ? 'fiscal_year'
        : value === 'skill'
          ? 'start_date'
          : 'resource_code';
    const apiOrder = sortOrder === 'asc' ? 'ASC' : 'DESC';
    const apiSortBy = sortBy || defaultSortField;
    const isSortByEmpty = !sortBy;

    setSortFilterCount(sortBy ? 1 : 0);

    if (value === 'skill') {
      setSkillOrder(isSortByEmpty ? 'asc' : sortOrder);
      setSkillOrderBy(apiSortBy as keyof ResourceSkillList);
    } else if (value === 'cost') {
      setCostOrder(isSortByEmpty ? 'asc' : sortOrder);
      setCostOrderBy(apiSortBy as keyof ResourceCostList);
    } else if (value === 'attachments') {
      setAttachmentsOrder(
        isSortByEmpty ? 'ASC' : (sortOrder.toUpperCase() as 'ASC' | 'DESC')
      );
      setAttachmentsOrderBy(apiSortBy);
    } else if (value === 'notes') {
      setNotesOrder(
        isSortByEmpty ? 'ASC' : (sortOrder.toUpperCase() as 'ASC' | 'DESC')
      );
      setNotesOrderBy(apiSortBy);
    } else if (value === 'checklists') {
      setChecklistsOrder(
        isSortByEmpty ? 'ASC' : (sortOrder.toUpperCase() as 'ASC' | 'DESC')
      );
      setChecklistsOrderBy(apiSortBy);
    } else {
      setSortOrder(isSortByEmpty ? 'ASC' : apiOrder);
      setSortField(apiSortBy);
    }
  };
  const handleCellEdit = async (rowId: string, updates: CellEditData[]) => {
    const previousResourceList = [...resourcesList];
    let hasCountry = false;
    let hasRegion = false;
    const updateData = updates.reduce<Record<string, FieldChangeValue>>(
      (res, item) => {
        const key = item.editId || item.columnId;
        res[key] = item.value;
        if (item.columnId === 'country_name') hasCountry = true;
        if (item.columnId === 'region_name') hasRegion = true;
        return res;
      },
      {
        resource_rid: rowId,
        account_rid: accountDetails?.data?.accountById?.rid,
      }
    );

    if (hasCountry && !hasRegion) {
      updateData['region_rid'] = '';
    }

    if (hasCountry) {
      updateData['city_rid'] = '';
    }

    try {
      const res = await updateResource({
        variables: { data: updateData },
      });
      const result = res.data?.updateResourceInline;
      if (result?.statusCode === 200 && result.data) {
        const updatedResource = result.data;
        setResourcesList((prevList) =>
          prevList.map((resource) =>
            resource.rid === updatedResource.rid ? updatedResource : resource
          )
        );
      } else {
        errorToast(result?.statusMessage || 'Failed to update filed');
        setResourcesList(previousResourceList);
      }
    } catch (error) {
      errorToast((error as Error)?.message || 'Failed to update filed');
      setResourcesList(previousResourceList);
    }
  };
  const minYear = 1950;
  const currentYear = new Date().getFullYear();
  const fiscalYears = getFiscalYears(currentYear - minYear + 1);
  const allDocumentInfo = useGetAllDocumentInfo();
  const categoryTypes = useGetDocumentCategoryType(currentCategory);

  const memoizedDocumentTypes: SelectOption[] = useMemo(
    () =>
      categoryTypes.data?.data.documentTypes.map((type) => ({
        label: type.type_name,
        value: type.rid,
      })) || [],
    [categoryTypes.data?.data.documentTypes]
  );

  const memoizedDocumentCategories: SelectOption[] = useMemo(
    () =>
      allDocumentInfo.data?.data.documentCategories.map((category) => ({
        label: category.category_name,
        value: category.rid,
      })) || [],
    [allDocumentInfo.data?.data.documentCategories]
  );

  const handleCategory = (fieldName: string, value: FilterValue) => {
    if (fieldName === 'document_category_rid' && value) {
      setCurrentCategory(String(value));
    }
  };

  const fieldOptions = {
    fiscalYears: fiscalYears,
    docCategories: memoizedDocumentCategories,
    docTypes: memoizedDocumentTypes,
  };

  const RestrictedColumns = [
    {
      id: 'resource_code',
      canHide: false,
      canDrag: false,
    },
  ];

  const handleColumnsChange = (updatedColumns: ShowHideTableColumn[]) => {
    setVisibleColumns(
      updatedColumns.filter(
        (col) => !col.hide
      ) as ListTableColumn<ResourceList>[]
    );
  };

  const handlePopoverClose = () => {
    setColumnAnchorEl(null);
  };

  const modalId = isModalOpen
    ? 'interaction-column-visibility-popover'
    : undefined;

  return (
    <div className='w-full py-2 pl-2 pr-4'>
      <TabPanel
        resourceTab={resourceTab}
        value={value}
        appliedFilters={appliedFilters}
        setAppliedFilters={(data) => {
          setAppliedFilters(data);
        }}
        showFilter={showFilter}
        filterVisibility={
          isResoureceOverviewHide
            ? false
            : isResourceViewAllEnable
              ? showUploads ||
                noteViewDetails ||
                checklistDetails ||
                !!attachmentEntity
                ? false
                : filterVisibility
              : false
        }
        handleFilter={handleFilter}
        setCurrentPage={setCurrentPage}
        showRefresh={
          showUploads ||
          noteViewDetails ||
          checklistDetails ||
          !!attachmentEntity
            ? false
            : true
        }
        onRefreshClick={onRefreshClick}
        handleSorting={handleSorting}
        sortFilterCount={sortFilterCount}
        setSortFilterCount={setSortFilterCount}
        fieldOptions={fieldOptions}
        handleFilterChange={handleCategory}
        showSearch={
          value === 'details' ||
          noteViewDetails ||
          checklistDetails ||
          !!attachmentEntity
            ? false
            : true
        }
        searchDisabled={false}
        searchHidden={value === 'cost' || value === 'skill' ? true : false}
        searchPlaceholder='Search'
        onSearch={(text) => setSearchText(text)}
        resetSearch={resetSearch}
        onSearchReset={handleSearchReset}
        showAddActivity={
          showUploads ||
          noteViewDetails ||
          checklistDetails ||
          !!attachmentEntity
            ? false
            : true
        }
        activityMenuItems={activityMenuItems}
      />
      {showUploads ? (
        <Uploads accountId={accountid} attachID={resId} />
      ) : (
        !isResoureceOverviewHide &&
        isResourceViewAllEnable && (
          <>
            {isTimeLineView ? (
              <div className='border border-[#CBD6E2] rounded-[2px] overflow-auto'>
                <Timeline entitytype='account' />
              </div>
            ) : (
              <div>
                <ResourceTableHeader
                  value={value}
                  title='Resources'
                  count={count}
                  resourceNumber={resourceData?.r_number ?? resourceNumber}
                  titleIcon={
                    <ResourcesIcon
                      alt='resource header icon'
                      className={`[&>path]:stroke-[${ColorCode.accountTextColor}] w-[14px] h-[14px]`}
                    />
                  }
                  headerButtons={headerButtons}
                  showBackArrow={showBackArrow}
                  onBackClick={handleBackClick}
                  iconBg={ColorCode.accountBgColor}
                  bgType='circle'
                  showCount={noteViewDetails || checklistDetails ? false : true}
                />

                {!viewResourceList && value && (
                  <ResourceSubComponents
                    permission={permission}
                    tabMenus={tabMenus}
                    setFilterVisibility={setFilterVisibility}
                    handleTabChange={handleTabChange}
                    value={value}
                    resourceId={searchParams.get('res_id') as string}
                    accountId={accountDetails?.data?.accountById?.r_number}
                    appliedFilters={appliedFilters || {}}
                    fiscalYearValue={convertedFiscalYear}
                    accountDetails={accountDetails as AccountData}
                    setShowFilter={setShowFilter}
                    currentPage={currentPage}
                    setCurrentPage={setCurrentPage}
                    costOrder={costOrder}
                    setCostOrder={setCostOrder}
                    costorderBy={costorderBy}
                    setCostorderBy={setCostOrderBy}
                    skillOrder={skillOrder}
                    setSkillOrder={setSkillOrder}
                    skillOrderBy={skillOrderBy}
                    setSkillOrderBy={setSkillOrderBy}
                    refreshCostTrigger={refreshCostTrigger}
                    refreshSkillTrigger={refreshSkillTrigger}
                    attachmentsOrder={attachmentsOrder}
                    setAttachmentsOrder={setAttachmentsOrder}
                    attachmentsOrderBy={attachmentsOrderBy}
                    setAttachmentsOrderBy={setAttachmentsOrderBy}
                    notesOrder={notesOrder}
                    setNotesOrder={setNotesOrder}
                    notesOrderBy={notesOrderBy}
                    setNotesOrderBy={setNotesOrderBy}
                    refreshAttachments={refreshAttachments}
                    refreshNotes={refreshNotes}
                    checklistsOrder={checklistsOrder}
                    setChecklistsOrder={setChecklistsOrder}
                    checklistsOrderBy={checklistsOrderBy}
                    setChecklistsOrderBy={setChecklistsOrderBy}
                    refreshChecklists={refreshChecklists}
                    setCount={setCount}
                    resourceInActive={resourceInActive}
                    setResourceInActive={setResourceInActive}
                    setColumnAnchorEl={setColumnAnchorEl}
                    columnAnchorEl={columnAnchorEl}
                    searchValue={searchText}
                    setResourceNumber={setResourceNumber}
                  />
                )}
                {viewResourceList && !value && (
                  <div className='border border-[#CBD6E2]'>
                    <ManageColumnsPopover
                      anchorEl={columnAnchorEl}
                      open={isModalOpen}
                      popoverId={modalId}
                      onClose={handlePopoverClose}
                      columns={resourceColumns}
                      onColumnsChange={handleColumnsChange}
                      columnRestrictions={RestrictedColumns}
                    />
                    <ListTable
                      data={resourcesList}
                      columns={visibleColumns}
                      getRowId={getRowId}
                      hoverHighlight={false}
                      tableStyle={{
                        borderBottom: '1px solid #CBD6E2',
                        height: '100%',
                        maxHeight: 'calc(100vh - 330px)',
                        overflow: 'auto',
                      }}
                      stickyHeader={true}
                      stickyColumnsCount={1}
                      selectable={false}
                      actionWidth={80}
                      actionDisplayMode='dropdown'
                      actionMenuItems={actionMenuItems}
                      loading={isLoading}
                      error={error ? 'Failed to load resource data' : undefined}
                      rowsPerPageOptions={[25, 50, 100]}
                      rowsPerPage={rowsPerPage}
                      currentPage={currentPage}
                      totalItems={ResourceList?.count || 0}
                      onPageChange={handlePageChange}
                      onRowsPerPageChange={handleRowsPerPageChange}
                      sortBy={sortField}
                      sortOrder={sortOrder}
                      onSort={handleSortRequest}
                      onCellEdit={handleCellEdit}
                      onFieldChange={handleFieldChange}
                    />
                  </div>
                )}
              </div>
            )}
          </>
        )
      )}
      {!isResourceViewAllEnable && <AccessRestricted />}
    </div>
  );
};

export default Resource;
