'use client';

import React, { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import {
  type FilterState,
  type SortOption,
  emptyFilters,
  sortLabels,
} from '@utils/filterTypes';

// Re-export for consumers that import from this module.
export type { FilterState, SortOption };
export { emptyFilters, sortLabels };

interface FilterContextType {
  filters: FilterState;
  setFilters: (filters: FilterState) => void;
  hasActiveFilters: boolean;
  clearFilters: () => void;
  sort: SortOption;
  setSort: (sort: SortOption) => void;
  /** False until URL params have been applied on the client — use to show skeletons. */
  isInitialized: boolean;
  setInitialized: () => void;
}

const FilterContext = createContext<FilterContextType | undefined>(undefined);

export const FilterProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [filters, setFiltersState] = useState<FilterState>({ ...emptyFilters });
  const [sort, setSortState] = useState<SortOption>('featured');
  const [isInitialized, setIsInitialized] = useState(false);

  const hasActiveFilters =
    filters.search !== '' ||
    filters.types.length > 0 ||
    filters.difficulties.length > 0 ||
    filters.workloadTags.length > 0 ||
    filters.scenarioTags.length > 0 ||
    filters.minMinutesToComplete !== null ||
    filters.maxMinutesToComplete !== null ||
    filters.classes.length > 0;

  const setFilters = useCallback((next: FilterState) => {
    setFiltersState(next);
  }, []);

  const clearFilters = useCallback(() => {
    setFiltersState({ ...emptyFilters });
  }, []);

  const setSort = useCallback((next: SortOption) => {
    setSortState(next);
  }, []);

  const setInitialized = useCallback(() => {
    setIsInitialized(true);
  }, []);

  return (
    <FilterContext.Provider value={{ filters, setFilters, hasActiveFilters, clearFilters, sort, setSort, isInitialized, setInitialized }}>
      {children}
    </FilterContext.Provider>
  );
};

export const useFilterContext = (): FilterContextType => {
  const context = useContext(FilterContext);
  if (context === undefined) {
    throw new Error('useFilterContext must be used within a FilterProvider');
  }
  return context;
};
