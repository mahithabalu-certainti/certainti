import React, { useEffect, useState } from 'react';
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

  const { data, isLoading, isError } = useProjectFinancialSummary({
    account_rid: accountId,
    project_fiscal_rid: projectId || '',
    fiscal_year: fiscalYear,
  });

  useEffect(() => {
    if (data) {
      setResourceMetric(data.resource_metrics);
      setDetailedMetric(data.detailed_metrics);
      setRdPercent(data.rd_percent);
      setClaimJurisdiction(data.claim_jurisdiction);
      setSummaryQre(data.qre);
      setRdCredits(data.rd_credits);
    }
  }, [data]);

  const getResourceMetricRowId = (row: SummaryResourceMetric) => row.rid;
  const getDetailedMetricRowId = (row: SummaryDetailedMetric) => row.rid;
  const getRdPercentRowId = (row: SummaryRdPercent) => row.rid;
  const getClaimJurisdictionRowId = (row: SummaryClaimJurisdiction) => row.rid;
  const getQRERowId = (row: SummaryQRE) => row.rid;
  const getRdCreditsRowId = (row: SummaryRdCredits) => row.rid;

  return (
    <div className='flex flex-col gap-4'>
      <div>
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
          columns={getResourceMetricColumns()}
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
      <ListTable
        data={claimJurisdiction}
        columns={getClaimJurisdictionColumns()}
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
      <ListTable
        data={rdPercent}
        columns={getRdPercentColumns()}
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
      <div>
        <div className='h-[30px] max-h-[30px] flex items-center justify-center border border-[#CBD6E2] px-3 text-[14px] font-semibold bg-[#DCE8FF]'>
          <span className='text-[#2A2A2A]'>QRE</span>
        </div>
        <ListTable
          data={summaryQre}
          columns={getQREColumns()}
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
      <div>
        <div className='h-[30px] max-h-[30px] flex items-center justify-center border border-[#CBD6E2] px-3 text-[14px] font-semibold bg-[#DCE8FF]'>
          <span className='text-[#2A2A2A]'>RD Credits</span>
        </div>
        <ListTable
          data={rdCredits}
          columns={getRdCreditsColumns()}
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
      <div>
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
