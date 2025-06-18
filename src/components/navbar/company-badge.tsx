// import { useState } from 'react';
import { AccountHomeIcon } from '../../assets';
import { TruncateWithTooltip } from '../truncate-with-tooltip';

interface CompanyBadgeProps {
  name: string;
  logoUrl?: string;
}

const CompanyBadge = ({ name }: CompanyBadgeProps) => {
  return (
    <div className='inline-flex items-center gap-1.5 px-2 h-[24px] rounded-[2px] max-w-[200px]'>
      <AccountHomeIcon
        alt='company-icon'
        className='w-3.5 h-3 mb-0.5'
      />
      <TruncateWithTooltip text={name} maxWidth={170} placement='right'>
        <span className='font-bold text-[13px] leading-[20px] text-nowrap text-[#FFFFFF] max-w-[170px] overflow-hidden text-ellipsis'>
          {name}
        </span>
      </TruncateWithTooltip>
    </div>
  );
};

export default CompanyBadge;
