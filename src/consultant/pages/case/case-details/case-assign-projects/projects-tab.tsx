import { useParams, useSearchParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { NewProjectData } from '../../../../types/project';
import { useCasesProjectDetail } from '../../../../services/cases-assign-projects/assign-project-service';
import CaseAssignProjectDetail from './detail-tab/case-project-detail';
import CasesSummayListTable from './detail-tab/summary/summay-list';
import CasesResourceCost from './detail-tab/resource-cost/resource-cost';

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
  const { caseId } = useParams();
  const [searchParams] = useSearchParams();
  const accountID = searchParams.get('accountID');
  const projectID = searchParams.get('projectID');

  const detailTab = searchParams.get('detailstab');
  const [projectData, setProjectData] = useState<NewProjectData | null>(null);
  const { data, isLoading, isError } = useCasesProjectDetail(
    accountID || '',
    caseId || '',
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
  const [columnAnchorEl, setColumnAnchorEl] =
    useState<HTMLButtonElement | null>(null);
  return (
    <>
      <div>
        {detailTab === 'projects_details' && (
          <CaseAssignProjectDetail
            projectDetails={projectData}
            isDetailsLoading={isLoading}
            detailsError={isError}
            isKeyContactAvailable={isKeyContactAvailable}
            iconBg='#AF78FF'
            bgType='circle'
          />
        )}
        {detailTab === 'project_financial_summary' && (
          <CasesSummayListTable projectDetails={projectData} />
        )}
        {detailTab === 'resource_cost' && (
          <div className='border border-[#CBD6E2] border-t-0'>
            <CasesResourceCost
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
          </div>
        )}
      </div>
    </>
  );
};
export default ProjectTab;
