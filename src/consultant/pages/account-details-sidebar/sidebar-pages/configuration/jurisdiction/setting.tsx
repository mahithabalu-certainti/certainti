import { useRef, useState } from 'react';

import JurisdictionConfig from './Jurisdiction-Config/Jurisdiction-Config';
import { ResourceTabs } from '../../resources/resources';
import { AllPermissions } from '../../../../../../common-service';
import { SectionTabPanel } from '../../../../../../components';
import SectionHeader from '../../../../../../components/details-section/section-header';
import { ConfigRuleIcon } from '../../../../../../assets';
import { ActivityDropdownItem, ColorCode } from '../../../../../types';
interface JurisdictionSettingProps {
  countryId: string | null;
  activityMenuItems: ActivityDropdownItem[];
}
const SettingsTabs: ResourceTabs[] = [
  {
    id: AllPermissions.ACCOUNT_ATTACHMENT_OVERVIEW, // need to be changed
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

const JurisdictionSetting: React.FC<JurisdictionSettingProps> = ({
  countryId,
  activityMenuItems,
}) => {
  const formRef = useRef<HTMLFormElement>(null);
  const [isFormSaving, setIsFormSaving] = useState<boolean>(false);
  // const [isSaveDisable, setIsSaveDisable] = useState<boolean>(false);
  const handleSubmit = () => {
    formRef.current?.requestSubmit();
  };
  const headerButtons = [
    {
      label: 'Save',
      variant: 'contained' as const,
      onClick: () => handleSubmit(),
      hide: false,
      disabled: false,
      loading: isFormSaving,
    },
  ];
  return (
    <div className='flex flex-col w-full'>
      <SectionTabPanel
        tabs={SettingsTabs}
        filterVisibility={false}
        showFilter={false}
        contextKey={`cases-settings-jurisdiction-configuration`}
        appliedFilters={{}}
        setAppliedFilters={() => {}}
        setCurrentPage={() => {}}
        handleFilter={() => {}}
        handleSorting={() => {}}
        sortFilterCount={0}
        setSortFilterCount={() => {}}
        showRefresh={false}
        onRefreshClick={() => {}}
        hideTabPanel={false}
        showSearch={false}
        searchDisabled={false}
        searchPlaceholder='Search'
        onSearch={() => {}}
        searchReset={false}
        onSearchReset={() => {}}
        showAddActivity={true}
        activityMenuItems={activityMenuItems}
      />
      <SectionHeader
        title={'Jurisdiction Configuration'}
        titleIcon={
          <ConfigRuleIcon
            alt='settings-header-icon'
            className={`[&>path]:stroke-[${ColorCode.accountTextColor}] w-[14px] h-[14px]`}
          />
        }
        buttons={headerButtons}
        iconBg={ColorCode.accountBgColor}
        bgType='circle'
      />
      <JurisdictionConfig
        formRef={formRef}
        setIsFormSaving={setIsFormSaving}
        countryId={countryId}
        // setIsSaveDisable={setIsSaveDisable}
      />
    </div>
  );
};
export default JurisdictionSetting;
