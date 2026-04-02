import React from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { Typography } from '@mui/material';
import DetailsSectionSkeleton from '../../../../../../../components/skeleton-component/detailsskeleton';
import { useDossierSummary } from '../../../../../../services/case-dossier/case-dossier-service';

const DossierSummary: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { caseId } = useParams();
  const accountId = searchParams.get('accountID') || '';

  const { data, isLoading, error } = useDossierSummary(accountId, caseId || '');

  return (
    <div className='mb-6'>
      {isLoading ? (
        <DetailsSectionSkeleton className='p-0 m-0' />
      ) : error ? (
        <div className='flex items-center justify-center h-64 p-4'>
          <Typography variant='h6' color='error' className='mb-2'>
            Error loading dossier summary
          </Typography>
        </div>
      ) : (
        <>
          {/* Title Section */}
          <div>
            <div className='flex items-center align-middle px-6 h-[30px] border-t border-b border-[#CBD6E2] text-[#2D3E4F] text-[14px] font-bold bg-[#ECECEC]'>
              {data?.title}
            </div>
          </div>

          {/* Company Overview Section */}
          <div>
            <div className='flex items-center align-middle px-6 h-[30px] border-t border-b border-[#CBD6E2] text-[#2D3E4F] text-[14px] font-bold bg-[#D9D9D9]'>
              Company Overview
            </div>
            <div className='py-4 px-6'>
              <div className='text-[14px] text-[#2D3E4F]'>
                {data?.company_overview || 'No company overview available'}
              </div>
            </div>
          </div>

          {/* Overall Projects Summary Section */}
          <div>
            <div className='flex items-center align-middle px-6 h-[30px] border-t border-b border-[#CBD6E2] text-[#2D3E4F] text-[14px] font-bold bg-[#D9D9D9]'>
              Overall Projects Summary
            </div>
            <div className='py-4 px-6'>
              <div className='text-[14px] text-[#2D3E4F]'>
                {data?.overall_projects_summary ||
                  'No projects summary available'}
              </div>
            </div>
          </div>

          {/* Assessment Methodology Section */}
          <div>
            <div className='flex items-center align-middle px-6 h-[30px] border-t border-b border-[#CBD6E2] text-[#2D3E4F] text-[14px] font-bold bg-[#D9D9D9]'>
              Assessment Methodology
            </div>
            <div className='py-4 px-6'>
              <div className='text-[14px] text-[#2D3E4F]'>
                {data?.assessment_methodology ||
                  'No assessment methodology available'}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default DossierSummary;
