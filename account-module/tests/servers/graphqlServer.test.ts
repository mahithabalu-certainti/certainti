import { jest } from '@jest/globals';

// Mock dependencies
jest.mock('@apollo/server', () => ({
  ApolloServer: jest.fn().mockImplementation(() => ({
    start: jest.fn().mockImplementation(async () => {}),
  })),
}));

jest.mock('@apollo/server/express4', () => ({
  expressMiddleware: jest.fn().mockReturnValue('apolloMiddleware'),
}));

jest.mock('@graphql-tools/schema', () => ({
  makeExecutableSchema: jest.fn().mockReturnValue('mockSchema'),
}));

jest.mock('../../src/graphql/schema', () => 'mockTypeDefs');
jest.mock('../../src/resolvers', () => 'mockResolvers');
jest.mock('../../src/graphql/context', () => jest.fn().mockReturnValue('mockContext'));
jest.mock('../../src/config/config', () => ({
  default: {
    getInstance: jest.fn(() => ({
      getServices: jest.fn().mockReturnValue('mockServices'),
    })),
  },
}));

describe('GraphQL Server Initialization', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize GraphQL server and apply middleware', async () => {
    const { ApolloServer } = require('@apollo/server');
    const { expressMiddleware } = require('@apollo/server/express4');
    const { makeExecutableSchema } = require('@graphql-tools/schema');
    const initRequestContext = require('../../src/graphql/context');
    const configurations = require('../../src/config/config').default;
    
    // Mock Express app
    const mockApp = {
      use: jest.fn(),
    };
    
    // Import the module after mocking dependencies
    const initGraphQLServer = require('../../src/servers/graphqlServer').default;
    
    const result = await initGraphQLServer(mockApp);
    
    // Verify schema creation
    expect(makeExecutableSchema).toHaveBeenCalledWith({
      typeDefs: 'mockTypeDefs',
      resolvers: 'mockResolvers',
    });
    
    // Verify Apollo Server initialization
    expect(ApolloServer).toHaveBeenCalledWith({
      schema: 'mockSchema',
    });
    
    // Verify server start was called
    const mockServer = ApolloServer.mock.results[0].value;
    expect(mockServer.start).toHaveBeenCalled();
    
    // Verify middleware was applied
    expect(expressMiddleware).toHaveBeenCalledWith(mockServer, {
      context: expect.any(Function),
    });
    
    // Test the context function
    const contextFn = expressMiddleware.mock.calls[0][1].context;
    const mockCtx = { req: {}, res: {} };
    await contextFn(mockCtx);
    
    expect(initRequestContext).toHaveBeenCalledWith(mockCtx, 'mockServices');
    expect(configurations.getInstance).toHaveBeenCalled();
    expect(configurations.getInstance().getServices).toHaveBeenCalled();
    
    // Verify app.use was called with the correct path and middleware
    expect(mockApp.use).toHaveBeenCalledWith('/graphql', 'apolloMiddleware');
    
    // Verify return value
    expect(result).toEqual({
      server: mockServer,
      graphqlPath: '/graphql',
    });
  });
});