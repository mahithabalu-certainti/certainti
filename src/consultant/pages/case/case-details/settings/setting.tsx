import React, { useRef, useState } from 'react';
import { ConfigRuleIcon, SettingsIcon } from '../../../../../assets';
import { AllPermissions, OverviewTabs } from '../../../../../common-service';
import { SectionTabPanel } from '../../../../../components';
import SectionHeader from '../../../../../components/details-section/section-header';
import JurisdictionConfig from './Jurisdiction-Config/Jurisdiction-Config';
import { ActivityDropdownItem, ColorCode } from '../../../../types';
import Timeline from '../../../../../pages/timeline/timeline';
import { useSearchParams } from 'react-router';
import JurisdictionSetting from './jurisdiction-setting/Jurisdiction_setting';

const SettingsTabs: OverviewTabs[] = [
  {
    id: AllPermissions.ACCOUNT_ATTACHMENT_OVERVIEW, // need to be changed
    name: 'Overview',
    hide: false,
    key: 'overview',
  },
  {
    id: AllPermissions.ACCOUNT_ATTACHMENT_TIMELINE,
    name: 'Timeline',
    hide: false,
    // disable: true,
    key: 'timeline',
  },
];

interface SettingProps {
  activityMenuItems: ActivityDropdownItem[];
  isFinancialWorkingSignoff?: boolean;
  isCaseClosed?: boolean;
}

const Setting: React.FC<SettingProps> = ({
  activityMenuItems,
  isFinancialWorkingSignoff,
  isCaseClosed,
}) => {
  const formRef = useRef<HTMLFormElement>(null);
  const [isFormSaving, setIsFormSaving] = useState<boolean>(false);
  // const [isSaveDisable, setIsSaveDisable] = useState<boolean>(false);
  const handleSubmit = () => {
    formRef.current?.requestSubmit();
  };
  const [searchParams] = useSearchParams();
  const isTimeLineView = searchParams.get('timelineview') === 'true';
  const isJurisdictionConfigView =
    searchParams.get('subMenu') === 'jurisdiction_configuration';

  const headerButtons = [
    {
      label: 'Save',
      variant: 'contained' as const,
      onClick: () => handleSubmit(),
      hide: false,
      disabled: isFinancialWorkingSignoff || isCaseClosed,
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
        showAddActivity={true}
        activityMenuItems={activityMenuItems}
      />
      {isTimeLineView ? (
        <div className='border border-[#CBD6E2] rounded-[2px] overflow-auto'>
          <Timeline entitytype='case' />
        </div>
      ) : (
        <>
          <SectionHeader
            title={
              isJurisdictionConfigView
                ? 'Jurisdiction Configuration'
                : 'Settings'
            }
            titleIcon={
              isJurisdictionConfigView ? (
                <ConfigRuleIcon
                  alt='settings-header-icon'
                  className={`[&>path]:stroke-[${ColorCode.accountTextColor}] w-[14px] h-[14px]`}
                />
              ) : (
                <SettingsIcon
                  alt='settings-header-icon'
                  className={`[&>path]:stroke-[${ColorCode.accountTextColor}] w-[14px] h-[14px]`}
                />
              )
            }
            buttons={headerButtons}
            iconBg={ColorCode.caseBgColor}
            bgType='circle'
          />
          {isJurisdictionConfigView ? (
            <JurisdictionConfig
              formRef={formRef}
              setIsFormSaving={setIsFormSaving}
              disabled={isFinancialWorkingSignoff || isCaseClosed}
            />
          ) : (
            <JurisdictionSetting
              formRef={formRef}
              setIsFormSaving={setIsFormSaving}
              disabled={isFinancialWorkingSignoff || isCaseClosed}
            />
          )}
        </>
      )}
    </div>
  );
};
export default Setting;
