import type { FilterState, SortOption } from '@utils/filterTypes';
import { emptyFilters } from '@utils/filterTypes';

const VALID_SORTS = new Set<SortOption>(['featured', 'newest', 'oldest', 'name-asc', 'name-desc', 'popularity']);

/**
 * Encodes active filters and sort into a URLSearchParams object.
 * Only non-default values are written to keep URLs clean.
 */
export function filtersToSearchParams(filters: FilterState, sort: SortOption): URLSearchParams {
  const params = new URLSearchParams();

  if (filters.search) params.set('search', filters.search);
  if (filters.types.length > 0) params.set('type', filters.types.join(','));
  if (filters.difficulties.length > 0) params.set('difficulty', filters.difficulties.join(','));
  if (filters.workloadTags.length > 0) params.set('workload', filters.workloadTags.join(','));
  if (filters.scenarioTags.length > 0) params.set('scenario', filters.scenarioTags.join(','));
  if (filters.classes.length > 0) params.set('class', filters.classes.join(','));
  if (filters.minMinutesToComplete !== null) params.set('minTime', String(filters.minMinutesToComplete));
  if (filters.maxMinutesToComplete !== null) params.set('maxTime', String(filters.maxMinutesToComplete));
  if (sort !== 'featured') params.set('sort', sort);

  return params;
}

/**
 * Decodes URLSearchParams into filter state and sort option.
 * Unknown or invalid values are silently ignored (safe fallback to defaults).
 */
export function searchParamsToFilters(
  params: URLSearchParams
): { filters: FilterState; sort: SortOption } {
  const splitParam = (key: string): string[] => {
    const raw = params.get(key);
    return raw ? raw.split(',').map((v: string) => v.trim()).filter((v: string) => v.length > 0) : [];
  };

  const filters: FilterState = {
    ...emptyFilters,
    search: params.get('search') ?? '',
    types: splitParam('type'),
    difficulties: splitParam('difficulty'),
    workloadTags: splitParam('workload'),
    scenarioTags: splitParam('scenario'),
    classes: splitParam('class'),
    minMinutesToComplete: params.has('minTime') ? Number(params.get('minTime')) || null : null,
    maxMinutesToComplete: params.has('maxTime') ? Number(params.get('maxTime')) || null : null,
  };

  const rawSort = params.get('sort') ?? '';
  const sort: SortOption = VALID_SORTS.has(rawSort as SortOption) ? (rawSort as SortOption) : 'featured';

  return { filters, sort };
}

/** Returns true if two URLSearchParams produce the same query string. */
export function searchParamsEqual(a: URLSearchParams, b: URLSearchParams): boolean {
  return a.toString() === b.toString();
}
