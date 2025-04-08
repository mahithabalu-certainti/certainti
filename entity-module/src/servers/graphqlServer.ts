import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { makeExecutableSchema } from '@graphql-tools/schema';
import typeDefs from '../graphql/schema';
import resourceCostResolvers from '../resolvers';
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
    typeDefs,
    resolvers: resourceCostResolvers,
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
