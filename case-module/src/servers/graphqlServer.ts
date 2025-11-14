import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { mergeTypeDefs, mergeResolvers } from '@graphql-tools/merge';

import initRequestContext from '../graphql/context';
import configurations from '../config/config';
import { Application } from 'express';
import { caseResolver } from '../resolvers/caseResolver';
import { adminChecklistResolver } from '../resolvers/adminChecklistResolver';
import { typeDefs } from '../graphql/schema';
import { adminChecklistTypeDefs } from '../graphql/adminChecklistSchema';
import { taskTemplateDefs } from '../graphql/taskTemplateSchema';
import { adminTaskTemplateResolver } from '../resolvers/taskTemplateResolver';
import { checkListTypeDefs } from '../graphql/checkListSchema';
import { checkListResolver } from '../resolvers';
import { emailTemplateTypeDefs } from '../graphql/emailTemplateSchema';
import { emailTemplateResolver } from '../resolvers/emailTemplateResolver';

const GRAPHQL_PATH = '/graphql';

interface GraphQLServer {
  server: ApolloServer;
  graphqlPath: string;
}

const initGraphQLServer = async (app: Application): Promise<GraphQLServer> => {
  // Merge type definitions from multiple schemas
  const mergedTypeDefs = mergeTypeDefs([typeDefs, adminChecklistTypeDefs, taskTemplateDefs, checkListTypeDefs,emailTemplateTypeDefs]);
  
  // Merge resolvers from multiple resolver files
  const mergedResolvers = mergeResolvers([caseResolver, adminChecklistResolver, adminTaskTemplateResolver, checkListResolver,emailTemplateResolver]);

  const schema = makeExecutableSchema({
    typeDefs: mergedTypeDefs,
    resolvers: mergedResolvers,
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
