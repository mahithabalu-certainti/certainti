import request from 'supertest';
import express from 'express';
import routes from '../../src/routes';
import accountRoutes from '../../src/routes/accountRoutes';

// Mock dependencies
jest.mock('../../src/routes/accountRoutes', () => {
  const router = express.Router();
  router.get('/test', (req, res) => res.status(200).json({ message: 'Account route test' }));
  return router;
});

jest.mock('../../src/utils/helpers', () => ({
  errorLog: jest.fn(),
  successLog: jest.fn()
}));

// Update health service mock path
jest.mock('../../src/services', () => ({
  default: jest.fn().mockReturnValue({
    healthService: {
      checkHealth: jest.fn().mockRejectedValue(
        new Error('Internal Server Error: Unable to perform health check.')
      )
    }
  })
}));

describe('Routes', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use('/', routes);
  });

  describe('GET /health', () => {
    it('should handle errors', async () => {
      const response = await request(app).get('/health');
      
      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        status: 'error',
        message: 'Internal Server Error: Unable to perform health check.'
      });
    });
  });

  describe('Account Routes', () => {
    it('should use account routes', async () => {
      const app = express();
      app.use('/accounts', accountRoutes);
      const response = await request(app).get('/accounts/test');
      
      expect(response.status).toBe(200);
      expect(response.body).toEqual({ message: 'Account route test' });
    });
  });
});

