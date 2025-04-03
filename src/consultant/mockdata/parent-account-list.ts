import { ParentAccountApiResponse } from '../types/account';

export const mockParentAccountList: ParentAccountApiResponse = {
  statusCode: 200,
  statusCodeValue: 'Success',
  statusMessage: '',
  data: {
    gloablAcconunts: [
      {
        rid: '51efae3a-86a8-44e0-8426-5ff7e7f13501',
        account_name: 'Wipro-Global',
      },
      {
        rid: '7abc0cab-b8dd-42bd-b379-f0f5cbe68938',
        account_name: 'TechM-Global',
      },
      {
        rid: '75ebb6e9-8c12-4ff8-91e0-f9ba19e819e8',
        account_name: 'Wipro-Global',
      },
      {
        rid: '46d3ae74-42e7-4074-8a47-4c5d62b20149',
        account_name: 'Wipro-Global',
      },
    ],
  },
};
