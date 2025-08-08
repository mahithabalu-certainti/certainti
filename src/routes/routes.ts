export const MAIN_ROUTE = '/';

export const LOGIN = '/login';
export const PROFILE = '/profile';

export const MANAGE_USER = '/manage-user';
export const MANAGE_USER_ACCESS = '/manage-user-access';
export const MANAGE_ACCOUNT_ACCESS = '/manage-account-access';
export const MANAGE_SETTINGS = '/manage-settings';
export const MANAGE_GEO_BASED_RULE = '/manage-geo-based-rule';
export const IMPORT_TEMPLATES = '/import-templates';
export const INTERACTION_TEMPLATES = '/interaction-templates';
export const EMAIL_TEMPLATES = '/email-templates';
export const SURVEY_TEMPLATES = '/survey-templates';
export const TASK_TEMPLATES = '/task-templates';
export const CHECKLIST_TEMPLATES = '/checklist-templates';

/** ADMIN ROUTES */
export const ADMIN = '/admin';
export const ADMIN_MANAGE_USER = `${ADMIN}/manage-user`;
export const ADMIN_MANAGE_USER_DETAILS = `${ADMIN_MANAGE_USER}/:userid`;
export const ADMIN_CREATE_USER = `${ADMIN_MANAGE_USER}/create`;
export const ADMIN_EDIT_USER = `${ADMIN_MANAGE_USER}/edit/:userid`;
export const USER_EXTENDED_PERMISSION = `${ADMIN_MANAGE_USER}/extended-permission/:userid`;
/** PROFILE ROUTES */
export const MANAGE_PROFILE = `${ADMIN}/manage-profile`;
export const MANAGE_PROFILE_CREATE = `${MANAGE_PROFILE}/create`;
export const MANAGE_PROFILE_EDIT = `${MANAGE_PROFILE}/edit/:profileId`;
export const MANAGE_PROFILE_VIEW = `${MANAGE_PROFILE}/view/:profileId`;
/** USER GROUP ROUTES */
export const MANAGE_USER_GROUP = `${ADMIN}/manage-user-group`;
export const MANAGE_USER_GROUP_CREATE = `${MANAGE_USER_GROUP}/create`;
export const MANAGE_USER_GROUP_EDIT = `${MANAGE_USER_GROUP}/edit/:groupId`;

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
// ATTACHMENT ROUTES
export const ATTACHMENTS = '/attachments';

//CASES ROUTES
export const CASE = '/case';
export const CASE_EDIT = `${CASE}/edit`;

export const NOT_FOUND = '/page-not-found';
export const NOT_MATCH = '*';
