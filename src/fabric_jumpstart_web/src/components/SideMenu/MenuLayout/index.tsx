'use client';
import React from 'react';
import { FilterProvider } from '@components/Providers/filterProvider';
import { useGlobalStyles } from '@styles/appStyles';
import { useStyles } from './styles';
import SideMenu from '../index';

const MenuLayout = ({ children }: { children: React.ReactNode }) => {
  const styles = useStyles();
  useGlobalStyles();
  return (
    <FilterProvider>
      <section className={styles.layoutWrapper}>
        <SideMenu />
        {children}
      </section>
    </FilterProvider>
  );
};

export default MenuLayout;
