import {
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from '@mui/material';
import { useState } from 'react';
import { allAccountIcon, closeCircleIcon, closeIcon } from '../../assets';
import {
  FilterState,
  FilterType,
  GlobalModalProps,
} from '../../consultant/types';

const accountFilters = Array(7)
  .fill('')
  .map((_, index) => ({
    id: `account-${index}`,
    name: `Account ${index + 1}`,
  }));

const childFilters = Array(5)
  .fill('')
  .map((_, index) => ({
    id: `child-${index}`,
    name: `Child ${index + 1}`,
  }));

const intialFilterState: FilterState = {
  account: [],
  child: [],
};

export const GlobalModal = ({
  isGlobalModalOpen,
  handleCloseGlobalModal,
}: GlobalModalProps) => {
  const [selectedFilters, setSelectedFilters] =
    useState<FilterState>(intialFilterState);

  const handleFilterToggle = (filterId: string, type: FilterType) => {
    setSelectedFilters((prev) => ({
      ...prev,
      [type]: prev[type].includes(filterId)
        ? prev[type].filter((id) => id !== filterId)
        : [...prev[type], filterId],
    }));
  };

  return (
    <Dialog
      open={isGlobalModalOpen}
      onClose={handleCloseGlobalModal}
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
          onClick={handleCloseGlobalModal}
        />
      </DialogTitle>
      <DialogContent sx={{ padding: 0, display: 'flex' }}>
        <div className='flex-1 border-r border-gray-200 px-6 py-4'>
          <p className='text-gray-400'>Filter Types</p>
          <h3 className='font-medium flex items-center gap-2'>
            <img src={allAccountIcon} alt='all account' /> All Accounts
          </h3>
        </div>
        <div className='flex-1 border-r border-gray-200 p-4'>
          <p className='text-gray-400 mb-1'>Account</p>
          <div className='flex flex-col space-y-1 -ml-2'>
            {accountFilters.map((filter) => (
              <label key={filter.id} className='m-0'>
                <Checkbox
                  checked={selectedFilters.account.includes(filter.id)}
                  onChange={() => handleFilterToggle(filter.id, 'account')}
                  sx={{ p: 0.75 }}
                />
                <span>{filter.name}</span>
              </label>
            ))}
          </div>
        </div>
        <div className='flex-1 border-r border-gray-200 p-4'>
          <p className='text-gray-400 mb-1'>Show Child</p>
          <div className='flex flex-col space-y-1 -ml-2'>
            {childFilters.map((filter) => (
              <label key={filter.id} className='m-0'>
                <Checkbox
                  checked={selectedFilters.child.includes(filter.id)}
                  onChange={() => handleFilterToggle(filter.id, 'child')}
                  sx={{ p: 0.75 }}
                />
                <span>{filter.name}</span>
              </label>
            ))}
          </div>
        </div>
        <div className='flex-1 p-4'>
          <div className='flex justify-between items-center mb-4'>
            <h4 className='text-gray-400'>
              <span className='bg-gray-200 px-1 py-1 rounded text-xs min-w-[26px] text-center inline-block font-medium'>
                {selectedFilters.account.length + selectedFilters.child.length}
              </span>{' '}
              Filters Selected
            </h4>
            <span
              className='text-gray-400 underline cursor-pointer'
              onClick={() => setSelectedFilters(intialFilterState)}
            >
              Clear
            </span>
          </div>
          <div>
            <p className='mt-3 text-gray-400'>Account</p>
            {selectedFilters.account.map((id) => (
              <p className='flex justify-between items-center' key={id}>
                {accountFilters.find((it) => it.id === id)?.name}{' '}
                <img
                  src={closeIcon}
                  className='cursor-pointer'
                  alt='close'
                  onClick={() => handleFilterToggle(id, 'account')}
                />
              </p>
            ))}
            <p className='mt-3 text-gray-400'>Child</p>
            {selectedFilters.child.map((id) => (
              <p className='flex justify-between items-center' key={id}>
                {childFilters.find((it) => it.id === id)?.name}{' '}
                <img
                  src={closeIcon}
                  className='cursor-pointer'
                  alt='close'
                  onClick={() => handleFilterToggle(id, 'child')}
                />
              </p>
            ))}
          </div>
        </div>
      </DialogContent>
      <DialogActions className='border-t border-gray-300'>
        <Button onClick={handleCloseGlobalModal} variant='outlined'>
          Cancel
        </Button>
        <Button
          variant='contained'
          color='secondary'
          onClick={handleCloseGlobalModal}
        >
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
};
