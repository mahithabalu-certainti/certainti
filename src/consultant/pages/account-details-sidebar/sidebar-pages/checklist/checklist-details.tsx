import React, { useMemo } from 'react';
import {
  generatePath,
  useNavigate,
  useParams,
  useSearchParams,
} from 'react-router-dom';
import { useChecklistDetails } from '../../../../services/checklist/checklist-service';
import { CHECKLIST, CHECKLIST_EDIT } from '../../../../../routes';
import DetailsSection, {
  DetailItem,
} from '../../../../../components/details-section/details';
import {
  applyHidePermission,
  formatDateToYYYYMMDDWithTime,
} from '../../../../../common-utils';
import SectionHeader from '../../../../../components/details-section/section-header';
import DetailsSectionSkeleton from '../../../../../components/skeleton-component/detailsskeleton';
import { Typography } from '@mui/material';
import { RootState } from '../../../../../store/store';
import { useSelector } from 'react-redux';
import { AllPermissions } from '../../../../../common-service';
import { ChecklistIcon } from '../../../../../assets';

interface ChecklistDetailsProps {
  accountInActive: boolean;
  accountName: string;
}

const ChecklistDetails: React.FC<ChecklistDetailsProps> = ({
  accountInActive,
  accountName,
}) => {
  const navigate = useNavigate();
  const { accountid } = useParams();
  const [searchParams] = useSearchParams();
  const checklistId = searchParams.get('checklist_id') || '';
  const originPath = searchParams.get('origin') || '';
  const activeMenuPath = searchParams.get('activeMenu') || '';

  const { data, isLoading, error } = useChecklistDetails(
    accountid,
    checklistId,
    true
  );

  const { permission } = useSelector((state: RootState) => state.permission);

  // Permissions
  const checklistEditFields = useMemo(
    () =>
      permission?.find(
        (item) => item.name === AllPermissions.CHECKLIST_VIEW_EDIT
      )?.fields ?? [],
    [permission]
  );

  const checklistFieldsEditable = useMemo(
    () =>
      permission
        .find((item) => item.name === AllPermissions.CHECKLIST_VIEW_EDIT)
        ?.fields?.some((field) => field.edit),
    [permission]
  );

  const permissionMap = useMemo(() => {
    const map: Record<string, { read: boolean; edit: boolean }> = {};
    checklistEditFields.forEach((item) => {
      map[item.name] = { read: item.read ?? false, edit: item.edit ?? false };
    });
    return map;
  }, [checklistEditFields]);

  const handleEdit = () => {
    const accountId = accountid ?? '';
    const path = generatePath(CHECKLIST_EDIT, {
      module: 'account',
      checklistId,
    });
    const queryParams = new URLSearchParams({
      accountId,
      entityLevel: data?.attachment_level || 'account',
      entityId: data?.attach_to || accountId,
      source: `Account > ${accountName}`,
      ...(!activeMenuPath ? {} : { activeMenu: activeMenuPath }),
    });
    navigate(`${path}?${queryParams.toString()}`);
  };

  const handleBackClick = () => {
    searchParams.delete('checklist_id');
    if (originPath === 'checklist') {
      navigate(CHECKLIST);
    } else {
      navigate({ search: searchParams.toString() }, { replace: true });
    }
  };

  const headerButtons = [
    {
      label: 'Edit',
      variant: 'outlined' as const,
      disabled: accountInActive,
      onClick: handleEdit,
      sx: { width: '48px', minWidth: '48px' },
      hide: !checklistFieldsEditable,
    },
    {
      label: 'Back To Checklist',
      variant: 'contained' as const,
      onClick: handleBackClick,
      sx: { width: '140px', minWidth: '140px' },
    },
  ];

  const auditInfo: DetailItem[] = [
    {
      label: 'Record ID',
      value: data?.rid || checklistId,
      key: 'rid',
    },
    {
      label: 'Checklist ID',
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
      label: 'Checklist Name',
      value: data?.title,
      key: 'title',
    },
    {
      label: 'Checklist Level',
      value: data?.attachment_level,
      key: 'attachment_level',
    },
    {
      label: 'Fiscal Year',
      value: `FY-${data?.fiscal_year}`,
      key: 'fiscal_year',
    },
    {
      label: 'Related To ID',
      value: data?.attach_to,
      key: 'attach_to',
    },
    {
      label: 'Related To Name',
      value: data?.attached_to,
      key: 'attached_to',
    },
  ];

  const checklistDescription: DetailItem[] = [
    {
      label: 'Checklist Description',
      value: data?.descriptions,
      key: 'descriptions',
    },
  ];

  const basicDetails = applyHidePermission(basicInfo, permissionMap);
  const checklistDescriptionDetails = applyHidePermission(
    checklistDescription,
    permissionMap
  );
  const auditDetails = applyHidePermission(auditInfo, permissionMap);

  return (
    <div className='border border-[#CBD6E2]'>
      <SectionHeader
        title='Checklist'
        subValue={data?.r_number || ''}
        titleIcon={
          <ChecklistIcon
            alt='checklist-icon'
            className='w-7 h-7 p-1 [&>path]:stroke-white bg-[#FFB46E] rounded-[2px]'
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
            Error loading checklist details
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
            data={checklistDescriptionDetails}
            fullColumn={true}
            customStyle='pt-[1px]'
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

export default ChecklistDetails;
