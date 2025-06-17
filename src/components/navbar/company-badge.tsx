// import { useState } from 'react';
import { TruncateWithTooltip } from '../truncate-with-tooltip';

interface CompanyBadgeProps {
  name: string;
  logoUrl: string;
}

const CompanyBadge = ({ name }: CompanyBadgeProps) => {
  // const [imageError, setImageError] = useState(false);

  // const getInitials = (name: string) => {
  //   return name
  //     .split(' ')
  //     .map((word) => word[0])
  //     .join('')
  //     .slice(0, 2)
  //     .toUpperCase();
  // };

  return (
    <div className='inline-flex items-center gap-2 px-2 h-[24px] rounded-[2px] max-w-[200px] bg-[#0BBFB7]'>
      {/* {!imageError ? (
        <div className='h-[24px] w-[24px] overflow-hidden'>
          <img
            src={logoUrl}
            alt='company-logo'
            className='w-full h-full object-contain'
            onError={() => setImageError(true)}
          />
        </div>
      ) : (
        <div className='h-[16px] w-[18px] flex items-center justify-center text-[10px] font-bold text-white bg-[#7A8BA3] rounded'>
          {getInitials(name)}
        </div>
      )} */}
      <TruncateWithTooltip text={name} maxWidth={170} placement='right'>
        <span className='font-medium text-[13px] leading-[20px] text-nowrap text-[#FFFFFF] max-w-[170px] overflow-hidden text-ellipsis'>
          {name}
        </span>
      </TruncateWithTooltip>
    </div>
  );
};

export default CompanyBadge;
