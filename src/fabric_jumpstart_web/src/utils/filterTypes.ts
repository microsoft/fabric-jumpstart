/** Pure types and constants for the catalog filter state — no React, safe to import in tests. */

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
  | 'featured'
  | 'newest'
  | 'oldest'
  | 'name-asc'
  | 'name-desc'
  | 'popularity';

export const sortLabels: Record<SortOption, string> = {
  featured: 'Featured first',
  popularity: 'Most installed',
  newest: 'Newest first',
  oldest: 'Oldest first',
  'name-asc': 'Name (A–Z)',
  'name-desc': 'Name (Z–A)',
};
