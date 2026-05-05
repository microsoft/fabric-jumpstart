'use client';
import React, { Suspense } from 'react';
import { FilterProvider } from '@components/Providers/filterProvider';
import FilterUrlSync from '@components/Providers/FilterUrlSync';
import { useGlobalStyles } from '@styles/appStyles';
import { useStyles } from './styles';
import SideMenu from '../index';

const MenuLayout = ({ children }: { children: React.ReactNode }) => {
  const styles = useStyles();
  useGlobalStyles();
  return (
    <FilterProvider>
      <Suspense fallback={null}>
        <FilterUrlSync />
      </Suspense>
      <section className={styles.layoutWrapper}>
        <SideMenu />
        {children}
      </section>
    </FilterProvider>
  );
};

export default MenuLayout;
