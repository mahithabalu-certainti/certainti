import { useSearchParams } from 'react-router-dom';
import {  ComingSoon, ManageGroupIcon, SettingIcon } from '../../../../../assets';
import { Settings } from './settings';
import { SectionTabPanel } from '../../../../../components';
import React, { useRef, useState } from 'react';
import { ResourceTabs } from '../resources/resources';
import { AllModules, AllPermissions } from '../../../../../common-service';
import Users from './users/users';
import SectionHeader from '../../../../../components/details-section/section-header';
import { clearFilters } from '../../components/filter/utils';
import {
  getAssignGroupsFilterFields,
  getAssignUserFilterFields,
} from './helper';
import { RootState } from '../../../../../store/store';
import { useSelector } from 'react-redux';
import { checkPermission } from '../../../../../common-utils';
import JurisdictionSetting from './jurisdiction/setting';
import { ActivityDropdownItem, colorCode } from '../../../../types';
interface ConfigurationProps {
  countryId: string | null;
  activityMenuItems: ActivityDropdownItem[];
}
const ConfigTabs: ResourceTabs[] = [
  {
    id: AllPermissions.ACCOUNT_ATTACHMENT_OVERVIEW,
    name: 'Overview',
    hide: false,
  },
  // {
  //   id: AllPermissions.ACCOUNT_ATTACHMENT_TIMELINE,
  //   name: 'Timeline',
  //   hide: false,
  //   disable: true,
  // },
];

const Configuration: React.FC<ConfigurationProps> = ({
  countryId,
  activityMenuItems,
}) => {
  const [searchParams] = useSearchParams();
  const [isFormSaving, setIsFormSaving] = useState<boolean>(false);
  const [isSaveDisable, setIsSaveDisable] = useState<boolean>(false);
  const formRef = useRef<HTMLFormElement>(null);
  const [appliedFilters, setAppliedFilters] = useState<
    Record<string, string | number | boolean | string[]>
  >({});
  const [showFilter, setShowFilter] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [reFetchData, setReFetchData] = useState<number>(Date.now());
  const [count, setCount] = useState<number>(0);
  const [columnAnchorEl, setColumnAnchorEl] =
    React.useState<HTMLButtonElement | null>(null);
  const [seachText, setSearchText] = useState('');
  const [resetSearch, setResetSearch] = useState(false);

  const list = searchParams.get('subMenu');
  const tabParam = searchParams.get('tab');

  const { permission, modules } = useSelector(
    (state: RootState) => state.permission
  );

  const accessPageIsEnable = checkPermission(
    modules,
    AllModules.MANAGE_ACCOUNT_ACCESS
  );
  const accessPageViewEnable = checkPermission(
    permission,
    AllPermissions.MANAGE_ACCOUNT_ACCESS_VIEW_EDIT
  );

  const handleSubmit = () => {
    formRef.current?.requestSubmit();
  };

  const handleResetTabChange = () => {
    setCount(0);
    setAppliedFilters({});
    clearFilters(`account-settings-${tabParam}`);
    setSearchText('');
    setResetSearch(true);
  };

  const handleColumnVisibility = (
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    setColumnAnchorEl(event.currentTarget);
  };

  const renderContent = () => {
    switch (list) {
      case 'users':
        return (
          <Users
            reFetchData={reFetchData}
            handleReset={handleResetTabChange}
            setCount={setCount}
            filterParams={{
              page: currentPage,
              filters: appliedFilters,
              limit: 100,
              entity_type: '',
            }}
            setColumnAnchorEl={setColumnAnchorEl}
            columnAnchorEl={columnAnchorEl}
            searchValue={seachText}
          />
        );
      case 'settings':
        return (
          <Settings
            formRef={formRef}
            setIsFormSaving={setIsFormSaving}
            setIsSaveDisable={setIsSaveDisable}
          />
        );
      case 'jurisdiction_configuration':
        return (
          <JurisdictionSetting
            countryId={countryId}
            activityMenuItems={activityMenuItems}
          />
        );
      default:
        return (
          <div className='flex items-center justify-center h-full'>
            <ComingSoon alt='comingSoon' />
          </div>
        );
    }
  };

  const getTitleIcon = () => {
    switch (list) {
      case 'users':
        return (
          <ManageGroupIcon
            alt='resource header icon'
            className={`[&>path]:stroke-[${colorCode.accountTextColor}] w-[14px] h-[14px]`}
          />
        );
      case 'settings':
        return (
          <SettingIcon
            alt='settings-header-icon'
            className={`[&>path]:stroke-[${colorCode.accountTextColor}] w-[14px] h-[14px]`}
          />
        );
      default:
        return null;
    }
  };

  const headerButtons = [
    {
      label: 'Save',
      variant: 'contained' as const,
      onClick: () => handleSubmit(),
      hide: list === 'users',
      disabled: isSaveDisable,
      loading: isFormSaving,
    },
    {
      label: 'Show/Hide Fields',
      variant: 'outlined' as const,
      disabled: false,
      onClick: handleColumnVisibility,
      sx: { width: '125px', minWidth: '125px' },
      hide: list !== 'users',
    },
  ];

  const handleFilter = () => {
    setShowFilter(!showFilter);
  };

  const onRefreshClick = () => {
    setReFetchData(Date.now());
  };

  const handleSearchReset = () => {
    setResetSearch(false);
  };

  const filterFields =
    tabParam === 'assign_users'
      ? getAssignUserFilterFields()
      : getAssignGroupsFilterFields();

  const hideSection =
    list === 'users' ? !accessPageIsEnable || !accessPageViewEnable : false;

  return (
    <div className='flex flex-col w-full pt-2 pl-2 pr-4'>
      {list !== 'jurisdiction_configuration' && (
        <div>
          <SectionTabPanel
            tabs={ConfigTabs}
            filterMenu={filterFields}
            filterVisibility={list !== 'settings'}
            showFilter={showFilter}
            contextKey={`account-settings-${tabParam}`}
            appliedFilters={appliedFilters}
            setAppliedFilters={setAppliedFilters}
            setCurrentPage={setCurrentPage}
            handleFilter={handleFilter}
            handleSorting={() => {}}
            sortFilterCount={0}
            setSortFilterCount={() => {}}
            showRefresh={list !== 'settings'}
            onRefreshClick={onRefreshClick}
            hideTabPanel={hideSection}
            showSearch={list === 'users' ? true : false}
            searchDisabled={false}
            searchPlaceholder='Search'
            onSearch={(text) => setSearchText(text)}
            searchReset={resetSearch}
            onSearchReset={handleSearchReset}
            showAddActivity={true}
            activityMenuItems={activityMenuItems}
          />
          <SectionHeader
            title={list ? list.charAt(0).toUpperCase() + list.slice(1) : ''}
            titleIcon={getTitleIcon()}
            buttons={headerButtons}
            count={count}
            showItemCount={list !== 'settings'}
            hideSection={hideSection}
             iconBg={colorCode.accountBgColor}
              bgType='circle'
          />
        </div>
      )}
      {renderContent()}
    </div>
  );
};

export default Configuration;
