import { BrowserAuthError, PublicClientApplication } from '@azure/msal-browser';
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
import { useDispatch, useSelector } from 'react-redux';
import {
  accountsIcon,
  burgerMenuIcon,
  chevronDownIcon,
  globeIcon,
  menuIcon,
  notificationIcon,
  phoneIcon,
  // plusIcon,
  // searchIcon,
  settingsIcon,
} from '../../assets';
import { UserRoles } from '../../common-service';
import { msalConfig, msalResetPasswordConfig } from '../../config/msalConfig';
import { useAuthHook, useToast } from '../../hooks';
import { RootState } from '../../store/store';
import { GlobalModal } from '../global-modal';
import { setFiscalYear } from '../../store/slices/account-slice';
import { fiscalYears } from '../../common-utils';
import { useNavigate } from 'react-router-dom';
import { PROFILE } from '../../routes';
import { FiscalYearDropdown } from '../fiscal-dropdown';

interface NavbarProps {
  handleSidebarToggle: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ handleSidebarToggle }) => {
  const msalSigninInstance = new PublicClientApplication(msalConfig);
  const msalResetInstance = new PublicClientApplication(
    msalResetPasswordConfig
  );

  const { successToast, errorToast } = useToast();
  const [searchAnchor, setSearchAnchor] = useState<null | HTMLElement>(null);
  const [notificationAnchor, setNotificationAnchor] =
    useState<null | HTMLElement>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [mobileMoreAnchorEl, setMobileMoreAnchorEl] =
    React.useState<null | HTMLElement>(null);
  const [isGlobalModalOpen, setIsGlobalModalOpen] = useState(false);

  const dispatch = useDispatch();
  const { logout } = useAuthHook();
  const navigate = useNavigate();
  const { role, name } = useSelector((state: RootState) => state.auth);
  const { fiscalYear } = useSelector((state: RootState) => state.account);

  const isConsultant = role !== UserRoles.Admin;
  const menuId = 'account-menu';
  const mobileMenuId = 'account-menu-mobile';
  const notificationId = 'notification-menu';
  const searchMenuId = 'search-menu';
  const isMenuOpen = Boolean(anchorEl);
  const isMobileMenuOpen = Boolean(mobileMoreAnchorEl);
  const isNotificationMenuOpen = Boolean(notificationAnchor);
  const isSearchMenuOpen = Boolean(searchAnchor);
  const searchMenus = ['Account', 'Projects', 'Case', 'Resources', 'TimeSheet'];
  const fiscalYearsDropDown = [{ value: '', label: 'FY-All' }].concat(
    fiscalYears
  );

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

  // const handleSearchMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
  //   setSearchAnchor(event.currentTarget);
  // };

  const handleCloseGlobalModal = () => {
    setIsGlobalModalOpen(false);
  };

  const changePassword = async () => {
    handleMenuClose();
    try {
      await msalResetInstance.initialize();
      await msalResetInstance.loginPopup();
      successToast('Your password has been updated successfully');

      await msalSigninInstance.initialize();
      await msalSigninInstance.logoutPopup();
      await msalSigninInstance.clearCache();
      logout();
      window.location.replace('/login');
    } catch (error) {
      const err = error as BrowserAuthError;
      // Prevent show error for User cancelation
      const isCanceledByUser = [
        'The user has cancelled entering self-asserted information.',
        'User cancelled the flow',
      ].some((msg) => err.errorMessage.includes(msg));

      if (!isCanceledByUser) {
        errorToast(err.errorMessage);
      }
    }
  };

  const handleLogout = async () => {
    handleMenuClose();
    try {
      await msalSigninInstance.initialize();
      await msalSigninInstance.logoutPopup();
      await msalSigninInstance.clearCache();
      logout();
      window.location.replace('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const goToProfile = () => {
    navigate(PROFILE);
    handleMenuClose();
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
      <MenuItem sx={{ fontSize: '14px' }} onClick={goToProfile}>View Profile Details</MenuItem>
      <MenuItem sx={{ fontSize: '14px' }} onClick={changePassword}>Change Password</MenuItem>
      <MenuItem sx={{ fontSize: '14px' }} onClick={handleLogout}>Logout</MenuItem>
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
      <AppBar sx={{ boxShadow: 'none' }} position='sticky'>
        <Toolbar className='justify-between !min-h-[40px] !pl-0'>
          <div className='relative rounded-md mr-2 flex gap-2'>
            <button className='cursor-pointer ' type='button' onClick={handleSidebarToggle}>
              <img src={burgerMenuIcon} alt='menu' className='h-[32px] w-[32px]' />
            </button>
            {/* <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
              <img
                src={searchIcon}
                alt='search'
                className='h-4.5 w-4.5 text-gray-400'
              />
            </div>
            <input
              type='text'
              placeholder='Search'
              aria-label='search'
              className='bg-[#495E74] text-white text-[13px] font-[300] rounded px-4 h-8 pl-9 focus:outline-none lg:w-[320px] placeholder:text-white'
            />
            <img
              src={plusIcon}
              aria-haspopup='true'
              onClick={handleSearchMenuOpen}
              aria-controls={notificationId}
              alt='plus'
              className='cursor-pointer h-8 w-7'
            /> */}
          </div>
          <Box
            sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center' }}
          >
            {isConsultant && (
              <>
                <IconButton
                  color='inherit'
                  disableRipple
                  onClick={() => setIsGlobalModalOpen(true)}
                >
                  <img src={globeIcon} alt='global' className='h-[16px] w-[16px]' />
                  <span className='text-[13px] font-normal px-2'>Global</span>
                </IconButton>
                <div className='border-l border-[#FFFFFF4D] h-6 mx-1' />
                <FiscalYearDropdown
                  fiscalYear={fiscalYear}
                  fiscalYearsDropDown={fiscalYearsDropDown}
                  onChange={(e) => dispatch(setFiscalYear(e.target.value))}
                />
                <div className='border-l border-[#FFFFFF4D] ml-1 mr-2 h-6' />
              </>
            )}
            <IconButton size='large' color='inherit'>
              <img src={phoneIcon} alt='phone' className='h-[20px] w-[20px]' />
            </IconButton>
            <IconButton
              size='large'
              aria-label='notification'
              aria-haspopup='true'
              onClick={handleNotificationOpen}
              color='inherit'
              aria-controls={notificationId}
            >
              <img src={notificationIcon} alt='notification' className='h-[20px] w-[20px]' />
            </IconButton>
            <IconButton size='large' color='inherit'>
              <img src={settingsIcon} alt='settings' className='h-[20px] w-[20px]' />
            </IconButton>
            <div className='border-l border-[#FFFFFF4D] mx-2 h-6' />
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
              <span className='text-[12px] font-[400] px-2'>{name}</span>
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
