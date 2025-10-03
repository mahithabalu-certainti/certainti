/* eslint-disable @typescript-eslint/no-explicit-any */
import { Suspense, useEffect, useMemo, useState } from 'react';
import {
  useLocation,
  useNavigate,
  useParams,
  useSearchParams,
} from 'react-router-dom';
import { ACCOUNT, PROJECT } from '../../../../routes';
import { PageHeader, SideMenuPanel } from '../../../../components';
import {
  // ActivitiesIcon,
  AttachmentsSideIcon,
  CasesIcon,
  ChecklistIcon,
  DetailsIcon,
  FinancialIcon,
  InteractionsIcon,
  NotesSideIcon,
  ProjectDetailsIcon,
  ProjectsSideIcon,
  ResourcesIcon,
  SettingIcon,
  TechSummaryIcon,
  ConfigIcon,
} from '../../../../assets';
import { useProjectDetail, ProjectTriggerAI } from '../../../services/project';
import {
  mergeAdjustmentResponse,
  projectDetails,
  transformProjectData,
} from '../utils';
import ProjectDetailsData from './details/project-data';
import {
  NewProjectData,
  ProjectTriggerAIPayload,
} from '../../../types/project';
import {
  ExportType,
  FiscalDates,
  FormFiscalDateType,
  MenuItem,
  NotesListURLParams,
  ProjectFinancialResourceExportParams,
  TechnicalSummaryExportListParams,
} from '../../../types';
import {
  AllMenus,
  AllModules,
  AllPermissions,
} from '../../../../common-service';
import { AccessRestricted } from '../../../../components/account-restricted';
import { useSelector } from 'react-redux';
import { RootState } from '../../../../store/store';
import { checkPermission, getFiscalDateBounds } from '../../../../common-utils';
import { NotFound } from '../../../../pages';
import { ProjectResources } from './project-resources/project-resources';
import { Attachments } from './attachments';
import { exportAttachmentsData } from '../../../services/attachments/attachments-service';
import { AttachmentsListExportParams } from '../../../types/attachment';
import { ProjectTask } from './project-task/project-task';
import { ProjectTaskListExportParams } from '../../../types/project-task';
import { exportProjectTaskData } from '../../../services/project/project-task-service';
import { Configuration } from './configuration';
import { Financial } from './financial-highlights';
import { exportFinancialResourceCost } from '../../../services/financial/financial-service';
import { exportProjectResoure } from '../../../services/project-resources/project-resource-service';
import { Interactions } from './interactions';
import DetailsSectionSkeleton from '../../../../components/skeleton-component/detailsskeleton';
import {
  exportInteractions,
  exportInteractionsHistory,
} from '../../../services/interactions/interactions-service';
import { TechnicalSummary } from './technical-summary';
import { exportTechnicalSummary } from '../../../services/technical-summary/technical-summary-service';
import { BUTTON_STYLES } from '../../../../admin/pages/manage-user-detail/styles';
import { useToast } from '../../../../hooks';
import { ProjectInfoSection } from './project-info-section';
import { resourceClient } from '../../../../api/graphql/clients/client';
import { UPDATE_QRE_ADJUSTMENT } from '../../../../api/graphql/queries/project-query';
import { useMutation } from '@apollo/client';
import { ProjectQreAdjustmentResponse } from '../utils';
import { Notes } from './notes';

export const ProjectDetails = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const [projectDetails, setProjectDetails] = useState<any>([]);
  const defaultTab = searchParams.get('list') ?? 'projectDetails';
  const [activeKey, setActiveKey] = useState(defaultTab);
  const [projectData, setProjectData] = useState<NewProjectData | null>(null);
  // const [fiscalYear, setFiscalYear] = useState<FiscalYearType | undefined>();
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [exportType, setExportType] = useState<ExportType>('attachments');
  const systemTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const [interactionsParams, setInteractionsParams] =
    useState<AttachmentsListExportParams>({
      sortBy: '',
      sortOrder: 'ASC',
      filters: {},
      page: 1,
      limit: 100,
    });

  const [attachmentParams, setAttachmentParams] =
    useState<AttachmentsListExportParams>({
      sortBy: 'document_name',
      sortOrder: 'ASC',
      filters: {},
    });
  const [projectTaskParams, setProjectTaskParams] =
    useState<ProjectTaskListExportParams>({
      sortBy: 'resource_code',
      sortOrder: 'ASC',
      filters: {},
    });
  const [financialResCostParams, setFinancialResCostParams] =
    useState<ProjectFinancialResourceExportParams>({
      sortBy: 'resource_code',
      sortOrder: 'ASC',
      filters: {},
    });
  const [projectResourceParams, setProjectResourceParams] =
    useState<AttachmentsListExportParams>({
      sortBy: 'resource_code',
      sortOrder: 'ASC',
      filters: {},
    });
  const [technicalSummaryParams, setTechnicalSummaryParams] =
    useState<TechnicalSummaryExportListParams>({
      sortBy: 'r_number',
      sortOrder: 'ASC',
      filters: {},
    });
  const [notesParams, setNotesParams] = useState<NotesListURLParams>({
    page: 1,
    limit: 100,
    sortBy: 'r_number',
    sortOrder: 'ASC',
    filters: {},
  });

  const [fiscalDate, setFiscalDate] = useState<FormFiscalDateType>({
    year: 0,
  });

  const navigate = useNavigate();
  // Permission Mangement
  const { menus, modules, permission } = useSelector(
    (state: RootState) => state.permission
  );

  const projectIsEnable = checkPermission(modules, AllModules.PROJECTS);
  const isProjectFieldsEditable = useMemo(
    () =>
      permission
        .find((item) => item.name === AllPermissions.PROJECTS_VIEW_EDIT)
        ?.fields?.some((field) => field.edit),
    [permission]
  );
  const projectDownloadIsEnable = checkPermission(
    permission,
    AllPermissions.PROJECTS_EXPORT
  );
  // Functionality will be implement later
  // const projectExportIsEnable = checkPermission(
  //   permission,
  //   AllPermissions.PROJECT_PROJECTS_EXPORT
  // );
  // const projectEditIsEnable = checkPermission(
  //   permission,
  //   AllPermissions.PROJECT_PROJECTS_EDIT
  // );

  useEffect(() => {
    const list = searchParams.get('list');
    if (list) {
      setActiveKey(list);
    } else {
      setActiveKey('projectDetails');
    }
  }, [searchParams]);

  const { projectid: projectID } = useParams();
  const accountID = searchParams.get('accountID') || '';
  const parent = searchParams.get('source');
  const interactionHistoryId = searchParams.get('interaction_history_id');
  const interactionId = searchParams.get('interaction_id');
  const interactionRID = searchParams.get('interaction_rid');
  const interactionsView = !!interactionId || !!interactionRID;
  const technicalSummaryId = searchParams.get('technical_summary_id');

  const { data, isLoading, isError, refetch } = useProjectDetail(
    accountID,
    projectID || ''
  );

  const [updateQreAdjustment] = useMutation(UPDATE_QRE_ADJUSTMENT, {
    client: resourceClient,
  });

  const accountInActive =
    data?.data?.project?.account_status?.toLowerCase() !== 'active';
  const projectInActive =
    data?.data?.project?.status_name?.toLowerCase() === 'in-active';
  useEffect(() => {
    if (data?.data) {
      const project = data.data.project;
      setProjectDetails(transformProjectData(project));
      setProjectData(project);
      handleGetFiscalYear(project?.fiscal_year, {
        startDate: project?.fiscal_start_date || '',
        endDate: project?.fiscal_end_date || '',
      });
    }
  }, [data]);

  const handleQreAdjustmentUpdated = (result: ProjectQreAdjustmentResponse) => {
    const updatedProject = mergeAdjustmentResponse(
      projectData as unknown as projectDetails,
      result
    );
    setProjectData(updatedProject as unknown as NewProjectData);
    setProjectDetails(transformProjectData(updatedProject as projectDetails));
  };

  const handleAdjustmentFactor = async (newValue: string) => {
    const payload = {
      account_rid: accountID,
      rid: projectID,
      rd_percent_potential_ai: Number(newValue),
    };
    try {
      const res = await updateQreAdjustment({
        variables: { data: payload },
      });
      const result = res.data?.updateQreAdjustment?.data;
      const updatedProject = mergeAdjustmentResponse(
        projectData as unknown as projectDetails,
        result
      );

      setProjectData(updatedProject as unknown as NewProjectData);
      setProjectDetails(transformProjectData(updatedProject as projectDetails));
      refetch();
    } catch (err) {
      console.log(err);
    }
  };

  const handleGetFiscalYear = (
    year: string,
    accountFiscalDates: FiscalDates
  ) => {
    const bounds = getFiscalDateBounds(year, accountFiscalDates);
    setFiscalDate(bounds);
  };

  const isAttachmentExportEnable = checkPermission(
    permission,
    AllPermissions.ATTACHMENT_EXPORT
  );
  const isFinancialHighlightsEnable = checkPermission(
    menus,
    AllMenus.FINANCIAL_HIGHLIGHTS
  );
  const isFinancialResourceCostExportEnable = checkPermission(
    permission,
    AllPermissions.PROJECT_FINANCIAL_RESOURCE_COST_EXPORT
  );
  const isResourceExportViewEnable = checkPermission(
    permission,
    AllPermissions.PROJECTS_RESOURCES_EXPORT
  );
  const isTaskExportViewEnable = checkPermission(
    permission,
    AllPermissions.PROJECTS_TASK_EXPORT
  );

  const isInteractionsExportEnable = checkPermission(
    permission,
    AllPermissions.INTERACTIONS_EXPORT
  );

  const technicalSummaryExportEnable = checkPermission(
    permission,
    AllPermissions.PROJECT_TECHNICAL_SUMMARY_EXPORT
  );
  const checkExport = () => {
    const list = searchParams.get('list');
    const tab = searchParams.get('tab');

    const page = searchParams.get('page');
    if (page === 'details') {
      return true;
    }

    if (list === 'attachments') {
      return !isAttachmentExportEnable;
    } else if (list === 'notes') {
      return false;
    } else if (list === 'projectsTask') {
      return !isTaskExportViewEnable;
    } else if (list === 'financial' && tab === 'resource_cost') {
      return !isFinancialResourceCostExportEnable;
    } else if (list === 'projectResources') {
      return !isResourceExportViewEnable;
    } else if (list === 'interactions' && !interactionsView) {
      return !isInteractionsExportEnable;
    } else if (list === 'technicalSummary' && !technicalSummaryId) {
      return !technicalSummaryExportEnable;
    } else {
      return true;
    }
  };

  const handleExport = (exportType: ExportType) => {
    const list = searchParams.get('list');

    const financialPayload = {
      accountNumber: projectData?.account_number,
      fiscalYear: projectData?.fiscal_year,
      projectRid: projectID,
      accountRid: accountID,
    };
    const projectResourcePayload = {
      projectRid: projectID,
      accountRid: accountID,
    };

    if (
      list !== 'attachments' &&
      list !== 'notes' &&
      list !== 'financial' &&
      list !== 'projectResources' &&
      list !== 'projectsTask' &&
      list !== 'interactions' &&
      list !== 'technicalSummary'
    ) {
      return;
    }

    if (list === 'attachments' && exportType === 'attachments') {
      const attachmentPayload = {
        accountRid: accountID,
        entityId: projectID,
        attachmentLevel: 'project',
      };
      exportAttachmentsData('attachments', {
        ...attachmentParams,
        ...attachmentPayload,
      });
      return;
    }

    if (list === 'notes' && exportType === 'notes') {
      const notePayload = {
        accountRid: accountID,
        entityId: projectID,
        attachmentLevel: 'project',
      };
      console.log('notes-export', {
        ...notesParams,
        ...notePayload,
      });
      return;
    }

    if (list === 'financial' && exportType === 'financial') {
      exportFinancialResourceCost({
        ...financialResCostParams,
        ...financialPayload,
      });
      return;
    }
    if (list === 'projectResources' && exportType === 'project_resource') {
      exportProjectResoure({
        ...projectResourceParams,
        ...projectResourcePayload,
      });
      return;
    }

    if (list === 'technicalSummary' && exportType === 'technical_summary') {
      const technicalSummaryPayload = {
        account_rid: accountID,
        project_fiscal_rid: projectID,
        timezone: systemTimezone,
      };
      exportTechnicalSummary({
        ...technicalSummaryParams,
        ...technicalSummaryPayload,
      });
      return;
    }

    if (list === 'projectsTask' && exportType === 'projectTask') {
      const projectTaskExportPayload = {
        accountRid: accountID,
        projectRid: projectID,
      };
      exportProjectTaskData({
        ...projectTaskExportPayload,
        ...projectTaskParams,
      });
      return;
    }
    if (list === 'interactions') {
      if (interactionHistoryId) {
        const projectInteractionHistoryExportPayload = {
          account_rid: accountID || '',
          interaction_rid: interactionHistoryId,
          page: interactionsParams?.page || 1,
          limit: interactionsParams?.limit || 100,
          sort: interactionsParams.sortBy || 'status_name',
          sort_by: interactionsParams?.sortOrder || 'ASC',
          filters: interactionsParams?.filters || {},
          timezone: systemTimezone,
          flag: 'project',
        };
        exportInteractionsHistory(projectInteractionHistoryExportPayload);
        return;
      } else {
        const projectInteractionExportPayload = {
          account_rid: accountID || '',
          project_rid: data?.data?.project?.project_rid || '',
          project_fiscal_rid: projectID || '',
          fiscal_year: projectData?.fiscal_year,
          page: interactionsParams?.page || 1,
          limit: interactionsParams?.limit || 100,
          sort: interactionsParams?.sortBy || 'r_number',
          sort_by: interactionsParams?.sortOrder || 'ASC',
          filters: interactionsParams?.filters || {},
          timezone: systemTimezone,
          flag: 'project',
        };
        exportInteractions(projectInteractionExportPayload);
        return;
      }
    }

    return;
  };

  const menuItems = [
    {
      label: 'Manage user',
      onClick: () => console.log('manage user clicked'),
      hide: true,
    },
    {
      label: 'Export',
      onClick: () => handleExport(exportType),
      // hide: !projectExportIsEnable,
      hide: accountInActive || checkExport(),
    },
  ];
  useEffect(() => {
    const list = searchParams.get('list');
    const source = searchParams.get('source');
    const sourceTab = searchParams.get('source_tab');
    const newParams = new URLSearchParams(searchParams);
    if (list !== 'projectsTask' && source === 'timesheet') {
      newParams.delete('source');
      setSearchParams(newParams, { replace: true });
    }
    if (list !== 'projectDetails' && sourceTab === 'timesheet_project') {
      newParams.delete('source_tab');
      setSearchParams(newParams, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const handleEditAccount = () => {
    const projectID = projectData?.rid ?? '';
    const accountID = projectData?.account_rid ?? '';

    const source = parent === 'account' ? 'account' : 'project';

    const queryParams = new URLSearchParams({
      accountID,
      projectID,
      source,
    });

    navigate(`/project/edit/${projectID}?${queryParams.toString()}`);
  };

  const handleActionsClick = () => {
    console.log('Actions clicked');
    // Add actions logic here
  };

  const handleSettingsClick = () => {
    console.log('Settings clicked');
    // Add settings logic here
  };

  useEffect(() => {
    if (location.state?.activeKey) {
      setActiveKey(location.state.activeKey);
    }
  }, [location.state]);

  const { successToast } = useToast();
  const triggerAIMutation = ProjectTriggerAI();
  const handleTriggerAI = () => {
    const payload: ProjectTriggerAIPayload = {
      data: [
        {
          account_rid: projectData?.account_rid || '',
          project_fiscal_rid: projectData?.rid ? [projectData.rid] : [],
        },
      ],
      type: 'project',
    };
    triggerAIMutation.mutate(payload, {
      onSuccess: (res) => {
        successToast(res.statusMessage);
      },
      onError: (err) => {
        console.log(err);
      },
    });
  };

  const TriggerAIEnable = checkPermission(
    permission,
    AllPermissions.TRIGGER_AI_ASSESSMENT
  );

  const renderContent = () => {
    switch (activeKey) {
      case 'financial':
        return (
          <Financial
            projectDetails={projectData}
            setExportType={setExportType}
            setResCostExportParams={setFinancialResCostParams}
            onQreAdjustmentUpdated={handleQreAdjustmentUpdated}
          />
        );
      case 'projectDetails':
        return (
          <ProjectDetailsData
            accountInActive={accountInActive || projectInActive}
            projectDetails={{
              ...projectData!,
              attachment: data?.data?.attachment || [],
            }}
            isDetailsLoading={isLoading}
            detailsError={isError}
            projectDownloadIsEnable={projectDownloadIsEnable}
            projectEditIsEnable={isProjectFieldsEditable}
            permission={permission}
          />
        );
      case 'projectResources':
        return (
          <ProjectResources
            accountOrProjectInActive={accountInActive || projectInActive}
            projectID={projectID}
            accountData={{
              accountID: accountID,
              accountName: projectData?.account_name || '',
              accountNumber: projectData?.account_number || '',
            }}
            projectFiscalDate={fiscalDate}
            setExportType={setExportType}
            setAttachmentParams={setProjectResourceParams}
            projectCode={projectData?.project_code}
          />
        );
      case 'projectsTask':
        return (
          <ProjectTask
            accountOrProjectInActive={accountInActive || projectInActive}
            projectID={projectID}
            accountData={{
              accountID: accountID,
              accountName: projectData?.account_name || '',
              accountNumber: projectData?.account_number || '',
            }}
            projectFiscalDate={fiscalDate}
            setExportType={setExportType}
            setProjectTaskParams={setProjectTaskParams}
            projectCode={projectData?.project_code}
          />
        );

      case 'interactions':
        return (
          <Interactions
            accountInActive={accountInActive || projectInActive}
            projectDetails={projectData}
            setInteractionsParams={setInteractionsParams}
          />
        );
      case 'technicalSummary':
        return (
          <TechnicalSummary
            accountInActive={accountInActive || projectInActive}
            setExportType={setExportType}
            setTechnicalSummaryParams={setTechnicalSummaryParams}
          />
        );
      case 'cases':
        return <NotFound />;
      case 'activities':
        return <NotFound />;
      case 'notes':
        return (
          <Notes
            accountInActive={accountInActive || projectInActive}
            setExportType={setExportType}
            setNotesParams={setNotesParams}
          />
        );
      case 'attachments':
        return (
          <Attachments
            accountOrProjectInActive={accountInActive || projectInActive}
            setExportType={setExportType}
            setAttachmentParams={setAttachmentParams}
            refetchProjectDetails={refetch}
            projectFiscalYear={projectData?.fiscal_year}
          />
        );
      case 'checklists':
        return <NotFound />;
      case 'configuration':
        return <Configuration />;
      default:
        return (
          <div className='pr-4 pl-2 py-2 w-full'>
            <DetailsSectionSkeleton />
          </div>
        );
    }
  };

  const goBack = () => {
    if (parent === 'account') {
      navigate(`${ACCOUNT}/details/${accountID}?list=projects`);
    } else if (parent === 'project') {
      navigate(PROJECT);
    } else {
      navigate(`${ACCOUNT}/details/${accountID}?list=projects`);
    }
  };

  const sideMenuItems = useMemo<MenuItem[]>(() => {
    const allMenus = [
      {
        name: 'Financial Highlights',
        key: 'financial',
        id: AllMenus.FINANCIAL_HIGHLIGHTS,
        disabled: false,
        icon: FinancialIcon,
      },
      {
        name: 'Project Details',
        key: 'projectDetails',
        id: AllModules.PROJECTS,
        disabled: false,
        icon: DetailsIcon,
      },
      {
        name: 'Project Resources',
        key: 'projectResources',
        id: AllModules.PROJECT_RESOURCES,
        disabled: false,
        icon: ResourcesIcon,
      },
      {
        name: 'Project Tasks',
        key: 'projectsTask',
        id: AllModules.PROJECT_TASK,
        disabled: false,
        icon: ProjectsSideIcon,
      },
      {
        name: 'Interactions',
        key: 'interactions',
        id: AllModules.INTERACTIONS,
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
        name: 'Cases',
        key: 'cases',
        id: AllMenus.CASES,
        disabled: false,
        icon: CasesIcon,
      },
      // {
      //   name: 'Activities',
      //   key: 'activities',
      //   id: AllModules.ACTIVITIES,
      //   disabled: false,
      //   icon: ActivitiesIcon,
      // },
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
        name: 'Checklists',
        key: 'checklists',
        id: AllMenus.CHECKLISTS,
        disabled: false,
        icon: ChecklistIcon,
      },
      {
        name: 'Configuration',
        key: 'configuration',
        id: AllMenus.CONFIGURATION,
        disabled: false,
        icon: ConfigIcon,
        subMenu: [
          {
            name: 'Users',
            key: 'users',
            id: AllMenus.MANAGE_ACCOUNT_ACCESS,
            disabled: false,
            icon: ResourcesIcon,
          },
          {
            name: 'Settings',
            key: 'settings',
            id: AllMenus.PROJECT_SETTINGS,
            disabled: false,
            icon: SettingIcon,
          },
        ],
      },
    ];
    return isFinancialHighlightsEnable
      ? allMenus
      : allMenus.filter((item) => item.id !== AllMenus.FINANCIAL_HIGHLIGHTS);
  }, [isFinancialHighlightsEnable]);

  if (!projectIsEnable) return <AccessRestricted />;
  return (
    <div className='flex flex-col h-full'>
      <div className='flex h-[60px]'>
        <PageHeader
          variant='sub'
          placeholder='Project Code'
          icon={
            <ProjectDetailsIcon
              className='h-6 w-6 rounded p-[4px]'
              style={{ backgroundColor: '#AF78FF' }}
            />
          }
          title={data?.data?.project?.project_code}
          totalRecords={5}
          actionItems={menuItems}
          headerButtons={[
            {
              label: 'RD Assessment',
              onClick: handleTriggerAI,
              disabled: accountInActive,
              loading: triggerAIMutation.isPending,
              sx: { ...BUTTON_STYLES, width: '115px', minWidth: '115px' },
              hide: !TriggerAIEnable,
            },
          ]}
          primaryButton={
            isProjectFieldsEditable
              ? {
                  label: 'Edit',
                  onClick: handleEditAccount,
                  disabled: accountInActive,
                }
              : undefined
          }
          onActionsClick={handleActionsClick}
          onSettingsClick={handleSettingsClick}
          showActions={false}
          showSettings={false}
          goBack={goBack}
          backBtnLabel='Back To Projects'
          isLoading={isLoading}
        />
      </div>
      <ProjectInfoSection
        columns={projectDetails}
        loading={isLoading}
        onAdjustmentFactorChange={handleAdjustmentFactor}
      />
      <div className='flex flex-row flex-1 w-full'>
        <div
          className={`flex transition-all duration-300 ease-in-out ${
            isCollapsed
              ? 'w-[60px] min-w-[60px] max-w-[60px]'
              : 'w-[220px] min-w-[220px] max-w-[220px]'
          }`}
        >
          <SideMenuPanel
            menuItems={sideMenuItems}
            activeKey={activeKey as string}
            onSelect={setActiveKey}
            headerTitle='Related List'
            showBackIcon={true}
            isCollapsed={isCollapsed}
            onToggleCollapse={() => setIsCollapsed((prev) => !prev)}
            isLoading={isLoading}
          />
        </div>
        <div
          className='flex-1'
          style={{ maxHeight: 'calc(100vh - 240px)', overflow: 'auto' }}
        >
          <Suspense fallback={null}>{renderContent()}</Suspense>
        </div>
      </div>
    </div>
  );
};

export default ProjectDetails;
