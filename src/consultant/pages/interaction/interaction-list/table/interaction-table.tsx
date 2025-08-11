import React, { useEffect, useState } from 'react';
import { InteractionList, InteractionListURLParams } from '../../../../types';
import { useGetAllInteractionList } from '../../../../services/interactions/interactions-service';
import { ListTable } from '../../../../../components/table';
import { getGlobalInteractionListColumns } from './columns';
import { generatePath, useNavigate } from 'react-router-dom';
import { INTERACTIONS_DETAILS, INTERACTIONS_EDIT } from '../../../../../routes';
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
    const path = generatePath(INTERACTIONS_DETAILS, {
      interactionId: row.rid,
    });
    const queryParams = new URLSearchParams({
      accountId: row.rid ?? '',
    });
    navigate(`${path}?${queryParams.toString()}`);
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

  const getRowId = (row: InteractionList) => row.rid;
  const interactionColumns = getGlobalInteractionListColumns(
    handleViewInteraction
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
