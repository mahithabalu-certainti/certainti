import { useRef, useState } from 'react';
import { DetailsIcon } from '../../../../../assets';
import { AllPermissions } from '../../../../../common-service';
import { SectionTabPanel } from '../../../../../components';
import SectionHeader from '../../../../../components/details-section/section-header';
import { ResourceTabs } from '../../../account-details-sidebar/sidebar-pages/resources/resources';
import JurisdictionConfig from './Jurisdiction-Config/Jurisdiction-Config';

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

const Setting = () => {
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
    <div className='flex flex-col w-full pt-2 pl-2 pr-4'>
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
      />
      <SectionHeader
        title={'Jurisdiction Configuration'}
        titleIcon={
          <DetailsIcon
            alt='settings-header-icon'
            className='[&>path]:stroke-[#294F98] w-[14px] h-[14px]'
          />
        }
        buttons={headerButtons}
        iconBg={'#D7E5FF'}
        bgType='circle'
      />
      <JurisdictionConfig
        formRef={formRef}
        setIsFormSaving={setIsFormSaving}
        // setIsSaveDisable={setIsSaveDisable}
      />
    </div>
  );
};
export default Setting;
