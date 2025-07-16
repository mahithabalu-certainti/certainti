/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useMemo, useState } from 'react';
import { Attachment } from '../../../../../assets';
import { ResourceTabs } from '../resources/resources';
import { useNavigate, useParams } from 'react-router-dom';
import { BUTTON_STYLES } from '../../../../../admin/pages/manage-user-detail/styles';
import ResourceTableHeader from '../resources/resource-table-header';
import { ListTable } from '../../../../../components/table';
import { getAttachmentColumns } from './column';
import {
  AllPermissions,
  useGetAllDocumentInfo,
} from '../../../../../common-service';
import Uploads from '../../../../../components/Attachments/upload';
import { useLocation, useSearchParams } from 'react-router-dom';
import { SelectOption } from '../../../../types';
import { useAttachmentList } from '../../../../services/attachments/attachments-service';
import { AttachmentList } from '../../../../types/attachment';
import { SectionTabPanel } from '../../../../../components';
import { getFiscalYears } from '../../../../../common-utils';
import { getAttachmentsFilterFields } from '../../../../../components/Attachments/helpers';

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
  const { accountid } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
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
  const [attachmentList, setAttachmentList] = useState<AttachmentList[]>([]);
  const [sortFilterCount, setSortFilterCount] = useState<number>(0);

  const { data, isLoading, isError } = useAttachmentList(
    {
      page: currentPage + 1,
      limit: rowsPerPage,
      sortBy: sortField,
      sortOrder: sortOrder,
      filters: appliedFilters,
      attachmentLevel: 'account',
      accountRid: accountid || '',
      entityId: accountid || '',
    },
    refreshAttachments
  );

  useEffect(() => {
    if (data) {
      setTotalItems(data?.count || 0);
      setAttachmentList(data.attachments || []);
    }
  }, [data]);

  const allDocumentInfo = useGetAllDocumentInfo();
  const fiscalYears = getFiscalYears(20);

  const memoizedDocumentTypes: SelectOption[] = useMemo(
    () =>
      allDocumentInfo.data?.data.documentTypes.map((type) => ({
        label: type.type_name,
        value: type.rid,
      })) || [],
    [allDocumentInfo.data?.data.documentTypes]
  );

  const memoizedDocumentCategories: SelectOption[] = useMemo(
    () =>
      allDocumentInfo.data?.data.documentCategories.map((category) => ({
        label: category.category_name,
        value: category.rid,
      })) || [],
    [allDocumentInfo.data?.data.documentCategories]
  );

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
  const handleOpen = () => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('attachment_entity', 'account');
    navigate({
      pathname: location.pathname,
      search: newParams.toString(),
    });
  };

  const headerButtons = [
    {
      label: 'Upload file',
      variant: 'outlined' as const,
      disabled: false,
      onClick: () => handleOpen(),
      sx: { ...BUTTON_STYLES, width: '90px', minWidth: '90px' },
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

  const attachmentColumns = getAttachmentColumns();
  const getRowId = (row: AttachmentList) => row.rid;

  const fieldOptions = {
    fiscalYears: fiscalYears,
    docCategories: memoizedDocumentCategories,
    docTypes: memoizedDocumentTypes,
  };

  const attachmentsFilterFields = getAttachmentsFilterFields(fieldOptions);

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
      />
      {showUploads ? (
        <Uploads
          accountId={accountid}
          attachID={accountid}
          fieldOptions={fieldOptions}
        />
      ) : (
        <>
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
        </>
      )}
    </div>
  );
};

export default Attachments;
