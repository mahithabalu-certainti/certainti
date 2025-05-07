import { ResetFilter } from "../../../../types/resource";

export const resetFilter = ({
    setAppliedFilters,
    setFilterStates,
    setSelectedFilters,
    onFilterStatesChange,
    onSelectedFiltersChange,
  }: ResetFilter) => {
    setAppliedFilters({});
    setFilterStates({});
    setSelectedFilters([]);
    if (onFilterStatesChange) {
      onFilterStatesChange({});
    }
  
    if (onSelectedFiltersChange) {
      onSelectedFiltersChange([]);
    }
  };