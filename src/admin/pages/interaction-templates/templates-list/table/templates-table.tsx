import { useEffect, useMemo, useState } from 'react';
import { FilterCondition } from '../../../../types/manage-user';
import {
  ActionItem,
  ListTableColumn,
  ShowHideTableColumn,
} from '../../../../../components/table/types';
import { EditIcon } from '../../../../../assets';
import {
  ListTable,
  ManageColumnsPopover,
} from '../../../../../components/table';
import { getInteractionTemplateColumns } from './columns';
import { InteractionTemplateList, TemplateListParams } from '../../../../types';
import {
  ExportInteractionTemplate,
  useInteractionTemplateList,
} from '../../../../service/interaction-template/template-service';
import { generatePath, useNavigate } from 'react-router-dom';
import { INTERACTION_TEMPLATES_EDIT } from '../../../../../routes';
import { useSelector } from 'react-redux';
import { RootState } from '../../../../../store/store';
import { checkPermission } from '../../../../../common-utils';
import { AllPermissions } from '../../../../../common-service';

interface ITemplateTableProps {
  appliedFilters: Record<string, FilterCondition>;
  tableParams: TemplateListParams;
  setTableParams: React.Dispatch<React.SetStateAction<TemplateListParams>>;
  refreshTrigger?: number;
  columnAnchorEl: HTMLButtonElement | null;
  setColumnAnchorEl: React.Dispatch<
    React.SetStateAction<HTMLButtonElement | null>
  >;
}

export const TemplateTable: React.FC<ITemplateTableProps> = ({
  appliedFilters,
  tableParams,
  setTableParams,
  refreshTrigger,
  columnAnchorEl,
  setColumnAnchorEl,
}) => {
  const navigate = useNavigate();
  const [templateList, setTemplateList] = useState<InteractionTemplateList[]>(
    []
  );

  const { data, isLoading, isError } = useInteractionTemplateList(
    { ...tableParams, filters: appliedFilters },
    refreshTrigger
  );
  const totalItems = data?.count || 0;

  useEffect(() => {
    if (data?.interactions) {
      setTemplateList(data?.interactions || []);
    }
  }, [data?.interactions]);

  // Permission
  const { permission } = useSelector((state: RootState) => state.permission);

  const isTemplateExportEnable = checkPermission(
    permission,
    AllPermissions.INTERACTION_TEMPLATES_EXPORT
  );

  const templateViewEditFields = useMemo(
    () =>
      permission.find(
        (item) => item.name === AllPermissions.INTERACTION_TEMPLATES_VIEW_EDIT
      )?.fields ?? [],
    [permission]
  );

  const permissionMap = useMemo(() => {
    const map: Record<string, { read: boolean; edit: boolean }> = {};
    templateViewEditFields.forEach((item) => {
      map[item.name] = { read: item.read ?? false, edit: item.edit ?? false };
    });
    return map;
  }, [templateViewEditFields]);

  const templateFieldsEditable = useMemo(
    () =>
      permission
        .find(
          (item) => item.name === AllPermissions.INTERACTION_TEMPLATES_VIEW_EDIT
        )
        ?.fields?.some((field) => field.edit),
    [permission]
  );

  const handleDownload = (row: InteractionTemplateList) => {
    ExportInteractionTemplate(row.rid, row.template_name);
  };

  const getRowId = (row: InteractionTemplateList) => row.rid;

  const handleEdit = (row: InteractionTemplateList) => {
    const path = generatePath(INTERACTION_TEMPLATES_EDIT, {
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

  const templateColumns = useMemo(
    () =>
      getInteractionTemplateColumns(
        handleDownload,
        permissionMap,
        isTemplateExportEnable
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const [visibleColumns, setVisibleColumns] = useState<
    ListTableColumn<InteractionTemplateList>[]
  >(templateColumns.filter((col) => !col.hide));

  useEffect(() => {
    const updatedColumns = templateColumns.filter((col) => !col.hide);
    setVisibleColumns(updatedColumns);
  }, [templateColumns]);

  const actionButtons: ActionItem<InteractionTemplateList>[] = [
    {
      label: 'Edit',
      onClick: (row) => handleEdit(row),
      icon: EditIcon,
      hide: !templateFieldsEditable,
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

  const handleColumnsChange = (updatedColumns: ShowHideTableColumn[]) => {
    setVisibleColumns(
      updatedColumns.filter(
        (col) => !col.hide
      ) as ListTableColumn<InteractionTemplateList>[]
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
        error={isError ? 'Failed to load interaction template' : undefined}
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
      />
    </>
  );
};
