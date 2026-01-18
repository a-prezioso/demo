import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

interface RouterContextValue {
  path: string;
  navigate: (href: string) => void;
}

const RouterContext = createContext<RouterContextValue | undefined>(undefined);

export const RouterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [path, setPath] = useState<string>(() => (typeof window !== 'undefined' ? window.location.pathname : '/'));

  useEffect(() => {
    const onPop = () => setPath(window.location.pathname);
    window.addEventListener('popstate', onPop);
    window.addEventListener('pushstate', onPop as any);
    return () => {
      window.removeEventListener('popstate', onPop);
      window.removeEventListener('pushstate', onPop as any);
    };
  }, []);

  const navigate = useCallback((href: string) => {
    if (typeof window === 'undefined') return;
    const prev = window.location.pathname + window.location.search + window.location.hash;
    window.history.pushState({}, '', href);
    const event = new PopStateEvent('popstate', { state: {} });
    window.dispatchEvent(event);
    const now = window.location.pathname + window.location.search + window.location.hash;
    if (prev === now) {
      window.location.href = href;
    }
  }, []);

  const value = useMemo(() => ({ path, navigate }), [path, navigate]);

  return <RouterContext.Provider value={value}>{children}</RouterContext.Provider>;
};

export function useRouter() {
  const ctx = useContext(RouterContext);
  if (!ctx) throw new Error('useRouter must be used within RouterProvider');
  return ctx;
}

export function useCurrentPath(): string {
  return useRouter().path;
}
