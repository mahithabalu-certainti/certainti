import * as React from 'react';
import { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar, Sidebar } from '../';
import { chevronLeftIcon } from '../../assets';
import { useSelector } from 'react-redux';
import { RootState } from '../../store/store';
import { UserRoles } from '../../common-service';

export const AppLayout: React.FC = () => {
  const userData = useSelector((state: RootState) => state.auth);
  const [mobileView, setMobileView] = useState<boolean>(false);
  const [sidebarExpand, setSidebarExpand] = useState<boolean>(() => {
    const isAdmin = userData?.role === UserRoles.Admin;
    if (isAdmin) return true;
    const saved = localStorage.getItem('sidebarExpand');
    return saved ? JSON.parse(saved) : true;
  });
  const [showAdminSidebar, setShowAdminSidebar] = useState<boolean>(false);

  useEffect(() => {
    setShowAdminSidebar(userData?.role === UserRoles.Admin);
  }, [userData.role]);

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

  return (
    <div className='flex overflow-x-hidden'>
      <Sidebar
        showAdminSidebar={showAdminSidebar}
        sidebarExpand={sidebarExpand}
        mobileView={mobileView}
      />

      {/* Expand/collapse button */}
      {!showAdminSidebar && (
        <button
          className={`fixed cursor-pointer bg-white z-[1300] transform -translate-x-1/2 top-[70px] shadow-md shadow-[#4242429c] rounded-[2px] p-[4px]${sidebarExpand ? ' left-[260px]' : ' left-[80px]'}`}
          onClick={() => {
            const newState = !sidebarExpand;
            setSidebarExpand(newState);
            localStorage.setItem('sidebarExpand', JSON.stringify(newState));
          }}
        >
          <img
            src={chevronLeftIcon}
            alt='rightNav'
            className={`transition-transform ${sidebarExpand ? 'rotate-180' : ''}`}
          />
        </button>
      )}

      {/* Body Content */}
      <div
        className={`flex-1 ${!mobileView && sidebarExpand ? 'ml-[260px]' : !mobileView ? 'ml-[80px]' : 'ml-0'}`}
      >
        <Navbar />
        <div
          className={
            sidebarExpand
              ? 'max-w-[calc(100vw-260px)]'
              : 'max-w-[calc(100vw-80px)]'
          }
        >
          <Outlet />
        </div>
      </div>
    </div>
  );
};
