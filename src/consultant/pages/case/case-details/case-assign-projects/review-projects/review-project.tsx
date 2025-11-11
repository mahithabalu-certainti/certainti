/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react';
import { mockAssignProjects } from './mockdata';
import { AssignProject } from '../../../../../types/assign-projects';

import { ListTable } from '../../../../../../components/table';
interface ReviewProjectProps {
  accountInActive: boolean;
  visibleColumns: any[];
}

const ReviewProjectsList: React.FC<ReviewProjectProps> = ({
  visibleColumns,
}) => {
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [rowsPerPage, setRowsPerPage] = useState(100);
  const [sortField, setSortField] = useState<string>('interaction_source_name');
  const [sortBy, setSortBy] = useState<'ASC' | 'DESC'>('ASC');

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const handleRowsPerPageChange = (newPageSize: number) => {
    setRowsPerPage(newPageSize);
    setCurrentPage(1);
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
        data={mockAssignProjects || []}
        columns={visibleColumns}
        getRowId={getRowId}
        hoverHighlight={false}
        tableStyle={{
          borderBottom: '1px solid #CBD6E2',
          height: '100%',
          maxHeight: 'calc(100vh - 380px)',
          overflow: 'auto',
        }}
        stickyHeader={true}
        stickyColumnsCount={1}
        selectable={true}
        actionWidth={80}
        actionDisplayMode='dropdown'
        actionMenuItems={[]}
        loading={false}
        error={undefined}
        rowsPerPageOptions={[25, 50, 100]}
        rowsPerPage={rowsPerPage}
        currentPage={currentPage}
        totalItems={mockAssignProjects.length}
        onPageChange={handlePageChange}
        onRowsPerPageChange={handleRowsPerPageChange}
        sortBy={sortField}
        sortOrder={sortBy}
        onSort={handleSortRequest}
      />
    </div>
  );
};

export default ReviewProjectsList;
