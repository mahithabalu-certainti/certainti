import React, { useEffect, useState } from 'react';
import { InteractionList, InteractionListURLParams } from '../../../../types';
import { useGlobalInteractionList } from '../../../../services/interactions/interactions-service';
import {
  ListTable,
  ManageColumnsPopover,
} from '../../../../../components/table';
import { getGlobalInteractionListColumns } from './columns';
import { generatePath, useNavigate } from 'react-router-dom';
import { GLOBAL_INTERACTIONS_EDIT } from '../../../../../routes';
import { EditIcon } from '../../../../../assets';
import {
  ActionItem,
  ListTableColumn,
  ShowHideTableColumn,
} from '../../../../../components/table/types';

interface InteractionTableProps {
  tableParams: InteractionListURLParams;
  setTableParams: React.Dispatch<
    React.SetStateAction<InteractionListURLParams>
  >;
  setTotalCount: React.Dispatch<React.SetStateAction<number>>;
  refreshTrigger?: number;
  columnAnchorEl: HTMLButtonElement | null;
  setColumnAnchorEl: React.Dispatch<
    React.SetStateAction<HTMLButtonElement | null>
  >;
}

export const InteractionTable: React.FC<InteractionTableProps> = ({
  tableParams,
  setTableParams,
  setTotalCount,
  refreshTrigger,
  columnAnchorEl,
  setColumnAnchorEl,
}) => {
  const navigate = useNavigate();
  const [interactionList, setInteractionList] = useState<InteractionList[]>([]);

  const { data, isLoading, isError } = useGlobalInteractionList(
    tableParams,
    refreshTrigger
  );
  const totalItems = data?.count || 0;

  useEffect(() => {
    if (data) {
      setInteractionList(data.interactions || []);
      setTotalCount(data.count || 0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  const handleSort = (sort: string, sortOrder: 'asc' | 'desc') => {
    const apiOrder = sortOrder === 'asc' ? 'ASC' : 'DESC';
    setTableParams((prev) => ({
      ...prev,
      sort,
      sort_by: apiOrder,
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

  const handleEdit = (row: InteractionList) => {
    const path = generatePath(GLOBAL_INTERACTIONS_EDIT, {
      interactionId: row.rid,
    });
    const queryParams = new URLSearchParams({
      accountId: row.account_rid,
      account_name: row.account_name ?? '',
      source: 'account',
    });
    navigate(`${path}?${queryParams.toString()}`);
  };

  const actionButtons: ActionItem<InteractionList>[] = [
    {
      label: 'Edit',
      onClick: (row: InteractionList) => handleEdit(row),
      icon: EditIcon,
      disabled: false,
      iconStyle: {
        filter:
          'brightness(0) saturate(100%) invert(25%) sepia(16%) saturate(592%) hue-rotate(164deg) brightness(93%) contrast(91%)',
      },
    },
  ];

  const handleViewInteraction = (row: InteractionList) => {
    navigate(
      `/interactions/details/${row.project_fiscal_rid}?accountID=${row.account_rid}&source=project&currency_rid=&list=interactions&interaction_id=${row.rid}`
    );
  };

  const handleViewInteractionHistory = (row: InteractionList) => {
    navigate(
      `/interactions/details/${row.project_fiscal_rid}?accountID=${row.account_rid}&source=project&currency_rid=&list=interactions&interaction_history_id=${row.rid}`
    );
  };

  const handleViewInteractionAttachmentCount = (row: InteractionList) => {
    navigate(
      `/interactions/details/${row.project_fiscal_rid}?accountID=${row.account_rid}&source=project&currency_rid=&list=interactions&interaction_rid=${row.rid}&interaction_attachment_count=${row.attachment_count}`
    );
  };

  const getRowId = (row: InteractionList) => row.rid;
  const interactionColumns = getGlobalInteractionListColumns(
    handleViewInteraction,
    handleViewInteractionHistory,
    handleViewInteractionAttachmentCount
  );

  const RestrictedColumns = [
    {
      id: 'r_number',
      canHide: false,
      canDrag: false,
    },
  ];

  const [visibleColumns, setVisibleColumns] = useState<
    ListTableColumn<InteractionList>[]
  >(interactionColumns.filter((col) => !col.hide));

  const handleColumnsChange = (updatedColumns: ShowHideTableColumn[]) => {
    setVisibleColumns(
      updatedColumns.filter(
        (col) => !col.hide
      ) as ListTableColumn<InteractionList>[]
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
    <div className='border-t border-[#CBD6E2] h-full'>
      <ManageColumnsPopover
        anchorEl={columnAnchorEl}
        open={isModalOpen}
        popoverId={modalId}
        onClose={handlePopoverClose}
        columns={interactionColumns}
        onColumnsChange={handleColumnsChange}
        columnRestrictions={RestrictedColumns}
      />
      <ListTable
        data={interactionList}
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
        actionMenuItems={actionButtons}
        loading={isLoading}
        error={isError ? 'Failed to load interaction data' : undefined}
        rowsPerPageOptions={[25, 50, 100]}
        rowsPerPage={tableParams.limit}
        currentPage={(tableParams.page ?? 1) - 1}
        totalItems={totalItems}
        onPageChange={handlePageChange}
        onRowsPerPageChange={handleRowsPerPageChange}
        sortBy={tableParams.sort}
        sortOrder={tableParams.sort_by}
        onSort={handleSort}
      />
    </div>
  );
};
