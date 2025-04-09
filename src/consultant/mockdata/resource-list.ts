interface Resource {
  id: string;
  number: string;
  refId: string;
  fullName: string;
  type: string;
  status: string;
}

export const mockResourcesList: Resource[] = [
  {
    id: '2002001',
    number: 'TT2R001',
    refId: '725364',
    fullName: 'Naresh Reddipalli',
    type: 'FTE',
    status: 'Active',
  },
  {
    id: '2002002',
    number: 'TT2R002',
    refId: '564726',
    fullName: 'Sneh Kumari Singh',
    type: 'FTE',
    status: 'Active',
  },
  {
    id: '2002003',
    number: 'TT2R003',
    refId: '973784',
    fullName: 'Ishan Lumba',
    type: 'FTE',
    status: 'Active',
  },
  {
    id: '2002004',
    number: 'TT2R004',
    refId: '959550',
    fullName: 'Santhi Prapoorna Gummola',
    type: 'FTE',
    status: 'Active',
  },
  {
    id: '2002005',
    number: 'TT2R005',
    refId: '454451',
    fullName: 'RameshBabu Thumpera',
    type: 'FTE',
    status: 'Active',
  },
];
