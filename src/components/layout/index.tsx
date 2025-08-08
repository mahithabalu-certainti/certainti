import * as React from 'react';
import { useEffect, useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Navbar, Sidebar } from '../';
import { MAIN_ROUTE } from '../../routes';
import { accountNavItems } from '../sidebar/accounts-menu';
import { useSelector } from 'react-redux';
import { RootState } from '../../store/store';
import { sideNavAdminItems } from '../sidebar/admin-menus';

export const AppLayout: React.FC = () => {
  const navigate = useNavigate();
  const [mobileView, setMobileView] = useState<boolean>(false);
  const [sidebarExpand, setSidebarExpand] = useState<boolean>(() => {
    const saved = localStorage.getItem('sidebarExpand');
    return saved ? JSON.parse(saved) : true;
  });
  const [showAdminSidebar, setShowAdminSidebar] = useState<boolean>(false);
  const { menus } = useSelector((state: RootState) => state.permission);

  useEffect(() => {
    const showAdminSidebarLocalStorage =
      localStorage.getItem('showAdminSidebar');
    if (showAdminSidebarLocalStorage) {
      setShowAdminSidebar(JSON.parse(showAdminSidebarLocalStorage));
    }
  }, []);

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
      </div>
    </div>
  );
};
