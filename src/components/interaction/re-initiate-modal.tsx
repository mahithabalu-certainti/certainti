/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { Suspense, useEffect, useState } from 'react';
import { ModelTableParams } from '../../consultant/pages/account-details-sidebar/sidebar-pages/interactions/interactions';
import { REGEX_PATTERNS } from '../../common-utils';
import { getReInitiateConfirmColumns } from './helper';
import { RefreshIcon, ResourceFilterIcon } from '../../assets';
import { Box } from '@mui/material';
import { ListTable } from '../table';
import TextButton from '../button/text-button';
import Filter from '../../consultant/pages/account-details-sidebar/components/filter/filter';
import { FieldConfig } from '../../consultant/pages/account-details-sidebar/components/filter/filterType';

interface ReInitiateModalProps {
  title: string;
  contextKey: string;
  emptyMessage?: string;
  sortFilterCount?: number;
  isOpen: boolean;
  onClose: () => void;
  handleSend: (
    rows: any[],
    recipient?: { name: string; email: string }
  ) => void;
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

const ReInitiateModal: React.FC<ReInitiateModalProps> = ({
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
  const [step, setStep] = useState<1 | 2>(1);
  const [showAlternateRecipient, setShowAlternateRecipient] = useState(false);
  const [recipient, setRecipient] = useState({ name: '', email: '' });
  const [errors, setErrors] = useState<{ name?: string; email?: string }>({});

  const [appliedFilters, setAppliedFilters] = useState<
    Record<string, string | number | boolean | string[]>
  >({});

  // Derive selected row IDs from selectedRows
  const selectedRowIds = selectedRows.map((row) => row.rid);

  const handleClose = () => {
    onClose();
    setAppliedFilters({});
    setStep(1);
    setSelectedRows([]);
    setClearSelectedRows((prev) => !prev);
    setShowAlternateRecipient(false);
    setRecipient({ name: '', email: '' });
    setErrors({});
    localStorage.removeItem(contextKey);
  };

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

  // Reset all state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedRows([]);
      setClearSelectedRows((prev) => !prev);
      setStep(1);
      setShowAlternateRecipient(false);
      setRecipient({ name: '', email: '' });
      setErrors({});
      setAppliedFilters({});
    }
  }, [isOpen]);

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

  const validateRecipient = () => {
    if (!showAlternateRecipient) return true;

    const newErrors: { name?: string; email?: string } = {};
    let isValid = true;

    if (!recipient.name?.trim()) {
      newErrors.name = 'Recipient Name is required';
      isValid = false;
    } else if (!REGEX_PATTERNS.NAME_REGEX.test(recipient.name.trim())) {
      newErrors.name =
        "Recipient Name must contain only letters, spaces, apostrophes(') and hyphens(-).";
      isValid = false;
    }

    if (!recipient.email?.trim()) {
      newErrors.email = 'Recipient Email is required';
      isValid = false;
    } else if (!REGEX_PATTERNS.MAX_EMAIL_REGEX.test(recipient.email)) {
      newErrors.email = 'Max length exceeded';
      isValid = false;
    } else if (!REGEX_PATTERNS.EMAIL.test(recipient.email)) {
      newErrors.email = 'Invalid Email Address';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleNext = () => {
    if (selectedRows.length === 0) return;
    setStep(2);
  };

  const handleBack = () => {
    setStep(1);
  };

  const handleSubmit = () => {
    if (!validateRecipient()) return;
    handleSend(selectedRows, showAlternateRecipient ? recipient : undefined);
  };

  const handleInputChange = (field: 'name' | 'email', value: string) => {
    setRecipient((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const confirmColumns = getReInitiateConfirmColumns();

  if (!isOpen) return null;

  return (
    <div
      className='fixed inset-0 flex items-center justify-center bg-black/50'
      style={{ zIndex: 999 }}
    >
      <div
        className='bg-white flex flex-col justify-between rounded-lg shadow-lg w-[60%] p-5'
        style={{ minHeight: 'calc(100vh - 250px)' }}
      >
        <div className='flex justify-between items-center pb-1 border-b border-[#CBD6E2]'>
          <h2 className='text-[16px] font-bold text-[#2D3E4F]'>{title}</h2>
        </div>
        <div className={`${step === 1 ? 'flex-1' : 'hidden'}`}>
          <div className='flex gap-1.5 mt-1.5 justify-end'>
            {showFilter && (
              <>
                <Box className='relative'>
                  <Box
                    component='button'
                    onClick={handleFilterModal}
                    className='w-[24px] h-[24px] max-h-[24px] flex items-center justify-center border border-[#CBD6E2] rounded-[2px] cursor-pointer'
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
              initialSelectedIds={selectedRowIds}
              emptyMessege={emptyMessage}
            />
          </div>
        </div>
        <div className={`${step === 2 ? 'flex-1' : 'hidden'}`}>
          <div className='border mt-3 border-[#CBD6E2]'>
            <ListTable
              data={selectedRows}
              columns={confirmColumns}
              getRowId={getRowId}
              hoverHighlight={false}
              tableStyle={{
                height: '100%',
                maxHeight: 'calc(100vh - 455px)',
                overflow: 'auto',
              }}
              stickyHeader={true}
              selectable={false}
              actionWidth={0}
            />
          </div>

          <div className='mt-4'>
            {!showAlternateRecipient ? (
              <div className='text-right'>
                <TextButton
                  label='Add Alternative Recipient'
                  onClick={() => setShowAlternateRecipient(true)}
                  sx={{ width: '180px', fontSize: '13px', fontWeight: 400 }}
                />
              </div>
            ) : (
              <div className='border border-[#CBD6E2]'>
                <div className='flex items-center justify-between px-3 h-[30px] border-b border-[#CBD6E2] text-[#2D3E4F] text-[14px] font-bold bg-[#ECECEC]'>
                  <span>Alternate Recipient</span>
                  <TextButton
                    label='Cancel'
                    onClick={() => {
                      setShowAlternateRecipient(false);
                      setRecipient({ name: '', email: '' });
                      setErrors({});
                    }}
                    sx={{
                      width: '60px',
                      minWidth: '60px',
                      fontSize: '12px',
                      fontWeight: 400,
                      height: '24px',
                    }}
                  />
                </div>
                <div className='grid grid-cols-[auto_1fr_auto_1fr] gap-x-6 items-start py-2 px-3'>
                  <div className='font-semibold text-[13px] text-[#425A76] py-1 whitespace-nowrap'>
                    Recipient Name
                    <span className='text-red-500 text-[16px] ml-1'>*</span>
                  </div>
                  <div className='font-medium text-[13px] min-w-0'>
                    <input
                      type='text'
                      name='name'
                      className={`placeholder-custom-color placeholder-[#7D98B6] outline-none focus:border-2 focus:border-blue-400 w-full sm:text-sm px-3 h-[28px] border border-[#CBD6E2] rounded-xs ${errors.name ? 'border-red-500 bg-[#FEF2F2]' : ''}`}
                      onChange={(e) =>
                        handleInputChange('name', e.target.value)
                      }
                      value={recipient.name}
                      placeholder='Enter Recipient Name'
                    />
                    {errors.name && (
                      <span className='text-[12px] text-red-400'>
                        {errors.name}
                      </span>
                    )}
                  </div>
                  <div className='font-semibold text-[13px] text-[#425A76] py-1 whitespace-nowrap'>
                    Recipient Email
                    <span className='text-red-500 text-[16px] ml-1'>*</span>
                  </div>
                  <div className='font-medium text-[13px] min-w-0'>
                    <input
                      type='text'
                      name='email'
                      className={`placeholder-custom-color placeholder-[#7D98B6] outline-none focus:border-2 focus:border-blue-400 w-full sm:text-sm px-3 h-[28px] border border-[#CBD6E2] rounded-xs ${errors.email ? 'border-red-500 bg-[#FEF2F2]' : ''}`}
                      onChange={(e) =>
                        handleInputChange('email', e.target.value)
                      }
                      value={recipient.email}
                      placeholder='Enter Recipient Email'
                    />
                    {errors.email && (
                      <span className='text-[12px] text-red-400'>
                        {errors.email}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Common Button Section */}
        <div className='flex gap-3 mt-6 justify-end'>
          <TextButton
            label='Cancel'
            onClick={handleClose}
            disabled={step === 2 ? saveBtnLoading : false}
            sx={{
              width: '75px',
              minWidth: '75px',
              fontSize: '12px',
              fontWeight: 400,
            }}
          />
          <TextButton
            label='Back'
            onClick={handleBack}
            disabled={saveBtnLoading}
            hide={step === 1}
            sx={{
              width: '55px',
              minWidth: '55px',
              fontSize: '12px',
              fontWeight: 400,
            }}
          />
          <TextButton
            label={step === 1 ? 'Next' : 'Save'}
            onClick={step === 1 ? handleNext : handleSubmit}
            loading={step === 2 ? saveBtnLoading : false}
            disabled={step === 1 ? selectedRows.length === 0 : saveBtnLoading}
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

export default ReInitiateModal;
