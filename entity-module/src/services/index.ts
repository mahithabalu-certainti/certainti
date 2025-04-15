import { IResourceCostService, IResourceService, IResourceSkillService } from "./interfaces/interface";
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

  constructor(
    resourceService: IResourceService = new ResourceService(),
    resourceCostServices: IResourceCostService = new ResourceCostService(),
    resourceSkillServices: IResourceSkillService = new ResourceSkillService()
  ) {
    try {
      this.resourceCostServices = resourceCostServices;
      this.resourceService = resourceService;
      this.resourceCostServices = resourceCostServices;
      this.resourceSkillServices = resourceSkillServices;
    } catch (error) {
      console.log("Error initializing service : ", error);
      throw new Error("Service Initialization failed!");
    }
  }
}

export default Services;
