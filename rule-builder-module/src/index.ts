import dotenv from "dotenv";
dotenv.config();

import { createRuleBuilderServer } from "./servers/rulebuilderServer";
import { schedulerForTriggerRule } from "./utils/cronScheduler";

const app = createRuleBuilderServer();

schedulerForTriggerRule()
const PORT = process.env.SERVER_PORT || 4000;

app.listen(PORT, () => {
  console.log(`Rule Builder Server running on port ${PORT}`);
});
