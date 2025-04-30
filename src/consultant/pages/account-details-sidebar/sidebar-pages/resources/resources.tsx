/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import { resourceProfileIcon } from '../../../../../assets';
import { RESOURCE, RESOURCE_CREATE } from '../../../../../routes';
import { RootState } from '../../../../../store/store';
import { useResourceList } from '../../../../services/resource-list';
import { AccountData } from '../../../account-details/utils';
import TabPanel from '../../components/tab';
import ListTable from '../../components/table';
import { getResourceColumns } from './columns';
import ResourceSubComponents from './resource-sub-components';
import ResourceTableHeader from './resource-table-header';

const BUTTON_STYLES = {
  height: '26px !important',
  fontSize: '13px',
  fontWeight: 400,
  color: '#F16137',
  bgcolor: '#FFF8F6',
  borderRadius: '2px',
};

interface ResourceProps {
  accountDetails?: Record<string, any>;
  activeKey?: string;
}

const Resource: React.FC<ResourceProps> = ({ accountDetails }) => {
  const [viewResourceList, setViewResourceList] = useState<boolean>(true);
  const [columns, setColumns] = useState<any>([]);
  const [showFilter, setShowFilter] = useState<boolean>(false);
  const [filterVisibility, setFilterVisibility] = useState<boolean>(true);
  const [value, setValue] = useState('');
  const [appliedFilters, setAppliedFilters] = useState<Record<string, any>>();
  const [showBackArrow, setShowBackArrow] = useState<boolean>(false);
  const [resourceData, setResourceData] = useState<any>({});
  const [currentPage, setCurrentPage] = useState(0);
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('ASC');
  const [sortField, setSortField] = useState<string>('rid');
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const { fiscalYear } = useSelector<RootState, { fiscalYear: string }>(
    (state: RootState) => state.account
  );

  const convertedFiscalYear = fiscalYear !== 'FY-All' ? Number(fiscalYear) : 0;

  const navigate = useNavigate();
  const location = useLocation();
  const {
    data: ResourceList,
    isLoading,
    error,
  } = useResourceList({
    page: currentPage + 1, // API expects 1-based index
    limit: rowsPerPage,
    accountNumber: accountDetails?.data?.accountById.r_number,
    sortBy: sortField,
    sortOrder: sortOrder,
    filters: appliedFilters,
    fiscalYear: convertedFiscalYear,
  });

  const handleFilter = () => {
    setShowFilter(!showFilter);
  };

  const handleTabChange = (_: React.SyntheticEvent, newValue: string) => {
    setValue(newValue);
    setShowFilter(false);
    setAppliedFilters({});
  };

  const handleResourceClick = (row: any) => {
    setResourceData(row);
    setViewResourceList(!viewResourceList);
    setShowBackArrow(!showBackArrow);
    setValue('details');
    setShowFilter(false);
    setFilterVisibility(false);
  };

  useEffect(() => {
    setColumns(
      getResourceColumns({
        onResourceIdClick: handleResourceClick,
        onClickId: 'r_number',
      })
    );
  }, []);

  const handleEdit = (resource: any) => {
    setFilterVisibility(false);
    navigate(RESOURCE + '/edit/' + resource.rid, {
      state: { resource, accountDetails },
    });
  };

  const actionMenuItems = [
    {
      label: 'Edit',
      onClick: handleEdit,
    },
    {
      label: 'Delete',
      onClick: (row: any) => console.log('Delete', row),
    },
    {
      label: 'View Summary',
      onClick: (row: any) => console.log('Summary', row),
    },
    {
      label: 'View Activities',
      onClick: (row: any) => console.log('Activities', row),
    },
    {
      label: 'View Notes',
      onClick: (row: any) => console.log('Notes', row),
    },
  ];

  const headerButtons = [
    {
      label: 'Download',
      variant: 'outlined' as const,
      onClick: () => console.log('Download'),
      sx: { ...BUTTON_STYLES, width: '96px', minWidth: '96px' },
    },
    {
      label: 'New',
      variant: 'outlined' as const,
      onClick: () => handleCreateResource(),
      sx: { ...BUTTON_STYLES, width: '61px', minWidth: '61px' },
    },
  ];

  const handleBackClick = () => {
    setViewResourceList(!viewResourceList);
    setShowBackArrow(!showBackArrow);
    setValue('');
    setShowFilter(false);
    navigate(location.pathname, {
      state: { ...location.state, activeKey: 'resources' },
      replace: true,
    });
    setFilterVisibility(true);
  };

  const handleCreateResource = () => {
    if (value === 'cost') {
      navigate(`${RESOURCE}/cost/create`, {
        state: {
          ...accountDetails,
          resourceData,
          cost: true,
          sectionName: 'Financial Information',
        },
      });
    } else if (value === 'skill') {
      navigate(`${RESOURCE}/skill/create`, {
        state: {
          ...accountDetails,
          resourceData,
          skill: true,
          sectionName: 'Skill Information',
        },
      });
    } else {
      navigate(RESOURCE_CREATE, { state: accountDetails });
    }
  };

  return (
    <div className='w-full'>
      <TabPanel
        value={value}
        setAppliedFilters={(data) => {
          setAppliedFilters(data);
          setShowFilter(false);
        }}
        showFilter={showFilter}
        filterVisibility={filterVisibility}
        handleFilter={handleFilter}
      />
      <ResourceTableHeader
        handleFilter={handleFilter}
        value={value}
        setAppliedFilters={(data) => {
          setAppliedFilters(data);
          setShowFilter(false);
        }}
        showFilter={showFilter}
        title='Resources'
        resourceNumber={resourceData?.r_number}
        titleIcon={<img src={resourceProfileIcon} alt='resource header icon' />}
        headerButtons={headerButtons}
        showBackArrow={showBackArrow}
        onBackClick={handleBackClick}
        filterVisibility={filterVisibility}
      />
      {!viewResourceList ? (
        <ResourceSubComponents
          setFilterVisibility={setFilterVisibility}
          handleTabChange={handleTabChange}
          value={value}
          resourceData={resourceData}
          accountId={accountDetails?.data?.accountById?.r_number}
          appliedFilters={appliedFilters || {}}
          fiscalYearValue={convertedFiscalYear}
          accountDetails={accountDetails as AccountData}
          setShowFilter={setShowFilter}
        />
      ) : (
        <ListTable
          data={ResourceList?.resource as any}
          columns={columns}
          actionMenuItems={actionMenuItems}
          pagination={true}
          rowsPerPage={rowsPerPage}
          rowsPerPageOptions={[25, 30, 40, 50]}
          sortable={true}
          isLoading={isLoading}
          error={error}
          rowIdentifier='rid'
          setCurrentPage={setCurrentPage}
          setSortOrder={setSortOrder}
          setSortField={setSortField}
          setRowsPerPage={setRowsPerPage}
          sortField={sortField}
          sortOrder={sortOrder}
          currentPage={currentPage}
          totalCount={ResourceList?.count || 0}
        />
      )}
    </div>
  );
};

export default Resource;
