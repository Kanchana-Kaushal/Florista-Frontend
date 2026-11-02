import { createContext, useState, useEffect, useContext } from 'react';

export const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(() => {
    const stored = localStorage.getItem('florista-theme');
    if (stored) return stored === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  const [showKeyboardHints, setShowKeyboardHints] = useState(() => {
    return localStorage.getItem('florista-kb-hints') === 'true';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
      localStorage.setItem('florista-theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('florista-theme', 'light');
    }
  }, [isDark]);

  useEffect(() => {
    localStorage.setItem('florista-kb-hints', showKeyboardHints ? 'true' : 'false');
  }, [showKeyboardHints]);

  const toggleTheme = () => setIsDark(prev => !prev);
  const toggleKeyboardHints = () => setShowKeyboardHints(prev => !prev);

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme, showKeyboardHints, toggleKeyboardHints }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
