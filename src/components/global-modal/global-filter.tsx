import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState, useAppDispatch } from '../../store/store';
import {
  fetchAccountsThunk,
  resetFilters,
  setFilters,
} from '../../store/slices/account-slice';
import {
  Select,
  MenuItem,
  IconButton,
  MenuProps,
  Checkbox,
  Skeleton,
  Popover,
} from '@mui/material';
import { FilterState, GlobalFilterModalProps } from '../../consultant/types';
import { arrowIcon, closeIcon, allAccountIcon } from '../../assets';
import { useToast } from '../../hooks';

const SELECT_STYLES = {
  fontWeight: 600,
  fontSize: '12px',
  lineHeight: '30px',
  borderRadius: '2px',
  '& .MuiSelect-select': {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    fontWeight: 600,
    fontSize: '12px',
    lineHeight: '30px',
    color: '#425A76',
  },
  '& .MuiOutlinedInput-notchedOutline': {
    borderColor: '#CBD6E2',
  },
  '&:hover .MuiOutlinedInput-notchedOutline': {
    borderColor: '#CBD6E2',
  },
  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
    borderColor: '#CBD6E2',
  },
  '& .MuiSelect-icon': {
    top: '40%',
  },
};

const MENU_PROPS: Partial<MenuProps> = {
  anchorOrigin: {
    vertical: 'bottom',
    horizontal: 'left',
  },
  transformOrigin: {
    vertical: 'top',
    horizontal: 'left',
  },
  PaperProps: {
    style: {
      minWidth: '220px',
      maxWidth: '220px',
      maxHeight: 250,
      borderRadius: '0px 0px 8px 8px',
      border: '1px solid #CBD6E2',
      borderTop: 'none',
      marginTop: '1px',
      boxShadow: 'none',
    },
  },
  MenuListProps: {
    sx: {
      paddingTop: 0,
      paddingBottom: 0,
    },
  },
};

const MENU_ITEM_STYLES = {
  fontWeight: 400,
  fontSize: '12px',
  lineHeight: '20px',
  color: '#2D3E4F',
  py: '4px',
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
};

const GlobalFilterModal: React.FC<GlobalFilterModalProps> = ({
  isOpen,
  filterAnchorEl,
  filterId,
  handleClose,
}) => {
  const dispatch = useAppDispatch();
  const { errorToast } = useToast();
  const { accounts, loading, filters, error } = useSelector(
    (state: RootState) => state.account
  );
  const [selectedFilters, setSelectedFilters] = useState<FilterState>([
    { account: '', child: [] },
  ]);

  useEffect(() => {
    if (error) {
      errorToast(error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [error]);

  useEffect(() => {
    if (isOpen) {
      dispatch(fetchAccountsThunk());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  useEffect(() => {
    if (filters?.length > 0) {
      setSelectedFilters(filters);
    }
  }, [filters]);

  const handleAddAccount = () => {
    setSelectedFilters([...selectedFilters, { account: '', child: [] }]);
  };

  const handleRemoveFilter = (index: number) => {
    const newFilters = [...selectedFilters];
    newFilters.splice(index, 1);

    if (newFilters.length === 0) {
      newFilters.push({ account: '', child: [] });
      dispatch(resetFilters());
    }
    setSelectedFilters(newFilters);
  };

  const handleParentAccountChange = (index: number, value: string) => {
    const newFilters = [...selectedFilters];
    newFilters[index] = { account: value, child: [] };
    setSelectedFilters(newFilters);
  };

  const handleChildAccountChange = (index: number, value: string[]) => {
    const newFilters = [...selectedFilters];
    newFilters[index] = { ...newFilters[index], child: value };
    setSelectedFilters(newFilters);
  };

  const handleSaveFilters = () => {
    const validFilters = selectedFilters.filter(
      (filter) => filter.account !== ''
    );
    dispatch(setFilters(validFilters));
  };

  const handleClearFilters = () => {
    dispatch(resetFilters());
    setSelectedFilters([{ account: '', child: [] }]);
  };

  const getSelectedChildAccountsText = (
    childIds: string[],
    accountId: string
  ) => {
    const parentAccount = accounts?.find((acc) => acc.rid === accountId);
    if (!childIds.length) return 'Select Child Account Name';

    const selectedChildren = parentAccount?.child_accounts?.filter((child) =>
      childIds.includes(child.rid)
    );

    if (selectedChildren?.length === parentAccount?.child_accounts?.length) {
      return 'All child name selected';
    }

    // return selectedChildren?.map(child => child.account_name).join(', ');
    return `${selectedChildren?.length} child name selected`;
  };

  const getAvailableAccounts = (currentIndex: number) => {
    const selectedAccountIds = selectedFilters
      .map((filter, idx) => (idx !== currentIndex ? filter.account : ''))
      .filter((id) => id !== '');

    const availableAccounts = accounts?.filter(
      (account) => !selectedAccountIds.includes(account.rid)
    );
    return availableAccounts?.length ? availableAccounts : null;
  };

  if (!isOpen) return null;

  return (
    <Popover
      id={filterId}
      open={isOpen}
      anchorEl={filterAnchorEl}
      onClose={handleClose}
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'right',
      }}
      transformOrigin={{
        vertical: 'top',
        horizontal: 'right',
      }}
      PaperProps={{
        sx: {
          boxShadow: 'none',
          bgcolor: 'transparent',
          mt: 0.5,
        },
      }}
    >
      <div className='h-auto min-h-[165px] w-[530px] min-w-[530px] max-w-[530px] flex flex-col gap-4 bg-white rounded-[8px] p-6 border border-[#CBD6E2]'>
        <div className='flex justify-between items-center'>
          <h2 className='text-[16px] font-bold text-[#2D3E4F]'>Filters</h2>
          <div className='flex justify-end gap-4'>
            <button
              className='text-[12px] font-medium text-[#425A76] underline cursor-pointer hover:text-[#131a20]'
              onClick={handleSaveFilters}
            >
              Apply
            </button>
            <button
              className='text-[12px] font-medium text-[#425A76] underline cursor-pointer hover:text-[#FF6666]'
              onClick={handleClearFilters}
            >
              Clear
            </button>
          </div>
        </div>

        <div className='flex-1'>
          <h3 className='text-[13px] font-bold text-[#425A76] mb-2'>
            All Accounts
          </h3>

          <div className='flex flex-col gap-2 min-h-[40px] overflow-y-auto max-h-[250px] -mr-6'>
            {selectedFilters.map((filter, index) => (
              <div key={index} className='flex items-center gap-2'>
                {loading ? (
                  <>
                    <Skeleton variant='rounded' width='220px' height={28} />
                    <Skeleton variant='rounded' width='220px' height={28} />
                  </>
                ) : (
                  <>
                    <Select
                      value={filter.account}
                      onChange={(e) =>
                        handleParentAccountChange(
                          index,
                          e.target.value as string
                        )
                      }
                      displayEmpty
                      size='small'
                      className='min-w-[220px] max-w-[220px] h-[28px]'
                      IconComponent={(props) => (
                        <img src={arrowIcon} alt='arrowIcon' {...props} />
                      )}
                      renderValue={(selected) => (
                        <div className='flex items-center gap-1'>
                          <img
                            src={allAccountIcon}
                            alt='account'
                            className='w-4 h-4'
                          />
                          <span className='pt-0.5'>
                            {selected
                              ? accounts?.find((acc) => acc.rid === selected)
                                  ?.account_name
                              : 'Select Account'}
                          </span>
                        </div>
                      )}
                      sx={SELECT_STYLES}
                      MenuProps={MENU_PROPS}
                    >
                      <MenuItem
                        value=''
                        sx={{
                          fontSize: '13px',
                          fontWeight: 700,
                          color: '#2D3E4F',
                          lineHeight: '20px',
                          '&.Mui-selected': {
                            backgroundColor: 'transparent',
                          },
                        }}
                      >
                        <span className='pl-0.5'>All Account names</span>
                      </MenuItem>
                      {getAvailableAccounts(index) ? (
                        getAvailableAccounts(index)?.map((account) => (
                          <MenuItem
                            sx={{
                              ...MENU_ITEM_STYLES,
                              '&.Mui-selected': {
                                backgroundColor: 'transparent',
                              },
                            }}
                            key={account.rid}
                            value={account.rid}
                          >
                            <Checkbox
                              size='small'
                              checked={filter.account === account.rid}
                              sx={{
                                color: '#CBD6E2',
                                '&.Mui-checked': {
                                  color: '#1755E7',
                                },
                                padding: '0px',
                                mr: 1,
                              }}
                            />
                            {account.account_name}
                          </MenuItem>
                        ))
                      ) : (
                        <MenuItem disabled sx={MENU_ITEM_STYLES}>
                          <span className='pl-0.5'>Data not available</span>
                        </MenuItem>
                      )}
                    </Select>
                    <Select
                      multiple
                      value={filter.child}
                      onChange={(e) =>
                        handleChildAccountChange(
                          index,
                          e.target.value as string[]
                        )
                      }
                      displayEmpty
                      disabled={!filter.account}
                      size='small'
                      className='min-w-[220px] max-w-[220px] h-[28px]'
                      IconComponent={(props) => (
                        <img
                          src={arrowIcon}
                          alt='arrowIcon'
                          className='pr-3 cursor-pointer'
                          {...props}
                        />
                      )}
                      renderValue={(selected) => (
                        <div className='flex items-center gap-1'>
                          <span className='pt-0.5'>
                            {getSelectedChildAccountsText(
                              selected as string[],
                              filter.account
                            )}
                          </span>
                        </div>
                      )}
                      sx={SELECT_STYLES}
                      MenuProps={MENU_PROPS}
                    >
                      <MenuItem
                        value=''
                        sx={{
                          fontSize: '13px',
                          fontWeight: 700,
                          color: '#2D3E4F',
                          lineHeight: '20px',
                          '&.Mui-selected': {
                            backgroundColor: 'transparent',
                          },
                        }}
                      >
                        <span className='pl-0.5'>All Child name</span>
                      </MenuItem>
                      {accounts?.find((acc) => acc.rid === filter.account)
                        ?.child_accounts?.length ? (
                        accounts
                          ?.find((acc) => acc.rid === filter.account)
                          ?.child_accounts?.map((child) => (
                            <MenuItem
                              sx={{
                                ...MENU_ITEM_STYLES,
                                '&.Mui-selected': {
                                  backgroundColor: 'transparent',
                                },
                              }}
                              key={child.rid}
                              value={child.rid}
                            >
                              <Checkbox
                                size='small'
                                checked={filter.child.indexOf(child.rid) > -1}
                                sx={{
                                  color: '#CBD6E2',
                                  '&.Mui-checked': {
                                    color: '#1755E7',
                                  },
                                  padding: '0px',
                                  mr: 1,
                                }}
                              />
                              {child.account_name}
                            </MenuItem>
                          ))
                      ) : (
                        <MenuItem disabled sx={MENU_ITEM_STYLES}>
                          <span className='pl-0.5'>Data not available</span>
                        </MenuItem>
                      )}
                    </Select>
                    <IconButton
                      size='small'
                      onClick={() => handleRemoveFilter(index)}
                      disableRipple
                    >
                      <img
                        src={closeIcon}
                        alt='closeIcon'
                        className='w-[12px] h-[12px]'
                      />
                    </IconButton>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className='flex items-center justify-between mt-1'>
          <button
            onClick={handleAddAccount}
            className='text-[14px] font-bold text-[#425A76] flex items-center gap-1 cursor-pointer'
          >
            <span className='font-normal text-[16px]'>+</span> Add Account
          </button>
          {/* <div className='flex justify-end gap-2'>
            <button
              className='text-[12px] rounded-[2px] text-[#425A76] h-[24px] flex items-center px-2 border border-[#CBD6E2] cursor-pointer'
              style={{
                background: 'linear-gradient(180deg, #FFFFFF 0%, #E4E6E7 100%)',
              }}
              onClick={handleClose}
            >
              Close
            </button>
            <button
              className='text-[12px] rounded-[2px] text-[#425A76] h-[24px] flex items-center px-2 border border-[#CBD6E2] cursor-pointer'
              style={{
                background: 'linear-gradient(180deg, #FFFFFF 0%, #E4E6E7 100%)',
              }}
              onClick={handleSaveFilters}
            >
              Apply
            </button>
          </div> */}
        </div>
      </div>
    </Popover>
  );
};

export default GlobalFilterModal;
