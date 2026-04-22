import { StatesApiResponse } from '../types/account';

export const mockRegionList: StatesApiResponse = {
  statusCode: 200,
  statusCodeValue: 'Success',
  statusMessage: '',
  data: {
    states: [
      {
        rid: '51efae3a-86a8-44e0-8426-5ff7e7f13501',
        state_name: 'North America',
      },
      {
        rid: '7abc0cab-b8dd-42bd-b379-f0f5cbe68938',
        state_name: 'Europe',
      },
      {
        rid: '75ebb6e9-8c12-4ff8-91e0-f9ba19e819e8',
        state_name: 'Asia',
      },
      {
        rid: '46d3ae74-42e7-4074-8a47-4c5d62b20149',
        state_name: 'Africa',
      },
    ],
  },
};
