export const MAIN_ROUTE = '/';

export const LOGIN = '/login';

export const MANAGE_USER = '/manage-user';
export const MANAGE_PROFILE = '/manage-profile';
export const MANAGE_USER_GROUP = '/manage-user-group';
export const MANAGE_USER_ACCESS = '/manage-user-access';
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

/** ACCOUNT ROUTES */

export const ACCOUNT = '/account';
export const ACCOUNT_CREATE = `${ACCOUNT}/create`;
export const ACCOUNT_EDIT = `${ACCOUNT}/edit/:accountid`;
export const ACCOUNT_DETAILS = `${ACCOUNT}/details/:accountid`;

/** RESOURCES ROUTES */

export const RESOURCE = '/resource';
export const RESOURCE_CREATE = `${RESOURCE}/create`;
export const RESOURCE_EDIT = `${RESOURCE}/edit/:resourcesid`;

/** PROJECT ROUTES */

export const PROJECT = '/project';
export const PROJECT_CREATE = `${PROJECT}/create`;
export const PROJECT_EDIT = `${PROJECT}/edit/:projectid`;

export const NOT_FOUND = '*';
