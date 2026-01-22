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
import { generatePath, useNavigate } from 'react-router-dom';
import { CHECKLIST_TEMPLATES_EDIT } from '../../../../../routes';
import {
  ChecklistTemplateList,
  ChecklistTemplateListParams,
} from '../../../../types';
import {
  ExportChecklistTemplate,
  useChecklistTemplateList,
} from '../../../../service/checklist-templates/checklist-template-service';
import { getChecklistTemplateColumns } from './columns';
import { checkPermission } from '../../../../../common-utils';
import { RootState } from '../../../../../store/store';
import { useSelector } from 'react-redux';
import { AllPermissions } from '../../../../../common-service';
import { useToast } from '../../../../../hooks';
import { useMutation } from '@apollo/client';
import { caseClient } from '../../../../../api/graphql/clients/client';
import { ADMIN_CHECKLIST_UPDATE } from '../../../../../api/graphql/queries/checklist-query';

interface ITemplateTableProps {
  appliedFilters: Record<string, FilterCondition>;
  tableParams: ChecklistTemplateListParams;
  setTableParams: React.Dispatch<
    React.SetStateAction<ChecklistTemplateListParams>
  >;
  refreshTrigger?: number;
  columnAnchorEl: HTMLButtonElement | null;
  setColumnAnchorEl: React.Dispatch<
    React.SetStateAction<HTMLButtonElement | null>
  >;
  statusOptions: { label: string; value: string }[];
}

export const TemplateTable: React.FC<ITemplateTableProps> = ({
  appliedFilters,
  tableParams,
  setTableParams,
  refreshTrigger,
  columnAnchorEl,
  setColumnAnchorEl,
  statusOptions,
}) => {
  const navigate = useNavigate();
  const { errorToast } = useToast();
  const [templateList, setTemplateList] = useState<ChecklistTemplateList[]>([]);

  const { data, isLoading, isError } = useChecklistTemplateList(
    { ...tableParams, filters: appliedFilters },
    refreshTrigger
  );
  const totalItems = data?.count || 0;

  useEffect(() => {
    if (data?.checklistTemplates) {
      setTemplateList(data?.checklistTemplates || []);
    }
  }, [data?.checklistTemplates]);

  const [updateAdminChecklist] = useMutation(ADMIN_CHECKLIST_UPDATE, {
    client: caseClient,
  });

  // Permission
  const { permission } = useSelector((state: RootState) => state.permission);

  const isChecklistTemplateExportEnable = checkPermission(
    permission,
    AllPermissions.CHECKLIST_TEMPLATES_EXPORT
  );

  const checklistTemplateViewEditFields = useMemo(
    () =>
      permission.find(
        (item) => item.name === AllPermissions.CHECKLIST_TEMPLATES_VIEW_EDIT
      )?.fields ?? [],
    [permission]
  );

  const permissionMap = useMemo(() => {
    const map: Record<string, { read: boolean; edit: boolean }> = {};
    checklistTemplateViewEditFields.forEach((item) => {
      map[item.name] = { read: item.read ?? false, edit: item.edit ?? false };
    });
    return map;
  }, [checklistTemplateViewEditFields]);

  const checklistTemplateFieldsEditable = useMemo(
    () =>
      permission
        .find(
          (item) => item.name === AllPermissions.CHECKLIST_TEMPLATES_VIEW_EDIT
        )
        ?.fields?.some((field) => field.edit),
    [permission]
  );

  const systemTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const handleDownload = (row: ChecklistTemplateList) => {
    ExportChecklistTemplate(row.rid, row.checklist_name, systemTimezone);
  };

  const getRowId = (row: ChecklistTemplateList) => row.rid;

  const handleEdit = (row: ChecklistTemplateList) => {
    const path = generatePath(CHECKLIST_TEMPLATES_EDIT, {
      caseId: row.rid,
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

  const checklistTemplateColumns = getChecklistTemplateColumns(
    handleDownload,
    permissionMap,
    statusOptions,
    isChecklistTemplateExportEnable
  );

  const [columnVisibility, setColumnVisibility] = useState<
    Record<string, boolean>
  >(
    Object.fromEntries(
      checklistTemplateColumns.map((col) => [col.id, !col.hide])
    )
  );

  const [columnOrder, setColumnOrder] = useState(
    checklistTemplateColumns.map((col) => col.id)
  );

  const handleColumnsChange = (updatedColumns: ShowHideTableColumn[]) => {
    const newVisibility = Object.fromEntries(
      updatedColumns.map((col) => [col.id, !col.hide])
    );
    setColumnVisibility(newVisibility);
    setColumnOrder(updatedColumns.map((col) => col.id));
  };

  const visibleColumns = columnOrder
    .map((id) => checklistTemplateColumns.find((col) => col.id === id)!)
    .filter((col) => columnVisibility[col.id]);

  const actionButtons: ActionItem<ChecklistTemplateList>[] = [
    {
      label: 'Edit',
      onClick: (row) => handleEdit(row),
      icon: EditIcon,
      hide: !checklistTemplateFieldsEditable,
      iconStyle: {
        filter:
          'brightness(0) saturate(100%) invert(25%) sepia(16%) saturate(592%) hue-rotate(164deg) brightness(93%) contrast(91%)',
      },
    },
  ];

  const RestrictedColumns = [
    {
      id: 'r_number',
      canHide: false,
      canDrag: false,
    },
  ];

  const handlePopoverClose = () => {
    setColumnAnchorEl(null);
  };

  const isModalOpen = Boolean(columnAnchorEl);
  const modalId = isModalOpen
    ? 'checklist-template-column-visibility-popover'
    : undefined;

  const handleCellEdit = async (rowId: string, updates: CellEditData[]) => {
    const previousTemplates = [...templateList];

    const updateData = updates.reduce<Record<string, FieldChangeValue>>(
      (acc, item) => {
        const key = item.editId || item.columnId;
        acc[key] = item.value;
        return acc;
      },
      {
        rid: rowId,
      }
    );

    try {
      const res = await updateAdminChecklist({
        variables: { data: updateData },
      });

      const result = res.data?.updateAdminChecklist;

      if (result?.statusCode === 200 && result?.data) {
        const updatedItem = result.data;

        setTemplateList((prev) =>
          prev.map((template) => {
            if (template.rid === rowId) {
              const newTemplate = {
                ...template,
                ...updatedItem,
              };
              if (updatedItem.status_rid && statusOptions) {
                const selectedOption = statusOptions.find(
                  (opt) => opt.value === updatedItem.status_rid
                );
                if (selectedOption) {
                  newTemplate.status_name = selectedOption.label;
                }
              }

              return newTemplate;
            }
            return template;
          })
        );
      } else {
        errorToast(result?.statusMessage || 'Failed to update field');
        setTemplateList(previousTemplates);
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.statusMessage ||
        (error as Error)?.message ||
        'Failed to update field';
      errorToast(errorMessage);
      setTemplateList(previousTemplates);
    }
  };

  return (
    <>
      <ManageColumnsPopover
        anchorEl={columnAnchorEl}
        open={isModalOpen}
        popoverId={modalId}
        onClose={handlePopoverClose}
        columns={checklistTemplateColumns}
        onColumnsChange={handleColumnsChange}
        columnRestrictions={RestrictedColumns}
      />
      <ListTable
        data={templateList}
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
        selectable={true}
        // Actions
        actionWidth={60}
        actionDisplayMode='dropdown'
        actionMenuItems={actionButtons}
        // State
        loading={isLoading}
        error={isError ? 'Failed to load checklist template' : undefined}
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
