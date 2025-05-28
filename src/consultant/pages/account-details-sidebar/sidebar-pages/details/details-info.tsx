import {
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { Fragment } from 'react/jsx-runtime';
import {
  accountDetailsProps,
  KeyContactProps,
} from '../../../account-details/utils';

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

const DetailsSection: React.FC<{
  title: string;
  data: DetailItem[];
}> = ({ title, data }) => {
  // Split data into two columns
  const leftColumn: DetailItem[] = [];
  const rightColumn: DetailItem[] = [];

  data.forEach((item, index) => {
    if (index % 2 === 0) {
      leftColumn.push(item);
    } else {
      rightColumn.push(item);
    }
  });

  const renderValue = (value: React.ReactNode, label?: string) => {
    if (typeof value === 'string') {
      const status = value.toLowerCase();
      if (status === 'active') {
        return <span className='text-[#199806]'>Active</span>;
      }
      if (status === 'inactive') {
        return <span className='text-[#f44336]'>In-Active</span>;
      }
      if (label && label.toLowerCase() === 'website') {
        return (
          <span className='font-medium text-[13px] text-[#425A76]'>
            {value ? (
              <a
                href={value}
                target='_blank'
                className='underline decoration-[#425A76]'
              >
                {value}
              </a>
            ) : (
              '-'
            )}
          </span>
        );
      }
    }
    return (
      <span className='font-medium text-[13px] text-[#425A76]'>
        {value || '-'}
      </span>
    );
  };

  return (
    <div
      className={
        title === 'Basic Information' ? 'px-6 pt-2 mt-0' : 'px-6 pt-2 mt-3'
      }
    >
      <div className='text-[15px] text-[#2D3E4F] font-bold'>{title}</div>
      <div className='text-sm my-[6px] grid gap-y-3'>
        {title === 'Comments'
          ? // Full-width single column layout for Comments
            data.map((item, index) => (
              <div
                key={`comment-row-${index}`}
                className='grid grid-cols-[120px_auto] sm:grid-cols-[200px_auto] gap-x-2'
              >
                <div className='text-right font-semibold text-[13px] text-[#425A76] pr-1'>
                  {item.label}
                </div>
                <div className='font-medium text-[13px] break-all overflow-hidden'>
                  {renderValue(item.value)}
                </div>
              </div>
            ))
          : leftColumn.map((leftItem, index) => {
              const rightItem = rightColumn[index];

              return (
                <div
                  key={`row-${index}`}
                  className='grid grid-cols-1 md:grid-cols-2 gap-6'
                >
                  {/* Left column */}
                  <div className='grid grid-cols-[120px_auto] sm:grid-cols-[200px_auto] gap-x-2'>
                    <div className='text-right font-semibold text-[13px] text-[#425A76] pr-1'>
                      {leftItem.label}
                    </div>
                    <div className='font-medium text-[13px] break-all overflow-hidden'>
                      {renderValue(leftItem.value, leftItem.label)}
                    </div>
                  </div>

                  {/* Right column */}
                  {rightItem ? (
                    <div className='grid grid-cols-[120px_auto] sm:grid-cols-[200px_auto] gap-x-2'>
                      <div className='text-right font-semibold text-[13px] text-[#425A76] pr-1'>
                        {rightItem.label}
                      </div>
                      <div className='font-medium text-[13px] break-all overflow-hidden'>
                        {renderValue(rightItem.value, rightItem.label)}
                      </div>
                    </div>
                  ) : (
                    <div />
                  )}
                </div>
              );
            })}
      </div>
    </div>
  );
};

const KeyContactSection: React.FC<{
  title: string;
  data: trasnformedKeyContacts[];
}> = ({ title, data }) => {
  return (
    <div className=''>
      <div className='flex items-center align-middle px-6 h-[30px] border-x-0 border border-[#CBD6E2] text-[#2D3E4F] text-[14px] font-bold bg-[#F5F9FF]'>
        {title}
      </div>
      <TableContainer
        sx={{
          'overflow-x': 'auto',
        }}
      >
        <Table>
          <TableHead
            sx={{
              '& .MuiTableCell-root': {
                fontWeight: 700,
                fontSize: '13px',
                color: '#2A2A2A',
                padding: '0px 8px',
                height: '29px',
                boxSizing: 'border-box',
                backgroundColor: ' #FCFCFC',
                borderBottom: '1px solid #CBD6E2',
              },
              '& .MuiTableCell-root:first-of-type': {
                paddingLeft: '24px',
              },
            }}
          >
            <TableRow sx={{ height: 29 }}>
              <TableCell sx={{ minWidth: '140px' }}>ID</TableCell>
              <TableCell sx={{ minWidth: '140px' }}>Name</TableCell>
              <TableCell sx={{ minWidth: '140px' }}>Role</TableCell>
              <TableCell sx={{ minWidth: '180px' }}>Email</TableCell>
              <TableCell sx={{ minWidth: '140px' }}>
                Is Primary Contact?
              </TableCell>
              <TableCell sx={{ minWidth: '190px' }}>
                Include in Communications?
              </TableCell>
              <TableCell sx={{ minWidth: '140px', borderRight: 'none' }}>
                Status
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody
            sx={{
              '& .MuiTableCell-root': {
                padding: '0px 8px',
                borderBottom: '1px solid #CBD6E2',
                // borderTop: 'none',
                height: '30px',
                color: '#425A76',
                fontWeight: 500,
                fontSize: '13px',
                // borderRight: 'none',
              },
              '& .MuiTableRow-root > .MuiTableCell-root:first-of-type': {
                paddingLeft: '24px',
              },
            }}
          >
            {data.map((field) => (
              <TableRow
                sx={{
                  '& .MuiTableCell-root': {
                    height: '30px !important',
                  },
                }}
              >
                <TableCell sx={{ minWidth: '140px' }}>
                  {field.keyContactId || '-'}
                </TableCell>
                <TableCell sx={{ minWidth: '140px' }}>
                  {field.keyContactName || '-'}
                </TableCell>
                <TableCell sx={{ minWidth: '140px' }}>
                  {field.keyContactRole || '-'}
                </TableCell>
                <TableCell
                  sx={{
                    minWidth: '180px',
                    textDecoration: field.keyContactEmail
                      ? 'underline'
                      : 'none',
                    textDecorationColor: '#425A76',
                  }}
                >
                  {field.keyContactEmail || '-'}
                </TableCell>
                <TableCell sx={{ minWidth: '140px' }}>
                  {field.isPrimaryContact ? 'Yes' : 'No'}
                </TableCell>
                <TableCell sx={{ minWidth: '190px' }}>
                  {field.includeInCommnunications ? 'Yes' : 'No'}
                </TableCell>
                <TableCell
                  sx={{
                    minWidth: '140px',
                    borderRight: 'none',
                    color:
                      field.keyContactStatus?.toLowerCase() === 'active'
                        ? '#3EA72F !important'
                        : '#f44336 !important',
                  }}
                >
                  {field.keyContactStatus?.toLowerCase() === 'active'
                    ? 'Active'
                    : 'In-Active'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </div>
  );
};

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

  // const resourceData = resourceDetails?.data?.projectResourceDetails;

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
      label: 'Account Name',
      value: accountById?.account_name?.toString() || '-',
    },
    {
      label: 'Industry',
      value: accountById?.industry?.industry_name?.toString() || '-',
    },
    {
      label: 'Business Details',
      value: accountDetails?.business_details?.toString() || '-',
    },
    {
      label: 'Is Parent Account',
      value: accountById?.is_parent ? 'Yes' : 'No',
    },
    {
      label: 'Parent Account',
      value: accountById?.parent_account?.account_name?.toString() || '-',
    },
    { label: 'Status', value: accountById?.status?.toString() || '-' },
    { label: 'Website', value: accountDetails?.website?.toString() },
    {
      label: 'Delivery Manager',
      value: accountDetails?.project_manager?.toString() || '-',
    },
    {
      label: 'Annual Revenue',
      value: accountById?.annual_revenue?.toString() || '-',
    },
  ];
  const locationInfo: DetailItem[] = [
    { label: 'Country', value: accountById?.country?.country_name },
    { label: 'Region', value: accountById?.region?.region_name }, // need to inform BE
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
    {
      label: 'Auto Send Interaction',
      value: accountDetails?.autosend_interaction,
    }, // need to Discuss
    {
      label: 'Max Interaction Follow up',
      value: accountDetails?.max_ai_interactions,
    },
    { label: 'Auto Assessment', value: accountDetails?.auto_access_rd }, // need to Discuss
    { label: 'Blended Rate - FTE', value: accountDetails?.blended_rate_fte },
    {
      label: 'Blended Rate - SubCon',
      value: accountDetails?.blended_rate_subcon,
    },
    { label: 'Data Residency', value: accountDetails?.data_residency },
  ];

  const auditInfo: DetailItem[] = [
    { label: 'Record ID', value: accountDetails?.account_rid },
    { label: 'Account ID', value: accountById?.r_number },
    { label: 'Created On', value: accountDetails?.created_datetime },
    { label: 'Created By', value: accountDetails?.created_by },
    { label: 'Updated On', value: accountDetails?.modified_datetime },
    { label: 'Updated By', value: accountDetails?.modified_by },
  ];
  const description: DetailItem[] = [
    { label: 'Comments', value: accountById?.comments },
  ];

  return (
    <Fragment>
      <DetailsSection title='Basic Information' data={basicInfo} />
      <DetailsSection
        title='Location and Currency Information'
        data={locationInfo}
      />
      {isKeyContactAvailable && keyContactsList && (
        <KeyContactSection title='Key Contacts List' data={keyContactsList} />
      )}

      <DetailsSection title='Account Settings' data={accountSettings} />
      <DetailsSection title='Comments' data={description} />
      <DetailsSection title='Audit Information' data={auditInfo} />
    </Fragment>
  );
};

export default DetailsInfo;
