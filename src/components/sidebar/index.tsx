import {
  Collapse,
  Divider,
  Drawer,
  Link,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
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
  logoutIcon,
  notesIcon,
  projectsIcon,
  settingsIcon,
  surveyIcon,
  timesheetIcon,
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
    link: NOT_FOUND,
    type: 'link',
    matchLink: '',
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
    link: MAIN_ROUTE,
    type: 'link',
    matchLink: '',
  },
  {
    icon: settingsIcon,
    name: 'Settings',
    link: MAIN_ROUTE,
    type: 'link',
    matchLink: '',
  },
  {
    icon: logoutIcon,
    name: 'Logout',
    link: MAIN_ROUTE,
    type: 'link',
    matchLink: '',
  },
];

const sideNavAdminItems: AdminNavItem[] = [
  {
    title: 'Admin Permission',
    icon: adminPermissionIcon,
    openStatus: false,
    subItemTitle: [
      {
        name: 'Manage User',
        link: ADMIN_MANAGE_USER,
        matchLink: ADMIN_MANAGE_USER,
      },
      {
        name: 'Manage Profile',
        link: MANAGE_PROFILE,
        matchLink: MANAGE_PROFILE,
      },
      {
        name: 'Manage User Group',
        link: MANAGE_USER_GROUP,
        matchLink: MANAGE_USER_GROUP,
      },
      {
        name: 'Manage User Access',
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
        link: MANAGE_SETTINGS,
        matchLink: MANAGE_SETTINGS,
      },
      {
        name: 'Manage Geo-Based Rule',
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
        link: IMPORT_TEMPLATES,
        matchLink: IMPORT_TEMPLATES,
      },
      {
        name: 'Interaction templates',
        link: INTERACTION_TEMPLATES,
        matchLink: '',
      },
      {
        name: 'Email templates',
        link: EMAIL_TEMPLATES,
        matchLink: EMAIL_TEMPLATES,
      },
      {
        name: 'Survey templates',
        link: TASK_TEMPLATES,
        matchLink: TASK_TEMPLATES,
      },
      {
        name: 'Task templates',
        link: TASK_TEMPLATES,
        matchLink: TASK_TEMPLATES,
      },
      {
        name: 'Checklist templates',
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

  return (
    <Drawer
      variant={mobileView ? 'temporary' : 'persistent'}
      anchor='left'
      open={mobileView ? sidebarExpand : true}
      // onClose={handleBackdropClick}
      classes={{
        paper: `transform transition-all duration-300 ease-in-out ${
          sidebarExpand ? 'w-[260px]' : 'w-[80px]'
        }`,
      }}
      sx={{
        '& .MuiDrawer-paper': {
          backgroundColor: 'primary.main',
          color: 'white', // Set text color to white
        },
      }}
    >
      <div className='flex items-center justify-center h-[68px]'>
        <Link aria-label='logo'>
          <img
            src={sidebarExpand ? logo : logoSmall}
            alt='logo'
            className='h-[20px]'
          />
        </Link>
      </div>

      <List>
        {!showAdminSidebar &&
          accountNavItems.map((item, i) => {
            if (item.type === 'divider') {
              return <Divider key={i} />;
            } else
              return (
                <ListItem key={i} disablePadding>
                  <ListItemButton
                    sx={{
                      justifyContent: !sidebarExpand ? 'center' : 'flex-start',
                      minHeight: 48,
                      backgroundColor:
                        item.matchLink === trimmedPathname(1)
                          ? 'primary.dark'
                          : '',
                      '&:hover': {
                        backgroundColor: 'primary.dark',
                      },
                    }}
                    onClick={() => {
                      if (item.name === 'Logout') {
                        handleLogout();
                      } else {
                        navigate(item.link);
                      }
                    }}
                  >
                    <ListItemIcon sx={{ justifyContent: 'center' }}>
                      <img
                        src={item.icon}
                        alt='menu-icon'
                        className='h-[20px]'
                      />
                    </ListItemIcon>
                    {sidebarExpand && <ListItemText primary={item.name} />}
                  </ListItemButton>
                </ListItem>
              );
          })}
        {showAdminSidebar && (
          <ListItem disablePadding>
            <ListItemButton
              sx={{
                justifyContent: !sidebarExpand ? 'center' : 'flex-start',
                minHeight: 48,
              }}
            >
              <ListItemIcon sx={{ justifyContent: 'center' }}>
                <img
                  src={administrationIcon}
                  alt='menu-icon'
                  className='h-[20px]'
                />
              </ListItemIcon>
              <ListItemText
                sx={{
                  '& .MuiTypography-root': {
                    fontWeight: 600,
                  },
                }}
                primary={'Administration'}
              />
            </ListItemButton>
          </ListItem>
        )}
        {showAdminSidebar &&
          adminNavItems.map((item, index) => (
            <div key={index}>
              <ListItem key={index} disablePadding>
                <ListItemButton
                  sx={{
                    justifyContent: !sidebarExpand ? 'center' : 'flex-start',
                    minHeight: 48,
                    fontSize: '14px',
                  }}
                  onClick={() => handleToggle(index)}
                >
                  <ListItemIcon sx={{ justifyContent: 'center' }}>
                    <img src={item.icon} alt='menu-icon' className='h-[20px]' />
                  </ListItemIcon>
                  <ListItemText
                    sx={{
                      '& .MuiTypography-root': {
                        fontWeight: 400,
                      },
                    }}
                    primary={item.title}
                  />
                  {item.subItemTitle.length > 0 &&
                    (item.openStatus ? (
                      <img src={adminChevronUpIcon} alt='down' />
                    ) : (
                      <img src={adminChevronDownIcon} alt='down' />
                    ))}
                </ListItemButton>
              </ListItem>
              <Collapse in={item.openStatus} timeout='auto' unmountOnExit>
                {item.subItemTitle &&
                  item.subItemTitle.map((subItem, subIndex) => (
                    <List
                      key={subIndex}
                      component='div'
                      sx={{ fontWeight: 300, fontSize: '14px' }}
                      disablePadding
                    >
                      <ListItemButton
                        sx={{ pl: 9 }}
                        onClick={() => navigate(subItem.link)}
                      >
                        <ListItemText
                          sx={{
                            '& .MuiTypography-root': {
                              fontWeight: matchCheck(
                                subItem,
                                trimmedPathname(2)
                              )
                                ? 400
                                : 300,
                              color: matchCheck(subItem, trimmedPathname(2))
                                ? '#F16137'
                                : '#FFFFFF',
                            },
                          }}
                          primary={subItem.name}
                        />
                        {matchCheck(subItem, trimmedPathname(2)) && (
                          <ListItemIcon>
                            <img
                              src={adminSubmenuActiveIcon}
                              alt='menu-icon'
                              className='h-[20px]'
                            />
                          </ListItemIcon>
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
