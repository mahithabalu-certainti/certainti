import AccountServices from './accountService';
import GeoDataService from './geoDataService';

class Services {
  accountServices: AccountServices;
  geoDataServices: GeoDataService;

  constructor() {
    this.accountServices = new AccountServices();
    this.geoDataServices = new GeoDataService();
  }
}

export default Services;
