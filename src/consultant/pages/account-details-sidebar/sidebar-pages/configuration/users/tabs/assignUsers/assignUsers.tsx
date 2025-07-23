/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from 'react';
import { ListTable } from '../../../../../../../../components/table';
import { getAccountAssignUsersColumns } from './column';
import { UserGorupMockData } from '../../../../../../../../admin/mockdata/user-group';

type SelectionType = 'inclusion' | 'exclusion' | null;

const AssignUsers: React.FC = () => {
  const actionMenuItems = [
    {
      label: 'View Summary',
      onClick: (row: any) => console.log('Summary', row),
      hide: true,
    },
    {
      label: 'View Activities',
      onClick: (row: any) => console.log('Activities', row),
      hide: true,
    },
    {
      label: 'View Notes',
      onClick: (row: any) => console.log('Notes', row),
      hide: true,
    },
  ];

  const [selectionState, setSelectionState] = useState<
    Record<string, SelectionType>
  >({});

  const handleInclusionChange = (userId: string) => {
    setSelectionState((prev) => ({
      ...prev,
      [userId]: prev[userId] === 'inclusion' ? null : 'inclusion',
    }));
  };

  const handleExclusionChange = (userId: string) => {
    setSelectionState((prev) => ({
      ...prev,
      [userId]: prev[userId] === 'exclusion' ? null : 'exclusion',
    }));
  };

  const userData = UserGorupMockData?.data?.users || [];
  const getRowId = (row: any) => row.rid;

  return (
    <ListTable
      data={userData}
      columns={getAccountAssignUsersColumns({
        selectionState,
        handleInclusionChange,
        handleExclusionChange,
      })}
      getRowId={getRowId}
      hoverHighlight={false}
      tableStyle={{
        height: '100%',
        maxHeight: 'calc(100vh - 290px)',
        overflow: 'auto',
        paddingTop: '2px',
      }}
      stickyHeader
      stickyColumnsCount={1}
      selectable={false}
      actionWidth={80}
      actionDisplayMode='dropdown'
      actionMenuItems={actionMenuItems}
      rowsPerPageOptions={[25, 50, 100]}
    />
  );
};

export default AssignUsers;
