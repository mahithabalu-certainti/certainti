import { GetAllCountriesApiResponse } from '.';

export const mockCountriesList: GetAllCountriesApiResponse = {
  statusCode: 200,
  statusCodeValue: 'Success',
  statusMessage: 'Success',
  data: {
    country: [
      {
        rid: '6dd3b70f-dd05-4199-a266-dbcae1828787',
        country_name: 'United States',
      },
      {
        rid: '6dd3b70f-dd05-4199-a266-dbcae1828788',
        country_name: 'Australia',
      },
      {
        rid: '6dd3b70f-dd05-4199-a266-dbcae1828789',
        country_name: 'Brazil',
      },
      {
        rid: '6dd3b70f-dd05-4199-a266-dbcae1828790',
        country_name: 'Canada',
      },
      {
        rid: '6dd3b70f-dd05-4199-a266-dbcae1828791',
        country_name: 'Egypt',
      },
      {
        rid: '6dd3b70f-dd05-4199-a266-dbcae1828792',
        country_name: 'France',
      },
    ],
  },
};
