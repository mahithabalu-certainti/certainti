export const MAIN_ROUTE = '/';

export const LOGIN = '/login';
export const PROFILE = '/profile';
export const EMAIL_INTERACTION = '/ext/interaction';

export const MANAGE_USER = '/manage-user';
export const MANAGE_USER_ACCESS = '/manage-user-access';
export const SURVEY_TEMPLATES = '/survey-templates';

/** ADMIN ROUTES */
export const ADMIN = '/admin';
export const ADMIN_MANAGE_USER = `${ADMIN}/manage-user`;
export const ADMIN_MANAGE_USER_DETAILS = `${ADMIN_MANAGE_USER}/:userid`;
export const ADMIN_CREATE_USER = `${ADMIN_MANAGE_USER}/create`;
export const ADMIN_EDIT_USER = `${ADMIN_MANAGE_USER}/edit/:userid`;
export const USER_EXTENDED_PERMISSION = `${ADMIN_MANAGE_USER}/extended-permission/:userid`;
export const MANAGE_SETTINGS = `${ADMIN}/manage-settings`;
export const MANAGE_ACCOUNT_ACCESS = `${ADMIN}/manage-account-access`;
/** PROFILE ROUTES */
export const MANAGE_PROFILE = `${ADMIN}/manage-profile`;
export const MANAGE_PROFILE_CREATE = `${MANAGE_PROFILE}/create`;
export const MANAGE_PROFILE_EDIT = `${MANAGE_PROFILE}/edit/:profileId`;
export const MANAGE_PROFILE_VIEW = `${MANAGE_PROFILE}/view/:profileId`;
/** USER GROUP ROUTES */
export const MANAGE_USER_GROUP = `${ADMIN}/manage-user-group`;
export const MANAGE_USER_GROUP_CREATE = `${MANAGE_USER_GROUP}/create`;
export const MANAGE_USER_GROUP_EDIT = `${MANAGE_USER_GROUP}/edit/:groupId`;

/** ADMIN TEMPLATES ROUTES */
export const INTERACTION_TEMPLATES = `${ADMIN}/interaction-templates`;
export const INTERACTION_TEMPLATES_CREATE = `${INTERACTION_TEMPLATES}/create`;
export const INTERACTION_TEMPLATES_EDIT = `${INTERACTION_TEMPLATES}/edit/:templateId`;

/** ADMIN IMPORT TEMPLATES ROUTES */
export const IMPORT_TEMPLATES = `${ADMIN}/import-templates`;

/** ADMIN EMAIL TEMPLATES ROUTES */
export const EMAIL_TEMPLATES = `${ADMIN}/email-templates`;
export const EMAIL_TEMPLATES_CREATE = `${EMAIL_TEMPLATES}/create`;
export const EMAIL_TEMPLATES_EDIT = `${EMAIL_TEMPLATES}/edit/:templateId`;

/** ADMIN TASK TEMPLATES ROUTES */
export const TASK_TEMPLATES = `${ADMIN}/task-templates`;
export const TASK_TEMPLATES_CREATE = `${TASK_TEMPLATES}/create`;
export const TASK_TEMPLATES_EDIT = `${TASK_TEMPLATES}/edit/:templateId`;
export const TASK_TEMPLATES_DETAILS = `${TASK_TEMPLATES}/details/:templateId`;

/** ADMIN CHECKLIST TEMPLATES ROUTES */
export const CHECKLIST_TEMPLATES = `${ADMIN}/checklist-templates`;
export const CHECKLIST_TEMPLATES_CREATE = `${CHECKLIST_TEMPLATES}/create`;
export const CHECKLIST_TEMPLATES_EDIT = `${CHECKLIST_TEMPLATES}/edit/:caseId`;

// ADMIN GEO BASED RULE ROUTES
export const MANAGE_GEO_BASED_RULE = `${ADMIN}/manage-jurisdiction-rule`;
export const MANAGE_GEO_BASED_RULE_CREATE = `${MANAGE_GEO_BASED_RULE}/create`;
export const MANAGE_GEO_BASED_RULE_EDIT = `${MANAGE_GEO_BASED_RULE}/edit/:ruleId/:config_rid`;

/** ADMIN WORKFLOW BUILDER ROUTES */
export const WORKFLOW_BUILDER = `${ADMIN}/workflow-builder`;
export const WORKFLOW_BUILDER_CREATE = `${WORKFLOW_BUILDER}/create`;
export const WORKFLOW_BUILDER_EDIT = `${WORKFLOW_BUILDER}/edit/:ruleId`;

/** ADMIN DATA MAPPER ROUTES */
export const DATA_MAPPER = `${ADMIN}/data-mapper`;
export const DATA_MAPPER_CREATE = `${DATA_MAPPER}/create`;
export const DATA_MAPPER_EDIT = `${DATA_MAPPER}/edit/:mapperId`;
export const DATA_MAPPER_CONFIG = `${DATA_MAPPER}/config/:mapperId`;

/** ACCOUNT ROUTES */
export const ACCOUNT = '/account';
export const ACCOUNT_CREATE = `${ACCOUNT}/create`;
export const ACCOUNT_EDIT = `${ACCOUNT}/edit/:accountid`;
export const ACCOUNT_DETAILS = `${ACCOUNT}/details/:accountid`;

/** RESOURCES ROUTES */
export const RESOURCE = '/resource';
export const RESOURCE_CREATE = `${RESOURCE}/create`;
export const RESOURCE_EDIT = `${RESOURCE}/edit/:resourcesid`;

// Resource cost route
export const RESOURCECOST = '/resource/cost';
export const RESOURCECOST_CREATE = `${RESOURCECOST}/create`;
export const RESOURCECOST_EDIT = `${RESOURCECOST}/edit/:costid`;

// Resource skill route
export const RESOURCESKILL = '/resource/skill';
export const RESOURCESKILL_CREATE = `${RESOURCESKILL}/create`;
export const RESOURCESKILL_EDIT = `${RESOURCESKILL}/edit/:skillid`;

/** PROJECT ROUTES */
export const PROJECT = '/project';
export const PROJECT_CREATE = `${PROJECT}/create`;
export const PROJECT_EDIT = `${PROJECT}/edit/:projectid`;
export const PROJECT_DETAILS = `${PROJECT}/details/:projectid`;
//Project Task route
export const PROJECT_TASK = '/project/task';
export const PROJECT_TASK_CREATE = `${PROJECT_TASK}/create`;
export const PROJECT_TASK_EDIT = `${PROJECT_TASK}/edit/:taskId`;

//Project resources route
export const PROJECT_RESOURCE = '/project/resource';
export const PROJECT_RESOURCE_CREATE = `${PROJECT_RESOURCE}/create`;
export const PROJECT_RESOURCE_EDIT = `${PROJECT_RESOURCE}/edit/:resourceId`;

// Interaction route
export const INTERACTIONS = '/interactions';
export const INTERACTIONS_DETAILS = '/interactions/details/:projectid';
export const INTERACTIONS_BASE = `/:module/interactions`;
export const INTERACTIONS_CREATE = `${INTERACTIONS_BASE}/create`;
export const INTERACTIONS_EDIT = `${INTERACTIONS_BASE}/edit/:interactionId`;
export const GLOBAL_INTERACTIONS_CREATE = `${INTERACTIONS}/create`;
export const GLOBAL_INTERACTIONS_EDIT = `${INTERACTIONS}/edit/:interactionId`;
export const ACCOUNT_INTERACTIONS_CREATE = `${INTERACTIONS_BASE}/account-create`;
export const CASE_INTERACTIONS_CREATE = `${INTERACTIONS_BASE}/case-create`;
export const CASE_INTERACTIONS_EDIT = `${INTERACTIONS_BASE}/case/edit/:interactionId`;
// Notes routes
export const NOTES = '/notes';
export const NOTES_BASE = `/:module/notes`;
export const NOTES_CREATE = `${NOTES_BASE}/create`;
export const NOTES_EDIT = `${NOTES_BASE}/edit/:noteId`;
export const GLOBAL_NOTES_EDIT = `${NOTES}/edit/:noteId`;

// Checklist routes
export const CHECKLIST = '/checklist';
export const CHECKLIST_BASE = `/:module/checklist`;
export const CHECKLIST_CREATE = `${CHECKLIST_BASE}/create`;
export const CHECKLIST_EDIT = `${CHECKLIST_BASE}/edit/:checklistId`;

// Activities routes
export const ACTIVITY_BASE = '/:module/activity';
export const ACTIVITY_CREATE = `${ACTIVITY_BASE}/create/:type`;
export const ACTIVITY_EDIT = `${ACTIVITY_BASE}/edit/:type/:activityId`;

// ATTACHMENT ROUTES
export const ATTACHMENTS = '/attachments';

// TASKS ROUTES
export const TASKS = '/tasks';

//CASES ROUTES
export const CASE = '/case';
export const CASE_DETAILS = `${CASE}/details/:caseId`;
export const CASE_EDIT = `${CASE}/edit/:caseId`;
export const CASE_CREATE = `${CASE}/create`;

export const NOT_FOUND = '/page-not-found';
export const NOT_MATCH = '*';
