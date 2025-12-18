import React, { useEffect, useMemo, useState } from 'react';
import { ListTable } from '../../../../../../../components/table';
import { useParams } from 'react-router-dom';
import {
  ClaimJurisdiction,
  SummaryDetailedMetric,
  SummaryResourceMetric,
} from '../../../../../../types';
import {
  getClaimJurisdictionColumns,
  getDetailedMetricColumns,
  getResourceMetricColumns,
} from './columns';
import { useFetchFinancialSummaryQuery } from '../../../../../../services/financial';
import { useSelector } from 'react-redux';
import { RootState } from '../../../../../../../store/store';
import { AllPermissions } from '../../../../../../../common-service';
import { accountDetailsProps } from '../../../../../account-details/utils';
import { FinancialSummaryFlag } from '../../../../../../types';

interface Summary {
  fiscalYear: string;
  accountDetails?: accountDetailsProps;
  caseRid?: string;
  accountId?: string;
}

export const Summary: React.FC<Summary> = ({
  fiscalYear,
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
  const [claimJurisdiction, setClaimJurisdiction] = useState<
    ClaimJurisdiction[]
  >([]);
  const currencySymbol = accountDetails?.accountById?.currency?.currency_symbol;

  const body = useMemo(
    () => ({
      account_rid: accountid || '',
      fiscal_year: Number(fiscalYear),
      flag: 'all' as FinancialSummaryFlag,
      summaryType: 'summary',
      region_rid: '',
      case_rid: caseRid,
    }),
    [accountid, fiscalYear, caseRid]
  );

  // API Hooks
  const {
    isLoading: isPending,
    isError,
    data,
  } = useFetchFinancialSummaryQuery(body, false, !!accountid && !!fiscalYear);

  // Variables
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
  const getResourceMetricRowId = (row: SummaryResourceMetric) => row.rid;
  const getDetailedMetricRowId = (row: SummaryDetailedMetric) => row.rid;
  const getClaimJurisdictionRowId = (row: ClaimJurisdiction) => row.rid;

  return (
    <div className='flex flex-col gap-4'>
      <div>

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
      <ListTable
        data={claimJurisdiction}
        columns={getClaimJurisdictionColumns(permissionMap, currencySymbol)}
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
        loadingRowCount={3}
      />
    </div>
  );
};

export default Summary;
