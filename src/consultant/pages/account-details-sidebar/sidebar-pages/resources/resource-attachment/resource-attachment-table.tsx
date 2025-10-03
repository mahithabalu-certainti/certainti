/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useMemo, useState } from 'react';
import { useAttachmentList } from '../../../../../services/attachments/attachments-service';
import { AttachmentList } from '../../../../../types/attachment';
import {
  ListTable,
  ManageColumnsPopover,
} from '../../../../../../components/table';
import { useParams } from 'react-router-dom';
import {
  AllModules,
  AllPermissions,
  useGetAllDocumentInfo,
  useGetDocumentCategoryType,
} from '../../../../../../common-service';
import {
  checkPermission,
  getFiscalYears,
} from '../../../../../../common-utils';
import { SelectOption } from '../../../../../types';
import { useToast } from '../../../../../../hooks';
import { ATTACHMENT_UPDATE } from '../../../../../../api/graphql/queries/attachment-query';
import { resourceClient } from '../../../../../../api/graphql/clients/client';
import { useMutation } from '@apollo/client';
import {
  CellEditData,
  FieldChangeEvent,
  FieldChangeValue,
  ListTableColumn,
  ShowHideTableColumn,
} from '../../../../../../components/table/types';
import { RootState } from '../../../../../../store/store';
import { useSelector } from 'react-redux';
import { getAttachmentTableColumns } from '../../../../../../components/Attachments/helpers';
import { AccessRestricted } from '../../../../../../components/account-restricted';
interface ResourceSkillTableProps {
  fiscalYear?: number;
  appliedFilters?: Record<string, any>;
  resourceRid: string;
  order: 'ASC' | 'DESC';
  setOrder: (order: 'ASC' | 'DESC') => void;
  orderBy: string;
  setOrderBy: (field: keyof AttachmentList) => void;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  refreshAttachments?: number;
  setCount?: (count: number) => void;
  resourceInActive?: boolean;
  accountDetails?: Record<string, any>;
  columnAnchorEl: HTMLButtonElement | null;
  setColumnAnchorEl: React.Dispatch<
    React.SetStateAction<HTMLButtonElement | null>
  >;
  searchValue?: string;
}
const ResourceAttachmentsTable: React.FC<ResourceSkillTableProps> = ({
  appliedFilters,
  resourceRid,
  currentPage,
  setCurrentPage,
  order,
  setOrder,
  orderBy,
  setOrderBy,
  refreshAttachments,
  accountDetails,
  setCount,
  columnAnchorEl,
  setColumnAnchorEl,
  searchValue,
}) => {
  const { errorToast } = useToast();
  const { accountid } = useParams();
  const [rowsPerPage, setRowsPerPage] = useState<number>(100);
  const { permission, modules } = useSelector(
    (state: RootState) => state.permission
  );
  const [attachmentList, setAttachmentList] = useState<AttachmentList[]>([]);
  const [currentCategory, setCurrentCategory] = useState<string>('');
  const [updateAttachment] = useMutation(ATTACHMENT_UPDATE, {
    client: resourceClient,
  });
  const { fiscalYear } = useSelector<RootState, { fiscalYear: string }>(
    (state: RootState) => state.account
  );
  const convertedFiscalYear = fiscalYear !== 'FY-All' ? Number(fiscalYear) : 0;

  const { data, isLoading, isError } = useAttachmentList(
    {
      page: currentPage + 1,
      limit: rowsPerPage,
      sortBy: orderBy,
      sortOrder: order,
      filters: appliedFilters,
      attachmentLevel: 'resource',
      accountRid: accountid,
      entityId: resourceRid || '',
      fiscalYear: convertedFiscalYear,
      search: searchValue,
    },
    refreshAttachments
  );

  const totalItems = data?.count || 0;

  useEffect(() => {
    if (setCount) {
      setCount(data?.count || 0);
    }
  }, [data, setCount]);

  useEffect(() => {
    if (data?.attachments) {
      setAttachmentList(data.attachments);
    }
  }, [data]);

  const minYear = 1950;
  const currentYear = new Date().getFullYear();
  const fiscalYears = getFiscalYears(currentYear - minYear + 1);
  const allDocumentInfo = useGetAllDocumentInfo();
  const categoryTypes = useGetDocumentCategoryType(currentCategory);
  const accountInActive =
    accountDetails?.data?.accountById?.status?.status_name?.toLowerCase() !==
    'active';

  const memoizedDocumentTypes: SelectOption[] = useMemo(
    () =>
      categoryTypes.data?.data.documentTypes.map((type) => ({
        label: type.type_name,
        value: type.rid,
      })) || [],
    [categoryTypes.data?.data.documentTypes]
  );

  const memoizedDocumentCategories: SelectOption[] = useMemo(
    () =>
      allDocumentInfo.data?.data.documentCategories.map((category) => ({
        label: category.category_name,
        value: category.rid,
      })) || [],
    [allDocumentInfo.data?.data.documentCategories]
  );

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  // handles page limit change
  const handleRowsPerPageChange = (newPageSize: number) => {
    setRowsPerPage(newPageSize);
    setCurrentPage(0);
  };

  const attachmentViewEditFields = useMemo(
    () =>
      permission?.find(
        (item) => item.name === AllPermissions.ATTACHMENT_VIEW_EDIT
      )?.fields ?? [],
    [permission]
  );

  const permissionMap = useMemo(() => {
    const map: Record<string, { read: boolean; edit: boolean }> = {};
    attachmentViewEditFields.forEach((item) => {
      map[item.name] = { read: item.read ?? false, edit: item.edit ?? false };
    });
    return map;
  }, [attachmentViewEditFields]);

  const attachmentEnable = checkPermission(modules, AllModules.ATTACHMENTS);

  const isAttachmentViewEnable = checkPermission(
    permission,
    AllPermissions.ATTACHMENT_VIEW_EDIT
  );

  const isAttachmentExportEnable = checkPermission(
    permission,
    AllPermissions.ATTACHMENT_EXPORT
  );

  const handleSortRequest = (property: string, sortOrder: 'asc' | 'desc') => {
    const apiOrder = sortOrder.toUpperCase() as 'ASC' | 'DESC';
    setOrder(apiOrder);
    setOrderBy(property as keyof AttachmentList);
  };

  const handleDocumentCategory = (rid: string) => {
    setCurrentCategory(rid);
  };

  const handleDownload = (documentUrl: string) => {
    if (!documentUrl) return;

    const link = document.createElement('a');
    link.href = documentUrl;
    link.download = '';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const attachmentColumns = useMemo(
    () =>
      getAttachmentTableColumns(
        fiscalYears,
        memoizedDocumentCategories,
        memoizedDocumentTypes,
        handleDocumentCategory,
        handleDownload,
        permissionMap,
        isAttachmentExportEnable,
        categoryTypes.isLoading,
        accountInActive
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [accountInActive, memoizedDocumentTypes]
  );

  const [visibleColumns, setVisibleColumns] = useState<
    ListTableColumn<AttachmentList>[]
  >(attachmentColumns.filter((col) => !col.hide));

  useEffect(() => {
    const updatedColumns = attachmentColumns.filter((col) => !col.hide);
    setVisibleColumns(updatedColumns);
  }, [accountInActive, memoizedDocumentTypes, attachmentColumns]);

  const handleFieldChange = async (event: FieldChangeEvent) => {
    if (event.columnId === 'document_category' && event.value) {
      setCurrentCategory(String(event.value));
    }
  };

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

    if (
      hasDocCategory &&
      hasDocType &&
      !hasDocCategoryOther &&
      !hasDocTypeOther
    ) {
      updateData['document_category_others'] = '';
      updateData['document_type_others'] = '';
    }

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

  const RestrictedColumns = [
    {
      id: 'document_name',
      canHide: false,
      canDrag: false,
    },
  ];

  if (!attachmentEnable || !isAttachmentViewEnable) return <AccessRestricted />;

  const handleColumnsChange = (updatedColumns: ShowHideTableColumn[]) => {
    setVisibleColumns(
      updatedColumns.filter(
        (col) => !col.hide
      ) as ListTableColumn<AttachmentList>[]
    );
  };

  const handlePopoverClose = () => {
    setColumnAnchorEl(null);
  };

  const isModalOpen = Boolean(columnAnchorEl);
  const modalId = isModalOpen
    ? 'interaction-column-visibility-popover'
    : undefined;

  return (
    <div>
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
        data={attachmentList}
        columns={visibleColumns}
        getRowId={getRowId}
        hoverHighlight={false}
        tableStyle={{
          borderBottom: '1px solid #CBD6E2',
          height: '100%',
          maxHeight: 'calc(100vh - 450px)',
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
        sortBy={orderBy}
        sortOrder={order.toUpperCase() as 'ASC' | 'DESC'}
        onSort={handleSortRequest}
        onCellEdit={handleCellEdit}
        onFieldChange={handleFieldChange}
      />
    </div>
  );
};

export default ResourceAttachmentsTable;
