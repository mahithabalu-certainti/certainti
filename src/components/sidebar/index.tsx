import {
  Box,
  Collapse,
  Drawer,
  Link,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Tooltip,
} from '@mui/material';
import React, { useState, useEffect, Fragment, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  AdminChevronDownIcon,
  AdminChevronUpIcon,
  AdministrationIcon,
  AdminPermissionIcon,
  AdminSubmenuActiveIcon,
  Logo,
  LogoSmall,
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
  MANAGE_USER_ACCESS,
  MANAGE_USER_GROUP,
  TASK_TEMPLATES,
  SURVEY_TEMPLATES,
} from '../../routes';
import { useSelector } from 'react-redux';
import { RootState } from '../../store/store';
import { MenuOption } from '../../common-service';
import { accountNavItems } from './accounts-menu';

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
        id: MenuOption.MANAGE_USER_ACCESS,
        name: 'Manage User Access',
        icon: ManageUserAccessIcon,
        link: MANAGE_USER_ACCESS,
        matchLink: MANAGE_USER_ACCESS,
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

  const [accountMenus, setAccountMenus] = useState(accountNavItems);
  const [adminNavItems, setAdminNavItems] =
    useState<AdminNavItem[]>(sideNavAdminItems);
  // Permission Mangement
  const { menus } = useSelector((state: RootState) => state.permission);

  useEffect(() => {
    const updatedItems = accountNavItems.map((item) => {
      const menu = menus.find((menu) => menu.name === item.id);
      return {
        ...item,
        hide: menu && !menu.is_enabled,
      };
    });
    setAccountMenus(updatedItems);
  }, [menus]);

  useEffect(() => {
    const updatedItems = sideNavAdminItems.map((item) => ({
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
    }));
    setAdminNavItems(updatedItems);
  }, [menus, trimmedPathname]);

  const handleLogout = () => {
    logout();
  };

  const handleToggle = (index: number) => {
    setAdminNavItems((prevItems) =>
      prevItems.map((item, idx) =>
        idx === index
          ? { ...item, openStatus: !item.openStatus }
          : { ...item, openStatus: false }
      )
    );
  };

  const noItemsOpen = adminNavItems.every((item) => !item.openStatus);

  return (
    <Drawer
      variant={mobileView ? 'temporary' : 'persistent'}
      anchor='left'
      open={mobileView ? sidebarExpand : true}
      // onClose={handleBackdropClick}
      classes={{
        paper: `transform transition-all ease-in-out ${
          sidebarExpand ? 'w-[200px] duration-400' : 'w-[65px] duration-300'
        }`,
      }}
      sx={{
        '& .MuiDrawer-paper': {
          backgroundColor: 'primary.main',
          color: 'white', // Set text color to white
          border: 'none !important',
          transition: (theme) =>
            theme.transitions.create(['width', 'background-color'], {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.standard,
            }),
        },
      }}
    >
      <div className='flex items-center justify-center h-[40px]'>
        <Link aria-label='logo'>
          {sidebarExpand ? (
            <Logo alt='logo' className='h-[16px]' />
          ) : (
            <LogoSmall alt='logo' className='h-[18px]' />
          )}
        </Link>
      </div>

      <List
        sx={{
          mx: !sidebarExpand ? 'auto' : 'none',
          mt: 0.5,
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
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
                  maxWidth: '170px',
                  mx: 'auto',
                  ...(isAfterDivider && { mt: 'auto' }),
                }}
              >
                <ListItemButton
                  sx={{
                    justifyContent: !sidebarExpand ? 'center' : 'flex-start',
                    minHeight: 32,
                    width: !sidebarExpand ? '32px' : '100%',
                    height: !sidebarExpand ? '32px' : '32px',
                    px: '4px',
                    py: 0,
                    mt: '4px',
                    gap: '4px',
                    borderRadius: '2px',
                    backgroundColor:
                      item.matchLink === trimmedPathname(1) ? '#FFFFFF33' : '',
                    '&:hover': {
                      backgroundColor: '#FFFFFF33',
                    },
                    transition: 'all 0.3s ease-in-out',
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
                    title={item.name}
                    placement='right-end'
                    slotProps={{
                      tooltip: {
                        sx: {
                          backgroundColor: '#fff',
                          color: 'rgba(0, 0, 0, 0.87)',
                          boxShadow: 2,
                          borderRadius: '4px',
                        },
                      },
                      popper: {
                        modifiers: [
                          {
                            name: 'offset',
                            options: {
                              offset: [30, -40],
                            },
                          },
                        ],
                      },
                    }}
                  >
                    <ListItemIcon
                      sx={{
                        minWidth: '32px',
                        height: '26px',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <item.icon
                        alt='menu-icon'
                        className='h-[16px]'
                      />
                    </ListItemIcon>
                  </Tooltip>
                  {sidebarExpand && (
                    <ListItemText
                      sx={{
                        '& .MuiTypography-root': {
                          fontWeight: 600,
                          fontSize: '13px',
                        },
                      }}
                      primary={item.name}
                    />
                  )}
                </ListItemButton>
              </ListItem>
            );
          })}
        {showAdminSidebar && (
          <ListItem disablePadding sx={{ maxWidth: '170px', mx: 'auto' }}>
            <ListItemButton
              sx={{
                justifyContent: !sidebarExpand ? 'center' : 'flex-start',
                minHeight: 32,
                width: !sidebarExpand ? '32px' : '100%',
                height: !sidebarExpand ? '32px' : '32px',
                px: '4px',
                py: 0,
                mt: 0,
                gap: '4px',
                borderRadius: '2px',
                '&:hover': {
                  backgroundColor: 'transparent',
                },
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: '26px',
                  height: '26px',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <AdministrationIcon alt='menu-icon' className='h-[16px]' />
              </ListItemIcon>
              {sidebarExpand && (
                <ListItemText
                  sx={{
                    '& .MuiTypography-root': {
                      fontWeight: 600,
                      fontSize: '13px',
                    },
                  }}
                  primary='Administration'
                />
              )}
            </ListItemButton>
          </ListItem>
        )}
        {showAdminSidebar &&
          adminNavItems.map((item, index) => (
            <div key={index}>
              <ListItem
                key={index}
                disablePadding
                sx={{ maxWidth: '170px', mx: 'auto', mt: '4px' }}
              >
                <ListItemButton
                  sx={{
                    display:
                      !sidebarExpand && !noItemsOpen && !item.openStatus
                        ? 'none'
                        : 'flex',
                    justifyContent: !sidebarExpand ? 'center' : 'flex-start',
                    minHeight: 32,
                    width: !sidebarExpand ? '32px' : '100%',
                    height: !sidebarExpand ? '32px' : '32px',
                    px: '4px',
                    py: 0,
                    mt: 0,
                    gap: '4px',
                    borderRadius: '2px',
                    backgroundColor: item.openStatus ? '#FFFFFF33' : '',
                    '&:hover': {
                      backgroundColor: '#FFFFFF33',
                    },
                    transition: 'all 0.3s ease-in-out',
                  }}
                  onClick={() => handleToggle(index)}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: '26px',
                      height: '26px',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <item.icon alt='menu-icon' className='h-[16px]' />
                  </ListItemIcon>
                  {sidebarExpand && (
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        width: '100%',
                      }}
                    >
                      <ListItemText
                        sx={{
                          '& .MuiTypography-root': {
                            fontWeight: 600,
                            fontSize: '13px',
                          },
                        }}
                        primary={item.title}
                      />
                      {item.subItemTitle.length > 0 &&
                        (item.openStatus ? (
                          <AdminChevronUpIcon
                            alt='up'
                            className='h-[16px] mr-0.5'
                          />
                        ) : (
                          <AdminChevronDownIcon
                            alt='down'
                            className='h-[16px] mr-0.5'
                          />
                        ))}
                    </Box>
                  )}
                </ListItemButton>
              </ListItem>
              <Collapse in={item.openStatus} timeout='auto' unmountOnExit>
                {item.subItemTitle &&
                  item.subItemTitle.map((subItem, subIndex) => {
                    if (subItem.hide) return null;
                    return (
                      <List
                        key={subIndex}
                        component='div'
                        sx={{
                          fontWeight: 300,
                          fontSize: '13px',
                          maxWidth: '170px',
                          mx: 'auto',
                          mt: '4px',
                        }}
                        disablePadding
                      >
                        <ListItemButton
                          sx={{
                            justifyContent: !sidebarExpand
                              ? 'center'
                              : 'flex-start',
                            mt: 1,
                            minHeight: 40,
                            height: '40px',
                            width: !sidebarExpand ? '40px' : '100%',
                            px: '3px',
                            borderRadius: '2px',
                            '&:hover': {
                              backgroundColor: '#FFFFFF33',
                            },
                          }}
                          onClick={() => navigate(subItem.link)}
                        >
                          <ListItemIcon
                            sx={{
                              minWidth: '26px',
                              height: '26px',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <subItem.icon
                              alt='menu-icon'
                              className='h-[16px]'
                              style={{
                                filter:
                                  !sidebarExpand &&
                                  matchCheck(subItem, trimmedPathname(2))
                                    ? 'brightness(0) saturate(100%) invert(53%) sepia(89%) saturate(1295%) hue-rotate(340deg) brightness(99%) contrast(93%)'
                                    : 'none',
                              }}
                            />
                          </ListItemIcon>
                          {sidebarExpand && (
                            <Box
                              sx={{
                                display: 'flex',
                                justifyContent: 'flex-start',
                                gap: 1,
                                alignItems: 'center',
                                width: '100%',
                              }}
                            >
                              <ListItemText
                                sx={{
                                  flex: 'unset',
                                  '& .MuiTypography-root': {
                                    fontWeight: matchCheck(
                                      subItem,
                                      trimmedPathname(2)
                                    )
                                      ? 400
                                      : 300,
                                    fontSize: '13px',
                                    color: matchCheck(
                                      subItem,
                                      trimmedPathname(2)
                                    )
                                      ? '#F16137'
                                      : '#FFFFFF',
                                  },
                                }}
                                primary={subItem.name}
                              />
                              {matchCheck(subItem, trimmedPathname(2)) && (
                                <AdminSubmenuActiveIcon className='h-[16px] w-[16px] mr-0.5' />
                              )}
                            </Box>
                          )}
                        </ListItemButton>
                      </List>
                    );
                  })}
              </Collapse>
            </div>
          ))}
      </List>
    </Drawer>
  );
};
