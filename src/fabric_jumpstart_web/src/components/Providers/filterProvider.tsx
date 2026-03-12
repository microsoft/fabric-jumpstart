'use client';

import React, { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

export interface FilterState {
  search: string;
  types: string[];
  difficulties: string[];
  workloadTags: string[];
  scenarioTags: string[];
  minMinutesToComplete: number | null;
  maxMinutesToComplete: number | null;
  classes: string[]; // empty = all, ['Core'] or ['Community'] to filter
}

export const emptyFilters: FilterState = {
  search: '',
  types: [],
  difficulties: [],
  workloadTags: [],
  scenarioTags: [],
  minMinutesToComplete: null,
  maxMinutesToComplete: null,
  classes: [],
};

export type SortOption =
  | 'newest'
  | 'oldest'
  | 'name-asc'
  | 'name-desc';

export const sortLabels: Record<SortOption, string> = {
  newest: 'Newest first',
  oldest: 'Oldest first',
  'name-asc': 'Name (A–Z)',
  'name-desc': 'Name (Z–A)',
};

interface FilterContextType {
  filters: FilterState;
  setFilters: (filters: FilterState) => void;
  hasActiveFilters: boolean;
  clearFilters: () => void;
  sort: SortOption;
  setSort: (sort: SortOption) => void;
}

const FilterContext = createContext<FilterContextType | undefined>(undefined);

export const FilterProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [filters, setFiltersState] = useState<FilterState>({ ...emptyFilters });
  const [sort, setSortState] = useState<SortOption>('newest');

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

  return (
    <FilterContext.Provider value={{ filters, setFilters, hasActiveFilters, clearFilters, sort, setSort }}>
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
