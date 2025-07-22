import { Box, Menu, MenuItem, Switch, Tab, Tabs } from '@mui/material';
import React, { Suspense, useEffect, useMemo, useState } from 'react';
import { ResourceFilterIcon, RefreshIcon } from '../../../../assets';
import ActionImportDropdown from '../sidebar-pages/imports/importdropdown';
import {
  getCostFilterFields,
  getSkillFilterFields,
  resourceFilterFields,
} from '../sidebar-pages/resources/utils';
import Filter from './filter/filter';
import {
  useFetchClassification,
  useFetchCurrency,
  useFetchState,
} from '../../../services/account';
import {
  useFetchResourceSkillSubType,
  useFetchResourceSkillType,
  useGetSkillLevel,
} from '../../../services/resource-skill/resource-skill-service';
import { SkillSubtype, SkillType } from '../../../types/resource';
import { ResourceTabs } from '../sidebar-pages/resources/resources';
import { clearFilters } from './filter/utils';
import { projectFilterFields } from '../sidebar-pages/projects/utils';
import {
  AllPermissions,
  useGetAllCountries,
  useGetStatus,
} from '../../../../common-service';
import { useLocation } from 'react-router-dom';
import {
  useGetResourceStatus,
  useGetResourceType,
} from '../../../services/resource-list';
import { useGetProjectType } from '../../../services/project';
import { FilterType } from '../../../../admin/types';
import { useSelector } from 'react-redux';
import { RootState } from '../../../../store/store';
import { projectResourceFilterFields } from '../../project/project-details/project-resources/filters/filter-fileds';
import { useGetProjectResourceCode } from '../../../services/project-resources/project-resources-form-service';
import {
  FieldOptionType,
  getAttachmentsFilterFields,
} from '../../../../components/Attachments/helpers';
import { FilterValue } from './filter/filterType';
// import { useGetAllCountries } from '../../../../common-service';
// import { SelectOption } from '../../../types';
interface TabProps {
  resourceTab?: ResourceTabs[];
  filterVisibility: boolean;
  handleFilter: () => void;
  value: string;
  showFilter: boolean;
  setCurrentPage: (page: number) => void;
  appliedFilters: Record<string, FilterType>;
  setAppliedFilters: (filters: Record<string, FilterType>) => void;
  showRefresh?: boolean;
  onRefreshClick?: () => void;
  handleSorting?: (sortBy: string, sortOrder: 'asc' | 'desc') => void;
  sortFilterCount: number;
  setSortFilterCount: (count: number) => void;
  toggleEnabled?: boolean;
  setToggleEnabled?: (val: boolean) => void;
  keyProjectTask?: string;
  projectResourceAccountID?: string;
  fieldOptions?: FieldOptionType;
  handleFilterChange?: (fieldName: string, value: FilterValue) => void;
}
const TabPanel: React.FC<TabProps> = ({
  resourceTab,
  appliedFilters,
  handleFilter,
  setAppliedFilters,
  value,
  showFilter,
  filterVisibility,
  setCurrentPage,
  showRefresh,
  onRefreshClick,
  handleSorting,
  sortFilterCount,
  setSortFilterCount,
  toggleEnabled,
  setToggleEnabled,
  keyProjectTask,
  projectResourceAccountID,
  fieldOptions,
  handleFilterChange,
}) => {
  const [tabValue, setTabValue] = useState('');
  const location = useLocation();
  const [sortAnchorEl, setSortAnchorEl] = useState<null | HTMLElement>(null);
  const [currentSkillType, setCurrentSkillType] = useState({
    skill_type_rid: [] as string[],
    skill_subtype_rid: [] as string[] | undefined[],
  });

  const [currentCountry, setCurrentCountry] = useState<string[] | null>([]);
  const [regionData, setRegionData] = useState<
    { option: string; value: string }[]
  >([]);
  const [skillSubTypeData, setSkillSubTypeData] = useState<
    { option: string; value: string }[]
  >([]);
  const [, setSelectedSort] = useState('Accounts');

  useEffect(() => {
    // assign default tab value
    const activeTab = resourceTab?.find((tab) => !tab.hide)?.id;
    setTabValue(activeTab as string);
  }, [resourceTab]);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: string) => {
    setTabValue(newValue);
    setCurrentPage(0);
    setAppliedFilters({});
    clearFilters(value || 'resource');
    setSortFilterCount(0);
  };
  const currency = useFetchCurrency();
  const allCountries = useGetAllCountries();
  const Regions = useFetchState(currentCountry?.toString() || '');
  const Classification = useFetchClassification();
  const statusOptions = useGetStatus();
  const resourceTypeOptions = useGetResourceType();
  const resourceStatusOptions = useGetResourceStatus();
  const skillLevelOptions = useGetSkillLevel();
  const projectTypeOptions = useGetProjectType();
  const { data: projectResourceCodeOptions } = useGetProjectResourceCode(
    projectResourceAccountID as string
  );

  const { data: skillType } = useFetchResourceSkillType(value === 'skill');
  const { data: skillSubType } = useFetchResourceSkillSubType(
    currentSkillType.skill_type_rid
  );
  const memoizedProjectResourceCode: { option: string; value: string }[] =
    useMemo(
      () =>
        projectResourceCodeOptions?.data?.resourceCodes.map((item) => ({
          option: item.resource_code,
          value: item.resource_code,
        })) || [],
      [projectResourceCodeOptions?.data?.resourceCodes]
    );
  const memoizedCountry: { option: string; value: string }[] = useMemo(
    () =>
      allCountries.data?.data.country.map((country) => ({
        option: country.country_name,
        value: country.rid,
      })) || [],
    [allCountries.data?.data.country]
  );

  // const memoizedRegion: { option: string; value: string }[] = useMemo(
  //   () =>
  //     Regions.data?.data.states.map((role) => ({
  //       option: role.state_name,
  //       value: role.rid,
  //     })) || [],
  //   [Regions.data?.data.states]
  // );
  const { permission } = useSelector((state: RootState) => state.permission);
  const projectResourcesViewEditFields = useMemo(
    () =>
      permission.find(
        (item) => item.name === AllPermissions.PROJECTS_RESOURCES_VIEW_EDIT
      )?.fields ?? [],
    [permission]
  );
  const permissionProjectResourcesMap = useMemo(() => {
    const map: Record<string, { read: boolean; edit: boolean }> = {};
    projectResourcesViewEditFields.forEach((item) => {
      map[item.name] = { read: item.read ?? false, edit: item.edit ?? false };
    });
    return map;
  }, [projectResourcesViewEditFields]);

  const resourceViewEditFields = useMemo(
    () =>
      permission?.find(
        (item) => item.name === AllPermissions.ACCOUNT_RESOURCES_VIEW_EDIT
      )?.fields ?? [],
    [permission]
  );
  const resourceCostViewEditFields = useMemo(
    () =>
      permission?.find(
        (item) => item.name === AllPermissions.ACCOUNT_RESOURCE_COST_EDIT_VIEW
      )?.fields ?? [],
    [permission]
  );
  const resourceSkillViewEditFields = useMemo(
    () =>
      permission?.find(
        (item) => item.name === AllPermissions.ACCOUNT_RESOURCE_SKILL_VIEW_EDIT
      )?.fields ?? [],
    [permission]
  );
  const projectViewEditFields = useMemo(
    () =>
      permission?.find(
        (item) => item.name === AllPermissions.PROJECTS_VIEW_EDIT
      )?.fields ?? [],
    [permission]
  );

  const resourcepermissionMap = useMemo(() => {
    const map: Record<string, { read: boolean; edit: boolean }> = {};
    resourceViewEditFields.forEach((item) => {
      map[item.name] = { read: item.read ?? false, edit: item.edit ?? false };
    });
    return map;
  }, [resourceViewEditFields]);
  const resourceCostpermissionMap = useMemo(() => {
    const map: Record<string, { read: boolean; edit: boolean }> = {};
    resourceCostViewEditFields.forEach((item) => {
      map[item.name] = { read: item.read ?? false, edit: item.edit ?? false };
    });
    return map;
  }, [resourceCostViewEditFields]);
  const resourceSkillpermissionMap = useMemo(() => {
    const map: Record<string, { read: boolean; edit: boolean }> = {};
    resourceSkillViewEditFields.forEach((item) => {
      map[item.name] = { read: item.read ?? false, edit: item.edit ?? false };
    });
    return map;
  }, [resourceSkillViewEditFields]);
  const projectPermissionMap = useMemo(() => {
    const map: Record<string, { read: boolean; edit: boolean }> = {};
    projectViewEditFields.forEach((item) => {
      map[item.name] = { read: item.read ?? false, edit: item.edit ?? false };
    });
    return map;
  }, [projectViewEditFields]);

  const memoizedSkillType: { option: string; value: string }[] = useMemo(() => {
    const data = skillType as SkillType[];
    return (
      data?.map((skill: SkillType) => ({
        option: skill.skill_type_name,
        value: skill.rid,
      })) || []
    );
  }, [skillType]);
  const memoizedClassification = useMemo(
    () =>
      Classification.data?.data.projectClassifications.map((data) => ({
        option: data.classification_name,
        value: data.classification_name,
      })) || [],
    [Classification.data?.data.projectClassifications]
  );

  const memoizedStatus = useMemo(
    () =>
      statusOptions?.data?.data?.status.map((status) => ({
        option: status.status_name,
        value: status.rid,
      })) || [],
    [statusOptions?.data?.data?.status]
  );

  const memoizedResourceType = useMemo(
    () =>
      resourceTypeOptions?.data?.data?.resouceType.map((item) => ({
        option: item.resource_type_name,
        value: item.rid,
      })) || [],
    [resourceTypeOptions?.data?.data?.resouceType]
  );

  const memoizedResourceStatus = useMemo(
    () =>
      resourceStatusOptions?.data?.data?.resourceStatus.map((item) => ({
        option: item.resource_status_name,
        value: item.rid,
      })) || [],
    [resourceStatusOptions?.data?.data?.resourceStatus]
  );

  const memoizedSkillLevels = useMemo(
    () =>
      skillLevelOptions?.data?.data?.skillLevel.map((item) => ({
        option: item.skill_level_name,
        value: item.rid,
      })) || [],
    [skillLevelOptions?.data?.data?.skillLevel]
  );

  const memoizedProjectTypes = useMemo(
    () =>
      projectTypeOptions?.data?.data?.projectType.map((item) => ({
        option: item.project_type_name,
        value: item.rid,
      })) || [],
    [projectTypeOptions?.data?.data?.projectType]
  );

  const handleSortClose = () => {
    setSortAnchorEl(null);
  };

  useEffect(() => {
    if (Regions.data?.data.states) {
      const data = Regions.data.data.states.map((role) => ({
        option: role.state_name,
        value: role.rid,
      }));
      setRegionData(data);
    }
  }, [Regions.data?.data?.states]);

  useEffect(() => {
    if (skillSubType) {
      const data = skillSubType as SkillSubtype[];
      const finalData =
        data?.map((skill: SkillSubtype) => ({
          option: skill.skill_subtype_name,
          value: skill.rid,
        })) || [];
      setSkillSubTypeData(finalData);
    }
  }, [skillSubType]);

  const handleSortSelect = (sortOption: string) => {
    setSelectedSort(sortOption);
    handleSortClose();
  };

  // const MENU_ITEMS = [
  //   {
  //     label: 'Assign Permission to User',
  //     onClick: () => console.log('user clicked'),
  //   },
  //   {
  //     label: 'View Permissions',
  //     onClick: () => console.log('View Permissions clicked'),
  //   },
  // ];
  const menuActivity = [
    {
      label: 'Create Task',
      onClick: () => console.log('manage user clicked'),
    },
    {
      label: 'Draft Email',
      onClick: () => console.log('Export clicked'),
    },
    {
      label: 'Schedule Meeting',
      onClick: () => console.log('Export clicked'),
    },
    {
      label: 'Log a call',
      onClick: () => console.log('Export clicked'),
    },
  ];

  const memoizedCurrency: { option: string; value: string }[] = useMemo(
    () =>
      currency.data?.data.currency.map(
        (account: { currency_code: string; rid: string }) => ({
          option: account.currency_code,
          value: account.rid,
        })
      ) || [],
    [currency.data?.data.currency]
  );

  // const getFilterFields = () => {
  //   if (!value) return resourceFilterFields(memoizedCountry, regionData);
  //   if (value === 'projects') {
  //     return projectFilterFields;
  //   }
  //   return value === 'cost'
  //     ? getCostFilterFields(memoizedCurrency)
  //     : getSkillFilterFields(memoizedSkillType, skillSubTypeData);
  // };

  // Permissions
  const attachmentEditFields = useMemo(
    () =>
      permission?.find(
        (item) => item.name === AllPermissions.ATTACHMENT_VIEW_EDIT
      )?.fields ?? [],
    [permission]
  );

  const attachmentPermissionMap = useMemo(() => {
    const map: Record<string, { read: boolean; edit: boolean }> = {};
    attachmentEditFields.forEach((item) => {
      map[item.name] = { read: item.read ?? false, edit: item.edit ?? false };
    });
    return map;
  }, [attachmentEditFields]);

  const filterFields = useMemo(() => {
    if (!value)
      return resourceFilterFields(
        memoizedCountry,
        regionData,
        memoizedStatus,
        memoizedResourceType,
        resourcepermissionMap
      );
    if (value === 'projects')
      return projectFilterFields(
        memoizedClassification.map((item) => ({
          label: item.option,
          value: item.value,
        })),
        memoizedProjectTypes,
        memoizedStatus,
        projectPermissionMap
      );
    if (value === 'project-resources')
      return projectResourceFilterFields(
        memoizedProjectResourceCode,
        memoizedCountry,
        regionData,
        // memoizedResourceType,
        permissionProjectResourcesMap
      );
    if (value === 'attachments')
      return getAttachmentsFilterFields(fieldOptions, attachmentPermissionMap);
    return value === 'cost'
      ? getCostFilterFields(
          memoizedCurrency,
          memoizedResourceStatus,
          resourceCostpermissionMap
        )
      : getSkillFilterFields(
          memoizedSkillType,
          skillSubTypeData,
          memoizedSkillLevels,
          resourceSkillpermissionMap
        );
  }, [
    value,
    memoizedCountry,
    regionData,
    memoizedStatus,
    memoizedResourceType,
    resourcepermissionMap,
    memoizedClassification,
    memoizedProjectTypes,
    projectPermissionMap,
    memoizedProjectResourceCode,
    permissionProjectResourcesMap,
    fieldOptions,
    attachmentPermissionMap,
    memoizedCurrency,
    memoizedResourceStatus,
    resourceCostpermissionMap,
    memoizedSkillType,
    skillSubTypeData,
    memoizedSkillLevels,
    resourceSkillpermissionMap,
  ]);

  const [filterAnchorEl, setFilterAnchorEl] =
    useState<HTMLButtonElement | null>(null);

  const handleFilterModal = (event: React.MouseEvent<HTMLButtonElement>) => {
    setFilterAnchorEl(event.currentTarget);
    if (!showFilter) {
      handleFilter();
    }
  };

  const handleCloseFilter = () => {
    setFilterAnchorEl(null);
    if (showFilter) {
      handleFilter();
    }
  };
  // clear filter on route change or page changes
  useEffect(() => {
    setAppliedFilters({});
    clearFilters(value || 'resource');
    setSortFilterCount(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location]);

  const isFilterOpen = Boolean(filterAnchorEl);
  const filterId = isFilterOpen ? `resource${value}-filter-popover` : undefined;

  const handleToggleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (setToggleEnabled) {
      setToggleEnabled(event.target.checked);
    }
  };
  return (
    <Box>
      <Box className='flex justify-between items-center mb-2'>
        {tabValue && (
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            sx={{
              border: '1px solid #CBD6E27D',
              padding: '3px',
              minHeight: '32px',
              '& .MuiTabs-indicator': {
                display: 'none',
                '& .MuiTabs-root': {
                  borderBottom: 'none',
                },
              },
            }}
          >
            {resourceTab?.map((it, i) => {
              if (it.hide) return null;
              const isActive = tabValue === it.id;
              return (
                <Tab
                  key={i}
                  label={it.name}
                  value={it.id}
                  disabled={it.disable}
                  sx={{
                    textTransform: 'none',
                    fontSize: '14px',
                    fontWeight: isActive ? '500' : '400',
                    color: '#2D3E4F',
                    backgroundColor: isActive ? '#0BBFB70D' : '',
                    margin: '0',
                    border: isActive
                      ? '1px solid #0BBFB7'
                      : '1px solid transparent',
                    width: '120px',
                    height: '24px',
                    borderRadius: '4px',
                    minHeight: '24px',
                    padding: '8px 16px',
                    '&:hover': {
                      color: isActive ? '#0BBFB7' : undefined,
                    },
                  }}
                />
              );
            })}
          </Tabs>
        )}

        <Box className='flex items-center'>
          {/* <ActionsDropdown actions={MENU_ITEMS} /> */}
          {tabValue === 'account_projects_view_overview' &&
            keyProjectTask !== 'ProjectResources' && (
              <div className='flex items-center gap-2'>
                <span className='font-semibold text-[13px] text-[#425A76]'>
                  Include Parent
                </span>
                <Switch
                  checked={toggleEnabled}
                  onChange={handleToggleChange}
                  size='small'
                  color='success'
                />
              </div>
            )}
          {filterVisibility && value !== 'details' && (
            <>
              <Box className='relative'>
                <Box
                  component='button'
                  onClick={handleFilterModal}
                  className='w-[24px] h-[24px] max-h-[24px] flex items-center justify-center border border-[#CBD6E2] rounded-[2px] cursor-pointer'
                  aria-describedby={filterId}
                >
                  <ResourceFilterIcon />
                  {(appliedFilters && Object.keys(appliedFilters).length > 0) ||
                  sortFilterCount > 0 ? (
                    <div className='absolute -top-[8px] -right-1.5 w-4 h-4 flex items-center justify-center text-xs'>
                      <span className='absolute w-full h-full bg-[#FF6666] rounded-full animate-ping opacity-75 z-0'></span>
                      <span className='w-3.5 h-3.5 bg-[#FF6666] text-white rounded-full flex items-center justify-center z-10 font-semibold'>
                        {(appliedFilters
                          ? Object.keys(appliedFilters).length
                          : 0) + sortFilterCount}
                      </span>
                    </div>
                  ) : null}
                </Box>
                <Suspense fallback={null}>
                  <Filter
                    value={value}
                    isOpen={isFilterOpen && showFilter}
                    filterAnchorEl={filterAnchorEl}
                    filterId={filterId}
                    filterMenu={filterFields}
                    setAppliedFilters={setAppliedFilters}
                    handleCloseFilter={handleCloseFilter}
                    setCurrentSkillType={setCurrentSkillType}
                    setCurrentCountry={setCurrentCountry}
                    setCurrentPage={setCurrentPage}
                    mode={'date'}
                    handleSorting={handleSorting}
                    onFilterChange={handleFilterChange}
                  />
                </Suspense>
              </Box>

              {showRefresh && (
                <button
                  className='flex border border-[#CBD6E2] ml-2 w-[24px] h-[24px] bg-[linear-gradient(180deg,_#FFFFFF_0%,_#E4E6E7_100%)] justify-center items-center cursor-pointer'
                  onClick={onRefreshClick}
                >
                  <RefreshIcon alt='refresh-icon' className='h-4' />
                </button>
              )}
            </>
          )}
          <ActionImportDropdown
            variant='filled'
            actions={menuActivity}
            label='Add Activity'
            sx={{
              fontWeight: 600,
              fontSize: '13px',
              width: '143px',
              height: '24px',
              display: 'none',
            }}
          />

          {/* <ActionImportDropdown
            actions={menuAccounts}
            label='Sort By: Accounts'
            split='true'
          /> */}
        </Box>
      </Box>

      <Menu
        anchorEl={sortAnchorEl}
        open={Boolean(sortAnchorEl)}
        onClose={handleSortClose}
      >
        <MenuItem onClick={() => handleSortSelect('Accounts')}>
          Accounts
        </MenuItem>
        <MenuItem onClick={() => handleSortSelect('Date')}>Date</MenuItem>
        <MenuItem onClick={() => handleSortSelect('Amount')}>Amount</MenuItem>
        <MenuItem onClick={() => handleSortSelect('User')}>User</MenuItem>
      </Menu>
    </Box>
  );
};

export default TabPanel;
