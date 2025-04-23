import {
  Button,
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
      maxWidth='lg'
      fullWidth
    >
      <DialogTitle className='flex justify-between items-center border-b border-gray-300'>
        Filters
        <img
          src={closeCircleIcon}
          alt='close'
          className='cursor-pointer'
          onClick={handleCloseModal}
        />
      </DialogTitle>
      <DialogContent sx={{ padding: 0, display: 'flex' }}>
        {loading ? (
          <div className='w-full flex justify-center items-center min-h-[200px]'>
            <CircularProgress />
          </div>
        ) : (
          <>
            <div className='flex-1 border-r border-gray-200 px-6 py-4'>
              <p className='text-gray-400'>Filter Types</p>
              <h3 className='font-medium flex items-center gap-2'>
                <img src={allAccountIcon} alt='all account' /> All Accounts
              </h3>
            </div>
            <div className='flex-1 border-r border-gray-200 overflow-y-auto'>
              <p className='text-gray-400 mb-1 px-4 pt-4'>Account</p>
              <div className='flex flex-col space-y-1 p-4'>
                {accounts?.map((account: AccountFilter) => (
                  <div key={account.rid}>
                    <label className='m-0'>
                      <Checkbox
                        checked={selectedFilters.some(
                          (f) => f.account === account.rid
                        )}
                        onChange={() =>
                          handleFilterToggle(account.rid, 'account')
                        }
                        sx={{ p: 0.75 }}
                      />
                      <span>{account.account_name}</span>
                    </label>
                    {selectedFilters.some((f) => f.account === account.rid) &&
                      account.child_accounts &&
                      account.child_accounts?.length > 0 && (
                        <div>
                          {account.child_accounts.map((child) => (
                            <label key={child.rid} className='m-0 ml-6 block'>
                              <Checkbox
                                checked={
                                  selectedFilters
                                    .find((f) => f.account === account.rid)
                                    ?.child.includes(child.rid) || false
                                }
                                onChange={() =>
                                  handleFilterToggle(child.rid, 'child')
                                }
                                sx={{ p: 0.75 }}
                              />
                              <span>{child.account_name}</span>
                            </label>
                          ))}
                        </div>
                      )}
                  </div>
                ))}
              </div>
            </div>
            <div className='flex-1 p-4 overflow-y-auto'>
              <div className='flex justify-between items-center mb-4'>
                <h4 className='text-gray-400'>
                  <span className='bg-gray-200 px-1 py-1 rounded text-xs min-w-[26px] text-center inline-block font-medium'>
                    {selectedFilters.length +
                      selectedFilters.reduce(
                        (acc, curr) => acc + curr.child.length,
                        0
                      )}
                  </span>{' '}
                  Filters Selected
                </h4>
                <span
                  className='text-gray-400 underline cursor-pointer'
                  onClick={handleResetFilters}
                >
                  Clear
                </span>
              </div>
              <div className='overflow-y-auto'>
                <p className='mt-3 text-gray-400'>Account</p>
                {selectedFilters.map(({ account: id }) => {
                  const account = accounts?.find((it) => it.rid === id);
                  return account ? (
                    <p className='flex justify-between items-center' key={id}>
                      {account.account_name}{' '}
                      <img
                        src={closeIcon}
                        className='cursor-pointer'
                        alt='close'
                        onClick={() => handleFilterToggle(id, 'account')}
                      />
                    </p>
                  ) : null;
                })}

                <p className='mt-3 text-gray-400'>Child Account</p>
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
                        className='flex justify-between items-center'
                        key={child.rid}
                      >
                        {child.account_name}{' '}
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
          </>
        )}
      </DialogContent>
      <DialogActions className='border-t border-gray-300'>
        <Button onClick={handleCloseModal} variant='outlined'>
          Cancel
        </Button>
        <Button
          variant='contained'
          color='secondary'
          onClick={handleSaveFilters}
        >
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
};
