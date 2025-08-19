import React, { useEffect, useState } from 'react';
import { InteractionList, InteractionListURLParams } from '../../../../types';
import { useGetAllInteractionList } from '../../../../services/interactions/interactions-service';
import { ListTable } from '../../../../../components/table';
import { getGlobalInteractionListColumns } from './columns';
import { generatePath, useNavigate } from 'react-router-dom';
import { INTERACTIONS_EDIT } from '../../../../../routes';
import { EditIcon } from '../../../../../assets';
import { ActionItem } from '../../../../../components/table/types';

interface InteractionTableProps {
  tableParams: InteractionListURLParams;
  setTableParams: React.Dispatch<
    React.SetStateAction<InteractionListURLParams>
  >;
  setTotalCount: React.Dispatch<React.SetStateAction<number>>;
  refreshTrigger?: number;
}

export const InteractionTable: React.FC<InteractionTableProps> = ({
  tableParams,
  setTableParams,
  setTotalCount,
  refreshTrigger,
}) => {
  const navigate = useNavigate();
  const [interactionList, setInteractionList] = useState<InteractionList[]>([]);

  const { data, isLoading, isError } = useGetAllInteractionList(
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

  const handleViewInteraction = (row: InteractionList) => {
    console.log(row);
    navigate(
      '/interactions/details/D001-0f689f8c-b27d-404b-8205-7dcfb5516ead?accountID=D001-ef8441a9-a2fb-4b8a-83d4-9fc41b82d262&source=project&currency_rid=&list=interactions&interaction_id=D001-0001&main_source=interactions'
    );
  };

  const handleEdit = (row: InteractionList) => {
    const path = generatePath(INTERACTIONS_EDIT, {
      module: 'interactions',
      interactionId: row.rid,
    });
    const queryParams = new URLSearchParams({
      accountId: row.rid,
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

  const handleViewInteractionHistory = (interactionHistoryId: string) => {
    console.log(interactionHistoryId);
    navigate(
      `/interactions/details/D001-0f689f8c-b27d-404b-8205-7dcfb5516ead?accountID=D001-ef8441a9-a2fb-4b8a-83d4-9fc41b82d262&source=project&currency_rid=&list=interactions&interaction_history_id=${interactionHistoryId}&main_source=interactions`
    );
  };

  const handleViewInteractionAttachment = (
    interactionAttachmentURL: string
  ) => {
    console.log(interactionAttachmentURL);
    navigate(
      `/interactions/details/D001-0f689f8c-b27d-404b-8205-7dcfb5516ead?accountID=D001-ef8441a9-a2fb-4b8a-83d4-9fc41b82d262&source=project&currency_rid=&list=interactions&interaction_attachment_url=${interactionAttachmentURL}&main_source=interactions`
    );
  };

  const getRowId = (row: InteractionList) => row.rid;
  const interactionColumns = getGlobalInteractionListColumns(
    handleViewInteraction,
    handleViewInteractionHistory,
    handleViewInteractionAttachment
  );

  return (
    <ListTable
      data={interactionList}
      columns={interactionColumns}
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
  );
};
