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
import { AdminNavItem, INavItem, SideBarProps } from '../../consultant/types';
import { useAuthHook } from '../../hooks/use-auth';
import {
  ACCOUNT,
  ADMIN_MANAGE_USER,
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

const sideNavItems: INavItem[] = [
  {
    icon: dashboardIcon,
    name: 'Dashboard',
    link: MAIN_ROUTE,
    type: 'link',
  },
  {
    icon: accountsIcon,
    name: 'Accounts',
    link: ACCOUNT,
    type: 'link',
  },
  {
    icon: projectsIcon,
    name: 'Projects',
    link: MAIN_ROUTE,
    type: 'link',
  },
  {
    icon: timesheetIcon,
    name: 'Timeline',
    link: MAIN_ROUTE,
    type: 'link',
  },
  {
    icon: caseIcon,
    name: 'Cases',
    link: MAIN_ROUTE,
    type: 'link',
  },
  {
    icon: surveyIcon,
    name: 'Survey',
    link: MAIN_ROUTE,
    type: 'link',
  },
  {
    icon: notesIcon,
    name: 'Notes',
    link: MAIN_ROUTE,
    type: 'link',
  },
  {
    icon: attachmentIcon,
    name: 'Attachments',
    link: MAIN_ROUTE,
    type: 'link',
  },
  {
    icon: '',
    name: '',
    link: '',
    type: 'divider',
  },
  {
    icon: helpIcon,
    name: 'Help',
    link: MAIN_ROUTE,
    type: 'link',
  },
  {
    icon: settingsIcon,
    name: 'Settings',
    link: MAIN_ROUTE,
    type: 'link',
  },
  {
    icon: logoutIcon,
    name: 'Logout',
    link: MAIN_ROUTE,
    type: 'link',
  },
];

const sideNavAdminItems: AdminNavItem[] = [
  {
    title: 'Admin Permission',
    icon: adminPermissionIcon,
    openStatus: false,
    subItemTitle: [
      { name: 'Manage User', link: ADMIN_MANAGE_USER },
      { name: 'Manage Profile', link: MANAGE_PROFILE },
      { name: 'Manage User Group', link: MANAGE_USER_GROUP },
      { name: 'Manage User Access', link: MANAGE_USER_ACCESS },
    ],
  },
  {
    title: 'Configure Settings',
    icon: configureSettingIcon,
    openStatus: false,
    subItemTitle: [
      { name: 'Manage Settings', link: MANAGE_SETTINGS },
      { name: 'Manage Geo-Based Rule', link: MANAGE_GEO_BASED_RULE },
    ],
  },
  {
    title: 'Admin Template',
    icon: adminTemplateIcon,
    openStatus: false,
    subItemTitle: [
      { name: 'Import templates', link: IMPORT_TEMPLATES },
      { name: 'Interaction templates', link: INTERACTION_TEMPLATES },
      { name: 'Email templates', link: EMAIL_TEMPLATES },
      { name: 'Survey templates', link: TASK_TEMPLATES },
      { name: 'Task templates', link: TASK_TEMPLATES },
      { name: 'Checklist templates', link: CHECKLIST_TEMPLATES },
    ],
  },
];

export const Sidebar: React.FC<SideBarProps> = ({
  showAdminSidebar,
  mobileView,
  sidebarExpand,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuthHook();
  const [adminNavItems, setAdminNavItems] =
    useState<AdminNavItem[]>(sideNavAdminItems);

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
          sideNavItems.map((item, i) => {
            if (item.type === 'divider') {
              return <Divider key={i} />;
            } else
              return (
                <ListItem key={i} disablePadding>
                  <ListItemButton
                    sx={{
                      justifyContent: !sidebarExpand ? 'center' : 'flex-start',
                      minHeight: 48,
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
              {
                <ListItemText
                  sx={{
                    '& .MuiTypography-root': {
                      fontWeight: 600,
                    },
                  }}
                  primary={'Administration'}
                />
              }
            </ListItemButton>
          </ListItem>
        )}
        {showAdminSidebar &&
          adminNavItems.map((item, index) => (
            <>
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
                  {
                    <ListItemText
                      sx={{
                        '& .MuiTypography-root': {
                          fontWeight: 400,
                        },
                      }}
                      primary={item.title}
                    />
                  }
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
                              fontWeight:
                                subItem.link === location.pathname ? 400 : 300,
                              color:
                                subItem.link === location.pathname
                                  ? '#F16137'
                                  : '#FFFFFF',
                            },
                          }}
                          primary={subItem.name}
                        />
                        {subItem.link === location.pathname && (
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
            </>
          ))}
      </List>
    </Drawer>
  );
};
