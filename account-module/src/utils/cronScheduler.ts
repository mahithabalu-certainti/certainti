import cron from "node-cron";
import configurations from "../config/config";

const services = configurations.getInstance().getServices();
const accountServices = services.accountServices;

cron.schedule("0 */12 * * *", async () => {
  console.log("🔁 Running subscription renewal...");
  await accountServices.provisionMonitoredAccount("hello_world");
});
