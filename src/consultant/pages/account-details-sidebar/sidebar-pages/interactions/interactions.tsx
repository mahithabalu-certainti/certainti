import React, { useEffect, useMemo, useState } from 'react';
import {
  AllModules,
  AllPermissions,
  OverviewTabs,
  useGetInteractionStatus,
  useGetInteractionTypes,
  useGetStatus,
} from '../../../../../common-service';
import {
  generatePath,
  useNavigate,
  useParams,
  useSearchParams,
} from 'react-router-dom';
import { ExportType, InteractionList, StatusTypeEnum } from '../../../../types';
import { useAccountInteractionList } from '../../../../services/interactions/interactions-service';
import { INTERACTIONS_CREATE, INTERACTIONS_EDIT } from '../../../../../routes';
import {
  ActionItem,
  ShowHideTableColumn,
} from '../../../../../components/table/types';
import {
  EditIcon,
  InteractionDetailIcon,
  ProjectsSideIcon,
} from '../../../../../assets';
import { getInteractionListColumns, getProjectColumns } from './columns';
import { getInteractionFilterFields, projectFilterFields } from './helpers';
import { SectionTabPanel } from '../../../../../components';
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
import { checkPermission } from '../../../../../common-utils';
import { AccessRestricted } from '../../../../../components/account-restricted';
import {
  useAccountProjects,
  useGetProjectType,
} from '../../../../services/project';
import { Project, ProjectFiscalSummary } from '../../../../types/project';
import { useFetchClassification } from '../../../../services/account';
import SendInteractionAlert from './interaction-alert';

const InteractionsTabs: OverviewTabs[] = [
  {
    id: AllPermissions.INTERACTIONS_OVERVIEW,
    name: 'Overview',
    hide: false,
  },
  // {
  //   id: AllPermissions.INTERACTIONS_TIMELINE,
  //   name: 'Timeline',
  //   hide: false,
  //   disable: true,
  // },
];

interface InteractionsProps {
  accountInActive: boolean;
  accountDetails?: accountDetailsProps;
  setExportType?: (type: ExportType) => void;
  setInteractionsParams: React.Dispatch<
    React.SetStateAction<AttachmentsListExportParams>
  >;
}

const Interactions: React.FC<InteractionsProps> = ({
  accountInActive,
  accountDetails,
  setExportType,
  setInteractionsParams,
}) => {
  const { accountid } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [appliedFilters, setAppliedFilters] = useState<
    Record<string, string | number | boolean | string[]>
  >({});
  const [refreshInteractions, setRefreshInteractions] = useState<number>(
    Date.now()
  );
  const [refreshProject, setRefreshProject] = useState<number>(Date.now());
  const [selectedTableId, setSelectedTableIds] = useState<
    ProjectFiscalSummary[]
  >([]);
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [projectPage, setProjectPage] = useState<number>(0);
  const [rowsPerPage, setRowsPerPage] = useState(100);
  const [projectRowsPerPage, setProjectRowsPerPage] = useState(100);
  const [sortField, setSortField] = useState<string>('r_number');
  const [projectSortField, setProjectSortField] =
    useState<string>('project_code');
  const [sortBy, setSortBy] = useState<'ASC' | 'DESC'>('ASC');
  const [projectSortOrder, setProjectSortOrder] = useState<'ASC' | 'DESC'>(
    'ASC'
  );
  const [projectList, setProjectList] = useState<Project[]>([]);
  const [showFilter, setShowFilter] = useState<boolean>(false);
  const [sortFilterCount, setSortFilterCount] = useState<number>(0);
  const [interactionList, setInteractionList] = useState<InteractionList[]>([]);
  const [count, setCount] = useState<number>(0);
  const [sendModalOpen, setSendModalOpen] = useState(false);
  const [selectedRows, setSelectedRows] = useState<InteractionList[]>([]);
  const [clearSelectedRows, setClearSelectedRows] = useState<boolean>(false);
  const [columnAnchorEl, setColumnAnchorEl] =
    React.useState<HTMLButtonElement | null>(null);
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
  const newFiscalYear = fiscalYear !== 'FY-All' ? Number(fiscalYear) : 0;
  const sendInteraction = searchParams.get('send_intraction');
  const viewProject = searchParams.get('view_proj');
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

  const allProject = useAccountProjects(
    {
      page: projectPage + 1,
      limit: projectRowsPerPage,
      sortBy: projectSortField,
      sortOrder: projectSortOrder,
      filters: appliedFilters,
      fiscalYear: newFiscalYear,
      accountNumber: accountid ?? accountDetails?.accountDetails?.account_rid,
      bothParentAndChild: false,
      apiSource: viewProject ? 'interactionCount' : 'interaction',
      accountInteractionId: (viewProject || sendInteraction) as string,
    },
    Boolean(sendInteraction || viewProject),
    refreshProject
  );
  const { data, isLoading, isError } = useAccountInteractionList(
    {
      page: currentPage + 1,
      limit: rowsPerPage,
      sort_order: sortBy,
      sort_by: sortField,
      filters: appliedFilters,
      account_rid: accountid || '',
    },
    !viewDetails &&
      !viewInteractionHistory &&
      !viewInteractionAttachment &&
      !viewResponseHistory &&
      !sendInteraction &&
      !viewProject,
    refreshInteractions
  );
  const totalItems = data?.count || 0;
  const projectTotalItems = allProject.data?.count || 0;
  const interactionTypes = useGetInteractionTypes();
  const interactionStatus = useGetInteractionStatus();
  const Classification = useFetchClassification();
  const projectTypeOptions = useGetProjectType();
  const statusOptions = useGetStatus();

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
  const projectViewEditFields = useMemo(
    () =>
      permission.find((item) => item.name === AllPermissions.PROJECTS_VIEW_EDIT)
        ?.fields ?? [],
    [permission]
  );
  const permissionMap = useMemo(() => {
    const map: Record<string, { read: boolean; edit: boolean }> = {};
    interactionsViewEditFields.forEach((item) => {
      map[item.name] = { read: item.read ?? false, edit: item.edit ?? false };
    });
    return map;
  }, [interactionsViewEditFields]);
  const projectPermissionMap = useMemo(() => {
    const map: Record<string, { read: boolean; edit: boolean }> = {};
    projectViewEditFields.forEach((item) => {
      map[item.name] = { read: item.read ?? false, edit: item.edit ?? false };
    });
    return map;
  }, [projectViewEditFields]);
  const memoizedStatus = useMemo(
    () =>
      statusOptions?.data?.data?.status.map((status) => ({
        option: status.status_name,
        value: status.rid,
      })) || [],
    [statusOptions?.data?.data?.status]
  );
  const memoizedInteractionStatus = useMemo(
    () =>
      interactionStatus.data?.data.interactionStatus.map((status) => ({
        option: status.status_name,
        value: status.rid,
      })) || [],
    [interactionStatus.data?.data.interactionStatus]
  );
  const memoizedInteractionTypes = useMemo(
    () =>
      interactionTypes.data?.data.interactionTypes.map((type) => ({
        option: type.interaction_type_name,
        value: type.rid,
      })) || [],
    [interactionTypes.data?.data.interactionTypes]
  );
  const memoizedClassification = useMemo(
    () =>
      Classification.data?.data.projectClassifications.map((data) => ({
        option: data.classification_name,
        value: data.classification_name,
      })) || [],
    [Classification.data?.data.projectClassifications]
  );
  const memoizedProjectTypes = useMemo(
    () =>
      projectTypeOptions?.data?.data?.projectType.map((item) => ({
        option: item.project_type_name,
        value: item.rid,
      })) || [],
    [projectTypeOptions?.data?.data?.projectType]
  );

  useEffect(() => {
    if (allProject.data?.projects) {
      setProjectList(
        allProject.data?.projects.map((it) => {
          return {
            ...it,
            disableCheckBox: it.ProjectFiscal.find(
              (item) => item.isInteractionMapped
            ),
            ProjectFiscal: it.ProjectFiscal.map((item) => {
              return {
                ...item,
                disableCheckBox: item.isInteractionMapped,
              };
            }),
          };
        }) || []
      );
    }
  }, [allProject.data?.projects]);
  useEffect(() => {
    if (data) {
      setCount(data.count || 0);
      const updatedInteractions =
        data.interactions?.map((item) => {
          const status = (item.status_name || '').toLowerCase();
          return {
            ...item,
            disableCheckBox:
              !sendInteractionsEnable ||
              status === StatusTypeEnum.sent ||
              status === StatusTypeEnum.response_draft ||
              status === StatusTypeEnum.response_received ||
              status === StatusTypeEnum.inqueue ||
              status === '',
          };
        }) || [];

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
    };
    setInteractionsParams(updatedParams);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortField, appliedFilters, currentPage, rowsPerPage, sortBy]);

  const handleRefresh = () => {
    if (viewProject || sendInteraction) {
      setRefreshProject(Date.now());
    } else {
      setRefreshInteractions(Date.now());
    }
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
    const accountId = accountid ?? '';
    const path = generatePath(INTERACTIONS_CREATE, {
      module: 'account',
    });
    const queryParams = new URLSearchParams({
      accountId,
      source: 'account',
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
    }
  };
  const viewProjectCount = (rowId: string) => {
    searchParams.set('view_proj', rowId);
    navigate({ search: searchParams.toString() }, { replace: true });
  };
  const handleBackClick = () => {
    if (!interactionResponseId) {
      searchParams.delete('interaction_id');
      searchParams.delete('interaction_history_id');
      searchParams.delete('interaction_attachment_count');
      searchParams.delete('interaction_rid');
      searchParams.delete('interaction_number');
      navigate({ search: searchParams.toString() }, { replace: true });
    }
  };
  const handleBackFromResponse = () => {
    if (viewProject) {
      setAppliedFilters({});
      searchParams.delete('view_proj');
      navigate({ search: searchParams.toString() }, { replace: true });
    } else if (sendInteraction) {
      setSelectedRows([]);
      setSelectedTableIds([]);
      setAppliedFilters({});
      localStorage.removeItem('selectedInteraction');
      searchParams.delete('send_intraction');
      navigate({ search: searchParams.toString() }, { replace: true });
    } else if (interactionResponseId) {
      searchParams.delete('versionID');
      navigate({ search: searchParams.toString() }, { replace: true });
    } else {
      searchParams.delete('history');
      searchParams.delete('interaction_attachment_id');
      navigate({ search: searchParams.toString() }, { replace: true });
    }
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
  const handleSort = (sortBy: string, sortOrder: 'asc' | 'desc') => {
    const apiOrder = sortOrder === 'asc' ? 'ASC' : 'DESC';
    setProjectSortOrder(apiOrder);
    setProjectSortField(sortBy);
  };
  const getRowId = (row: InteractionList) => row.rid;
  const projectGetRowId = (row: Project & { _level?: number }) => {
    if (row._level === 1 && 'project_fiscal_rid' in row) {
      return row.project_fiscal_rid || '';
    }
    return row.project_rid || '';
  };

  const headerButtons = [
    {
      label: 'Send Interaction',
      variant: 'outlined' as const,
      disabled:
        (sendInteraction
          ? selectedTableId.length === 0
          : selectedRows.length === 0) || accountInActive,
      onClick: () => {
        if (sendInteraction) {
          setSendModalOpen(true);
        } else {
          searchParams.set('send_intraction', selectedRows[0].rid);
          navigate({ search: searchParams.toString() }, { replace: true });
          localStorage.setItem(
            'selectedInteraction',
            JSON.stringify(selectedRows.map((it) => it.rid))
          );
        }
      },
      sx: { width: '120px', minWidth: '120px' },
      hide:
        !sendInteractionsEnable || viewResponseHistory || Boolean(viewProject),
    },
    {
      label: 'New',
      variant: 'outlined' as const,
      disabled: accountInActive,
      onClick: () => handleCreate(),
      sx: { width: '48px', minWidth: '48px' },
      hide:
        !createInteractionsEnable ||
        viewResponseHistory ||
        Boolean(sendInteraction || viewProject),
    },
    {
      label: 'Show/Hide Fields',
      variant: 'outlined' as const,
      disabled: false,
      onClick: handleColumnVisibility,
      sx: { width: '125px', minWidth: '125px' },
      hide: Boolean(interactionResponseId || sendInteraction || viewProject),
    },
    {
      label: 'Back To Interaction Details',
      variant: 'contained' as const,
      onClick: () => handleBackFromResponse(),
      sx: { width: '175px', minWidth: '175px' },
      hide: Boolean(!responseHistory || viewProject),
    },
    {
      label: 'Back To Interaction',
      variant: 'contained' as const,
      onClick: () => handleBackFromResponse(),
      sx: { px: 1 },
      hide: Boolean(!(sendInteraction || viewProject)),
    },
  ];
  const interactionColumns = getInteractionListColumns(
    handleViewInteraction,
    viewProjectCount,
    permissionMap
  );
  const filterFields =
    sendInteraction || viewProject
      ? projectFilterFields(
          memoizedClassification.map((item) => ({
            label: item.option,
            value: item.value,
          })),
          memoizedProjectTypes,
          memoizedStatus,
          projectPermissionMap
        )
      : !viewInteractionHistory
        ? getInteractionFilterFields(memoizedInteractionTypes, permissionMap)
        : getInteractionHistoryFilterFields(memoizedInteractionStatus);
  const RestrictedColumns = [
    {
      id: 'r_number',
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

  const handleselectedList = (id: string[]) => {
    const childIds: ProjectFiscalSummary[] = [];
    projectList.forEach((it) => {
      it.ProjectFiscal.forEach((item) => {
        if (id.includes(item.rid)) {
          childIds.push(item);
        }
      });
    });
    setSelectedTableIds(childIds);
  };

  const modalId = isModalOpen
    ? 'account-interaction-list-column-visibility-popover'
    : undefined;

  const projectColumns = getProjectColumns(projectPermissionMap);

  return (
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
      />
      {viewDetails && !viewResponseHistory ? (
        <InteractionDetails
          accountInActive={accountInActive}
          handleBackClick={handleBackClick}
          accountDetails={accountDetails}
          isAccountInteraction
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
        />
      ) : (
        <>
          <SectionHeader
            title={
              sendInteraction || viewProject
                ? 'Projects'
                : viewResponseHistory
                  ? `Interaction Response History ${interactionNumber}`
                  : 'Interaction'
            }
            titleIcon={
              sendInteraction || viewProject ? (
                <ProjectsSideIcon
                  alt='project-header-icon'
                  className='[&>path]:stroke-[#E54787] w-[14px] h-[14px]'
                />
              ) : (
                <InteractionDetailIcon
                  alt='financial-header-icon'
                  className={`w-7 h-7 p-1 bg-[#E25A32] ${viewResponseHistory ? 'rounded-[2px]' : 'rounded-full'}`}
                />
              )
            }
            count={
              sendInteraction || viewProject
                ? projectTotalItems
                : viewResponseHistory
                  ? count
                  : totalItems
            }
            showItemCount={interactionResponseId ? false : true}
            showBackArrow={viewResponseHistory}
            onBackClick={handleBackFromResponse}
            buttons={headerButtons}
            iconBg={sendInteraction || viewProject ? '#FFE7F1' : undefined}
          />
          <div className='border border-[#CBD6E2]'>
            {sendInteraction || viewProject ? (
              <ListTable
                data={projectList as Project[]}
                columns={projectColumns}
                getRowId={projectGetRowId}
                hoverHighlight={false}
                tableStyle={{
                  height: '100%',
                  maxHeight: 'calc(100vh - 290px)',
                  overflow: 'auto',
                }}
                stickyHeader
                expandAllParent
                expandable
                childrenKey='ProjectFiscal'
                maxNestingLevel={2}
                editDisableLevel={[0]}
                stickyColumnsCount={1}
                actionWidth={60}
                actionDisplayMode='dropdown'
                actionMenuItems={[]}
                loading={allProject.isLoading}
                error={allProject.error ? 'Failed to load projects' : undefined}
                rowsPerPageOptions={[25, 50, 100]}
                rowsPerPage={projectRowsPerPage}
                currentPage={projectPage ?? 1}
                totalItems={projectTotalItems}
                onPageChange={setProjectPage}
                onRowsPerPageChange={setProjectRowsPerPage}
                sortBy={projectSortField}
                sortOrder={projectSortOrder}
                onSort={handleSort}
                selectable={Boolean(sendInteraction)}
                onSelectionChange={(selectedIds) =>
                  handleselectedList(selectedIds)
                }
                component='project'
              />
            ) : viewResponseHistory ? (
              <HistoryTable
                setCount={setCount}
                setColumnAnchorEl={setColumnAnchorEl}
                columnAnchorEl={columnAnchorEl}
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
                  disabledSelect={selectedRows.length > 0}
                  hideHeaderSelect
                />
              </>
            )}
          </div>
          <SendInteractionAlert
            isOpen={sendModalOpen}
            onClose={() => setSendModalOpen(false)}
            selectedTableId={selectedTableId}
            onSuccessRefetch={handleRefresh}
          />
        </>
      )}
    </div>
  );
};

export default Interactions;
