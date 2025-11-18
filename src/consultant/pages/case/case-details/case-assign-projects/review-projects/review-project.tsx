/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from 'react';
import { mockAssignProjects } from './mockdata';
import {
  AssignProject,
  ReviewProjectListURLParams,
} from '../../../../../types/assign-projects';
import { ListTable } from '../../../../../../components/table';
import { useParams, useSearchParams } from 'react-router-dom';
import { useReviewProjectList } from '../../../../../services/cases-assign-projects/review-project-service';
import { ExportType } from '../../../../../types';

interface ReviewProjectProps {
  accountInActive: boolean;
  visibleColumns: any[];
  searchText: string;
  refreshTrigger: number;
  // fiscalYear?: number;
  setTableParams?: React.Dispatch<
    React.SetStateAction<ReviewProjectListURLParams>
  >;
  setCount: React.Dispatch<React.SetStateAction<number>>;
  setExportType?: (type: ExportType) => void;
  appliedFilters: Record<string, string | number | boolean | string[]>;
}

const ReviewProjectsList: React.FC<ReviewProjectProps> = ({
  visibleColumns,
  searchText,
  refreshTrigger,
  setTableParams,
  // fiscalYear,
  setCount,
  setExportType,
  appliedFilters,
}) => {
  const { caseId } = useParams();
  const [searchParams] = useSearchParams();
  const accountid = searchParams.get('accountID') ?? '';
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [rowsPerPage, setRowsPerPage] = useState(100);
  const [sortField, setSortField] = useState<string>('project_code');
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
  const { data, isLoading, isError } = useReviewProjectList(
    {
      page: currentPage + 1,
      limit: rowsPerPage,
      sortOrder: sortBy,
      sortBy: sortField,
      search: searchText,
      filters: appliedFilters,
    },
    accountid,
    caseId,
    refreshTrigger
  );

  useEffect(() => {
    if (data?.count) {
      setCount(data?.count);
    }
    if (setExportType) {
      setExportType('review_projects');
    }
    setTableParams?.({
      page: currentPage + 1,
      limit: rowsPerPage,
      sortOrder: sortBy,
      sortBy: sortField,
      search: searchText,
      filters: {},
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    sortField,
    sortBy,
    searchText,
    rowsPerPage,
    currentPage,
    caseId,
    accountid,
    data?.count,
    setCount,
    setExportType,
    appliedFilters,
  ]);
  const getRowId = (row: AssignProject) => row.rid;
  return (
    <div>
      <ListTable
        data={data?.reviewProject || []}
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
        loading={isLoading}
        error={isError ? 'Failed to load projects' : undefined}
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
