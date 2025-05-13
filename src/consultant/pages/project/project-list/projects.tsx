import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PROJECT_CREATE } from "../../../../routes";
import {
  accountSettingsIcon,
  actionIcon,
  downloadIcon,
  filterIcon,
  projectDetailsIcon,
  refreshIcon,
} from "../../../../assets";
import { ActionsDropdown, Filter } from "../../../../components";
import TextButton from "../../../../components/button/text-button";
import { getProjectFilterFields } from "./helpers";
import { ProjectTable } from "./table/project-table";
import { ProjectListParams } from "../../../types/project";

const BUTTON_STYLES = {
  height: "32px",
  color: "#F15A29",
};

export const Projects: React.FC = () => {
  const [appliedFilters, setAppliedFilters] = useState<Record<string, any>>({});
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [isFilterOpen, setIsFilterOpen] = useState<boolean>(true);
  const [page, setPage] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [tableParams, setTableParams] = useState<ProjectListParams>({
    page: page,
    limit: 10,
    sortBy: "createdAt",
    sortOrder: "DESC",
    fiscalYear: 0,
  });

  const menuItems = [
    {
      label: "Manage user",
      onClick: () => console.log("manage user clicked"),
    },
    {
      label: "Export",
      onClick: () => console.log("Export clicked"),
    },
  ];

  const navigate = useNavigate();

  const handleCreateProject = () => {
    navigate(PROJECT_CREATE,{
      state: {
        accountID: "bf4da492-2f71-42f7-8859-ae70a4047a56",
      },
    });
  };

  const projectFilterFields = getProjectFilterFields();

  return (
    <div className="flex flex-col w-full h-full">
      <div className="flex justify-between w-full h-[108px] min-h-[108px] max-h-[108px] border-b-2 border-[#CBD6E2] px-4">
        <div className="flex">
          <div className="flex items-center justify-center">
            <img
              src={projectDetailsIcon}
              alt="menu-icon"
              className="h-8 w-8 bg-[#d16dd3] p-[6px] rounded"
            />
            <div className="flex flex-col mx-2.5 pb-1">
              <div className="font-semibold text-[20px] text-[#2D3E4F]">
                All Projects
              </div>
              <div className="font-medium text-[#7D98B6] text-[11px] -mt-1">
                Total Records found -{" "}
                <span className="font-semibold text-[#2D3E4F]">
                  {totalCount}
                </span>
              </div>
            </div>
            <div
              className={`flex items-center justify-center border mt-0.5 ml-2 rounded-xs w-8 h-8 cursor-pointer transition-colors duration-300 ${
                isFilterOpen
                  ? "bg-[#EAF0F6] border-[#CBD6E2]"
                  : "border-[#EAF0F5]"
              }`}
              onClick={() => setIsFilterOpen((prev) => !prev)}
            >
              <img src={filterIcon} alt="menu-icon" className="h-[12px]" />
            </div>
          </div>
        </div>
        <div className="flex gap-3 justify-center items-center">
          <ActionsDropdown actions={menuItems} />
          <TextButton
            label="New Project"
            onClick={handleCreateProject}
            sx={{
              ...BUTTON_STYLES,
              backgroundColor: "#F16137",
              color: "#fff",
              borderRadius: "2px",
              fontSize: "13px",
              fontWeight: 400,
            }}
          />
          <TextButton
            label="Import"
            variant="outlined"
            sx={{
              ...BUTTON_STYLES,
              borderRadius: "2px",
              fontSize: "13px",
              fontWeight: 400,
            }}
          />
          <div className="flex items-center justify-center border border-[#EAF0F5] rounded-[2px] w-16 h-8">
            <div className="flex items-center justify-center w-1/2">
              <img src={refreshIcon} alt="refresh-icon" className="h-4" />
            </div>
            <div className="border-l border-[#EAF0F5] h-full"></div>
            <div className="flex items-center justify-center w-1/2">
              <img src={downloadIcon} alt="download-icon" className="h-4" />
            </div>
          </div>
          <div className="flex border border-[#EAF0F5] rounded-[2px] w-8 h-8 justify-center items-center bg-[#EAF0F6]">
            <img src={actionIcon} alt="menu-icon" className="h-4" />
          </div>
          <div className="flex border border-[#EAF0F5] rounded-[2px] w-8 h-8 justify-center items-center bg-[#EAF0F6]">
            <img src={accountSettingsIcon} alt="menu-icon" className="h-4" />
          </div>
        </div>
      </div>
      <div className="flex flex-1 transition-all duration-300 ease-in-out">
        <div
          className={`flex flex-1 transition-all duration-300 ease-in-out overflow-hidden ${
            isFilterOpen ? "w-[260px] opacity-100" : "hidden w-0 opacity-0"
          }`}
        >
          <Filter
            setAppliedFilters={setAppliedFilters}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            filterFields={projectFilterFields}
            filterLabel="Filter Projects by"
            setPage={setPage}
          />
        </div>

        <div
          className={`transition-all duration-300 ease-in-out flex flex-1 flex-col border-l-2 border-[#CBD6E2] bg-[#FCFCFC] ${
            isFilterOpen ? "w-[calc(100%-260px)]" : "w-full"
          } p-5 -ml-[2px]`}
        >
          <div className="font-semibold text-[16px] leading-5 text-[#2D3E4F] mb-3.5">
            All Projects
            <span className="font-normal"> • {totalCount} items</span>
          </div>
          <div className="border border-[#CBD6E2]">
            <ProjectTable
              appliedFilters={appliedFilters}
              tableParams={tableParams}
              setTableParams={setTableParams}
              setTotalCount={setTotalCount}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
