import React from 'react';
import { Skeleton } from '@mui/material';

interface SkeletonInputProps {
  width?: string | number;
  height?: string | number;
  variant?: string;
}

const SingleSkeleton: React.FC<SkeletonInputProps> = ({
  width = '100%',
  height = 28,
  variant = 'rectangular',
}) => (
  <div>
    <Skeleton
      variant={variant as 'rectangular' | 'text' | 'rounded' | 'circular'}
      width={width}
      height={height}
      sx={{ borderRadius: '2px' }}
    />
  </div>
);
export default SingleSkeleton;
