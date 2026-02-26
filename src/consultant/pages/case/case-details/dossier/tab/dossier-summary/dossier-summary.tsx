import React from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { Typography } from '@mui/material';
import Markdown from 'react-markdown';
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
              Title
            </div>
            <div className='py-4 px-6'>
              <div className='text-[18px] font-bold text-[#2D3E4F]'>
                {data?.title || 'No title available'}
              </div>
            </div>
          </div>

          {/* Company Overview Section */}
          <div>
            <div className='flex items-center align-middle px-6 h-[30px] border-t border-b border-[#CBD6E2] text-[#2D3E4F] text-[14px] font-bold bg-[#ECECEC]'>
              Company Overview
            </div>
            <div className='py-2 px-6 flex flex-col gap-4'>
              {data?.company_overview && data.company_overview.length > 0 ? (
                data.company_overview.map((item, index) => {
                  const formattedText = (item.summary || '')
                    .replace(/\\n/g, '\n')
                    .replace(/•/g, '-');
                  return (
                    <div key={index} className='flex flex-col gap-1'>
                      {/* Label */}
                      <div className='text-left font-extrabold text-[16px] text-[#425A76]'>
                        {item.title}
                      </div>
                      {/* Value as paragraph */}
                      <div className='markdown'>
                        <Markdown>{formattedText || ''}</Markdown>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className='py-2'>No company overview available</div>
              )}
            </div>
          </div>

          {/* Overall Projects Summary Section */}
          <div>
            <div className='flex items-center align-middle px-6 h-[30px] border-t border-b border-[#CBD6E2] text-[#2D3E4F] text-[14px] font-bold bg-[#ECECEC]'>
              Overall Projects Summary
            </div>
            <div className='py-2 px-6 flex flex-col gap-4'>
              {data?.overall_projects_summary &&
              data.overall_projects_summary.length > 0 ? (
                data.overall_projects_summary.map((item, index) => {
                  const formattedText = (item.summary || '')
                    .replace(/\\n/g, '\n')
                    .replace(/•/g, '-');
                  return (
                    <div key={index} className='flex flex-col gap-1'>
                      {/* Label */}
                      <div className='text-left font-extrabold text-[16px] text-[#425A76]'>
                        {item.title}
                      </div>
                      {/* Value as paragraph */}
                      <div className='markdown'>
                        <Markdown>{formattedText || ''}</Markdown>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className='py-2'>No projects summary available</div>
              )}
            </div>
          </div>

          {/* Assessment Methodology Section */}
          <div>
            <div className='flex items-center align-middle px-6 h-[30px] border-t border-b border-[#CBD6E2] text-[#2D3E4F] text-[14px] font-bold bg-[#ECECEC]'>
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
