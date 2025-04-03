import AccountServices from "./accountService";
import GeoDataService from "./geoDataService";
import { IAccountService, IGeoDataService } from "./iinterfaces/interfaces";

interface IServiceContainer {
  accountServices: IAccountService;
  geoDataServices: IGeoDataService;
}

class Services implements IServiceContainer {
  accountServices: IAccountService;
  geoDataServices: IGeoDataService;

  constructor(
    accountServices: IAccountService = new AccountServices(),
    geoDataServices: IGeoDataService = new GeoDataService()
  ) {
    try {
      this.accountServices = accountServices;
      this.geoDataServices = geoDataServices;
    } catch (error) {
      console.error("Error initializing services:", error);
      throw new Error("Service initialization failed");
    }
  }
}

export default Services;
