/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useMemo, useState } from 'react';
import { useAttachmentList } from '../../../../../services/attachments/attachments-service';
import { AttachmentList } from '../../../../../types/attachment';
import { getResourceAttachmentColumns } from './column';
import { ListTable } from '../../../../../../components/table';
import { useParams } from 'react-router-dom';
import {
  AllPermissions,
  useGetAllDocumentInfo,
} from '../../../../../../common-service';
import { getFiscalYears } from '../../../../../../common-utils';
import { SelectOption } from '../../../../../types';
import { useToast } from '../../../../../../hooks';
import { ATTACHMENT_UPDATE } from '../../../../../../api/graphql/queries/attachment-query';
import { resourceClient } from '../../../../../../api/graphql/clients/client';
import { useMutation } from '@apollo/client';
import {
  CellEditData,
  FieldChangeValue,
} from '../../../../../../components/table/types';
import { RootState } from '../../../../../../store/store';
import { useSelector } from 'react-redux';

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
  setCount,
}) => {
  const { errorToast } = useToast();
  const { accountid } = useParams();
  const [rowsPerPage, setRowsPerPage] = useState<number>(100);
  const { permission } = useSelector((state: RootState) => state.permission);
  const [attachmentList, setAttachmentList] = useState<AttachmentList[]>([]);
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
    },
    refreshAttachments
  );

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

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  // handles page limit change
  const handleRowsPerPageChange = (newPageSize: number) => {
    setRowsPerPage(newPageSize);
    setCurrentPage(0);
  };

  const costViewEditFields = useMemo(
    () =>
      permission?.find(
        (item) => item.name === AllPermissions.ATTACHMENT_VIEW_EDIT
      )?.fields ?? [],
    [permission]
  );

  const permissionMap = useMemo(() => {
    const map: Record<string, { read: boolean; edit: boolean }> = {};
    costViewEditFields.forEach((item) => {
      map[item.name] = { read: item.read ?? false, edit: item.edit ?? false };
    });
    return map;
  }, [costViewEditFields]);

  const handleSortRequest = (property: string, sortOrder: 'asc' | 'desc') => {
    const apiOrder = sortOrder.toUpperCase() as 'ASC' | 'DESC';
    setOrder(apiOrder);
    setOrderBy(property as keyof AttachmentList);
  };

  const attachmentColumns = getResourceAttachmentColumns(
    fiscalYears,
    memoizedDocumentCategories,
    memoizedDocumentTypes,
    permissionMap
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
    <div>
      <ListTable
        data={attachmentList}
        columns={attachmentColumns}
        getRowId={getRowId}
        hoverHighlight={false}
        tableStyle={{
          borderBottom: '1px solid #CBD6E2',
          height: '100%',
          maxHeight: 'calc(100vh - 410px)',
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
        sortBy={orderBy}
        sortOrder={order.toUpperCase() as 'ASC' | 'DESC'}
        onSort={handleSortRequest}
        onCellEdit={handleCellEdit}
      />
    </div>
  );
};

export default ResourceAttachmentsTable;
