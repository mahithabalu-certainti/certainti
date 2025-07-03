/* eslint-disable @typescript-eslint/no-explicit-any */
import { Box, Tab, Tabs } from '@mui/material';
import React, { Fragment, useEffect, useState } from 'react';
import {
  AccountData,
  DisplayColumn,
  transformResourceData,
} from '../../../account-details/utils';
import ResourceCostTable from './resource-cost/resource-cost-table';
import ResourceDetails from './resource-details/resource-details';
import ResourceSkillTable from './resource-skill/resource-skill-table';
import { ResourceCostList } from '../../../../types/resource-cost';
import { ResourceSkillList } from '../../../../types/resource-skill';
import { AllPermissions, Permissions } from '../../../../../common-service';
import { checkPermission } from '../../../../../common-utils';
import { TabMenus } from './resources';
import { InfoSection } from '../../../../../components';
import { useResourceDetail } from '../../../../services/resource-details';

interface SubcomponentProps {
  tabMenus: TabMenus[];
  permission?: Permissions[];
  handleTabChange: (event: React.SyntheticEvent, newValue: string) => void;
  value: string;
  resourceId: string;
  accountId: string;
  appliedFilters: Record<string, any>;
  fiscalYearValue: number;
  accountDetails: AccountData;
  setFilterVisibility: (value: boolean) => void;
  setShowFilter: (value: boolean) => void;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  costOrder: 'asc' | 'desc';
  setCostOrder: (order: 'asc' | 'desc') => void;
  costorderBy: string;
  setCostorderBy: (field: keyof ResourceCostList) => void;
  skillOrder: 'asc' | 'desc';
  setSkillOrder: (order: 'asc' | 'desc') => void;
  skillOrderBy: string;
  setSkillOrderBy: (field: keyof ResourceSkillList) => void;
  refreshCostTrigger?: number;
  refreshSkillTrigger?: number;
  setCount?: (count: number) => void;
}

const ResourceSubComponents: React.FC<SubcomponentProps> = ({
  tabMenus,
  permission,
  handleTabChange,
  value,
  resourceId,
  accountId,
  appliedFilters,
  fiscalYearValue,
  accountDetails,
  setFilterVisibility,
  setShowFilter,
  currentPage,
  setCurrentPage,
  costOrder,
  setCostOrder,
  costorderBy,
  setCostorderBy,
  skillOrder,
  setSkillOrder,
  skillOrderBy,
  setSkillOrderBy,

  refreshCostTrigger,
  refreshSkillTrigger,
  setCount,
}) => {
  // Permission Mangement
  const isResourceViewEnable = checkPermission(
    permission || [],
    AllPermissions.RESOURCE_VIEW
  );
  const isResourceCostViewEnable = checkPermission(
    permission || [],
    AllPermissions.RESOURCE_COST_VIEW
  );
  const isResourceCostEditEnable = checkPermission(
    permission || [],
    AllPermissions.RESOURCE_COST_EDIT
  );
  const isResourceCostDeleteEnable = checkPermission(
    permission || [],
    AllPermissions.RESOURCE_COST_DELETE
  );
  const isResourceSkillViewEnable = checkPermission(
    permission || [],
    AllPermissions.RESOURCE_SKILL_VIEW
  );
  const isResourceSkillEditEnable = checkPermission(
    permission || [],
    AllPermissions.RESOURCE_SKILL_EDIT
  );
  const isResourceSkillDeleteEnable = checkPermission(
    permission || [],
    AllPermissions.RESOURCE_SKILL_DELETE
  );
  const {
    data: resource,
    isLoading,
    error,
  } = useResourceDetail(resourceId, accountId);
  const [resourceDetails, setResourceDetails] = useState<DisplayColumn[]>([]);

  useEffect(() => {
    setResourceDetails(resource ? transformResourceData(resource) : []);
  }, [resource]);

  return (
    <Fragment>
      <Box className='max-w-[100%] border-t border border-b-0 border-[#CBD6E2] rounded-bl-[2px] rounded-br-[2px] bg-white'>
        <InfoSection
          columns={resourceDetails}
          loading={isLoading}
          singleLineView={false}
          className='!border-b-0'
        />
      </Box>
      <Box className='max-w-[100%]  border-b border-[1px] border-t-0 border-[#CBD6E2] rounded-bl-[2px] rounded-br-[2px] bg-white'>
        {value && (
          <Tabs
            value={value}
            onChange={handleTabChange}
            aria-label='navigation tabs'
            className='border-l-0 border-r-0 border-[1px] pl-4.5 border-solid border-[#CBD6E2]'
            sx={{
              '& .MuiTabs-indicator': {
                backgroundColor: '#0B5CAB',
              },
            }}
          >
            {tabMenus.map((tab, index) => {
              if (tab.hide) return null;
              return (
                <Tab
                  key={index}
                  label={tab.label}
                  value={tab.value}
                  onClick={() => {
                    setFilterVisibility(tab.value !== 'details');
                    setShowFilter(false);
                  }}
                  sx={{
                    textTransform: 'none',
                    '&.Mui-selected': {
                      color: '#2D3E4F',
                      fontWeight: 600,
                    },
                  }}
                />
              );
            })}
          </Tabs>
        )}

        {/* You can add the content for each tab below */}
        {value === 'details' && isResourceViewEnable && (
          <Box>
            <ResourceDetails
              resource={resource?.data || null}
              isLoading={isLoading}
              error={error?.message || null}
            />
          </Box>
        )}

        {value === 'cost' && isResourceCostViewEnable && (
          <Box sx={{ width: '100%', overflowX: 'auto' }}>
            <ResourceCostTable
              fiscalYear={fiscalYearValue}
              appliedFilters={appliedFilters}
              accountDetails={accountDetails}
              resourceRid={resourceId}
              setCurrentPage={setCurrentPage}
              currentPage={currentPage}
              costOrder={costOrder}
              setCostOrder={setCostOrder}
              costorderBy={costorderBy}
              setCostorderBy={setCostorderBy}
              isResourceCostEditEnable={isResourceCostEditEnable}
              isResourceCostDeleteEnable={isResourceCostDeleteEnable}
              refreshCostTrigger={refreshCostTrigger}
              setCount={setCount}
            />
          </Box>
        )}

        {value === 'skill' && isResourceSkillViewEnable && (
          <Box sx={{ width: '100%', overflowX: 'auto' }}>
            <ResourceSkillTable
              fiscalYear={fiscalYearValue}
              appliedFilters={appliedFilters}
              accountDetails={accountDetails}
              resourceRid={resourceId}
              setCurrentPage={setCurrentPage}
              currentPage={currentPage}
              skillOrder={skillOrder}
              setSkillOrder={setSkillOrder}
              skillOrderBy={skillOrderBy}
              setSkillOrderBy={setSkillOrderBy}
              isResourceSkillEditEnable={isResourceSkillEditEnable}
              isResourceSkillDeleteEnable={isResourceSkillDeleteEnable}
              refreshSkillTrigger={refreshSkillTrigger}
              setCount={setCount}
            />
          </Box>
        )}
      </Box>
    </Fragment>
  );
};

export default ResourceSubComponents;
