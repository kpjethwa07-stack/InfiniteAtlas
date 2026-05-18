import React, { createContext, useContext, useEffect } from 'react';

// Single locked-in dark aesthetic — no user choice needed
const ThemeContext = createContext({});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.add('dark');
  }, []);

  return (
    <ThemeContext.Provider value={{}}>
      {children}
    </ThemeContext.Provider>
  );
};

// Keep the hook so nothing breaks if imported elsewhere
export const useTheme = () => useContext(ThemeContext);
