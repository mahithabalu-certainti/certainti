import React from 'react';

interface ConnectorLineProps {
  active?: boolean;
}

const ConnectorLine: React.FC<ConnectorLineProps> = ({ active }) => {
  return (
    <div className='relative flex justify-start ml-8'>
      <div className='w-[1px] bg-gray-300 h-12 relative'>
        {active && (
          <div className='absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2'>
            <div className='w-3 h-3 rounded-full bg-blue-500 animate-ping absolute opacity-75'></div>
            <div className='w-3 h-3 rounded-full bg-blue-600'></div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConnectorLine;
