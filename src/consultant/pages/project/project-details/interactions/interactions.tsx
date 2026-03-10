/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useMemo, useState } from 'react';
import {
  AllModules,
  AllPermissions,
  OverviewTabs,
  useGetInteractionResponeSources,
  useGetInteractionStatus,
  useGetInteractionStatusByReminder,
  useGetInteractionTypes,
} from '../../../../../common-service';
import {
  DetailsKeyContactErrorIcon,
  EditIcon,
  InteractionsIcon,
} from '../../../../../assets';
import SectionHeader from '../../../../../components/details-section/section-header';
import { SectionTabPanel } from '../../../../../components';
import {
  ListTable,
  ManageColumnsPopover,
} from '../../../../../components/table';
import {
  ActivityDropdownItem,
  ColorCode,
  InteractionList,
  StatusTypeEnum,
} from '../../../../types';
import {
  useGetAssessmentSource,
  useInteractionList,
  useInteractionListModel,
  useSendInteraction,
  useUpdateInteractionStatus,
} from '../../../../services/interactions/interactions-service';
import {
  generatePath,
  useNavigate,
  useParams,
  useSearchParams,
} from 'react-router-dom';
import { getInteractionListColumns } from './columns';
import {
  getInteractionFilterFields,
  getProjectInteractionFilterFields,
} from './helpers';
import InteractionDetails from './interaction-details/interaction-details';
import { InteractionHistory } from './interaction-history';
import {
  ActionItem,
  ShowHideTableColumn,
} from '../../../../../components/table/types';
import {
  INTERACTIONS_CREATE,
  INTERACTIONS_EDIT,
  PROJECT_DETAILS,
} from '../../../../../routes';
import { NewProjectData } from '../../../../types/project';
import {
  ReInitiateModal,
  SendInteractionModal,
} from '../../../../../components/interaction';
import HistoryTable from './response-history/history-table';
import { InteractionAttachment } from './interaction-attachment';
import { getInteractionHistoryFilterFields } from './interaction-history/helper';
import { AttachmentsListExportParams } from '../../../../types/attachment';
import { checkPermission, getDisableReason } from '../../../../../common-utils';
import { useSelector } from 'react-redux';
import { RootState } from '../../../../../store/store';
import { AccessRestricted } from '../../../../../components/account-restricted';
import TableModal from '../../../../../components/table/model-table';
import { useToast } from '../../../../../hooks';
import { getProjectInteractionListModelColumns } from './modelColumns';
import { Box } from '@mui/material';
import Timeline from '../../../../../pages/timeline/timeline';

const InteractionsTabs: OverviewTabs[] = [
  {
    id: AllPermissions.INTERACTIONS_OVERVIEW,
    name: 'Overview',
    hide: false,
    key: 'overview',
  },
  {
    id: AllPermissions.INTERACTIONS_TIMELINE,
    name: 'Timeline',
    hide: false,
    // disable: true,
    key: 'timeline',
  },
];
export interface ModelTableParams {
  page: number;
  limit: number;
  sort: string;
  sort_by: 'ASC' | 'DESC'; // restrict to only ASC or DESC
  filter: Record<string, any>; // or a stricter type if you know filter shape
}
interface InteractionsProps {
  accountInActive: boolean;
  projectDetails: NewProjectData | null;
  setInteractionsParams: React.Dispatch<
    React.SetStateAction<AttachmentsListExportParams>
  >;
  isSendInteraction: boolean;
  rdQualified: boolean;
  loading: boolean;
  activityMenuItems: ActivityDropdownItem[];
  isProjectSignedOff?: boolean;
}

const Interactions: React.FC<InteractionsProps> = ({
  accountInActive,
  projectDetails,
  setInteractionsParams,
  isSendInteraction,
  rdQualified,
  loading,
  activityMenuItems,
  isProjectSignedOff,
}) => {
  const { projectid } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const accountId = searchParams.get('accountID') || '';
  const [appliedFilters, setAppliedFilters] = useState<
    Record<string, string | number | boolean | string[]>
  >({});
  const [refreshInteractions, setRefreshInteractions] = useState<number>(
    Date.now()
  );
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [rowsPerPage, setRowsPerPage] = useState(100);
  const [sortField, setSortField] = useState<string>('r_number');
  const [sortBy, setSortBy] = useState<'ASC' | 'DESC'>('ASC');
  const [showFilter, setShowFilter] = useState<boolean>(false);
  const [sortFilterCount, setSortFilterCount] = useState<number>(0);
  const [interactionList, setInteractionList] = useState<InteractionList[]>([]);
  const [count, setCount] = useState<number>(0);
  const [sendModalOpen, setSendModalOpen] = useState(false);
  const [selectedRows, setSelectedRows] = useState<InteractionList[]>([]);
  const [clearSelectedRows, setClearSelectedRows] = useState<boolean>(false);
  const [columnAnchorEl, setColumnAnchorEl] =
    React.useState<HTMLButtonElement | null>(null);
  const [modelShowFilter, setModelShowFilter] = useState<boolean>(false);
  const [refreshModelInteractions, setRefreshModelInteractions] =
    useState<number>(Date.now());
  const [reminderModalOpen, setReminderModalOpen] = useState(false);
  const [reInitiateModalOpen, setReInitiateModalOpen] = useState(false);
  const [modelTableParms, setModdelTableParms] = useState<ModelTableParams>({
    page: 0,
    limit: 100,
    sort: 'r_number',
    sort_by: 'ASC',
    filter: {},
  });
  const [searchText, setSearchText] = useState('');
  const [resetSearch, setResetSearch] = useState(false);
  const [showAssessmentToggle, setShowAssessmentToggle] =
    useState<boolean>(false);

  const isTimeLineView = searchParams.get('timelineview') === 'true';
  const isModalOpen = Boolean(columnAnchorEl);
  const handleColumnVisibility = (
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    setColumnAnchorEl(event.currentTarget);
  };
  const { successToast, errorToast } = useToast();
  const sendInteraction = useSendInteraction();
  const updateInteractionStatus = useUpdateInteractionStatus();
  const interactionId = searchParams.get('interaction_id');
  const interactionNumber = searchParams.get('interaction_number') || '';
  const interactionHistoryId = searchParams.get('interaction_history_id');
  const interactionAttachmentId = searchParams.get(
    'interaction_attachment_count'
  );

  const responseHistory = searchParams.get('history');
  const interactionResponseId = searchParams.get('versionID');
  const viewDetails = !!interactionId;
  const viewInteractionHistory = !!interactionHistoryId;
  const viewInteractionAttachment = !!interactionAttachmentId;
  const viewResponseHistory = !!responseHistory;

  const { permission, modules } = useSelector(
    (state: RootState) => state.permission
  );

  const projectData = {
    project_code: projectDetails?.project_code || '',
    project_name: projectDetails?.project_name || '',
    fiscal_year: projectDetails?.fiscal_year || '',
    account_name: projectDetails?.account_name || '',
    account_rid: projectDetails?.account_rid || '',
    project_rid: projectDetails?.project_rid || '',
    project_fiscal_rid:
      projectDetails?.project_fiscal_rid ||
      projectid ||
      projectDetails?.rid ||
      '',
  };
  const fiscalYear = Number(projectDetails?.fiscal_year);

  const { data, isLoading, isError, refetch } = useInteractionList(
    {
      page: currentPage + 1,
      limit: rowsPerPage,
      sort: sortField,
      sort_by: sortBy,
      filters: appliedFilters,
      project_rid: projectDetails?.project_rid || '',
      project_fiscal_rid:
        projectDetails?.project_fiscal_rid ||
        projectid ||
        projectDetails?.rid ||
        '',
      fiscal_year: fiscalYear,
      account_rid: accountId,
      flag: 'project',
      search: searchText,
      assessment_type: showAssessmentToggle ? 'all' : 'fpa',
    },
    !viewDetails && !viewInteractionHistory && !viewInteractionAttachment,
    refreshInteractions
  );

  const {
    data: modelTableData,
    isLoading: isModelDataLoading,
    isError: isModelDataError,
  } = useInteractionListModel(
    {
      page: modelTableParms.page + 1,
      limit: modelTableParms.limit,
      sort: modelTableParms.sort,
      sort_by: modelTableParms.sort_by,
      filters: modelTableParms.filter,
      fiscal_year: fiscalYear,
      account_rid: accountId,
      flag: 'project',
      project_rid: projectDetails?.project_rid || '',
      project_fiscal_rid:
        projectDetails?.project_fiscal_rid ||
        projectid ||
        projectDetails?.rid ||
        '',
      reminder_specific_list: true,
    },
    reminderModalOpen || reInitiateModalOpen,
    refreshModelInteractions
  );

  useEffect(() => {
    if (reminderModalOpen || reInitiateModalOpen) {
      console.log(
        'modelTableData',

        isModelDataError
      );
    }
  }, [
    reminderModalOpen,
    reInitiateModalOpen,
    modelTableData,
    isModelDataLoading,
    isModelDataError,
    modelTableParms,
  ]);
  const totalItems = data?.count || 0;
  const interactionTypes = useGetInteractionTypes();
  const interactionResSources = useGetInteractionResponeSources();
  const interactionStatus = useGetInteractionStatus();
  const interactionStatusReminder = useGetInteractionStatusByReminder(true);
  const assessmentSource = useGetAssessmentSource();

  // Permissions
  const interactionsEnable = checkPermission(modules, AllModules.INTERACTIONS);
  const interactionsViewEnable = checkPermission(
    permission,
    AllPermissions.INTERACTIONS_VIEW_EDIT
  );
  const sendInteractionsEnable = checkPermission(
    permission,
    AllPermissions.SEND_INTERACTIONS
  );
  const createInteractionsEnable = checkPermission(
    permission,
    AllPermissions.INTERACTIONS_CREATE
  );

  const interactionsViewEditFields = useMemo(
    () =>
      permission?.find(
        (item) => item.name === AllPermissions.INTERACTIONS_VIEW_EDIT
      )?.fields ?? [],
    [permission]
  );

  const interactionFieldsEditable = useMemo(
    () =>
      permission
        .find((item) => item.name === AllPermissions.INTERACTIONS_VIEW_EDIT)
        ?.fields?.some((field) => field.edit),
    [permission]
  );

  const permissionMap = useMemo(() => {
    const map: Record<string, { read: boolean; edit: boolean }> = {};
    interactionsViewEditFields.forEach((item) => {
      map[item.name] = { read: item.read ?? false, edit: item.edit ?? false };
    });
    return map;
  }, [interactionsViewEditFields]);

  //Four part assessment permissions
  const fourPartAssessmentEditFields = useMemo(
    () =>
      permission?.find(
        (item) => item.name === AllPermissions.FOUR_PART_ASSESSMENT_VIEW_EDIT
      )?.fields ?? [],
    [permission]
  );

  const fourPartPermissionMap = useMemo(() => {
    const map: Record<string, { read: boolean; edit: boolean }> = {};
    fourPartAssessmentEditFields.forEach((item) => {
      map[item.name] = { read: item.read ?? false, edit: item.edit ?? false };
    });
    return map;
  }, [fourPartAssessmentEditFields]);

  const memoizedInteractionStatus = useMemo(
    () =>
      interactionStatus.data?.data.interactionStatus.map((status) => ({
        option: status.status_name,
        value: status.rid,
      })) || [],
    [interactionStatus.data?.data.interactionStatus]
  );
  const memoizedInteractionStatusReminder = useMemo(
    () =>
      interactionStatusReminder.data?.data.interactionStatus.map((status) => ({
        option: status.status_name,
        value: status.rid,
      })) || [],
    [interactionStatusReminder.data?.data.interactionStatus]
  );

  const memoizedInteractionTypes = useMemo(
    () =>
      interactionTypes.data?.data.interactionTypes.map((type) => ({
        option: type.interaction_type_name,
        value: type.rid,
      })) || [],
    [interactionTypes.data?.data.interactionTypes]
  );

  const memoizedInteractionResSources = useMemo(
    () =>
      interactionResSources.data?.data.responseSource.map((source) => ({
        option: source.response_source_name,
        value: source.rid,
      })) || [],
    [interactionResSources.data?.data.responseSource]
  );

  const assessmentSourceOptions = useMemo(() => {
    return (
      assessmentSource?.data?.data?.map((item) => ({
        value: item.rid,
        option: item.interaction_assessment_source_name,
      })) || []
    );
  }, [assessmentSource?.data?.data]);

  useEffect(() => {
    if (data) {
      const updatedInteractions =
        data.interactions?.map((item) => {
          const status = (item.status_name || '').toLowerCase();
          const recordStatus = (
            item.interaction_status_name || ''
          ).toLowerCase();
          const checkBoxMessage = getDisableReason(
            item.has_email_recipient,
            status,
            recordStatus,
            sendInteractionsEnable
          );
          return {
            ...item,
            disableCheckBox: !!checkBoxMessage,
            checkBoxMessage,
          };
        }) || [];
      localStorage.setItem(
        'currentRecipients',
        JSON.stringify({
          name: data?.keyContact?.key_contact_name || '',
          email: data?.keyContact?.key_contact_email || '',
        })
      );
      setInteractionList(updatedInteractions);
      setSelectedRows([]);
      setClearSelectedRows((prev) => !prev);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  useEffect(() => {
    if (interactionHistoryId) return;
    const updatedParams = {
      sortBy: sortField,
      filters: appliedFilters,
      page: currentPage,
      sortOrder: sortBy,
      limit: rowsPerPage,
      search: searchText,
    };
    setInteractionsParams({
      ...updatedParams,
      assessment_type: showAssessmentToggle ? 'all' : 'fpa',
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    sortField,
    showAssessmentToggle,
    appliedFilters,
    currentPage,
    rowsPerPage,
    sortBy,
    interactionHistoryId,
    searchText,
  ]);

  const handleRefresh = () => {
    setRefreshInteractions(Date.now());
  };
  const handleRefreshModel = () => {
    setRefreshModelInteractions(Date.now());
  };
  const handleFilter = () => {
    setShowFilter(!showFilter);
  };

  const handleSorting = (sortBy: string, sortOrder: 'asc' | 'desc') => {
    const defaultSortField = 'r_number';
    const defaultSortOrder = 'ASC';
    const apiOrder = sortOrder === 'asc' ? 'ASC' : 'DESC';

    if (!sortBy) {
      setSortFilterCount(0);
      setSortBy(defaultSortOrder);
      setSortField(defaultSortField);
    } else {
      setSortFilterCount(1);
      setSortBy(apiOrder);
      setSortField(sortBy);
    }
  };

  const handleCreate = () => {
    const path = generatePath(INTERACTIONS_CREATE, {
      module: 'project',
    });
    const queryParams = new URLSearchParams({
      accountId,
      source: 'project',
      projectDetails: JSON.stringify(projectData),
    });
    navigate(`${path}?${queryParams.toString()}`);
  };

  const handleEdit = (row: InteractionList) => {
    const path = generatePath(INTERACTIONS_EDIT, {
      module: 'project',
      interactionId: row.rid,
    });
    const queryParams = new URLSearchParams({
      accountId,
      source: 'project',
      projectDetails: JSON.stringify(projectData),
      project_fiscal_rid: row.project_fiscal_rid || '',
    });
    navigate(`${path}?${queryParams.toString()}`);
  };

  const headerButtons = [
    {
      label: 'New',
      variant: 'outlined' as const,
      disabled: accountInActive || rdQualified || isProjectSignedOff,
      onClick: () => handleCreate(),
      sx: { width: '48px', minWidth: '48px' },
      tooltipValue: 'Project type not allowed due to Configuration setting',
      toolTipEnabled: rdQualified,
      hide: !createInteractionsEnable || viewResponseHistory,
    },
    {
      label: 'Send Interaction',
      variant: 'outlined' as const,
      disabled:
        selectedRows.length === 0 ||
        accountInActive ||
        !isSendInteraction ||
        isProjectSignedOff,
      onClick: () => setSendModalOpen(true),
      sx: { width: '120px', minWidth: '120px' },
      hide: !sendInteractionsEnable || viewResponseHistory,
    },
    {
      label: 'Re-Initiate Interaction',
      variant: 'outlined' as const,
      disabled:
        accountInActive ||
        interactionList.length === 0 ||
        !isSendInteraction ||
        isProjectSignedOff,
      onClick: () => setReInitiateModalOpen(true),
      sx: { width: '160px', minWidth: '160px' },
      hide: viewResponseHistory,
    },
    {
      label: 'Reminder',
      variant: 'outlined' as const,
      disabled:
        accountInActive ||
        interactionList.length === 0 ||
        !isSendInteraction ||
        isProjectSignedOff,
      onClick: () => setReminderModalOpen(true),
      sx: { width: '80px', minWidth: '80px' },
      hide: viewResponseHistory,
    },
    {
      label: 'Show/Hide Fields',
      variant: 'outlined' as const,
      disabled: false,
      onClick: handleColumnVisibility,
      sx: { width: '125px', minWidth: '125px' },
      hide: Boolean(interactionResponseId),
    },
    {
      label: 'Back To Interaction Details',
      variant: 'contained' as const,
      onClick: () => handleBackFromResponse(),
      sx: { width: '175px', minWidth: '175px' },
      hide: Boolean(!viewResponseHistory),
    },
  ];

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    setSelectedRows([]);
    setClearSelectedRows((prev) => !prev);
  };

  const handleRowsPerPageChange = (newPageSize: number) => {
    setRowsPerPage(newPageSize);
    setCurrentPage(1);
  };

  const handleSortRequest = (property: string, sortOrder: 'asc' | 'desc') => {
    const apiOrder = sortOrder.toUpperCase() as 'ASC' | 'DESC';
    setSortBy(apiOrder);
    setSortField(property);
  };

  const handleSelectionChange = (selectedIds: string[]) => {
    const selectedData = interactionList.filter((row) =>
      selectedIds.includes(row.rid)
    );
    setSelectedRows(selectedData);
  };
  const handleModelFilter = () => {
    setModelShowFilter(!modelShowFilter);
  };
  const handleViewInteraction = (
    rowId: string,
    rNumber: string,
    proFiscalRid: string
  ) => {
    if (rowId) {
      searchParams.set('interaction_id', rowId);
      searchParams.set('interaction_number', rNumber);
      searchParams.set('project_fiscal_rid', proFiscalRid);
      navigate({ search: searchParams.toString() }, { replace: true });
      setSelectedRows([]);
      setCount(0);
      setClearSelectedRows((prev) => !prev);
      setSearchText('');
      setResetSearch(true);
    }
  };

  const handleViewInteractionHistory = (interactionHistoryId: string) => {
    if (interactionHistoryId) {
      searchParams.set('interaction_history_id', interactionHistoryId);
      navigate({ search: searchParams.toString() }, { replace: true });
      setSelectedRows([]);
      setClearSelectedRows((prev) => !prev);
      // Reset search when viewing interaction history
      setSearchText('');
      setResetSearch(true);
    }
  };

  const handleViewInteractionAttachmentCount = (
    interactionAttachmentCount: string | number,
    rowId: string,
    rNumber: string
  ) => {
    if (interactionAttachmentCount) {
      searchParams.set('interaction_rid', rowId);
      searchParams.set('interaction_number', rNumber);
      searchParams.set(
        'interaction_attachment_count',
        String(interactionAttachmentCount)
      );
      navigate({ search: searchParams.toString() }, { replace: true });
      setSelectedRows([]);
      setClearSelectedRows((prev) => !prev);
      setSearchText('');
      setResetSearch(true);
    }
  };

  const handleBackClick = () => {
    if (!interactionResponseId) {
      searchParams.delete('interaction_id');
      searchParams.delete('interaction_history_id');
      searchParams.delete('interaction_attachment_count');
      searchParams.delete('interaction_rid');
      searchParams.delete('interaction_number');
      searchParams.delete('project_fiscal_rid');
      navigate({ search: searchParams.toString() }, { replace: true });
      setSearchText('');
      setResetSearch(true);
    }
  };

  const handleBackFromResponse = () => {
    if (interactionResponseId) {
      searchParams.delete('versionID');
      navigate({ search: searchParams.toString() }, { replace: true });
    } else {
      searchParams.delete('history');
      searchParams.delete('interaction_attachment_id');
      navigate({ search: searchParams.toString() }, { replace: true });
    }
    // Reset search when navigating back from response
    setSearchText('');
    setResetSearch(true);
  };

  const handleSearchReset = () => {
    setResetSearch(false);
  };

  const interactionModelColumn = getProjectInteractionListModelColumns(
    // handleViewInteraction,
    permissionMap
  );
  const disableInteractionEditBtn = (row: InteractionList): boolean => {
    const status = (row.status_name || '').toLowerCase() as StatusTypeEnum;
    return [
      StatusTypeEnum.sent,
      StatusTypeEnum.response_draft,
      StatusTypeEnum.response_received,
      StatusTypeEnum.inqueue,
    ].includes(status);
  };

  const actionButtons: ActionItem<InteractionList>[] = [
    {
      label: 'Edit',
      onClick: (row: InteractionList) => handleEdit(row),
      icon: EditIcon,
      hide: !interactionFieldsEditable,
      disabled: (row: InteractionList) =>
        isProjectSignedOff || accountInActive || disableInteractionEditBtn(row),
      iconStyle: {
        filter:
          'brightness(0) saturate(100%) invert(25%) sepia(16%) saturate(592%) hue-rotate(164deg) brightness(93%) contrast(91%)',
      },
    },
  ];
  const handleReminderBtn = (data: InteractionList[]) => {
    const interactions = data.map((item) => ({
      interaction_rid: item.rid || '',
      interaction_level: item.interaction_level_name || '',
      project_fiscal_rid: item.project_fiscal_rid || '',
    }));

    const payload = {
      account_rid: accountId || '',
      is_interaction_followup: true,
      interactions,
      email_info: {
        name: '',
        email: '',
      },
    };

    sendInteraction.mutate(payload, {
      onSuccess: (response) => {
        successToast(response?.statusMessage);
        setReminderModalOpen(false);
        setModdelTableParms({
          page: 0,
          limit: 100,
          sort: 'r_number',
          sort_by: 'ASC',
          filter: {},
        });
        refetch();
      },
    });
  };

  const handleReInitiateBtn = (
    data: InteractionList[],
    recipient?: { name: string; email: string }
  ) => {
    const interactions = data.map((item) => ({
      interaction_rid: item.rid || '',
      interaction_level: item.interaction_level_name || '',
      project_fiscal_rid: item.project_fiscal_rid || '',
    }));

    const payload = {
      account_rid: accountId || '',
      interactions,
      email_info: {
        email: recipient?.email.trim() || '',
        name: recipient?.name.trim() || recipient?.email.split('@')[0] || '',
      },
      is_interaction_reinitiated: true,
    };

    sendInteraction.mutate(payload, {
      onSuccess: (response) => {
        successToast(response?.statusMessage);
        handleCloseReInitiate();
        refetch();
      },
    });
  };

  const handleCloseReInitiate = () => {
    setReInitiateModalOpen(false);
    setModdelTableParms({
      page: 0,
      limit: 100,
      sort: 'r_number',
      sort_by: 'ASC',
      filter: {},
    });
  };

  const handleClose = () => {
    setReminderModalOpen(false);
    setModdelTableParms({
      page: 0,
      limit: 100,
      sort: 'r_number',
      sort_by: 'ASC',
      filter: {},
    });
  };

  const handleToggleRecordStatus = (row: InteractionList, checked: boolean) => {
    const status_name = checked ? 'Active' : 'In-Active';

    // Optimistic UI update — reflect the change instantly
    const previousList = interactionList;
    setInteractionList((prev) =>
      prev.map((item) =>
        item.rid === row.rid
          ? { ...item, interaction_status_name: status_name }
          : item
      )
    );

    updateInteractionStatus.mutate(
      {
        rid: row.rid,
        status_name,
        account_rid: accountId,
      },
      {
        onSuccess: (response) => {
          successToast(
            response?.statusMessage || 'Interaction Status updated successfully'
          );
          refetch();
        },
        onError: () => {
          // Revert to previous state on failure
          setInteractionList(previousList);
          errorToast('Failed to update interaction status');
        },
      }
    );
  };

  const handleFourPartNavigation = (row: InteractionList) => {
    if (!row.four_part_assessment_rid) return;

    const path = generatePath(PROJECT_DETAILS, {
      projectid: projectid || '',
    });

    searchParams.set('list', 'four_part_assessment');
    searchParams.set('fpa_id', row.four_part_assessment_rid);
    searchParams.set('navigate_source', 'interactions');

    navigate(`${path}?${searchParams.toString()}`, {
      state: { activeKey: 'four_part_assessment' },
      replace: true,
    });
  };

  const getRowId = (row: InteractionList) => row.rid;
  const interactionColumns = getInteractionListColumns(
    handleViewInteraction,
    handleViewInteractionHistory,
    handleViewInteractionAttachmentCount,
    permissionMap,
    fourPartPermissionMap,
    handleToggleRecordStatus,
    handleFourPartNavigation
  );

  const filterFields = !viewInteractionHistory
    ? getInteractionFilterFields(
        memoizedInteractionTypes,
        memoizedInteractionResSources,
        memoizedInteractionStatus,
        permissionMap,
        fourPartPermissionMap,
        assessmentSourceOptions
      )
    : getInteractionHistoryFilterFields(memoizedInteractionStatus);
  const modelFIlterFields = getProjectInteractionFilterFields(
    memoizedInteractionStatusReminder,
    permissionMap
  );
  const RestrictedColumns = [
    {
      id: 'r_number',
      canHide: false,
      canDrag: false,
    },
    {
      id: 'status_action',
      canHide: false,
      canDrag: false,
    },
  ];

  const [columnVisibility, setColumnVisibility] = useState<
    Record<string, boolean>
  >(Object.fromEntries(interactionColumns.map((col) => [col.id, !col.hide])));

  const [columnOrder, setColumnOrder] = useState(
    interactionColumns.map((col) => col.id)
  );

  if (!interactionsEnable || !interactionsViewEnable)
    return <AccessRestricted />;

  const handleColumnsChange = (updatedColumns: ShowHideTableColumn[]) => {
    const newVisibility = Object.fromEntries(
      updatedColumns.map((col) => [col.id, !col.hide])
    );
    setColumnVisibility(newVisibility);
    setColumnOrder(updatedColumns.map((col) => col.id));
  };

  const visibleColumns = columnOrder
    .map((id) => interactionColumns.find((col) => col.id === id)!)
    .filter((col) => columnVisibility[col.id]);

  const handlePopoverClose = () => {
    setColumnAnchorEl(null);
  };

  const modalId = isModalOpen
    ? 'interaction-list-column-visibility-popover'
    : undefined;

  if (!interactionsEnable || !interactionsViewEnable)
    return <AccessRestricted />;

  return (
    <div className='w-full'>
      {!isSendInteraction && !loading && (
        <Box className='flex items-center gap-1.5 h-8 border-b border-[#FFC77B] bg-[#FEF8F0] text-[13px] text-[#2D3E4F] px-3 py-2 border-box'>
          <Box>
            <DetailsKeyContactErrorIcon alt='key-contact' />
          </Box>
          <Box>
            <span className='font-bold mr-1'>Interaction Details </span> -{' '}
            <span className='ml-1 font-medium'>
              {' '}
              {`Global account email configuration missing. Please set it to enable interactions and reminders.`}
            </span>
          </Box>
        </Box>
      )}
      <div className='w-full pt-2 pl-2 pr-4'>
        <SectionTabPanel
          tabs={InteractionsTabs}
          filterMenu={filterFields}
          filterVisibility={!viewDetails && !viewInteractionAttachment}
          showFilter={showFilter}
          contextKey='project-interactions'
          appliedFilters={appliedFilters}
          setAppliedFilters={setAppliedFilters}
          setCurrentPage={setCurrentPage}
          handleFilter={handleFilter}
          handleSorting={handleSorting}
          sortFilterCount={sortFilterCount}
          setSortFilterCount={setSortFilterCount}
          showRefresh={!viewDetails}
          onRefreshClick={handleRefresh}
          showSearch={
            viewResponseHistory || (!viewDetails && !viewInteractionHistory)
          }
          onSearch={(text) => setSearchText(text)}
          searchReset={resetSearch}
          onSearchReset={handleSearchReset}
          showAddActivity={
            !viewDetails &&
            !viewInteractionAttachment &&
            !viewInteractionHistory
          }
          activityMenuItems={activityMenuItems}
          showToggle={
            !viewDetails &&
            !viewInteractionAttachment &&
            !viewInteractionHistory &&
            !viewResponseHistory
          }
          toggleLabel={'To include RD Assessment'}
          toggleEnabled={showAssessmentToggle}
          setToggleEnabled={setShowAssessmentToggle}
        />
        {isTimeLineView ? (
          <div className='border border-[#CBD6E2] rounded-[2px] overflow-auto'>
            <Timeline entitytype='project' />
          </div>
        ) : (
          <>
            {viewDetails && !viewResponseHistory ? (
              <InteractionDetails
                accountInActive={accountInActive}
                handleBackClick={handleBackClick}
                projectDetails={projectDetails}
                isSendInteraction={isSendInteraction}
                isProjectSignedOff={isProjectSignedOff}
              />
            ) : viewInteractionHistory ? (
              <InteractionHistory
                handleBackClick={handleBackClick}
                accountInActive={accountInActive}
                refresh={refreshInteractions}
                appliedFilters={appliedFilters}
                setInteractionsParams={setInteractionsParams}
              />
            ) : viewInteractionAttachment ? (
              <InteractionAttachment
                handleBackClick={handleBackClick}
                refresh={refreshInteractions}
                searchValue={searchText}
              />
            ) : (
              <>
                <SectionHeader
                  title={
                    viewResponseHistory
                      ? `Interaction Response History ${interactionNumber}`
                      : 'Interactions'
                  }
                  titleIcon={
                    <InteractionsIcon
                      alt='financial-header-icon'
                      className={`[&>path]:stroke-[${ColorCode.accountTextColor}] w-[14px] h-[14px]`}
                    />
                  }
                  count={viewResponseHistory ? count : totalItems}
                  showItemCount={interactionResponseId ? false : true}
                  buttons={headerButtons}
                  iconBg={ColorCode.projectBgColor}
                  bgType='circle'
                />
                <div className='border border-[#CBD6E2]'>
                  {!viewResponseHistory ? (
                    <>
                      <ManageColumnsPopover
                        anchorEl={columnAnchorEl}
                        open={isModalOpen}
                        popoverId={modalId}
                        onClose={handlePopoverClose}
                        columns={interactionColumns}
                        onColumnsChange={handleColumnsChange}
                        columnRestrictions={RestrictedColumns}
                      />
                      <ListTable
                        data={interactionList}
                        columns={visibleColumns}
                        getRowId={getRowId}
                        hoverHighlight={false}
                        tableStyle={{
                          borderBottom: '1px solid #CBD6E2',
                          height: '100%',
                          maxHeight: 'calc(100vh - 380px)',
                          overflow: 'auto',
                        }}
                        stickyHeader={true}
                        stickyColumnsCount={1}
                        selectable={true}
                        onSelectionChange={handleSelectionChange}
                        actionWidth={80}
                        actionDisplayMode='dropdown'
                        actionMenuItems={actionButtons}
                        loading={isLoading || !fiscalYear}
                        error={isError ? 'Failed to load data' : undefined}
                        rowsPerPageOptions={[25, 50, 100]}
                        rowsPerPage={rowsPerPage}
                        currentPage={currentPage}
                        totalItems={totalItems}
                        onPageChange={handlePageChange}
                        onRowsPerPageChange={handleRowsPerPageChange}
                        sortBy={sortField}
                        sortOrder={sortBy}
                        onSort={handleSortRequest}
                        clearSelectedRows={clearSelectedRows}
                      />
                    </>
                  ) : (
                    <HistoryTable
                      setCount={setCount}
                      setColumnAnchorEl={setColumnAnchorEl}
                      columnAnchorEl={columnAnchorEl}
                      searchValue={searchText}
                    />
                  )}
                  <SendInteractionModal
                    isOpen={sendModalOpen}
                    onClose={() => setSendModalOpen(false)}
                    selectedRows={selectedRows}
                    onSuccessRefetch={handleRefresh}
                  />
                  <TableModal
                    title='Reminder Interaction'
                    contextKey='project-interactions'
                    isOpen={reminderModalOpen}
                    onClose={handleClose}
                    data={modelTableData?.interactions}
                    loading={isModelDataLoading}
                    isError={isModelDataError}
                    visibleColumns={interactionModelColumn}
                    totalCount={modelTableData?.count || 0}
                    tableParms={modelTableParms}
                    setTableParms={setModdelTableParms}
                    handleSend={handleReminderBtn}
                    handleFilter={handleModelFilter}
                    onRefreshClick={handleRefreshModel}
                    saveBtnLoading={sendInteraction.isPending}
                    showRefresh={true}
                    filterVisibility={modelShowFilter}
                    showFilter={true}
                    filterMenu={modelFIlterFields}
                    emptyMessage='No interaction available to send reminder'
                  />
                  <ReInitiateModal
                    title='Re-Initiate Interaction'
                    contextKey='Project-reinitiate-interactions'
                    isOpen={reInitiateModalOpen}
                    onClose={handleCloseReInitiate}
                    data={modelTableData?.interactions}
                    loading={isModelDataLoading}
                    isError={isModelDataError}
                    visibleColumns={interactionModelColumn}
                    totalCount={modelTableData?.count || 0}
                    tableParms={modelTableParms}
                    setTableParms={setModdelTableParms}
                    handleSend={handleReInitiateBtn}
                    handleFilter={handleModelFilter}
                    onRefreshClick={handleRefreshModel}
                    saveBtnLoading={sendInteraction.isPending}
                    showRefresh={true}
                    filterVisibility={modelShowFilter}
                    showFilter={true}
                    filterMenu={modelFIlterFields}
                    emptyMessage='No interaction available to re-initiate'
                  />
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Interactions;
