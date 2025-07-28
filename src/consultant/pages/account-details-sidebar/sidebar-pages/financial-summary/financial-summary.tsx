import { useSearchParams } from 'react-router-dom';
import { AllPermissions } from '../../../../../common-service';
import { SectionHeaderTab, SectionTabPanel } from '../../../../../components';
import { useState } from 'react';
import SectionHeader from '../../../../../components/details-section/section-header';
import { FinancialIcon } from '../../../../../assets';
import { StateWiseSummary, Summary } from './tab';
import { NewProjectData } from '../../../../types/project';
import { getFiscalYears } from '../../../../../common-utils';
import FinancialProjectCost from './tab/project-cost/project-cost';
import FinancialResourceCost from './tab/resource-cost/resource-cost';
import { accountDetailsProps } from '../../../account-details/utils';
// import { clearFilters } from '../../components/filter/utils';

const FinancialTabs = [
  {
    id: AllPermissions.ACCOUNT_FINANCIAL_OVERVIEW,
    name: 'Overview',
    hide: false,
  },
  {
    id: AllPermissions.ACCOUNT_FINANCIAL_TIMELINE,
    name: 'Timeline',
    hide: false,
    disable: true,
  },
];
interface ProjectFinancialProps {
  accountDetails?: accountDetailsProps;
  activeKey?: string;
  projectDetails: NewProjectData | null;
}

const FinancialSummary: React.FC<ProjectFinancialProps> = ({
  accountDetails,
  projectDetails,
}) => {
  const [appliedFilters, setAppliedFilters] = useState<
    Record<string, string | number | boolean>
  >({});
  const [fiscalyear, setFiscalyear] = useState('2025');
  const [searchParams, setSearchParams] = useSearchParams();
  const [reFetchData, setReFetchData] = useState<number>(Date.now());
  // const [count, setCount] = useState<number>(0);

  // const handleResetTabChange = () => {
  //   setCount(0);
  //   setAppliedFilters({});
  //   clearFilters(`account-financial-${tabParam}`);
  // };

  const onRefreshClick = () => {
    setReFetchData(Date.now());
  };

  const handleTabChange = (value: string) => {
    searchParams.set('tab', value);
    setSearchParams(searchParams);
  };
  const tabParam = searchParams.get('tab') || 'summary';
  const headerButtons = [
    {
      label: 'Download',
      variant: 'contained' as const,
      onClick: () => {},
      sx: {
        width: '96px',
        minWidth: '96px',
      },
    },
  ];
  const tabs = [
    { label: 'Summary', value: 'summary' },
    { label: 'State wise Summary', value: 'state_wise_summary' },
    { label: 'Project Cost', value: 'project_cost' },
    { label: 'Resource Cost', value: 'resource_cost' },
  ];

  return (
    <div className='w-full pt-2 pl-2 pr-4 mb-1'>
      {' '}
      <SectionTabPanel
        tabs={FinancialTabs}
        filterMenu={[]}
        contextKey='project-financial-resource-cost'
        appliedFilters={appliedFilters}
        setAppliedFilters={setAppliedFilters}
        setCurrentPage={() => {}}
        handleFilter={() => {}}
        sortFilterCount={0}
        setSortFilterCount={() => {}}
        allYears={getFiscalYears(20)}
        fiscalYearValue={fiscalyear}
        updatedYear={(e) => setFiscalyear(e.target.value)}
        showRefresh={
          tabParam === 'project_cost' || tabParam === 'resource_cost'
        }
        onRefreshClick={onRefreshClick}
        filterVisibility={
          tabParam === 'project_cost' || tabParam === 'resource_cost'
        }
        showFilter={tabParam === 'project_cost' || tabParam === 'resource_cost'}
      />
      <SectionHeader
        title='Financial Summary'
        titleIcon={
          <FinancialIcon
            alt='financial-header-icon'
            className='w-7 h-7 p-1.5 bg-[#ffeae5] rounded-full [&>path]:stroke-[#f16840]'
          />
        }
        buttons={headerButtons}
        // count={count}
      />
      <SectionHeaderTab
        tabs={tabs}
        onTabChange={handleTabChange}
        defaultValue={tabParam}
      />
      <div
        className={`border border-t-0 border-[#CBD6E2] ${
          tabParam === 'summary' || tabParam === 'state_wise_summary'
            ? 'p-3'
            : ''
        }`}
      >
        {tabParam === 'summary' && <Summary projectDetails={projectDetails} />}
        {tabParam === 'state_wise_summary' && (
          <StateWiseSummary projectDetails={projectDetails} />
        )}
        {tabParam === 'project_cost' && (
          <FinancialProjectCost
            fiscalyear={fiscalyear}
            reFetchData={reFetchData}
            // handleReset={handleResetTabChange}
          />
        )}
        {tabParam === 'resource_cost' && (
          <FinancialResourceCost
            accountDetails={accountDetails}
            fiscalyear={fiscalyear}
          />
        )}
      </div>
    </div>
  );
};

export default FinancialSummary;
