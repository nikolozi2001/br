import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

import type { RecentSearch, Subject, ToastState } from '../types';

const FAVS_KEY = 'br.favourites.v1';
const RECENT_KEY = 'br.recent.v1';
const MAX_RECENT = 5;

/** id → subject snapshot, so the favourites list renders without a refetch. */
type FavouriteMap = Record<string, Subject>;

export interface AppStoreValue {
  favourites: FavouriteMap;
  favouriteList: Subject[];
  favouriteCount: number;
  isFavourite: (id: string) => boolean;
  /** Returns true when the subject was added, false when it was removed. */
  toggleFavourite: (subject: Subject) => boolean;
  restoreFavourite: (subject: Subject) => void;
  recent: RecentSearch[];
  pushRecent: (entry: RecentSearch) => void;
  clearRecent: () => void;
  toast: ToastState | null;
  showToast: (message: string, action?: (() => void) | null, actionLabel?: string) => void;
  hideToast: () => void;
}

const AppContext = createContext<AppStoreValue | null>(null);

export function AppStoreProvider({ children }: { children: React.ReactNode }) {
  const [favourites, setFavourites] = useState<FavouriteMap>({});
  const [recent, setRecent] = useState<RecentSearch[]>([]);
  const [toast, setToast] = useState<ToastState | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    Promise.all([AsyncStorage.getItem(FAVS_KEY), AsyncStorage.getItem(RECENT_KEY)])
      .then(([favRaw, recentRaw]) => {
        if (favRaw) setFavourites(JSON.parse(favRaw) as FavouriteMap);
        if (recentRaw) setRecent(JSON.parse(recentRaw) as RecentSearch[]);
      })
      .catch(() => {});
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, []);

  const persistFavs = useCallback((next: FavouriteMap) => {
    AsyncStorage.setItem(FAVS_KEY, JSON.stringify(next)).catch(() => {});
    return next;
  }, []);

  const persistRecent = useCallback((next: RecentSearch[]) => {
    AsyncStorage.setItem(RECENT_KEY, JSON.stringify(next)).catch(() => {});
    return next;
  }, []);

  const showToast = useCallback(
    (message: string, action: (() => void) | null = null, actionLabel = '') => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
      setToast({ message, action, actionLabel });
      toastTimer.current = setTimeout(() => setToast(null), action ? 4200 : 2400);
    },
    [],
  );

  const hideToast = useCallback(() => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast(null);
  }, []);

  const isFavourite = useCallback((id: string) => Boolean(favourites[id]), [favourites]);

  const toggleFavourite = useCallback(
    (subject: Subject) => {
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
    (subject: Subject) => {
      setFavourites((prev) => persistFavs({ ...prev, [subject.id]: subject }));
    },
    [persistFavs],
  );

  const pushRecent = useCallback(
    (entry: RecentSearch) => {
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

  const value = useMemo<AppStoreValue>(
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

export function useAppStore(): AppStoreValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppStore must be used inside <AppStoreProvider>');
  return ctx;
}
