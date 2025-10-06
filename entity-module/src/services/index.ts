import { Logger } from "winston";
import {
  IProjectGraphQlServices,
  IProjectResourceService,
  IProjectService,
  IResourceCostGraphQlService,
  IResourceCostService,
  IResourceGraphQlServices,
  IResourceService,
  IResourceSkillGraphQlService,
  IResourceSkillService,
  IAttachmentService,
  IAttachmentGraphqlServices,
  IImportListGraphqlServices,
  IProjectTaskService,
  IProjectTaskGraphqlServices,
  ISettingsServices,
  IFinancialHighlights,
  IProjectTaskIngestionService,
  INotesService,
  ITemplates,
  INotesGraphqlServices
} from "./interfaces/interface";
import { ProjectService } from "./projectService";
import ResourceCostService from "./resourceCostService";
import { ResourceService } from "./resourceServices";
import ResourceSkillService from "./resourceSkillService";
import { AttachmentService } from "./attachmentService";
import { ProjectResourceService } from "./projectResource/projectResourceService";
import { ProjectTaskService } from "./projectTaskService";
import { ProjectInjestionTaskService } from "./projectTask/projectTaskService";
import { NotesService } from "./notes/notesService";
import { TemplateService } from "./templates/templateService";

interface IServiceContainer {
  resourceCostServices: IResourceCostService;
}

class Services implements IServiceContainer {
  resourceService: IResourceService;
  resourceCostServices: IResourceCostService;
  resourceSkillServices: IResourceSkillService;
  projectServices: IProjectService;
  private _projectGraphQlServices?: IProjectGraphQlServices;
  attachmentServices: IAttachmentService;
  projectResourceServices: IProjectResourceService;
  projectTaskServices: IProjectTaskService;
  projectTaskInjestionServices: IProjectTaskIngestionService;
  templateServices: ITemplates;

  private logger: Logger;
  private _resourceGraphQlServices? : IResourceGraphQlServices;
  private _resourceCostGraphQlServices? : IResourceCostGraphQlService;
  private _resourceSkillGraphqlServices? : IResourceSkillGraphQlService;
  private _attachmentGraphqlServices? : IAttachmentGraphqlServices;
  private _importGraphqlService? : IImportListGraphqlServices;
  private _projectTaskGraphqlServices? : IProjectTaskGraphqlServices;
  private _settingService? : ISettingsServices;
  private _financialHighlightServices? : IFinancialHighlights;
  private _notesGraphqlServices? : INotesGraphqlServices
  notesService : INotesService;

  constructor(
    logger: Logger,
    resourceService: IResourceService = new ResourceService(),
    resourceCostServices: IResourceCostService = new ResourceCostService(),
    resourceSkillServices: IResourceSkillService = new ResourceSkillService(),
    projectResourceServices: IProjectResourceService = new ProjectResourceService(logger),
    projectTaskInjestionServices: IProjectTaskIngestionService = new ProjectInjestionTaskService(),
    notesService : INotesService = new NotesService(logger),
    templateServices:  ITemplates = new TemplateService()
  ) {
    try {
      this.logger = logger;
      this.resourceService = resourceService;
      this.resourceCostServices = resourceCostServices;
      this.resourceSkillServices = resourceSkillServices;
      this.projectServices = new ProjectService(this.logger);
      this.attachmentServices = new AttachmentService(this.logger);
      this.projectResourceServices = projectResourceServices;
      this.projectTaskServices = new ProjectTaskService(this.logger);
      this.projectTaskInjestionServices = projectTaskInjestionServices;
      this.notesService = notesService
      this.templateServices = templateServices;
    } catch (error) {
      console.log("Error initializing service: ", error);
      throw new Error("Service Initialization failed!");
    }
  }

  get projectGraphQlServices(): IProjectGraphQlServices {
    if (!this._projectGraphQlServices) {
      const { default: ProjectGraphQlServices } = require("../services/projectGraphqlServices.ts");
      this._projectGraphQlServices = new ProjectGraphQlServices();
    }
    return this._projectGraphQlServices!;
  }

  get resourceGraphQlServices() : IResourceGraphQlServices {
    if(!this._resourceGraphQlServices) {
      const {default : ResourceGraphQlServices} = require('../services/resourceGraphQlServices.ts')
      this._resourceGraphQlServices = new ResourceGraphQlServices();
    }
    return this._resourceGraphQlServices!;
  }

  get resourceCostGraphQlServices() : IResourceCostGraphQlService {
    if(!this._resourceCostGraphQlServices) {
      const {default : ResourceCostGraphQlService} = require('../services/resourceCostGraphQlServices')
      this._resourceCostGraphQlServices = new ResourceCostGraphQlService();
    }
    return this._resourceCostGraphQlServices!
  }

  get resourceSkillGraphqlServices() : IResourceSkillGraphQlService {
    if(!this._resourceSkillGraphqlServices) {
      const {default : ResourceSkillGraphQlService} = require('../services/resourceSkillGraphqlService.ts')
      this._resourceSkillGraphqlServices = new ResourceSkillGraphQlService()
    }
    return this._resourceSkillGraphqlServices!
  }

  get attachmentGraphqlServices() : IAttachmentGraphqlServices {
    if(!this._attachmentGraphqlServices) {
      const {default : AttachmentGraphqlServies} = require('../services/attachmentGraphqlService')
      this._attachmentGraphqlServices = new AttachmentGraphqlServies
    }
    return this._attachmentGraphqlServices!
  }
  get importGraphqlServices() : IImportListGraphqlServices {
    if(!this._importGraphqlService) {
      const {default : IImportListGraphqlServices} = require('../services/importGraphqlServices')
      this._importGraphqlService = new IImportListGraphqlServices()
    }
    return this._importGraphqlService!
  }
 get projectTaskGraphqlServices() : IProjectTaskGraphqlServices {
    if(!this._projectTaskGraphqlServices) {
      const {default : ProjectTaskGraphqlServies} = require('../services/projectTaskGraphqlService')
      this._projectTaskGraphqlServices = new ProjectTaskGraphqlServies();
    }
    return this._projectTaskGraphqlServices!
  }
  get settingServices() : ISettingsServices {
    if(!this._settingService) {
      const {default : SettingService} = require('../services/settingsServices')
      this._settingService = new SettingService()
    }
    return this._settingService!
  }

  get financialHighlightServies() : IFinancialHighlights {
    if(!this._financialHighlightServices) {
      const {default : FinancialHighlightsService } = require('../services/financialHighlightsServices')
      this._financialHighlightServices = new FinancialHighlightsService()
    }
    return this._financialHighlightServices!
  }

  get notesGraphqlServices() : INotesGraphqlServices {
    if(!this._notesGraphqlServices) {
      const {default : NotesGraphqlServies} = require('../services/notes/notesGraphqlServices')
      this._notesGraphqlServices = new NotesGraphqlServies
    }
    return this._notesGraphqlServices!
  }

}


export default Services;
