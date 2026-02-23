'use client';
import Icon from '@components/Icon';
import { useStyles } from './styles';
import ThemeDarkIcon from '@images/theme-dark-icon.svg';
import { useEffect, useState, KeyboardEvent } from 'react';
import { mergeClasses } from '@fluentui/react-components';
import { useThemeContext } from '@components/Providers/themeProvider';
import { themeType } from '@constants/common';
import { WeatherSunnyRegular } from '@fluentui/react-icons';

export interface ThemeToggleProps {
  alt: string;
}

const ThemeToggleButton: React.FC<ThemeToggleProps> = ({ alt }) => {
  const styles = useStyles();
  const { theme, toggleTheme } = useThemeContext();
  const [darkMode, setDarkMode] = useState<boolean>(
    theme.key === themeType.dark
  );
  useEffect(() => {
    setDarkMode(theme.key === themeType.dark);
  }, [theme]);
  const handleToggleTheme = () => {
    toggleTheme();
    setDarkMode(!darkMode);
  };
  const handleEnterToggleTheme = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key == 'Enter') {
      toggleTheme();
      setDarkMode(!darkMode);
    }
  };
  return (
    <div
      onClick={handleToggleTheme}
      className={styles.buttonContainer}
      aria-label="Toggle theme"
      role="button"
      tabIndex={0}
      onKeyDown={handleEnterToggleTheme}
    >
      <div
        className={mergeClasses(
          styles.solidCircle,
          darkMode ? styles.translateBackward : styles.translateFoward
        )}
      ></div>
      <WeatherSunnyRegular className={styles.icons} />
      <Icon
        className={styles.icons}
        alt={alt}
        darkThemeIcon={ThemeDarkIcon}
        lightThemeIcon={ThemeDarkIcon}
        height={15}
        width={15}
      />
    </div>
  );
};

export default ThemeToggleButton;
