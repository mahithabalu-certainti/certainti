import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { makeExecutableSchema } from '@graphql-tools/schema';
import resourceCostGraphQlSchema from "../graphql/resourceCostGraphQlSchema";
import resourceSkillGraphQlSchema from "../graphql/resourceSkillGraphQlSchema";
import resourceCostResolvers from '../resolvers/resourceCostResolver';
import resourceSkillResolvers from '../resolvers/resourceSkillResolver';
import initRequestContext from '../graphql/context';
import configurations from '../config/config';
import { Application } from 'express';

const GRAPHQL_PATH = '/graphql';

interface GraphQLServer {
  server: ApolloServer;
  graphqlPath: string;
}

const initGraphQLServer = async (app: Application): Promise<GraphQLServer> => {
  const schema = makeExecutableSchema({
    typeDefs: [resourceCostGraphQlSchema,resourceSkillGraphQlSchema],
    resolvers: [resourceCostResolvers,resourceSkillResolvers]
  });

  const server = new ApolloServer({
    schema,
  });

  await server.start();

  app.use(
    GRAPHQL_PATH,
    expressMiddleware(server, {
      context: async (ctx) => initRequestContext(ctx, configurations.getInstance().getServices()),
    }) as any
  );  

  return { server, graphqlPath: GRAPHQL_PATH };
};

export default initGraphQLServer;
