import React, { useState } from 'react';
import { SectionHeaderTab, SectionTabPanel } from '../../../../../components';
import { AllPermissions } from '../../../../../common-service';
import SectionHeader from '../../../../../components/details-section/section-header';
import { FinancialIcon } from '../../../../../assets';
import SummayListTable from './summary/summay-list';
import { NewProjectData } from '../../../../types/project';

const AttachmentTabs = [
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

interface ProjectFinancialProps {
  projectDetails: NewProjectData | null;
}

const Financial: React.FC<ProjectFinancialProps> = ({ projectDetails }) => {
  const [appliedFilters, setAppliedFilters] = useState<
    Record<string, string | number | boolean>
  >({});
  const [selectedTab, setSelectedTab] = useState<string>('summary');

  const tabs = [
    { label: 'Summary', value: 'summary' },
    { label: 'Resource Cost', value: 'resource_cost' },
  ];

  return (
    <div className='w-full pt-2 pl-2 pr-4 mb-1'>
      <SectionTabPanel
        tabs={AttachmentTabs}
        filterMenu={[]}
        filterVisibility={false}
        showFilter={false}
        contextKey='project-financial'
        appliedFilters={appliedFilters}
        setAppliedFilters={setAppliedFilters}
        setCurrentPage={() => {}}
        handleFilter={() => {}}
        sortFilterCount={0}
        setSortFilterCount={() => {}}
        showRefresh={false}
      />
      <SectionHeader
        title='Financial Summary'
        titleIcon={
          <FinancialIcon
            alt='financial-header-icon'
            className='w-7 h-7 p-1.5 bg-[#D2E6FF] rounded-full'
          />
        }
        buttons={[]}
      />
      <SectionHeaderTab
        tabs={tabs}
        onTabChange={setSelectedTab}
        defaultValue='summary'
      />

      <div className='border border-t-0 border-[#CBD6E2] p-3'>
        {selectedTab === 'summary' && (
          <SummayListTable projectDetails={projectDetails} />
        )}
        {selectedTab === 'resource_cost' && (
          <div>Resource Cost content goes here</div>
        )}
      </div>
    </div>
  );
};

export default Financial;
