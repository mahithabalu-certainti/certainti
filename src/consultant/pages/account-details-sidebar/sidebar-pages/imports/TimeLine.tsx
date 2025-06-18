
import { ImportIcon} from '../../../../../assets';
const Timeline = () => {
  return (
    <div className='h-auto border border-[#CBD6E2] flex flex-col'>
      <div className='h-[50px] px-4 border-b border-[#CBD6E2] flex items-center gap-2'>
        <ImportIcon alt='Import Icon' className='w-[24px] h-[24px]' />
        <span className='font-medium'>History</span>
      </div>

      <div className='flex flex-col items-center justify-center gap-4 p-4'>
      </div>
    </div>
  );
};

export default Timeline;
