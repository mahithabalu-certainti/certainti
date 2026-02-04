import React, { useEffect, useMemo, useState } from 'react';
import { AllPermissions } from '../../../../../common-service';
import {
  ActivityDropdownItem,
  CaseDetails,
  ColorCode,
  FinancialHighlightsResponse,
  RDCreditStatusResponse,
} from '../../../../types';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { SectionHeaderTab, SectionTabPanel } from '../../../../../components';
import SectionHeader from '../../../../../components/details-section/section-header';
import { ComingSoon, DossierIcon } from '../../../../../assets';
import {
  getProjectDocumentsFilterFields,
  getProjectSummaryFilterFields,
  getResourceSummaryFilterFields,
} from './helper';
import { ProjectDocuments } from './tab';
import FinancialWorkingForm from './tab/financial-working/financial-form';
import { AccessRestricted } from '../../../../../components/account-restricted';
import { checkPermission } from '../../../../../common-utils';
import { RootState } from '../../../../../store/store';
import { useSelector } from 'react-redux';
import { useToast } from '../../../../../hooks';
import { useRDCreditStatus } from '../../../../services/case-dossier/cases-financial-services';

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
  setDossierFinancialStatus: (status: boolean) => void;
  dossierFinancialStatus: boolean;
  financialData: FinancialHighlightsResponse | null;
  setFinancialData: (data: FinancialHighlightsResponse | null) => void;
  refetchCaseDetails: () => void;
}

const Dossier: React.FC<DossierProps> = ({
  activityMenuItems,
  caseDetails,
  setDossierFinancialStatus,
  dossierFinancialStatus,
  financialData,
  setFinancialData,
  refetchCaseDetails,
}) => {
  const navigate = useNavigate();
  const { caseId } = useParams();
  const [searchParams] = useSearchParams();
  const accountid = searchParams.get('accountID') ?? '';
  const { successToast } = useToast();
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

  const initialTab = 'financial_workings';

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
  const { refetch: refetchRDCreditStatus } = useRDCreditStatus(
    accountid,
    caseId ?? '',
    false
  );

  const handleStatusUpdate = (
    statusData: RDCreditStatusResponse,
    actionType?: 'initiate' | 'regenerate' | 'refresh'
  ) => {
    setRefreshTrigger(Date.now());
    if (statusData?.data === 'COMPLETED') {
      if (actionType === 'initiate' || actionType === 'refresh') {
        successToast('Initiated successfully');
      } else if (actionType === 'regenerate') {
        successToast('Re-Generated successfully');
      }
    }
  };

  const handleRefresh = async () => {
    const result = await refetchRDCreditStatus();
    if (result.data) {
      handleStatusUpdate(result.data, 'refresh');
    }
  };
  const handleFilter = () => setShowFilter(!showFilter);
  const { permission } = useSelector((state: RootState) => state.permission);

  const isFinancialView = checkPermission(
    permission,
    AllPermissions.DOSSIER_FINANCIAL_VIEW_EDIT
  );

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
      label: 'Financial Workings',
      value: 'financial_workings',
      hide: false,
    },
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
      hide: tabParam === 'financial_workings',
    },
  ];

  return (
    <div className='w-full pt-2 pl-2 pr-4 mb-1'>
      <SectionTabPanel
        tabs={DossierTabs}
        filterMenu={filterFields}
        filterVisibility={
          tabParam !== 'financial_workings' && tabParam !== 'rd_form'
        }
        showFilter={showFilter}
        contextKey='case-dossier'
        appliedFilters={appliedFilters}
        setAppliedFilters={setAppliedFilters}
        setCurrentPage={setCurrentPage}
        handleFilter={handleFilter}
        sortFilterCount={0}
        setSortFilterCount={() => { }}
        showRefresh={
          tabParam !== 'rd_form' && tabParam !== 'financial_workings'
        }
        onRefreshClick={handleRefresh}
        showSearch={tabParam !== 'financial_workings' && tabParam !== 'rd_form'}
        onSearch={(text) => setSearchText(text)}
        searchReset={resetSearch}
        onSearchReset={handleSearchReset}
        showAddActivity={true}
        activityMenuItems={activityMenuItems}
      />

      <SectionHeader
        title='Dossier'
        titleIcon={
          <DossierIcon
            alt='dossier-header-icon'
            className={`[&>path]:stroke-[${ColorCode.accountTextColor}] w-[14px] h-[14px]`}
          />
        }
        iconBg={ColorCode.caseBgColor}
        bgType='circle'
        count={count}
        showItemCount={tabParam !== 'financial_workings'}
        buttons={headerButtons}
      />

      <SectionHeaderTab
        tabs={tabs}
        onTabChange={handleTabChange}
        defaultValue={tabParam}
      />

      <div className='border border-t-0 border-[#CBD6E2]'>
        {tabParam === 'financial_workings' &&
          (!isFinancialView ? (
            <AccessRestricted />
          ) : (
            <FinancialWorkingForm
              caseDetails={caseDetails}
              setDossierFinancialStatus={setDossierFinancialStatus}
              dossierFinancialStatus={dossierFinancialStatus}
              financialData={financialData}
              setFinancialData={setFinancialData}
              refetchCaseDetails={refetchCaseDetails}
            />
          ))}

        {tabParam === 'project-assigned-documents' && (
          <ProjectDocuments
            refreshTrigger={refreshTrigger}
            currentPage={currentPage}
            appliedFilters={appliedFilters}
            setCount={setCount}
            setExportParams={() => { }}
            setExportType={() => { }}
            columnAnchorEl={columnAnchorEl}
            setColumnAnchorEl={setColumnAnchorEl}
            searchValue={searchText}
          />
        )}
        {tabParam !== 'financial_workings' && (
          <div className='flex items-center justify-center w-full h-full'>
            <ComingSoon alt='comingSoon' />
          </div>
        )}
      </div>
    </div>
  );
};

export default Dossier;
