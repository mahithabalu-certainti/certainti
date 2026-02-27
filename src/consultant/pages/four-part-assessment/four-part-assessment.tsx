import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  getFourPartAssessmentFilterFields,
  getFourPartAssessmentTableColumns,
  moduleColorMap,
} from './helper';
import {
  AllPermissions,
  FilterTypes,
  OverviewTabs,
} from '../../../common-service';
import {
  ActivityDropdownItem,
  ExportType,
  FourPartAssessmentList,
  FourPartAssessmentListExportURLParams,
  FourPartAssessmentListURLParams,
} from '../../types';
import { RootState } from '../../../store/store';
import { useFourPartAssessmentList } from '../../services/four-part-assessment/four-part-assessment-service';
import { ShowHideTableColumn } from '../../../components/table/types';
import { SectionTabPanel } from '../../../components';
import FourPartAssessmentDetails from './four-part-assessment-details';
import SectionHeader from '../../../components/details-section/section-header';
import { FourPartIcon } from '../../../assets';
import { ListTable, ManageColumnsPopover } from '../../../components/table';

const FourPartAssessmentTabs: OverviewTabs[] = [
  {
    id: AllPermissions.FOUR_PART_ASSESSMENT_OVERVIEW,
    name: 'Overview',
    hide: false,
    key: 'overview',
  },
  {
    id: AllPermissions.FOUR_PART_ASSESSMENT_TIMELINE,
    name: 'Timeline',
    hide: false,
    key: 'timeline',
  },
];

interface FourPartAssessmentProps {
  setExportType?: (type: ExportType) => void;
  setFourPartAssessmentParams: React.Dispatch<
    React.SetStateAction<FourPartAssessmentListExportURLParams>
  >;
  activityMenuItems: ActivityDropdownItem[];
  moduleLevel: 'account' | 'project' | 'case';
}

const FourPartAssessment: React.FC<FourPartAssessmentProps> = ({
  setExportType,
  setFourPartAssessmentParams,
  activityMenuItems,
  moduleLevel,
}) => {
  const { accountid, caseId, projectid } = useParams();
  const [searchParams] = useSearchParams();
  const accountID = searchParams.get('accountID') || '';
  const navigate = useNavigate();
  const [appliedFilters, setAppliedFilters] = useState<FilterTypes>({});
  const [showFilter, setShowFilter] = useState<boolean>(false);
  const [tableParams, setTableParams] =
    useState<FourPartAssessmentListURLParams>({
      page: 1,
      limit: 100,
      sortBy: 'r_number',
      sortOrder: 'ASC',
    });
  const [refreshFourPartAssessment, setRefreshFourPartAssessment] =
    useState<number>(Date.now());
  const [fourPartAssessmentList, setFourPartAssessmentList] = useState<
    FourPartAssessmentList[]
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

  const { fiscalYear } = useSelector<RootState, { fiscalYear: string }>(
    (state: RootState) => state.account
  );

  // const { permission, modules } = useSelector(
  //   (state: RootState) => state.permission
  // );

  const convertedFiscalYear = fiscalYear !== 'FY-All' ? Number(fiscalYear) : 0;
  const fourPartAssessmentId = searchParams.get('fpa_id');
  const viewDetails = !!fourPartAssessmentId;

  const { data, isLoading, isError } = useFourPartAssessmentList(
    {
      page: tableParams.page,
      limit: tableParams.limit,
      sortBy: tableParams.sortBy,
      sortOrder: tableParams.sortOrder,
      filters: appliedFilters,
      attachmentLevel: moduleLevel || 'account',
      accountRid: accountid || accountID || '',
      entityId: accountid || caseId || projectid || '',
      search: searchText,
      fiscalYear: convertedFiscalYear,
    },
    !viewDetails,
    refreshFourPartAssessment
  );
  const totalItems = data?.count || 0;

  useEffect(() => {
    if (data) {
      setFourPartAssessmentList(data.fourPartAssessment || []);
    }
  }, [data]);

  useEffect(() => {
    if (setExportType) {
      setExportType('four_part_assessment');
    }
    setFourPartAssessmentParams({
      sortBy: tableParams.sortBy,
      sortOrder: tableParams.sortOrder,
      filters: appliedFilters,
      fiscalYear: convertedFiscalYear,
      search: searchText,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    appliedFilters,
    tableParams.sortBy,
    tableParams.sortOrder,
    convertedFiscalYear,
    searchText,
  ]);

  // Permissions
  // const fourPartAssessmentEnable = checkPermission(modules, AllModules.FOUR_PART_ASSESSMENT);

  // const isFourPartAssessmentViewEnable = checkPermission(
  //   permission,
  //   AllPermissions.FOUR_PART_ASSESSMENT_VIEW_EDIT
  // );

  // const fourPartAssessmentEditFields = useMemo(
  //   () =>
  //     permission?.find(
  //       (item) => item.name === AllPermissions.FOUR_PART_ASSESSMENT_VIEW_EDIT
  //     )?.fields ?? [],
  //   [permission]
  // );

  // const fourPartAssessmentFieldsEditable = useMemo(
  //   () =>
  //     permission
  //       .find(
  //         (item) => item.name === AllPermissions.FOUR_PART_ASSESSMENT_VIEW_EDIT
  //       )
  //       ?.fields?.some((field) => field.edit),
  //   [permission]
  // );

  // const permissionMap = useMemo(() => {
  //   const map: Record<string, { read: boolean; edit: boolean }> = {};
  //   fourPartAssessmentEditFields.forEach((item) => {
  //     map[item.name] = { read: item.read ?? false, edit: item.edit ?? false };
  //   });
  //   return map;
  // }, [fourPartAssessmentEditFields]);

  const handleFilter = () => {
    setShowFilter(!showFilter);
  };
  const onRefreshClick = () => {
    setRefreshFourPartAssessment(Date.now());
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
      sortOrder: apiOrder,
      sortBy: property,
    }));
  };

  const handleFourPartAssessmentView = (rowId: string) => {
    if (rowId) {
      searchParams.set('fpa_id', rowId);
      navigate({ search: searchParams.toString() }, { replace: true });
    }
  };

  const fourPartAssessmentColumns = getFourPartAssessmentTableColumns(
    handleFourPartAssessmentView,
    moduleLevel
  );

  const fourPartAssessmentFilterFields =
    getFourPartAssessmentFilterFields(moduleLevel);

  const getRowId = (row: FourPartAssessmentList) => row.rid;

  const handlePopoverClose = () => {
    setColumnAnchorEl(null);
  };

  const modalId = isModalOpen
    ? `${moduleLevel}-four-part-assessment-list-column-visibility-popover`
    : undefined;

  const restrictedColumns = [
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
      fourPartAssessmentColumns.map((col) => [col.id, !col.hide])
    )
  );

  const [columnOrder, setColumnOrder] = useState(
    fourPartAssessmentColumns.map((col) => col.id)
  );

  const handleColumnsChange = (updatedColumns: ShowHideTableColumn[]) => {
    const newVisibility = Object.fromEntries(
      updatedColumns.map((col) => [col.id, !col.hide])
    );
    setColumnVisibility(newVisibility);
    setColumnOrder(updatedColumns.map((col) => col.id));
  };

  const visibleColumns = columnOrder
    .map((id) => fourPartAssessmentColumns.find((col) => col.id === id)!)
    .filter((col) => columnVisibility[col.id]);

  const tableStyle = {
    borderBottom: '1px solid #CBD6E2',
    height: '100%',
    maxHeight:
      moduleLevel === 'account' ? 'calc(100vh - 320px)' : 'calc(100vh - 380px)',
    overflow: 'auto',
  };

  const currentModuleColors = moduleColorMap[moduleLevel];

  return (
    <div className='w-full pt-2 pl-2 pr-4'>
      <SectionTabPanel
        tabs={FourPartAssessmentTabs}
        filterMenu={fourPartAssessmentFilterFields}
        filterVisibility={viewDetails ? false : true}
        showFilter={showFilter}
        contextKey={`${moduleLevel}-fourPartAssessment`}
        appliedFilters={appliedFilters}
        setAppliedFilters={setAppliedFilters}
        setCurrentPage={(page) =>
          setTableParams((prev) => ({ ...prev, page: page + 1 }))
        }
        handleFilter={handleFilter}
        sortFilterCount={sortFilterCount}
        setSortFilterCount={setSortFilterCount}
        showRefresh={viewDetails ? false : true}
        onRefreshClick={onRefreshClick}
        showSearch={viewDetails ? false : true}
        searchDisabled={false}
        searchPlaceholder='Search'
        onSearch={(text) => setSearchText(text)}
        showAddActivity={viewDetails ? false : true}
        activityMenuItems={activityMenuItems}
      />
      {viewDetails ? (
        <FourPartAssessmentDetails moduleLevel={moduleLevel} />
      ) : (
        <>
          <SectionHeader
            title='Four Part Assessment'
            count={totalItems}
            showItemCount={true}
            titleIcon={
              <FourPartIcon
                className={`text-[${currentModuleColors.text}] w-[13px] h-[13px]`}
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
              columns={fourPartAssessmentColumns}
              onColumnsChange={handleColumnsChange}
              columnRestrictions={restrictedColumns}
            />
            <ListTable
              data={fourPartAssessmentList}
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
                  ? 'Failed to load four part assessment records'
                  : undefined
              }
              rowsPerPageOptions={[25, 50, 100]}
              rowsPerPage={tableParams.limit}
              currentPage={tableParams.page - 1}
              totalItems={totalItems}
              onPageChange={handlePageChange}
              onRowsPerPageChange={handleRowsPerPageChange}
              sortBy={tableParams.sortBy}
              sortOrder={tableParams.sortOrder}
              onSort={handleSortRequest}
            />
          </div>
        </>
      )}
    </div>
  );
};

export default FourPartAssessment;
