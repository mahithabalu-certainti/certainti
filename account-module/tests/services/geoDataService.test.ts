import GeoDataService from '../../src/services/geoDataService';
import { Country } from '../../src/models/countryModel';
import { Currency } from '../../src/models/currencyModel';
import { Region } from '../../src/models/regionModel';
import { States } from '../../src/models/stateModel';
import { HttpStatus } from '../../src/utils/constant';

// Mock the models
jest.mock('../../src/models/countryModel', () => ({
  Country: {
    findAll: jest.fn()
  }
}));

jest.mock('../../src/models/currencyModel', () => ({
  Currency: {
    findAll: jest.fn()
  }
}));

jest.mock('../../src/models/regionModel', () => ({
  Region: {
    findAll: jest.fn()
  }
}));

jest.mock('../../src/models/stateModel', () => ({
  States: {
    findAll: jest.fn()
  }
}));

describe('GeoDataService', () => {
  let geoDataService: GeoDataService;
  
  beforeEach(() => {
    geoDataService = new GeoDataService();
    jest.clearAllMocks();
  });
  
  describe('countries', () => {
    it('should return countries on success', async () => {
      const mockCountries = [
        { id: 'US', name: 'United States' },
        { id: 'CA', name: 'Canada' }
      ];
      
      (Country.findAll as jest.Mock).mockResolvedValue(mockCountries);
      
      const result = await geoDataService.countries();
      
      expect(Country.findAll).toHaveBeenCalled();
      expect(result).toEqual({
        statusCode: HttpStatus.SUCCESS,
        message: HttpStatus.SUCCESS_MESSAGE,
        data: {
          country: mockCountries
        }
      });
    });
    
    it('should handle errors', async () => {
      const errorMessage = 'Database error';
      (Country.findAll as jest.Mock).mockRejectedValue(new Error(errorMessage));
      
      const result = await geoDataService.countries();
      
      expect(Country.findAll).toHaveBeenCalled();
      expect(result).toEqual({
        statusCode: HttpStatus.FAILED,
        message: HttpStatus.FAILED_MESSAGE,
        errorMessage: errorMessage
      });
    });
  });
  
  describe('currencies', () => {
    it('should return currencies on success', async () => {
      const mockCurrencies = [
        { code: 'USD', name: 'US Dollar' },
        { code: 'EUR', name: 'Euro' }
      ];
      
      (Currency.findAll as jest.Mock).mockResolvedValue(mockCurrencies);
      
      const result = await geoDataService.currencies();
      
      expect(Currency.findAll).toHaveBeenCalled();
      expect(result).toEqual({
        statusCode: HttpStatus.SUCCESS,
        message: HttpStatus.SUCCESS_MESSAGE,
        data: {
          currency: mockCurrencies
        }
      });
    });
    
    it('should handle errors', async () => {
      const errorMessage = 'Database error';
      (Currency.findAll as jest.Mock).mockRejectedValue(new Error(errorMessage));
      
      const result = await geoDataService.currencies();
      
      expect(Currency.findAll).toHaveBeenCalled();
      expect(result).toEqual({
        statusCode: HttpStatus.FAILED,
        message: HttpStatus.FAILED_MESSAGE,
        errorMessage: errorMessage
      });
    });
  });
  
  describe('regions', () => {
    it('should return regions on success', async () => {
      const mockRegions = [
        { id: 'NA', name: 'North America' },
        { id: 'EU', name: 'Europe' }
      ];
      
      (Region.findAll as jest.Mock).mockResolvedValue(mockRegions);
      
      const result = await geoDataService.regions();
      
      expect(Region.findAll).toHaveBeenCalled();
      expect(result).toEqual({
        statusCode: HttpStatus.SUCCESS,
        message: HttpStatus.SUCCESS_MESSAGE,
        data: {
          regions: mockRegions
        }
      });
    });
    
    it('should handle errors', async () => {
      const errorMessage = 'Database error';
      (Region.findAll as jest.Mock).mockRejectedValue(new Error(errorMessage));
      
      const result = await geoDataService.regions();
      
      expect(Region.findAll).toHaveBeenCalled();
      expect(result).toEqual({
        statusCode: HttpStatus.FAILED,
        message: HttpStatus.FAILED_MESSAGE,
        errorMessage: errorMessage
      });
    });
  });
  
  describe('states', () => {
    it('should return states on success', async () => {
      const mockStates = [
        { id: 'CA', name: 'California' },
        { id: 'NY', name: 'New York' }
      ];
      
      (States.findAll as jest.Mock).mockResolvedValue(mockStates);
      
      const result = await geoDataService.states();
      
      expect(States.findAll).toHaveBeenCalled();
      expect(result).toEqual({
        statusCode: HttpStatus.SUCCESS,
        message: HttpStatus.SUCCESS_MESSAGE,
        data: {
          states: mockStates
        }
      });
    });
    
    it('should handle errors', async () => {
      const errorMessage = 'Database error';
      (States.findAll as jest.Mock).mockRejectedValue(new Error(errorMessage));
      
      const result = await geoDataService.states();
      
      expect(States.findAll).toHaveBeenCalled();
      expect(result).toEqual({
        statusCode: HttpStatus.FAILED,
        message: HttpStatus.FAILED_MESSAGE,
        errorMessage: errorMessage
      });
    });
  });
});