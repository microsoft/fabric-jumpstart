'use client';

import React, { useEffect, KeyboardEvent } from 'react';
import { mergeClasses } from '@fluentui/react-components';
import { ChevronLeftFilled, ChevronRightFilled } from '@fluentui/react-icons';
import { useGlobalContext } from '@components/Providers/globalProvider';
import { ACTION } from '@store/action';
import SidebarFilters from './SidebarFilters';
import { useStyles } from './styles';
import { isMobileOrTablet } from '@utils/common';

const SideMenu = () => {
  const { setGlobalState, globaleState } = useGlobalContext();

  useEffect(() => {
    if (isMobileOrTablet()) {
      setGlobalState(ACTION.SET_IS_MENU_OPEN, false);
    }
  }, []);

  const handleArrowClick = () => {
    setGlobalState(ACTION.SET_IS_MENU_OPEN, !globaleState.isMenuOpen);
  };
  const handleArrowClickKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter') {
      handleArrowClick();
      event.preventDefault();
    }
  };
  const isMenuOpen = globaleState.isMenuOpen;

  const styles = useStyles();

  return (
    <aside className={styles.sideMenuWrapper}>
      <div
        className={mergeClasses(
          styles.sideMenu,
          !isMenuOpen && styles.sideMenuClose
        )}
      >
        <div className={styles.menuContainer}>
          <SidebarFilters />
        </div>
        <div className={styles.footerContainer}>
          {isMenuOpen && (
            <div
              className={mergeClasses(styles.arrow, styles.closeArrow)}
              onClick={handleArrowClick}
              aria-label="expandableButton"
              role="button"
              tabIndex={0}
              onKeyDown={handleArrowClickKeyDown}
            >
              <ChevronLeftFilled />
            </div>
          )}
        </div>
      </div>
      {!isMenuOpen && (
        <div
          className={mergeClasses(styles.arrow, styles.openArrow)}
          onClick={handleArrowClick}
          aria-label="expandableButton"
          role="button"
          tabIndex={0}
          onKeyDown={handleArrowClickKeyDown}
        >
          <ChevronRightFilled />
        </div>
      )}
    </aside>
  );
};

export default SideMenu;
