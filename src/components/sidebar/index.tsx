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
import * as React from 'react';
import { useState } from 'react';
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
  PROJECT,
  SURVEY_TEMPLATES,
} from '../../routes';

const accountNavItems: INavItem[] = [
  {
    icon: dashboardIcon,
    name: 'Dashboard',
    link: MAIN_ROUTE,
    type: 'link',
    matchLink: MAIN_ROUTE,
  },
  {
    icon: accountsIcon,
    name: 'Accounts',
    link: ACCOUNT,
    type: 'link',
    matchLink: ACCOUNT,
  },
  {
    icon: projectsIcon,
    name: 'Projects',
    link: PROJECT,
    type: 'link',
    matchLink: PROJECT,
  },
  {
    icon: timesheetIcon,
    name: 'Timeline',
    link: NOT_FOUND,
    type: 'link',
    matchLink: '',
  },
  {
    icon: caseIcon,
    name: 'Cases',
    link: NOT_FOUND,
    type: 'link',
    matchLink: '',
  },
  {
    icon: surveyIcon,
    name: 'Survey',
    link: NOT_FOUND,
    type: 'link',
    matchLink: '',
  },
  {
    icon: notesIcon,
    name: 'Notes',
    link: NOT_FOUND,
    type: 'link',
    matchLink: '',
  },
  {
    icon: attachmentIcon,
    name: 'Attachments',
    link: NOT_FOUND,
    type: 'link',
    matchLink: '',
  },
  {
    icon: '',
    name: '',
    link: '',
    type: 'divider',
    matchLink: '',
  },
  {
    icon: helpIcon,
    name: 'Help',
    link: NOT_FOUND,
    type: 'link',
    matchLink: '',
  },
  {
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
        name: 'Manage User',
        icon: managerUserIcon,
        link: ADMIN_MANAGE_USER,
        matchLink: ADMIN_MANAGE_USER,
      },
      {
        name: 'Manage Profile',
        icon: manageProfileIcon,
        link: MANAGE_PROFILE,
        matchLink: MANAGE_PROFILE,
      },
      {
        name: 'Manage User Group',
        icon: manageGroupIcon,
        link: MANAGE_USER_GROUP,
        matchLink: MANAGE_USER_GROUP,
      },
      {
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
        name: 'Manage Settings',
        icon: manageSettingsIcon,
        link: MANAGE_SETTINGS,
        matchLink: MANAGE_SETTINGS,
      },
      {
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
        name: 'Import templates',
        icon: importTemplateIcon,
        link: IMPORT_TEMPLATES,
        matchLink: IMPORT_TEMPLATES,
      },
      {
        name: 'Interaction templates',
        icon: interactionTemplateIcon,
        link: INTERACTION_TEMPLATES,
        matchLink: INTERACTION_TEMPLATES,
      },
      {
        name: 'Email templates',
        icon: emailTemplateIcon,
        link: EMAIL_TEMPLATES,
        matchLink: EMAIL_TEMPLATES,
      },
      {
        name: 'Survey templates',
        icon: surveyTemplateIcon,
        link: SURVEY_TEMPLATES,
        matchLink: SURVEY_TEMPLATES,
      },
      {
        name: 'Task templates',
        icon: taskTemplateIcon,
        link: TASK_TEMPLATES,
        matchLink: TASK_TEMPLATES,
      },
      {
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
  const trimmedPathname = (count: number) =>
    '/' + pathname.split('/').filter(Boolean).slice(0, count).join('/');

  const { logout } = useAuthHook();
  const [adminNavItems, setAdminNavItems] = useState<AdminNavItem[]>(
    sideNavAdminItems.map((item) => ({
      ...item,
      openStatus: item.subItemTitle.some((subItem) =>
        matchCheck(subItem, trimmedPathname(2))
      ),
    }))
  );

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
          <img
            src={sidebarExpand ? logo : logoSmall}
            alt='logo'
            className={sidebarExpand ? 'h-[16px]' : 'h-[18px]'}
          />
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
          accountNavItems.map((item, i) => {
            if (item.type === 'divider') {
              return <React.Fragment key={i} />;
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
                      <img
                        src={item.icon}
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
                <img
                  src={administrationIcon}
                  alt='menu-icon'
                  className='h-[16px]'
                />
              </ListItemIcon>
              {sidebarExpand && (
                <ListItemText
                  sx={{
                    '& .MuiTypography-root': {
                      fontWeight: 600,
                      fontSize: '13px',
                    },
                  }}
                  primary={'Administration'}
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
                  <Tooltip
                    title={item.title}
                    placement='bottom-end'
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
                        minWidth: '26px',
                        height: '26px',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <img
                        src={item.icon}
                        alt='menu-icon'
                        className='h-[16px]'
                      />
                    </ListItemIcon>
                  </Tooltip>
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
                          <img
                            src={adminChevronUpIcon}
                            alt='up'
                            className='h-[16px] mr-0.5'
                          />
                        ) : (
                          <img
                            src={adminChevronDownIcon}
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
                  item.subItemTitle.map((subItem, subIndex) => (
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
                          mt: 0,
                          minHeight: 32,
                          height: '32px',
                          width: !sidebarExpand ? '32px' : '100%',
                          gap: '4px',
                          px: '4px',
                          borderRadius: '2px',
                          '&:hover': {
                            backgroundColor: '#FFFFFF33',
                          },
                        }}
                        onClick={() => navigate(subItem.link)}
                      >
                        <Tooltip
                          title={subItem.name}
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
                              minWidth: '26px',
                              height: '26px',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <img
                              src={subItem.icon}
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
                        </Tooltip>
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
                                  color: matchCheck(subItem, trimmedPathname(2))
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
                  ))}
              </Collapse>
            </div>
          ))}
      </List>
    </Drawer>
  );
};
