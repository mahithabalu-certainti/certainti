import { Suspense, useEffect, useMemo, useState } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
// import { AccountState } from '../../../../store/type';
// import { RootState } from '../../../../store/store';
// import { useSelector } from 'react-redux';
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

export const CaseDetails = () => {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  //   const navigate = useNavigate();

  //   const [caseDetails, setCaseDetails] = useState<DisplayColumn[]>([]);
  //   const [accountDetailsForEdit, setAccountDetailsForEdit] =
  //     useState<AccountFieldsApiResponse['data']>();
  //   const { caseid } = useParams();
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  //   const { fiscalYear } = useSelector<RootState, AccountState>(
  //     (state: RootState) => state.account
  //   );
  //   const convertedFiscalYear = fiscalYear !== 'FY-All' ? Number(fiscalYear) : 0;
  //   const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  const defaultTab = searchParams.get('list') ?? 'details';
  const [activeKey, setActiveKey] = useState(defaultTab as string);
  //   const [toggleEnabled, setToggleEnabled] = useState(false);
  //   const [refreshAccountDetails, setRefreshAccountDetails] = useState<number>(
  //     Date.now()
  //   );

  //   const [tableParams, setTableParams] = useState<ExportModule>({
  //     sortBy: 'created_datetime',
  //     sortOrder: 'DESC',
  //     fiscalYear: String(convertedFiscalYear),
  //     rNumber: accountDetailsForEdit?.accountById?.r_number || '',
  //     resourceRid: '',
  //     filter: {},
  //   });
  //   const [projectParams, setProjectParams] = useState<ProjectListParams>({
  //     sortBy: 'created_datetime',
  //     sortOrder: 'DESC',
  //     filters: {},
  //     fiscalYear: String(convertedFiscalYear),
  //     accountNumber: accountDetailsForEdit?.accountById?.r_number || '',
  //   });
  //   const [attachmentParams, setAttachmentParams] =
  //     useState<AttachmentsListExportParams>({
  //       sortBy: 'document_name',
  //       sortOrder: 'ASC',
  //       filters: {},
  //       fiscalYear: convertedFiscalYear,
  //     });

  //   const [importsParams, setImportsParams] = useState<ImportsListURLParams>({
  //     page: 1,
  //     limit: 100,
  //     sort: 'r_number',
  //     sort_by: 'asc',
  //     filters: {},
  //     fiscal_year: convertedFiscalYear,
  //     account_rid: accountid || '',
  //   });
  //   const [financialResCostParams, setFinancialResCostParams] =
  //     useState<ProjectFinancialResourceExportParams>({
  //       sortBy: 'project_code',
  //       sortOrder: 'ASC',
  //       filters: {},
  //     });

  //   const [financialProjectCostParams, setFinancialProjectCostParams] =
  //     useState<ProjectFinancialProjectExportParams>({
  //       sortBy: 'project_code',
  //       sortOrder: 'ASC',
  //       filters: {},
  //       fiscalYear: 0,
  //     });

  //   const [exportType, setExportType] = useState<ExportType>('resource');

  //   const onRefreshClick = () => {
  //     setRefreshAccountDetails(Date.now());
  //   };

  useEffect(() => {
    const list = searchParams.get('list');
    if (list) {
      setActiveKey(list);
    } else {
      setActiveKey('details');
    }
  }, [searchParams]);

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

  //   const handleEditAccount = () => {
  //     navigate(ACCOUNT + '/edit/' + data?.data?.accountById?.rid, {
  //       state: { accountDetailsForEdit },
  //     });
  //   };

  const handleActionsClick = () => {
    console.log('Actions clicked');
  };

  const handleSettingsClick = () => {
    console.log('Settings clicked');
  };
  // Set active key from location stat
  useEffect(() => {
    if (location.state?.activeKey) {
      setActiveKey(location.state.activeKey);
    }
  }, [location.state]);

  const renderContent = () => {
    switch (activeKey) {
      case 'workBreakdown':
        return (
          <div className='w-full pr-4 pl-2 py-2'>
            <WorkBreakDown />
          </div>
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
          placeholder='Account Name'
          icon={
            <AccountDetailsIcon
              className='h-6 w-6 rounded'
              style={{ backgroundColor: '#4B9BFF' }}
            />
          }
          title={'Case Title'}
          totalRecords={5}
          actionItems={menuItems}
          //   primaryButton={
          //     isAccountFieldsEditable
          //       ? {
          //           label: 'Edit',
          //           onClick: handleEditAccount,
          //         }
          //       : undefined
          //   }
          onActionsClick={handleActionsClick}
          onSettingsClick={handleSettingsClick}
          showActions={false}
          showSettings={false}
          goBack={goBack}
        />
      </div>
      <InfoSection
        columns={[]}
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
