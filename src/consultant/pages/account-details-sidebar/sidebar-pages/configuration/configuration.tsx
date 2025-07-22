import { useSearchParams } from 'react-router-dom';
import {
  ComingSoon,
  RealatedListDetailsIcon,
  ResourceProfileIcon,
} from '../../../../../assets';
import { Settings } from './settings';
import ResourceTableHeader from '../resources/resource-table-header';
import { SectionTabPanel } from '../../../../../components';
import { useRef } from 'react';
import { ResourceTabs } from '../resources/resources';
import { AllPermissions } from '../../../../../common-service';
import Users from './users/users';

interface ConfigurationProps {
  accountDetails: {
    account_id: string;
    account_rid: string;
    account_name: string;
  };
}

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

const Configuration: React.FC<ConfigurationProps> = ({ accountDetails }) => {
  const settingsFormRef = useRef<{
    submitForm: () => void;
    resetForm: () => void;
  }>(null);

  const [searchParams] = useSearchParams();
  const list = searchParams.get('subMenu');

  const renderContent = () => {
    switch (list) {
      case 'users':
        return <Users />;
      case 'settings':
        return (
          <Settings ref={settingsFormRef} accountDetails={accountDetails} />
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
        settingsFormRef?.current?.resetForm();
      },
      hide: false,
      disabled: false,
    },
    {
      label: 'Save',
      variant: 'contained' as 'contained',
      onClick: () => {
        settingsFormRef?.current?.submitForm();
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
          showFilter={false}
          contextKey='account-settings'
          appliedFilters={{}}
          setAppliedFilters={() => {}}
          setCurrentPage={() => {}}
          handleFilter={() => {}}
          sortFilterCount={0}
          setSortFilterCount={() => {}}
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
