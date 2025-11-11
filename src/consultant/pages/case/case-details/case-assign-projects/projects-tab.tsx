import { useSearchParams } from 'react-router-dom';
import { useProjectDetail } from '../../../../services/project';
import ProjectOverview from '../../../project/project-details/details/project-overview';
import { useEffect, useState } from 'react';
import { NewProjectData } from '../../../../types/project';
import { useSelector } from 'react-redux';
import { RootState } from '../../../../../store/store';
import SummayListTable from '../../../project/project-details/financial-highlights/summary/summay-list';
import ResourceCost from '../../../project/project-details/financial-highlights/resource-cost/resource-cost';

interface ProjectTabProps {
  refreshTrigger: number;
  setCount: React.Dispatch<React.SetStateAction<number>>;
  searchText: string;
  currentPage: number;
  setCurrentPage?: React.Dispatch<React.SetStateAction<number>>;
  appliedFilters: Record<string, string | number | boolean | string[]>;
}

const ProjectTab: React.FC<ProjectTabProps> = ({
  refreshTrigger,
  setCount,
  searchText,
  currentPage,
  appliedFilters,
}) => {
  const [searchParams] = useSearchParams();
  const accountID = searchParams.get('accountID');
  const projectID = searchParams.get('projectID');

  const detailTab = searchParams.get('detailstab');
  const [projectData, setProjectData] = useState<NewProjectData | null>(null);
  const { data, isLoading, isError } = useProjectDetail(
    accountID || '',
    projectID || ''
  );

  useEffect(() => {
    if (data?.data) {
      const project = data.data.project;
      setProjectData(project);
    }
  }, [data]);
  const isKeyContactAvailable =
    projectData?.keyContact && projectData?.keyContact.length > 0;
  const { permission } = useSelector((state: RootState) => state.permission);
  const [columnAnchorEl, setColumnAnchorEl] =
    useState<HTMLButtonElement | null>(null);
  console.log('detailTab', detailTab);
  return (
    <>
      <div>
        {detailTab === 'projects_details' && (
          <ProjectOverview
            projectDetails={projectData}
            isDetailsLoading={isLoading}
            detailsError={isError}
            isKeyContactAvailable={isKeyContactAvailable}
            permission={permission}
            iconBg='#AF78FF'
            bgType='circle'
          />
        )}
        {detailTab === 'project_financial_summary' && (
          <SummayListTable projectDetails={projectData} />
        )}
        {detailTab === 'resource_cost' && (
          <ResourceCost
            projectDetails={projectData}
            refreshTrigger={refreshTrigger}
            setCount={setCount}
            currentPage={currentPage}
            appliedFilters={appliedFilters}
            // setResCostExportParams={setFinancialResCostParams}
            // setExportType={setExportType}
            setColumnAnchorEl={setColumnAnchorEl}
            columnAnchorEl={columnAnchorEl}
            searchValue={searchText}
          />
        )}
      </div>
    </>
  );
};
export default ProjectTab;
