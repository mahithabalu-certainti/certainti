/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useMemo, useState } from 'react';
import {
  AllModules,
  AllPermissions,
  OverviewTabs,
  useGetInteractionLevel,
  useGetInteractionResponeSources,
  useGetInteractionStatus,
  useGetInteractionStatusByReminder,
  useGetInteractionTypes,
} from '../../../../../common-service';
import {
  generatePath,
  useNavigate,
  useParams,
  useSearchParams,
} from 'react-router-dom';
import {
  ActivityDropdownItem,
  ColorCode,
  ExportType,
  InteractionList,
  StatusTypeEnum,
} from '../../../../types';
import {
  useInteractionList,
  useInteractionListModel,
  useSendInteraction,
  useUpdateInteractionStatus,
} from '../../../../services/interactions/interactions-service';
import {
  ACCOUNT_DETAILS,
  ACCOUNT_INTERACTIONS_CREATE,
  INTERACTIONS_EDIT,
} from '../../../../../routes';
import {
  ActionItem,
  ShowHideTableColumn,
} from '../../../../../components/table/types';
import {
  DetailsKeyContactErrorIcon,
  EditIcon,
  InteractionsIcon,
} from '../../../../../assets';
import { getInteractionListColumns } from './columns';
import {
  getInteractionFilterFields,
  getInteractionModelFilterFields,
} from './helpers';
import {
  ReInitiateModal,
  SectionTabPanel,
  SendInteractionModal,
} from '../../../../../components';
import InteractionDetails from './interaction-details/interaction-details';
import SectionHeader from '../../../../../components/details-section/section-header';
import {
  ListTable,
  ManageColumnsPopover,
} from '../../../../../components/table';
import { accountDetailsProps } from '../../../account-details/utils';
import { RootState } from '../../../../../store/store';
import { useSelector } from 'react-redux';
import { InteractionHistory } from './interaction-history';
import { InteractionAttachment } from './interaction-attachment';
import HistoryTable from './response-history/history-table';
import { getInteractionHistoryFilterFields } from './interaction-history/helper';
import { AttachmentsListExportParams } from '../../../../types/attachment';
import { checkPermission, getDisableReason } from '../../../../../common-utils';
import { AccessRestricted } from '../../../../../components/account-restricted';
import TableModal from '../../../../../components/table/model-table';
import { getInteractionListModelColumns } from './modelColumns';
import { useToast } from '../../../../../hooks';
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
  accountDetails?: accountDetailsProps;
  setExportType?: (type: ExportType) => void;
  setInteractionsParams: React.Dispatch<
    React.SetStateAction<AttachmentsListExportParams>
  >;
  loading: boolean;
  activityMenuItems: ActivityDropdownItem[];
}

const Interactions: React.FC<InteractionsProps> = ({
  accountInActive,
  accountDetails,
  setExportType,
  setInteractionsParams,
  loading,
  activityMenuItems,
}) => {
  const { accountid } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const interactionEnable = accountDetails?.accountDetails?.is_send_interaction;

  const [appliedFilters, setAppliedFilters] = useState<
    Record<string, string | number | boolean | string[]>
  >({});
  const [refreshInteractions, setRefreshInteractions] = useState<number>(
    Date.now()
  );
  const [refreshModelInteractions, setRefreshModelInteractions] =
    useState<number>(Date.now());
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [rowsPerPage, setRowsPerPage] = useState(100);
  const [sortField, setSortField] = useState<string>('r_number');
  const [sortBy, setSortBy] = useState<'ASC' | 'DESC'>('ASC');
  const [showFilter, setShowFilter] = useState<boolean>(false);
  const [sortFilterCount, setSortFilterCount] = useState<number>(0);
  const [modelShowFilter, setModelShowFilter] = useState<boolean>(false);
  const [interactionList, setInteractionList] = useState<InteractionList[]>([]);
  const [count, setCount] = useState<number>(0);
  const [sendModalOpen, setSendModalOpen] = useState(false);
  const [reminderModalOpen, setReminderModalOpen] = useState(false);
  const [selectedRows, setSelectedRows] = useState<InteractionList[]>([]);
  const [clearSelectedRows, setClearSelectedRows] = useState<boolean>(false);
  const [columnAnchorEl, setColumnAnchorEl] =
    React.useState<HTMLButtonElement | null>(null);
  const [modelTableParms, setModdelTableParms] = useState<ModelTableParams>({
    page: 0,
    limit: 100,
    sort: 'r_number',
    sort_by: 'ASC',
    filter: {},
  });
  const [reInitiateModalOpen, setReInitiateModalOpen] = useState(false);
  const isTimeLineView = searchParams.get('timelineview') === 'true';
  const isModalOpen = Boolean(columnAnchorEl);
  const handleColumnVisibility = (
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    setColumnAnchorEl(event.currentTarget);
  };
  const { fiscalYear } = useSelector<RootState, { fiscalYear: string }>(
    (state: RootState) => state.account
  );
  const { permission, modules } = useSelector(
    (state: RootState) => state.permission
  );
  const [searchText, setSearchText] = useState('');
  const [resetSearch, setResetSearch] = useState(false);
  const newFiscalYear = fiscalYear !== 'FY-All' ? Number(fiscalYear) : 0;
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
  const { successToast, errorToast } = useToast();
  const sendInteraction = useSendInteraction();
  const { data, isLoading, isError, refetch } = useInteractionList(
    {
      page: currentPage + 1,
      limit: rowsPerPage,
      sort: sortField,
      sort_by: sortBy,
      filters: appliedFilters,
      account_rid: accountid || '',
      fiscal_year: newFiscalYear,
      search: searchText,
      flag: 'account',
    },
    !viewDetails &&
      !viewInteractionHistory &&
      !viewInteractionAttachment &&
      !viewResponseHistory,
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
      account_rid: accountid || '',
      fiscal_year: newFiscalYear,
      flag: 'account',
      reminder_specific_list: true,
    },
    reminderModalOpen || reInitiateModalOpen,
    refreshModelInteractions
  );

  useEffect(() => {
    if (reminderModalOpen || reInitiateModalOpen) {
      console.log('modelTableData', isModelDataError);
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
  const interactionStatus = useGetInteractionStatus();
  const interactionStatusReminder = useGetInteractionStatusByReminder(true);
  const interactionLevel = useGetInteractionLevel();
  const interactionResSources = useGetInteractionResponeSources();
  const updateInteractionStatus = useUpdateInteractionStatus();

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
  const projectListViewEditFields = useMemo(
    () =>
      permission.find((item) => item.name === AllPermissions.PROJECTS_VIEW_EDIT)
        ?.fields ?? [],
    [permission]
  );

  const projectPermissionMap = useMemo(() => {
    const map: Record<string, { read: boolean; edit: boolean }> = {};
    projectListViewEditFields.forEach((item) => {
      map[item.name] = { read: item.read ?? false, edit: item.edit ?? false };
    });
    return map;
  }, [projectListViewEditFields]);
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
  const memoizedInteractionLevel = useMemo(
    () =>
      interactionLevel.data?.data.interactionLevel.map((status) => ({
        option: status.interaction_level_name,
        value: status.rid,
      })) || [],
    [interactionLevel.data?.data.interactionLevel]
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

  useEffect(() => {
    if (data) {
      setCount(data.count || 0);
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
    if (setExportType) {
      setExportType('interactions');
    }
    if (interactionHistoryId) {
      return;
    }
    const updatedParams = {
      sortBy: sortField,
      filters: appliedFilters,
      page: currentPage,
      sortOrder: sortBy,
      limit: rowsPerPage,
      search: searchText,
    };
    setInteractionsParams(updatedParams);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortField, appliedFilters, currentPage, rowsPerPage, sortBy, searchText]);

  const handleRefresh = () => {
    setRefreshInteractions(Date.now());
  };
  const handleRefreshModel = () => {
    setRefreshModelInteractions(Date.now());
  };
  const handleFilter = () => {
    setShowFilter(!showFilter);
  };
  const handleModelFilter = () => {
    setModelShowFilter(!modelShowFilter);
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
    const accountId = accountid ?? '';
    const path = generatePath(ACCOUNT_INTERACTIONS_CREATE, {
      module: 'account',
    });
    const queryParams = new URLSearchParams({
      accountId,
      account_name: accountDetails?.accountById?.account_name || '',
    });
    navigate(`${path}?${queryParams.toString()}`);
  };
  const handleEdit = (row: InteractionList) => {
    const accountId = accountid ?? '';
    const path = generatePath(INTERACTIONS_EDIT, {
      module: 'account',
      interactionId: row.rid,
    });
    const queryParams = new URLSearchParams({
      accountId,
      source: 'account',
      account_name: accountDetails?.accountById?.account_name || '',
      level: row.interaction_level_name ?? '',
    });
    navigate(`${path}?${queryParams.toString()}`);
  };

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

  const handleViewInteraction = (rowId: string, rNumber: string) => {
    if (rowId) {
      searchParams.set('interaction_id', rowId);
      searchParams.set('interaction_number', rNumber);
      navigate({ search: searchParams.toString() }, { replace: true });
      setSelectedRows([]);
      setClearSelectedRows((prev) => !prev);
      setCount(0);
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
    setSearchText('');
    setResetSearch(true);
  };
  const handleSearchReset = () => {
    setResetSearch(false);
  };

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
        accountInActive || disableInteractionEditBtn(row),
      iconStyle: {
        filter:
          'brightness(0) saturate(100%) invert(25%) sepia(16%) saturate(592%) hue-rotate(164deg) brightness(93%) contrast(91%)',
      },
    },
  ];
  const getRowId = (row: InteractionList) => row.rid;
  const handleViewInteractionHistory = (interactionHistoryId: string) => {
    if (interactionHistoryId) {
      searchParams.set('interaction_history_id', interactionHistoryId);
      navigate({ search: searchParams.toString() }, { replace: true });
      setSelectedRows([]);
      setClearSelectedRows((prev) => !prev);
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
      account_rid: accountid || '',
      interactions,
      email_info: {
        email: recipient?.email.trim() || '',
        name: recipient?.name.trim() || recipient?.email.split('@')[0] || '',
      },
    };

    sendInteraction.mutate(payload, {
      onSuccess: (response) => {
        successToast(response?.statusMessage);
        handleCloseReInitiate();
        refetch();
      },
    });
  };

  const headerButtons = [
    {
      label: 'New',
      variant: 'outlined' as const,
      disabled: accountInActive,
      onClick: () => handleCreate(),
      sx: { width: '48px', minWidth: '48px' },
      hide: !createInteractionsEnable || viewResponseHistory,
    },
    {
      label: 'Send Interaction',
      variant: 'outlined' as const,
      disabled:
        selectedRows.length === 0 ||
        accountInActive ||
        !accountDetails?.accountDetails?.is_send_interaction,
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
        !accountDetails?.accountDetails?.is_send_interaction,
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
        !accountDetails?.accountDetails?.is_send_interaction,
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
      hide: Boolean(!responseHistory),
    },
  ];

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
        account_rid: accountid || '',
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

    const path = generatePath(ACCOUNT_DETAILS, {
      accountid: accountid || '',
    });

    searchParams.set('list', 'four_part_assessment');
    searchParams.set('fpa_id', row.four_part_assessment_rid);
    searchParams.set('navigate_source', 'interactions');

    navigate(`${path}?${searchParams.toString()}`, {
      state: { activeKey: 'four_part_assessment' },
      replace: true,
    });
  };

  const interactionColumns = getInteractionListColumns(
    handleViewInteraction,
    handleViewInteractionHistory,
    handleViewInteractionAttachmentCount,
    permissionMap,
    projectPermissionMap,
    handleToggleRecordStatus,
    handleFourPartNavigation
  );
  const interactionModelColumn = getInteractionListModelColumns(
    // handleViewInteraction,
    permissionMap
  );
  const filterFields = !viewInteractionHistory
    ? getInteractionFilterFields(
        memoizedInteractionTypes,
        memoizedInteractionResSources,
        memoizedInteractionStatus,
        memoizedInteractionLevel,
        permissionMap,
        projectPermissionMap
      )
    : getInteractionHistoryFilterFields(memoizedInteractionStatus);
  const modelFIlterFields = getInteractionModelFilterFields(
    memoizedInteractionStatusReminder,
    memoizedInteractionLevel,
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

  if (!interactionsEnable || !interactionsViewEnable)
    return <AccessRestricted />;

  const handlePopoverClose = () => {
    setColumnAnchorEl(null);
  };
  const handleReminderBtn = (data: InteractionList[]) => {
    // Map your input array into interactions

    const interactions = data.map((item) => ({
      interaction_rid: item.rid || '',
      interaction_level: item.interaction_level_name || '',
      project_fiscal_rid: item.project_fiscal_rid || '',
    }));

    const payload = {
      account_rid: accountid || '',
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

  const modalId = isModalOpen
    ? 'account-interaction-list-column-visibility-popover'
    : undefined;

  return (
    <div className='w-full'>
      {!interactionEnable && !loading && (
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
          searchDisabled={false}
          searchPlaceholder='Search'
          onSearch={(text) => setSearchText(text)}
          searchReset={resetSearch}
          onSearchReset={handleSearchReset}
          showAddActivity={
            !viewDetails &&
            !viewInteractionAttachment &&
            !viewInteractionHistory
          }
          activityMenuItems={activityMenuItems}
        />
        {isTimeLineView ? (
          <div className='border border-[#CBD6E2] rounded-[2px] overflow-auto'>
            <Timeline entitytype='account' />
          </div>
        ) : (
          <>
            {viewDetails && !viewResponseHistory ? (
              <InteractionDetails
                accountInActive={accountInActive}
                handleBackClick={handleBackClick}
                accountDetails={accountDetails}
              />
            ) : viewInteractionHistory ? (
              <InteractionHistory
                handleBackClick={handleBackClick}
                appliedFilters={appliedFilters}
                refresh={refreshInteractions}
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
                      : 'Interaction'
                  }
                  titleIcon={
                    <InteractionsIcon
                      alt='interaction-icon'
                      className={`[&>path]:stroke-[${ColorCode.accountTextColor}] w-[14px] h-[14px]`}
                    />
                  }
                  count={viewResponseHistory ? count : totalItems}
                  showItemCount={interactionResponseId ? false : true}
                  showBackArrow={viewResponseHistory}
                  onBackClick={handleBackFromResponse}
                  buttons={headerButtons}
                  iconBg={ColorCode.accountBgColor}
                  bgType='circle'
                />
                <div className='border border-[#CBD6E2]'>
                  {viewResponseHistory ? (
                    <HistoryTable
                      setCount={setCount}
                      setColumnAnchorEl={setColumnAnchorEl}
                      columnAnchorEl={columnAnchorEl}
                      searchValue={searchText}
                    />
                  ) : (
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
                          maxHeight: 'calc(100vh - 330px)',
                          overflow: 'auto',
                        }}
                        stickyHeader={true}
                        stickyColumnsCount={1}
                        selectable={true}
                        onSelectionChange={handleSelectionChange}
                        actionWidth={80}
                        actionDisplayMode='dropdown'
                        actionMenuItems={actionButtons}
                        loading={isLoading}
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
                  )}
                  <SendInteractionModal
                    isOpen={sendModalOpen}
                    onClose={() => setSendModalOpen(false)}
                    selectedRows={selectedRows}
                    onSuccessRefetch={handleRefresh}
                  />
                  <TableModal
                    title='Reminder Interaction'
                    contextKey='Account-interactions'
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
                    contextKey='Account-reinitiate-interactions'
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
