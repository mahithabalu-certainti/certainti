import { useSearchParams } from 'react-router-dom';
import {
  ComingSoon,
  RealatedListDetailsIcon,
  ResourceProfileIcon,
} from '../../../../../assets';
import { Settings } from './settings';
import { SectionTabPanel } from '../../../../../components';
import { useRef, useState } from 'react';
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

const ConfigTabs: ResourceTabs[] = [
  {
    id: AllPermissions.ACCOUNT_ATTACHMENT_OVERVIEW,
    name: 'Overview',
    hide: false,
  },
  {
    id: AllPermissions.ACCOUNT_ATTACHMENT_TIMELINE,
    name: 'Timeline',
    hide: false,
    disable: true,
  },
];

const Configuration: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [isFormSaving, setIsFormSaving] = useState<boolean>(false);
  const formRef = useRef<HTMLFormElement>(null);
  const [appliedFilters, setAppliedFilters] = useState<
    Record<string, string | number | boolean | string[]>
  >({});
  const [showFilter, setShowFilter] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [sortFilterCount, setSortFilterCount] = useState<number>(0);
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('ASC');
  const [sortField, setSortField] = useState<string>('');
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

  const handleSubmit = () => {
    formRef.current?.requestSubmit();
  };

  const handleResetTabChange = () => {
    setSortField('');
    setCount(0);
    setAppliedFilters({});
    clearFilters(`account-settings-${tabParam}`);
    setSortFilterCount(0);
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
              sortBy: sortField,
              filters: appliedFilters,
              sortOrder,
              limit: 100,
              entity_type: '',
            }}
          />
        );
      case 'settings':
        return <Settings formRef={formRef} setIsFormSaving={setIsFormSaving} />;
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
      disabled: false,
      loading: isFormSaving,
    },
  ];

  const handleFilter = () => {
    setShowFilter(!showFilter);
  };

  const onRefreshClick = () => {
    setReFetchData(Date.now());
  };

  const handleSorting = (sortBy: string, sortOrder: 'asc' | 'desc') => {
    const defaultSortField =
      tabParam === 'assign_users' ? 'first_name' : 'group_name';
    const defaultSortOrder = 'ASC';
    const apiOrder = sortOrder === 'asc' ? 'ASC' : 'DESC';

    if (!sortBy) {
      setSortFilterCount(0);
      setSortOrder(defaultSortOrder);
      setSortField(defaultSortField);
    } else {
      setSortFilterCount(1);
      setSortOrder(apiOrder);
      setSortField(sortBy);
    }
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
        contextKey={`account-settings-${tabParam}`}
        appliedFilters={appliedFilters}
        setAppliedFilters={setAppliedFilters}
        setCurrentPage={setCurrentPage}
        handleFilter={handleFilter}
        handleSorting={handleSorting}
        sortFilterCount={sortFilterCount}
        setSortFilterCount={setSortFilterCount}
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
