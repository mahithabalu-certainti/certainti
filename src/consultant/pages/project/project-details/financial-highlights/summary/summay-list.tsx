import React, { useEffect, useMemo, useState } from 'react';
import { ListTable } from '../../../../../../components/table';
import { useParams, useSearchParams } from 'react-router-dom';
import { useProjectFinancialSummary } from '../../../../../services/financial/financial-service';
import {
  SummaryClaimJurisdiction,
  SummaryDetailedMetric,
  SummaryQRE,
  SummaryRdCredits,
  SummaryRdPercent,
  SummaryResourceMetric,
} from '../../../../../types';
import {
  getClaimJurisdictionColumns,
  getDetailedMetricColumns,
  getQREColumns,
  getRdCreditsColumns,
  getRdPercentColumns,
  getResourceMetricColumns,
} from './columns';
import { NewProjectData } from '../../../../../types/project';
import { RootState } from '../../../../../../store/store';
import { useSelector } from 'react-redux';
import { AllPermissions } from '../../../../../../common-service';

interface FinancialSummaryProps {
  projectDetails: NewProjectData | null;
}

const SummayListTable: React.FC<FinancialSummaryProps> = ({
  projectDetails,
}) => {
  const [resourceMetric, setResourceMetric] = useState<SummaryResourceMetric[]>(
    []
  );
  const [detailedMetric, setDetailedMetric] = useState<SummaryDetailedMetric[]>(
    []
  );
  const [rdPercent, setRdPercent] = useState<SummaryRdPercent[]>([]);
  const [summaryQre, setSummaryQre] = useState<SummaryQRE[]>([]);
  const [rdCredits, setRdCredits] = useState<SummaryRdCredits[]>([]);
  const [claimJurisdiction, setClaimJurisdiction] = useState<
    SummaryClaimJurisdiction[]
  >([]);
  const { projectid: projectId } = useParams();
  const [searchParams] = useSearchParams();
  const accountId = searchParams.get('accountID') || '';
  const fiscalYear = projectDetails?.fiscal_year;

  const { permission } = useSelector((state: RootState) => state.permission);

  // Permissions
  const financialSummaryViewEditFields = useMemo(
    () =>
      permission?.find(
        (item) => item.name === AllPermissions.PROJECT_FINANCIAL_SUMMARY_VIEW
      )?.fields ?? [],
    [permission]
  );

  const permissionMap = useMemo(() => {
    const map: Record<string, { read: boolean; edit: boolean }> = {};
    financialSummaryViewEditFields.forEach((item) => {
      map[item.name] = { read: item.read ?? false, edit: item.edit ?? false };
    });
    return map;
  }, [financialSummaryViewEditFields]);

  const { data, isLoading, isError } = useProjectFinancialSummary({
    account_rid: accountId,
    project_fiscal_rid: projectId || '',
    fiscal_year: fiscalYear,
  });

  useEffect(() => {
    if (data) {
      setResourceMetric(data.resource_metrics);
      setRdPercent(data.rd_percent);
      setClaimJurisdiction(data.claim_jurisdiction);
      setSummaryQre(data.qre);
      setRdCredits(data.rd_credits);

      const updatedDetailedMetrics = data.detailed_metrics.map((item) => {
        const permission = permissionMap?.[item.permission];
        const hide = permission ? !permission.edit && !permission.read : false;

        return {
          ...item,
          hide,
        };
      });
      setDetailedMetric(updatedDetailedMetrics);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  const getResourceMetricRowId = (row: SummaryResourceMetric) => row.rid;
  const getDetailedMetricRowId = (row: SummaryDetailedMetric) => row.rid;
  const getRdPercentRowId = (row: SummaryRdPercent) => row.rid;
  const getClaimJurisdictionRowId = (row: SummaryClaimJurisdiction) => row.rid;
  const getQRERowId = (row: SummaryQRE) => row.rid;
  const getRdCreditsRowId = (row: SummaryRdCredits) => row.rid;

  const resourceMetricColumns = getResourceMetricColumns(permissionMap);
  const claimJurisdictionColumns = getClaimJurisdictionColumns(permissionMap);
  const rdPercentColumns = getRdPercentColumns(permissionMap);
  const qreColumns = getQREColumns(permissionMap);
  const rdCreditsColumns = getRdCreditsColumns(permissionMap);

  const hideMetricTable = resourceMetricColumns.every((col) => col.hide);
  const hideDetailedMetric = detailedMetric.every((item) => item.hide);
  const hideClaimJurisdiction = claimJurisdictionColumns.every(
    (col) => col.hide
  );
  const hideRdPercent = rdPercentColumns.every((col) => col.hide);
  const hideQreColumns = qreColumns.every((col) => col.hide);
  const hideRdCreditsColumns = rdCreditsColumns.every((col) => col.hide);
  const hideClaimStatus =
    !permissionMap?.['status']?.edit && !permissionMap?.['status']?.read;

  return (
    <div className='flex flex-col gap-4'>
      <div className={hideMetricTable ? 'hidden' : 'block'}>
        <div className='h-[46px] max-h-[46px] flex items-center justify-between border border-[#CBD6E2] px-3 text-[14px] font-bold bg-[#FCFCFC]'>
          <span className='text-[#2D3E4F] '>
            Project:{' '}
            {projectDetails?.project_name ||
              projectDetails?.project_code ||
              '-'}
          </span>
          <span className='text-[#0B5CAB]'>{fiscalYear}</span>
        </div>
        <ListTable
          data={resourceMetric}
          columns={resourceMetricColumns}
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
          loading={isLoading || !fiscalYear}
          error={isError ? 'Failed to load data' : undefined}
          showEmptyRow={false}
          loadindRowCount={1}
        />
      </div>
      <div className={hideDetailedMetric ? 'hidden' : 'block'}>
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
          loading={isLoading || !fiscalYear}
          error={isError ? 'Failed to load data' : undefined}
          showEmptyRow={false}
          loadindRowCount={5}
        />
      </div>
      <div className={hideClaimJurisdiction ? 'hidden' : 'block'}>
        <ListTable
          data={claimJurisdiction}
          columns={claimJurisdictionColumns}
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
          loading={isLoading || !fiscalYear}
          error={isError ? 'Failed to load data' : undefined}
          showEmptyRow={false}
          loadindRowCount={3}
        />
      </div>
      <div className={hideRdPercent ? 'hidden' : 'block'}>
        <ListTable
          data={rdPercent}
          columns={rdPercentColumns}
          getRowId={getRdPercentRowId}
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
          loading={isLoading || !fiscalYear}
          error={isError ? 'Failed to load data' : undefined}
          showEmptyRow={false}
          loadindRowCount={1}
        />
      </div>
      <div className={hideQreColumns ? 'hidden' : 'block'}>
        <div className='h-[30px] max-h-[30px] flex items-center justify-center border border-[#CBD6E2] px-3 text-[14px] font-semibold bg-[#DCE8FF]'>
          <span className='text-[#2A2A2A]'>QRE</span>
        </div>
        <ListTable
          data={summaryQre}
          columns={qreColumns}
          getRowId={getQRERowId}
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
          loading={isLoading || !fiscalYear}
          error={isError ? 'Failed to load data' : undefined}
          showEmptyRow={false}
          loadindRowCount={1}
        />
      </div>
      <div className={hideRdCreditsColumns ? 'hidden' : 'block'}>
        <div className='h-[30px] max-h-[30px] flex items-center justify-center border border-[#CBD6E2] px-3 text-[14px] font-semibold bg-[#DCE8FF]'>
          <span className='text-[#2A2A2A]'>RD Credits</span>
        </div>
        <ListTable
          data={rdCredits}
          columns={rdCreditsColumns}
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
          loading={isLoading || !fiscalYear}
          error={isError ? 'Failed to load data' : undefined}
          showEmptyRow={false}
          loadindRowCount={1}
        />
      </div>
      <div className={`${hideClaimStatus ? 'hidden' : 'block'}`}>
        <div className='h-[30px] max-h-[30px] flex items-center justify-center border border-[#CBD6E2] px-3 text-[14px] font-semibold bg-[#DCE8FF]'>
          <span className='text-[#2A2A2A]'>Claim Status</span>
        </div>
        <div className='text-[13px] text-[#2A2A2A] font-semibold px-3 py-2 border-t-0 border border-[#CBD6E2]'>
          {data?.claim_status.status || '-'}
        </div>
      </div>
    </div>
  );
};

export default SummayListTable;
