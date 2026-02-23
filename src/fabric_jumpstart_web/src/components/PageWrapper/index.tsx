'use client';

import React, { useEffect } from 'react';
import { useThemeContext } from '@components/Providers/themeProvider';
import { useGlobalStyles } from '@styles/appStyles';
import { useStyles } from './styles';

const PageWrapper = ({ children }: { children: React.ReactNode }) => {
  const classes = useStyles();
  const { theme } = useThemeContext();
  useGlobalStyles();
  useEffect(() => {
    document.body.style.setProperty(
      '--colorNeutralBackground1',
      theme.value.colorNeutralBackground1
    );
    document.body.style.setProperty(
      '--scrollbarThumbBg',
      `linear-gradient(180deg,${theme.value.colorBrandShadowKey} 0%, ${theme.value.colorPaletteMinkForeground2} 100%)`
    );
    return () => {
      document.body.style.removeProperty('--colorNeutralBackground1');
      document.body.style.removeProperty('--scrollbarThumbBg');
    };
  }, [theme]);

  return (
    <main className={classes.wrapper}>
      <section className={classes.container}>{children}</section>
    </main>
  );
};

export default PageWrapper;
