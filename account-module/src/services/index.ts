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
      console.error("Error initializing services:", error);
      throw new Error("Service initialization failed");
    }
  }
}

export default Services;
