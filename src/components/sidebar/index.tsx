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
} from '@mui/material';
import { useState, useEffect, Fragment, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  accountsIcon,
  adminChevronDownIcon,
  adminChevronUpIcon,
  administrationIcon,
  adminPermissionIcon,
  adminSubmenuActiveIcon,
  adminTemplateIcon,
  attachmentIcon,
  caseIcon,
  configureSettingIcon,
  dashboardIcon,
  helpIcon,
  logo,
  logoSmall,
  // logoutIcon,
  notesIcon,
  projectsIcon,
  settingsIcon,
  surveyIcon,
  timesheetIcon,
  checklistTemplateIcon,
  emailTemplateIcon,
  importTemplateIcon,
  interactionTemplateIcon,
  manageGeoIcon,
  manageGroupIcon,
  manageProfileIcon,
  manageSettingsIcon,
  manageUserAccessIcon,
  managerUserIcon,
  surveyTemplateIcon,
  taskTemplateIcon,
} from '../../assets';
import {
  AdminNavItem,
  INavItem,
  SideBarProps,
  SubItemTitle,
} from '../../consultant/types';
import { useAuthHook } from '../../hooks/use-auth';
import {
  ACCOUNT,
  ADMIN_MANAGE_USER,
  NOT_FOUND,
  CHECKLIST_TEMPLATES,
  EMAIL_TEMPLATES,
  IMPORT_TEMPLATES,
  INTERACTION_TEMPLATES,
  MAIN_ROUTE,
  MANAGE_GEO_BASED_RULE,
  MANAGE_PROFILE,
  MANAGE_SETTINGS,
  MANAGE_USER_ACCESS,
  MANAGE_USER_GROUP,
  TASK_TEMPLATES,
} from '../../routes';
import { useSelector } from 'react-redux';
import { RootState } from '../../store/store';
import { MenuOption } from '../../common-service';

const accountNavItems: INavItem[] = [
  {
    id: MenuOption.DASHBOARD,
    icon: dashboardIcon,
    name: 'Dashboard',
    link: MAIN_ROUTE,
    type: 'link',
    matchLink: MAIN_ROUTE,
  },
  {
    id: MenuOption.ACCOUNTS,
    icon: accountsIcon,
    name: 'Accounts',
    link: ACCOUNT,
    type: 'link',
    matchLink: ACCOUNT,
  },
  {
    id: MenuOption.PROJECTS,
    icon: projectsIcon,
    name: 'Projects',
    link: NOT_FOUND,
    type: 'link',
    matchLink: '',
  },
  {
    id: MenuOption.TIMESHEET,
    icon: timesheetIcon,
    name: 'Timeline',
    link: NOT_FOUND,
    type: 'link',
    matchLink: '',
  },
  {
    id: MenuOption.CASES,
    icon: caseIcon,
    name: 'Cases',
    link: NOT_FOUND,
    type: 'link',
    matchLink: '',
  },
  {
    id: MenuOption.SURVEY,
    icon: surveyIcon,
    name: 'Survey',
    link: NOT_FOUND,
    type: 'link',
    matchLink: '',
  },
  {
    id: MenuOption.NOTES,
    icon: notesIcon,
    name: 'Notes',
    link: NOT_FOUND,
    type: 'link',
    matchLink: '',
  },
  {
    id: MenuOption.ATTACHMENTS,
    icon: attachmentIcon,
    name: 'Attachments',
    link: NOT_FOUND,
    type: 'link',
    matchLink: '',
  },
  {
    id: '',
    icon: '',
    name: '',
    link: '',
    type: 'divider',
    matchLink: '',
  },
  {
    id: MenuOption.HELP,
    icon: helpIcon,
    name: 'Help',
    link: NOT_FOUND,
    type: 'link',
    matchLink: '',
  },
  {
    id: MenuOption.SETTINGS,
    icon: settingsIcon,
    name: 'Settings',
    link: NOT_FOUND,
    type: 'link',
    matchLink: '',
  },
  // {
  //   icon: logoutIcon,
  //   name: 'Logout',
  //   link: MAIN_ROUTE,
  //   type: 'link',
  //   matchLink: '',
  // },
];

const sideNavAdminItems: AdminNavItem[] = [
  {
    title: 'Admin Permission',
    icon: adminPermissionIcon,
    openStatus: false,
    subItemTitle: [
      {
        id: MenuOption.MANAGE_USER,
        name: 'Manage User',
        icon: managerUserIcon,
        link: ADMIN_MANAGE_USER,
        matchLink: ADMIN_MANAGE_USER,
      },
      {
        id: MenuOption.MANAGE_PROFILE,
        name: 'Manage Profile',
        icon: manageProfileIcon,
        link: MANAGE_PROFILE,
        matchLink: MANAGE_PROFILE,
      },
      {
        id: MenuOption.MANAGE_USER_GROUP,
        name: 'Manage User Group',
        icon: manageGroupIcon,
        link: MANAGE_USER_GROUP,
        matchLink: MANAGE_USER_GROUP,
      },
      {
        id: MenuOption.MANAGE_USER_ACCESS,
        name: 'Manage User Access',
        icon: manageUserAccessIcon,
        link: MANAGE_USER_ACCESS,
        matchLink: MANAGE_USER_ACCESS,
      },
    ],
  },
  {
    title: 'Configure Settings',
    icon: configureSettingIcon,
    openStatus: false,
    subItemTitle: [
      {
        id: MenuOption.MANAGE_SETTINGS,
        name: 'Manage Settings',
        icon: manageSettingsIcon,
        link: MANAGE_SETTINGS,
        matchLink: MANAGE_SETTINGS,
      },
      {
        id: MenuOption.MANAGE_GEO_BASED_RULE,
        name: 'Manage Geo-Based Rule',
        icon: manageGeoIcon,
        link: MANAGE_GEO_BASED_RULE,
        matchLink: MANAGE_GEO_BASED_RULE,
      },
    ],
  },
  {
    title: 'Admin Template',
    icon: adminTemplateIcon,
    openStatus: false,
    subItemTitle: [
      {
        id: MenuOption.IMPORT_TEMPLATE,
        name: 'Import templates',
        icon: importTemplateIcon,
        link: IMPORT_TEMPLATES,
        matchLink: IMPORT_TEMPLATES,
      },
      {
        id: MenuOption.INTERACTION_TEMPLATE,
        name: 'Interaction templates',
        icon: interactionTemplateIcon,
        link: INTERACTION_TEMPLATES,
        matchLink: '',
      },
      {
        id: MenuOption.EMAIL_TEMPLATE,
        name: 'Email templates',
        icon: emailTemplateIcon,
        link: EMAIL_TEMPLATES,
        matchLink: EMAIL_TEMPLATES,
      },
      {
        id: MenuOption.SURVEY_TEMPLATE,
        name: 'Survey templates',
        icon: surveyTemplateIcon,
        link: TASK_TEMPLATES,
        matchLink: TASK_TEMPLATES,
      },
      {
        id: MenuOption.TASK_TEMPLATE,
        name: 'Task templates',
        icon: taskTemplateIcon,
        link: TASK_TEMPLATES,
        matchLink: TASK_TEMPLATES,
      },
      {
        id: MenuOption.CHECKLIST_TEMPLATE,
        name: 'Checklist templates',
        icon: checklistTemplateIcon,
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
          sidebarExpand ? 'w-[240px] duration-400' : 'w-[74px] duration-300'
        }`,
      }}
      sx={{
        '& .MuiDrawer-paper': {
          backgroundColor: 'primary.main',
          color: 'white', // Set text color to white
          transition: (theme) =>
            theme.transitions.create(['width', 'background-color'], {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.standard,
            }),
        },
      }}
    >
      <div className='flex items-center justify-center h-[64px]'>
        <Link aria-label='logo'>
          <img
            src={sidebarExpand ? logo : logoSmall}
            alt='logo'
            className={sidebarExpand ? 'h-[19px]' : 'h-[22px]'}
          />
        </Link>
      </div>

      <List
        sx={{
          mx: !sidebarExpand ? 'auto' : 'none',
          mt: 1,
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
                  maxWidth: '200px',
                  mx: 'auto',
                  ...(isAfterDivider && { mt: 'auto' }),
                }}
              >
                <ListItemButton
                  sx={{
                    justifyContent: !sidebarExpand ? 'center' : 'flex-start',
                    minHeight: 40,
                    width: !sidebarExpand ? '40px' : '100%',
                    height: !sidebarExpand ? '40px' : '40px',
                    px: '3px',
                    mt: '9px',
                    gap: 2,
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
                  <ListItemIcon
                    sx={{
                      minWidth: '40px',
                      height: '40px',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <img src={item.icon} alt='menu-icon' className='h-[18px]' />
                  </ListItemIcon>
                  {sidebarExpand && (
                    <ListItemText
                      sx={{
                        '& .MuiTypography-root': {
                          fontWeight: 500,
                          fontSize: '14px',
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
          <ListItem disablePadding sx={{ maxWidth: '200px', mx: 'auto' }}>
            <ListItemButton
              sx={{
                justifyContent: !sidebarExpand ? 'center' : 'flex-start',
                minHeight: 40,
                width: !sidebarExpand ? '40px' : '100%',
                height: !sidebarExpand ? '40px' : '40px',
                px: '3px',
                mt: 1,
                gap: 2,
                borderRadius: '2px',
                '&:hover': {
                  backgroundColor: 'transparent',
                },
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: '40px',
                  height: '40px',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <img
                  src={administrationIcon}
                  alt='menu-icon'
                  className='h-[18px]'
                />
              </ListItemIcon>
              {sidebarExpand && (
                <ListItemText
                  sx={{
                    '& .MuiTypography-root': {
                      fontWeight: 600,
                      fontSize: '14px',
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
                sx={{ maxWidth: '200px', mx: 'auto' }}
              >
                <ListItemButton
                  sx={{
                    display:
                      !sidebarExpand && !noItemsOpen && !item.openStatus
                        ? 'none'
                        : 'flex',
                    justifyContent: !sidebarExpand ? 'center' : 'flex-start',
                    minHeight: 40,
                    width: !sidebarExpand ? '40px' : '100%',
                    height: !sidebarExpand ? '40px' : '40px',
                    px: '3px',
                    mt: 1,
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
                      minWidth: '40px',
                      height: '40px',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <img src={item.icon} alt='menu-icon' className='h-[18px]' />
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
                            fontWeight: 400,
                            fontSize: '14px',
                          },
                        }}
                        primary={item.title}
                      />
                      {item.subItemTitle.length > 0 &&
                        (item.openStatus ? (
                          <img
                            src={adminChevronUpIcon}
                            alt='down'
                            className='h-[18px] mr-0.5'
                          />
                        ) : (
                          <img
                            src={adminChevronDownIcon}
                            alt='down'
                            className='h-[18px] mr-0.5'
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
                          fontSize: '14px',
                          maxWidth: '200px',
                          mx: 'auto',
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
                              minWidth: '40px',
                              height: '35px',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <img
                              src={subItem.icon}
                              alt='menu-icon'
                              className='h-[18px]'
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
                                    fontSize: '14px',
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
                                <img
                                  src={adminSubmenuActiveIcon}
                                  alt='menu-icon'
                                  className='h-[16px] w-[16px] mr-0.5'
                                />
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
