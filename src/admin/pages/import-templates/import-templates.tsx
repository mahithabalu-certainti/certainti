import { TemplateImportIcon } from '../../../assets';
import ImportTemplateTable from './table/import-template-table';

const ImportTemplatesList: React.FC = () => {
  return (
    <div className='flex flex-col w-full h-full'>
      <div className='flex items-center justify-between w-full h-[55px] min-h-[50px] border-b border-[#CBD6E2] px-4'>
        <div className='flex h-[33px]'>
          <div className='flex items-center justify-center'>
            <TemplateImportIcon
              alt='interaction-template-icon'
              className='h-7 w-7 p-[3px] rounded [&>path]:fill-[#fff] [&>path]:stroke-[#EA0084] bg-[#EA0084]'
            />
            <div className='flex flex-col mx-2.5 pb-1'>
              <div className='font-semibold text-[#7D98B6] text-[12px] pt-1'>
                Admin Template
              </div>
              <div className='font-bold text-[16px] text-[#2D3E4F] -mt-1'>
                Import Templates
              </div>
            </div>
          </div>
        </div>
        <div className='flex gap-3 justify-center items-center'></div>
      </div>
      <div className='flex items-center justify-between h-[42px] min-h-[42px] max-h-[42px] px-4'>
        <div className='font-bold text-[14px] leading-[32px] text-[#2D3E4F]'>
          All Templates
        </div>
      </div>
      <div className='border-t border-[#CBD6E2]'>
        <ImportTemplateTable />
      </div>
    </div>
  );
};

export default ImportTemplatesList;
