import React, { useRef, useState } from "react";
import { arrowIcon, checkedIcon } from "../../assets";
import { Menu, MenuItem } from "@mui/material";

const systemFilters = ["Touched Records", "Untouched Records", "Record Action"];
const allFilters = [
  "Account Number",
  "Parent Account",
  "Account Name",
  "Account ID",
  "Industry",
  "Country",
  "Currency",
  "Status",
  "Primary Contact",
  "is Parent Account",
];

const FilterModal: React.FC = () => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };
  return (
    <>
      <div className="h-auto min-h-[165px] w-[521px] flex flex-col gap-4 bg-white rounded-[8px] py-4 px-6 border border-[#CBD6E2]">
        <div className="flex justify-between items-center">
          <h2 className="text-[16px] font-bold text-[#2D3E4F]">Filters</h2>
          <button className="text-[12px] font-medium text-[#425A76] underline cursor-pointer hover:text-[#FF6666]">
            Clear
          </button>
        </div>

        <div>
          <h3 className="text-[13px] font-bold text-[#425A76] mb-2">
            System Define filters
          </h3>
          <div className="flex gap-2 flex-wrap">
            {systemFilters.map((label) => (
              <span
                key={label}
                className="border border-[#CBD6E2] cursor-pointer rounded-full px-1 h-[23px] text-[12px] font-normal flex items-center gap-0.5 text-[#425A76]"
              >
                <img src={checkedIcon} alt="checked-icon" />
                {label}
              </span>
            ))}
          </div>
        </div>

        <div className="flex-1">
          <h3 className="text-[13px] font-bold text-[#425A76] mb-2">
            All filters
          </h3>
        </div>

        <div className="flex items-center justify-between">
          <button
            ref={buttonRef}
            onClick={handleClick}
            className="text-[14px] font-bold text-[#425A76] flex items-center gap-1 cursor-pointer"
          >
            <span className="font-normal text-[16px]">+</span> Add Filter By
            Fields
            <img src={arrowIcon} alt={"arrowIcon"} className="mt-0.5" />
          </button>
          {/* <div className="flex justify-end gap-2">
          <button className="text-[12px] rounded-[2px] text-[#425A76] h-[24px] flex items-center px-2 border border-[#CBD6E2] cursor-pointer">
            Cancel
          </button>
          <button className="text-[12px] rounded-[2px] text-[#425A76] h-[24px] flex items-center px-2 border border-[#CBD6E2] cursor-pointer">
            Apply
          </button>
        </div> */}
        </div>
      </div>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        PaperProps={{
          style: {
            minWidth: 170,
            borderRadius: "8px",
            border: "1px solid #CBD6E2",
            boxShadow: "none",
          },
        }}
      >
        {allFilters.map((filter) => (
          <MenuItem
            key={filter}
            onClick={handleClose}
            sx={{
              fontWeight: 600,
              fontSize: "14px",
              lineHeight: "30px",
              color: "#425A76",
              py: '1px',
            }}
          >
            <img src={checkedIcon} alt="checked" className="w-4 mr-1" />
            {filter}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
};

export default FilterModal;
