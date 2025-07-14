/* eslint-disable @typescript-eslint/no-explicit-any */
import { useParams, useSearchParams } from 'react-router-dom';
import { AllPermissions } from '../../../../../common-service';
import { ResourceTabs } from '../../../account-details-sidebar/sidebar-pages/resources/resources';
import { useEffect, useState } from 'react';
import { AttachmentList } from '../../../../types/attachment';
import { useAttachmentList } from '../../../../services/attachments/attachments-service';
import { getProjectAttachmentColumns } from './column';
import ResourceTableHeader from '../../../account-details-sidebar/sidebar-pages/resources/resource-table-header';
import { Attachment } from '../../../../../assets';
import { ListTable } from '../../../../../components/table';
import { SectionTabPanel } from '../../../../../components';
import { attachmentsFilterFields } from './utils';

const AttachmentTabs: ResourceTabs[] = [
  {
    id: AllPermissions.ACCOUNT_ATTACHMENT_OVERVIEW,
    name: 'Overview',
    hide: false,
  },
  {
    id: AllPermissions.ACCOUNT_ATTACHMENT_TIMELINE,
    name: 'Timeline',
    hide: false,
    disable: true,
  },
];

const Attachments: React.FC = () => {
  const { projectid } = useParams();
  const [searchParams] = useSearchParams();
  const accountID = searchParams.get('accountID');
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
  const [attachmentList, setAttachmentList] = useState<AttachmentList[]>([]);
  const [sortFilterCount, setSortFilterCount] = useState<number>(0);

  const { data, isLoading, isError } = useAttachmentList(
    {
      page: currentPage + 1,
      limit: rowsPerPage,
      sortBy: sortField,
      sortOrder: sortOrder,
      filters: appliedFilters,
      attachmentLevel: 'project',
      accountRid: accountID || '',
      entityId: projectid || '',
    },
    refreshAttachments
  );

  useEffect(() => {
    if (data) {
      setTotalItems(data?.count || 0);
      setAttachmentList(data.attachments || []);
    }
  }, [data]);

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
      label: 'Upload file',
      variant: 'outlined' as const,
      disabled: false,
      onClick: () => console.log('clicked'),
      sx: { width: '90px', minWidth: '90px' },
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

  const attachmentColumns = getProjectAttachmentColumns();
  const getRowId = (row: AttachmentList) => row.rid;

  return (
    <div className='w-full pt-2 pl-2 pr-4'>
      <SectionTabPanel
        tabs={AttachmentTabs}
        filterMenu={attachmentsFilterFields()}
        filterVisibility={true}
        showFilter={showFilter}
        contextKey='project-attachments'
        appliedFilters={appliedFilters}
        setAppliedFilters={setAppliedFilters}
        setCurrentPage={setCurrentPage}
        handleFilter={handleFilter}
        handleSorting={handleSorting}
        sortFilterCount={sortFilterCount}
        setSortFilterCount={setSortFilterCount}
        showRefresh
        onRefreshClick={onRefreshClick}
      />

      <ResourceTableHeader
        value={'attachments'}
        title='Attachments'
        count={totalItems}
        titleIcon={<Attachment alt='attachment-header-icon' />}
        headerButtons={headerButtons}
      />
      <div className='border border-[#CBD6E2]'>
        <ListTable
          data={attachmentList}
          columns={attachmentColumns}
          getRowId={getRowId}
          hoverHighlight={false}
          tableStyle={{
            borderBottom: '1px solid #CBD6E2',
            height: '100%',
            maxHeight: 'calc(100vh - 290px)',
            overflow: 'auto',
          }}
          stickyHeader={false}
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
          totalItems={0}
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

export default Attachments;
