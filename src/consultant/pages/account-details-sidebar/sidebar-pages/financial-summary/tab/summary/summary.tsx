import React, { useEffect, useMemo, useState } from 'react';
import { ListTable } from '../../../../../../../components/table';
import { useParams } from 'react-router-dom';
import {
  ClaimJurisdiction,
  FinancialSummaryFlag,
  SelectOption,
  SummaryDetailedMetric,
  SummaryResourceMetric,
} from '../../../../../../types';
import {
  getClaimJurisdictionColumns,
  getDetailedMetricColumns,
  getResourceMetricColumns,
} from './columns';
import { MenuItem, Select, SelectChangeEvent } from '@mui/material';
import TextButton from '../../../../../../../components/button/text-button';
import { useGetFinancialSummary } from '../../../../../../services/financial';
import { useSelector } from 'react-redux';
import { RootState } from '../../../../../../../store/store';
import { AllPermissions } from '../../../../../../../common-service';

interface Summary {
  fiscalYear: string;
}

export const Summary: React.FC<Summary> = ({ fiscalYear }) => {
  // hooks
  const { accountid } = useParams();
  const { permission } = useSelector((state: RootState) => state.permission);

  // UseStates
  const [resourceMetric, setResourceMetric] = useState<SummaryResourceMetric[]>(
    []
  );
  const [detailedMetric, setDetailedMetric] = useState<SummaryDetailedMetric[]>(
    []
  );
  const [claimJurisdiction, setClaimJurisdiction] = useState<
    ClaimJurisdiction[]
  >([]);
  const [type, setType] = useState('all');
  const [flag, setFlag] = useState<FinancialSummaryFlag>('all');

  // API Hooks
  const { mutate, isPending, isError, data } = useGetFinancialSummary();

  // Variables
  const projectTypes: SelectOption[] = [
    {
      label: 'All',
      value: 'all',
    },
    {
      label: 'Research and Development Projects',
      value: 'rd_qualified',
    },
  ];
  const allData = data?.data;
  const summaryViewEditFields = useMemo(
    () =>
      permission.find(
        (item) => item.name === AllPermissions.ACCOUNT_FINANCIAL_SUMMARY_VIEW
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

  // UseEffects
  useEffect(() => {
    if (accountid && fiscalYear) {
      mutate({
        account_rid: accountid,
        fiscal_year: Number(fiscalYear),
        flag,
        summaryType: 'summary',
        region_rid: '',
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accountid, fiscalYear, flag]);
  useEffect(() => {
    if (allData) {
      setResourceMetric(allData.resource_metrics);
      setClaimJurisdiction(allData.claim_jurisdiction);
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
  const updateType = (e: SelectChangeEvent<string>) => {
    setType(e.target.value);
  };
  const getResourceMetricRowId = (row: SummaryResourceMetric) => row.rid;
  const getDetailedMetricRowId = (row: SummaryDetailedMetric) => row.rid;
  const getClaimJurisdictionRowId = (row: ClaimJurisdiction) => row.rid;

  return (
    <div className='flex flex-col gap-4'>
      <div>
        <div className='max-w-[500px] flex mb-5 mt-2 gap-3'>
          <Select
            name='project'
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
            value={type}
            onChange={updateType}
          >
            {projectTypes.map((it, i) => {
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
          <TextButton
            key='section-header-btn'
            label='Go'
            sx={{ padding: '15px 4px' }}
            onClick={() => setFlag(type as FinancialSummaryFlag)}
          />
        </div>

        <div className='h-[46px] max-h-[46px] flex items-center justify-between border border-[#CBD6E2] px-3 text-[14px] font-bold bg-[#FCFCFC]'>
          <span className='text-[#2D3E4F] '>
            {permissionMap?.['rd_eligible_projects']?.read &&
              `RD Eligible No of Projects: ${allData?.rd_eligible_projects || 0}`}
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
          loadindRowCount={1}
        />
      </div>
      <ListTable
        data={detailedMetric}
        columns={getDetailedMetricColumns()}
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
        loadindRowCount={5}
      />
      <ListTable
        data={claimJurisdiction}
        columns={getClaimJurisdictionColumns(permissionMap)}
        getRowId={getClaimJurisdictionRowId}
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
        loadindRowCount={3}
      />
    </div>
  );
};

export default Summary;
