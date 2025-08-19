import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AdminSubmenuActiveIcon, ArrowBackIcon, BackIcon } from '../../assets';
import { useSelector } from 'react-redux';
import { RootState } from '../../store/store';
import { MenuItem } from '../../consultant/types';
import { Tooltip } from '@mui/material';

interface SideMenuPanelProps {
  menuItems: MenuItem[];
  activeKey: string;
  onSelect: (key: string) => void;
  headerTitle?: string;
  showBackIcon?: boolean;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

const SideMenuPanel: React.FC<SideMenuPanelProps> = ({
  menuItems,
  activeKey,
  onSelect,
  headerTitle = 'Menu',
  showBackIcon = true,
  isCollapsed,
  onToggleCollapse,
}) => {
  const [accountMenus, setAccountMenus] = useState<MenuItem[]>(menuItems);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [localActiveKey, setLocalActiveKey] = useState(activeKey);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const mainSource = searchParams.get('main_source') || '';
  const isGlobalInteractions = mainSource === 'interactions';

  // Initialize active key from URL parameters on mount
  useEffect(() => {
    const listParam = searchParams.get('list');
    const subMenuParam = searchParams.get('subMenu');

    if (subMenuParam) {
      // If there's a subMenu parameter, that's the active key
      setLocalActiveKey(subMenuParam);
    } else if (listParam) {
      // If only list parameter exists, that's the active key
      setLocalActiveKey(listParam);
    }
  }, []); // Empty dependency array - only run on mount
  const { modules, menus } = useSelector(
    (state: RootState) => state.permission
  );

  useEffect(() => {
    const updateMenuItems = (items: MenuItem[]): MenuItem[] => {
      return items.map((item) => {
        const module = modules.find((module) => module.name === item.id);
        const menu = menus.find((menu) => menu.name === item.id);
        const updatedItem = {
          ...item,
          hide: module ? !module.is_enabled : menu ? !menu.is_enabled : false,
        };
        if (item.subMenu) {
          updatedItem.subMenu = updateMenuItems(item.subMenu);
          const allSubmenusHidden = updatedItem.subMenu.every(
            (subItem) => subItem.hide
          );
          if (allSubmenusHidden) {
            updatedItem.hide = true;
          }
        }
        return updatedItem;
      });
    };
    setAccountMenus(updateMenuItems(menuItems));
  }, [modules, menus, menuItems]);

  useEffect(() => {
    if (!localActiveKey) {
      const findFirstAvailableItem = (items: MenuItem[]): MenuItem | null => {
        for (const item of items) {
          if (!item.hide) {
            if (item.subMenu && item.subMenu.length > 0) {
              const submenuItem = findFirstAvailableItem(item.subMenu);
              if (submenuItem) return submenuItem;
            } else {
              return item;
            }
          }
        }
        return null;
      };
      const activeItem = findFirstAvailableItem(accountMenus);
      if (activeItem) handleSelect(activeItem.key as string);
    }
  }, [accountMenus, localActiveKey]);

  const handleSelect = (key: string, parentKey?: string) => {
    // Don't proceed if clicking the same active key
    if (localActiveKey === key) return;

    setLocalActiveKey(key);
    onSelect(key);

    // Common search params to delete
    searchParams.delete('res_id');
    searchParams.delete('tab');
    searchParams.delete('attachment_entity');
    searchParams.delete('file_id');
    if (!isGlobalInteractions) {
      searchParams.delete('interaction_id');
    }
    searchParams.delete('upload');
    //For project resource and task
    searchParams.delete('page');
    searchParams.delete('pro_res_id');
    searchParams.delete('pro_task_id');

    if (parentKey) {
      // Submenu item - check if navigation is actually needed
      const currentList = searchParams.get('list');
      const currentSubMenu = searchParams.get('subMenu');

      // Only update if the params are actually different
      if (currentList !== parentKey || currentSubMenu !== key) {
        searchParams.set('list', parentKey);
        searchParams.set('subMenu', key);
        navigate({ search: searchParams.toString() }, { replace: true });
      }
    } else {
      // Main menu item
      searchParams.set('list', key);
      searchParams.delete('subMenu');
      navigate({ search: searchParams.toString() }, { replace: true });
    }
  };

  const toggleExpanded = (key: string) => {
    setExpandedItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(key)) newSet.delete(key);
      else newSet.add(key);
      return newSet;
    });
  };

  const getShortName = (name: string): string => {
    const words = name.split(' ').filter(Boolean);
    if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
    return words
      .map((word) => word[0])
      .join('')
      .toUpperCase();
  };

  const isSubmenuActive = (subMenus: MenuItem[]): boolean => {
    return subMenus.some(
      (submenu) =>
        submenu.key === localActiveKey ||
        (submenu.subMenu && isSubmenuActive(submenu.subMenu))
    );
  };

  const findActiveParentKeys = (items: MenuItem[]): string[] => {
    const activeParents: string[] = [];
    const checkItems = (items: MenuItem[]): boolean => {
      return items.some((item) => {
        if (item.hide) return false;
        const isActive = item.key === localActiveKey;
        const hasActiveChild = item.subMenu && checkItems(item.subMenu);
        if (isActive || hasActiveChild) {
          activeParents.push(item.key);
          return true;
        }
        return false;
      });
    };
    checkItems(items);
    return activeParents;
  };

  useEffect(() => {
    const activeParents = findActiveParentKeys(accountMenus);
    if (activeParents.length > 0) {
      setExpandedItems((prev) => {
        const newSet = new Set(prev);
        activeParents.forEach((key) => newSet.add(key));
        return newSet;
      });
    }
  }, [localActiveKey, accountMenus]);

  // Also expand parent items based on URL parameters on initial load
  useEffect(() => {
    const listParam = searchParams.get('list');
    const subMenuParam = searchParams.get('subMenu');

    if (listParam && subMenuParam) {
      // If we have both parameters, expand the parent
      setExpandedItems((prev) => {
        const newSet = new Set(prev);
        newSet.add(listParam);
        return newSet;
      });
    }
  }, [accountMenus]); // Run when accountMenus is ready

  const renderMenuItem = (item: MenuItem): React.ReactNode => {
    if (item.hide) return null;
    const hasSubmenus = item.subMenu && item.subMenu.length > 0;
    const isExpanded = expandedItems.has(item.key);
    const isActive = localActiveKey === item.key;
    const hasActiveSubmenu = hasSubmenus && isSubmenuActive(item.subMenu || []);
    const paddingLeft = isCollapsed ? 'pl-[15px]' : 'pl-[15px]';

    return (
      <React.Fragment key={item.key}>
        <li className='min-h-[32px] mb-1'>
          <button
            onClick={() =>
              hasSubmenus ? toggleExpanded(item.key) : handleSelect(item.key)
            }
            disabled={item.disabled}
            className={`${
              isActive || hasActiveSubmenu ? 'bg-[#0BBFB726] !font-bold' : ''
            } group w-full flex items-center text-[14px] font-semibold gap-2 text-[#2D3E4F]
              text-left hover:bg-[#0BBFB726] ${item.disabled ? 'cursor-not-allowed' : 'cursor-pointer'}
              ${paddingLeft} py-1.5 pr-3 justify-start`}
            style={{
              transition: `background-color 0.3s ease-in-out, padding-left ${
                isCollapsed ? '300ms' : '500ms'
              } ease-in-out`,
            }}
          >
            <Tooltip
              title={isCollapsed ? item.name : ''}
              placement='right'
              arrow
              disableHoverListener={!isCollapsed}
            >
              <span className='flex items-center justify-center w-[22px] h-[22px] flex-shrink-0'>
                {item.icon ? (
                  <span className='flex items-center justify-center w-4 h-4'>
                    <item.icon className='w-4 h-4 text-black' />
                  </span>
                ) : (
                  <span className='uppercase text-[12px]'>
                    {getShortName(item.name)}
                  </span>
                )}
              </span>
            </Tooltip>
            <span
              className='truncate flex-1'
              style={{
                opacity: isCollapsed ? 0 : 1,
                maxWidth: isCollapsed ? 0 : '100%',
                transform: isCollapsed ? 'translateX(-10px)' : 'translateX(0)',
                transition: `opacity ${
                  isCollapsed ? '200ms' : '400ms'
                } ease-in-out ${isCollapsed ? '0ms' : '100ms'}, transform ${
                  isCollapsed ? '200ms' : '400ms'
                } ease-in-out ${isCollapsed ? '0ms' : '100ms'}, max-width ${
                  isCollapsed ? '300ms' : '500ms'
                } ease-in-out`,
              }}
            >
              {item.name}
            </span>
            {!isCollapsed && (
              <AdminSubmenuActiveIcon
                className={`w-[12px] h-[12px] flex-shrink-0 ${
                  isActive
                    ? 'opacity-100'
                    : `opacity-0 ${!hasSubmenus ? 'group-hover:opacity-100' : ''}`
                }`}
                style={{
                  transition: 'opacity 250ms ease-in-out',
                }}
              />
            )}
            {!isCollapsed && hasSubmenus && (
              <div
                className='w-3 h-3 flex-shrink-0'
                style={{
                  transform: isExpanded ? 'rotate(90deg)' : 'rotate(-90deg)',
                  transition: 'transform 300ms ease-in-out',
                }}
              >
                <ArrowBackIcon className='w-3 h-3 flex-shrink-0' />
              </div>
            )}
          </button>
        </li>

        {hasSubmenus && (
          <div
            style={{
              maxHeight: isExpanded
                ? `${(item.subMenu?.length || 1) * 36}px`
                : '0px',
              overflow: 'hidden',
              transition: 'max-height 300ms ease-in-out',
            }}
          >
            {item.subMenu?.map((submenu) => (
              <li
                key={submenu.key}
                className={`${submenu.hide ? 'hidden' : 'block'} min-h-[32px] mb-1`}
              >
                <button
                  onClick={() => handleSelect(submenu.key, item.key)}
                  disabled={submenu.disabled}
                  className={`${
                    localActiveKey === submenu.key
                      ? 'bg-[#0BBFB726] !font-bold'
                      : ''
                  } group w-full flex items-center text-[14px] font-semibold gap-2 text-[#2D3E4F]
        text-left hover:bg-[#0BBFB726] ${
          submenu.disabled ? 'cursor-not-allowed' : 'cursor-pointer'
        } ${isCollapsed ? 'pl-[15px]' : 'pl-9'} py-1.5 pr-3 justify-start`}
                  style={{
                    transition: `background-color 0.3s ease-in-out, padding-left ${
                      isCollapsed ? '300ms' : '500ms'
                    } ease-in-out`,
                  }}
                >
                  <Tooltip
                    title={isCollapsed ? submenu.name : ''}
                    placement='right'
                    arrow
                    disableHoverListener={!isCollapsed}
                  >
                    <span className='flex items-center justify-center w-[22px] h-[22px] flex-shrink-0'>
                      {submenu.icon ? (
                        <span className='flex items-center justify-center w-4 h-4'>
                          <submenu.icon className='w-4 h-4 text-black' />
                        </span>
                      ) : (
                        <span className='uppercase text-[12px]'>
                          {getShortName(submenu.name)}
                        </span>
                      )}
                    </span>
                  </Tooltip>
                  {/* Apply same transition to submenu text */}
                  <span
                    className='truncate flex-1'
                    style={{
                      opacity: isCollapsed ? 0 : 1,
                      maxWidth: isCollapsed ? 0 : '100%',
                      transform: isCollapsed
                        ? 'translateX(-10px)'
                        : 'translateX(0)',
                      transition: `opacity ${
                        isCollapsed ? '200ms' : '400ms'
                      } ease-in-out ${isCollapsed ? '0ms' : '100ms'}, transform ${
                        isCollapsed ? '200ms' : '400ms'
                      } ease-in-out ${isCollapsed ? '0ms' : '100ms'}, max-width ${
                        isCollapsed ? '300ms' : '500ms'
                      } ease-in-out`,
                    }}
                  >
                    {submenu.name}
                  </span>
                  {!isCollapsed && (
                    <AdminSubmenuActiveIcon
                      className={`w-[12px] h-[12px] flex-shrink-0 ${
                        localActiveKey === submenu.key
                          ? 'opacity-100'
                          : 'opacity-0 group-hover:opacity-100'
                      }`}
                      style={{
                        transition: 'opacity 250ms ease-in-out',
                      }}
                    />
                  )}
                </button>
              </li>
            ))}
          </div>
        )}
      </React.Fragment>
    );
  };

  return (
    <div
      className='w-full h-full bg-white border-r border-[#CBD6E2] overflow-hidden'
      style={{
        transition: 'width 500ms cubic-bezier(0.4, 0, 0.2, 1)',
        transitionDuration: isCollapsed ? '300ms' : '500ms',
      }}
    >
      {/* Header */}
      <div
        className={`flex items-center h-[30px] mb-1 ${
          isCollapsed ? 'justify-center' : ''
        } ${isCollapsed ? 'px-3 ml-2' : 'px-[18px]'}`}
      >
        <div
          className={`flex items-center ${
            !isCollapsed ? 'justify-between w-full' : 'gap-0'
          }`}
        >
          <div className='flex items-center'>
            <span
              className='text-[15px] text-[#2D3E4F] font-bold whitespace-nowrap'
              style={{
                opacity: isCollapsed ? 0 : 1,
                transform: isCollapsed ? 'translateX(-10px)' : 'translateX(0)',
                transition:
                  'opacity 300ms ease-in-out, transform 300ms ease-in-out, max-width 400ms ease-in-out',
                transitionDelay: isCollapsed ? '0ms' : '100ms',
                maxWidth: isCollapsed ? 0 : '150px',
                overflow: 'hidden',
              }}
            >
              {headerTitle}
            </span>
            <span
              className='text-[15px] text-[#2D3E4F] font-bold whitespace-nowrap'
              style={{
                marginLeft: isCollapsed ? '5px' : '0',
                opacity: isCollapsed ? 1 : 0,
                maxWidth: isCollapsed ? '150px' : 0,
                overflow: 'hidden',
              }}
            >
              {getShortName(headerTitle)}
            </span>
          </div>
          {showBackIcon && (
            <div
              className='w-[18px] h-[18px] cursor-pointer flex-shrink-0'
              style={{
                transform: `rotate(${isCollapsed ? 180 : 0}deg)`,
                transition: 'transform 300ms ease-in-out',
              }}
              onClick={onToggleCollapse}
            >
              <BackIcon className='w-[18px] h-[18px]' />
            </div>
          )}
        </div>
      </div>

      <ul className='overflow-y-auto'>
        {accountMenus.map((item) => renderMenuItem(item))}
      </ul>
    </div>
  );
};

export default SideMenuPanel;
