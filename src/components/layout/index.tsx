import * as React from 'react';
import { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar, Sidebar } from '../';
// import { chevronLeftIcon } from '../../assets';
import { useSelector } from 'react-redux';
import { RootState } from '../../store/store';
import { UserRoles } from '../../common-service';

export const AppLayout: React.FC = () => {
  const userData = useSelector((state: RootState) => state.auth);
  const [mobileView, setMobileView] = useState<boolean>(false);
  const [sidebarExpand, setSidebarExpand] = useState<boolean>(() => {
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

  const handleSidebarToggle = () => {
    const newState = !sidebarExpand;
    setSidebarExpand(newState);
    localStorage.setItem('sidebarExpand', JSON.stringify(newState));
  };

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
        <Navbar handleSidebarToggle={handleSidebarToggle} />
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
