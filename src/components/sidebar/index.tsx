import {
  Box,
  Collapse,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Tooltip,
} from '@mui/material';
import React, {
  useState,
  useEffect,
  Fragment,
  useCallback,
  Suspense,
  useMemo,
} from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  AdminChevronDownIcon,
  AdminChevronUpIcon,
  AdministrationIcon,
  AdminPermissionIcon,
  AdminSubmenuActiveIcon,
  ManagerUserIcon,
  ManageProfileIcon,
  ManageGroupIcon,
  ManageUserAccessIcon,
  ConfigureSettingIcon,
  ManageSettingsIcon,
  ManageGeoIcon,
  AdminTemplateIcon,
  ImportTemplateIcon,
  InteractionTemplateIcon,
  ChecklistTemplateIcon,
  TaskTemplateIcon,
  SurveyTemplateIcon,
  EmailTemplateIcon,
} from '../../assets';
import {
  AdminNavItem,
  SideBarProps,
  SubItemTitle,
} from '../../consultant/types';
import { useAuthHook } from '../../hooks/use-auth';
import {
  ADMIN_MANAGE_USER,
  CHECKLIST_TEMPLATES,
  EMAIL_TEMPLATES,
  IMPORT_TEMPLATES,
  INTERACTION_TEMPLATES,
  MANAGE_GEO_BASED_RULE,
  MANAGE_PROFILE,
  MANAGE_SETTINGS,
  // MANAGE_USER_ACCESS,
  MANAGE_ACCOUNT_ACCESS,
  MANAGE_USER_GROUP,
  TASK_TEMPLATES,
  SURVEY_TEMPLATES,
} from '../../routes';
import { useSelector } from 'react-redux';
import { RootState } from '../../store/store';
import { MenuOption } from '../../common-service';
import { accountNavItems } from './accounts-menu';
import LogoSmall from '../../assets/icons/logo-small.svg?react';
import Logo from '../../assets/icons/logo.svg?react';

const sideNavAdminItems: AdminNavItem[] = [
  {
    title: 'Admin Permission',
    icon: AdminPermissionIcon,
    openStatus: false,
    subItemTitle: [
      {
        id: MenuOption.MANAGE_USER,
        name: 'Manage User',
        icon: ManagerUserIcon,
        link: ADMIN_MANAGE_USER,
        matchLink: ADMIN_MANAGE_USER,
      },
      {
        id: MenuOption.MANAGE_PROFILE,
        name: 'Manage Profile',
        icon: ManageProfileIcon,
        link: MANAGE_PROFILE,
        matchLink: MANAGE_PROFILE,
      },
      {
        id: MenuOption.MANAGE_USER_GROUP,
        name: 'Manage User Group',
        icon: ManageGroupIcon,
        link: MANAGE_USER_GROUP,
        matchLink: MANAGE_USER_GROUP,
      },
      {
        id: MenuOption.MANAGE_ACCOUNT_ACCESS,
        name: 'Manage Account Access',
        icon: ManageUserAccessIcon,
        link: MANAGE_ACCOUNT_ACCESS,
        matchLink: MANAGE_ACCOUNT_ACCESS,
      },
    ],
  },
  {
    title: 'Configure Settings',
    icon: ConfigureSettingIcon,
    openStatus: false,
    subItemTitle: [
      {
        id: MenuOption.MANAGE_SETTINGS,
        name: 'Manage Settings',
        icon: ManageSettingsIcon,
        link: MANAGE_SETTINGS,
        matchLink: MANAGE_SETTINGS,
      },
      {
        id: MenuOption.MANAGE_GEO_BASED_RULE,
        name: 'Manage Geo-Based Rule',
        icon: ManageGeoIcon,
        link: MANAGE_GEO_BASED_RULE,
        matchLink: MANAGE_GEO_BASED_RULE,
      },
    ],
  },
  {
    title: 'Admin Template',
    icon: AdminTemplateIcon,
    openStatus: false,
    subItemTitle: [
      {
        id: MenuOption.IMPORT_TEMPLATE,
        name: 'Import templates',
        icon: ImportTemplateIcon,
        link: IMPORT_TEMPLATES,
        matchLink: IMPORT_TEMPLATES,
      },
      {
        id: MenuOption.INTERACTION_TEMPLATE,
        name: 'Interaction templates',
        icon: InteractionTemplateIcon,
        link: INTERACTION_TEMPLATES,
        matchLink: INTERACTION_TEMPLATES,
      },
      {
        id: MenuOption.EMAIL_TEMPLATE,
        name: 'Email templates',
        icon: EmailTemplateIcon,
        link: EMAIL_TEMPLATES,
        matchLink: EMAIL_TEMPLATES,
      },
      {
        id: MenuOption.SURVEY_TEMPLATE,
        name: 'Survey templates',
        icon: SurveyTemplateIcon,
        link: SURVEY_TEMPLATES,
        matchLink: SURVEY_TEMPLATES,
      },
      {
        id: MenuOption.TASK_TEMPLATE,
        name: 'Task templates',
        icon: TaskTemplateIcon,
        link: TASK_TEMPLATES,
        matchLink: TASK_TEMPLATES,
      },
      {
        id: MenuOption.CHECKLIST_TEMPLATE,
        name: 'Checklist templates',
        icon: ChecklistTemplateIcon,
        link: CHECKLIST_TEMPLATES,
        matchLink: CHECKLIST_TEMPLATES,
      },
    ],
  },
];

const matchCheck = (subItem: SubItemTitle, pathname: string): boolean => {
  return subItem.matchLink === pathname;
};

export const Sidebar: React.FC<SideBarProps> = ({
  showAdminSidebar,
  mobileView,
  sidebarExpand,
}) => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  // Get only few segments of the path
  const trimmedPathname = useCallback(
    (count: number) =>
      '/' + pathname.split('/').filter(Boolean).slice(0, count).join('/'),
    [pathname]
  );
  const { logout } = useAuthHook();

  // Permission Mangement
  const { menus } = useSelector((state: RootState) => state.permission);
  const accountMenus = useMemo(() => {
    return accountNavItems.map((item) => {
      const menu = menus.find((menu) => menu.name === item.id);
      return {
        ...item,
        hide: menu && !menu.is_enabled,
      };
    });
  }, [menus]);
  const memoizedAdminNavItems = useMemo(() => {
    return sideNavAdminItems
      .map((item) => ({
        ...item,
        subItemTitle: item.subItemTitle.map((subItem) => {
          const menu = menus.find((menu) => menu.name === subItem.id);
          return {
            ...subItem,
            hide: menu && !menu.is_enabled,
          };
        }),
        openStatus: item.subItemTitle.some((subItem) =>
          matchCheck(subItem, trimmedPathname(2))
        ),
      }))
      .filter((item) => {
        const visibleSubItems = item.subItemTitle.filter(
          (subItem) => !subItem.hide
        );
        return visibleSubItems.length > 0;
      });
  }, [menus, trimmedPathname]);
  const [adminNavItems, setAdminNavItems] = useState<AdminNavItem[]>(
    memoizedAdminNavItems
  );
  useEffect(() => {
    setAdminNavItems(memoizedAdminNavItems);
  }, [memoizedAdminNavItems]);

  const handleToggle = useCallback((index: number) => {
    setAdminNavItems((prevItems) =>
      prevItems.map((item, idx) =>
        idx === index
          ? { ...item, openStatus: !item.openStatus }
          : { ...item, openStatus: false }
      )
    );
  }, []);

  const handleLogout = useCallback(() => {
    logout();
  }, [logout]);

  const noItemsOpen = adminNavItems.every((item) => !item.openStatus);

  return (
    <Drawer
      variant={mobileView ? 'temporary' : 'persistent'}
      anchor='left'
      open={mobileView ? sidebarExpand : true}
      // onClose={handleBackdropClick}
      classes={{
        paper: `transform transition-all ease-in-out ${
          // Adjusted duration
          sidebarExpand ? 'w-[200px] duration-500' : 'w-[65px] duration-300'
        }`,
      }}
      sx={{
        '& .MuiDrawer-paper': {
          backgroundColor: 'primary.main',
          color: 'white',
          border: 'none !important',
          transition: (theme) =>
            theme.transitions.create(['width'], {
              easing: theme.transitions.easing.easeInOut,
              duration: sidebarExpand ? 500 : 300,
            }),
          overflow: 'hidden',
        },
      }}
    >
      <React.Suspense fallback={null}>
        <div className='flex items-center justify-center h-[40px] relative'>
          <div
            className={`
                absolute inset-0 flex items-center justify-start pl-3
                transition-opacity ease-in-out 
                ${sidebarExpand ? 'opacity-100 duration-650 delay-200' : 'opacity-0 duration-300'}
              `}
          >
            <Logo alt='logo' className='h-[16px]' />
          </div>
          {/* Collapsed Logo */}
          <div
            className={`
                absolute inset-0 flex items-center justify-start pl-6
                transition-opacity ease-in-out
                ${!sidebarExpand ? 'opacity-100 duration-650 delay-200' : 'opacity-0 duration-300'}
              `}
          >
            <LogoSmall alt='logo' className='h-[18px]' />
          </div>
        </div>
        <List
          sx={{
            mt: 0.5,
            flexGrow: 1,
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            px: 1,
          }}
        >
          {!showAdminSidebar &&
            accountMenus.map((item, i) => {
              if (item.hide) return null;
              if (item.type === 'divider') {
                return <Fragment key={i} />;
              }
              const isAfterDivider =
                i > 0 && accountNavItems[i - 1]?.type === 'divider';

              return (
                <ListItem
                  key={i}
                  disablePadding
                  sx={{
                    width: '100%',
                    px: 1,
                    ...(isAfterDivider && { mt: 'auto' }),
                  }}
                >
                  <ListItemButton
                    sx={{
                      minHeight: 32,
                      width: !sidebarExpand ? '32px' : '100%',
                      height: '32px',
                      px: '0px',
                      py: 0,
                      mt: '4px',
                      gap: '4px',
                      borderRadius: '2px',
                      backgroundColor:
                        item.matchLink === trimmedPathname(1)
                          ? 'rgba(255, 255, 255, 0.2)'
                          : 'transparent',
                      '&:hover': {
                        backgroundColor: 'rgba(255, 255, 255, 0.2)',
                      },
                      transition: 'all 0.3s ease-in-out',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'flex-start',
                    }}
                    onClick={() => {
                      if (item.name === 'Logout') {
                        handleLogout();
                      } else {
                        navigate(item.link);
                      }
                    }}
                  >
                    <Tooltip
                      title={!sidebarExpand ? item.name : ''}
                      placement='right'
                      arrow
                      slotProps={{
                        tooltip: {
                          sx: {
                            backgroundColor: '#fff',
                            color: 'rgba(0, 0, 0, 0.87)',
                            boxShadow: 2,
                            borderRadius: '2px',
                          },
                        },
                      }}
                    >
                      <ListItemIcon
                        sx={{
                          minWidth: '32px', // Reference style
                          height: '26px', // Reference style
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          opacity: 1,
                          transition: sidebarExpand
                            ? 'opacity 400ms ease-in-out, transform 400ms ease-in-out'
                            : 'opacity 250ms ease-in-out, transform 250ms ease-in-out',
                          transform: 'scale(1)',
                        }}
                      >
                        <item.icon
                          alt='menu-icon'
                          className='h-[16px] w-[16px]'
                          style={{
                            transition: sidebarExpand
                              ? 'all 400ms ease-in-out'
                              : 'all 250ms ease-in-out',
                          }}
                        />
                      </ListItemIcon>
                    </Tooltip>
                    <Box
                      sx={{
                        opacity: sidebarExpand ? 1 : 0,
                        transition: sidebarExpand
                          ? 'opacity 400ms ease-in-out, transform 400ms ease-in-out'
                          : 'opacity 200ms ease-in-out, transform 200ms ease-in-out',
                        transitionDelay: sidebarExpand ? '100ms' : '0ms',
                        overflow: 'hidden',
                        whiteSpace: 'nowrap',
                        width: sidebarExpand ? 'auto' : 0,
                        transform: sidebarExpand
                          ? 'translateX(0)'
                          : 'translateX(-10px)',
                      }}
                    >
                      <ListItemText
                        sx={{
                          '& .MuiTypography-root': {
                            fontWeight: 600,
                            fontSize: '13px',
                          },
                        }}
                        primary={item.name}
                      />
                    </Box>
                  </ListItemButton>
                </ListItem>
              );
            })}
          {showAdminSidebar && (
            <ListItem disablePadding sx={{ width: '100%', px: 1 }}>
              <ListItemButton
                sx={{
                  minHeight: 32,
                  width: !sidebarExpand ? '32px' : '100%',
                  height: '32px',
                  px: '0px',
                  py: 0,
                  mt: '4px',
                  gap: '4px',
                  borderRadius: '2px',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  },
                  transition: 'all 0.3s ease-in-out',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-start',
                }}
              >
                <Tooltip
                  title={!sidebarExpand ? 'Administration' : ''}
                  placement='right'
                  arrow
                  slotProps={{
                    tooltip: {
                      sx: {
                        backgroundColor: '#fff',
                        color: 'rgba(0, 0, 0, 0.87)',
                        boxShadow: 2,
                        borderRadius: '2px',
                      },
                    },
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: '32px', // Reference style
                      height: '26px', // Reference style
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      opacity: 1,
                      transition: sidebarExpand
                        ? 'opacity 400ms ease-in-out, transform 400ms ease-in-out'
                        : 'opacity 250ms ease-in-out, transform 250ms ease-in-out',
                      transform: 'scale(1)',
                    }}
                  >
                    <AdministrationIcon
                      alt='menu-icon'
                      className='h-[16px] w-[16px]'
                      style={{
                        transition: sidebarExpand
                          ? 'all 400ms ease-in-out'
                          : 'all 250ms ease-in-out',
                      }}
                    />
                  </ListItemIcon>
                </Tooltip>
                <Box
                  sx={{
                    opacity: sidebarExpand ? 1 : 0,
                    transition: sidebarExpand
                      ? 'opacity 400ms ease-in-out, transform 400ms ease-in-out'
                      : 'opacity 200ms ease-in-out, transform 200ms ease-in-out',
                    transitionDelay: sidebarExpand ? '100ms' : '0ms',
                    overflow: 'hidden',
                    whiteSpace: 'nowrap',
                    width: sidebarExpand ? 'auto' : 0,
                    transform: sidebarExpand
                      ? 'translateX(0)'
                      : 'translateX(-10px)',
                  }}
                >
                  <ListItemText
                    sx={{
                      '& .MuiTypography-root': {
                        fontWeight: 600,
                        fontSize: '13px',
                      },
                    }}
                    primary='Administration'
                  />
                </Box>
              </ListItemButton>
            </ListItem>
          )}
          {showAdminSidebar &&
            adminNavItems.map((item, index) => (
              <div key={index}>
                <ListItem
                  disablePadding
                  sx={{
                    width: '100%',
                    px: 1,
                    mt: '4px',
                    display:
                      !sidebarExpand && !noItemsOpen && !item.openStatus
                        ? 'none'
                        : 'flex',
                  }}
                >
                  <ListItemButton
                    sx={{
                      minHeight: 32,
                      width: !sidebarExpand ? '32px' : '100%',
                      height: '32px',
                      px: '0px',
                      py: 0,
                      mt: '4px',
                      borderRadius: '2px',
                      backgroundColor: item.openStatus
                        ? 'rgba(255, 255, 255, 0.2)'
                        : 'transparent',
                      '&:hover': {
                        backgroundColor: 'rgba(255, 255, 255, 0.2)',
                      },
                      transition: 'all 0.3s ease-in-out',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'flex-start',
                    }}
                    onClick={() => handleToggle(index)}
                  >
                    <Tooltip
                      title={!sidebarExpand ? item.title : ''}
                      placement='right'
                      arrow
                      slotProps={{
                        tooltip: {
                          sx: {
                            backgroundColor: '#fff',
                            color: 'rgba(0, 0, 0, 0.87)',
                            boxShadow: 2,
                            borderRadius: '2px',
                          },
                        },
                      }}
                    >
                      <ListItemIcon
                        sx={{
                          minWidth: '32px', // Reference style
                          height: '26px', // Reference style
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          opacity: 1,
                          transition: sidebarExpand
                            ? 'opacity 400ms ease-in-out, transform 400ms ease-in-out'
                            : 'opacity 250ms ease-in-out, transform 250ms ease-in-out',
                          transform: 'scale(1)',
                        }}
                      >
                        <item.icon
                          alt='menu-icon'
                          className='h-[16px] w-[16px]'
                          style={{
                            transition: sidebarExpand
                              ? 'all 400ms ease-in-out'
                              : 'all 250ms ease-in-out',
                          }}
                        />
                      </ListItemIcon>
                    </Tooltip>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        width: '100%',
                        opacity: sidebarExpand ? 1 : 0,
                        transition: sidebarExpand
                          ? 'opacity 400ms ease-in-out, transform 400ms ease-in-out'
                          : 'opacity 200ms ease-in-out, transform 200ms ease-in-out',
                        transitionDelay: sidebarExpand ? '100ms' : '0ms',
                        overflow: 'hidden',
                        transform: sidebarExpand
                          ? 'translateX(0)'
                          : 'translateX(-10px)',
                      }}
                    >
                      <ListItemText
                        sx={{
                          flex: 1,
                          '& .MuiTypography-root': {
                            fontWeight: 600,
                            fontSize: '13px',
                            whiteSpace: 'nowrap',
                          },
                        }}
                        primary={item.title}
                      />
                      {item.subItemTitle.length > 0 && (
                        <Box
                          sx={{
                            ml: 'auto',
                            display: 'flex',
                            alignItems: 'center',
                            opacity: 1,
                            pr: '6px',
                            transition: sidebarExpand
                              ? 'opacity 400ms ease-in-out, transform 400ms ease-in-out'
                              : 'opacity 250ms ease-in-out, transform 250ms ease-in-out',
                            transform: 'scale(1)',
                          }}
                        >
                          <Suspense fallback={null}>
                            {item.openStatus ? (
                              <AdminChevronUpIcon
                                alt='up'
                                className='h-[16px] w-[16px]'
                                style={{
                                  transition: sidebarExpand
                                    ? 'all 400ms ease-in-out'
                                    : 'all 250ms ease-in-out',
                                }}
                              />
                            ) : (
                              <AdminChevronDownIcon
                                alt='down'
                                className='h-[16px] w-[16px]'
                                style={{
                                  transition: sidebarExpand
                                    ? 'all 400ms ease-in-out'
                                    : 'all 250ms ease-in-out',
                                }}
                              />
                            )}
                          </Suspense>
                        </Box>
                      )}
                    </Box>
                  </ListItemButton>
                </ListItem>
                <Collapse in={item.openStatus} timeout={400}>
                  {item.subItemTitle &&
                    item.subItemTitle.map((subItem, subIndex) => {
                      if (subItem.hide) return null;
                      const isActive = matchCheck(subItem, trimmedPathname(2));
                      return (
                        <ListItem
                          key={subIndex}
                          disablePadding
                          sx={{
                            width: '100%',
                            mt: '4px',
                            px: 1,
                          }}
                        >
                          <ListItemButton
                            sx={{
                              minHeight: 32,
                              width: !sidebarExpand ? '32px' : '100%',
                              height: '32px',
                              px: '0px',
                              py: 0,
                              mt: '4px',
                              borderRadius: '2px',
                              backgroundColor: isActive
                                ? 'rgba(255, 255, 255, 0.2)'
                                : 'transparent',
                              '&:hover': {
                                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                              },
                              transition: 'all 0.3s ease-in-out',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'flex-start',
                            }}
                            onClick={() => navigate(subItem.link)}
                          >
                            <Tooltip
                              title={!sidebarExpand ? subItem.name : ''}
                              placement='right'
                              arrow
                              slotProps={{
                                tooltip: {
                                  sx: {
                                    backgroundColor: '#fff',
                                    color: 'rgba(0, 0, 0, 0.87)',
                                    boxShadow: 2,
                                    borderRadius: '2px',
                                  },
                                },
                              }}
                            >
                              <ListItemIcon
                                sx={{
                                  minWidth: '32px', // Reference style
                                  height: '26px', // Reference style
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  flexShrink: 0,
                                  opacity: 1,
                                  transition: sidebarExpand
                                    ? 'opacity 400ms ease-in-out, transform 400ms ease-in-out'
                                    : 'opacity 250ms ease-in-out, transform 250ms ease-in-out',
                                  transform: 'scale(1)',
                                }}
                              >
                                <subItem.icon
                                  alt='menu-icon'
                                  className='h-[16px] w-[16px]'
                                  style={{
                                    filter:
                                      !sidebarExpand && isActive
                                        ? 'brightness(0) saturate(100%) invert(53%) sepia(89%) saturate(1295%) hue-rotate(340deg) brightness(99%) contrast(93%)'
                                        : 'none',
                                    transition: sidebarExpand
                                      ? 'all 400ms ease-in-out'
                                      : 'all 250ms ease-in-out',
                                  }}
                                />
                              </ListItemIcon>
                            </Tooltip>
                            <Box
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                width: '100%',
                                opacity: sidebarExpand ? 1 : 0,
                                transition: sidebarExpand
                                  ? 'opacity 400ms ease-in-out, transform 400ms ease-in-out'
                                  : 'opacity 200ms ease-in-out, transform 200ms ease-in-out',
                                transitionDelay: sidebarExpand
                                  ? '100ms'
                                  : '0ms',
                                overflow: 'hidden',
                                transform: sidebarExpand
                                  ? 'translateX(0)'
                                  : 'translateX(-10px)',
                              }}
                            >
                              <ListItemText
                                sx={{
                                  flex: 1,
                                  '& .MuiTypography-root': {
                                    fontWeight: isActive ? 400 : 300,
                                    fontSize: '13px',
                                    color: isActive ? '#F16137' : '#FFFFFF',
                                    whiteSpace: 'wrap',
                                    lineHeight: '16px',
                                  },
                                }}
                                primary={subItem.name}
                              />
                              {isActive && (
                                <Box
                                  sx={{
                                    ml: 'auto',
                                    display: 'flex',
                                    alignItems: 'center',
                                    opacity: 1,
                                    pr: '6px',
                                    transition: sidebarExpand
                                      ? 'opacity 400ms ease-in-out, transform 400ms ease-in-out'
                                      : 'opacity 250ms ease-in-out, transform 250ms ease-in-out',
                                    transform: 'scale(1)',
                                  }}
                                >
                                  <AdminSubmenuActiveIcon
                                    className='h-[16px] w-[16px]'
                                    style={{
                                      transition: sidebarExpand
                                        ? 'all 400ms ease-in-out'
                                        : 'all 250ms ease-in-out',
                                    }}
                                  />
                                </Box>
                              )}
                            </Box>
                          </ListItemButton>
                        </ListItem>
                      );
                    })}
                </Collapse>
              </div>
            ))}
        </List>
      </React.Suspense>
    </Drawer>
  );
};
