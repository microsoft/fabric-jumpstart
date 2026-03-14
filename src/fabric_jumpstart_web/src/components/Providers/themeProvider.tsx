'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { FluentProvider } from '@fluentui/react-components';
import { themeType } from '@constants/common';
import { lightTheme, darkTheme } from '@styles/theme';
import { useGlobalStyles } from '@styles/appStyles';

interface ThemeValue {
  colorNeutralBackground1: string;
}

interface ThemeContextType {
  theme: { value: ThemeValue; key: string };
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: { value: lightTheme, key: themeType.light },
  toggleTheme: () => {},
});

const defaultTheme = {
  value: lightTheme,
  key: themeType.light,
};

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  useGlobalStyles();

  const [theme, setTheme] = useState<{ value: ThemeValue; key: string }>(
    defaultTheme
  );

  useEffect(() => {
    let localTheme = localStorage.getItem('theme');
    if (!localTheme) {
      localStorage.setItem('theme', themeType.light);
      localTheme = themeType.light;
    }
    // Determine the selected theme based on the user's preference
    const fluentTheme = localTheme === themeType.light ? lightTheme : darkTheme;

    // Set the initial theme
    setTheme({ value: fluentTheme, key: localTheme });
  }, []);

  // Function to toggle the theme
  const toggleTheme = () => {
    // Get the user's current theme from local storage
    const localTheme = localStorage.getItem('theme');

    // Determine the new theme based on the user's current theme
    const fluentTheme = localTheme === themeType.light ? darkTheme : lightTheme;

    // Determine the new user theme based on the user's current theme
    const newLocalTheme =
      localTheme === themeType.light ? themeType.dark : themeType.light;

    // Update the user's theme in local storage
    localStorage.setItem('theme', newLocalTheme);

    // Set the new theme
    setTheme({ value: fluentTheme, key: newLocalTheme });
  };

  // Set global CSS custom properties so scrollbar and body styles can reference them
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme.key);
    document.documentElement.style.backgroundColor = theme.value.colorNeutralBackground1;
    document.body.style.setProperty(
      '--colorNeutralBackground1',
      theme.value.colorNeutralBackground1
    );
    document.body.style.setProperty(
      '--scrollbarThumbBg',
      'linear-gradient(180deg, #117865 0%, #0078d4 100%)'
    );
    return () => {
      document.body.style.removeProperty('--colorNeutralBackground1');
      document.body.style.removeProperty('--scrollbarThumbBg');
    };
  }, [theme]);

  return (
    <ThemeContext.Provider
      value={{
        theme,
        toggleTheme,
      }}
    >
      <FluentProvider theme={theme.value}>{children}</FluentProvider>
    </ThemeContext.Provider>
  );
};

export const useThemeContext = () => useContext(ThemeContext);
