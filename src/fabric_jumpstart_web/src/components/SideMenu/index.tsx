'use client';

import React, { useEffect, useState, useCallback, KeyboardEvent } from 'react';
import { usePathname } from 'next/navigation';
import { mergeClasses } from '@fluentui/react-components';
import { ChevronLeftFilled, ChevronRightFilled } from '@fluentui/react-icons';
import SideMenuData from '@data/side-menu.json';
import { findNode, sortNodeTree } from '@utils/markdown';
import { useGlobalContext } from '@components/Providers/globalProvider';
import { ACTION } from '@store/action';
import Menu from './Menu';
import SidebarFilters, { FilterState, getMatchingSlugs } from './SidebarFilters';
import { useStyles } from './styles';
import { isMobileOrTablet } from '@utils/common';

const SideMenu = () => {
  const { setGlobalState, globaleState } = useGlobalContext();
  const menuOpenItems = globaleState.menuItems || [];
  const sortedMenuData = sortNodeTree(SideMenuData);
  const pathname = usePathname();
  const [matchingSlugs, setMatchingSlugs] = useState<Set<string> | null>(null);

  const handleApplyFilters = useCallback((filters: FilterState) => {
    setMatchingSlugs(getMatchingSlugs(filters));
  }, []);

  useEffect(() => {
    // Build menu data from the fabric_jumpstart node
    const fabricNode = findNode(sortedMenuData, 'fabric_jumpstart');
    const menuData = {
      name: 'docs',
      type: 'directory',
      path: '',
      children: fabricNode ? [fabricNode] : [],
      frontMatter: {
        title: 'docs',
      },
    };
    setGlobalState(ACTION.SET_MENU_DATA, menuData);
  }, []);

  const handleToggle = (_: any, data: any) => {
    setGlobalState(ACTION.SET_MENU, data.openItems);
  };

  const setOpenItem = (item: any) => {
    item = item.replace(/\//g, '\\').trim();
    const newMenuOpenItem = [...menuOpenItems];
    const updatedOpenItems = newMenuOpenItem.map((openItem) => {
      return openItem.replace(/\//g, '\\').trim();
    });
    if (updatedOpenItems.includes(item)) {
      updatedOpenItems.splice(updatedOpenItems.indexOf(item), 1);
    } else {
      updatedOpenItems.push(item);
    }
    setGlobalState(ACTION.SET_MENU_ITEMS, updatedOpenItems);
  };
  const onMenuItemClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    isBranch: boolean,
    childNode: any
  ) => {
    if (isBranch) {
      e.preventDefault();
      setOpenItem(childNode.path);
    }
  };

  const createSubpath = (pathArr: string[]) =>
    pathArr.reduce((acc: string[], str, i) => {
      if (i > 0) acc.push(acc[i - 1] + '\\' + str);
      else acc.push(str);
      return acc;
    }, []);

  useEffect(() => {
    const menu = globaleState.menu;
    const pathArr = pathname.replace(/\//g, '\\').split('\\');
    const [, ...subpath] = pathArr;
    const menuItems = [...createSubpath(subpath)];
    // set active path
    const activePath = menuItems[menuItems.length - 1];
    setGlobalState(ACTION.SET_ACTIVE_PATH, activePath);
    if (!menu.length) {
      const updatedMenu = [...menu, pathArr[1]];
      setGlobalState(ACTION.SET_MENU, updatedMenu);
    } else {
      setGlobalState(ACTION.SET_MENU, [pathArr[1]]);
    }
    // set sub menu
    setGlobalState(ACTION.SET_MENU_ITEMS, menuItems);
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

  useEffect(() => {
    if (isMobileOrTablet()) {
      setGlobalState(ACTION.SET_IS_MENU_OPEN, false);
    }
  }, []);

  const styles = useStyles();
  if (!globaleState.menuData?.children) return null;

  // Build filtered menu tree when filters are active
  const filteredMenuData = (() => {
    if (!matchingSlugs) return globaleState.menuData;
    const filterChildren = (node: any): any => {
      if (!node.children) return node;
      const filtered = node.children
        .map((child: any) => {
          if (child.children && child.children.length > 0) {
            return filterChildren(child);
          }
          // Leaf scenario node — check if its name (slug) is in the matching set
          return matchingSlugs.has(child.name) ? child : null;
        })
        .filter(Boolean);
      return { ...node, children: filtered };
    };
    return filterChildren(globaleState.menuData);
  })();

  return (
    <aside className={styles.sideMenuWrapper}>
      <div
        className={mergeClasses(
          styles.sideMenu,
          !isMenuOpen && styles.sideMenuClose
        )}
      >
        <div className={styles.menuContainer}>
          <SidebarFilters onApply={handleApplyFilters} />
          <Menu
            tree={filteredMenuData}
            openItems={globaleState.menu}
            onToggle={handleToggle}
            onMenuItemClick={onMenuItemClick}
            menuOpenItems={menuOpenItems}
            activePath={globaleState.activePath}
          />
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
