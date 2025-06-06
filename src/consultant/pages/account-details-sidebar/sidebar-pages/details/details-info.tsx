import { CircularProgress, Typography } from '@mui/material';
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

// interface ErrorProps {
//     message?: string;
// }

interface DetailsInfoProps {
  detailsInfo?: accountDetailsProps;
  isDetailsLoading?: boolean;
  detailsError?: boolean; //ErrorProps | null | undefined;
}

interface trasnformedKeyContacts {
  keyContactId?: string | undefined;
  keyContactName?: string | undefined;
  keyContactRole?: string | undefined;
  keyContactEmail?: string | undefined;
  isPrimaryContact?: boolean | undefined;
  includeInCommnunications?: boolean | undefined;
  keyContactStatus?: string | undefined;
}

interface DetailItem {
  label: string;
  value: React.ReactNode;
}

const DetailsInfo: React.FC<DetailsInfoProps> = ({
  detailsInfo,
  isDetailsLoading,
  detailsError,
  // accountId,
}) => {
  const accountById = detailsInfo?.accountById;
  const accountDetails = detailsInfo?.accountDetails;
  const isKeyContactAvailable =
    accountDetails?.keyContacts && accountDetails.keyContacts.length > 0;

  const dataResidency =
    DATA_STORAGE_OPTIONS.find(
      (option) => option.value === accountDetails?.data_storage
    )?.label || '-';

  if (isDetailsLoading) {
    return (
      <div className='flex items-center justify-center h-64'>
        <CircularProgress />
        <Typography variant='body1' className='ml-4'>
          Loading details...
        </Typography>
      </div>
    );
  }

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
    { label: 'Status', value: accountById?.status?.toString() || '-' },
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
      keyContactStatus: contact.status,
    }));

  const accountSettings: DetailItem[] = [
    { label: 'Fiscal Start', value: accountDetails?.fiscal_start_date },

    { label: 'Fiscal End', value: accountDetails?.fiscal_end_date },
    { label: '', value: 'empty' },
    { label: 'Blended Rate - FTE', value: accountDetails?.blended_rate_fte },
    {
      label: 'Blended Rate - SubCon',
      value: accountDetails?.blended_rate_subcon,
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
    {
      label: 'Created On',
      value: formatDateToYYYYMMDDWithTime(accountById?.created_datetime),
    },
    { label: 'Created By', value: accountById?.created_by },
    { label: 'Account ID', value: accountById?.r_number },
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
        customStyle='pt-2 mt-0'
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
        <KeyContactSection title='Key Contacts List' data={keyContactsList} />
      )}

      <DetailsSection title='Account Settings' data={accountSettings} />
      <DetailsSection title='Comments' data={description} fullColumn={true} />
      <DetailsSection title='Audit Information' data={auditInfo} />
    </Fragment>
  );
};

export default DetailsInfo;
