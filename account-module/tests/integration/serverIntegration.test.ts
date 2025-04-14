import { jest } from '@jest/globals';

// Mock dependencies
jest.mock('../../src/servers/expressServer', () => ({
  default: jest.fn().mockReturnValue({
    app: {
      use: jest.fn(),
      listen: jest.fn((port, callback: () => void) => {
        callback();
        return { on: jest.fn() };
      }),
    },
  }),
}));

jest.mock('../../src/servers/graphqlServer', () => ({
  default: jest.fn().mockImplementation(async () => ({
    graphqlPath: '/graphql',
    server: 'mockApolloServer',
  })),
}));

jest.mock('../../src/models', () => ({
  initModels: jest.fn().mockImplementation(async () => {})
}));

// Add mock for index.ts
jest.mock('../../src/index', () => ({
  startServer: jest.fn().mockImplementation(async () => {})
}));

describe('Server Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock console.log to avoid cluttering test output
    console.log = jest.fn();
    process.env.SERVER_PORT = '4000';
  });

  it('should initialize both Express and GraphQL servers', async () => {
    const initExpressServer = require('../../src/servers/expressServer').default;
    const initGraphQLServer = require('../../src/servers/graphqlServer').default;
    const { initModels } = require('../../src/models');
    const { startServer } = require('../../src/index');
    
    await startServer();
    
    // Verify models were initialized
    expect(initModels).toHaveBeenCalledTimes(1);
    
    // Verify Express server was initialized
    expect(initExpressServer).toHaveBeenCalledTimes(1);
    
    // Verify GraphQL server was initialized with the Express app
    const { app } = initExpressServer();
    expect(initGraphQLServer).toHaveBeenCalledWith(app);
    
    // Verify server was started on the correct port
    expect(app.listen).toHaveBeenCalledWith('4000', expect.any(Function));
    
    // Verify console logs
    expect(console.log).toHaveBeenCalledWith('Graphql Server ready at: /graphql');
    expect(console.log).toHaveBeenCalledWith('Server running on port : 4000');
  });

  it('should handle errors during server startup', async () => {
    const { initModels } = require('../../src/models');
    const { startServer } = require('../../src/index');
    
    initModels.mockRejectedValueOnce(new Error('Database connection failed'));
    
    await startServer();
    
    expect(console.log).toHaveBeenCalledWith('Error starting server', 'Database connection failed');
  });
});