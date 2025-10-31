import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { makeExecutableSchema } from '@graphql-tools/schema';

import initRequestContext from '../graphql/context';
import configurations from '../config/config';
import { Application } from 'express';
import { caseResolver } from '../resolvers/caseResolver';
import { typeDefs } from '../graphql/schema';

const GRAPHQL_PATH = '/graphql';

interface GraphQLServer {
  server: ApolloServer;
  graphqlPath: string;
}

const initGraphQLServer = async (app: Application): Promise<GraphQLServer> => {
  const schema = makeExecutableSchema({
    typeDefs,
    resolvers: caseResolver,
  });

  const server = new ApolloServer({
    schema,
    introspection : true
  });

  await server.start();

  app.use(
    GRAPHQL_PATH,
    expressMiddleware(server, {
      context: async (ctx) => initRequestContext(ctx, configurations.getInstance().getServices()),
    })
  );

  return { server, graphqlPath: GRAPHQL_PATH };
};

export default initGraphQLServer;
