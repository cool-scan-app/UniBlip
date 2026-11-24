/**
 * Active store state.
 *
 * TEMPORARY placeholder for issue #15 (active store selection and state).
 * The scanner only depends on `useActiveStore()` and the `Store` type, so whoever
 * implements #15 can replace the internals (persistence, store picker, etc.)
 * without touching the barcode-scanning feature.
 */
import { createContext, use, useState, type ReactNode } from 'react';

/** Mirrors the `/api/v1/stores` response on feature/4-store-selection. */
export type Store = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
};

type ActiveStoreContextValue = {
  activeStore: Store | null;
  setActiveStore: (store: Store) => void;
  clearActiveStore: () => void;
};

const ActiveStoreContext = createContext<ActiveStoreContextValue | null>(null);

export function ActiveStoreProvider({ initialStore = null, children }: { initialStore?: Store | null; children: ReactNode }) {
  const [activeStore, setActiveStore] = useState<Store | null>(initialStore);

  return (
    <ActiveStoreContext value={{ activeStore, setActiveStore, clearActiveStore: () => setActiveStore(null) }}>
      {children}
    </ActiveStoreContext>
  );
}

export function useActiveStore(): ActiveStoreContextValue {
  const value = use(ActiveStoreContext);
  if (!value) throw new Error('useActiveStore must be used inside <ActiveStoreProvider>');
  return value;
}

/** A store is valid for shopping when it has an id. Extend when #14 adds more rules. */
export function isValidStore(store: Store | null): store is Store {
  return !!store && store.id.trim().length > 0;
}
