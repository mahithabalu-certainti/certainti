import { useSearchParams } from 'react-router-dom';
import {
  ComingSoon,
  RealatedListDetailsIcon,
  ResourceProfileIcon,
} from '../../../../../assets';
import { Settings } from './settings';
import { SectionTabPanel } from '../../../../../components';
import { useRef, useState } from 'react';
import { AllPermissions } from '../../../../../common-service';
import { ResourceTabs } from '../../../account-details-sidebar/sidebar-pages/resources/resources';
import { Users } from './users';
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

  return (
    <div className='flex flex-col w-full pt-2 pl-2 pr-4'>
      <SectionTabPanel
        tabs={AttachmentTabs}
        filterVisibility={false}
        showFilter={false}
        contextKey='project-settings'
        appliedFilters={{}}
        setAppliedFilters={() => {}}
        setCurrentPage={() => {}}
        handleFilter={() => {}}
        sortFilterCount={0}
        setSortFilterCount={() => {}}
      />
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
