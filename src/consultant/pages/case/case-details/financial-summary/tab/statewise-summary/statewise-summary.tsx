import React, { useEffect, useMemo, useState } from 'react';
import { ListTable } from '../../../../../../../components/table';
import { useParams } from 'react-router-dom';
import { useGetFinancialSummary } from '../../../../../../services/financial/financial-service';
import {
  FinancialSummaryFlag,
  SelectOption,
  SummaryDetailedMetric,
  SummaryRdCredits,
  SummaryResourceMetric,
} from '../../../../../../types';
import {
  getDetailedMetricColumns,
  getRdCreditsColumns,
  getResourceMetricColumns,
} from './columns';
import { Box, MenuItem, Select, Skeleton } from '@mui/material';
import TextButton from '../../../../../../../components/button/text-button';
import { useFetchFinancialStates } from '../../../../../../services/account';
import { useSelector } from 'react-redux';
import { RootState } from '../../../../../../../store/store';
import { AllPermissions } from '../../../../../../../common-service';
import { DetailsKeyContactErrorIcon } from '../../../../../../../assets';
import { accountDetailsProps } from '../../../../../account-details/utils';

interface FinancialSummaryProps {
  fiscalYear: string;
  accountDetails?: accountDetailsProps;
  countryId?: string | null;
  stateId?: string | null;
  caseRid?: string;
  accountId?: string;
}

export const StateWiseSummary: React.FC<FinancialSummaryProps> = ({
  fiscalYear,
  countryId,
  stateId,
  accountDetails,
  caseRid,
  accountId,
}) => {
  // hooks
  const { accountid: paramAccountId } = useParams();
  const accountid = accountId || paramAccountId;
  const { permission } = useSelector((state: RootState) => state.permission);

  // UseStates
  const [resourceMetric, setResourceMetric] = useState<SummaryResourceMetric[]>(
    []
  );
  const [detailedMetric, setDetailedMetric] = useState<SummaryDetailedMetric[]>(
    []
  );
  const [rdCredits, setRdCredits] = useState<SummaryRdCredits[]>([]);
  const [region, setRegion] = useState('');
  const [payload, setPayload] = useState({
    flag: 'all',
    region_rid: '',
  });

  const currencySymbol = accountDetails?.accountById?.currency?.currency_symbol;

  // API Hooks
  const { mutate, isPending, isError, data } = useGetFinancialSummary(true);
  const financislStates = useFetchFinancialStates({
    accountId: accountid as string,
    countryId: countryId as string,
    fiscalYear,
  });

  // Variables
  const memoizedState: SelectOption[] = useMemo(
    () =>
      financislStates.data?.data.map((state) => ({
        label: state.state_name,
        value: state.rid,
      })) || [],
    [financislStates.data?.data]
  );
  const allData = data?.data;
  const summaryViewEditFields = useMemo(
    () =>
      permission.find(
        (item) =>
          item.name === AllPermissions.ACCOUNT_FINANCIAL_STATEWISE_SUMMARY_VIEW
      )?.fields ?? [],
    [permission]
  );
  const permissionMap = useMemo(() => {
    const map: Record<string, { read: boolean; edit: boolean }> = {};
    summaryViewEditFields.forEach((item) => {
      map[item.name] = { read: item.read ?? false, edit: item.edit ?? false };
    });
    return map;
  }, [summaryViewEditFields]);
  const accountName = accountDetails?.accountById?.account_name;

  // UseEffects
  useEffect(() => {
    if (
      accountid &&
      fiscalYear &&
      (stateId || payload.region_rid) &&
      payload.flag
    ) {
      mutate({
        account_rid: accountid,
        fiscal_year: Number(fiscalYear),
        summaryType: 'state',
        region_rid: (payload.region_rid || stateId) as string,
        flag: payload.flag as FinancialSummaryFlag,
        case_rid: caseRid,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    accountid,
    fiscalYear,
    payload.region_rid,
    payload.flag,
    stateId,
    caseRid,
  ]);
  useEffect(() => {
    if (allData) {
      setResourceMetric(allData.resource_metrics);
      setRdCredits(allData.claim_jurisdiction);
      const updatedDetailedMetrics = allData.detailed_metrics.map((item) => {
        const permission = permissionMap?.[item.permission];
        const hide = permission ? !permission.edit && !permission.read : false;
        return {
          ...item,
          hide,
        };
      });
      setDetailedMetric(updatedDetailedMetrics);
    }
  }, [allData, permissionMap]);

  // Functions
  const getResourceMetricRowId = (row: SummaryResourceMetric) => row.rid;
  const getDetailedMetricRowId = (row: SummaryDetailedMetric) => row.rid;
  const getRdCreditsRowId = (row: SummaryRdCredits) => row.rid;

  return (
    <div className='flex flex-col gap-4'>
      {accountName && !countryId && (
        <Box className='flex items-center gap-1.5 h-8 border-b border-[#FFC77B] bg-[#FEF8F0] text-[13px] text-[#2D3E4F] px-3 py-2 border-box -mt-3 -mx-3 -mb-1'>
          <Box>
            <DetailsKeyContactErrorIcon alt='key-contact' />
          </Box>
          <Box>
            <span className='font-bold mr-1'>Country </span> -{' '}
            <span className='ml-1 font-medium'>
              {' '}
              {`Not added for ${accountName}`}
            </span>
          </Box>
        </Box>
      )}
      <div>
        <div className='flex mb-5 mt-2 gap-3 items-center'>
          <div className='w-[300px]'>
            {financislStates.isLoading ? (
              <Skeleton variant='rounded' width='100%' height={32} />
            ) : (
              <Select
                name='regions'
                className='custom-select-no-arrow w-full h-full sm:text-sm px-1.5 py-[7px]'
                displayEmpty
                fullWidth
                size='small'
                MenuProps={{
                  PaperProps: {
                    sx: {
                      maxWidth: 300,
                      maxHeight: 300,
                      marginTop: '4px',
                      boxShadow:
                        'rgba(50, 50, 93, 0.25) 0px 2px 5px -1px, rgba(0, 0, 0, 0.3) 0px 1px 3px -1px',
                      '& .MuiMenuItem-root': {
                        fontSize: '13px',
                        padding: '6px 12px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      },
                    },
                  },
                }}
                sx={{
                  height: '32px',
                  fontSize: '13px',
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    border: '2px solid #60A5FA',
                  },
                  '& .MuiOutlinedInput-root': {
                    '&.Mui-focused': {
                      boxShadow: 'none',
                    },
                  },
                  '.MuiSelect-select': {
                    padding: '6px 6px',
                  },
                  '&.Mui-disabled': {
                    backgroundColor: '#f3f4f6',
                  },
                  '& svg': {
                    color: '#7D98B6',
                  },
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderRadius: '2px',
                  },
                }}
                value={region || stateId || ''}
                onChange={(e) => {
                  setRegion(e.target.value);
                }}
                renderValue={(selected) => {
                  if (!selected) {
                    return 'Select State';
                  }
                  const selectedOption = memoizedState.find(
                    (it) => it.value === selected
                  );
                  return selectedOption ? selectedOption.label : 'Select State';
                }}
              >
                <MenuItem value='' disabled>
                  Select State
                </MenuItem>
                {memoizedState.map((it, i) => {
                  return (
                    <MenuItem
                      key={i}
                      sx={{
                        color: '#425A76',
                        fontSize: '13px',
                        fontWeight: '500',
                      }}
                      value={it.value}
                      title={it.label}
                    >
                      {it.label}
                    </MenuItem>
                  );
                })}
              </Select>
            )}
          </div>
          <TextButton
            key='section-header-btn'
            label='Go'
            sx={{ padding: '15px 4px' }}
            onClick={() => {
              setPayload((prev) => ({ ...prev, region_rid: region }));
            }}
          />
        </div>

        <div className='h-[46px] max-h-[46px] flex items-center justify-between border border-[#CBD6E2] px-3 text-[14px] font-bold bg-[#FCFCFC]'>
          <span className='text-[#2D3E4F] '>
            {permissionMap?.['rd_eligible_projects']?.read &&
              `Claimed No of Projects: ${allData?.rd_eligible_projects || 0}`}
          </span>
          <span className='text-[#0B5CAB]'>FY-{fiscalYear}</span>
        </div>
        <ListTable
          data={resourceMetric}
          columns={getResourceMetricColumns(permissionMap)}
          getRowId={getResourceMetricRowId}
          hoverHighlight={false}
          tableStyle={{
            borderLeft: '1px solid #CBD6E2',
            height: '100%',
            maxHeight: 'calc(100vh - 290px)',
            overflow: 'auto',
          }}
          stickyHeader={true}
          stickyColumnsCount={1}
          selectable={false}
          actionWidth={80}
          loading={isPending || !fiscalYear}
          error={isError ? 'Failed to load data' : undefined}
          showEmptyRow={false}
          loadingRowCount={1}
        />
      </div>
      <ListTable
        data={detailedMetric}
        columns={getDetailedMetricColumns(currencySymbol)}
        getRowId={getDetailedMetricRowId}
        hoverHighlight={false}
        tableStyle={{
          borderTop: '1px solid #CBD6E2',
          borderLeft: '1px solid #CBD6E2',
          height: '100%',
          maxHeight: 'calc(100vh - 290px)',
          overflow: 'auto',
        }}
        stickyHeader={true}
        stickyColumnsCount={1}
        selectable={false}
        actionWidth={80}
        loading={isPending || !fiscalYear}
        error={isError ? 'Failed to load data' : undefined}
        showEmptyRow={false}
        loadingRowCount={5}
      />

      <div>
        <div className='h-[30px] max-h-[30px] flex items-center justify-center border border-[#CBD6E2] px-3 text-[14px] font-semibold bg-[#DCE8FF]'>
          <span className='text-[#2A2A2A]'>
            {payload.flag === 'all' ? 'All' : 'Claimed'} Projects - Statewise
          </span>
        </div>
        <ListTable
          data={rdCredits}
          columns={getRdCreditsColumns(permissionMap, currencySymbol)}
          getRowId={getRdCreditsRowId}
          hoverHighlight={false}
          tableStyle={{
            borderLeft: '1px solid #CBD6E2',
            height: '100%',
            maxHeight: 'calc(100vh - 290px)',
            overflow: 'auto',
          }}
          stickyHeader={true}
          stickyColumnsCount={1}
          selectable={false}
          actionWidth={80}
          loading={isPending || !fiscalYear}
          error={isError ? 'Failed to load data' : undefined}
          showEmptyRow={false}
          loadingRowCount={1}
        />
      </div>
    </div>
  );
};

export default StateWiseSummary;
