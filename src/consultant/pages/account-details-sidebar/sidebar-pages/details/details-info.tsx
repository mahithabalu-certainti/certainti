import { Typography } from '@mui/material';
import { Fragment } from 'react/jsx-runtime';
import {
  accountDetailsProps,
  KeyContactProps,
} from '../../../account-details/utils';
import {
  costDisplay,
  formatDateToYYYYMMDDWithTime,
} from '../../../../../common-utils';
import { DATA_STORAGE_OPTIONS } from '../../../account-create/utils';
import DetailsSection from '../../../../../components/details-section/details';
import KeyContactSection from '../../../../../components/details-section/keyContact';
import DetailsTable from '../../../../../components/details-section/details-table';
import { attachmentColumns } from '../../../../../components/details-section/helpers';

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
    },
    {
      label: 'Is Parent Account',
      value: accountById?.is_parent ? 'Yes' : 'No',
    },
    {
      label: 'Parent Account',
      value: accountById?.parent_account?.account_name?.toString() || '-',
    },
    {
      label: 'Industry',
      value: accountById?.industry?.industry_name?.toString() || '-',
    },
    { label: 'Website', value: accountDetails?.website?.toString() },
    {
      label: 'Annual Revenue',
      value:
        costDisplay(
          accountById?.annual_revenue?.toString(),
          accountById?.currency?.currency_symbol
        ) || '-',
    },
    {
      label: 'Status',
      value: accountById?.status?.status_name || '-',
    },
    {
      label: 'Org Name',
      value: accountById?.organisation_name?.toString() || '-',
    },
  ];
  const businessInfo: DetailItem[] = [
    {
      label: 'Business Details',
      value: accountDetails?.business_details?.toString() || '-',
    },
  ];
  const locationInfo: DetailItem[] = [
    { label: 'Country', value: accountById?.country?.country_name },
    { label: 'Region', value: accountById?.region_details?.state_name },
    { label: 'Currency', value: accountById?.currency?.currency_code },
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
    { label: 'Fiscal Start', value: accountDetails?.fiscal_start_date },

    { label: 'Fiscal End', value: accountDetails?.fiscal_end_date },
    { label: '', value: 'empty' },
    {
      label: 'Blended Rate - FTE',
      value:
        costDisplay(
          accountDetails?.blended_rate_fte?.toString(),
          accountById?.currency?.currency_symbol
        ) || '-',
    },
    {
      label: 'Blended Rate - SubCon',
      value:
        costDisplay(
          accountDetails?.blended_rate_subcon?.toString(),
          accountById?.currency?.currency_symbol
        ) || '-',
    },
    { label: '', value: 'empty' },
    {
      label: 'Auto Assessment',
      value: accountDetails?.auto_access_rd ? 'Yes' : 'No',
    },
    {
      label: 'Auto Send Interaction',
      value: accountDetails?.autosend_interaction ? 'Yes' : 'No',
    },
    {
      label: 'Max Interaction Follow up',
      value: accountDetails?.max_ai_interactions,
    },
    { label: 'Data Residency', value: dataResidency },
  ];

  const auditInfo: DetailItem[] = [
    { label: 'Record ID', value: accountDetails?.account_rid },
    { label: 'Account ID', value: accountById?.r_number },
    {
      label: 'Created On',
      value: formatDateToYYYYMMDDWithTime(accountById?.created_datetime),
    },
    { label: 'Created By', value: accountById?.created_by },
    {
      label: 'Updated On',
      value: formatDateToYYYYMMDDWithTime(accountById?.modified_datetime),
    },
    { label: 'Updated By', value: accountById?.modified_by },
  ];
  const description: DetailItem[] = [
    { label: 'Comments', value: accountById?.comments },
  ];

  return (
    <Fragment>
      <DetailsSection
        title='Basic Information'
        data={basicInfo}
        customStyle='pt-0 mt-0'
      />
      <DetailsSection
        title=''
        data={businessInfo}
        fullColumn={true}
        customStyle='mt-0'
      />
      <DetailsSection
        title='Location and Currency Information'
        data={locationInfo}
        customStyle=' pt-2 mt-2 mb-4'
      />
      {isKeyContactAvailable && keyContactsList && (
        <KeyContactSection
          title='Key Contacts List'
          data={keyContactsList || []}
          ccAvailable={true}
        />
      )}

      <DetailsSection title='Account Settings' data={accountSettings} />
      <DetailsSection title='Comments' data={description} fullColumn={true} />
      {accountDetails?.attachments &&
        accountDetails?.attachments.length > 0 && (
          <DetailsTable
            title='Attachments'
            columns={attachmentColumns}
            data={accountDetails?.attachments || []}
          />
        )}
      <DetailsSection
        title='Audit Information'
        data={auditInfo}
        isAudit={true}
      />
    </Fragment>
  );
};

export default DetailsInfo;
