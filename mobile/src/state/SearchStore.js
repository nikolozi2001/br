import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

import { searchSubjects } from '../api/registry';
import { useTheme } from '../theme/ThemeProvider';
import { useAppStore } from './AppStore';

const PAGE_SIZE = 20;

const emptyForm = {
  id: '',
  name: '',
  head: '',
  partner: '',
  legalForm: null,
  region: null,
  muni: null,
  address: '',
  naceCode: null,
  naceName: null,
  ownership: null,
  size: null,
  addrType: 'jur',
  activeOnly: true,
};

const SearchContext = createContext(null);

export function SearchProvider({ children }) {
  const { lang, settings } = useTheme();
  const { pushRecent } = useAppStore();

  const [form, setForm] = useState({ ...emptyForm, activeOnly: settings.defaultActiveOnly });
  const [results, setResults] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [sortBy, setSortBy] = useState('name');
  const [sortDir, setSortDir] = useState(1);

  const requestId = useRef(0);

  // Keep the untouched form in sync with the "active only by default" setting.
  useEffect(() => {
    setForm((prev) => (prev.dirty ? prev : { ...prev, activeOnly: settings.defaultActiveOnly }));
  }, [settings.defaultActiveOnly]);

  const patchForm = useCallback((patch) => {
    setForm((prev) => ({ ...prev, ...patch, dirty: true }));
  }, []);

  const resetForm = useCallback(() => {
    setForm({ ...emptyForm, activeOnly: settings.defaultActiveOnly });
  }, [settings.defaultActiveOnly]);

  const load = useCallback(
    async (nextPage, { append, currentSortBy, currentSortDir, formOverride }) => {
      const id = ++requestId.current;
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
        if (id !== requestId.current) return;
        setResults((prev) => (append ? [...prev, ...rows] : rows));
        setTotal(pagination?.total ?? (append ? total + rows.length : rows.length));
        setPage(nextPage);
      } catch (err) {
        if (id !== requestId.current) return;
        setError(err);
        if (!append) setResults([]);
      } finally {
        if (id === requestId.current) {
          setLoading(false);
          setLoadingMore(false);
        }
      }
    },
    [form, lang, sortBy, sortDir, total],
  );

  /** Runs a fresh search and records it in the history list. */
  const runSearch = useCallback(() => {
    if (settings.saveHistory) {
      pushRecent({ id: form.id, name: form.name });
    }
    load(1, { append: false });
  }, [form.id, form.name, load, pushRecent, settings.saveHistory]);

  /** Applies a patch and searches with it immediately, without waiting a render. */
  const runSearchWith = useCallback(
    (patch) => {
      const next = { ...form, ...patch, dirty: true };
      setForm(next);
      if (settings.saveHistory) pushRecent({ id: next.id, name: next.name });
      load(1, { append: false, formOverride: next });
    },
    [form, load, pushRecent, settings.saveHistory],
  );

  const loadMore = useCallback(() => {
    if (loading || loadingMore) return;
    if (results.length >= total) return;
    load(page + 1, { append: true });
  }, [load, loading, loadingMore, page, results.length, total]);

  const refresh = useCallback(() => load(1, { append: false }), [load]);

  const changeSort = useCallback(
    (key) => {
      const nextDir = sortBy === key ? -sortDir : 1;
      setSortBy(key);
      setSortDir(nextDir);
      load(1, { append: false, currentSortBy: key, currentSortDir: nextDir });
    },
    [load, sortBy, sortDir],
  );

  const value = useMemo(
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

export function useSearch() {
  const ctx = useContext(SearchContext);
  if (!ctx) throw new Error('useSearch must be used inside <SearchProvider>');
  return ctx;
}
