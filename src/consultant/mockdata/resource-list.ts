import { ResourcesListResponse } from '../types/resource';

export const mockResourcesList: ResourcesListResponse = {
  statusCode: 200,
  statusCodeValue: 'Success',
  statusMessage: '',
  data: {
    resources: [
      {
        rid: '4e15cef8-3efb-4e98-8ec7-e16f27ae8d63',
        r_number: 'ACC0001',
        resource_ref_id: 'resource-005',
        resource_fullname: 'jack miller',
        resource_type: 'FullTime',
        resource_status: 'Active',
      },
      {
        rid: '85dd287c-ff89-4d25-9742-c6fd5062f3c2',
        r_number: 'ACC0002',
        resource_ref_id: 'resource-007',
        resource_fullname: 'jack miller',
        resource_type: 'FullTime',
        resource_status: 'Active',
      },
      {
        rid: '0aac0571-a734-4502-9b81-3b07a38615b9',
        r_number: 'ACC0003',
        resource_ref_id: 'resource-008',
        resource_fullname: 'jack miller',
        resource_type: 'FullTime',
        resource_status: 'Active',
      },
      {
        rid: '34625fab-98ee-4782-b0da-e49a02e34398',
        r_number: 'ACC0004',
        resource_ref_id: 'resource-009',
        resource_fullname: 'jack miller',
        resource_type: 'FullTime',
        resource_status: 'Active',
      },
    ],
  },
};

// export const mockResourcesList: Resource[] = [
//   {
//     id: '2002001',
//     number: 'TT2R001',
//     refId: '725364',
//     fullName: 'Naresh Reddipalli',
//     type: 'FTE',
//     status: 'Active',
//   },
//   {
//     id: '2002002',
//     number: 'TT2R002',
//     refId: '564726',
//     fullName: 'Sneh Kumari Singh',
//     type: 'FTE',
//     status: 'Active',
//   },
//   {
//     id: '2002003',
//     number: 'TT2R003',
//     refId: '973784',
//     fullName: 'Ishan Lumba',
//     type: 'FTE',
//     status: 'Active',
//   },
//   {
//     id: '2002004',
//     number: 'TT2R004',
//     refId: '959550',
//     fullName: 'Santhi Prapoorna Gummola',
//     type: 'FTE',
//     status: 'Active',
//   },
//   {
//     id: '2002005',
//     number: 'TT2R005',
//     refId: '454451',
//     fullName: 'RameshBabu Thumpera',
//     type: 'FTE',
//     status: 'Active',
//   },
// ];
