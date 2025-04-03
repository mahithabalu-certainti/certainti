import {
  AppBar,
  Badge,
  Box,
  IconButton,
  Menu,
  MenuItem,
  Popover,
  Toolbar,
} from '@mui/material';
import React, { useState } from 'react';
import {
  accountsIcon,
  chevronDownIcon,
  globeIcon,
  menuIcon,
  notificationIcon,
  phoneIcon,
  plusIcon,
  searchIcon,
  settingsIcon,
} from '../../assets';
import { GlobalModal } from '../global-modal';

export const Navbar: React.FC = () => {
  const [searchAnchor, setSearchAnchor] = useState<null | HTMLElement>(null);
  const [notificationAnchor, setNotificationAnchor] =
    useState<null | HTMLElement>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [mobileMoreAnchorEl, setMobileMoreAnchorEl] =
    React.useState<null | HTMLElement>(null);
  const [isGlobalModalOpen, setIsGlobalModalOpen] = useState(false);

  const menuId = 'account-menu';
  const mobileMenuId = 'account-menu-mobile';
  const notificationId = 'notification-menu';
  const searchMenuId = 'search-menu';

  const isMenuOpen = Boolean(anchorEl);
  const isMobileMenuOpen = Boolean(mobileMoreAnchorEl);
  const isNotificationMenuOpen = Boolean(notificationAnchor);
  const isSearchMenuOpen = Boolean(searchAnchor);

  const searchMenus = ['Account', 'Projects', 'Case', 'Resources', 'TimeSheet'];

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMobileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setMobileMoreAnchorEl(event.currentTarget);
  };

  const handleMobileMenuClose = () => {
    setMobileMoreAnchorEl(null);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    handleMobileMenuClose();
  };

  const handleNotificationClose = () => {
    setNotificationAnchor(null);
  };

  const handleSearchMenuClose = () => {
    setSearchAnchor(null);
  };

  const handleNotificationOpen = (event: React.MouseEvent<HTMLElement>) => {
    setNotificationAnchor(event.currentTarget);
  };

  const handleSearchMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setSearchAnchor(event.currentTarget);
  };

  const handleCloseGlobalModal = () => {
    setIsGlobalModalOpen(false);
  };

  const renderMenu = (
    <Menu
      anchorEl={anchorEl}
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'right',
      }}
      id={menuId}
      keepMounted
      transformOrigin={{
        vertical: 'top',
        horizontal: 'right',
      }}
      open={isMenuOpen}
      onClose={handleMenuClose}
    >
      <MenuItem onClick={handleMenuClose}>Profile</MenuItem>
      <MenuItem onClick={handleMenuClose}>My account</MenuItem>
    </Menu>
  );

  const renderNotificationMenu = (
    <Popover
      id={notificationId}
      open={isNotificationMenuOpen}
      anchorEl={notificationAnchor}
      onClose={handleNotificationClose}
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'left',
      }}
      transformOrigin={{
        vertical: 'top',
        horizontal: 'center',
      }}
    >
      <div className='p-5'>
        <div className='flex justify-between items-center mb-4'>
          <h4 className='font-medium'>Notification for you</h4>{' '}
          <span className='text-gray-600 text-xs cursor-pointer'>
            Mark all read
          </span>
        </div>
        {[...Array(5)].map((_, i) => (
          <div
            className='px-3 py-1 flex items-center cursor-pointer hover:bg-gray-100'
            key={i}
          >
            <img
              className='w-10 h-10 rounded-full object-cover'
              src='https://mui.com/static/images/avatar/2.jpg'
              alt='User Avatar'
            />
            <div className='px-4'>
              <h4 className='font-medium'>Distribution</h4>
              <span className='text-xs text-gray-600'>
                Bender Rodriguez . DesignDrops . Mar 4
              </span>
            </div>
            <span className='w-2 h-2 bg-red-500 rounded-full' />
          </div>
        ))}
      </div>
      <div className='bg-gray-100 py-3 px-6 bt-2 border-t border-gray-200'>
        <h4 className='font-medium cursor-pointer text-sm'>
          Previous Notification
        </h4>
      </div>
    </Popover>
  );

  const renderSearchMenu = (
    <Popover
      id={searchMenuId}
      open={isSearchMenuOpen}
      anchorEl={searchAnchor}
      onClose={handleSearchMenuClose}
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'center',
      }}
      transformOrigin={{
        vertical: 'top',
        horizontal: 'center',
      }}
    >
      <div className='p-2 bg-[#465a6e] text-white text-sm'>
        {searchMenus.map((menu, i) => (
          <h4 key={i} className='cursor-pointer px-4 py-1 hover:bg-[#667c93]'>
            {menu}
          </h4>
        ))}
      </div>
    </Popover>
  );

  const renderMobileMenu = (
    <Menu
      anchorEl={mobileMoreAnchorEl}
      anchorOrigin={{
        vertical: 'top',
        horizontal: 'right',
      }}
      id={mobileMenuId}
      keepMounted
      transformOrigin={{
        vertical: 'top',
        horizontal: 'right',
      }}
      open={isMobileMenuOpen}
      onClose={handleMobileMenuClose}
    >
      <MenuItem>
        <IconButton size='large' color='inherit'>
          <Badge badgeContent={4} color='error'>
            <img src={notificationIcon} alt='notification' />
          </Badge>
        </IconButton>
        <p>Messages</p>
      </MenuItem>
      <MenuItem onClick={handleProfileMenuOpen}>
        <IconButton
          size='large'
          aria-label='account of current user'
          aria-controls='primary-search-account-menu'
          aria-haspopup='true'
          color='inherit'
        >
          <img src={accountsIcon} alt='accounts' />
        </IconButton>
        <p>Profile</p>
      </MenuItem>
    </Menu>
  );

  return (
    <>
      <AppBar position='sticky'>
        <Toolbar className='justify-between'>
          <div className='relative rounded-md mr-2 flex gap-2'>
            <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
              <img
                src={searchIcon}
                alt='search'
                className='h-5 w-5 text-gray-400'
              />
            </div>
            <input
              type='text'
              placeholder='Search'
              aria-label='search'
              className='bg-white/10 hover:bg-white/15 text-inherit rounded px-4 py-1 pl-10 focus:outline-none min-w-[300px]'
            />
            <img
              src={plusIcon}
              aria-haspopup='true'
              onClick={handleSearchMenuOpen}
              aria-controls={notificationId}
              alt='plus'
              className='cursor-pointer'
            />
          </div>
          <Box
            sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center' }}
          >
            <IconButton
              color='inherit'
              disableRipple
              onClick={() => setIsGlobalModalOpen(true)}
            >
              <img src={globeIcon} alt='global' className='h-5' />
              <span className='text-sm px-2'>Global</span>
            </IconButton>
            <div className='border-l border-gray-500 h-6' />
            <select
              className='px-4 py-2 focus:outline-none cursor-pointer'
              aria-label='Fiscal Year Selector'
            >
              <option value='all' className='text-black'>
                FY-All
              </option>
              <option value='2021' className='text-black'>
                2021
              </option>
              <option value='2022' className='text-black'>
                2022
              </option>
              <option value='2023' className='text-black'>
                2023
              </option>
            </select>
            <div className='border-l border-gray-500 mx-2  h-6' />
            <IconButton size='large' color='inherit'>
              <img src={phoneIcon} alt='phone' className='h-5' />
            </IconButton>
            <IconButton
              size='large'
              aria-label='notification'
              aria-haspopup='true'
              onClick={handleNotificationOpen}
              color='inherit'
              aria-controls={notificationId}
            >
              <img src={notificationIcon} alt='notification' className='h-5' />
            </IconButton>
            <IconButton size='large' color='inherit'>
              <img src={settingsIcon} alt='settings' className='h-5' />
            </IconButton>
            <div className='border-l border-gray-500 mx-2  h-6' />
            <IconButton
              size='large'
              edge='end'
              aria-label='account of current user'
              aria-controls={menuId}
              aria-haspopup='true'
              onClick={handleProfileMenuOpen}
              color='inherit'
              disableRipple
            >
              <img
                className='w-6 h-6 rounded-full object-cover'
                src='https://mui.com/static/images/avatar/2.jpg'
                alt='User Avatar'
              />
              <span className='text-sm px-2'>John doe</span>
              <img src={chevronDownIcon} alt='down nav' />
            </IconButton>
          </Box>
          {/* mobile view */}
          <Box sx={{ display: { xs: 'flex', md: 'none' } }}>
            <IconButton
              size='large'
              aria-label='show more'
              aria-controls={mobileMenuId}
              aria-haspopup='true'
              onClick={handleMobileMenuOpen}
              color='inherit'
            >
              <img src={menuIcon} alt='menu' />
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>
      {renderMobileMenu}
      {renderMenu}
      {renderNotificationMenu}
      {renderSearchMenu}
      <GlobalModal
        isGlobalModalOpen={isGlobalModalOpen}
        handleCloseGlobalModal={handleCloseGlobalModal}
      />
    </>
  );
};
