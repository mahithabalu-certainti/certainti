import * as React from 'react';
import { useEffect, useState, useRef } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Navbar, Sidebar } from '../';
import { MAIN_ROUTE, ADMIN } from '../../routes';
import { accountNavItems } from '../sidebar/accounts-menu';
import { useSelector } from 'react-redux';
import { RootState } from '../../store/store';
import { sideNavAdminItems } from '../sidebar/admin-menus';
import { useWebSocket } from '../../hooks/use-websocket';
import { useServiceWorkerPush } from '../../hooks/use-service-worker-push';
import Footer from '../Footer';

export const AppLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isManualToggleRef = useRef(false);
  const [mobileView, setMobileView] = useState<boolean>(false);
  const [sidebarExpand, setSidebarExpand] = useState<boolean>(() => {
    const saved = localStorage.getItem('sidebarExpand');
    return saved ? JSON.parse(saved) : true;
  });
  const [showAdminSidebar, setShowAdminSidebar] = useState<boolean>(false);
  const { menus } = useSelector((state: RootState) => state.permission);

  // Initialize WebSocket connection for authenticated users
  useWebSocket();

  // Initialize Service Worker for push notifications
  const { requestPermission, subscribe, permission } = useServiceWorkerPush();

  // Request notification permission after login
  useEffect(() => {
    // Check if we've already asked in this session
    const hasAskedThisSession = sessionStorage.getItem(
      'notification_permission_asked'
    );

    if (permission === 'default' && !hasAskedThisSession) {
      const timer = setTimeout(async () => {
        sessionStorage.setItem('notification_permission_asked', 'true');

        const hasPermission = await requestPermission();
        if (hasPermission) {
          await subscribe();
        }
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, [permission, requestPermission, subscribe]);

  useEffect(() => {
    const showAdminSidebarLocalStorage =
      localStorage.getItem('showAdminSidebar');
    if (showAdminSidebarLocalStorage) {
      setShowAdminSidebar(JSON.parse(showAdminSidebarLocalStorage));
    }
  }, []);

  // This ensures sidebar/navbar menus are consistent when navigating via browser back/forward buttons
  useEffect(() => {
    // Skip synchronization if this was a manual toggle
    if (isManualToggleRef.current) {
      isManualToggleRef.current = false;
      return;
    }

    const isAdminRoute = location.pathname.startsWith(ADMIN);

    // Only update if there's a mismatch between the route and the sidebar state
    if (isAdminRoute !== showAdminSidebar) {
      setShowAdminSidebar(isAdminRoute);
      localStorage.setItem('showAdminSidebar', JSON.stringify(isAdminRoute));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  useEffect(() => {
    const handleResize = () => {
      setMobileView(window.innerWidth < 768);
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const switchSideBarMenus = React.useCallback(() => {
    isManualToggleRef.current = true;

    setShowAdminSidebar((prev) => !prev);
    localStorage.setItem('showAdminSidebar', JSON.stringify(!showAdminSidebar));
    const intendedRoute = showAdminSidebar
      ? checkConsultantRoute()?.link
      : checkDefaultAdminRoute();
    navigate(intendedRoute || MAIN_ROUTE);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showAdminSidebar]);

  const checkConsultantRoute = () => {
    return accountNavItems.find(
      (menu) =>
        !menu.noRedirect &&
        menus.find((item) => item.name === menu.id)?.is_enabled
    );
  };

  const checkDefaultAdminRoute = () => {
    for (const section of sideNavAdminItems) {
      for (const item of section.subItemTitle) {
        const menuStatus = menus.find((menu) => menu.name === item.id);
        if (menuStatus?.is_enabled && !item.noRedirect) {
          return item.link;
        }
      }
    }
    return null;
  };

  const handleSidebarToggle = React.useCallback(() => {
    const newState = !sidebarExpand;
    setSidebarExpand(newState);
    localStorage.setItem('sidebarExpand', JSON.stringify(newState));
  }, [sidebarExpand]);

  return (
    <div className='flex h-screen overflow-x-hidden'>
      <Sidebar
        showAdminSidebar={showAdminSidebar}
        sidebarExpand={sidebarExpand}
        mobileView={mobileView}
      />

      {/* Expand/collapse button */}
      {/* <button
        className={`fixed cursor-pointer bg-white z-[1300] transform -translate-x-1/2 top-[62px] shadow-md shadow-[#4242429c] rounded-[2px] p-[4px]
    transition-all ease-in-out 
    ${sidebarExpand ? 'left-[240px] duration-400' : 'left-[74px] duration-300'}`}
        onClick={() => {
          const newState = !sidebarExpand;
          setSidebarExpand(newState);
          localStorage.setItem('sidebarExpand', JSON.stringify(newState));
        }}
      >
        <img
          src={chevronLeftIcon}
          alt='rightNav'
          className={`transition-transform duration-300 ease-in-out ${sidebarExpand ? 'rotate-180' : ''}`}
        />
      </button> */}

      {/* Body Content */}
      <div
        className={`flex flex-col flex-1 transition-all ease-in-out ${
          !mobileView && sidebarExpand
            ? 'ml-[200px] duration-500'
            : !mobileView
              ? 'ml-[65px] duration-300'
              : 'ml-0'
        }`}
      >
        <Navbar
          handleSidebarToggle={handleSidebarToggle}
          switchSideBarMenus={switchSideBarMenus}
          showAdminSidebar={showAdminSidebar}
        />
        <div
          className={`flex-1 overflow-y-auto transition-all ease-in-out ${
            sidebarExpand
              ? 'max-w-[calc(100vw-200px)] duration-500'
              : 'max-w-[calc(100vw-65px)] duration-300'
          }`}
        >
          <Outlet />
        </div>
        <Footer />
      </div>
    </div>
  );
};
