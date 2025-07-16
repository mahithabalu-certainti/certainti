import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  AllPermissions,
  useGetAllDocumentInfo,
} from '../../../../../common-service';
import { ResourceTabs } from '../../../account-details-sidebar/sidebar-pages/resources/resources';
import { useEffect, useMemo, useState } from 'react';
import {
  AttachmentList,
  AttachmentsListExportParams,
} from '../../../../types/attachment';
import { useAttachmentList } from '../../../../services/attachments/attachments-service';
import { getProjectAttachmentColumns } from './column';
import ResourceTableHeader from '../../../account-details-sidebar/sidebar-pages/resources/resource-table-header';
import { Attachment } from '../../../../../assets';
import { ListTable } from '../../../../../components/table';
import { SectionTabPanel } from '../../../../../components';
import { SelectOption } from '../../../../types';
import Uploads from '../../../../../components/Attachments/upload';
import { getAttachmentsFilterFields } from '../../../../../components/Attachments/helpers';
import { getFiscalYears } from '../../../../../common-utils';
import {
  CellEditData,
  FieldChangeValue,
} from '../../../../../components/table/types';
import { ATTACHMENT_UPDATE } from '../../../../../api/graphql/queries/attachment-query';
import { useMutation } from '@apollo/client';
import { resourceClient } from '../../../../../api/graphql/clients/client';
import { useToast } from '../../../../../hooks';

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
interface AttachmentsProps {
  setExportType?: (
    type: 'resource' | 'cost' | 'skill' | 'project' | 'attachments'
  ) => void;
  setAttachmentParams: React.Dispatch<
    React.SetStateAction<AttachmentsListExportParams>
  >;
}

const Attachments: React.FC<AttachmentsProps> = ({
  setExportType,
  setAttachmentParams,
}) => {
  const { errorToast } = useToast();
  const [searchParams] = useSearchParams();
  const { projectid } = useParams();
  const accountID = searchParams.get('accountID');
  const navigate = useNavigate();
  const [appliedFilters, setAppliedFilters] = useState<
    Record<string, string | number | boolean>
  >({});
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
  const [updateAttachment] = useMutation(ATTACHMENT_UPDATE, {
    client: resourceClient,
  });

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

  useEffect(() => {
    if (setExportType) {
      setExportType('attachments');
    }
    setAttachmentParams({
      sortBy: sortField,
      sortOrder: sortOrder,
      filters: appliedFilters,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortField, sortOrder, appliedFilters]);

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

  const handleOpen = () => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('attachment_entity', 'project');
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

  const showUploads = searchParams.get('attachment_entity') === 'project';
  const fieldOptions = {
    fiscalYears: fiscalYears,
    docCategories: memoizedDocumentCategories,
    docTypes: memoizedDocumentTypes,
  };

  const attachmentsFilterFields = getAttachmentsFilterFields(fieldOptions);
  const attachmentColumns = getProjectAttachmentColumns(
    fiscalYears,
    memoizedDocumentCategories,
    memoizedDocumentTypes
  );

  const getRowId = (row: AttachmentList) => row.rid;

  const handleCellEdit = async (rowId: string, updates: CellEditData[]) => {
    const previousAttachments = [...attachmentList];
    // Find account_id
    const rowData = attachmentList.find((att) => att.rid === rowId);
    if (!rowData) {
      errorToast('Row not found.');
      return;
    }
    // Flags
    let hasDocType = false;
    let hasDocTypeOther = false;
    let hasDocCategory = false;
    let hasDocCategoryOther = false;

    const updateData = updates.reduce<Record<string, FieldChangeValue>>(
      (attach, item) => {
        const key = item.editId || item.columnId;

        attach[key] = key === 'fiscal_year' ? Number(item.value) : item.value;
        if (item.columnId === 'document_type') hasDocType = true;
        if (item.columnId === 'document_type_others') hasDocTypeOther = true;
        if (item.columnId === 'document_category') hasDocCategory = true;
        if (item.columnId === 'document_category_others')
          hasDocCategoryOther = true;

        return attach;
      },
      {
        rid: rowId,
        account_rid: rowData.account_rid,
      }
    );

    if (hasDocType && !hasDocTypeOther) {
      updateData['document_type_others'] = '';
    }
    if (hasDocCategory && !hasDocCategoryOther)
      updateData['document_category_others'] = '';

    try {
      const res = await updateAttachment({
        variables: { data: updateData },
      });
      const result = res.data?.updateAttachmentInline;
      if (result?.statusCode === 200 && result.data) {
        const updateAttachment = result.data;
        setAttachmentList((prev) =>
          prev.map((att) => {
            if (att.rid === updateAttachment.document_rid) {
              return {
                ...att,
                ...updateAttachment,
              };
            }
            return att;
          })
        );
      } else {
        errorToast(result?.statusMessage || 'Failed to update filed');
        setAttachmentList(previousAttachments);
      }
    } catch (error) {
      errorToast((error as Error)?.message || 'Failed to update filed');
      setAttachmentList(previousAttachments);
    }
  };

  return (
    <div className='w-full pt-2 pl-2 pr-4'>
      <SectionTabPanel
        tabs={AttachmentTabs}
        filterMenu={attachmentsFilterFields}
        filterVisibility={showUploads ? false : true}
        showFilter={showFilter}
        contextKey='project-attachments'
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
          accountId={accountID}
          attachID={projectid}
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
              onCellEdit={handleCellEdit}
            />
          </div>
        </>
      )}
    </div>
  );
};

export default Attachments;
