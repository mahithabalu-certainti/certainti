import { DownloadIcon } from '../../../../../../assets';
import { formatDateToYYYYMMDDWithTime } from '../../../../../../common-utils';
import { ListTableColumn } from '../../../../../../components/table/types';
import { InteractionAttachmentType } from '../../../../../types';

export const getInteractionAttachmentListColumns = (
  handleDownload: (documentUrl: string) => void
): ListTableColumn<InteractionAttachmentType>[] => [
  {
    id: 'question_rnumber',
    sortId: 'question_rnumber',
    label: 'Question Number',
    width: 130,
    sticky: true,
    render: (row: InteractionAttachmentType) => row.question_rnumber || '-',
    sx: {
      position: 'sticky',
      left: 32,
      background: '#fff',
      zIndex: 10,
      borderRight: '1px solid #CBD6E2',
      borderBottom: '1px solid #CBD6E2 !important',
    },
  },
  {
    id: 'name',
    sortId: 'name',
    label: 'File Name',
    width: 250,
    render: (row: InteractionAttachmentType) => row.name || '-',
  },
  {
    id: 'type',
    sortId: 'type',
    label: 'Type',
    width: 60,
    render: (row: InteractionAttachmentType) => row.type || '-',
  },
  {
    id: 'size',
    sortId: 'size',
    label: 'Size',
    width: 80,
    render: (row: InteractionAttachmentType) => row.size || '-',
  },
  {
    id: 'uploaded_by',
    sortId: 'uploaded_by',
    label: 'Uploaded By',
    width: 140,
    render: (row: InteractionAttachmentType) => row.uploaded_by || '-',
  },
  {
    id: 'uploaded_date',
    sortId: 'uploaded_date',
    label: 'Uploaded Date',
    width: 180,
    render: (row: InteractionAttachmentType) =>
      formatDateToYYYYMMDDWithTime(row.uploaded_date) || '-',
  },
  {
    id: 'download_link',
    sortId: 'download_link',
    label: 'Download',
    width: 80,
    render: (row: InteractionAttachmentType) => (
      <button
        className='flex border border-[#CBD6E2] w-[24px] h-[24px] bg-[linear-gradient(180deg,_#FFFFFF_0%,_#E4E6E7_100%)] justify-center items-center cursor-pointer mx-auto'
        onClick={() => handleDownload(row.download_link)}
      >
        <DownloadIcon alt='download-icon' className='h-4' />
      </button>
    ),
  },
];
