import { IResourceCostService } from "./interfaces/interface";
import ResourceCostService from "./resourceCostService";

interface IServiceContainer {
  resourceCostServices: IResourceCostService;
}

class Services implements IServiceContainer {
  resourceCostServices: IResourceCostService;

  constructor(
    resourceCostServices: IResourceCostService = new ResourceCostService()
  ) {
    try {
      this.resourceCostServices = resourceCostServices;
    } catch (error) {
      console.log("Error initializing service : ", error);
      throw new Error("Service Initialization failed!");
    }
  }
}

export default Services;
