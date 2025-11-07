import { errorLog } from "../utils/helpers";
import AccountServices from "./accountService";
import GeoDataService from "./geoDataService";
import AccountGraphQlServices from "./graphqlServices";
import { IAccountGraphQlServices, IAccountService, IGeoDataService } from "./interfaces/accountInterface";

interface IServiceContainer {
  accountServices: IAccountService;
  geoDataServices: IGeoDataService;
  accountGraphqlServices : IAccountGraphQlServices;
}

class Services implements IServiceContainer {
  accountServices: IAccountService;
  geoDataServices: IGeoDataService;
  accountGraphqlServices : IAccountGraphQlServices;

  constructor(
    accountServices: IAccountService = new AccountServices(),
    geoDataServices: IGeoDataService = new GeoDataService(),
    accountGraphqlServices : IAccountGraphQlServices = new AccountGraphQlServices() 
  ) {
    try {
      this.accountServices = accountServices;
      this.geoDataServices = geoDataServices;
      this.accountGraphqlServices = accountGraphqlServices
    } catch (error) {
      errorLog("Service initialization failed", error instanceof Error ? error.message : String(error));
      throw new Error("Service initialization failed");
    }
  }
}

export default Services;
