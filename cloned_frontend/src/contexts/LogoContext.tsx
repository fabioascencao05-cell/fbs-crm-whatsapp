import { createContext, useContext, useState, ReactNode } from 'react';

interface LogoContextType {
  logoUrl: string | null;
  setLogoUrl: (url: string | null) => void;
}

const LogoContext = createContext<LogoContextType | null>(null);

export function LogoProvider({ children }: { children: ReactNode }) {
  const [logoUrl, setLogoUrlState] = useState<string | null>(() => {
    try { return localStorage.getItem('fbs_logo'); } catch { return null; }
  });

  const setLogoUrl = (url: string | null) => {
    setLogoUrlState(url);
    try {
      if (url) localStorage.setItem('fbs_logo', url);
      else localStorage.removeItem('fbs_logo');
    } catch {}
  };

  return (
    <LogoContext.Provider value={{ logoUrl, setLogoUrl }}>
      {children}
    </LogoContext.Provider>
  );
}

export function useLogo() {
  const ctx = useContext(LogoContext);
  if (!ctx) throw new Error('useLogo must be used within LogoProvider');
  return ctx;
}
