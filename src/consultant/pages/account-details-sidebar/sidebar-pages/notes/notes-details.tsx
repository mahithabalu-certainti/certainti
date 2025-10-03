import React from 'react';
import {
  generatePath,
  useNavigate,
  useParams,
  useSearchParams,
} from 'react-router-dom';
import { useNoteDetails } from '../../../../services/notes/notes-service';
import { NOTES_EDIT } from '../../../../../routes';
import DetailsSection, {
  DetailItem,
} from '../../../../../components/details-section/details';
import { formatDateToYYYYMMDDWithTime } from '../../../../../common-utils';
import SectionHeader from '../../../../../components/details-section/section-header';
import { NotesSideIcon } from '../../../../../assets';
import DetailsSectionSkeleton from '../../../../../components/skeleton-component/detailsskeleton';
import { Typography } from '@mui/material';

interface NoteDetailsProps {
  accountInActive: boolean;
}

const NotesDetails: React.FC<NoteDetailsProps> = ({ accountInActive }) => {
  const navigate = useNavigate();
  const { accountid } = useParams();
  const [searchParams] = useSearchParams();
  const noteId = searchParams.get('note_id') || '';

  const { data, isLoading, error } = useNoteDetails(accountid, noteId, true);

  const handleEdit = () => {
    const accountId = accountid ?? '';
    const path = generatePath(NOTES_EDIT, {
      module: 'account',
      noteId: noteId,
    });
    const queryParams = new URLSearchParams({
      accountId,
      entityLevel: 'account',
      entityId: accountId,
    });
    navigate(`${path}?${queryParams.toString()}`);
  };

  const handleBackClick = () => {
    searchParams.delete('note_id');
    navigate({ search: searchParams.toString() }, { replace: true });
  };

  const headerButtons = [
    {
      label: 'Edit',
      variant: 'outlined' as const,
      disabled: accountInActive,
      onClick: () => handleEdit(),
      sx: { width: '48px', minWidth: '48px' },
      hide: false,
    },
    {
      label: 'Back To Notes',
      variant: 'contained' as const,
      onClick: () => handleBackClick(),
      sx: { width: '105px', minWidth: '105px' },
    },
  ];

  const auditInfo: DetailItem[] = [
    {
      label: 'Record ID',
      value: data?.rid || noteId,
      key: 'rid',
    },
    {
      label: 'Note ID',
      value: data?.r_number,
      key: 'r_number',
    },
    {
      label: 'Created On',
      value: formatDateToYYYYMMDDWithTime(data?.created_datetime),
      key: 'created_datetime',
    },
    {
      label: 'Created By',
      value: data?.created_by,
      key: 'created_by',
    },
    {
      label: 'Updated On',
      value: formatDateToYYYYMMDDWithTime(data?.modified_datetime),
      key: 'modified_datetime',
    },
    {
      label: 'Updated By',
      value: data?.modified_by,
      key: 'modified_by',
    },
  ];

  const basicInfo: DetailItem[] = [
    {
      label: 'Title',
      value: data?.title,
      key: 'title',
    },
    {
      label: 'Note Owner',
      value: data?.note_owner,
      key: 'note_owner',
    },
    {
      label: 'Related To',
      value: data?.related_to,
      key: 'related_to',
    },
  ];

  return (
    <div className='border border-[#CBD6E2]'>
      <SectionHeader
        title='Note'
        subValue={data?.r_number || ''}
        titleIcon={
          <NotesSideIcon
            alt='note-icon'
            className={`w-7 h-7 p-1 [&>path]:stroke-white bg-[#7F81F4] rounded-[2px]`}
          />
        }
        className='rounded-tl-[2px] h-[40px] rounded-tr-[2px]'
        buttons={headerButtons}
      />
      {isLoading ? (
        <DetailsSectionSkeleton className='p-0 m-0' />
      ) : error ? (
        <div className='flex items-center justify-center h-64 p-4'>
          <Typography variant='h6' color='error' className='mb-2'>
            Error loading note details
          </Typography>
        </div>
      ) : (
        <>
          <DetailsSection
            title='Basic Information'
            data={basicInfo}
            customStyle='pt-0 mt-0'
          />
          <DetailsSection
            title='Audit Information'
            data={auditInfo}
            customStyle='pt-0 mt-0'
            isAudit={true}
          />
        </>
      )}
    </div>
  );
};

export default NotesDetails;
