import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const FAVS_KEY = 'br.favourites.v1';
const RECENT_KEY = 'br.recent.v1';
const MAX_RECENT = 5;

const AppContext = createContext(null);

export function AppStoreProvider({ children }) {
  /** id → subject snapshot, so the favourites list renders without a refetch. */
  const [favourites, setFavourites] = useState({});
  const [recent, setRecent] = useState([]);
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);

  useEffect(() => {
    Promise.all([AsyncStorage.getItem(FAVS_KEY), AsyncStorage.getItem(RECENT_KEY)])
      .then(([favRaw, recentRaw]) => {
        if (favRaw) setFavourites(JSON.parse(favRaw));
        if (recentRaw) setRecent(JSON.parse(recentRaw));
      })
      .catch(() => {});
    return () => clearTimeout(toastTimer.current);
  }, []);

  const persistFavs = useCallback((next) => {
    AsyncStorage.setItem(FAVS_KEY, JSON.stringify(next)).catch(() => {});
    return next;
  }, []);

  const persistRecent = useCallback((next) => {
    AsyncStorage.setItem(RECENT_KEY, JSON.stringify(next)).catch(() => {});
    return next;
  }, []);

  const showToast = useCallback((message, action = null, actionLabel = '') => {
    clearTimeout(toastTimer.current);
    setToast({ message, action, actionLabel });
    toastTimer.current = setTimeout(() => setToast(null), action ? 4200 : 2400);
  }, []);

  const hideToast = useCallback(() => {
    clearTimeout(toastTimer.current);
    setToast(null);
  }, []);

  const isFavourite = useCallback((id) => Boolean(favourites[id]), [favourites]);

  const toggleFavourite = useCallback(
    (subject) => {
      if (!subject?.id) return false;
      let added = false;
      setFavourites((prev) => {
        const next = { ...prev };
        if (next[subject.id]) {
          delete next[subject.id];
        } else {
          next[subject.id] = subject;
          added = true;
        }
        return persistFavs(next);
      });
      return added;
    },
    [persistFavs],
  );

  const restoreFavourite = useCallback(
    (subject) => {
      setFavourites((prev) => persistFavs({ ...prev, [subject.id]: subject }));
    },
    [persistFavs],
  );

  const pushRecent = useCallback(
    (entry) => {
      const label = (entry.name || entry.id || '').trim();
      if (!label) return;
      setRecent((prev) =>
        persistRecent([entry, ...prev.filter((r) => (r.name || r.id) !== label)].slice(0, MAX_RECENT)),
      );
    },
    [persistRecent],
  );

  const clearRecent = useCallback(() => setRecent(persistRecent([])), [persistRecent]);

  const favouriteList = useMemo(() => Object.values(favourites), [favourites]);

  const value = useMemo(
    () => ({
      favourites,
      favouriteList,
      favouriteCount: favouriteList.length,
      isFavourite,
      toggleFavourite,
      restoreFavourite,
      recent,
      pushRecent,
      clearRecent,
      toast,
      showToast,
      hideToast,
    }),
    [
      favourites, favouriteList, isFavourite, toggleFavourite, restoreFavourite,
      recent, pushRecent, clearRecent, toast, showToast, hideToast,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppStore() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppStore must be used inside <AppStoreProvider>');
  return ctx;
}
