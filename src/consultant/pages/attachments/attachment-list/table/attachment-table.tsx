import { useSelector } from 'react-redux';
import {
  AttachmentList,
  AttachmentsListURLParams,
} from '../../../../types/attachment';
import { RootState } from '../../../../../store/store';
import { useEffect, useMemo, useState } from 'react';
import { useAllAttachmentList } from '../../../../services/attachments/attachments-service';
import {
  CellEditData,
  FieldChangeEvent,
  FieldChangeValue,
  ListTableColumn,
  ShowHideTableColumn,
} from '../../../../../components/table/types';
import {
  ListTable,
  ManageColumnsPopover,
} from '../../../../../components/table';
import {
  checkPermission,
  reshapeGlobalFilter,
} from '../../../../../common-utils';
import { FilterState } from '../../../../types';
import {
  FieldOptionType,
  getAttachmentTableColumns,
} from '../../../../../components/Attachments/helpers';
import { useMutation } from '@apollo/client';
import { ATTACHMENT_UPDATE } from '../../../../../api/graphql/queries/attachment-query';
import { resourceClient } from '../../../../../api/graphql/clients/client';
import { useToast } from '../../../../../hooks';
import { AllPermissions } from '../../../../../common-service';

interface IAttachmentTableProps {
  appliedFilters: Record<string, string | number | boolean>;
  tableParams: AttachmentsListURLParams;
  setTableParams: React.Dispatch<
    React.SetStateAction<AttachmentsListURLParams>
  >;
  setTotalCount: React.Dispatch<React.SetStateAction<number>>;
  refreshTrigger?: number;
  fieldOptions: FieldOptionType;
  setCurrentCategory: (rowId: string) => void;
  columnAnchorEl: HTMLButtonElement | null;
  setColumnAnchorEl: React.Dispatch<
    React.SetStateAction<HTMLButtonElement | null>
  >;
  searchValue?: string;
}

export const AttachmentTable: React.FC<IAttachmentTableProps> = ({
  appliedFilters,
  tableParams,
  setTableParams,
  setTotalCount,
  refreshTrigger,
  fieldOptions,
  setCurrentCategory,
  setColumnAnchorEl,
  columnAnchorEl,
  searchValue,
}) => {
  const { errorToast } = useToast();
  const { fiscalYear, filters } = useSelector<
    RootState,
    { filters: unknown; fiscalYear: string }
  >((state: RootState) => state.account);
  const [attachmentList, setAttachmentList] = useState<AttachmentList[]>([]);
  const { permission } = useSelector((state: RootState) => state.permission);
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
      search: searchValue,
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
  // Permissions
  const attachmentViewEditFields = useMemo(
    () =>
      permission?.find(
        (item) => item.name === AllPermissions.ATTACHMENT_VIEW_EDIT
      )?.fields ?? [],
    [permission]
  );

  const isAttachmentExportEnable = checkPermission(
    permission,
    AllPermissions.ATTACHMENT_EXPORT
  );

  const permissionMap = useMemo(() => {
    const map: Record<string, { read: boolean; edit: boolean }> = {};
    attachmentViewEditFields.forEach((item) => {
      map[item.name] = { read: item.read ?? false, edit: item.edit ?? false };
    });
    return map;
  }, [attachmentViewEditFields]);

  const getRowId = (row: AttachmentList) => row.document_rid;

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

  const attachmentsColumns = getAttachmentTableColumns(
    fieldOptions.fiscalYears,
    fieldOptions.docCategories,
    fieldOptions.docTypes,
    handleDocumentCategory,
    handleDownload,
    permissionMap,
    isAttachmentExportEnable,
    fieldOptions?.docTypesLoading
  );

  const handleFieldChange = async (event: FieldChangeEvent) => {
    if (event.columnId === 'document_category' && event.value) {
      setCurrentCategory(String(event.value));
    }
  };

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

  const [visibleColumns, setVisibleColumns] = useState<
    ListTableColumn<AttachmentList>[]
  >(attachmentsColumns.filter((col) => !col.hide));

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

  const RestrictedColumns = [
    {
      id: 'document_name',
      canHide: false,
      canDrag: false,
      // tooltip: 'Account name cannot be hidden or dragged',
    },
  ];

  const isModalOpen = Boolean(columnAnchorEl);
  const modalId = isModalOpen ? 'account-column-visibility-popover' : undefined;

  return (
    <>
      <ManageColumnsPopover
        anchorEl={columnAnchorEl}
        open={isModalOpen}
        popoverId={modalId}
        onClose={handlePopoverClose}
        columns={attachmentsColumns}
        onColumnsChange={handleColumnsChange}
        columnRestrictions={RestrictedColumns}
      />
      <ListTable
        data={attachmentList || []}
        columns={visibleColumns}
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
        onSelectionChange={(selectedIds) =>
          console.log('Selected:', selectedIds)
        }
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
        onFieldChange={handleFieldChange}
      />
    </>
  );
};
