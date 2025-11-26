/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from 'react';
import { AssignProject } from '../../../../../types/assign-projects';
import { ListTable } from '../../../../../../components/table';
import { useSelectProjectsList } from '../../../../../services/cases-assign-projects/assign-project-service';
import { useParams, useSearchParams } from 'react-router-dom';

interface selectProjectProps {
  accountInActive: boolean;
  setSelectedRows: React.Dispatch<React.SetStateAction<AssignProject[]>>;
  refreshTrigger: number;
  currentPage: number;
  searchText: string;
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
  visibleColumns: any[];
  setCount: React.Dispatch<React.SetStateAction<number>>;
  clearSelectedRows: boolean;
  fiscalYear: number;
}

const SelectProjects: React.FC<selectProjectProps> = ({
  setSelectedRows,
  refreshTrigger,
  currentPage,
  setCurrentPage,
  visibleColumns,
  searchText,
  setCount,
  clearSelectedRows,
  fiscalYear,
}) => {
  const { caseId } = useParams();
  const [searchParams] = useSearchParams();
  const [rowsPerPage, setRowsPerPage] = useState(100);
  const [sortField, setSortField] = useState<string>('project_type_name');
  const [sortBy, setSortBy] = useState<'ASC' | 'DESC'>('ASC');
  const accountID = searchParams.get('accountID') || '';
  const { data, isLoading, isError } = useSelectProjectsList(
    {
      page: currentPage + 1,
      limit: rowsPerPage,
      sort: sortField,
      sort_by: sortBy,
      search: searchText,
      filter: {},
      case_rid: caseId,
      account_rid: accountID,
      fiscal_year: fiscalYear,
    },
    refreshTrigger
  );

  useEffect(() => {
    if (isLoading) {
      setCount(0);
    } else if (data?.count !== undefined) {
      setCount(data.count);
    }
  }, [isLoading, data?.count, setCount]);

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

  const handleSelectionChange = (selectedIds: string[]) => {
    const selectedData = data?.projects?.filter((row) =>
      selectedIds.includes(row.rid)
    );
    setSelectedRows(selectedData || []);
  };

  const getRowId = (row: AssignProject) => row.rid;

  return (
    <div className='border border-[#CBD6E2] border-tss'>
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
        stickyHeader={true}
        stickyColumnsCount={1}
        selectable={true}
        onSelectionChange={handleSelectionChange}
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
        clearSelectedRows={clearSelectedRows}
      />
    </div>
  );
};

export default SelectProjects;
