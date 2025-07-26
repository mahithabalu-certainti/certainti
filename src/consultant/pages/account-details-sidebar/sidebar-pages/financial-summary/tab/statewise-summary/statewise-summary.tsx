import React, { useEffect, useState } from 'react';
import { ListTable } from '../../../../../../../components/table';
import { useParams, useSearchParams } from 'react-router-dom';
import { useProjectFinancialSummary } from '../../../../../../services/financial/financial-service';
import {
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
import { NewProjectData } from '../../../../../../types/project';
import { MenuItem, Select, SelectChangeEvent } from '@mui/material';
import TextButton from '../../../../../../../components/button/text-button';

interface FinancialSummaryProps {
  projectDetails: NewProjectData | null;
}

export const StateWiseSummary: React.FC<FinancialSummaryProps> = ({
  projectDetails,
}) => {
  const [resourceMetric, setResourceMetric] = useState<SummaryResourceMetric[]>(
    []
  );
  const [detailedMetric, setDetailedMetric] = useState<SummaryDetailedMetric[]>(
    []
  );
  const [rdCredits, setRdCredits] = useState<SummaryRdCredits[]>([]);
  const [projectType, setProjectType] = useState('all');
  const { projectid: projectId } = useParams();
  const [searchParams] = useSearchParams();
  const accountId = searchParams.get('accountID') || '';
  const fiscalYear = projectDetails?.fiscal_year || 2025;
  const projectTypes: SelectOption[] = [
    {
      label: 'All',
      value: 'all',
    },
    {
      label: 'Claimed Projects',
      value: 'claimed',
    },
  ];

  const { data, isLoading, isError } = useProjectFinancialSummary({
    account_rid: accountId,
    project_fiscal_rid: projectId || '',
    fiscal_year: fiscalYear,
  });

  useEffect(() => {
    if (data) {
      setResourceMetric(data.resource_metrics);
      setDetailedMetric(data.detailed_metrics);
    }
  }, [data]);

  const updatedForm = (e: SelectChangeEvent<string>) => {
    setProjectType(e.target.value);
  };
  const getResourceMetricRowId = (row: SummaryResourceMetric) => row.rid;
  const getDetailedMetricRowId = (row: SummaryDetailedMetric) => row.rid;
  const getRdCreditsRowId = (row: SummaryRdCredits) => row.rid;

  return (
    <div className='flex flex-col gap-4'>
      <div>
        <div className='max-w-[80%] flex mb-5 mt-2 gap-3'>
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
            value={projectType}
            onChange={updatedForm}
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
            value={projectType}
            onChange={updatedForm}
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
          />
        </div>

        <div className='h-[46px] max-h-[46px] flex items-center justify-between border border-[#CBD6E2] px-3 text-[14px] font-bold bg-[#FCFCFC]'>
          <span className='text-[#2D3E4F] '>Claimed No of Projects: 91</span>
          <span className='text-[#0B5CAB]'>FY-{fiscalYear}</span>
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

      <div>
        <div className='h-[30px] max-h-[30px] flex items-center justify-center border border-[#CBD6E2] px-3 text-[14px] font-semibold bg-[#DCE8FF]'>
          <span className='text-[#2A2A2A]'>All Projects - Statewise</span>
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
          <span className='text-[#2A2A2A]'>Claimed Projects - Statewise</span>
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
    </div>
  );
};

export default StateWiseSummary;
