import React, { useState } from 'react';
import { SectionHeaderTab, SectionTabPanel } from '../../../../../components';
import { AllPermissions } from '../../../../../common-service';
import SectionHeader from '../../../../../components/details-section/section-header';
import { FinancialIcon } from '../../../../../assets';
import SummayListTable from './summary/summay-list';
import ResourceCost from './resource-cost/resource-cost';
import { NewProjectData } from '../../../../types/project';
import { useSearchParams } from 'react-router-dom';

const FinancialTabs = [
  {
    id: AllPermissions.PROJECT_FINANCIAL_OVERVIEW,
    name: 'Overview',
    hide: false,
  },
  {
    id: AllPermissions.PROJECT_FINANCIAL_TIMELINE,
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
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab') || 'summary';

  const tabs = [
    { label: 'Summary', value: 'summary' },
    { label: 'Resource Cost', value: 'resource_cost' },
  ];

  const handleTabChange = (value: string) => {
    searchParams.set('tab', value);
    setSearchParams(searchParams);
  };

  return (
    <div className='w-full pt-2 pl-2 pr-4 mb-1'>
      <SectionTabPanel
        tabs={FinancialTabs}
        filterMenu={[]}
        filterVisibility={tabParam === 'resource_cost'}
        showFilter={tabParam === 'resource_cost'}
        contextKey='project-financial-resource-cost'
        appliedFilters={appliedFilters}
        setAppliedFilters={setAppliedFilters}
        setCurrentPage={() => {}}
        handleFilter={() => {}}
        sortFilterCount={0}
        setSortFilterCount={() => {}}
        showRefresh={tabParam === 'resource_cost'}
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
        onTabChange={handleTabChange}
        defaultValue={tabParam}
      />

      <div
        className={`border border-t-0 border-[#CBD6E2] ${
          tabParam !== 'resource_cost' ? 'p-3' : ''
        }`}
      >
        {tabParam === 'summary' && (
          <SummayListTable projectDetails={projectDetails} />
        )}
        {tabParam === 'resource_cost' && (
          <ResourceCost projectDetails={projectDetails} />
        )}
      </div>
    </div>
  );
};

export default Financial;
