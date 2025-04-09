interface Project {
  id: string;
  number: string;
  refId: string;
  industry: string;
  startDate: string;
  endDate: string;
  status: string;
}

export const mockPojectsList: Project[] = [
  {
    id: '2003001',
    number: 'TT2P001',
    refId: 'YLL2100234',
    industry: 'I.T',
    startDate: '8/9/2008',
    endDate: '8/4/2026',
    status: 'Active',
  },
  {
    id: '2003002',
    number: 'TT2P002',
    refId: '39158',
    industry: 'I.T',
    startDate: '27/11/2007',
    endDate: '27/1/2025',
    status: 'Active',
  },
  {
    id: '2003003',
    number: 'TT2P003',
    refId: '35289',
    industry: 'I.T',
    startDate: '15/7/2022',
    endDate: '11/9/2026',
    status: 'Active',
  },
  {
    id: '2003004',
    number: 'TT2P004',
    refId: 'Y.IN2203342',
    industry: 'I.T',
    startDate: '15/2/2019',
    endDate: '27/6/2026',
    status: 'Active',
  },
  {
    id: '2003005',
    number: 'TT2P005',
    refId: '46255',
    industry: 'I.T',
    startDate: '9/3/2016',
    endDate: '28/2/2026',
    status: 'Active',
  },
];
