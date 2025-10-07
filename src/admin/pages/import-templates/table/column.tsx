import { DownloadIcon, UploadIcon } from '../../../../assets';
import { formatDateToYYYYMMDDWithTime } from '../../../../common-utils';
import { ListTableColumn } from '../../../../components/table/types';
import { TemplateItem } from '../../../../consultant/types';

export const getInteractionTemplateColumns = (
  handleDownload: (row: TemplateItem) => void,
  handleUpload: (row: TemplateItem) => void,
  permissionMap: Record<string, { read: boolean; edit: boolean }>
): ListTableColumn<TemplateItem>[] => [
  {
    id: 'template_name',
    sortId: 'template_name',
    label: 'Template Name',
    width: '34%',
    sortable: true,
    hide:
      !permissionMap?.['template_name']?.read &&
      !permissionMap?.['template_name']?.edit,
  },
  {
    id: 'download',
    sortId: '',
    label: 'Actions',
    width: '6%',
    // hide: !isTemplateExportEnable,
    render: (row: TemplateItem) => (
      <div className='flex gap-3'>
        <button
          className='flex border border-[#CBD6E2]  rounded-[2px] w-[24px] h-[24px] bg-[linear-gradient(180deg,_#FFFFFF_0%,_#E4E6E7_100%)] justify-center items-center cursor-pointer mx-auto'
          onClick={() => handleUpload(row)}
        >
          <UploadIcon
            alt='upload-icon'
            className='h-4 p-[2px] [&>path]:fill-[#425a76ac] [&>path]:stroke-none '
          />
        </button>
        <button
          className='flex border border-[#CBD6E2] rounded-[2px] w-[24px] h-[24px] bg-[linear-gradient(180deg,_#FFFFFF_0%,_#E4E6E7_100%)] justify-center items-center cursor-pointer mx-auto'
          onClick={() => handleDownload(row)}
        >
          <DownloadIcon alt='download-icon' className='h-4' />
        </button>
      </div>
    ),
  },
  {
    id: 'created_datetime',
    sortId: 'created_datetime',
    label: 'Created On',
    width: '30%',
    sortable: true,
    hide:
      !permissionMap?.['created_datetime']?.read &&
      !permissionMap?.['created_datetime']?.edit,
    render: (row: TemplateItem) =>
      row.created_datetime &&
      formatDateToYYYYMMDDWithTime(row.created_datetime),
  },
  {
    id: 'modified_datetime',
    sortId: 'modified_datetime',
    label: 'Updated On',
    width: '30%',
    sortable: true,
    hide:
      !permissionMap?.['modified_datetime']?.read &&
      !permissionMap?.['modified_datetime']?.edit,
    render: (row: TemplateItem) =>
      row.modified_datetime &&
      formatDateToYYYYMMDDWithTime(row.modified_datetime),
  },
];
