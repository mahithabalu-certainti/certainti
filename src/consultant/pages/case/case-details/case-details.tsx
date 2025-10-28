import { Suspense, useEffect, useMemo, useState } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { ActionsDropdownItem } from '../../../../common-utils';
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
  TechSummaryIcon,
} from '../../../../assets';
import { WorkBreakDown } from './work-breakdown';
import { DisplayColumn } from '../../account-details/utils';
import { CaseTeam } from './case-team';
import { ExportType } from '../../../types';
import { RootState } from '../../../../store/store';
import { AccountState } from '../../../../store/type';
import { Attachments } from './attachments';
import { AttachmentsListExportParams } from '../../../types/attachment';

export const CaseDetails = () => {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  // const { caseId } = useParams();

  const [caseDetails] = useState<DisplayColumn[]>([]);
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
        name: 'Financial Workings',
        key: 'financialWorkings',
        id: AllMenus.FINANCIAL_HIGHLIGHTS,
        disabled: false,
        icon: FinancialIcon,
      },
      {
        name: 'Case Review',
        key: 'caseReview',
        id: AllMenus.FINANCIAL_HIGHLIGHTS,
        disabled: false,
        icon: CasesIcon,
      },
      {
        name: 'Case Team',
        key: 'caseTeam',
        id: AllMenus.FINANCIAL_HIGHLIGHTS,
        disabled: false,
        icon: CasesIcon,
      },
      {
        name: 'Assign Projects',
        key: 'assignProjects',
        id: AllMenus.FINANCIAL_HIGHLIGHTS,
        disabled: false,
        icon: ProjectsSideIcon,
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
        name: 'Interaction',
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
        name: 'Dossier',
        key: 'dossier',
        id: AllMenus.FINANCIAL_HIGHLIGHTS,
        disabled: false,
        icon: DetailsIcon,
      },
      {
        name: 'Survey',
        key: 'survey',
        id: AllMenus.FINANCIAL_HIGHLIGHTS,
        disabled: false,
        icon: ChecklistIcon,
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
          placeholder='Case ID'
          icon={
            <AccountDetailsIcon
              className='h-6 w-6 rounded'
              style={{ backgroundColor: '#4B9BFF' }}
            />
          }
          title={'5005003'}
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
        columns={caseDetails}
        loading={false}
        error={undefined}
        singleLineView={true}
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
          style={{ maxHeight: 'calc(100vh - 140px)', overflow: 'auto' }}
        >
          <Suspense fallback={null}>{renderContent()}</Suspense>
        </div>
      </div>
    </div>
  );
};

export default CaseDetails;
