import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

import { searchSubjects } from '../api/registry';
import { createRequestGuard } from '../utils/requestGuard';
import { useTheme } from '../theme/ThemeProvider';
import { useAppStore } from './AppStore';
import type { SearchForm, SortKey, Subject } from '../types';

const PAGE_SIZE = 20;

const emptyForm: SearchForm = {
  id: '',
  name: '',
  head: '',
  partner: '',
  legalForm: [],
  region: [],
  muni: [],
  address: '',
  naceCode: [],
  naceName: [],
  ownership: [],
  size: [],
  addrType: 'jur',
  activeOnly: false,
};

interface LoadOptions {
  append: boolean;
  currentSortBy?: SortKey;
  currentSortDir?: number;
  formOverride?: SearchForm;
}

export interface SearchValue {
  form: SearchForm;
  patchForm: (patch: Partial<SearchForm>) => void;
  resetForm: () => void;
  results: Subject[];
  total: number;
  loading: boolean;
  loadingMore: boolean;
  error: Error | null;
  sortBy: SortKey;
  sortDir: number;
  changeSort: (key: SortKey) => void;
  runSearch: () => void;
  runSearchWith: (patch: Partial<SearchForm>) => void;
  loadMore: () => void;
  refresh: () => void;
  hasMore: boolean;
}

const SearchContext = createContext<SearchValue | null>(null);

export function SearchProvider({ children }: { children: React.ReactNode }) {
  const { lang, settings } = useTheme();
  const { pushRecent } = useAppStore();

  const [form, setForm] = useState<SearchForm>(emptyForm);
  const [results, setResults] = useState<Subject[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [sortBy, setSortBy] = useState<SortKey>('name');
  const [sortDir, setSortDir] = useState(1);

  // Searches overtake each other; only the newest may write to state.
  const guard = useRef(createRequestGuard()).current;

  const patchForm = useCallback((patch: Partial<SearchForm>) => {
    setForm((prev) => ({ ...prev, ...patch, dirty: true }));
  }, []);

  const resetForm = useCallback(() => {
    setForm(emptyForm);
  }, []);

  const load = useCallback(
    async (nextPage: number, { append, currentSortBy, currentSortDir, formOverride }: LoadOptions) => {
      const token = guard.start();
      if (append) setLoadingMore(true);
      else setLoading(true);
      setError(null);

      try {
        const { results: rows, pagination } = await searchSubjects(formOverride ?? form, {
          lang,
          page: nextPage,
          limit: PAGE_SIZE,
          sortBy: currentSortBy ?? sortBy,
          sortDir: (currentSortDir ?? sortDir) > 0 ? 'asc' : 'desc',
        });
        if (!guard.isCurrent(token)) return;
        setResults((prev) => (append ? [...prev, ...rows] : rows));
        setTotal(pagination?.total ?? (append ? total + rows.length : rows.length));
        setPage(nextPage);
      } catch (err) {
        if (!guard.isCurrent(token)) return;
        setError(err as Error);
        if (!append) setResults([]);
      } finally {
        if (guard.isCurrent(token)) {
          setLoading(false);
          setLoadingMore(false);
        }
      }
    },
    [form, guard, lang, sortBy, sortDir, total],
  );

  /** Runs a fresh search and records it in the history list. */
  const runSearch = useCallback(() => {
    if (settings.saveHistory) {
      pushRecent({ id: form.id, name: form.name });
    }
    void load(1, { append: false });
  }, [form.id, form.name, load, pushRecent, settings.saveHistory]);

  /** Applies a patch and searches with it immediately, without waiting a render. */
  const runSearchWith = useCallback(
    (patch: Partial<SearchForm>) => {
      const next: SearchForm = { ...form, ...patch, dirty: true };
      setForm(next);
      if (settings.saveHistory) pushRecent({ id: next.id, name: next.name });
      void load(1, { append: false, formOverride: next });
    },
    [form, load, pushRecent, settings.saveHistory],
  );

  const loadMore = useCallback(() => {
    if (loading || loadingMore) return;
    if (results.length >= total) return;
    void load(page + 1, { append: true });
  }, [load, loading, loadingMore, page, results.length, total]);

  const refresh = useCallback(() => void load(1, { append: false }), [load]);

  const changeSort = useCallback(
    (key: SortKey) => {
      const nextDir = sortBy === key ? -sortDir : 1;
      setSortBy(key);
      setSortDir(nextDir);
      void load(1, { append: false, currentSortBy: key, currentSortDir: nextDir });
    },
    [load, sortBy, sortDir],
  );

  const value = useMemo<SearchValue>(
    () => ({
      form, patchForm, resetForm,
      results, total, loading, loadingMore, error,
      sortBy, sortDir, changeSort,
      runSearch, runSearchWith, loadMore, refresh,
      hasMore: results.length < total,
    }),
    [
      form, patchForm, resetForm, results, total, loading, loadingMore, error,
      sortBy, sortDir, changeSort, runSearch, runSearchWith, loadMore, refresh,
    ],
  );

  return <SearchContext.Provider value={value}>{children}</SearchContext.Provider>;
}

export function useSearch(): SearchValue {
  const ctx = useContext(SearchContext);
  if (!ctx) throw new Error('useSearch must be used inside <SearchProvider>');
  return ctx;
}
