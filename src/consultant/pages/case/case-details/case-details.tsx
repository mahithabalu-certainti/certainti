import { Suspense, useEffect, useMemo, useState } from 'react';
import { useLocation, useParams, useSearchParams } from 'react-router-dom';
import { useCaseDetails } from '../../../services/cases/case-service';
import { MenuItem } from '../../../types';
import { AllMenus, AllModules } from '../../../../common-service';
import { InfoSection, PageHeader, SideMenuPanel } from '../../../../components';
import {
  AccountDetailsIcon,
  ActivitiesIcon,
  AttachmentsSideIcon,
  CasesIcon,
  ChecklistIcon,
  ComingSoon,
  DetailsIcon,
  FinancialIcon,
  InteractionsIcon,
  NotesSideIcon,
  ProjectsSideIcon,
  ResourcesIcon,
  SettingIcon,
  TechSummaryIcon,
} from '../../../../assets';
import { WorkBreakDown } from './work-breakdown';
import { CaseTeam } from './case-team';
import { transformCaseData } from './utils';
import { ActionsDropdownItem } from '../../../../common-utils';
import { ExportType } from '../../../types';
import { RootState } from '../../../../store/store';
import { AccountState } from '../../../../store/type';

import { AttachmentsListExportParams } from '../../../types/attachment';
import { useSelector } from 'react-redux';
import { Attachments } from './attachments';

export const CaseDetails = () => {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const { caseId } = useParams();
  const accountId = searchParams.get('accountID');
  const {
    data: caseData,
    isLoading,
    isError,
  } = useCaseDetails(caseId ?? '', accountId ?? '');

  const caseHeaderDetails = useMemo(() => {
    if (caseData) {
      return transformCaseData(caseData);
    }
    return [];
  }, [caseData]);
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const { fiscalYear } = useSelector<RootState, AccountState>(
    (state: RootState) => state.account
  );
  const convertedFiscalYear = fiscalYear !== 'FY-All' ? Number(fiscalYear) : 0;

  const defaultTab = searchParams.get('list') ?? 'workBreakdown';
  const [activeKey, setActiveKey] = useState(defaultTab as string);
  const [, setRefreshCaseDetails] = useState<number>(Date.now());

  const [, setAttachmentParams] = useState<AttachmentsListExportParams>({
    sortBy: 'document_name',
    sortOrder: 'ASC',
    filters: {},
    fiscalYear: convertedFiscalYear,
  });

  const [, setExportType] = useState<ExportType>('resource');

  const onRefreshClick = () => {
    setRefreshCaseDetails(Date.now());
  };

  useEffect(() => {
    const list = searchParams.get('list');
    if (list) {
      setActiveKey(list);
    } else {
      setActiveKey('workBreakdown');
    }
  }, [searchParams]);

  useEffect(() => {
    const listParam = searchParams.get('list');
    if (location.state?.activeKey) {
      setActiveKey(location.state.activeKey || listParam || 'workBreakdown');
    }
  }, [location.state, searchParams]);

  const menuItems: ActionsDropdownItem[] = [
    {
      label: 'Manage user',
      onClick: () => console.log('manage user clicked'),
      hide: true,
    },
    {
      label: 'Export',
      onClick: () => console.log('clicked'),
      hide: false,
    },
  ];

  const handleActionsClick = () => {
    console.log('Actions clicked');
  };

  const handleSettingsClick = () => {
    console.log('Settings clicked');
  };

  const renderContent = () => {
    switch (activeKey) {
      case 'workBreakdown':
        return (
          <div className='w-full pr-4 pl-2 py-2'>
            <WorkBreakDown />
          </div>
        );
      case 'caseTeam':
        return (
          <div className='w-full pr-4 pl-2 py-2'>
            <CaseTeam />
          </div>
        );
      case 'attachments':
        return (
          <Attachments
            accountInActive={false}
            setExportType={setExportType}
            setAttachmentParams={setAttachmentParams}
            refetchAccountDetails={onRefreshClick}
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

  const sideMenuItems = useMemo<MenuItem[]>(() => {
    const allMenus = [
      {
        name: 'Work Breakdown',
        key: 'workBreakdown',
        id: AllMenus.FINANCIAL_HIGHLIGHTS,
        disabled: false,
        icon: ProjectsSideIcon,
      },
      {
        name: 'Case Team',
        key: 'caseTeam',
        id: AllMenus.FINANCIAL_HIGHLIGHTS,
        disabled: false,
        icon: CasesIcon,
      },
      {
        name: 'Case Projects',
        key: 'caseProjects',
        id: AllMenus.FINANCIAL_HIGHLIGHTS,
        disabled: false,
        icon: CasesIcon,
      },
      {
        name: 'Case Project Resource',
        key: 'caseProjectResource',
        id: AllMenus.FINANCIAL_HIGHLIGHTS,
        disabled: false,
        icon: ResourcesIcon,
      },
      {
        name: 'Case - Project Task',
        key: 'caseProjectTask',
        id: AllMenus.FINANCIAL_HIGHLIGHTS,
        disabled: false,
        icon: ProjectsSideIcon,
      },
      {
        name: 'Historical Submission',
        key: 'historical_submission',
        id: AllModules.PROJECT_INTERACTIONS,
        disabled: false,
        icon: InteractionsIcon,
      },
      {
        name: 'Interactions',
        key: 'interaction',
        id: AllModules.PROJECT_INTERACTIONS,
        disabled: false,
        icon: InteractionsIcon,
      },
      {
        name: 'Technical Summary',
        key: 'technicalSummary',
        id: AllModules.PROJECT_TECHNICAL_SUMMARY,
        disabled: false,
        icon: TechSummaryIcon,
      },
      {
        name: 'Financial Workings',
        key: 'financialWorkings',
        id: AllMenus.FINANCIAL_HIGHLIGHTS,
        disabled: false,
        icon: FinancialIcon,
      },
      {
        name: 'RD Credit Forms',
        key: 'rd_credit_forms',
        id: AllMenus.FINANCIAL_HIGHLIGHTS,
        disabled: false,
        icon: DetailsIcon,
      },
      {
        name: 'Dossier',
        key: 'dossier',
        id: AllMenus.FINANCIAL_HIGHLIGHTS,
        disabled: false,
        icon: DetailsIcon,
      },
      {
        name: 'Case Review',
        key: 'caseReview',
        id: AllMenus.FINANCIAL_HIGHLIGHTS,
        disabled: false,
        icon: CasesIcon,
      },
      {
        name: 'Activities',
        key: 'activities',
        id: AllModules.ACTIVITIES,
        disabled: false,
        icon: ActivitiesIcon,
      },
      {
        name: 'Notes',
        key: 'notes',
        id: AllMenus.NOTES,
        disabled: false,
        icon: NotesSideIcon,
      },
      {
        name: 'Attachments',
        key: 'attachments',
        id: AllMenus.ATTACHMENTS,
        disabled: false,
        icon: AttachmentsSideIcon,
      },
      {
        name: 'Checklist',
        key: 'checklist',
        id: AllMenus.CHECKLISTS,
        disabled: false,
        icon: ChecklistIcon,
      },
      {
        name: 'Settings',
        key: 'settings',
        id: AllMenus.CONFIGURATION,
        disabled: false,
        hide: false,
        icon: SettingIcon,
        subMenu: [
          {
            name: 'Jurisdiction Configuration',
            key: 'jurisdiction_configuration',
            id: AllMenus.MANAGE_ACCOUNT_ACCESS,
            disabled: false,
            hide: false,
            icon: ResourcesIcon,
          },
        ],
      },
    ];
    return allMenus;
  }, []);

  const goBack = () => {
    window.history.back();
  };

  return (
    <div className='flex flex-col h-full'>
      <div className='flex h-[60px]'>
        <PageHeader
          variant='sub'
          placeholder={'Case ID'}
          icon={
            <AccountDetailsIcon
              className='h-6 w-6 rounded'
              style={{ backgroundColor: '#4B9BFF' }}
            />
          }
          title={caseData?.r_number || ''}
          isLoading={isLoading}
          totalRecords={5}
          actionItems={menuItems}
          onActionsClick={handleActionsClick}
          onSettingsClick={handleSettingsClick}
          showActions={false}
          showSettings={false}
          goBack={goBack}
          backBtnLabel='Back To Cases'
        />
      </div>
      <InfoSection
        columns={caseHeaderDetails}
        loading={isLoading}
        loadingRows={4}
        error={isError}
        className={!isError ? 'max-h-[140px] min-h-[140px]' : ''}
      />
      <div className='flex flex-1 flex-row w-full'>
        <div
          className={`flex transition-all ease-in-out ${
            isCollapsed
              ? 'w-[60px] min-w-[60px] max-w-[60px] duration-300'
              : 'w-[220px] min-w-[220px] max-w-[220px] duration-500'
          }`}
        >
          <SideMenuPanel
            menuItems={sideMenuItems}
            activeKey={activeKey}
            onSelect={setActiveKey}
            headerTitle='Related List'
            showBackIcon={true}
            isCollapsed={isCollapsed}
            onToggleCollapse={() => setIsCollapsed((prev) => !prev)}
          />
        </div>
        <div
          className='flex-1'
          style={{
            maxHeight: 'calc(100vh - 140px)',
            overflow: 'auto',
          }}
        >
          <Suspense fallback={null}>{renderContent()}</Suspense>
        </div>
      </div>
    </div>
  );
};

export default CaseDetails;
