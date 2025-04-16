import { ResourceUpdata, ResourceUpdateResponse } from '../types/resource-edit';

export const mockResourceUpdateRequest: ResourceUpdata = {
  resource_id: 'fec37630-7edd-4c21-a236-cde6ffc4fc2d',
  account_number: 'ACC0004',
  resource_ref_id: 'resource-010',
  resource_type: 'FullTime',
  first_name: 'maxwell',
  middle_name: 'D',
  last_name: 'kevin',
  full_name: 'maxwell d kevin',
  org_name: 'Public Organization',
  role: 'Admin',
  fiscal_year: '2027',
  email: 'john.doe@example.com',
  mobile: '4947883399',
  country: '50aead83-b41d-43d4-a8b7-c9ee7641e6c2',
  region: 'f1121286-1a34-4fa7-a25b-d0ab004595e3',
  currency: '68f55916-6108-497a-9d56-2f63f1aef524',
  effective_from_date: '10/04/2025',
  effective_end_date: '29/04/2025',
  designation: 'admin Developer',
  manager_name: 'john',
  total_years_experience: 7,
  total_years_in_org: 2,
  description: 'Experienced software developer with expertise in Node.js.',
  cost: 2380000,
  cost_frequencty: 'Annual',
  resource_status: 'Active',
  modified_by: 'f15143ee-4796-4abd-a984-fa559a624f18',
};

export const mockResourceUpdateResponse: ResourceUpdateResponse = {
  statusCode: 200,
  statusCodeValue: 'Success',
  statusMessage: '',
  data: {
    resource: [1],
  },
};
