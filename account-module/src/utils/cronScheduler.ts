import cron from "node-cron";
import configurations from "../config/config";
import { logMessage } from "./helpers";

const services = configurations.getInstance().getServices();
const accountServices = services.accountServices;

cron.schedule("0 */12 * * *", async () => {
 logMessage("Running subscription renewal...");
  await accountServices.provisionMonitoredAccount("hello_world");
});
