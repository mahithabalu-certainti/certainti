import { selectApi, generateAnswer, ChatLevel, API_REGISTRY } from './aiService';
import {
  getProjectOverview, getProjectFiscalBreakdown, getProjectResources,
  getProjectTasks, getProjectRDCredits, countProjects, listProjects,
  getProjectResourceList, checkPersonOnProject, getProjectPointOfContact,
  getProjectInteractions, getProjectMeetings, getProjectRDAssessment, getProjectResourceFiscal,
  getFourPartAssessment, getTechnicalSummary, getProjectActivities,
  getProjectNotes, getProjectAttachments, getProjectChecklists, getRDAssessmentHistory,
  getAccountSummary, getCaseSummary, getCaseProjects,
  getPlatformSummary, getTopAccountsByProjects,
  resolveActualProjectRid,
} from './queryService';
import { logMessage } from '../utils/logger';

export interface ChatContext {
  level: ChatLevel;
  // identifiers for the selected entity
  project_rid?: string;
  project_name?: string;
  account_rid?: string;
  account_name?: string;
  case_rid?: string;
}

export interface ChatRequest {
  message: string;
  context: ChatContext;
}

export interface ChatResponse {
  response: string;
  api_called: string;
  data?: any;
}

const HELP_MESSAGES: Record<ChatLevel, string> = {
  project: `I can answer detailed questions about this project, including:
- Overview (status, dates, description, R&D qualification)
- Fiscal year breakdown (cost, effort, QRE per year)
- Resources/employees assigned (hours, cost, R&D %)
- Tasks (name, type, hours, cost)
- R&D credit calculations (QRE, credits, percentages)`,

  account: `I can answer questions about this account, including:
- Project summary (total projects, qualified, costs)
- List of projects (with filters by status, R&D qualification)
- Project counts and statistics`,

  case: `I can answer questions about R&D cases, including:
- Case summary (QRE, costs, submission dates, status)
- Projects included in a case`,

  platform: `I can answer platform-wide questions, including:
- Total projects and accounts on the platform
- Top accounts by project count
- Platform-wide QRE and cost summaries`,
};

export async function handleChatMessage(request: ChatRequest): Promise<ChatResponse> {
  const { message } = request;
  let { context } = request;
  const { level } = context;

  logMessage(`chatService: level=${level}, message="${message}"`);

  // The FE sends project_fiscal_rid as project_rid (from URL param).
  // Main DB tables (interactions_summary, project_summary, meeting_summary) store project_fiscal_rid
  // in their project_rid column, so they need the ORIGINAL value.
  // Org DB tables (project_resource, project_fiscal, etc.) use the ACTUAL project_rid.
  // We keep both: projectFiscalRid = original (for main DB), resolvedProjectRid = actual (for org DB).
  let projectFiscalRid = context.project_rid;   // original — used for main DB queries
  let resolvedProjectRid = context.project_rid; // resolved — used for org DB queries

  if (level === 'project' && context.project_rid) {
    const actualRid = await resolveActualProjectRid(context.project_rid);
    if (actualRid) {
      resolvedProjectRid = actualRid;
      logMessage(`chatService: project_fiscal_rid=${projectFiscalRid} → actual project_rid=${resolvedProjectRid}`);
    }
    // Keep context.project_rid as the resolved rid for GPT param injection
    context = { ...context, project_rid: resolvedProjectRid };
  }

  // Help request
  if (message.toLowerCase().match(/^(help|what can you|what do you|capabilities)/)) {
    return { response: HELP_MESSAGES[level], api_called: 'help' };
  }

  // Step 1: Ask GPT to select the right API
  const selection = await selectApi(message, level, {
    project_rid: context.project_rid,
    project_name: context.project_name,
    account_rid: context.account_rid,
    account_name: context.account_name,
    case_rid: context.case_rid,
  });

  logMessage(`chatService: selected API=${selection.api_id}, reason=${selection.reason}`);
  logMessage(`chatService: params=${JSON.stringify(selection.params)}`);

  // Find API definition for description
  const allApis = Object.values(API_REGISTRY).flat();
  const apiDef = allApis.find(a => a.id === selection.api_id);
  const apiDescription = apiDef?.description || selection.api_id;

  // Step 2: Execute the selected API
  const params = selection.params;
  let data: any;

  try {
    switch (selection.api_id) {
      case 'getProjectOverview':
        // project_summary uses project_fiscal_rid in its project_rid column
        data = await getProjectOverview({
          project_rid: params.project_rid || projectFiscalRid,
          project_code: params.project_code,
          project_name: params.project_name || context.project_name,
          account_rid: params.account_rid || context.account_rid,
          account_name: params.account_name || context.account_name,
        });
        break;

      case 'getProjectFiscalBreakdown':
        data = await getProjectFiscalBreakdown(
          params.project_rid || resolvedProjectRid!,
          params.account_rid || context.account_rid!
        );
        break;

      case 'getProjectResources':
        data = await getProjectResources(
          params.project_rid || resolvedProjectRid!,
          params.account_rid || context.account_rid!,
          params.fiscal_year
        );
        break;

      case 'getProjectTasks':
        data = await getProjectTasks(
          params.project_rid || resolvedProjectRid!,
          params.account_rid || context.account_rid!,
          params.fiscal_year
        );
        break;

      case 'getProjectRDCredits':
        data = await getProjectRDCredits(
          params.project_rid || resolvedProjectRid!,
          params.account_rid || context.account_rid!
        );
        break;

      case 'countProjects':
        data = await countProjects({
          account_rid: params.account_rid || context.account_rid,
          account_name: params.account_name || context.account_name,
          status: params.status,
          is_rd_qualified: params.is_rd_qualified,
        });
        break;

      case 'listProjects':
        data = await listProjects({
          account_rid: params.account_rid || context.account_rid,
          account_name: params.account_name || context.account_name,
          project_name: params.project_name,
          project_code: params.project_code,
          status: params.status,
          is_rd_qualified: params.is_rd_qualified,
          limit: params.limit || 10,
        });
        break;

      case 'getAccountSummary':
        data = await getAccountSummary(
          params.account_rid || context.account_rid,
          params.account_name || context.account_name
        );
        break;

      case 'getProjectResourceList':
        data = await getProjectResourceList(
          params.project_rid || resolvedProjectRid!,
          params.account_rid || context.account_rid!
        );
        break;

      case 'checkPersonOnProject':
        data = await checkPersonOnProject(
          params.project_rid || resolvedProjectRid!,
          params.account_rid || context.account_rid!,
          params.person_name || ''
        );
        break;

      case 'getProjectPointOfContact':
        // project_summary uses project_fiscal_rid in its project_rid column
        data = await getProjectPointOfContact(
          params.project_rid || projectFiscalRid!
        );
        break;

      case 'getProjectInteractions':
        // interactions_summary.project_rid stores the project_fiscal_rid
        data = await getProjectInteractions(
          params.project_rid || projectFiscalRid!,
          params.limit || 20
        );
        break;

      case 'getProjectMeetings':
        // meeting_summary.project_rid stores the project_fiscal_rid
        data = await getProjectMeetings(
          params.project_rid || projectFiscalRid!,
          params.limit || 20
        );
        break;

      case 'getProjectRDAssessment':
        data = await getProjectRDAssessment(
          params.project_rid || resolvedProjectRid!,
          params.account_rid || context.account_rid!
        );
        break;

      case 'getProjectResourceFiscal':
        data = await getProjectResourceFiscal(
          params.project_rid || resolvedProjectRid!,
          params.account_rid || context.account_rid!,
          params.fiscal_year
        );
        break;

      case 'getFourPartAssessment':
        data = await getFourPartAssessment(
          params.project_rid || resolvedProjectRid!,
          params.account_rid || context.account_rid!
        );
        break;

      case 'getTechnicalSummary':
        data = await getTechnicalSummary(
          params.project_rid || resolvedProjectRid!,
          params.account_rid || context.account_rid!
        );
        break;

      case 'getProjectActivities':
        data = await getProjectActivities(
          params.project_rid || resolvedProjectRid!,
          params.account_rid || context.account_rid!
        );
        break;

      case 'getProjectNotes':
        data = await getProjectNotes(
          params.project_rid || resolvedProjectRid!,
          params.account_rid || context.account_rid!
        );
        break;

      case 'getProjectAttachments':
        data = await getProjectAttachments(
          params.project_rid || resolvedProjectRid!,
          params.account_rid || context.account_rid!
        );
        break;

      case 'getProjectChecklists':
        data = await getProjectChecklists(
          params.project_rid || resolvedProjectRid!,
          params.account_rid || context.account_rid!
        );
        break;

      case 'getRDAssessmentHistory':
        data = await getRDAssessmentHistory(
          params.project_rid || resolvedProjectRid!,
          params.account_rid || context.account_rid!
        );
        break;

      case 'getCaseSummary':
        data = await getCaseSummary(
          params.account_rid || context.account_rid,
          params.case_rid || context.case_rid
        );
        break;

      case 'getCaseProjects':
        data = await getCaseProjects(
          params.case_rid || context.case_rid!,
          params.account_rid || context.account_rid!
        );
        break;

      case 'getPlatformSummary':
        data = await getPlatformSummary();
        break;

      case 'getTopAccountsByProjects':
        data = await getTopAccountsByProjects(params.limit || 10);
        break;

      default:
        logMessage(`chatService: unknown api_id=${selection.api_id}`);
        return { response: `I couldn't find a way to answer that. Try asking something more specific.`, api_called: selection.api_id };
    }
  } catch (err: any) {
    logMessage(`chatService: data fetch error for ${selection.api_id}: ${err.message}`);
    throw err;
  }

  // Step 3: Generate natural language response
  const response = await generateAnswer(message, selection.api_id, apiDescription, data);

  return { response, api_called: selection.api_id, data };
}
