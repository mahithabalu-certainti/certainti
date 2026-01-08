import React, { useEffect, useMemo, useState } from 'react';
import { AllPermissions } from '../../../../../common-service';
import { ActivityDropdownItem, CaseDetails } from '../../../../types';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { SectionHeaderTab, SectionTabPanel } from '../../../../../components';
import SectionHeader from '../../../../../components/details-section/section-header';
import { ComingSoon, DetailsIcon } from '../../../../../assets';
import {
  getProjectDocumentsFilterFields,
  getProjectSummaryFilterFields,
  getResourceSummaryFilterFields,
} from './helper';
import { ProjectDocuments } from './tab';
import FinancialWorkingForm from './tab/financial-working/financial-form';

const DossierTabs = [
  {
    id: AllPermissions.DOSSIER_OVERVIEW,
    name: 'Overview',
    hide: false,
  },
  // {
  //   id: AllPermissions.DOSSIER_TIMELINE,
  //   name: 'Timeline',
  //   hide: false,
  //   disable: true,
  // },
];

interface DossierProps {
  activityMenuItems: ActivityDropdownItem[];
  caseDetails?: CaseDetails;
  setDossierFinancialStatus: (status: string) => void;
  dossierFinancialStatus: string;
}

const Dossier: React.FC<DossierProps> = ({
  activityMenuItems,
  caseDetails,
  setDossierFinancialStatus,
  dossierFinancialStatus,
}) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [appliedFilters, setAppliedFilters] = useState<
    Record<string, string | number | boolean | string[]>
  >({});
  const [count, setCount] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [showFilter, setShowFilter] = useState<boolean>(false);
  const [columnAnchorEl, setColumnAnchorEl] =
    React.useState<HTMLButtonElement | null>(null);
  const [searchText, setSearchText] = useState('');
  const [refreshTrigger, setRefreshTrigger] = useState<number>(Date.now());
  const [resetSearch, setResetSearch] = useState<boolean>(false);

  const handleColumnVisibility = (
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    setColumnAnchorEl(event.currentTarget);
  };

  const initialTab = 'summary';

  useEffect(() => {
    if (searchParams.get('list') === 'dossier' && !searchParams.get('tab')) {
      searchParams.set('tab', initialTab);
      navigate({ search: searchParams.toString() }, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialTab, searchParams]);

  const tabParam = searchParams.get('tab') || initialTab;

  const handleTabChange = (value: string) => {
    searchParams.set('tab', value);
    navigate({ search: searchParams.toString() }, { replace: true });
    setCount(0);
    setAppliedFilters({});
    setCurrentPage(0);
    setSearchText('');
    setResetSearch(true);
  };

  const handleSearchReset = () => {
    setResetSearch(false);
  };
  const handleRefresh = () => setRefreshTrigger(Date.now());
  const handleFilter = () => setShowFilter(!showFilter);

  const filterFields = useMemo(() => {
    switch (tabParam) {
      case 'project_documents':
        return getProjectDocumentsFilterFields();
      case 'project_summary':
        return getProjectSummaryFilterFields();
      case 'resource_summary':
        return getResourceSummaryFilterFields();
      default:
        return [];
    }
  }, [tabParam]);

  const tabs = [
    {
      label: 'Summary',
      value: 'summary',
      hide: false,
    },
    {
      label: 'Qualified Projects',
      value: 'qualified_projects',
      hide: false,
    },
    {
      label: 'Financial Workings',
      value: 'financial_workings',
      hide: false,
    },
    {
      label: 'RD Forms',
      value: 'rd_form',
      hide: false,
    },
    {
      label: 'Project Documents',
      value: 'project_documents',
      hide: false,
    },
    {
      label: 'Project Summary',
      value: 'project_summary',
      hide: false,
    },
    {
      label: 'Resource Summary',
      value: 'resource_summary',
      hide: false,
    },
  ];

  const headerButtons = [
    {
      label: 'Show/Hide Fields',
      variant: 'outlined' as const,
      disabled: false,
      onClick: handleColumnVisibility,
      sx: { width: '125px', minWidth: '125px' },
      hide: false,
    },
  ];

  return (
    <div className='w-full pt-2 pl-2 pr-4 mb-1'>
      <SectionTabPanel
        tabs={DossierTabs}
        filterMenu={filterFields}
        filterVisibility={true}
        showFilter={showFilter}
        contextKey='case-dossier'
        appliedFilters={appliedFilters}
        setAppliedFilters={setAppliedFilters}
        setCurrentPage={setCurrentPage}
        handleFilter={handleFilter}
        sortFilterCount={0}
        setSortFilterCount={() => {}}
        showRefresh={true}
        onRefreshClick={handleRefresh}
        showSearch={true}
        onSearch={(text) => setSearchText(text)}
        searchReset={resetSearch}
        onSearchReset={handleSearchReset}
        showAddActivity={true}
        activityMenuItems={activityMenuItems}
      />

      <SectionHeader
        title='Dossier'
        titleIcon={<DetailsIcon alt='dossier-header-icon' />}
        iconBg='#C5D89D'
        bgType='circle'
        count={count}
        showItemCount={true}
        buttons={headerButtons}
      />

      <SectionHeaderTab
        tabs={tabs}
        onTabChange={handleTabChange}
        defaultValue={tabParam}
      />

      <div className='border border-t-0 border-[#CBD6E2]'>

        {tabParam === 'financial_workings' && (
          <FinancialWorkingForm
            caseDetails={caseDetails}
            setDossierFinancialStatus={setDossierFinancialStatus}
            dossierFinancialStatus={dossierFinancialStatus}
          />
        )}

        {tabParam === 'project-assigned-documents' && (
          <ProjectDocuments
            refreshTrigger={refreshTrigger}
            currentPage={currentPage}
            appliedFilters={appliedFilters}
            setCount={setCount}
            setExportParams={() => {}}
            setExportType={() => {}}
            columnAnchorEl={columnAnchorEl}
            setColumnAnchorEl={setColumnAnchorEl}
            searchValue={searchText}
          />
        )}
        {tabParam !==  'financial_workings' && (
           <div className='flex items-center justify-center w-full h-full'>
             <ComingSoon alt='comingSoon' />
          </div>
        )}

      </div>
    </div>
  );
};

export default Dossier;
