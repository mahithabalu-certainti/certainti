import { useEffect, useState } from 'react';
import { Case, CaseApiResponse, CaseListParams } from '../../types';

const MOCK_CASES: Case[] = [
  {
    case_id: '50005011',
    case_number: 'CS00007',
    fiscal_year: 2024,
    case_code: 'TrueTechAI2024_All_RD',
    case_type: 'RD Assessment',
    country: 'USA',
    region: 'Federal',
    case_owner: 'Krish Balaraman',
    rd_claim: '22M',
    status: 'Active',
    created_at: '2024-01-15',
    account_rid: 'acc_001',
  },
  {
    case_id: '50005010',
    case_number: 'CS00008',
    fiscal_year: 2023,
    case_code: 'TrueTechAI2024_All_RD',
    case_type: 'RD Assessment',
    country: 'USA',
    region: 'Federal',
    case_owner: 'Krish Balaraman',
    rd_claim: '16.3M',
    status: 'Active',
    created_at: '2023-11-20',
    account_rid: 'acc_001',
  },
  {
    case_id: '50005009',
    case_number: 'CS00009',
    fiscal_year: 2023,
    case_code: 'TrueTechAI2025_TX_RD',
    case_type: 'RD Assessment',
    country: 'USA',
    region: 'Texas',
    case_owner: 'Krish Balaraman',
    rd_claim: '3.2M',
    status: 'Active',
    created_at: '2023-08-10',
    account_rid: 'acc_001',
  },
  {
    case_id: '50005008',
    case_number: 'CS00010',
    fiscal_year: 2024,
    case_code: 'TrueTechAI2024_All_RD',
    case_type: 'RD Assessment',
    country: 'USA',
    region: 'Federal',
    case_owner: 'Krish Balaraman',
    rd_claim: '40M',
    status: 'Active',
    created_at: '2024-03-05',
    account_rid: 'acc_001',
  },
  {
    case_id: '50005007',
    case_number: 'CS00011',
    fiscal_year: 2023,
    case_code: 'TrueTechAI2024_All_RD',
    case_type: 'RD Assessment',
    country: 'USA',
    region: 'Federal',
    case_owner: 'Krish Balaraman',
    rd_claim: '6.3M',
    status: 'Active',
    created_at: '2023-09-15',
    account_rid: 'acc_001',
  },
  {
    case_id: '50005006',
    case_number: 'CS00012',
    fiscal_year: 2023,
    case_code: 'TrueTechAI2025_TX_RD',
    case_type: 'RD Assessment',
    country: 'USA',
    region: 'New York',
    case_owner: 'Krish Balaraman',
    rd_claim: '4.2M',
    status: 'Active',
    created_at: '2023-12-01',
    account_rid: 'acc_001',
  },
  {
    case_id: '50005005',
    case_number: 'CS00013',
    fiscal_year: 2024,
    case_code: 'TrueTechAI2024_All_RD',
    case_type: 'RD Assessment',
    country: 'USA',
    region: 'Texas',
    case_owner: 'Krish Balaraman',
    rd_claim: '22M',
    status: 'Active',
    created_at: '2024-02-20',
    account_rid: 'acc_001',
  },
  {
    case_id: '50005004',
    case_number: 'CS00014',
    fiscal_year: 2023,
    case_code: 'TrueTechAI2024_All_RD',
    case_type: 'RD Assessment',
    country: 'USA',
    region: 'Federal',
    case_owner: 'Krish Balaraman',
    rd_claim: '11.6M',
    status: 'Active',
    created_at: '2023-07-30',
    account_rid: 'acc_001',
  },
  {
    case_id: '50005003',
    case_number: 'CS00015',
    fiscal_year: 2023,
    case_code: 'TrueTechAI2025_TX_RD',
    case_type: 'RD Assessment',
    country: 'USA',
    region: 'Texas',
    case_owner: 'Krish Balaraman',
    rd_claim: '2M',
    status: 'Active',
    created_at: '2023-10-25',
    account_rid: 'acc_001',
  },
];

export const useAllCases = (params: CaseListParams, trigger?: number) => {
  const [data, setData] = useState<CaseApiResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    const fetchCases = async () => {
      setIsLoading(true);
      setIsError(false);

      try {
        await new Promise((resolve) => setTimeout(resolve, 500));
        let filteredCases = [...MOCK_CASES];
        if (params.filters) {
          Object.entries(params.filters).forEach(([key, value]) => {
            if (value !== null && value !== undefined && value !== '') {
              filteredCases = filteredCases.filter((caseItem) => {
                const caseValue = caseItem[key as keyof Case];
                if (typeof value === 'string') {
                  return String(caseValue)
                    .toLowerCase()
                    .includes(value.toLowerCase());
                }
                return caseValue === value;
              });
            }
          });
        }

        if (params.fiscalYear && params.fiscalYear > 0) {
          filteredCases = filteredCases.filter(
            (caseItem) => caseItem.fiscal_year === params.fiscalYear
          );
        }

        if (params.sortBy) {
          filteredCases.sort((a, b) => {
            const aValue = a[params.sortBy as keyof Case];
            const bValue = b[params.sortBy as keyof Case];
            if (aValue == null && bValue == null) return 0;
            if (aValue == null) return params.sortOrder === 'ASC' ? -1 : 1;
            if (bValue == null) return params.sortOrder === 'ASC' ? 1 : -1;
            if (aValue < bValue) return params.sortOrder === 'ASC' ? -1 : 1;
            if (aValue > bValue) return params.sortOrder === 'ASC' ? 1 : -1;
            return 0;
          });
        }

        const page = params.page || 1;
        const limit = params.limit || 25;
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const paginatedCases = filteredCases.slice(startIndex, endIndex);

        const response: CaseApiResponse = {
          data: {
            cases: paginatedCases,
            count: filteredCases.length,
            totalCount: filteredCases.length,
          },
          statusCode: 200,
          statusMessage: 'Success',
        };

        setData(response);
      } catch (error) {
        console.error('Error fetching cases:', error);
        setIsError(true);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCases();
  }, [params, trigger]);

  return { data: data?.data, isLoading, isError };
};
