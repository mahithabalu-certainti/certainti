import resoucesController from "./resourceController";
import resourceCostController from "./resourceCostController";
import resourceSkillController from "./resourceSkillController";
import projectController from "./projectController";
import attachmentController from "./attachmentController";
import projectResourcesController from "./projectResourcesController";
import importListController from './importListController';
import projectTaskController from './projectTaskController';
import settingController from '../controllers/settingsController'
import financialController from '../controllers/financialHighlightsController'

const controller = {
    resoucesController,
    resourceCostController,
    resourceSkillController,
    projectController,
    attachmentController,
    projectResourcesController,
    importListController,
    projectTaskController,
    settingController,
    financialController
};

export default controller;
