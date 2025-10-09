import React, { useMemo } from 'react';
import { generatePath, useNavigate, useSearchParams } from 'react-router-dom';
import { Typography } from '@mui/material';
import { useNoteDetails } from '../../../../services/notes/notes-service';
import { NOTES_EDIT } from '../../../../../routes';
import DetailsSection, {
  DetailItem,
} from '../../../../../components/details-section/details';
import {
  applyHidePermission,
  formatDateToYYYYMMDDWithTime,
} from '../../../../../common-utils';
import SectionHeader from '../../../../../components/details-section/section-header';
import { NotesSideIcon } from '../../../../../assets';
import DetailsSectionSkeleton from '../../../../../components/skeleton-component/detailsskeleton';
import { RootState } from '../../../../../store/store';
import { useSelector } from 'react-redux';
import { AllPermissions } from '../../../../../common-service';

interface NoteDetailsProps {
  accountInActive: boolean;
  projectCode?: string;
  projectFiscalYear?: number | string;
}

const NotesDetails: React.FC<NoteDetailsProps> = ({
  accountInActive,
  projectCode,
}) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const accountId = searchParams.get('accountID') || '';
  const noteId = searchParams.get('note_id') || '';

  const { data, isLoading, error } = useNoteDetails(accountId, noteId, true);

  const { permission } = useSelector((state: RootState) => state.permission);

  // Permissions
  const notesEditFields = useMemo(
    () =>
      permission?.find((item) => item.name === AllPermissions.NOTES_VIEW_EDIT)
        ?.fields ?? [],
    [permission]
  );

  const notesFieldsEditable = useMemo(
    () =>
      permission
        .find((item) => item.name === AllPermissions.NOTES_VIEW_EDIT)
        ?.fields?.some((field) => field.edit),
    [permission]
  );

  const permissionMap = useMemo(() => {
    const map: Record<string, { read: boolean; edit: boolean }> = {};
    notesEditFields.forEach((item) => {
      map[item.name] = { read: item.read ?? false, edit: item.edit ?? false };
    });
    return map;
  }, [notesEditFields]);

  const handleEdit = () => {
    const path = generatePath(NOTES_EDIT, {
      module: 'project',
      noteId: noteId,
    });
    const queryParams = new URLSearchParams({
      accountId,
      entityLevel: data?.attachment_level || 'project',
      entityId: data?.attach_to || '',
      source: `Project > ${projectCode}`,
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
      hide: !notesFieldsEditable,
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
      value: data?.created_by_name,
      key: 'created_by_name',
    },
    {
      label: 'Updated On',
      value: formatDateToYYYYMMDDWithTime(data?.modified_datetime),
      key: 'modified_datetime',
    },
    {
      label: 'Updated By',
      value: data?.modified_by_name,
      key: 'modified_by_name',
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
      value: data?.notes_owner,
      key: 'notes_owner',
    },
    {
      label: 'Fiscal Year',
      value: `FY-${data?.fiscal_year}`,
      key: 'fiscal_year',
    },
    {
      label: 'Document Name',
      value: data?.document_name,
      key: 'document_name',
    },
  ];
  const noteDescription: DetailItem[] = [
    {
      label: 'Note Description',
      value: data?.descriptions,
      key: 'descriptions',
    },
  ];

  const basicDetails = applyHidePermission(basicInfo, permissionMap);
  const noteDescriptionDetails = applyHidePermission(
    noteDescription,
    permissionMap
  );
  const auditDetails = applyHidePermission(auditInfo, permissionMap);

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
            data={basicDetails}
            customStyle='pt-0 mt-0'
          />
          <DetailsSection
            title=''
            data={noteDescriptionDetails}
            fullColumn={true}
            customStyle='mt-0'
          />
          <DetailsSection
            title='Audit Information'
            data={auditDetails}
            customStyle='pt-0 mt-0'
            isAudit={true}
          />
        </>
      )}
    </div>
  );
};

export default NotesDetails;
