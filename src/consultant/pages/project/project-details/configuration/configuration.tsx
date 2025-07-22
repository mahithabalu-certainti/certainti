import { useSearchParams } from 'react-router-dom';
import {
  ComingSoon,
  RealatedListDetailsIcon,
  ResourceProfileIcon,
} from '../../../../../assets';
import { Settings } from './settings';
import { SectionTabPanel } from '../../../../../components';
import { useState } from 'react';
import { AllPermissions } from '../../../../../common-service';
import { ResourceTabs } from '../../../account-details-sidebar/sidebar-pages/resources/resources';
import { Users } from './users';
import ResourceTableHeader from '../../../account-details-sidebar/sidebar-pages/resources/resource-table-header';

const AttachmentTabs: ResourceTabs[] = [
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
  const [showFilter, setShowFilter] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState<
    Record<string, string | number | boolean>
  >({});
  const [sortFilterCount, setSortFilterCount] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(0);
  console.log(currentPage);
  const handleFilter = () => setShowFilter(!showFilter);
  const [searchParams] = useSearchParams();
  const list = searchParams.get('subMenu');

  const renderContent = () => {
    switch (list) {
      case 'users':
        return <Users />;
      case 'settings':
        return <Settings />;
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
        return <RealatedListDetailsIcon alt='settings-header-icon' />;
      default:
        return null;
    }
  };

  const headerButtons = [
    {
      label: 'Cancel',
      variant: 'outlined' as 'outlined',
      onClick: () => {
        // settingsFormRef?.current?.resetForm();
      },
      hide: false,
      disabled: false,
    },
    {
      label: 'Save',
      variant: 'contained' as 'contained',
      onClick: () => {
        // settingsFormRef?.current?.submitForm();
      },
      hide: false,
      disabled: false,
    },
  ];

  return (
    <div className='flex flex-col h-full w-full p-2'>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          width: '100%',
        }}
      >
        <SectionTabPanel
          tabs={AttachmentTabs}
          filterVisibility={false}
          showFilter={showFilter}
          contextKey='account-settings'
          appliedFilters={appliedFilters}
          setAppliedFilters={setAppliedFilters}
          setCurrentPage={setCurrentPage}
          handleFilter={handleFilter}
          sortFilterCount={sortFilterCount}
          setSortFilterCount={setSortFilterCount}
        />
      </div>
      <ResourceTableHeader
        value={list?.toString() || ''}
        title={list ? list.charAt(0).toUpperCase() + list.slice(1) : ''}
        showCount={false}
        titleIcon={getTitleIcon()}
        headerButtons={headerButtons}
      />
      {renderContent()}
    </div>
  );
};

export default Configuration;
