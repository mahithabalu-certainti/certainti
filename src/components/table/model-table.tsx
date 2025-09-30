/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { Suspense, useEffect, useState } from 'react';
import { CloseIcon, RefreshIcon, ResourceFilterIcon } from '../../assets';
import TextButton from '../button/text-button';
import ListTable from './list-table';
import { ModelTableParams } from '../../consultant/pages/account-details-sidebar/sidebar-pages/interactions/interactions';
import { Box } from '@mui/material';
import Filter from '../../consultant/pages/account-details-sidebar/components/filter/filter';
import { FieldConfig } from '../../consultant/pages/account-details-sidebar/components/filter/filterType';

interface TableModalProps {
  title: string;
  contextKey: string;
  emptyMessage?: string;
  sortFilterCount?: number;
  isOpen: boolean;
  onClose: () => void;
  handleSend: (rows: any[]) => void;
  data: any;
  loading: boolean;
  isError: boolean;
  visibleColumns: any[];
  filterMenu?: FieldConfig[];
  totalCount: number;
  tableParms: ModelTableParams;
  setTableParms: React.Dispatch<React.SetStateAction<ModelTableParams>>;
  handleFilter?: () => void;
  onRefreshClick?: () => void;
  saveBtnLoading: boolean;
  showRefresh?: boolean;
  filterVisibility?: boolean;
  showFilter?: boolean;
}

const TableModal: React.FC<TableModalProps> = ({
  title,
  contextKey,
  emptyMessage,
  sortFilterCount = 0,
  isOpen,
  onClose,
  handleSend,
  handleFilter,
  data,
  loading,
  isError,
  visibleColumns,
  filterMenu = [],
  totalCount,
  tableParms,
  setTableParms,
  onRefreshClick,
  saveBtnLoading,
  filterVisibility,
  showRefresh,
  showFilter,
}) => {
  const [selectedRows, setSelectedRows] = useState<any[]>([]);
  const [clearSelectedRows, setClearSelectedRows] = useState<boolean>(false);
  const handleClose = () => {
    onClose();
  };

  const [appliedFilters, setAppliedFilters] = useState<any>({});
  const [filterAnchorEl, setFilterAnchorEl] =
    useState<HTMLButtonElement | null>(null);
  const isFilterOpen = Boolean(filterAnchorEl);
  const filterId = isFilterOpen ? `${contextKey}-filter-popover` : undefined;
  const getRowId = (row: any) => row.rid;
  const handleSelectionChange = (selectedIds: string[]) => {
    const selectedData = data.filter((row: { rid: string }) =>
      selectedIds.includes(row.rid)
    );
    setSelectedRows(selectedData);
  };
  useEffect(() => {
    setTableParms((prev) => ({
      ...prev,
      filter: appliedFilters,
      page: 0,
    }));
  }, [appliedFilters, setTableParms]);
  const handlePageChange = (newPage: number) => {
    setTableParms((prev) => ({
      ...prev,
      page: newPage,
    }));
    setSelectedRows([]);
    setClearSelectedRows((prev) => !prev);
  };

  const handleRowsPerPageChange = (newPageSize: number) => {
    setTableParms((prev) => ({
      ...prev,
      limit: newPageSize,
      page: 1,
    }));
  };
  const handleFilterModal = (e: React.MouseEvent<HTMLButtonElement>) => {
    setFilterAnchorEl(e.currentTarget);
    if (filterVisibility && handleFilter) handleFilter();
  };
  const handleCloseFilter = () => {
    setFilterAnchorEl(null);
    if (filterVisibility && handleFilter) handleFilter();
  };
  const handleSortRequest = (property: string, sortOrder: 'asc' | 'desc') => {
    const apiOrder = sortOrder.toUpperCase() as 'ASC' | 'DESC';
    setTableParms((prev) => ({
      ...prev,
      sort: property,
      sort_by: apiOrder,
    }));
  };

  if (!isOpen) return null;
  return (
    <div
      className='fixed inset-0 flex items-center justify-center bg-black/50'
      style={{ zIndex: 999 }}
    >
      <div
        className='bg-white flex flex-col justify-between rounded-lg shadow-lg  w-[60%] p-5'
        style={{ minHeight: 'calc(100vh - 200px)' }}
      >
        <div className='flex justify-between items-center pb-1 border-b border-[#CBD6E2]'>
          <h2 className='text-[16px] font-bold text-[#2D3E4F]'>{title}</h2>
          <button
            onClick={handleClose}
            className='cursor-pointer hover:bg-gray-200 p-2 rounded-full'
          >
            <React.Suspense fallback={null}>
              <CloseIcon />
            </React.Suspense>
          </button>
        </div>
        <div className='flex-1'>
          <div className='flex gap-1.5 mt-1.5  justify-end'>
            {showFilter && (
              <>
                <Box className='relative'>
                  <Box
                    component='button'
                    onClick={handleFilterModal}
                    className='w-[24px] h-[24px] max-h-[24px] flex items-center justify-center border border-[#CBD6E2] rounded-[2px] cursor-pointer'
                    //   aria-describedby={filterId}
                  >
                    <ResourceFilterIcon />
                    {(Object.keys(tableParms.filter).length > 0 ||
                      sortFilterCount > 0) && (
                      <div className='absolute -top-[8px] -right-1.5 w-4 h-4 flex items-center justify-center text-xs'>
                        <span className='absolute w-full h-full bg-[#FF6666] rounded-full animate-ping opacity-75 z-0'></span>
                        <span className='w-3.5 h-3.5 bg-[#FF6666] text-white rounded-full flex items-center justify-center z-10 font-semibold'>
                          {Object.keys(tableParms.filter).length +
                            sortFilterCount}
                        </span>
                      </div>
                    )}
                  </Box>

                  <Suspense fallback={null}>
                    <Filter
                      value={contextKey}
                      isOpen={isFilterOpen}
                      filterAnchorEl={filterAnchorEl}
                      filterId={filterId}
                      filterMenu={filterMenu}
                      setAppliedFilters={setAppliedFilters}
                      handleCloseFilter={handleCloseFilter}
                      mode='date'
                    />
                  </Suspense>
                </Box>
              </>
            )}
            {showRefresh && (
              <div>
                <button
                  className='flex border border-[#CBD6E2] ml-2 w-[24px] h-[24px] bg-[linear-gradient(180deg,_#FFFFFF_0%,_#E4E6E7_100%)] justify-center items-center cursor-pointer'
                  onClick={onRefreshClick}
                >
                  <RefreshIcon alt='refresh-icon' className='h-4' />
                </button>
              </div>
            )}
          </div>

          <div className='border mt-1.5 border-[#CBD6E2]'>
            <ListTable
              data={data}
              columns={visibleColumns}
              getRowId={getRowId}
              hoverHighlight={false}
              tableStyle={{
                borderBottom: '1px solid #CBD6E2',
                height: '100%',
                maxHeight: 'calc(100vh - 415px)',
                overflow: 'auto',
              }}
              stickyHeader={true}
              stickyColumnsCount={1}
              selectable={true}
              onSelectionChange={handleSelectionChange}
              actionWidth={80}
              actionDisplayMode='dropdown'
              actionMenuItems={[]}
              loading={loading}
              error={isError ? 'Failed to load data' : undefined}
              rowsPerPageOptions={[25, 50, 100]}
              rowsPerPage={tableParms.limit}
              currentPage={tableParms.page}
              totalItems={totalCount}
              onPageChange={handlePageChange}
              onRowsPerPageChange={handleRowsPerPageChange}
              sortBy={tableParms.sort}
              sortOrder={tableParms.sort_by}
              onSort={handleSortRequest}
              clearSelectedRows={clearSelectedRows}
              emptyMessege={emptyMessage}
            />
          </div>
        </div>
        <div className='flex gap-3 mt-6 justify-end'>
          <TextButton
            label='Cancel'
            onClick={handleClose}
            disabled={false}
            sx={{
              width: '75px',
              minWidth: '75px',
              fontSize: '12px',
              fontWeight: 400,
            }}
          />
          <TextButton
            label='Send'
            onClick={() => handleSend(selectedRows)}
            loading={saveBtnLoading}
            sx={{
              width: '64px',
              minWidth: '64px',
              fontSize: '13px',
              fontWeight: 400,
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default TableModal;
