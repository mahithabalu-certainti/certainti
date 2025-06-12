import { useState } from 'react';

interface CompanyBadgeProps {
  name: string;
  logoUrl: string;
}

const CompanyBadge = ({ name, logoUrl }: CompanyBadgeProps) => {
  const [imageError, setImageError] = useState(false);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((word) => word[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  };

  return (
    <div className='w-[218px] min-w-[218px] max-w-[218px] h-[24px] rounded-[2px] px-2 border border-[#CBD6E266] bg-[#495E744D] flex items-center gap-2'>
      {!imageError ? (
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
      )}
      <span className='font-medium text-[13px] leading-[20px] w-[170px] text-nowrap text-[#FFFFFF] max-w-[170px] overflow-hidden text-ellipsis'>
        {name}
      </span>
    </div>
  );
};

export default CompanyBadge;
