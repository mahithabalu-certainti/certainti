import React, { useEffect, useMemo, useState } from 'react';
import { SectionTabPanel } from '../../../../../components';
import {
  AllModules,
  AllPermissions,
  OverviewTabs,
} from '../../../../../common-service';
import {
  ListTable,
  ManageColumnsPopover,
} from '../../../../../components/table';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useTechnicalSummaryList } from '../../../../services/technical-summary/technical-summary-service';
import {
  ActivityDropdownItem,
  ColorCode,
  ExportType,
  TechnicalSummaryExportListParams,
  TechnicalSummaryList,
} from '../../../../types';
import { getTechnicalSummaryListColumns } from './columns';
import { ShowHideTableColumn } from '../../../../../components/table/types';
import SectionHeader from '../../../../../components/details-section/section-header';
import { TechSummaryIcon } from '../../../../../assets';
import { getTechnicalSummaryFilterFields } from './helpers';
import TechnicalSummaryDetails from './details/technical-summary-details';
import { useSelector } from 'react-redux';
import { RootState } from '../../../../../store/store';
import { checkPermission } from '../../../../../common-utils';
import { AccessRestricted } from '../../../../../components/account-restricted';
import Timeline from '../../../../../pages/timeline/timeline';

const TechnicalSummaryTabs: OverviewTabs[] = [
  {
    id: AllPermissions.PROJECT_TECHNICAL_SUMMARY_OVERVIEW,
    name: 'Overview',
    hide: false,
    key: 'overview',
  },
  {
    id: AllPermissions.PROJECT_TECHNICAL_SUMMARY_TIMELINE,
    name: 'Timeline',
    hide: false,
    // disable: true,
    key: 'timeline',
  },
];

interface TechnicalSummaryProps {
  accountInActive: boolean;
  setExportType: (type: ExportType) => void;
  setTechnicalSummaryParams: (params: TechnicalSummaryExportListParams) => void;
  activityMenuItems: ActivityDropdownItem[];
}

const TechnicalSummary: React.FC<TechnicalSummaryProps> = ({
  accountInActive,
  setExportType,
  setTechnicalSummaryParams,
  activityMenuItems,
}) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { projectid } = useParams();
  const accountID = searchParams.get('accountID');
  const [appliedFilters, setAppliedFilters] = useState<
    Record<string, string | number | boolean>
  >({});
  const [showFilter, setShowFilter] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(100);
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('ASC');
  const [sortField, setSortField] = useState<string>('r_number');
  const [refreshList, setRefreshList] = useState<number>(Date.now());
  const [technicalSummaryList, setTechnicalSummaryList] = useState<
    TechnicalSummaryList[]
  >([]);

  const { permission, modules } = useSelector(
    (state: RootState) => state.permission
  );
  const isTimeLineView = searchParams.get('timelineview') === 'true';
  const technicalSummaryId = searchParams.get('technical_summary_id');
  const viewTechSummaryDetails = !!technicalSummaryId;

  const [columnAnchorEl, setColumnAnchorEl] =
    React.useState<HTMLButtonElement | null>(null);

  const isModalOpen = Boolean(columnAnchorEl);
  const handleColumnVisibility = (
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    setColumnAnchorEl(event.currentTarget);
  };

  const { data, isLoading, isError } = useTechnicalSummaryList(
    {
      page: currentPage + 1,
      limit: rowsPerPage,
      sortOrder,
      sortBy: sortField,
      filters: appliedFilters,
      account_rid: accountID || '',
      project_fiscal_rid: projectid || '',
    },
    refreshList,
    !viewTechSummaryDetails
  );
  const totalItems = data?.count || 0;

  useEffect(() => {
    if (data) {
      setTechnicalSummaryList(data.techSummaryInfo || []);
    }
  }, [data]);

  useEffect(() => {
    if (setExportType) {
      setExportType('technical_summary');
    }
    setTechnicalSummaryParams({
      sortBy: sortField,
      sortOrder: sortOrder,
      filters: appliedFilters,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortField, sortOrder, appliedFilters]);

  // Permissions
  const technicalSummaryEnable = checkPermission(
    modules,
    AllModules.PROJECT_TECHNICAL_SUMMARY
  );

  const technicalSummaryViewEnable = checkPermission(
    permission,
    AllPermissions.PROJECT_TECHNICAL_SUMMARY_VIEW_EDIT
  );

  const technicalSummaryViewEditFields = useMemo(
    () =>
      permission?.find(
        (item) =>
          item.name === AllPermissions.PROJECT_TECHNICAL_SUMMARY_VIEW_EDIT
      )?.fields ?? [],
    [permission]
  );

  const permissionMap = useMemo(() => {
    const map: Record<string, { read: boolean; edit: boolean }> = {};
    technicalSummaryViewEditFields.forEach((item) => {
      map[item.name] = { read: item.read ?? false, edit: item.edit ?? false };
    });
    return map;
  }, [technicalSummaryViewEditFields]);

  const handleFilter = () => {
    setShowFilter(!showFilter);
  };

  const onRefreshClick = () => {
    setRefreshList(Date.now());
  };

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

  const handleViewTechnicalSummary = (rid: string) => {
    if (rid) {
      searchParams.set('technical_summary_id', rid);
      navigate({ search: searchParams.toString() }, { replace: true });
    }
  };

  const headerButtons = [
    {
      label: 'Show/Hide Fields',
      variant: 'outlined' as const,
      disabled: false,
      onClick: handleColumnVisibility,
      sx: { width: '125px', minWidth: '125px' },
      hide: viewTechSummaryDetails,
    },
  ];

  const handleBackClick = () => {
    searchParams.delete('technical_summary_id');
    navigate({ search: searchParams.toString() }, { replace: true });
  };

  const getRowId = (row: TechnicalSummaryList) => row.rid;
  const technicalSummaryColumns = getTechnicalSummaryListColumns(
    handleViewTechnicalSummary,
    permissionMap
  );

  const RestrictedColumns = [
    {
      id: 'r_number',
      canHide: false,
      canDrag: false,
    },
  ];

  const [columnVisibility, setColumnVisibility] = useState<
    Record<string, boolean>
  >(
    Object.fromEntries(
      technicalSummaryColumns.map((col) => [col.id, !col.hide])
    )
  );

  const [columnOrder, setColumnOrder] = useState(
    technicalSummaryColumns.map((col) => col.id)
  );

  const handleColumnsChange = (updatedColumns: ShowHideTableColumn[]) => {
    const newVisibility = Object.fromEntries(
      updatedColumns.map((col) => [col.id, !col.hide])
    );
    setColumnVisibility(newVisibility);
    setColumnOrder(updatedColumns.map((col) => col.id));
  };

  const visibleColumns = columnOrder
    .map((id) => technicalSummaryColumns.find((col) => col.id === id)!)
    .filter((col) => columnVisibility[col.id]);

  const handlePopoverClose = () => {
    setColumnAnchorEl(null);
  };

  const modalId = isModalOpen
    ? 'tech-summary-list-column-visibility-popover'
    : undefined;

  const filterFields = getTechnicalSummaryFilterFields(permissionMap);

  if (!technicalSummaryEnable || !technicalSummaryViewEnable)
    return <AccessRestricted />;

  return (
    <div className='w-full pt-2 pl-2 pr-4'>
      <SectionTabPanel
        tabs={TechnicalSummaryTabs}
        filterMenu={filterFields}
        filterVisibility={!viewTechSummaryDetails}
        showFilter={showFilter}
        contextKey='technical-summary'
        appliedFilters={appliedFilters}
        setAppliedFilters={setAppliedFilters}
        setCurrentPage={setCurrentPage}
        handleFilter={handleFilter}
        showRefresh={!viewTechSummaryDetails}
        onRefreshClick={onRefreshClick}
        sortFilterCount={0}
        setSortFilterCount={() => {}}
        showAddActivity={!viewTechSummaryDetails}
        activityMenuItems={activityMenuItems}
      />
      {isTimeLineView ? (
        <div className='border border-[#CBD6E2] rounded-[2px] overflow-auto'>
          <Timeline entitytype='project' />
        </div>
      ) : (
        <>
          {viewTechSummaryDetails ? (
            <TechnicalSummaryDetails
              accountInActive={accountInActive}
              handleBackClick={handleBackClick}
            />
          ) : (
            <>
              <SectionHeader
                title={'Technical Summary'}
                titleIcon={
                  <TechSummaryIcon
                    alt='financial-header-icon'
                    className={`[&>path]:stroke-[${ColorCode.accountTextColor}] w-[14px] h-[14px]`}
                  />
                }
                count={totalItems}
                showItemCount={true}
                buttons={headerButtons}
                iconBg={ColorCode.projectBgColor}
                bgType='circle'
              />
              <div className='border border-[#CBD6E2]'>
                <ManageColumnsPopover
                  anchorEl={columnAnchorEl}
                  open={isModalOpen}
                  popoverId={modalId}
                  onClose={handlePopoverClose}
                  columns={technicalSummaryColumns}
                  onColumnsChange={handleColumnsChange}
                  columnRestrictions={RestrictedColumns}
                />
                <ListTable
                  data={technicalSummaryList}
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
                  selectable={false}
                  actionWidth={80}
                  actionDisplayMode='dropdown'
                  actionMenuItems={[]}
                  loading={isLoading}
                  error={isError ? 'Failed to Load Technical Summary data' : ''}
                  rowsPerPageOptions={[25, 50, 100]}
                  rowsPerPage={rowsPerPage}
                  currentPage={currentPage}
                  totalItems={totalItems}
                  onPageChange={handlePageChange}
                  onRowsPerPageChange={handleRowsPerPageChange}
                  sortBy={sortField}
                  sortOrder={sortOrder}
                  onSort={handleSortRequest}
                />
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
};

export default TechnicalSummary;
