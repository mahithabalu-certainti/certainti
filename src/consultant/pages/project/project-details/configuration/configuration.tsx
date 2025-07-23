import { useSearchParams } from 'react-router-dom';
import {
  ComingSoon,
  RealatedListDetailsIcon,
  ResourceProfileIcon,
} from '../../../../../assets';
import { Settings } from './settings';
import { SectionTabPanel } from '../../../../../components';
import { useRef } from 'react';
import { AllPermissions } from '../../../../../common-service';
import { ResourceTabs } from '../../../account-details-sidebar/sidebar-pages/resources/resources';
import { Users } from './users';
import ResourceTableHeader from '../../../account-details-sidebar/sidebar-pages/resources/resource-table-header';

interface ConfigurationProps {
  projectID: string;
  accountID: string;
  projectFiscalRid: string;
  projectDetails?: ProjectDetailsType;
  refetchProjectDetails: () => void;
}

interface ProjectDetailsType {
  account_rid: string;
  projectFiscalRid: string;
  projectID: string;
  autosend_interaction: boolean;
  blended_rate_fte: string;
  blended_rate_subcon: string;
  auto_access_rd: boolean;
  max_ai_interactions: number;
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
  projectID,
  accountID,
  projectFiscalRid,
  projectDetails,
  refetchProjectDetails,
}) => {
  const settingsFormRef = useRef<{
    submitForm: () => void;
    resetForm: () => void;
  }>(null);
  const [searchParams] = useSearchParams();
  // const navigate = useNavigate();
  const list = searchParams.get('subMenu');

  const settingProps = {
    account_rid: accountID,
    project_rid: projectID,
    project_fiscal_rid: projectFiscalRid,
    auto_access_rd: projectDetails?.auto_access_rd,
    autosend_interaction: projectDetails?.autosend_interaction,
    blended_rate_fte: projectDetails?.blended_rate_fte,
    blended_rate_subcon: projectDetails?.blended_rate_subcon,
    max_ai_interactions: projectDetails?.max_ai_interactions,
  };
  const renderContent = () => {
    switch (list) {
      case 'users':
        return <Users />;
      case 'settings':
        return (
          <Settings
            ref={settingsFormRef}
            projectDetails={settingProps}
            refetchProjectDetails={refetchProjectDetails}
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
          contextKey='project-settings'
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
