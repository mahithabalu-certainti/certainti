import React, { useState } from 'react';
import { ListTable } from '../../../../../../../../components/table';
import { getAccountAssignUsersColumns } from './column';
import { UserGorupMockData } from '../../../../../../../../admin/mockdata/user-group';

const AssignGroups: React.FC = () => {
  let selectedUserId = '';

  const initialData = UserGorupMockData?.data?.users || [];

  const [userData, setUserData] = useState(initialData);

  const getRowId = (row: any) => row.rid;

  const handleAssignChange = (rowId: string, checked: boolean) => {
    setUserData((prevData) =>
      prevData.map((row) =>
        row.rid === rowId ? { ...row, assign: checked } : row
      )
    );
  };

  return (
    <ListTable
      data={userData}
      columns={getAccountAssignUsersColumns({
        selectedUserId,
        onAssignChange: handleAssignChange,
      })}
      getRowId={getRowId}
      hoverHighlight={false}
      tableStyle={{
        height: '100%',
        maxHeight: 'calc(100vh - 290px)',
        overflow: 'auto',
        paddingTop: '2px',
      }}
      stickyHeader={true}
      stickyColumnsCount={1}
      selectable={false}
      actionWidth={80}
      actionDisplayMode='dropdown'
      rowsPerPageOptions={[25, 50, 100]}
    />
  );
};

export default AssignGroups;
