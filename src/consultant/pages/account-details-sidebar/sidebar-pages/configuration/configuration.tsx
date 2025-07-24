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
import { AllPermissions } from '../../../../../common-service';
import Users from './users/users';
import SectionHeader from '../../../../../components/details-section/section-header';

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
  const [searchParams] = useSearchParams();
  const [isFormSaving, setIsFormSaving] = useState<boolean>(false);
  const formRef = useRef<HTMLFormElement>(null);
  // const navigate = useNavigate();
  const list = searchParams.get('subMenu');

  const handleSubmit = () => {
    formRef.current?.requestSubmit();
  };

  const renderContent = () => {
    switch (list) {
      case 'users':
        return <Users />;
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
      onClick: () => handleSubmit(),
      hide: list === 'users',
      disabled: false,
      loading: isFormSaving,
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
