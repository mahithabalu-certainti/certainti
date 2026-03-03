import { ApolloServer } from "@apollo/server";
import { Application } from "express";
import { makeExecutableSchema } from "@graphql-tools/schema";
import configurations from "../config/config";
import { expressMiddleware } from "@apollo/server/express4";
import initRequestContext from "../graphql/context";
import interactionDefs from "../graphql/interactionSchema";
import { interactionResolver } from "../graphql/resolver";

const GRAPHQL_PATH = "/graphql";

interface GraphQLServer {
  server: ApolloServer;
  graphqlPath: string;
}

const initGraphQLServer = async (app: Application): Promise<GraphQLServer> => {
  const schema = makeExecutableSchema({
    typeDefs: [
      interactionDefs
    ],
    resolvers: [interactionResolver],
  });

  const server = new ApolloServer({
    schema,
    introspection: true,
  });

  await server.start();

  app.use(
    GRAPHQL_PATH,
    expressMiddleware(server, {
      context: async (ctx) =>
        initRequestContext(ctx, configurations.getInstance().getServices()),
    }) as any
  );

  return { server, graphqlPath: GRAPHQL_PATH };
};

export default initGraphQLServer;
