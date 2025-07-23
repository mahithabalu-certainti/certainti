import { useSearchParams } from 'react-router-dom';
import {
  ComingSoon,
  RealatedListDetailsIcon,
  ResourceProfileIcon,
} from '../../../../../assets';
import { Settings } from './settings';
import { SectionTabPanel } from '../../../../../components';
import { useRef } from 'react';
import { ResourceTabs } from '../resources/resources';
import { AllPermissions } from '../../../../../common-service';
import Users from './users/users';
import SectionHeader from '../../../../../components/details-section/section-header';
import { AccountDetailsResponse } from '../../../../types';

interface AccountDetailsProps extends AccountDetailsResponse {
  activeKey: string;
}
interface ConfigurationProps {
  accountDetails: AccountDetailsProps;
  refetchAccountDetails: () => void;
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

const Configuration: React.FC<ConfigurationProps> = ({
  accountDetails,
  refetchAccountDetails,
}) => {
  const settingsFormRef = useRef<{
    submitForm: () => void;
    resetForm: () => void;
  }>(null);
  const [searchParams] = useSearchParams();

  const accountSettings = {
    account_rid: accountDetails?.accountById?.rid || '',
    fiscal_start_date: accountDetails?.accountDetails?.fiscal_start_date || '',
    fiscal_end_date: accountDetails?.accountDetails?.fiscal_end_date || '',
    autosend_interaction:
      accountDetails?.accountDetails?.autosend_interaction ?? false,
    blended_rate_fte: accountDetails?.accountDetails?.blended_rate_fte || '',
    blended_rate_subcon:
      accountDetails?.accountDetails?.blended_rate_subcon || '',
    auto_access_rd: accountDetails?.accountDetails?.auto_access_rd ?? false,
    max_ai_interactions:
      accountDetails?.accountDetails?.max_ai_interactions || 0,
  };

  // const navigate = useNavigate();
  const list = searchParams.get('subMenu');

  const renderContent = () => {
    switch (list) {
      case 'users':
        return <Users />;
      case 'settings':
        return (
          <Settings
            ref={settingsFormRef}
            accountDetails={accountSettings}
            refetchAccountDetails={refetchAccountDetails}
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
        return <RealatedListDetailsIcon alt='settings-header-icon' />;
      default:
        return null;
    }
  };

  const headerButtons = [
    // {
    //   label: 'Cancel',
    //   variant: 'outlined' as 'outlined',
    //   onClick: () => {
    //     navigate('/account');
    //   },
    //   hide: false,
    //   disabled: false,
    // },
    {
      label: 'Save',
      variant: 'contained' as const,
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
      <SectionHeader
        title={list ? list.charAt(0).toUpperCase() + list.slice(1) : ''}
        titleIcon={getTitleIcon()}
        buttons={headerButtons}
      />
      {renderContent()}
    </div>
  );
};

export default Configuration;
