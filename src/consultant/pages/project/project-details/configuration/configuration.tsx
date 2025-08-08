import { useSearchParams } from 'react-router-dom';
import {
  ComingSoon,
  RealatedListDetailsIcon,
  ResourceProfileIcon,
} from '../../../../../assets';
import { Settings } from './settings';
import { SectionTabPanel } from '../../../../../components';
import { useRef, useState } from 'react';
import {
  AllMenus,
  AllModules,
  AllPermissions,
} from '../../../../../common-service';
import { ResourceTabs } from '../../../account-details-sidebar/sidebar-pages/resources/resources';
import { Users } from './users';
import SectionHeader from '../../../../../components/details-section/section-header';
import {
  getAssignGroupsFilterFields,
  getAssignUserFilterFields,
} from './helpers';
import { clearFilters } from '../../../account-details-sidebar/components/filter/utils';
import { checkPermission } from '../../../../../common-utils';
import { useSelector } from 'react-redux';
import { RootState } from '../../../../../store/store';

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
const Configuration: React.FC = () => {
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
  const projectSettingsEnable = checkPermission(
    modules,
    AllMenus.PROJECT_SETTINGS
  );
  console.log('projectSettingsEnable', projectSettingsEnable);
  const handleSubmit = () => {
    formRef.current?.requestSubmit();
  };

  const handleResetTabChange = () => {
    setCount(0);
    setAppliedFilters({});
    clearFilters(`project-settings-${tabParam}`);
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
        return <ResourceProfileIcon alt='users-header-icon' />;
      case 'settings':
        return (
          <RealatedListDetailsIcon
            alt='settings-header-icon'
            className='w-7 h-7'
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
  ];

  const handleFilter = () => {
    setShowFilter(!showFilter);
  };

  const onRefreshClick = () => {
    setReFetchData(Date.now());
  };

  const filterFields =
    tabParam === 'assign_users'
      ? getAssignUserFilterFields()
      : getAssignGroupsFilterFields();

  const hideSection =
    list === 'users' ? !accessPageIsEnable || !accessPageViewEnable : false;

  return (
    <div className='flex flex-col w-full pt-2 pl-2 pr-4'>
      <SectionTabPanel
        tabs={ConfigTabs}
        filterMenu={filterFields}
        filterVisibility={list !== 'settings'}
        showFilter={showFilter}
        contextKey={`project-settings-${tabParam}`}
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
      />
      <SectionHeader
        title={list ? list.charAt(0).toUpperCase() + list.slice(1) : ''}
        titleIcon={getTitleIcon()}
        buttons={headerButtons}
        count={count}
        showItemCount={list !== 'settings'}
        hideSection={hideSection}
      />
      {renderContent()}
    </div>
  );
};

export default Configuration;
