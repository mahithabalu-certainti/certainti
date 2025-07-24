/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react';
import { ListTable } from '../../../../components/table';
import { manageUserAccountListColumns } from './column';
import { useSearchParams } from 'react-router-dom';
import { useManageProjectAccessList } from '../../../service/manage-account-access/manage-account-service';
import { ManageUserListParms } from '../../../types/manage-account';

interface UserTableProps {
  type?: string;
  setAddedProjects: React.Dispatch<
    React.SetStateAction<{ [rid: string]: boolean }>
  >;
}
export const ManageAccountListTable: React.FC<UserTableProps> = ({
  type = 'user',
  setAddedProjects,
}) => {
  const [searchParams] = useSearchParams();
  const [tableParams, setTableParams] = useState<ManageUserListParms>({
    sortBy: 'frist_name',
    sortOrder: 'DESC',
    entity_type: type,
    page: 1,
    limit: 100,
  });
  const [addedAccounts, setAddedAccounts] = useState<string[]>([]);

  const accountId = searchParams.get('accountid') ?? '';
  const entityId = searchParams.get('accountList') ?? '';
  const { data, isLoading, isError } = useManageProjectAccessList(
    accountId,
    entityId,
    tableParams
  );
  const projectListData = data?.data?.projects;

  const handlePageChange = (newPage: number) => {
    setTableParams((prev) => ({
      ...prev,
      page: newPage + 1,
    }));
  };
  const toggleProjects = (rowId: string, checked: boolean) => {
    setAddedAccounts((prev) =>
      checked ? [...prev, rowId] : prev.filter((item) => item !== rowId)
    );

    setAddedProjects((prev) => ({
      ...prev,
      [rowId]: checked,
    }));
  };

  const handleRowsPerPageChange = (newLimit: number) => {
    setTableParams((prev) => ({
      ...prev,
      limit: newLimit,
      page: 1,
    }));
  };
  const handleSort = (sortBy: string, sortOrder: 'asc' | 'desc') => {
    const apiOrder = sortOrder === 'asc' ? 'ASC' : 'DESC';
    setTableParams((prev) => ({
      ...prev,
      sortBy,
      sortOrder: apiOrder,
    }));
  };
  const getRowId = (row: any) => {
    return row.project_rid || '';
  };
  const projectColumns = manageUserAccountListColumns();

  return (
    <div>
      <ListTable
        data={projectListData || []}
        columns={projectColumns}
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
        expandAllParent={true}
        expandable={true}
        childrenKey='ProjectFiscal'
        maxNestingLevel={2}
        editDisableLevel={[0]}
        onSelectionChange={(selectedIds) =>
          console.log('Selected:', selectedIds)
        }
        actionWidth={130}
        actionDisplayMode='toggle'
        actionMenuItems={[]}
        loading={isLoading}
        error={isError ? 'Failed to load projects' : undefined}
        rowsPerPageOptions={[25, 50, 100]}
        rowsPerPage={tableParams.limit}
        currentPage={(tableParams.page ?? 1) - 1}
        totalItems={10}
        onPageChange={handlePageChange}
        onRowsPerPageChange={handleRowsPerPageChange}
        sortBy={tableParams.sortBy}
        sortOrder={tableParams.sortOrder}
        onSort={handleSort}
        actionColumnName='Inculsion/Exclusion'
        toggleClick={toggleProjects}
        toggleData={addedAccounts}
        component='Account-Access'
      />
    </div>
  );
};
