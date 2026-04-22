import React, { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import {
  generatePath,
  useNavigate,
  useParams,
  useSearchParams,
} from 'react-router-dom';
import {
  getRdAssessmentStatusFilterFields,
  getRdAssessmentStatusTableColumns,
} from './helper';
import {
  AllModules,
  AllPermissions,
  FilterTypes,
  OverviewTabs,
} from '../../../common-service';
import {
  ActivityDropdownItem,
  ExportType,
  RdAssessmentStatusItem,
  RdAssessmentStatusExportURLParams,
  RdAssessmentStatusListURLParams,
} from '../../types';
import { RootState } from '../../../store/store';
import { useRdAssessmentStatusList } from '../../services/rd-assessment/rd-assessment-service';
import { ShowHideTableColumn } from '../../../components/table/types';
import { SectionTabPanel } from '../../../components';
import SectionHeader from '../../../components/details-section/section-header';
import { ListTable, ManageColumnsPopover } from '../../../components/table';
import Timeline from '../../../pages/timeline/timeline';
import { moduleColorMap } from '../four-part-assessment/helper';
import { RdStatusIcon } from '../../../assets';
import { checkPermission } from '../../../common-utils';
import { AccessRestricted } from '../../../components/account-restricted';
import { PROJECT_DETAILS } from '../../../routes';

const RdAssessmentStatusTabs: OverviewTabs[] = [
  {
    id: AllPermissions.RD_ASSESSMENT_STATUS_OVERVIEW,
    name: 'Overview',
    hide: false,
    key: 'overview',
  },
  {
    id: AllPermissions.RD_ASSESSMENT_STATUS_TIMELINE,
    name: 'Timeline',
    hide: false,
    key: 'timeline',
  },
];

interface RdAssessmentStatusProps {
  setExportType?: (type: ExportType) => void;
  setRdAssessmentStatusParams: React.Dispatch<
    React.SetStateAction<RdAssessmentStatusExportURLParams>
  >;
  activityMenuItems: ActivityDropdownItem[];
  moduleLevel: 'account' | 'project' | 'case';
}

const RdAssessmentStatus: React.FC<RdAssessmentStatusProps> = ({
  setExportType,
  setRdAssessmentStatusParams,
  activityMenuItems,
  moduleLevel,
}) => {
  const navigate = useNavigate();
  const { accountid, caseId, projectid } = useParams();
  const [searchParams] = useSearchParams();
  const accountID = searchParams.get('accountID') || '';
  const isTimeLineView = searchParams.get('timelineview') === 'true';

  const [appliedFilters, setAppliedFilters] = useState<FilterTypes>({});
  const [showFilter, setShowFilter] = useState<boolean>(false);
  const [tableParams, setTableParams] =
    useState<RdAssessmentStatusListURLParams>({
      page: 1,
      limit: 100,
      search: '',
      sortBy: 'created_datetime',
      sortOrder: 'DESC',
    });
  const [refreshRdAssessmentStatus, setRefreshRdAssessmentStatus] =
    useState<number>(Date.now());
  const [rdAssessmentStatusList, setRdAssessmentStatusList] = useState<
    RdAssessmentStatusItem[]
  >([]);
  const [sortFilterCount, setSortFilterCount] = useState<number>(0);
  const [searchText, setSearchText] = useState('');

  const [columnAnchorEl, setColumnAnchorEl] =
    React.useState<HTMLButtonElement | null>(null);

  const isModalOpen = Boolean(columnAnchorEl);

  const handleColumnVisibility = (
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    setColumnAnchorEl(event.currentTarget);
  };

  const { permission, modules } = useSelector(
    (state: RootState) => state.permission
  );

  const { data, isLoading, isError } = useRdAssessmentStatusList(
    {
      account_rid: accountid || accountID || '',
      ...(moduleLevel === 'project' && { project_fiscal_rid: projectid || '' }),
      ...(moduleLevel === 'case' && { case_rid: caseId || '' }),
      page: tableParams.page,
      limit: tableParams.limit,
      search: searchText,
      sortBy: tableParams.sortBy,
      sortOrder: tableParams.sortOrder,
      filters: appliedFilters,
    },
    true,
    refreshRdAssessmentStatus
  );

  const totalItems = data?.count || 0;

  useEffect(() => {
    if (data) {
      setRdAssessmentStatusList(data.auditInfo || []);
    }
  }, [data]);

  useEffect(() => {
    if (setExportType) {
      setExportType('rd_assessment_status');
    }
    setRdAssessmentStatusParams({
      account_rid: accountid || accountID || '',
      ...(moduleLevel === 'project' && { project_fiscal_rid: projectid || '' }),
      ...(moduleLevel === 'case' && { case_rid: caseId || '' }),
      search: searchText,
      sortBy: tableParams.sortBy,
      sortOrder: tableParams.sortOrder,
      filters: appliedFilters,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appliedFilters, tableParams.sortOrder, tableParams.sortBy, searchText]);

  // Permissions
  const rdAssessmentStatusEnable = checkPermission(
    modules,
    AllModules.RD_ASSESSMENT_STATUS
  );

  const isRdAssessmentStatusViewEnable = checkPermission(
    permission,
    AllPermissions.RD_ASSESSMENT_STATUS_VIEW_EDIT
  );

  const rdAssessmentStatusEditFields = useMemo(
    () =>
      permission?.find(
        (item) => item.name === AllPermissions.RD_ASSESSMENT_STATUS_VIEW_EDIT
      )?.fields ?? [],
    [permission]
  );

  const rdAssessmentPermissionMap = useMemo(() => {
    const map: Record<string, { read: boolean; edit: boolean }> = {};
    rdAssessmentStatusEditFields.forEach((item) => {
      map[item.name] = { read: item.read ?? false, edit: item.edit ?? false };
    });
    return map;
  }, [rdAssessmentStatusEditFields]);

  const projectViewEditFields = useMemo(
    () =>
      permission.find((item) => item.name === AllPermissions.PROJECTS_VIEW_EDIT)
        ?.fields ?? [],
    [permission]
  );

  const projectPermissionMap = useMemo(() => {
    const map: Record<string, { read: boolean; edit: boolean }> = {};
    projectViewEditFields.forEach((item) => {
      map[item.name] = { read: item.read ?? false, edit: item.edit ?? false };
    });
    return map;
  }, [projectViewEditFields]);

  const handleFilter = () => {
    setShowFilter(!showFilter);
  };

  const onRefreshClick = () => {
    setRefreshRdAssessmentStatus(Date.now());
  };

  const headerButtons = [
    {
      label: 'Show/Hide Fields',
      variant: 'outlined' as const,
      disabled: false,
      onClick: handleColumnVisibility,
      sx: { width: '125px', minWidth: '125px' },
      hide: false,
    },
  ];

  const handlePageChange = (newPage: number) => {
    setTableParams((prev) => ({ ...prev, page: newPage + 1 }));
  };

  const handleRowsPerPageChange = (newPageSize: number) => {
    setTableParams((prev) => ({ ...prev, limit: newPageSize, page: 1 }));
  };

  const handleSortRequest = (property: string, sortOrder: 'asc' | 'desc') => {
    const apiOrder = sortOrder.toUpperCase() as 'ASC' | 'DESC';
    setTableParams((prev) => ({
      ...prev,
      sortBy: property,
      sortOrder: apiOrder,
    }));
  };

  const handleViewProject = (data: RdAssessmentStatusItem) => {
    const path = generatePath(PROJECT_DETAILS, {
      projectid: data?.project_fiscal_rid ?? '',
    });
    const queryParams = new URLSearchParams({
      accountID: data?.account_rid || accountid || accountID || '',
      source: 'account',
      currency_rid: data?.currency_rid ?? '',
      navigateFrom: 'case',
    });

    navigate(`${path}?${queryParams.toString()}`);
  };

  const rdAssessmentStatusColumns = getRdAssessmentStatusTableColumns(
    moduleLevel,
    projectPermissionMap,
    rdAssessmentPermissionMap,
    handleViewProject
  );

  const rdAssessmentStatusFilterFields = getRdAssessmentStatusFilterFields(
    moduleLevel,
    projectPermissionMap,
    rdAssessmentPermissionMap
  );

  const getRowId = (row: RdAssessmentStatusItem) => row.rid;

  const handlePopoverClose = () => {
    setColumnAnchorEl(null);
  };

  const modalId = isModalOpen
    ? `${moduleLevel}-rd-assessment-status-list-column-visibility-popover`
    : undefined;

  const restrictedColumns = [
    {
      id: 'created_datetime',
      canHide: false,
      canDrag: false,
    },
    ...(moduleLevel === 'case'
      ? [
          {
            id: 'project_code',
            canHide: false,
            canDrag: false,
          },
        ]
      : []),
  ];

  const [columnVisibility, setColumnVisibility] = useState<
    Record<string, boolean>
  >(
    Object.fromEntries(
      rdAssessmentStatusColumns.map((col) => [col.id, !col.hide])
    )
  );

  const [columnOrder, setColumnOrder] = useState(
    rdAssessmentStatusColumns.map((col) => col.id)
  );

  const handleColumnsChange = (updatedColumns: ShowHideTableColumn[]) => {
    const newVisibility = Object.fromEntries(
      updatedColumns.map((col) => [col.id, !col.hide])
    );
    setColumnVisibility(newVisibility);
    setColumnOrder(updatedColumns.map((col) => col.id));
  };

  const visibleColumns = columnOrder
    .map((id) => rdAssessmentStatusColumns.find((col) => col.id === id)!)
    .filter((col) => columnVisibility[col.id]);

  const tableStyle = {
    borderBottom: '1px solid #CBD6E2',
    height: '100%',
    maxHeight:
      moduleLevel === 'account' ? 'calc(100vh - 320px)' : 'calc(100vh - 380px)',
    overflow: 'auto',
  };

  const currentModuleColors = moduleColorMap[moduleLevel];

  if (!rdAssessmentStatusEnable || !isRdAssessmentStatusViewEnable) {
    return <AccessRestricted />;
  }

  return (
    <div className='w-full pt-2 pl-2 pr-4'>
      <SectionTabPanel
        tabs={RdAssessmentStatusTabs}
        filterMenu={rdAssessmentStatusFilterFields}
        filterVisibility={true}
        showFilter={showFilter}
        contextKey={`${moduleLevel}-rd-assessment-status`}
        appliedFilters={appliedFilters}
        setAppliedFilters={setAppliedFilters}
        setCurrentPage={(page) =>
          setTableParams((prev) => ({ ...prev, page: page + 1 }))
        }
        handleFilter={handleFilter}
        sortFilterCount={sortFilterCount}
        setSortFilterCount={setSortFilterCount}
        showRefresh={true}
        onRefreshClick={onRefreshClick}
        showSearch={true}
        searchDisabled={false}
        searchPlaceholder='Search'
        onSearch={(text) => setSearchText(text)}
        showAddActivity={true}
        activityMenuItems={activityMenuItems}
      />
      {isTimeLineView ? (
        <div className='border border-[#CBD6E2] rounded-[2px]'>
          <Timeline entitytype={moduleLevel} />
        </div>
      ) : (
        <>
          <SectionHeader
            title='RD Assessment Status'
            count={totalItems}
            showItemCount={true}
            titleIcon={
              <RdStatusIcon
                className={`text-[${currentModuleColors.text}] w-[13.5px] h-[13px] mt-0.5`}
                alt='header-icon'
              />
            }
            buttons={headerButtons}
            iconBg={currentModuleColors.bg}
            bgType='circle'
          />
          <div className='border border-[#CBD6E2]'>
            <ManageColumnsPopover
              anchorEl={columnAnchorEl}
              open={isModalOpen}
              popoverId={modalId}
              onClose={handlePopoverClose}
              columns={rdAssessmentStatusColumns}
              onColumnsChange={handleColumnsChange}
              columnRestrictions={restrictedColumns}
            />
            <ListTable
              data={rdAssessmentStatusList}
              columns={visibleColumns}
              getRowId={getRowId}
              hoverHighlight={false}
              tableStyle={tableStyle}
              stickyHeader={true}
              stickyColumnsCount={1}
              selectable={false}
              actionWidth={80}
              actionDisplayMode='dropdown'
              actionMenuItems={[]}
              loading={isLoading}
              error={
                isError
                  ? 'Failed to load RD assessment status records'
                  : undefined
              }
              rowsPerPageOptions={[25, 50, 100]}
              rowsPerPage={tableParams.limit}
              currentPage={tableParams.page - 1}
              totalItems={totalItems}
              onPageChange={handlePageChange}
              onRowsPerPageChange={handleRowsPerPageChange}
              sortBy={tableParams.sortBy}
              sortOrder={tableParams.sortOrder as 'ASC' | 'DESC'}
              onSort={handleSortRequest}
            />
          </div>
        </>
      )}
    </div>
  );
};

export default RdAssessmentStatus;
