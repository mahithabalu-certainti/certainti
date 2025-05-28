import {
  IProjectService,
  IResourceCostService,
  IResourceService,
  IResourceSkillService,
} from "./interfaces/interface";
import { ProjectService } from "./projectService";
import { RedisService } from "./redisService";
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

  constructor(
    resourceService: IResourceService = new ResourceService(),
    resourceCostServices: IResourceCostService = new ResourceCostService(),
    resourceSkillServices: IResourceSkillService = new ResourceSkillService(),
    projectServices: IProjectService = new ProjectService()
    // redisService: RedisService = new RedisService()
  ) {
    try {
      this.resourceCostServices = resourceCostServices;
      this.resourceService = resourceService;
      this.resourceCostServices = resourceCostServices;
      this.resourceSkillServices = resourceSkillServices;
      this.projectServices = projectServices;
    } catch (error) {
      console.log("Error initializing service : ", error);
      throw new Error("Service Initialization failed!");
    }
  }
}

export default Services;
