/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useMemo, useState } from 'react';
import { ResourceTabs } from '../../../account-details-sidebar/sidebar-pages/resources/resources';
import { AllPermissions } from '../../../../../common-service';
import { ExportType } from '../../../../types';
import { useParams, useSearchParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../../../../../store/store';
import { useCaseProjectResourceList } from '../../../../services/case-project-resource/case-project-resource-service';
import { BUTTON_STYLES } from '../../../../../admin/pages/manage-user-detail/styles';
import {
  ListTableColumn,
  ShowHideTableColumn,
} from '../../../../../components/table/types';
import { SectionTabPanel } from '../../../../../components';
import ResourceTableHeader from '../../../account-details-sidebar/sidebar-pages/resources/resource-table-header';
import { ProjectsIcon } from '../../../../../assets';
import {
  ListTable,
  ManageColumnsPopover,
} from '../../../../../components/table';
import {
  CaseProjectResourceRow,
  getCaseProjectResourceColumns,
} from './columns';
import { caseProjectResourceFilterFields } from './utils';

const AttachmentTabs: ResourceTabs[] = [
  {
    id: AllPermissions.ACCOUNT_ATTACHMENT_OVERVIEW,
    name: 'Overview',
    hide: false,
  },
];

interface AttachmentsProps {
  setExportType?: (type: ExportType) => void;
  // setAttachmentParams?: React.Dispatch<
  //   React.SetStateAction<AttachmentsListExportParams>
  // >;
  accountInActive?: boolean;
  refetchAccountDetails?: () => void;
}

const CaseProjectResource: React.FC<AttachmentsProps> = () => {
  const { accountid, caseId } = useParams();
  const [searchParams] = useSearchParams();
  const [appliedFilters, setAppliedFilters] = useState<Record<string, any>>({});
  const [showFilter, setShowFilter] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [refreshAttachments, setRefreshAttachments] = useState<number>(
    Date.now()
  );
  const [rowsPerPage, setRowsPerPage] = useState(100);
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('ASC');
  const [sortField, setSortField] = useState<string>('document_name');
  const [totalItems, setTotalItems] = useState<number>(0);
  const [resourceRowList, setResourceRowList] = useState<
    CaseProjectResourceRow[]
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
    if (data?.data?.count) {
      setTotalItems(data?.data?.count || 0);
      setResourceRowList([]);
    } else {
      setResourceRowList([]);
    }
  }, [data]);

  // useEffect(() => {
  //   if (setExportType) {
  //     setExportType('attachments');
  //   }
  //   setAttachmentParams({
  //     sortBy: sortField,
  //     sortOrder: sortOrder,
  //     filters: appliedFilters,
  //     fiscalYear: convertedFiscalYear,
  //     search: searchText,
  //   });
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [sortField, sortOrder, appliedFilters, convertedFiscalYear, searchText]);

  const showUploads = searchParams.get('attachment_entity') === 'account';

  const handleFilter = () => {
    setShowFilter(!showFilter);
  };
  const onRefreshClick = () => {
    setRefreshAttachments(Date.now());
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

  const headerButtons = [
    {
      label: 'Show/Hide Fields',
      variant: 'outlined' as const,
      disabled: false,
      onClick: handleColumnVisibility,
      sx: { ...BUTTON_STYLES, width: '125px', minWidth: '125px' },
      hide: false,
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

  const attachmentColumns = useMemo(() => getCaseProjectResourceColumns(), []);

  const [visibleColumns, setVisibleColumns] = useState<
    ListTableColumn<CaseProjectResourceRow>[]
  >(getCaseProjectResourceColumns().filter((col) => !col.hide));

  useEffect(() => {
    const updatedColumns = attachmentColumns.filter((col) => !col.hide);
    setVisibleColumns(updatedColumns);
  }, [attachmentColumns]);

  const attachmentsFilterFields = caseProjectResourceFilterFields();

  const getRowId = (row: CaseProjectResourceRow) => row.rid;

  const RestrictedColumns = [
    {
      id: 'document_name',
      canHide: false,
      canDrag: false,
    },
  ];

  const handleColumnsChange = (updatedColumns: ShowHideTableColumn[]) => {
    setVisibleColumns(
      updatedColumns.filter(
        (col) => !col.hide
      ) as ListTableColumn<CaseProjectResourceRow>[]
    );
  };

  const handlePopoverClose = () => {
    setColumnAnchorEl(null);
  };

  const modalId = isModalOpen
    ? 'account-attachment-list-column-visibility-popover'
    : undefined;

  return (
    <div className='w-full pt-2 pl-2 pr-4'>
      <SectionTabPanel
        tabs={AttachmentTabs}
        filterMenu={attachmentsFilterFields}
        filterVisibility={showUploads ? false : true}
        showFilter={showFilter}
        contextKey='account-attachments'
        appliedFilters={appliedFilters}
        setAppliedFilters={setAppliedFilters}
        setCurrentPage={setCurrentPage}
        handleFilter={handleFilter}
        handleSorting={handleSorting}
        sortFilterCount={sortFilterCount}
        setSortFilterCount={setSortFilterCount}
        showRefresh={showUploads ? false : true}
        onRefreshClick={onRefreshClick}
        showSearch={showUploads ? false : true}
        onSearch={(text) => setSearchText(text)}
      />

      <>
        <ResourceTableHeader
          value={'projectResource'}
          title='Project Resource'
          count={totalItems}
          titleIcon={
            <ProjectsIcon
              alt='attachment-header-icon'
              className='[&>path]:stroke-[#4B9BFF]'
            />
          }
          headerButtons={headerButtons}
          iconBg='#D8E9FF'
          bgType='circle'
        />
        <div className='border border-[#CBD6E2]'>
          <ManageColumnsPopover
            anchorEl={columnAnchorEl}
            open={isModalOpen}
            popoverId={modalId}
            onClose={handlePopoverClose}
            columns={attachmentColumns}
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
      </>
    </div>
  );
};

export default CaseProjectResource;
