import React, { useEffect, useMemo, useState } from 'react';
import { ResourceTabs } from '../../../account-details-sidebar/sidebar-pages/resources/resources';
import { AllPermissions } from '../../../../../common-service';
import { ExportType } from '../../../../types';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../../../../../store/store';
import {
  useCaseProjectResourceDetail,
  useCaseProjectResourceList,
} from '../../../../services/case-project-resource/case-project-resource-service';
import { BUTTON_STYLES } from '../../../../../admin/pages/manage-user-detail/styles';
import { ShowHideTableColumn } from '../../../../../components/table/types';
import { SectionTabPanel } from '../../../../../components';
import { ProjectsIcon } from '../../../../../assets';
import {
  ListTable,
  ManageColumnsPopover,
} from '../../../../../components/table';
import {
  CaseProjectResourceRowType,
  getCaseProjectResourceColumns,
} from './columns';
import { caseProjectResourceFilterFields } from './utils';
import CaseProjectResourceDetails from './case-project-resource-details/case-project-resource-details';
import { ReviewProjectListURLParams } from '../../../../types/assign-projects';
import SectionHeader from '../../../../../components/details-section/section-header';

const ProjectResourceTabs: ResourceTabs[] = [
  {
    id: AllPermissions.ACCOUNT_ATTACHMENT_OVERVIEW,
    name: 'Overview',
    hide: false,
  },
];
interface ProjectResourceProps {
  setExportType?: (type: ExportType) => void;
  accountInActive?: boolean;
  setProjectResourceParams: React.Dispatch<
    React.SetStateAction<ReviewProjectListURLParams>
  >;
  refetchAccountDetails?: () => void;
}

const CaseProjectResource: React.FC<ProjectResourceProps> = ({
  setExportType,
  accountInActive,
  setProjectResourceParams,
}) => {
  const { caseId } = useParams();
  const [searchParams] = useSearchParams();
  const accountid = searchParams.get('accountID');
  const resourceId = searchParams.get('resourceId');
  const navigate = useNavigate();
  const [appliedFilters, setAppliedFilters] = useState<
    Record<string, string | number | boolean | string[]>
  >({});
  const [showFilter, setShowFilter] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [refreshAttachments, setRefreshAttachments] = useState<number>(
    Date.now()
  );
  const [rowsPerPage, setRowsPerPage] = useState(100);
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('ASC');
  const [sortField, setSortField] = useState<string>('resource_code');
  const [totalItems, setTotalItems] = useState<number>(0);
  const [resourceRowList, setResourceRowList] = useState<
    CaseProjectResourceRowType[]
  >([]);
  const [sortFilterCount, setSortFilterCount] = useState<number>(0);
  const [columnAnchorEl, setColumnAnchorEl] =
    React.useState<HTMLButtonElement | null>(null);
  const [searchText, setSearchText] = useState('');
  const isModalOpen = Boolean(columnAnchorEl);
  const handleColumnVisibility = (
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    setColumnAnchorEl(event.currentTarget);
  };
  const { permission } = useSelector((state: RootState) => state.permission);
  const { fiscalYear } = useSelector<RootState, { fiscalYear: string }>(
    (state: RootState) => state.account
  );
  const convertedFiscalYear = fiscalYear !== 'FY-All' ? Number(fiscalYear) : 0;

  const { data, isLoading, isError } = useCaseProjectResourceList(
    {
      page: currentPage + 1,
      limit: rowsPerPage,
      sortBy: sortField,
      sortOrder: sortOrder,
      filters: appliedFilters,
      accountRid: accountid || '',
      case_rid: caseId || '',
      search: searchText,
      fiscalYear: convertedFiscalYear,
    },
    refreshAttachments
  );
  useEffect(() => {
    if (setExportType) {
      setExportType('project_resource');
    }
    const updatedParams = {
      sortBy: sortField,
      filters: appliedFilters,
      page: currentPage,
      sortOrder: sortOrder,
      limit: rowsPerPage,
      search: searchText,
    };
    setProjectResourceParams(updatedParams);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    sortField,
    appliedFilters,
    currentPage,
    rowsPerPage,
    sortOrder,
    searchText,
  ]);
  useEffect(() => {
    if (data?.data?.projectResources) {
      setResourceRowList(data.data.projectResources);
      setTotalItems(data.data.count || 0);
    } else {
      setResourceRowList([]);
      setTotalItems(0);
    }
  }, [data]);

  const handleFilter = () => {
    setShowFilter(!showFilter);
  };
  const onRefreshClick = () => {
    setRefreshAttachments(Date.now());
  };

  const {
    data: detailresponse,
    isLoading: detailresponseLoading,
    isError: detailresponseError,
  } = useCaseProjectResourceDetail(accountid ?? '', resourceId ?? '');

  const projectResourceDetail = detailresponse?.data?.projectResource;
  const handleCaseProjectResourceClick = (row: CaseProjectResourceRowType) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('resourceId', row.rid);

    navigate({ search: newParams.toString() }, { replace: true });
    setShowFilter(false);
    setAppliedFilters({});
    setSortFilterCount(0);
  };

  const handleSorting = (sortBy: string, sortOrder: 'asc' | 'desc') => {
    const defaultSortField = 'document_name';
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
  const updateSearchParams = (callback: (params: URLSearchParams) => void) => {
    const newParams = new URLSearchParams(searchParams);
    callback(newParams);
    navigate({ search: newParams.toString() }, { replace: true });
  };

  const handleBackToCaseProjectResource = () => {
    updateSearchParams((params) => {
      params.delete('resourceId');
    });
  };

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
  const headerButtons = [
    {
      label: 'Show/Hide Fields',
      variant: 'outlined' as const,
      disabled: accountInActive,
      onClick: handleColumnVisibility,
      sx: { ...BUTTON_STYLES, width: '125px', minWidth: '125px' },
      hide: resourceId ? true : false,
    },
    {
      label: 'Back to Project Resource',
      variant: 'outlined' as const,
      disabled: accountInActive,
      onClick: handleBackToCaseProjectResource,
      sx: { ...BUTTON_STYLES, width: '180px', minWidth: '125px' },
      hide: resourceId ? false : true,
    },
  ];

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

  const projectResourceFilterFields =
    caseProjectResourceFilterFields(permissionMap);

  const getRowId = (row: CaseProjectResourceRowType) => row.rid || '';

  const RestrictedColumns = [
    {
      id: 'resource_code',
      canHide: false,
      canDrag: false,
    },
  ];

  // ---------------------

  const projectResourceColumn = getCaseProjectResourceColumns(
    handleCaseProjectResourceClick,
    permissionMap
  );

  const [columnOrder, setColumnOrder] = useState(
    projectResourceColumn.map((col) => col.id)
  );
  const [columnVisibility, setColumnVisibility] = useState<
    Record<string, boolean>
  >(
    Object.fromEntries(projectResourceColumn.map((col) => [col.id, !col.hide]))
  );

  const visibleColumns = columnOrder
    .map((id) => projectResourceColumn.find((col) => col.id === id)!)
    .filter((col) => columnVisibility[col.id]);

  const handleColumnsChange = (updatedColumns: ShowHideTableColumn[]) => {
    const newVisibility = Object.fromEntries(
      updatedColumns.map((col) => [col.id, !col.hide])
    );
    setColumnVisibility(newVisibility);
    setColumnOrder(updatedColumns.map((col) => col.id));
  };

  const handlePopoverClose = () => {
    setColumnAnchorEl(null);
  };

  const modalId = isModalOpen
    ? 'project-resource-list-column-visibility-popover'
    : undefined;

  return (
    <div className='w-full pt-2 pl-2 pr-4'>
      <SectionTabPanel
        tabs={ProjectResourceTabs}
        filterMenu={projectResourceFilterFields}
        filterVisibility={resourceId ? false : true}
        showFilter={showFilter}
        contextKey='project_resource'
        appliedFilters={appliedFilters}
        setAppliedFilters={setAppliedFilters}
        setCurrentPage={setCurrentPage}
        handleFilter={handleFilter}
        handleSorting={handleSorting}
        sortFilterCount={sortFilterCount}
        setSortFilterCount={setSortFilterCount}
        showRefresh={resourceId ? false : true}
        onRefreshClick={onRefreshClick}
        showSearch={resourceId ? false : true}
        onSearch={(text) => setSearchText(text)}
      />

      <>
        <SectionHeader
          title={resourceId ? 'Project Resource Details' : 'Project Resource'}
          titleIcon={
            <ProjectsIcon
              alt='attachment-header-icon'
              className='[&>path]:stroke-[#4B9BFF]'
            />
          }
          count={totalItems}
          showItemCount={resourceId ? false : true}
          buttons={headerButtons.map((btn) => ({
            ...btn,
            hide: Boolean(btn.hide),
          }))}
        />
        {resourceId ? (
          <CaseProjectResourceDetails
            resource={projectResourceDetail ?? null}
            isLoading={detailresponseLoading}
            error={
              detailresponseError ? 'Failed to load Attachment data' : null
            }
          />
        ) : (
          <div className='border border-[#CBD6E2]'>
            <ManageColumnsPopover
              anchorEl={columnAnchorEl}
              open={isModalOpen}
              popoverId={modalId}
              onClose={handlePopoverClose}
              columns={projectResourceColumn}
              onColumnsChange={handleColumnsChange}
              columnRestrictions={RestrictedColumns}
            />
            <ListTable
              data={resourceRowList}
              columns={visibleColumns}
              getRowId={getRowId}
              hoverHighlight={false}
              tableStyle={{
                borderBottom: '1px solid #CBD6E2',
                height: '100%',
                maxHeight: 'calc(100vh - 320px)',
                overflow: 'auto',
              }}
              stickyHeader={true}
              stickyColumnsCount={1}
              selectable={false}
              actionWidth={80}
              actionDisplayMode='dropdown'
              actionMenuItems={[]}
              loading={isLoading}
              error={isError ? 'Failed to load Attachment data' : undefined}
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
        )}
      </>
    </div>
  );
};

export default CaseProjectResource;
