import { useEffect, useMemo, useState } from 'react';
import { FilterCondition } from '../../../../types/manage-user';
import {
  ActionItem,
  CellEditData,
  FieldChangeValue,
  ShowHideTableColumn,
} from '../../../../../components/table/types';
import { EditIcon } from '../../../../../assets';
import {
  ListTable,
  ManageColumnsPopover,
} from '../../../../../components/table';
import { getEmailTemplateColumns } from './columns';
import { EmailTemplateList, EmailTemplateListParams } from '../../../../types';
import { generatePath, useNavigate } from 'react-router-dom';
import { EMAIL_TEMPLATES_EDIT } from '../../../../../routes';
import { useEmailTemplateList } from '../../../../service/email-template/email-template-service';
import { useSelector } from 'react-redux';
import { RootState } from '../../../../../store/store';
import { AllPermissions } from '../../../../../common-service';
import { useMutation } from '@apollo/client';
import { EMAIL_TEMPLATE } from '../../../../../api/graphql/queries/email-template-query';
import { caseClient } from '../../../../../api/graphql/clients/client';
import { useToast } from '../../../../../hooks';

interface IEmailTemplateTableProps {
  appliedFilters: Record<string, FilterCondition>;
  tableParams: EmailTemplateListParams;
  setTableParams: React.Dispatch<React.SetStateAction<EmailTemplateListParams>>;
  refreshTrigger?: number;
  columnAnchorEl: HTMLButtonElement | null;
  setColumnAnchorEl: React.Dispatch<
    React.SetStateAction<HTMLButtonElement | null>
  >;
  statusOptions: { label: string; value: string }[];
  categoryOptions: { label: string; value: string }[];
}

export const EmailTemplateTable: React.FC<IEmailTemplateTableProps> = ({
  appliedFilters,
  tableParams,
  setTableParams,
  refreshTrigger,
  columnAnchorEl,
  setColumnAnchorEl,
  statusOptions,
  // categoryOptions,
}) => {
  const { errorToast } = useToast();
  const navigate = useNavigate();
  const [emailTemplateList, setEmailTemplateList] = useState<
    EmailTemplateList[]
  >([]);

  const [updateEmailTemplate] = useMutation(EMAIL_TEMPLATE, {
    client: caseClient,
  });

  const { data, isLoading, isError } = useEmailTemplateList(
    { ...tableParams, filters: appliedFilters },
    refreshTrigger
  );
  const totalItems = data?.count || 0;

  useEffect(() => {
    if (data?.emailTemplates) {
      setEmailTemplateList(data?.emailTemplates || []);
    }
  }, [data?.emailTemplates]);

  // Permission
  const { permission } = useSelector((state: RootState) => state.permission);

  const emailTemplateViewEditFields = useMemo(
    () =>
      permission.find(
        (item) => item.name === AllPermissions.EMAIL_TEMPLATES_VIEW_EDIT
      )?.fields ?? [],
    [permission]
  );

  const permissionMap = useMemo(() => {
    const map: Record<string, { read: boolean; edit: boolean }> = {};
    emailTemplateViewEditFields.forEach((item) => {
      map[item.name] = { read: item.read ?? false, edit: item.edit ?? false };
    });
    return map;
  }, [emailTemplateViewEditFields]);

  const emailTemplateFieldsEditable = useMemo(
    () =>
      permission
        .find((item) => item.name === AllPermissions.EMAIL_TEMPLATES_VIEW_EDIT)
        ?.fields?.some((field) => field.edit),
    [permission]
  );

  const getRowId = (row: EmailTemplateList) => row.rid;

  const handleEdit = (row: EmailTemplateList) => {
    const path = generatePath(EMAIL_TEMPLATES_EDIT, {
      templateId: row.rid,
    });
    navigate(path);
  };

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

  const templateColumns = getEmailTemplateColumns(permissionMap, statusOptions);

  const actionButtons: ActionItem<EmailTemplateList>[] = [
    {
      label: 'Edit',
      onClick: (row) => handleEdit(row),
      icon: EditIcon,
      hide: !emailTemplateFieldsEditable,
      iconStyle: {
        filter:
          'brightness(0) saturate(100%) invert(25%) sepia(16%) saturate(592%) hue-rotate(164deg) brightness(93%) contrast(91%)',
      },
    },
  ];

  const isModalOpen = Boolean(columnAnchorEl);

  const handlePopoverClose = () => setColumnAnchorEl(null);
  const modalId = isModalOpen
    ? 'case-checklist-list-column-visibility-popover'
    : undefined;

  const RestrictedColumns = [
    { id: 'r_number', canHide: false, canDrag: false },
  ];

  const [columnVisibility, setColumnVisibility] = useState<
    Record<string, boolean>
  >(Object.fromEntries(templateColumns.map((col) => [col.id, !col.hide])));

  const [columnOrder, setColumnOrder] = useState(
    templateColumns.map((col) => col.id)
  );

  const handleColumnsChange = (updatedColumns: ShowHideTableColumn[]) => {
    const newVisibility = Object.fromEntries(
      updatedColumns.map((col) => [col.id, !col.hide])
    );
    setColumnVisibility(newVisibility);
    setColumnOrder(updatedColumns.map((col) => col.id));
  };

  const visibleColumns = columnOrder
    .map((id) => templateColumns.find((col) => col.id === id)!)
    .filter((col) => columnVisibility[col.id]);

  const handleCellEdit = async (rowId: string, updates: CellEditData[]) => {
    const previousEmailTemplateList = [...emailTemplateList];

    const matchedEmailTemplate = emailTemplateList.find(
      (task) => task.rid === rowId
    );
    if (!matchedEmailTemplate) {
      return;
    }

    const updateData = updates.reduce<Record<string, FieldChangeValue>>(
      (usr, item) => {
        const key = item.editId || item.columnId;
        usr[key] = item.value;
        return usr;
      },
      {
        email_template_rid: rowId,
        category_rid: matchedEmailTemplate.category_rid,
      }
    );

    try {
      const res = await updateEmailTemplate({
        variables: { data: updateData },
      });
      const result = res.data?.updateEmailTemplate;
      if (result?.statusCode === 200 && result.data) {
        const updatedItem = result.data;
        setEmailTemplateList((prev) =>
          prev.map((item) =>
            item.rid === updatedItem.rid ? { ...item, ...updatedItem } : item
          )
        );
      } else {
        errorToast(result?.statusMessage || 'Failed to update field');
        setEmailTemplateList(previousEmailTemplateList);
      }
    } catch (error) {
      errorToast((error as Error)?.message || 'Failed to update field');
      setEmailTemplateList(previousEmailTemplateList);
    }
  };

  return (
    <>
      <ManageColumnsPopover
        anchorEl={columnAnchorEl}
        open={isModalOpen}
        popoverId={modalId}
        onClose={handlePopoverClose}
        columns={templateColumns}
        onColumnsChange={handleColumnsChange}
        columnRestrictions={RestrictedColumns}
      />
      <ListTable
        data={emailTemplateList}
        columns={visibleColumns}
        getRowId={getRowId}
        hoverHighlight={false}
        tableStyle={{
          height: '100%',
          maxHeight: 'calc(100vh - 190px)',
          overflow: 'auto',
        }}
        stickyHeader={true}
        stickyColumnsCount={2}
        // Selection
        selectable={false}
        // Actions
        actionWidth={60}
        actionDisplayMode='dropdown'
        actionMenuItems={actionButtons}
        // State
        loading={isLoading}
        error={isError ? 'Failed to load email templates' : undefined}
        // Pagination
        rowsPerPageOptions={[25, 50, 100]}
        rowsPerPage={tableParams.limit}
        currentPage={(tableParams.page ?? 1) - 1}
        totalItems={totalItems}
        onPageChange={handlePageChange}
        onRowsPerPageChange={handleRowsPerPageChange}
        // Sorting
        sortBy={tableParams.sortBy}
        sortOrder={tableParams.sortOrder}
        onSort={handleSort}
        onCellEdit={handleCellEdit}
      />
    </>
  );
};
