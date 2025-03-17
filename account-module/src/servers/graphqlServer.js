const { ApolloServer } = require("@apollo/server");
const { expressMiddleware } = require("@apollo/server/express4");
const { makeExecutableSchema } = require("@graphql-tools/schema");
const typeDefs = require("../graphql/schema");
const accountResolvers = require("../resolvers");
const initRequestContext = require("../graphql/context");
const configurations = require("../config/config");
const services = configurations.getInstance().getServices();

const GRAPHQL_PATH = "/graphql";

const initGraphQLServer = async (app) => {
  const schema = makeExecutableSchema({
    typeDefs,
    resolvers: accountResolvers,
  });

  const server = new ApolloServer({
    schema
  });

  await server.start();

  app.use(
    GRAPHQL_PATH,
    expressMiddleware(server, {
      context: async (ctx) => initRequestContext(ctx, services),
    })
  );

  return { server, graphqlPath: GRAPHQL_PATH };
};

module.exports = initGraphQLServer;
