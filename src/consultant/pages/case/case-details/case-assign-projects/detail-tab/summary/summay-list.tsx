import React, { useEffect, useMemo, useState } from 'react';
import { NewProjectData } from '../../../../../../types/project';
import { ProjectQreAdjustmentResponse } from '../../../../../project/utils';
import { useSelector } from 'react-redux';
import { RootState } from '../../../../../../../store/store';
import { AllPermissions } from '../../../../../../../common-service';
import {
  getClaimJurisdictionColumns,
  getDetailedMetricColumns,
  getQREColumns,
  getRdPercentColumns,
  getResourceMetricColumns,
} from './columns';
import { CellEditData } from '../../../../../../../components/table/types';
import { ListTable } from '../../../../../../../components/table';
import {
  SummaryClaimJurisdiction,
  SummaryDetailedMetric,
  SummaryQRE,
  SummaryRdPercent,
  SummaryResourceMetric,
} from '../../../../../../types';
import { useParams, useSearchParams } from 'react-router-dom';
import { resourceClient } from '../../../../../../../api/graphql/clients/client';
import { useMutation } from '@apollo/client';
import { UPDATE_QRE_ADJUSTMENT } from '../../../../../../../api/graphql/queries/project-query';
import { useCasesListProjectFinancialSummary } from '../../../../../../services/cases-assign-projects/assign-project-service';

interface FinancialSummaryProps {
  projectDetails: NewProjectData | null;
  onQreAdjustmentUpdated?: (data: ProjectQreAdjustmentResponse) => void;
}

const CasesSummayListTable: React.FC<FinancialSummaryProps> = ({
  projectDetails,
  onQreAdjustmentUpdated,
}) => {
  const [updateQreAdjustment] = useMutation(UPDATE_QRE_ADJUSTMENT, {
    client: resourceClient,
  });
  const [resourceMetric, setResourceMetric] = useState<SummaryResourceMetric[]>(
    []
  );
  const [detailedMetric, setDetailedMetric] = useState<SummaryDetailedMetric[]>(
    []
  );
  const [rdPercent, setRdPercent] = useState<SummaryRdPercent[]>([]);
  const [summaryQre, setSummaryQre] = useState<SummaryQRE[]>([]);
  const [claimJurisdiction, setClaimJurisdiction] = useState<
    SummaryClaimJurisdiction[]
  >([]);

  const fiscalYear = projectDetails?.fiscal_year;
  const currencySymbol = projectDetails?.currency_symbol;
  const { caseId } = useParams();
  const [searchParams] = useSearchParams();
  const accountId = searchParams.get('accountID');
  const projectID = searchParams.get('projectID');
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

  const { data, isLoading, isError } = useCasesListProjectFinancialSummary({
    account_rid: accountId || '',
    project_fiscal_rid: projectID || '',
    fiscal_year: fiscalYear,
    case_rid: caseId || '',
  });

  useEffect(() => {
    if (data) {
      setResourceMetric(data.resource_metrics);
      setRdPercent(data.rd_percent);
      setClaimJurisdiction(data.claim_jurisdiction);
      setSummaryQre(data.qre);

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

  useEffect(() => {
    if (projectDetails) {
      const newRdPercent: SummaryRdPercent[] = [
        {
          rid: 'rd_percent_summary',
          name: 'RD Percent Summary',
          rd_percent_potential: projectDetails.rd_percent_potential_ai || '-',
          rd_percent_adjustment: projectDetails.rd_percent_adjustment || '-',
          rd_percent_final: projectDetails.rd_percent_final || '-',
        },
      ];
      setRdPercent(newRdPercent);
    }
  }, [projectDetails]);

  const getResourceMetricRowId = (row: SummaryResourceMetric) => row.rid;
  const getDetailedMetricRowId = (row: SummaryDetailedMetric) => row.rid;
  const getRdPercentRowId = (row: SummaryRdPercent) => row.rid;
  const getClaimJurisdictionRowId = (row: SummaryClaimJurisdiction) => row.rid;
  const getQRERowId = (row: SummaryQRE) => row.rid;

  const resourceMetricColumns = getResourceMetricColumns(permissionMap);
  const claimJurisdictionColumns = getClaimJurisdictionColumns(
    permissionMap,
    currencySymbol
  );
  const rdPercentColumns = getRdPercentColumns(permissionMap);

  const handleRdPercentCellEdit = async (
    rowId: string,
    updates: CellEditData[]
  ) => {
    const adj = updates.find((u) => u.columnId === 'rd_percent_adjustment');
    if (!adj) return;

    const value = adj.value;
    if (typeof value !== 'string' && typeof value !== 'number') {
      return;
    }

    const newValueNum = Number(value);
    if (isNaN(newValueNum)) return;

    try {
      const res = await updateQreAdjustment({
        variables: {
          data: {
            account_rid: accountId,
            rid: projectID || '',
            rd_percent_potential_ai: newValueNum,
          },
        },
      });

      const result = res.data?.updateQreAdjustment?.data;
      if (result) {
        setRdPercent((prev) =>
          prev.map((row) =>
            row.rid === rowId
              ? {
                  ...row,
                  rd_percent_potential:
                    result.rd_percent_potential_ai ?? row.rd_percent_potential,
                  rd_percent_adjustment:
                    result.rd_percent_adjustment ?? row.rd_percent_adjustment,
                  rd_percent_final:
                    result.rd_percent_final ?? row.rd_percent_final,
                }
              : row
          )
        );
        onQreAdjustmentUpdated?.(result as ProjectQreAdjustmentResponse);
      }
    } catch (e) {
      console.error('Failed to update QRE adjustment from summary:', e);
    }
  };
  const qreColumns = getQREColumns(permissionMap, currencySymbol);

  const hideMetricTable = resourceMetricColumns.every((col) => col.hide);
  const hideDetailedMetric = detailedMetric.every((item) => item.hide);
  const hideClaimJurisdiction = claimJurisdictionColumns.every(
    (col) => col.hide
  );
  const hideRdPercent = rdPercentColumns.every((col) => col.hide);
  const hideQreColumns = qreColumns.every((col) => col.hide);

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
          {fiscalYear && (
            <span className='text-[#0B5CAB]'>FY-{fiscalYear}</span>
          )}
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
          loadingRowCount={1}
        />
      </div>
      <div className={hideDetailedMetric ? 'hidden' : 'block'}>
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
          loading={isLoading || !fiscalYear}
          error={isError ? 'Failed to load data' : undefined}
          showEmptyRow={false}
          loadingRowCount={5}
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
          loadingRowCount={3}
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
          loadingRowCount={1}
          onCellEdit={handleRdPercentCellEdit}
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
          loadingRowCount={1}
        />
      </div>
    </div>
  );
};

export default CasesSummayListTable;
