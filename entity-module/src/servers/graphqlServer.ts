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
import attachmentSchema from '../graphql/attachmentSchema'
import { attachmentResolver } from "../resolvers/attachmentResolver";
import { projectResourceSchema } from "../graphql/projectResourceSchema";
import { projectResourceResolver } from "../resolvers/projectResourceResolver";
import { importResolver } from "../resolvers/importListResolver";
import importListSchema from "../graphql/importListSchema";
import { projectTaskSchema } from "../graphql/projectTaskSchema";
import { projectTaskResolver } from "../resolvers/projectTaskResolver";
import notesListSchema from "../graphql/notesSchema";
import { notesResolver } from "../resolvers/notesResolver";

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
      projectSchema,
      attachmentSchema,
      projectResourceSchema,
      importListSchema,
      projectTaskSchema,
      notesListSchema
    ],
    resolvers: [
      resourceCostResolvers,
      resourceSkillResolvers,
      resourceResolver,
      projectResolver,
      attachmentResolver,
      projectResourceResolver,
      importResolver,
      projectTaskResolver,
      notesResolver
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
