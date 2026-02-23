'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { FluentProvider } from '@fluentui/react-components';
import { themeType } from '@constants/common';
import { lightTheme, darkTheme } from '@styles/theme';

interface ThemeValue {
  colorNeutralBackground1: string;
  colorBrandShadowKey: string;
  colorPaletteMinkForeground2: string;
}

interface ThemeContextType {
  theme: { value: ThemeValue; key: string };
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: { value: darkTheme, key: themeType.dark },
  toggleTheme: () => {},
});

const defaultTheme = {
  value: darkTheme,
  key: themeType.dark,
};

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [theme, setTheme] = useState<{ value: ThemeValue; key: string }>(
    defaultTheme
  );

  useEffect(() => {
    // Get the user's preferred theme from local storage, default to dark theme if not set
    let localTheme = localStorage.getItem('theme');
    if (!localTheme) {
      localStorage.setItem('theme', themeType.dark);
      localTheme = themeType.dark;
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
