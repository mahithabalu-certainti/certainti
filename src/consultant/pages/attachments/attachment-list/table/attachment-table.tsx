import { useSelector } from 'react-redux';
import {
  AttachmentList,
  AttachmentsListURLParams,
} from '../../../../types/attachment';
import { RootState } from '../../../../../store/store';
import { useEffect, useState } from 'react';
import { useAllAttachmentList } from '../../../../services/attachments/attachments-service';
import { getAllAttachmentColumns } from './columns';
import {
  CellEditData,
  FieldChangeValue,
} from '../../../../../components/table/types';
import { ListTable } from '../../../../../components/table';
import { reshapeGlobalFilter } from '../../../../../common-utils';
import { FilterState } from '../../../../types';
import { FieldOptionType } from '../../../../../components/Attachments/helpers';
import { useMutation } from '@apollo/client';
import { ATTACHMENT_UPDATE } from '../../../../../api/graphql/queries/attachment-query';
import { resourceClient } from '../../../../../api/graphql/clients/client';
import { useToast } from '../../../../../hooks';

interface IAttachmentTableProps {
  appliedFilters: Record<string, string | number | boolean>;
  tableParams: AttachmentsListURLParams;
  setTableParams: React.Dispatch<
    React.SetStateAction<AttachmentsListURLParams>
  >;
  setTotalCount: React.Dispatch<React.SetStateAction<number>>;
  refreshTrigger?: number;
  fieldOptions: FieldOptionType;
}

export const AttachmentTable: React.FC<IAttachmentTableProps> = ({
  appliedFilters,
  tableParams,
  setTableParams,
  setTotalCount,
  refreshTrigger,
  fieldOptions,
}) => {
  const { errorToast } = useToast();
  const { fiscalYear, filters } = useSelector<
    RootState,
    { filters: unknown; fiscalYear: string }
  >((state: RootState) => state.account);
  const [attachmentList, setAttachmentList] = useState<AttachmentList[]>([]);
  const [updateAttachment] = useMutation(ATTACHMENT_UPDATE, {
    client: resourceClient,
  });

  useEffect(() => {
    const newFiscalYear = fiscalYear !== 'FY-All' ? Number(fiscalYear) : 0;

    if (
      tableParams.fiscalYear === newFiscalYear &&
      JSON.stringify(tableParams.filters) === JSON.stringify(appliedFilters)
    ) {
      return;
    }

    setTableParams((prev) => ({
      ...prev,
      page: 1,
      filters: appliedFilters,
      fiscalYear: newFiscalYear,
      globalFilters: reshapeGlobalFilter(filters as FilterState),
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appliedFilters, fiscalYear, filters]);

  const { data, isLoading, isError } = useAllAttachmentList(
    tableParams,
    refreshTrigger
  );
  const totalItems = data?.count || 0;

  useEffect(() => {
    if (data) {
      setTotalCount(data?.count || 0);
      setAttachmentList(data.attachments || []);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  const handleSort = (sortBy: string, sortOrder: 'asc' | 'desc') => {
    const apiOrder = sortOrder === 'asc' ? 'ASC' : 'DESC';
    setTableParams((prev) => ({
      ...prev,
      sortBy,
      sortOrder: apiOrder,
    }));
  };

  const handlePageChange = (newPage: number) => {
    setTableParams((prev) => ({
      ...prev,
      page: newPage + 1,
    }));
  };

  const handleRowsPerPageChange = (newLimit: number) => {
    setTableParams((prev) => ({
      ...prev,
      limit: newLimit,
      page: 1,
    }));
  };

  const getRowId = (row: AttachmentList) => row.document_rid;

  const attachmentsColumns = getAllAttachmentColumns(
    fieldOptions.fiscalYears,
    fieldOptions.docCategories,
    fieldOptions.docTypes
  );

  const handleCellEdit = async (rowId: string, updates: CellEditData[]) => {
    const previousAttachments = [...attachmentList];
    // Find account_id
    const rowData = attachmentList.find((att) => att.document_rid === rowId);
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
            if (att.document_rid === updateAttachment.document_rid) {
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
    <ListTable
      data={attachmentList || []}
      columns={attachmentsColumns}
      getRowId={getRowId}
      hoverHighlight={false}
      tableStyle={{
        height: '100%',
        maxHeight: 'calc(100vh - 180px)',
        overflow: 'auto',
      }}
      stickyHeader={true}
      stickyColumnsCount={2}
      selectable={true}
      onSelectionChange={(selectedIds) => console.log('Selected:', selectedIds)}
      actionWidth={60}
      actionDisplayMode='dropdown'
      actionMenuItems={[]}
      loading={isLoading}
      error={isError ? 'Failed to load Attachment data' : undefined}
      rowsPerPageOptions={[25, 50, 100]}
      rowsPerPage={tableParams.limit}
      currentPage={(tableParams.page ?? 1) - 1}
      totalItems={totalItems}
      onPageChange={handlePageChange}
      onRowsPerPageChange={handleRowsPerPageChange}
      sortBy={tableParams.sortBy}
      sortOrder={tableParams.sortOrder}
      onSort={handleSort}
      onCellEdit={handleCellEdit}
    />
  );
};
