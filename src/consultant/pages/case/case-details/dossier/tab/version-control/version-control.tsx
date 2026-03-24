import { useParams, useSearchParams } from 'react-router';
import { useDossierVersionList } from '../../../../../../services/case-dossier/case-dossier-service';
import { ListTable } from '../../../../../../../components/table';
import { useState } from 'react';
import { ExportType } from '../../../../../../types';
import { getVersionControlColumns } from './column';
import { VersionControlItem } from '../../../../../../types/dossier';

interface VersionControlURLParams {
  page: number;
  limit: number;
  sortBy: string;
  sortOrder: 'ASC' | 'DESC';
}

interface VersionControlProps {
  refreshTrigger: number;
  currentPage: number;
  appliedFilters: Record<string, string | number | boolean | string[]>;
  setCount: (value: number) => void;
  setExportType?: (type: ExportType) => void;
  columnAnchorEl: HTMLButtonElement | null;
  setColumnAnchorEl: React.Dispatch<
    React.SetStateAction<HTMLButtonElement | null>
  >;
  searchValue: string;
  /** Called when the user clicks the download icon on a row. Receives the row's dossier_version. */
  onVersionDownload: (dossier_version: string) => void;
}

const VersionControl: React.FC<VersionControlProps> = ({
  refreshTrigger,
  currentPage,
  appliedFilters,
  setCount,
  columnAnchorEl,
  setColumnAnchorEl,
  searchValue,
  onVersionDownload,
}) => {
  const [searchParams] = useSearchParams();
  const { caseId } = useParams();
  const accountId = searchParams.get('accountID') || '';

  const [tableParams, setTableParams] = useState<VersionControlURLParams>({
    page: currentPage + 1,
    limit: 100,
    sortBy: 'created_datetime',
    sortOrder: 'ASC',
  });

  const { data, isLoading, error } = useDossierVersionList(
    {
      page: tableParams.page,
      limit: tableParams.limit,
      search: searchValue,
      filter: appliedFilters,
      case_rid: caseId ?? '',
      account_rid: accountId ?? '',
      sort: tableParams.sortBy,
      sort_by: tableParams.sortOrder,
    },
    refreshTrigger
  );

  const getRowId = (row: VersionControlItem) => row.rid;

  const handleSort = (sortBy: string, sortOrder: 'asc' | 'desc') => {
    const apiOrder = sortOrder === 'asc' ? 'ASC' : 'DESC';
    setTableParams((prev) => ({ ...prev, sortBy, sortOrder: apiOrder }));
  };

  const handlePageChange = (newPage: number) => {
    setTableParams((prev) => ({ ...prev, page: newPage + 1 }));
  };

  const handleRowsPerPageChange = (newLimit: number) => {
    setTableParams((prev) => ({ ...prev, limit: newLimit, page: 1 }));
  };

  const versionList = data?.versionList ?? [];
  const totalCount = data?.count ?? 0;

  // Sync count to parent
  if (setCount && totalCount !== undefined) {
    setCount(totalCount);
  }

  const visibleColumns = getVersionControlColumns(onVersionDownload);

  // Suppress unused-variable warning for columnAnchorEl / setColumnAnchorEl
  // They are forwarded by the parent for show/hide column functionality
  void columnAnchorEl;
  void setColumnAnchorEl;

  return (
    <>
      <ListTable
        data={versionList}
        columns={visibleColumns}
        getRowId={getRowId}
        hoverHighlight={false}
        tableStyle={{
          height: '100%',
          maxHeight: 'calc(100vh - 420px)',
          overflow: 'auto',
        }}
        stickyHeader={true}
        stickyColumnsCount={1}
        selectable={false}
        actionWidth={80}
        actionDisplayMode='dropdown'
        actionMenuItems={[]}
        loading={isLoading}
        error={error ? 'Failed to load version control data' : undefined}
        rowsPerPageOptions={[25, 50, 100]}
        rowsPerPage={tableParams.limit}
        currentPage={(tableParams.page ?? 1) - 1}
        totalItems={totalCount}
        onPageChange={handlePageChange}
        onRowsPerPageChange={handleRowsPerPageChange}
        sortBy={tableParams.sortBy}
        sortOrder={tableParams.sortOrder}
        onSort={handleSort}
      />
    </>
  );
};

export default VersionControl;
