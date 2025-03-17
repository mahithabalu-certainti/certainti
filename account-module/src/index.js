require("dotenv").config();
const configurations = require("./config/config");
const initExpressServer = require("./expressServer");
const initGraphQLServer = require("./graphqlServer");

const PORT = process.env.SERVER_PORT || 3000;

async function startServer() {
  try {
    const dbInstance = configurations.getInstance().getDbConfig();
    await dbInstance.sync({ force: false });
    console.log("Database initialized successfully");

    const { app } = await initExpressServer();
    const { graphqlPath } = await initGraphQLServer(app);

    app.listen(PORT, () => {
      console.log(`Graphql Server ready at: ${graphqlPath}`);
      console.log(`Server running on port : ${PORT}`);
    });
  } catch (err) {
    console.log("Error starting server", err.message);
  }
}

startServer();
