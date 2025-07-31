import { Typography } from '@mui/material';
import { Fragment } from 'react/jsx-runtime';
import {
  accountDetailsProps,
  KeyContactProps,
} from '../../../account-details/utils';
import {
  applyHidePermission,
  checkPermission,
  costDisplay,
  formatDateToYYYYMMDDWithTime,
} from '../../../../../common-utils';
import DetailsSection from '../../../../../components/details-section/details';
import KeyContactSection from '../../../../../components/details-section/keyContact';
import DetailsTable from '../../../../../components/details-section/details-table';
import { RootState } from '../../../../../store/store';
import { AllPermissions } from '../../../../../common-service';
import { useSelector } from 'react-redux';
import { useMemo } from 'react';
import { DATA_STORAGE_OPTIONS } from '../../../account-create/utils';
import { getDetailsAttachmentColumns } from '../../../../../components/details-section/helpers';

interface DetailsInfoProps {
  detailsInfo?: accountDetailsProps;
  isDetailsLoading?: boolean;
  detailsError?: boolean; //ErrorProps | null | undefined;
  isKeyContactAvailable?: boolean;
}

interface trasnformedKeyContacts {
  keyContactId?: string | undefined;
  keyContactName?: string | undefined;
  keyContactRole?: string | undefined;
  keyContactEmail?: string | undefined;
  isPrimaryContact?: boolean | undefined;
  includeInCommnunications?: boolean | undefined;
  interactionccRecipient?: boolean | undefined;
  keyContactStatus?: string | undefined;
}

interface DetailItem {
  label: string;
  value: React.ReactNode;
  key?: string;
}

const DetailsInfo: React.FC<DetailsInfoProps> = ({
  detailsInfo,
  detailsError,
  isKeyContactAvailable,
}) => {
  const accountById = detailsInfo?.accountById;
  const accountDetails = detailsInfo?.accountDetails;
  const dataResidency =
    DATA_STORAGE_OPTIONS.find(
      (option) => option.value === accountDetails?.data_storage
    )?.label || '-';

  const { permission } = useSelector((state: RootState) => state.permission);
  const userViewEditFields = useMemo(
    () =>
      permission.find((item) => item.name === AllPermissions.ACCOUNTS_VIEW_EDIT)
        ?.fields ?? [],
    [permission]
  );
  const permissionMap = useMemo(() => {
    const map: Record<string, { read: boolean; edit: boolean }> = {};
    userViewEditFields.forEach((item) => {
      map[item.name] = { read: item.read ?? false, edit: item.edit ?? false };
    });
    return map;
  }, [userViewEditFields]);
  const keycontactVisable =
    !permissionMap['keyContacts']?.read && !permissionMap['keyContacts']?.edit;

  const isAttachmentViewEnable = checkPermission(
    permission || [],
    AllPermissions.ATTACHMENT_VIEW_EDIT
  );

  const attachmentViewEditFields = useMemo(
    () =>
      permission?.find(
        (item) => item.name === AllPermissions.ATTACHMENT_VIEW_EDIT
      )?.fields ?? [],
    [permission]
  );

  const attachmentPermissionMap = useMemo(() => {
    const map: Record<string, { read: boolean; edit: boolean }> = {};
    attachmentViewEditFields.forEach((item) => {
      map[item.name] = { read: item.read ?? false, edit: item.edit ?? false };
    });
    return map;
  }, [attachmentViewEditFields]);

  const attachmentColumns = getDetailsAttachmentColumns(
    attachmentPermissionMap
  );

  if (detailsError) {
    return (
      <div className='flex flex-col items-center justify-center h-64 p-4'>
        <Typography variant='h6' color='error' className='mb-2'>
          Error loading details
        </Typography>
        <Typography
          variant='body2'
          color='textSecondary'
          className='text-center'
        >
          {'Failed to fetch details. Please try again later.'}
        </Typography>
      </div>
    );
  }

  if (!detailsInfo) {
    return (
      <div className='flex flex-col items-center justify-center h-64 p-4'>
        <Typography variant='h6' color='textSecondary'>
          No details available
        </Typography>
      </div>
    );
  }

  const basicInfo: DetailItem[] = [
    {
      label: 'Name',
      value: accountById?.account_name?.toString() || '-',
      key: 'account_name',
    },
    {
      label: 'Is Parent Account',
      value: accountById?.is_parent ? 'Yes' : 'No',
      key: 'is_parent',
    },
    {
      label: 'Parent Account',
      value: accountById?.parent_account?.account_name?.toString() || '-',
      key: 'parent_account_rid',
    },
    {
      label: 'Industry',
      value: accountById?.industry?.industry_name?.toString() || '-',
      key: 'industry_rid',
    },
    {
      label: 'Website',
      value: accountDetails?.website?.toString(),
      key: 'website',
    },
    {
      label: 'Annual Revenue',
      value:
        costDisplay(
          accountById?.annual_revenue?.toString(),
          accountById?.currency?.currency_symbol
        ) || '-',
      key: 'annual_revenue',
    },
    {
      label: 'Status',
      value: accountById?.status?.status_name || '-',
      key: 'status_rid',
    },
    {
      label: 'Org Name',
      value: accountById?.organisation_name?.toString() || '-',
      key: 'organisation_name',
    },
  ];
  const businessInfo: DetailItem[] = [
    {
      label: 'Business Details',
      value: accountDetails?.business_details?.toString() || '-',
      key: 'business_details',
    },
  ];
  const locationInfo: DetailItem[] = [
    {
      label: 'Country',
      value: accountById?.country?.country_name,
      key: 'country_rid',
    },
    {
      label: 'Region',
      value: accountById?.region_details?.state_name,
      key: 'region_rid',
    },
    {
      label: 'Currency',
      value: accountById?.currency?.currency_code,
      key: 'currency_rid',
    },
  ];
  const keyContactsList: trasnformedKeyContacts[] | undefined =
    accountDetails?.keyContacts.map((contact: KeyContactProps) => ({
      keyContactId: contact.r_number,
      keyContactName: contact.key_contact_name,
      keyContactRole: contact.role_name,
      keyContactEmail: contact.key_contact_email,
      isPrimaryContact: contact.is_primary_contact,
      includeInCommnunications: contact.include_in_communication,
      interactionccRecipient: contact.interaction_cc_recipient,
      keyContactStatus: contact?.status_name,
    }));

  const accountSettings: DetailItem[] = [
    {
      label: 'Fiscal Start',
      value: accountDetails?.fiscal_start_date,
      key: 'fiscal_start_date',
    },

    {
      label: 'Fiscal End',
      value: accountDetails?.fiscal_end_date,
      key: 'fiscal_end_date',
    },
    { label: 'Data Residency', value: dataResidency, key: 'data_storage' },
  ];

  const auditInfo: DetailItem[] = [
    { label: 'Record ID', value: accountDetails?.account_rid, key: 'rid' },
    { label: 'Account ID', value: accountById?.r_number, key: 'r_number' },
    {
      label: 'Created On',
      value: formatDateToYYYYMMDDWithTime(accountById?.created_datetime),
      key: 'created_datetime',
    },
    { label: 'Created By', value: accountById?.created_by, key: 'created_by' },
    {
      label: 'Updated On',
      value: formatDateToYYYYMMDDWithTime(accountById?.modified_datetime),
      key: 'modified_datetime',
    },
    {
      label: 'Updated By',
      value: accountById?.modified_by,
      key: 'modified_by',
    },
  ];
  const description: DetailItem[] = [
    { label: 'Comments', value: accountById?.comments, key: 'comments' },
  ];

  const basicDetails = applyHidePermission(basicInfo, permissionMap);
  const auditDetails = applyHidePermission(auditInfo, permissionMap);
  const businessDetails = applyHidePermission(businessInfo, permissionMap);
  const locationDetails = applyHidePermission(locationInfo, permissionMap);
  const descriptionDetails = applyHidePermission(description, permissionMap);
  const accountSettingsDetails = applyHidePermission(
    accountSettings,
    permissionMap
  );

  console.log('accountSettingsDetails', accountSettingsDetails);

  return (
    <Fragment>
      <DetailsSection
        title='Basic Information'
        data={basicDetails}
        customStyle='pt-0 mt-0'
      />
      <DetailsSection
        title=''
        data={businessDetails}
        fullColumn={true}
        customStyle='mt-0'
      />
      <DetailsSection
        title='Location and Currency Information'
        data={locationDetails}
        customStyle=' pt-2 mt-2 mb-4'
      />
      {isKeyContactAvailable && keyContactsList && !keycontactVisable && (
        <KeyContactSection
          title='Key Contacts List'
          data={keyContactsList || []}
          ccAvailable={true}
        />
      )}
      <DetailsSection title='Account Settings' data={accountSettingsDetails} />
      <DetailsSection
        title='Comments'
        data={descriptionDetails}
        fullColumn={true}
      />
      {accountDetails?.attachments &&
        accountDetails?.attachments.length > 0 &&
        isAttachmentViewEnable && (
          <DetailsTable
            title='Attachments'
            columns={attachmentColumns}
            data={accountDetails?.attachments || []}
          />
        )}
      <DetailsSection
        title='Audit Information'
        data={auditDetails}
        isAudit={true}
      />
    </Fragment>
  );
};

export default DetailsInfo;
