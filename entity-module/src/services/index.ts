import { Logger } from "winston";
import {
  IProjectService,
  IResourceCostService,
  IResourceService,
  IResourceSkillService,
} from "./interfaces/interface";
import { ProjectService } from "./projectService";
import ResourceCostService from "./resourceCostService";
import { ResourceService } from "./resourceServices";
import ResourceSkillService from "./resourceSkillService";

interface IServiceContainer {
  resourceCostServices: IResourceCostService;
}

class Services implements IServiceContainer {
  resourceService: IResourceService;
  resourceCostServices: IResourceCostService;
  resourceSkillServices: IResourceSkillService;
  projectServices: IProjectService;
  private logger: Logger;

  constructor(
    logger: Logger,
    resourceService: IResourceService = new ResourceService(),
    resourceCostServices: IResourceCostService = new ResourceCostService(),
    resourceSkillServices: IResourceSkillService = new ResourceSkillService()
  ) {
    try {
      this.logger = logger;
      this.resourceCostServices = resourceCostServices;
      this.resourceService = resourceService;
      this.resourceCostServices = resourceCostServices;
      this.resourceSkillServices = resourceSkillServices;
      this.projectServices = new ProjectService(this.logger);
    } catch (error) {
      console.log("Error initializing service : ", error);
      throw new Error("Service Initialization failed!");
    }
  }
}

export default Services;
