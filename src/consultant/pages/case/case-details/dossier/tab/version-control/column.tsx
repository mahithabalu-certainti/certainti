import { DownloadIcon } from '../../../../../../../assets';
import { formatDateToYYYYMMDDWithTime } from '../../../../../../../common-utils';
import { ListTableColumn } from '../../../../../../../components/table/types';
import { VersionControlItem } from '../../../../../../types/dossier';

/**
 * Returns columns for the Version Control table.
 * @param onVersionDownload - called with the row's dossier_version when the download button is clicked
 */
export const getVersionControlColumns = (
  onVersionDownload: (dossier_version: string) => void
): ListTableColumn<VersionControlItem>[] => [
  {
    id: 'document_name',
    label: 'Document Name',
    sortable: true,
    sortId: 'document_name',
    width: 280,
  },
  {
    id: 'dossier_version',
    label: 'Version',
    sortable: true,
    sortId: 'dossier_version',
    width: 150,
  },
  {
    id: 'created_by_name',
    label: 'Created By',
    sortable: true,
    sortId: 'created_by_name',
    width: 250,
  },
  {
    id: 'created_datetime',
    label: 'Created On',
    sortable: true,
    sortId: 'created_datetime',
    width: 200,
    render: (row: VersionControlItem) => {
      return formatDateToYYYYMMDDWithTime(row.created_datetime);
    },
  },
  {
    id: 'r_number',
    label: 'Version ID',
    sortable: true,
    sortId: 'r_number',
    width: 200,
  },
  {
    id: 'download',
    label: 'Download',
    sortable: false,
    sortId: 'download',
    width: 80,
    render: (row) => (
      <button
        className='flex border border-[#CBD6E2] w-[24px] h-[24px] bg-[linear-gradient(180deg,_#FFFFFF_0%,_#E4E6E7_100%)] justify-center items-center cursor-pointer mx-auto'
        onClick={() => onVersionDownload(row.dossier_version)}
      >
        <DownloadIcon alt='download-icon' className='h-4' />
      </button>
    ),
  },
];
