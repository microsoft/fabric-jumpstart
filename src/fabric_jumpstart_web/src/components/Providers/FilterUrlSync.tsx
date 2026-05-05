'use client';

import { useEffect, useLayoutEffect, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useFilterContext } from './filterProvider';
import { filtersToSearchParams, searchParamsToFilters, searchParamsEqual } from '@utils/filterUrlSync';

const SEARCH_DEBOUNCE_MS = 300;

/**
 * Null-rendering component that syncs the catalog filter state with URL query parameters.
 * Must be rendered inside FilterProvider and wrapped in a React Suspense boundary
 * (required by useSearchParams in Next.js static export).
 *
 * - On mount: reads URL params via useLayoutEffect (before browser paint) and initializes
 *   filter + sort state to avoid a visible flash of unfiltered content.
 * - On state change: replaces URL params to keep the address bar in sync.
 */
export default function FilterUrlSync() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { filters, setFilters, sort, setSort, setInitialized } = useFilterContext();

  // Tracks whether the sync effect has fired at least once. The first run always
  // has pre-init empty state and must be skipped to avoid clearing URL params.
  const initPhaseRef = useRef(true);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Initialize filter state before the browser paints to avoid a visible flash.
  // useLayoutEffect fires synchronously after DOM mutations, before paint; React
  // flushes the resulting state update in the same frame so the user never sees
  // the unfiltered catalog.
  useLayoutEffect(() => {
    const { filters: urlFilters, sort: urlSort } = searchParamsToFilters(
      new URLSearchParams(searchParams.toString())
    );
    setFilters(urlFilters);
    setSort(urlSort);
    setInitialized();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep URL in sync when filters or sort change.
  useEffect(() => {
    // Skip the very first run: it fires with pre-init empty state (before the
    // useLayoutEffect above has applied URL params), so running it would clear
    // the URL params. After this first skip the ref stays false for all future runs.
    if (initPhaseRef.current) {
      initPhaseRef.current = false;
      return;
    }

    const update = () => {
      const next = filtersToSearchParams(filters, sort);
      const current = new URLSearchParams(searchParams.toString());
      if (!searchParamsEqual(next, current)) {
        const qs = next.toString();
        router.replace(qs ? `/catalog/?${qs}` : '/catalog/', { scroll: false });
      }
    };

    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(update, filters.search ? SEARCH_DEBOUNCE_MS : 0);

    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, sort]);

  return null;
}
