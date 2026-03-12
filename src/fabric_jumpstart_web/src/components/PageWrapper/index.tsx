'use client';

import React from 'react';
import { useGlobalStyles } from '@styles/appStyles';
import { useStyles } from './styles';

const PageWrapper = ({ children }: { children: React.ReactNode }) => {
  const classes = useStyles();
  useGlobalStyles();

  return (
    <main className={classes.wrapper}>
      <section className={classes.container}>{children}</section>
    </main>
  );
};

export default PageWrapper;
