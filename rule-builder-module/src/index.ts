import dotenv from "dotenv";
dotenv.config();

import { createRuleBuilderServer } from "./servers/rulebuilderServer";

const app = createRuleBuilderServer();
const PORT = process.env.SERVER_PORT || 4000;

app.listen(PORT, () => {
  console.log(`Rule Builder Server running on port ${PORT}`);
});
