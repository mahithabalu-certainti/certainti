/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState } from 'react';
import { AssignProject } from '../../../../../types/assign-projects';
import { useAssingeProjectsList } from '../../../../../services/cases-assign-projects/assign-project-service';
import { ListTable } from '../../../../../../components/table';
import { useParams, useSearchParams } from 'react-router-dom';

interface AssignedProjectsProps {
  accountInActive: boolean;
  setSelectedRows: React.Dispatch<React.SetStateAction<AssignProject[]>>;
  refreshTrigger: number;
  currentPage: number;
  searchText: string;
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
  visibleColumns: any[];
}

const AssignedProjects: React.FC<AssignedProjectsProps> = ({
  setSelectedRows,
  refreshTrigger,
  currentPage,
  setCurrentPage,
  visibleColumns,
  searchText,
}) => {
  const { caseId } = useParams();
  const [searchParams] = useSearchParams();
  const [rowsPerPage, setRowsPerPage] = useState(100);
  const [sortField, setSortField] = useState<string>('project_type_name');
  const [sortBy, setSortBy] = useState<'ASC' | 'DESC'>('ASC');
  // const { permission } = useSelector((state: RootState) => state.permission);
  const accountID = searchParams.get('accountID') || '';
  const { data, isLoading, isError } = useAssingeProjectsList(
    {
      page: currentPage + 1,
      limit: rowsPerPage,
      sort: sortField,
      sort_by: sortBy,
      search: searchText,
      filter: {},
      case_rid: caseId,
      account_rid: accountID, // Replace with the actual account_rid
      fiscal_year: 2024,
    },
    refreshTrigger
  );

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const handleRowsPerPageChange = (newPageSize: number) => {
    setRowsPerPage(newPageSize);
    setCurrentPage(1);
  };
  const handleSelectionChange = (selectedIds: string[]) => {
    const selectedData = data?.projects?.filter((row) =>
      selectedIds.includes(row.rid)
    );
    setSelectedRows(selectedData || []);
  };
  const handleSortRequest = (property: string, sortOrder: 'asc' | 'desc') => {
    const apiOrder = sortOrder.toUpperCase() as 'ASC' | 'DESC';
    setSortBy(apiOrder);
    setSortField(property);
  };
  const getRowId = (row: AssignProject) => row.rid;
  return (
    <div>
      <ListTable
        data={data?.projects || []}
        columns={visibleColumns}
        getRowId={getRowId}
        hoverHighlight={false}
        tableStyle={{
          borderBottom: '1px solid #CBD6E2',
          height: '100%',
          maxHeight: 'calc(100vh - 380px)',
          overflow: 'auto',
        }}
        onSelectionChange={handleSelectionChange}
        stickyHeader={true}
        stickyColumnsCount={1}
        selectable={true}
        actionWidth={80}
        actionDisplayMode='dropdown'
        actionMenuItems={[]}
        loading={isLoading}
        error={isError ? 'Failed to load projects' : undefined}
        rowsPerPageOptions={[25, 50, 100]}
        rowsPerPage={rowsPerPage}
        currentPage={currentPage}
        totalItems={data?.count || 0}
        onPageChange={handlePageChange}
        onRowsPerPageChange={handleRowsPerPageChange}
        sortBy={sortField}
        sortOrder={sortBy}
        onSort={handleSortRequest}
      />
    </div>
  );
};

export default AssignedProjects;
