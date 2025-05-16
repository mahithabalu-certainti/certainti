import {
  Box,
  Checkbox,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from '@mui/material';
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { allAccountIcon, closeCircleIcon, closeIcon } from '../../assets';
import {
  AccountFilter,
  FilterState,
  FilterType,
  GlobalModalProps,
} from '../../consultant/types';
import { RootState, useAppDispatch } from '../../store/store';
import {
  fetchAccountsThunk,
  // resetFilters,
  setFilters,
} from '../../store/slices/account-slice';
import { useToast } from '../../hooks';
import TextButton from '../button/text-button';

export const GlobalModal = ({
  isGlobalModalOpen,
  handleCloseGlobalModal,
}: GlobalModalProps) => {
  const [selectedFilters, setSelectedFilters] = useState<FilterState>([]);
  const { errorToast } = useToast();
  const dispatch = useAppDispatch();
  const { accounts, loading, filters, error } = useSelector(
    (state: RootState) => state.account
  );

  useEffect(() => {
    if (error) {
      errorToast(error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [error]);

  useEffect(() => {
    if (isGlobalModalOpen) {
      dispatch(fetchAccountsThunk());
      if (filters.length > 0) {
        setSelectedFilters(filters);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isGlobalModalOpen, filters]);

  const handleFilterToggle = (filterId: string, type: FilterType) => {
    setSelectedFilters((prev) => {
      const newFilters = JSON.parse(JSON.stringify(prev)) as FilterState;

      if (type === 'account') {
        const index = newFilters.findIndex((f) => f.account === filterId);

        if (index !== -1) {
          newFilters.splice(index, 1);
        } else {
          newFilters.push({ account: filterId, child: [] });
        }
      } else {
        const parentAccount = accounts?.find((acc) =>
          acc.child_accounts?.some((child) => child.rid === filterId)
        );

        if (!parentAccount) return prev;

        const accountIndex = newFilters.findIndex(
          (f) => f.account === parentAccount.rid
        );

        if (accountIndex === -1) {
          newFilters.push({ account: parentAccount.rid, child: [filterId] });
        } else {
          const childList = newFilters[accountIndex].child;
          const childIndex = childList.indexOf(filterId);

          if (childIndex !== -1) {
            childList.splice(childIndex, 1);
          } else {
            childList.push(filterId);
          }
        }
      }

      return newFilters;
    });
  };

  const handleSaveFilters = () => {
    dispatch(setFilters(selectedFilters));
    handleCloseGlobalModal();
  };

  const handleCloseModal = () => {
    setSelectedFilters(filters || []);
    handleCloseGlobalModal();
  };

  const handleResetFilters = () => {
    // dispatch(resetFilters());
    setSelectedFilters([]);
  };

  return (
    <Dialog
      open={isGlobalModalOpen}
      onClose={handleCloseModal}
      aria-labelledby='alert-dialog-title'
      aria-describedby='alert-dialog-description'
      maxWidth='md'
      fullWidth
    >
      <DialogTitle className='flex justify-between items-center border-b border-[#CBD6E2]'>
        <span className='text-[#2D3E4F] text-[20px] font-medium leading-[20px]'>Filters</span>
        <img
          src={closeCircleIcon}
          alt='close'
          className='cursor-pointer h-[24px] w-[24px]'
          onClick={handleCloseModal}
        />
      </DialogTitle>
      <DialogContent sx={{ padding: 0, display: 'flex' }}>
        {loading ? (
          <div className='w-full flex justify-center items-center min-h-[380px]'>
            <CircularProgress />
          </div>
        ) : (
          <div className='flex w-full h-[380px] max-h-[380px] min-h-[380px]'>
            <div className='flex-1 border-r border-[#CBD6E2] pl-9 py-4'>
              <p className='text-[#7D98B6] text-[13px] font-normal leading-6'>Filter Types</p>
              <div className='flex items-center gap-3 h-[28px]'>
              <img src={allAccountIcon} alt='all account' className='w-5 h-5' />
                <span className='text-[#425A76] text-[13px] font-normal'>All Accounts</span>
              </div>
            </div>
            <div className='flex-2 flex flex-col border-r border-[#CBD6E2]'>
              <p className='text-[#7D98B6] text-[13px] font-normal leading-6 px-8 pt-4'>Account</p>
              <div className='flex-1 flex flex-col space-y-1 p-6 overflow-y-auto'>
                {accounts?.map((account: AccountFilter) => (
                  <div key={account.rid}>
                    <label className='m-0 flex items-center'>
                      <Checkbox
                        disableRipple
                        checked={selectedFilters.some(
                          (f) => f.account === account.rid
                        )}
                        onChange={() =>
                          handleFilterToggle(account.rid, 'account')
                        }
                        sx={{
                          p: 0.75,
                          color: '#CBD6E2',
                          '&.Mui-checked': {
                            color: '#1755E7',
                          },
                          '&.MuiCheckbox-indeterminate': {
                            color: '#1755E7',
                          },
                        }}
                      />
                      <span className='text-[13px] font-normal text-[#2D3E4F] cursor-pointer'>{account.account_name}</span>
                    </label>
                    {selectedFilters.some((f) => f.account === account.rid) &&
                      account.child_accounts &&
                      account.child_accounts?.length > 0 && (
                        <div>
                          {account.child_accounts.map((child) => (
                            <label key={child.rid} className='m-0 ml-6 flex items-center'>
                              <Checkbox
                                disableRipple
                                checked={
                                  selectedFilters
                                    .find((f) => f.account === account.rid)
                                    ?.child.includes(child.rid) || false
                                }
                                onChange={() =>
                                  handleFilterToggle(child.rid, 'child')
                                }
                                sx={{
                                  p: 0.75,
                                  color: '#CBD6E2',
                                  '&.Mui-checked': {
                                    color: '#1755E7',
                                  },
                                  '&.MuiCheckbox-indeterminate': {
                                    color: '#1755E7',
                                  },
                                }}
                              />
                              <span className='text-[13px] font-normal text-[#2D3E4F] cursor-pointer'>{child.account_name}</span>
                            </label>
                          ))}
                        </div>
                      )}
                  </div>
                ))}
              </div>
            </div>
            <div className='flex-1 flex flex-col px-8 py-4 bg-[#F6F6F7]'>
              <div className='flex justify-between items-center mb-4'>
                <h4 className='text-[#7D98B6] text-[13px] font-normal leading-6'>
                  <span className='bg-[#CBD6E2] w-[20px] h-[20px] inline-flex items-center justify-center rounded text-center font-medium'>
                    {selectedFilters.length +
                      selectedFilters.reduce(
                        (acc, curr) => acc + curr.child.length,
                        0
                      )}
                  </span>{' '}
                  Filters Selected
                </h4>
                <span
                  className='text-[#425A76] text-[13px] font-light underline cursor-pointer'
                  onClick={handleResetFilters}
                >
                  Clear
                </span>
              </div>
              <div className='flex-1 pr-6 overflow-y-auto'>
              <div className='flex-1'>
                <p className='mt-3 text-[#807F94] text-[13px] font-normal'>Account</p>
                {selectedFilters.map(({ account: id }) => {
                  const account = accounts?.find((it) => it.rid === id);
                  return account ? (
                    <p className='flex justify-between items-center gap-2 mt-1 text-[13px] text-[#000000] font-normal' key={id}>
                      <span title={account.account_name} className='truncate max-w-[150px] overflow-ellipsis'>{account.account_name}</span>
                      <img
                        src={closeIcon}
                        className='cursor-pointer'
                        alt='close'
                        onClick={() => handleFilterToggle(id, 'account')}
                      />
                    </p>
                  ) : null;
                })}

                <p className='mt-3 text-[#807F94] text-[13px] font-normal'>Child Account</p>
                {selectedFilters.flatMap(({ account }, i) =>
                  (
                    accounts?.find((a) => a.rid === account)?.child_accounts ||
                    []
                  )
                    .filter((child) =>
                      selectedFilters[i].child.includes(child.rid)
                    )
                    .map((child) => (
                      <p
                        className='flex justify-between items-center text-[13px] gap-2 mt-1 text-[#000000] font-normal'
                        key={child.rid}
                      >
                        <span title={child.account_name} className='truncate max-w-[150px] overflow-ellipsis'>{child.account_name}</span>
                        <img
                          src={closeIcon}
                          className='cursor-pointer'
                          alt='close'
                          onClick={() => handleFilterToggle(child.rid, 'child')}
                        />
                      </p>
                    ))
                )}
              </div>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
      <DialogActions className='border-t border-[#CBD6E2]'>
        <Box className='flex items-center justify-end gap-3 pr-6 w-full h-[48px]'>
          <TextButton
            label="Cancel"
            color='inherit'
            onClick={handleCloseModal}
            variant='outlined'
            sx={{
              width: '55px',
              minWidth: '55px',
              borderRadius: '2px',
              fontSize: '13px',
              fontWeight: 400,
            }}
          />
          <TextButton
            label='Save'
            variant='filled'
            onClick={handleSaveFilters}
            sx={{
              width: '64px',
              minWidth: '64px',
              backgroundColor: '#F16137',
              borderRadius: '2px',
              fontSize: '13px',
              fontWeight: 400,
            }}
          />
        </Box>
      </DialogActions>
    </Dialog>
  );
};
