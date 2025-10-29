import { useParams } from 'react-router-dom';
import React, { useEffect, useMemo, useState } from 'react';

import { QrePercentHistoryItem } from '../../../../types/qre-percent-history';
import { useGetQrePercentHistory } from '../../../../services/qre-percent-history/qre-percent-history';
import { BUTTON_STYLES } from '../../../../../admin/pages/manage-user-detail/styles';
import { getQrePercentHistoryColumns } from './columns';
import {
  ListTableColumn,
  ShowHideTableColumn,
} from '../../../../../components/table/types';
import { SectionTabPanel } from '../../../../../components';
import {
  ListTable,
  ManageColumnsPopover,
} from '../../../../../components/table';
import { ResourceTabs } from '../resources/resources';
import { AllPermissions } from '../../../../../common-service';
import ResourceTableHeader from '../resources/resource-table-header';
import { AttachmentsSideIcon } from '../../../../../assets';

const AttachmentTabs: ResourceTabs[] = [
  {
    id: AllPermissions.ACCOUNT_ATTACHMENT_OVERVIEW,
    name: 'Overview',
    hide: false,
  },
];

interface QrePercentHistoryProps {
  refetchAccountDetails: () => void;
}
const QrePercentHistory = ({
  refetchAccountDetails,
}: QrePercentHistoryProps) => {
  const { accountid } = useParams();
  const [appliedFilters, setAppliedFilters] = useState<Record<string, any>>({});
  const [showFilter, setShowFilter] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [refreshAttachments, setRefreshAttachments] = useState<number>(
    Date.now()
  );
  const [rowsPerPage, setRowsPerPage] = useState(100);
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('ASC');
  const [sortField, setSortField] = useState<string>('version');
  const [totalItems, setTotalItems] = useState<number>(0);
  const [qrePercentHistoryList, setQrePercentHistoryList] = useState<
    QrePercentHistoryItem[]
  >([]);
  const [sortFilterCount, setSortFilterCount] = useState<number>(0);
  const [columnAnchorEl, setColumnAnchorEl] =
    React.useState<HTMLButtonElement | null>(null);

  const isModalOpen = Boolean(columnAnchorEl);
  const handleColumnVisibility = (
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    setColumnAnchorEl(event.currentTarget);
  };

  const queryParams = useMemo(
    () => ({
      page: currentPage + 1,
      limit: rowsPerPage,
      sort_by: sortOrder,
      sort: sortField,
      filter: appliedFilters,
      account_rid: accountid || '',
    }),
    [currentPage, rowsPerPage, sortField, sortOrder, appliedFilters, accountid]
  );

  const { data, isLoading, isError } = useGetQrePercentHistory(
    queryParams,
    refreshAttachments
  );

  useEffect(() => {
    console.log(data);
    if (data) {
      setTotalItems(data?.data?.total_result || 0);
      setQrePercentHistoryList(data.data?.qre_history || []);
    }
    console.log(qrePercentHistoryList);
  }, [data]);

  const handleFilter = () => {
    setShowFilter(!showFilter);
  };
  const onRefreshClick = () => {
    setRefreshAttachments(Date.now());
    refetchAccountDetails();
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

  const qrePercentHistoryColumns = useMemo(
    () => getQrePercentHistoryColumns(),
    []
  );

  const [visibleColumns, setVisibleColumns] = useState<
    ListTableColumn<QrePercentHistoryItem>[]
  >(qrePercentHistoryColumns.filter((col) => !col.hide));

  useEffect(() => {
    const updatedColumns = qrePercentHistoryColumns.filter((col) => !col.hide);
    setVisibleColumns(updatedColumns);
  }, [qrePercentHistoryColumns]);

  const getRowId = (row: QrePercentHistoryItem) => row.rid;

  const RestrictedColumns = [
    {
      id: 'sequence',
      canHide: false,
      canDrag: false,
    },
  ];

  const handleColumnsChange = (updatedColumns: ShowHideTableColumn[]) => {
    setVisibleColumns(
      updatedColumns.filter(
        (col) => !col.hide
      ) as ListTableColumn<QrePercentHistoryItem>[]
    );
  };

  const handlePopoverClose = () => {
    setColumnAnchorEl(null);
  };

  const modalId = isModalOpen ? 'qre-percent-history' : undefined;

  return (
    <div className='w-full pt-2 pl-2 pr-4'>
      <SectionTabPanel
        tabs={AttachmentTabs}
        filterMenu={[]}
        filterVisibility={true}
        showFilter={showFilter}
        contextKey='qre-percent-history'
        appliedFilters={appliedFilters}
        setAppliedFilters={setAppliedFilters}
        setCurrentPage={setCurrentPage}
        handleFilter={handleFilter}
        handleSorting={handleSorting}
        sortFilterCount={sortFilterCount}
        setSortFilterCount={setSortFilterCount}
        showRefresh={true}
        onRefreshClick={onRefreshClick}
        showSearch={false}
      />
      <ResourceTableHeader
        value={'qre-percent-history'}
        title='QRE Percent History'
        count={totalItems}
        titleIcon={
          <AttachmentsSideIcon
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
          columns={qrePercentHistoryColumns}
          onColumnsChange={handleColumnsChange}
          columnRestrictions={RestrictedColumns}
        />
        <ListTable<QrePercentHistoryItem>
          data={qrePercentHistoryList}
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
    </div>
  );
};

export default QrePercentHistory;
