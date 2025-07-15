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
  IAttachmentGraphqlServices
} from "./interfaces/interface";
import { ProjectService } from "./projectService";
import ResourceCostService from "./resourceCostService";
import { ResourceService } from "./resourceServices";
import ResourceSkillService from "./resourceSkillService";
import { AttachmentService } from "./attachmentService";
import { ProjectResourceService } from "./projectResource/projectResourceService";

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
  private logger: Logger;
  private _resourceGraphQlServices? : IResourceGraphQlServices;
  private _resourceCostGraphQlServices? : IResourceCostGraphQlService;
  private _resourceSkillGraphqlServices? : IResourceSkillGraphQlService;
  private _attachmentGraphqlServices? : IAttachmentGraphqlServices;

  constructor(
    logger: Logger,
    resourceService: IResourceService = new ResourceService(),
    resourceCostServices: IResourceCostService = new ResourceCostService(),
    resourceSkillServices: IResourceSkillService = new ResourceSkillService(),
    projectResourceServices: IProjectResourceService = new ProjectResourceService()
  ) {
    try {
      this.logger = logger;
      this.resourceService = resourceService;
      this.resourceCostServices = resourceCostServices;
      this.resourceSkillServices = resourceSkillServices;
      this.projectServices = new ProjectService(this.logger);
      this.attachmentServices = new AttachmentService(this.logger);
      this.projectResourceServices = projectResourceServices;
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
}


export default Services;
