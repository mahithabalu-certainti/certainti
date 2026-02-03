import { BrowserAuthError, PublicClientApplication } from '@azure/msal-browser';
import {
  AppBar,
  // Badge,
  Box,
  debounce,
  IconButton,
  Menu,
  MenuItem,
  Popover,
  Toolbar,
  Tooltip,
} from '@mui/material';
import React, {
  useEffect,
  useRef,
  useCallback,
  useMemo,
  useState,
} from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  AccountsIcon,
  AdminSettingIcon,
  AvatarIcon,
  BurgerMenuIcon,
  ChevronDownIcon,
  GlobeIcon,
  MenuIcon,
  // NotificationIcon,
  // PhoneIcon,
} from '../../assets';
import { AllPermissions } from '../../common-service';
import { useAuthHook, useToast } from '../../hooks';
import { RootState } from '../../store/store';
import { setFiscalYear } from '../../store/slices/account-slice';
import {
  checkPermission,
  fiscalYears,
  getFiltersFromStorage,
} from '../../common-utils';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { CASE, PROFILE, PROJECT } from '../../routes';
import { GlobalFiscalYearDropdown } from '../fiscal-dropdown';
import GlobalFilterModal from '../global-modal/global-filter';
import { useMsal } from '@azure/msal-react';
import { msalResetPasswordConfig } from '../../config/msalConfig';
import CompanyBadge from './company-badge';
import { useIsFetching } from '@tanstack/react-query';
import NotificationPanel from './notification-panel';

interface NavbarProps {
  showAdminSidebar: boolean;
  switchSideBarMenus: () => void;
  handleSidebarToggle: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  handleSidebarToggle,
  showAdminSidebar,
  switchSideBarMenus,
}) => {
  const { instance } = useMsal();
  const passwordResetInstanceRef = useRef<PublicClientApplication | null>(null);
  const isFirstRender = useRef(true);
  const prevIsCaseRouteRef = useRef<boolean>(false);
  const savedPrevFYRef = useRef<string | null>(null);
  const { successToast, errorToast } = useToast();
  const [searchAnchor, setSearchAnchor] = useState<null | HTMLElement>(null);
  const [notificationAnchor, setNotificationAnchor] =
    useState<null | HTMLElement>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [mobileMoreAnchorEl, setMobileMoreAnchorEl] =
    React.useState<null | HTMLElement>(null);

  const dispatch = useDispatch();
  const { logout } = useAuthHook();
  const navigate = useNavigate();
  const location = useLocation();
  const { name } = useSelector((state: RootState) => state.auth);
  const { fiscalYear, filters, userId } = useSelector(
    (state: RootState) => state.account
  );
  const isAdminEnable = useSelector(
    (state: RootState) => state.permission.isAdminEnable
  );
  const fetchingCount = useIsFetching();
  const isAnyApiWasLoading = fetchingCount > 0;

  // Permission Mangement
  const { permission } = useSelector((state: RootState) => state.permission);
  const isViewAccountsEnable = useMemo(
    () => checkPermission(permission, AllPermissions.ACCOUNTS_VIEW_EDIT),
    [permission]
  );
  const isAccountsNameEnabled = useMemo(
    () =>
      permission
        .find((item) => item.name === AllPermissions.ACCOUNTS_VIEW_EDIT)
        ?.fields?.find((it) => it.name === 'account_name')?.read ?? false,
    [permission]
  );
  const isViewProfileEnable = useMemo(
    () => checkPermission(permission, AllPermissions.PROFILE_VIEW_EDIT),
    [permission]
  );
  const { orgName, logoUrl, profileURL } = useSelector(
    (state: RootState) => state.orgLogoInfo
  );

  const isFilterApplied = useMemo(() => filters.length > 0, [filters]);
  const isCaseModule = location.pathname.startsWith(`${CASE}/`);
  const isProjectModule = location.pathname.startsWith(`${PROJECT}/`);
  const isSpecificFYModule = isCaseModule || isProjectModule;
  const environment = import.meta.env.VITE_ENVIRONMENT;

  const [globalAnchorEl, setGlobalAnchorEl] =
    useState<HTMLButtonElement | null>(null);

  const handleGlobalFilterModal = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      setGlobalAnchorEl(event.currentTarget);
    },
    []
  );

  const handleCloseGlobalFilter = useCallback(() => {
    setGlobalAnchorEl(null);
  }, []);

  const isGlobalModalOpen = Boolean(globalAnchorEl);
  const globalFilterId = isGlobalModalOpen
    ? 'global-filter-popover'
    : undefined;

  const menuId = 'account-menu';
  const mobileMenuId = 'account-menu-mobile';
  const notificationId = 'notification-menu';
  const searchMenuId = 'search-menu';
  const isMenuOpen = Boolean(anchorEl);
  const isMobileMenuOpen = Boolean(mobileMoreAnchorEl);
  const isNotificationMenuOpen = Boolean(notificationAnchor);
  const isSearchMenuOpen = Boolean(searchAnchor);
  const searchMenus = useMemo(
    () => ['Account', 'Projects', 'Case', 'Resources', 'TimeSheet'],
    []
  );
  const fiscalYearsDropDown = useMemo(
    () => [{ value: '', label: 'FY-All' }].concat(fiscalYears),
    []
  );

  // Initialize password reset instance once
  useEffect(() => {
    if (!passwordResetInstanceRef.current) {
      const instance = new PublicClientApplication(msalResetPasswordConfig);
      instance
        .initialize()
        .then(() => {
          passwordResetInstanceRef.current = instance;
        })
        .catch(console.error);
    }
  }, []);

  // Handle password reset callback
  useEffect(() => {
    instance
      .handleRedirectPromise()
      .then(async (response) => {
        if (localStorage.getItem('resetPassword') && response) {
          successToast('Your password has been updated successfully');
          await passwordResetInstanceRef?.current?.clearCache();
          handleLogout();
        }
      })
      .catch((error) => {
        localStorage.removeItem('resetPassword');
        console.log('Password reset processing error:', error);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [instance]);

  // Route observer: Handle fiscal year reset when leaving Case module
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      if (isSpecificFYModule) {
        savedPrevFYRef.current = 'FY-All';
        prevIsCaseRouteRef.current = true;
        return;
      }
    }

    const prevIsCaseRoute = prevIsCaseRouteRef.current;

    // Transitioning from non-specific to specific module: save current fiscal year
    if (!prevIsCaseRoute && isSpecificFYModule) {
      if (savedPrevFYRef.current === null) {
        savedPrevFYRef.current = fiscalYear;
      }
    }

    // Transitioning from specific to non-specific module: restore previous fiscal year
    if (prevIsCaseRoute && !isSpecificFYModule) {
      if (savedPrevFYRef.current !== null) {
        dispatch(setFiscalYear(savedPrevFYRef.current));
        savedPrevFYRef.current = null;
      } else {
        dispatch(setFiscalYear('FY-All'));
      }
    }

    // Ensure we are synced with storage if we are not in a specific module and not transitioning from one
    if (!prevIsCaseRoute && !isSpecificFYModule && userId) {
      const { fiscalYear: storedFY } = getFiltersFromStorage(userId);
      if (storedFY !== fiscalYear) {
        dispatch(setFiscalYear(storedFY));
      }
    }

    // Update the ref for next comparison
    prevIsCaseRouteRef.current = isSpecificFYModule;
  }, [location.pathname, isSpecificFYModule, dispatch, fiscalYear, userId]);

  const handleProfileMenuOpen = useCallback(
    (event: React.MouseEvent<HTMLElement>) => {
      setAnchorEl(event.currentTarget);
    },
    []
  );

  const handleMobileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setMobileMoreAnchorEl(event.currentTarget);
  };

  const handleMobileMenuClose = () => {
    setMobileMoreAnchorEl(null);
  };

  const handleMenuClose = useCallback(() => {
    setAnchorEl(null);
    setMobileMoreAnchorEl(null);
  }, []);

  const handleNotificationClose = useCallback(() => {
    setNotificationAnchor(null);
  }, []);

  const handleSearchMenuClose = () => {
    setSearchAnchor(null);
  };

  // const handleNotificationOpen = useCallback(
  //   (event: React.MouseEvent<HTMLElement>) => {
  //     setNotificationAnchor(event.currentTarget);
  //   },
  //   []
  // );

  const changePassword = useCallback(async () => {
    handleMenuClose();
    try {
      await passwordResetInstanceRef.current?.handleRedirectPromise();
      await passwordResetInstanceRef.current?.clearCache();
      localStorage.setItem('resetPassword', 'true');
      await passwordResetInstanceRef.current?.loginRedirect();
    } catch (error) {
      const err = error as BrowserAuthError;
      if (
        ![
          'The user has cancelled entering self-asserted information.',
          'User cancelled the flow',
        ].some((msg) => err.errorMessage.includes(msg))
      ) {
        errorToast(err.errorMessage);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [passwordResetInstanceRef]);
  const [searchparams] = useSearchParams();
  const handleLogout = useCallback(async () => {
    handleMenuClose();
    logout();
    instance.logoutRedirect().catch((e) => {
      console.error('Error logging out:', e);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [instance]);

  const goToProfile = useCallback(() => {
    const params = new URLSearchParams(searchparams); // Clone current search params
    params.set('userView', 'profile');
    navigate({
      pathname: PROFILE,
      search: params.toString(),
    });
    handleMenuClose();
  }, [navigate, searchparams, handleMenuClose]);

  const renderMenu = useMemo(
    () => (
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
        {isViewProfileEnable && (
          <MenuItem sx={{ fontSize: '14px' }} onClick={goToProfile}>
            View Profile Details
          </MenuItem>
        )}
        <MenuItem sx={{ fontSize: '14px' }} onClick={changePassword}>
          Change Password
        </MenuItem>
        <MenuItem sx={{ fontSize: '14px' }} onClick={handleLogout}>
          Logout
        </MenuItem>
      </Menu>
    ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [anchorEl, isMenuOpen, isViewProfileEnable]
  );

  const renderNotificationMenu = useMemo(
    () => (
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
    ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isNotificationMenuOpen, notificationAnchor]
  );

  const renderSearchMenu = useMemo(
    () => (
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
    ),
    [isSearchMenuOpen, searchAnchor, searchMenus]
  );

  const renderMobileMenu = useMemo(
    () => (
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
        {/* <MenuItem>
          <IconButton size='large' color='inherit'>
            <Badge badgeContent={4} color='error'>
              <NotificationIcon alt='notification' />
            </Badge>
          </IconButton>
          <p>Messages</p>
        </MenuItem> */}
        <MenuItem onClick={handleProfileMenuOpen}>
          <IconButton
            size='large'
            aria-label='account of current user'
            aria-controls='primary-search-account-menu'
            aria-haspopup='true'
            color='inherit'
          >
            <AccountsIcon />
          </IconButton>
          <p>Profile</p>
        </MenuItem>
      </Menu>
    ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isMobileMenuOpen, mobileMoreAnchorEl]
  );

  const MemoizedAvatar = React.memo(
    ({
      name,
      profileURL,
    }: {
      name: string | null;
      profileURL: string | null;
    }) => {
      return (
        <>
          {profileURL ? (
            <img
              className='w-6 h-6 rounded-full bg-white object-cover'
              src={profileURL}
              alt={`${name || 'User'}'s profile`}
              onError={(e) => {
                const target = e.currentTarget;
                target.style.display = 'none'; // hide broken image

                // show fallback
                const fallback = target.nextElementSibling as HTMLElement;
                if (fallback) fallback.style.display = 'flex';
              }}
            />
          ) : null}

          <div
            className='w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center'
            style={{ display: profileURL ? 'none' : 'flex' }} // hide initially when image exists
          >
            <AvatarIcon className='w-5 h-5' />
          </div>
        </>
      );
    }
  );

  return (
    <>
      <AppBar sx={{ boxShadow: 'none' }} position='sticky'>
        <Toolbar className='justify-between !h-[40px] !max-h-[40px] !min-h-[40px] !pl-0'>
          <div className='relative rounded-md mr-2 flex items-center gap-2'>
            <button
              className='cursor-pointer '
              type='button'
              onClick={handleSidebarToggle}
            >
              <BurgerMenuIcon alt='menu' className='h-[32px] w-[32px]' />
            </button>
            {orgName && logoUrl && (
              <CompanyBadge name={orgName} logoUrl={logoUrl} />
            )}
          </div>
          <Box
            sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center' }}
          >
            {!showAdminSidebar && isViewAccountsEnable && (
              <>
                {environment &&
                  ['Dev', 'QA', 'Pre-Prod'].includes(environment) && (
                    <>
                      <div className='bg-[#FFFFFF26] px-2 h-[25px] flex justify-center items-center gap-1.5 mr-2 rounded-[2px] whitespace-nowrap'>
                        <span className='text-[12px] font-normal text-white'>
                          Environment: {environment}
                        </span>
                      </div>
                      <div className='border-l border-[#FFFFFF4D] h-6 mr-2' />
                    </>
                  )}
                {isAccountsNameEnabled && (
                  <>
                    <div className='relative'>
                      <button
                        aria-describedby={globalFilterId}
                        onClick={handleGlobalFilterModal}
                        className={`${isGlobalModalOpen || isFilterApplied ? 'bg-[#FFFFFF26]' : 'bg-transparent'} w-[110px] min-w-[110px] px-3 h-[25px] flex justify-center items-center gap-1.5 mr-2 cursor-pointer focus:outline-none rounded-[2px] hover:bg-[#FFFFFF33] hover:rounded-xs whitespace-nowrap`}
                      >
                        <div className='relative'>
                          <GlobeIcon
                            alt='global'
                            className='h-[16px] w-[16px]'
                          />
                          {isFilterApplied && (
                            <div className='absolute -top-[5px] -right-[5px] w-4 h-4 flex items-center justify-center text-xs'>
                              <span className='w-[8px] h-[8px] bg-[#FF3C03] rounded-full flex items-center justify-center z-10'></span>
                            </div>
                          )}
                        </div>
                        <span className='text-[13px] font-normal text-white'>
                          Accounts ({isFilterApplied ? filters.length : 0})
                        </span>
                      </button>
                      <GlobalFilterModal
                        isOpen={isGlobalModalOpen}
                        filterAnchorEl={globalAnchorEl}
                        filterId={globalFilterId}
                        handleClose={handleCloseGlobalFilter}
                      />
                    </div>
                    <div className='border-l border-[#FFFFFF4D] h-6 mx-1' />
                  </>
                )}
                <GlobalFiscalYearDropdown
                  fiscalYear={fiscalYear}
                  fiscalYearsOptions={fiscalYearsDropDown}
                  isGlobal={true}
                  onChange={(e) => dispatch(setFiscalYear(e.target.value))}
                  disabled={isSpecificFYModule}
                />
                <div className='border-l border-[#FFFFFF4D] ml-1 mr-2 h-6' />
              </>
            )}
            {/* <IconButton size='large' color='inherit'>
              <PhoneIcon alt='phone' className='h-[20px] w-[20px]' />
            </IconButton> */}
            <NotificationPanel />
            {isAdminEnable && (
              <Tooltip
                title={`${isAnyApiWasLoading ? 'Loading...' : `Switch to ${showAdminSidebar ? 'Consultant' : 'Admin'}`}`}
                arrow
              >
                <span>
                  <IconButton
                    size='large'
                    color='inherit'
                    onClick={debounce(switchSideBarMenus, 300)}
                    disabled={isAnyApiWasLoading}
                  >
                    <AdminSettingIcon
                      alt='admin-settings'
                      className='h-[19px] w-[19px]'
                    />
                  </IconButton>
                </span>
              </Tooltip>
            )}
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
              <MemoizedAvatar name={name} profileURL={profileURL} />
              <span className='text-[12px] font-[400] px-2'>{name}</span>
              <ChevronDownIcon alt='down nav' />
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
              <MenuIcon alt='menu' />
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>
      {renderMobileMenu}
      {renderMenu}
      {renderNotificationMenu}
      {renderSearchMenu}
    </>
  );
};
