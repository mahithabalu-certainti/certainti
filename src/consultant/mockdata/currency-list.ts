import { CurrencyApiResponse } from '../types/account';

export const mockCurrencyList: CurrencyApiResponse = {
  statusCode: 200,
  statusCodeValue: 'Success',
  statusMessage: '',
  data: {
    currency: [
      {
        rid: 'ccda7550-9715-446e-acc0-ffe5d9478c5d',
        currency_name: 'United States Dollar',
      },
      {
        rid: '68f55916-6108-497a-9d56-2f63f1aef524',
        currency_name: 'Canadian Dollar',
      },
      {
        rid: '62767b40-b4fc-4e1f-aa3b-707c8a1d35e0',
        currency_name: 'British Pound',
      },
      {
        rid: 'f049c762-ec50-4471-9c3b-38c905f29b6c',
        currency_name: 'Euro',
      },
      {
        rid: '6966743b-034c-46c7-b3d3-63f298f33588',
        currency_name: 'Swedish Krona',
      },
      {
        rid: '4f056422-82fe-44e6-b742-101e096aab79',
        currency_name: 'Romanian Leu',
      },
      {
        rid: 'b26ecbd0-f148-47e0-a8bc-96c41224ae49',
        currency_name: 'Australian Dollar',
      },
      {
        rid: '1490526e-bd9a-41fd-8aa4-67befec60a02',
        currency_name: 'Euro',
      },
    ],
  },
};
