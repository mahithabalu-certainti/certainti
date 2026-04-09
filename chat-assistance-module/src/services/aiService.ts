import axios from 'axios';
import { logMessage } from '../utils/logger';

export type ChatLevel = 'project' | 'account' | 'case' | 'platform';

// ─── API Registry ─────────────────────────────────────────────────────────────
// Each API entry describes what it returns so GPT can choose the right one.

export interface ApiDefinition {
  id: string;
  description: string;
  params: string[];
}

export const API_REGISTRY: Record<ChatLevel, ApiDefinition[]> = {
  project: [
    {
      id: 'getProjectOverview',
      description: 'Get full project overview: name, code, status, dates, R&D qualification, QRE, total cost, total effort, blended rates, FTE/subcon counts, description, program, group, point of contact.',
      params: ['project_rid', 'project_code', 'project_name', 'account_rid'],
    },
    {
      id: 'getProjectFiscalBreakdown',
      description: 'Get year-by-year fiscal breakdown for a project: per-fiscal-year cost, effort, FTE, subcon, blended rates, QRE (FTE/subcon/nonlabor), R&D credits at federal level, R&D percentage potential and final, assessment status.',
      params: ['project_rid', 'account_rid'],
    },
    {
      id: 'getProjectResources',
      description: 'List all resources/employees assigned to a project with their hours, cost, R&D percentage, QRE contribution, skill role, and status. Optionally filter by fiscal year.',
      params: ['project_rid', 'account_rid', 'fiscal_year?'],
    },
    {
      id: 'getProjectTasks',
      description: 'List all tasks in a project with task name, type, classification, hours, cost, start/end dates, and status. Optionally filter by fiscal year.',
      params: ['project_rid', 'account_rid', 'fiscal_year?'],
    },
    {
      id: 'getProjectRDCredits',
      description: 'Get R&D credit calculations for a project per fiscal year: QRE breakdown (FTE/subcon/nonlabor), R&D percentages (potential AI / adjustment / final), federal R&D credits, total credits, and qualification status.',
      params: ['project_rid', 'account_rid'],
    },
    {
      id: 'countProjects',
      description: 'Get count of projects: total, R&D qualified, not qualified, and active. Can filter by account.',
      params: ['account_rid?', 'account_name?', 'status?'],
    },
    {
      id: 'listProjects',
      description: 'List multiple projects with summary info: name, code, status, dates, QRE, total cost. Use when user asks to show/list multiple projects.',
      params: ['account_rid?', 'project_name?', 'status?', 'is_rd_qualified?', 'limit?'],
    },
    {
      id: 'getProjectResourceList',
      description: 'List all resources/people/employees working on this project with their name, designation, skill role, fiscal year, hours, cost, R&D percentage, QRE, and start/end dates.',
      params: ['project_rid', 'account_rid'],
    },
    {
      id: 'checkPersonOnProject',
      description: 'Check if a specific named person is working on this project. Returns yes/no with their details if found. Use when user asks "is [name] working on this project?" or "does [name] work here?".',
      params: ['project_rid', 'account_rid', 'person_name'],
    },
    {
      id: 'getProjectPointOfContact',
      description: 'Get the point of contact and technical point of contact for this project with their name and email.',
      params: ['project_rid'],
    },
    {
      id: 'getProjectInteractions',
      description: 'List all interactions/emails sent for a project: type, source, sent date, recipient, response status, interaction age, attachment count.',
      params: ['project_rid', 'limit?'],
    },
    {
      id: 'getProjectMeetings',
      description: 'List all meetings/activities scheduled for a project: subject, start/end datetime, participants, recurrence type, minutes of meeting, status.',
      params: ['project_rid'],
    },
    {
      id: 'getFourPartAssessment',
      description: 'Get the four-part R&D assessment for the project: permitted purpose, technological uncertainty, technological in nature, process of experimentation — each with status and rationale. Also includes rd_potential_category, summary_judgment, and tracker one-liner.',
      params: ['project_rid', 'account_rid'],
    },
    {
      id: 'getTechnicalSummary',
      description: 'Get AI-generated technical summaries for the project per fiscal year: the full technical_summary text, version, generation date, status, and any refinement prompts used.',
      params: ['project_rid', 'account_rid'],
    },
    {
      id: 'getProjectActivities',
      description: 'List all activities for the project: emails, meetings, calls, tasks — with subject, description, type, start/end datetime, assigned_to, meeting participants, attendees, minutes of meeting, transcript.',
      params: ['project_rid', 'account_rid'],
    },
    {
      id: 'getProjectNotes',
      description: 'List all notes added to the project: title, description/content, fiscal year, notes owner, document name, format, created date.',
      params: ['project_rid', 'account_rid'],
    },
    {
      id: 'getProjectAttachments',
      description: 'List all attachments/documents uploaded to the project: document name, fiscal year, format (PDF/XLSX/etc), size in MB, comments, created date, and download link when available.',
      params: ['project_rid', 'account_rid'],
    },
    {
      id: 'getProjectChecklists',
      description: 'Get all checklists for the project with their name, description, fiscal year, assigned to, total items count, and completed items count.',
      params: ['project_rid', 'account_rid'],
    },
    {
      id: 'getRDAssessmentHistory',
      description: 'Get the full R&D assessment history for the project per fiscal year: assessment status progression, R&D percentages (AI potential, adjustment, final), QRE, credits, qualification status, signoff, and claim status with timestamps.',
      params: ['project_rid', 'account_rid'],
    },
    {
      id: 'getProjectRDAssessment',
      description: 'Get R&D assessment details per fiscal year: R&D percentage (AI potential, adjustment, final), QRE breakdown, qualification status, signoff, and claim status.',
      params: ['project_rid', 'account_rid'],
    },
    {
      id: 'getProjectResourceFiscal',
      description: 'Get per-resource fiscal data: resource name, code, hours, cost, R&D percentage, QRE (FTE/subcon/nonlabor), R&D credits, blended cost per fiscal year.',
      params: ['project_rid', 'account_rid', 'fiscal_year?'],
    },
  ],
  account: [
    {
      id: 'getAccountSummary',
      description: 'Get account-level summary: total projects, R&D qualified projects, total QRE, total cost, total effort, FTE, subcon, active projects.',
      params: ['account_rid', 'account_name?'],
    },
    {
      id: 'listProjects',
      description: 'List all projects for an account with name, code, status, dates, QRE, cost.',
      params: ['account_rid', 'status?', 'is_rd_qualified?', 'limit?'],
    },
    {
      id: 'countProjects',
      description: 'Count projects for an account: total, R&D qualified, not qualified, active.',
      params: ['account_rid', 'status?'],
    },
  ],
  case: [
    {
      id: 'getCaseSummary',
      description: 'Get R&D case summary: case name, fiscal year, total projects, total project cost, total R&D cost, QRE, qualified projects, completion percentage, submission and approval dates, status.',
      params: ['account_rid', 'case_rid?'],
    },
    {
      id: 'getCaseProjects',
      description: 'List all projects in a case with their fiscal year, QRE, R&D credits, R&D percentage, and assessment status.',
      params: ['case_rid', 'account_rid'],
    },
  ],
  platform: [
    {
      id: 'getPlatformSummary',
      description: 'Get platform-wide statistics: total accounts, total projects, R&D qualified projects, total QRE across the platform, total cost, total effort.',
      params: [],
    },
    {
      id: 'getTopAccountsByProjects',
      description: 'List top accounts by number of projects with their total projects, R&D qualified count, and QRE.',
      params: ['limit?'],
    },
    {
      id: 'countProjects',
      description: 'Count all projects on the platform.',
      params: [],
    },
  ],
};

// ─── Azure OpenAI helpers ─────────────────────────────────────────────────────

function getAzureOpenAIUrl(): string {
  const endpoint = (process.env.AZURE_OPENAI_API_ENDPOINT_URL || '').replace(/\/$/, '');
  const deployment = process.env.AZURE_OPENAI_API_DEPLOYMENT_PRIMARY || 'gpt-4o';
  const version = process.env.AZURE_OPENAI_API_VERSION || '2024-08-01-preview';
  return `${endpoint}/openai/deployments/${deployment}/chat/completions?api-version=${version}`;
}

function getHeaders() {
  return {
    'Content-Type': 'application/json',
    'api-key': process.env.AZURE_OPENAI_API_KEY || '',
  };
}

// ─── Step 1: Select API ───────────────────────────────────────────────────────

export interface ApiSelection {
  api_id: string;
  params: Record<string, any>;
  reason: string;
}

export async function selectApi(
  userMessage: string,
  level: ChatLevel,
  context: Record<string, any>
): Promise<ApiSelection> {
  const apis = API_REGISTRY[level];
  const apiList = apis.map(a => `- ${a.id}: ${a.description} (params: ${a.params.join(', ')})`).join('\n');
  const contextStr = Object.entries(context).filter(([, v]) => v).map(([k, v]) => `${k}: ${v}`).join(', ');

  const systemPrompt = `You are an API selector for ThinkR&D 365 platform.
Given a user question and available APIs, choose the BEST API to answer it and extract any filter parameters from the question.
Return ONLY valid JSON, no markdown.

Context from UI: ${contextStr || 'none'}
Chat level: ${level}

Available APIs:
${apiList}

JSON format:
{
  "api_id": "<one of the api ids above>",
  "params": {
    "project_rid": "<value or null>",
    "account_rid": "<from context if available or null>",
    "fiscal_year": "<e.g. 2024 or null>",
    "project_name": "<extracted from question or null>",
    "project_code": "<extracted from question or null>",
    "status": "<extracted from question or null>",
    "is_rd_qualified": "<true/false/null>",
    "person_name": "<person name extracted from question if asking about a specific person, else null>",
    "limit": "<number or null>"
  },
  "reason": "<brief reason for picking this api>"
}`;

  try {
    const response = await axios.post(
      getAzureOpenAIUrl(),
      {
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
        temperature: 0.1,
        max_tokens: 400,
      },
      { headers: getHeaders(), timeout: 15000 }
    );

    const content = response.data?.choices?.[0]?.message?.content || '';
    logMessage(`selectApi GPT response: ${content}`);
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON in response');
    const parsed: ApiSelection = JSON.parse(jsonMatch[0]);

    // Always inject context values if not already set by GPT
    if (context.project_rid && !parsed.params.project_rid) parsed.params.project_rid = context.project_rid;
    if (context.account_rid && !parsed.params.account_rid) parsed.params.account_rid = context.account_rid;
    if (context.case_rid && !parsed.params.case_rid) parsed.params.case_rid = context.case_rid;

    return parsed;
  } catch (err: any) {
    logMessage(`selectApi error: ${err.message} — using fallback`);
    return fallbackApiSelection(userMessage, level, context, apis);
  }
}

// ─── Step 2: Generate answer ──────────────────────────────────────────────────

export async function generateAnswer(
  userMessage: string,
  apiId: string,
  apiDescription: string,
  data: any
): Promise<string> {
  const isEmpty = !data || (Array.isArray(data) && data.length === 0);

  const systemPrompt = `You are a helpful assistant for ThinkR&D 365, an R&D tax credit platform.
Answer the user's question concisely and clearly.
- Format currency values with $ and commas (e.g. $1,234,567.89)
- Format percentages with 2 decimal places (e.g. 45.23%)
- Format dates as Month DD, YYYY
- If data has multiple rows, summarise the key points
- Be professional and specific — use actual values from the data
- If no data is available, respond naturally and helpfully — do NOT say "no records found". Instead say something like "I don't have that information available for this project right now" or "That data hasn't been recorded yet" or similar conversational phrasing. Suggest what else the user could ask.
- ATTACHMENTS: If the data contains a "download_url" field, render it as a clickable markdown link like this: [Download document_name](download_url). Always include the download link for every attachment row that has a download_url.`;

  const userPrompt = isEmpty
    ? `User asked: "${userMessage}"
I tried to look up: ${apiDescription}
No data was returned. Respond naturally — do not use robotic error messages. Be conversational and suggest related things the user could ask about instead.`
    : `User asked: "${userMessage}"
API called: ${apiId} (${apiDescription})
Data returned: ${JSON.stringify(data, null, 2)}
Answer the question using this data.`;

  try {
    const response = await axios.post(
      getAzureOpenAIUrl(),
      {
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.3,
        max_tokens: 800,
      },
      { headers: getHeaders(), timeout: 20000 }
    );

    return response.data?.choices?.[0]?.message?.content || formatFallback(apiId, data);
  } catch (err: any) {
    logMessage(`generateAnswer error: ${err.message}`);
    return formatFallback(apiId, data);
  }
}

// ─── Fallbacks ────────────────────────────────────────────────────────────────

function fallbackApiSelection(
  message: string,
  level: ChatLevel,
  context: Record<string, any>,
  apis: ApiDefinition[]
): ApiSelection {
  const lower = message.toLowerCase();
  let api_id = apis[0].id;

  if (lower.match(/attachment|attachments|document|documents|file|files|download/)) api_id = 'getProjectAttachments';
  else if (lower.match(/note|notes/)) api_id = 'getProjectNotes';
  else if (lower.match(/meeting|meetings|calendar/)) api_id = 'getProjectMeetings';
  else if (lower.match(/interaction|interactions|email|emails/)) api_id = 'getProjectInteractions';
  else if (lower.match(/checklist|checklists/)) api_id = 'getProjectChecklists';
  else if (lower.match(/how many|count|total/)) api_id = 'countProjects';
  else if (lower.match(/list|show|all|multiple/)) api_id = 'listProjects';
  else if (lower.match(/resource|employee|staff|team/)) api_id = 'getProjectResources';
  else if (lower.match(/task|work|activity/)) api_id = 'getProjectTasks';
  else if (lower.match(/fiscal|year|annual|breakdown/)) api_id = 'getProjectFiscalBreakdown';
  else if (lower.match(/credit|qre|r&d|rd |qualification/)) api_id = 'getProjectRDCredits';
  else if (lower.match(/case/)) api_id = 'getCaseSummary';
  else if (lower.match(/platform|overall|all accounts/)) api_id = 'getPlatformSummary';

  // Validate the selected api_id exists in this level
  if (!apis.find(a => a.id === api_id)) api_id = apis[0].id;

  return {
    api_id,
    params: {
      project_rid: context.project_rid || null,
      account_rid: context.account_rid || null,
      case_rid: context.case_rid || null,
    },
    reason: 'fallback keyword match',
  };
}

function formatFallback(apiId: string, data: any): string {
  if (!data || (Array.isArray(data) && data.length === 0)) {
    return "I don't have that information available for this project right now. You could try asking about the project overview, resources, R&D credits, or fiscal breakdown instead.";
  }
  if (apiId === 'countProjects' && data?.total !== undefined) {
    return `Total projects: ${data.total}. R&D qualified: ${data.rd_qualified}. Active: ${data.active}.`;
  }
  if (apiId === 'getProjectAttachments' && Array.isArray(data)) {
    const lines = data.slice(0, 5).map((attachment: any) => {
      const parts = [
        attachment.document_name || 'Unnamed attachment',
        attachment.fiscal_year ? `FY ${attachment.fiscal_year}` : null,
        attachment.format || null,
        attachment.size_in_mb ? `${attachment.size_in_mb} MB` : null,
      ].filter(Boolean);
      const link = attachment.download_link ? ` Download: ${attachment.download_link}` : '';
      return `- ${parts.join(' | ')}${link}`;
    });
    return `I found ${data.length} attachment(s) for this project:\n${lines.join('\n')}`;
  }
  if (Array.isArray(data)) {
    const names = data.slice(0, 5).map((d: any) => d.project_name || d.case_name || d.account_name || d.rid).filter(Boolean).join(', ');
    return `Found ${data.length} record(s): ${names}${data.length > 5 ? '...' : ''}`;
  }
  if (data?.project_name) {
    return `Project: ${data.project_name} | Status: ${data.status} | R&D Qualified: ${data.is_rd_qualified ? 'Yes' : 'No'} | QRE: $${parseFloat(data.qre || 0).toLocaleString()}`;
  }
  return `Data retrieved successfully. ${JSON.stringify(data).slice(0, 200)}`;
}
