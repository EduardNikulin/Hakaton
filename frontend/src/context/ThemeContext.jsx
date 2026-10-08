import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

// Определяет системную тему
function getSystemTheme() {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    // Читаем из localStorage или используем 'auto'
    return localStorage.getItem('ecocity-theme') || 'auto';
  });

  // Определяем фактическую тему (для 'auto' — по системе)
  const resolvedTheme = theme === 'auto' ? getSystemTheme() : theme;

  // Применяем класс и сохраняем
  useEffect(() => {
    document.body.classList.toggle('dark', resolvedTheme === 'dark');
    localStorage.setItem('ecocity-theme', theme);
  }, [resolvedTheme, theme]);

  // Слушаем изменения системной темы (для режима 'auto')
  useEffect(() => {
    if (theme !== 'auto') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => {
      document.body.classList.toggle('dark', mq.matches);
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}