import React from 'react';
import { Grid, Skeleton } from '@mui/material';

interface SkeletonInputProps {
  width?: string | number;
  height?: string | number;
}

const SkeletonInput: React.FC<SkeletonInputProps> = ({
  width = '100%',
  height = 28,
}) => (
  <div>
    <Skeleton width='25%' height={15} sx={{ marginBottom: '6px' }} />
    <Skeleton
      variant='rectangular'
      width={width}
      height={height}
      sx={{ borderRadius: '2px' }}
    />
  </div>
);

interface SkeletonFormProps {
  sectionCount?: number;
  showSectionHead?: boolean;
}

const SkeletonForm: React.FC<SkeletonFormProps> = ({
  sectionCount = 2,
  showSectionHead = true,
}) => {
  return (
    <div className='flex flex-col gap-4'>
      {Array.from({ length: sectionCount }).map((_, sectionIndex) => (
        <div key={sectionIndex}>
          {showSectionHead && (
            <div
              className={`${sectionIndex === 0 ? 'border-b' : 'border'} mb-1 h-[30px] border-[#CBD6E2] flex items-center justify-start py-1 bg-[#ECECEC] px-10`}
            >
              <Skeleton
                variant='rectangular'
                width='10%'
                height={10}
                sx={{ borderRadius: '2px' }}
              />
            </div>
          )}

          <div className='p-10 py-2'>
            <Grid container spacing={2}>
              {Array.from({ length: 9 }).map((_, fieldIndex) => (
                <Grid key={fieldIndex} item xs={12} sm={6} md={4}>
                  <SkeletonInput height={28} />
                </Grid>
              ))}
            </Grid>
          </div>
        </div>
      ))}
    </div>
  );
};

export default SkeletonForm;
