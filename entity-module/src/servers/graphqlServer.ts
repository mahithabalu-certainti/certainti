import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import { makeExecutableSchema } from "@graphql-tools/schema";
import resourceCostGraphQlSchema from "../graphql/resourceCostGraphQlSchema";
import resourceSkillGraphQlSchema from "../graphql/resourceSkillGraphQlSchema";
import resourceSchema from "../graphql/resourceSchema";
import resourceCostResolvers from "../resolvers/resourceCostResolver";
import resourceSkillResolvers from "../resolvers/resourceSkillResolver";
import resourceResolver from "../resolvers/resourceResolver";
import initRequestContext from "../graphql/context";
import configurations from "../config/config";
import { Application } from "express";
import { projectSchema } from "../graphql/projectSchema";
import { projectResolver } from "../resolvers/projectResolver";

const GRAPHQL_PATH = "/graphql";

interface GraphQLServer {
  server: ApolloServer;
  graphqlPath: string;
}

const initGraphQLServer = async (app: Application): Promise<GraphQLServer> => {
  const schema = makeExecutableSchema({
    typeDefs: [
      resourceCostGraphQlSchema,
      resourceSkillGraphQlSchema,
      resourceSchema,
      projectSchema
    ],
    resolvers: [
      resourceCostResolvers,
      resourceSkillResolvers,
      resourceResolver,
      projectResolver
    ],
  });

  const server = new ApolloServer({
    schema,
    introspection : true
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
