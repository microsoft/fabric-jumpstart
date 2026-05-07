/**
 * Unit tests for filterUrlSync serialization helpers.
 * Tests that filters round-trip correctly through URL params.
 */

import { filtersToSearchParams, searchParamsToFilters, searchParamsEqual } from '@utils/filterUrlSync';
import { emptyFilters } from '@utils/filterTypes';
import type { FilterState, SortOption } from '@utils/filterTypes';

describe('filtersToSearchParams', () => {
  it('produces no params for default/empty filter state', () => {
    const params = filtersToSearchParams(emptyFilters, 'featured');
    expect(params.toString()).toBe('');
  });

  it('encodes search string', () => {
    const params = filtersToSearchParams({ ...emptyFilters, search: 'lakehouse' }, 'featured');
    expect(params.get('search')).toBe('lakehouse');
  });

  it('encodes types as comma-separated', () => {
    const params = filtersToSearchParams({ ...emptyFilters, types: ['Tutorial', 'Demo'] }, 'featured');
    expect(params.get('type')).toBe('Tutorial,Demo');
  });

  it('encodes difficulties', () => {
    const params = filtersToSearchParams({ ...emptyFilters, difficulties: ['Beginner'] }, 'featured');
    expect(params.get('difficulty')).toBe('Beginner');
  });

  it('encodes workloadTags', () => {
    const params = filtersToSearchParams({ ...emptyFilters, workloadTags: ['Power BI', 'Data Engineering'] }, 'featured');
    expect(params.get('workload')).toBe('Power BI,Data Engineering');
  });

  it('encodes scenarioTags', () => {
    const params = filtersToSearchParams({ ...emptyFilters, scenarioTags: ['Streaming'] }, 'featured');
    expect(params.get('scenario')).toBe('Streaming');
  });

  it('encodes classes', () => {
    const params = filtersToSearchParams({ ...emptyFilters, classes: ['Core'] }, 'featured');
    expect(params.get('class')).toBe('Core');
  });

  it('encodes minTime and maxTime', () => {
    const params = filtersToSearchParams({ ...emptyFilters, minMinutesToComplete: 10, maxMinutesToComplete: 45 }, 'featured');
    expect(params.get('minTime')).toBe('10');
    expect(params.get('maxTime')).toBe('45');
  });

  it('omits minTime/maxTime when null', () => {
    const params = filtersToSearchParams(emptyFilters, 'featured');
    expect(params.has('minTime')).toBe(false);
    expect(params.has('maxTime')).toBe(false);
  });

  it('encodes non-default sort option', () => {
    const params = filtersToSearchParams(emptyFilters, 'newest');
    expect(params.get('sort')).toBe('newest');
  });

  it('omits sort param when sort is "featured" (default)', () => {
    const params = filtersToSearchParams(emptyFilters, 'featured');
    expect(params.has('sort')).toBe(false);
  });
});

describe('searchParamsToFilters', () => {
  const makeParams = (obj: Record<string, string>) => new URLSearchParams(obj);

  it('returns empty filters and default sort for empty params', () => {
    const { filters, sort } = searchParamsToFilters(new URLSearchParams());
    expect(filters).toEqual(emptyFilters);
    expect(sort).toBe('featured');
  });

  it('decodes search', () => {
    const { filters } = searchParamsToFilters(makeParams({ search: 'lakehouse' }));
    expect(filters.search).toBe('lakehouse');
  });

  it('decodes types', () => {
    const { filters } = searchParamsToFilters(makeParams({ type: 'Tutorial,Demo' }));
    expect(filters.types).toEqual(['Tutorial', 'Demo']);
  });

  it('decodes difficulties', () => {
    const { filters } = searchParamsToFilters(makeParams({ difficulty: 'Beginner,Advanced' }));
    expect(filters.difficulties).toEqual(['Beginner', 'Advanced']);
  });

  it('decodes workload tags', () => {
    const { filters } = searchParamsToFilters(makeParams({ workload: 'Power BI,Data Engineering' }));
    expect(filters.workloadTags).toEqual(['Power BI', 'Data Engineering']);
  });

  it('decodes scenario tags', () => {
    const { filters } = searchParamsToFilters(makeParams({ scenario: 'Streaming,Monitoring' }));
    expect(filters.scenarioTags).toEqual(['Streaming', 'Monitoring']);
  });

  it('decodes classes', () => {
    const { filters } = searchParamsToFilters(makeParams({ class: 'Core,Community' }));
    expect(filters.classes).toEqual(['Core', 'Community']);
  });

  it('decodes minTime and maxTime', () => {
    const { filters } = searchParamsToFilters(makeParams({ minTime: '5', maxTime: '30' }));
    expect(filters.minMinutesToComplete).toBe(5);
    expect(filters.maxMinutesToComplete).toBe(30);
  });

  it('returns null for minTime/maxTime when not present', () => {
    const { filters } = searchParamsToFilters(new URLSearchParams());
    expect(filters.minMinutesToComplete).toBeNull();
    expect(filters.maxMinutesToComplete).toBeNull();
  });

  it('decodes valid sort option', () => {
    const { sort } = searchParamsToFilters(makeParams({ sort: 'name-asc' }));
    expect(sort).toBe('name-asc');
  });

  it('falls back to "featured" for unknown sort values', () => {
    const { sort } = searchParamsToFilters(makeParams({ sort: 'invalid-sort' }));
    expect(sort).toBe('featured');
  });

  it('ignores unknown params silently', () => {
    const { filters, sort } = searchParamsToFilters(makeParams({ unknown: 'value', foo: 'bar' }));
    expect(filters).toEqual(emptyFilters);
    expect(sort).toBe('featured');
  });

  it('handles trailing/leading whitespace in comma-separated values', () => {
    const { filters } = searchParamsToFilters(makeParams({ type: ' Tutorial , Demo ' }));
    expect(filters.types).toEqual(['Tutorial', 'Demo']);
  });
});

describe('round-trip (encode → decode)', () => {
  const roundTrip = (filters: FilterState, sort: SortOption) => {
    const encoded = filtersToSearchParams(filters, sort);
    return searchParamsToFilters(encoded);
  };

  it('round-trips a fully populated filter state', () => {
    const filters: FilterState = {
      search: 'test query',
      types: ['Tutorial', 'Accelerator'],
      difficulties: ['Intermediate'],
      workloadTags: ['Power BI'],
      scenarioTags: ['Streaming'],
      classes: ['Core'],
      minMinutesToComplete: 10,
      maxMinutesToComplete: 60,
    };
    const { filters: decoded, sort } = roundTrip(filters, 'newest');
    expect(decoded).toEqual(filters);
    expect(sort).toBe('newest');
  });

  it('round-trips default/empty state', () => {
    const { filters, sort } = roundTrip(emptyFilters, 'featured');
    expect(filters).toEqual(emptyFilters);
    expect(sort).toBe('featured');
  });
});

describe('searchParamsEqual', () => {
  it('returns true for identical params', () => {
    const a = new URLSearchParams({ search: 'test', type: 'Tutorial' });
    const b = new URLSearchParams({ search: 'test', type: 'Tutorial' });
    expect(searchParamsEqual(a, b)).toBe(true);
  });

  it('returns false for different params', () => {
    const a = new URLSearchParams({ search: 'test' });
    const b = new URLSearchParams({ search: 'other' });
    expect(searchParamsEqual(a, b)).toBe(false);
  });

  it('returns true for two empty params', () => {
    expect(searchParamsEqual(new URLSearchParams(), new URLSearchParams())).toBe(true);
  });
});
