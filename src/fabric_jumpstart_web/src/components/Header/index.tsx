'use client';
import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import {
  makeStyles,
  tokens,
  shorthands,
  Button,
  Divider,
  mergeClasses,
} from '@fluentui/react-components';
import { Search16Regular } from '@fluentui/react-icons';
import { EXTERNAL_URL, INTERNAL_ROUTE } from '@config/urlconfig';
import Icon from '@components/Icon';
import ThemeToggleButton from '@components/ThemeToggle';
import Typography from '@components/Typography';
import MSLogoRegular from '@images/ms-logo-regular.svg';
import MSLogoLightRegular from '@images/ms-logo-light-regular.svg';
import GithubRegular from '@images/github-regular.svg';
import GithubLightRegular from '@images/github-light-regular.svg';
import PythonLogoDark from '@images/python-logo-dark.svg';
import PythonLogoLight from '@images/python-logo-light.svg';
import scenariosData from '@data/scenarios.json';
import { device } from '@styles/breakpoint';
import spacingToken from '@styles/spacing';

const useStyles = makeStyles({
  headerTopbarWrapper: {
    position: 'fixed',
    top: '0',
    zIndex: 2,
    width: '100%',
    [device.mobileAndTablet]: {
      display: 'none',
    },
  },
  header: {
    width: '100%',
    position: 'relative',
    boxShadow: `4px 0px 20px 0px ${tokens.shadow64Brand}`,
  },
  headerContainer: {
    minHeight: '48px',
    height: 'auto',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    display: 'flex',
    backgroundColor: tokens.colorNeutralBackground4,
    ...shorthands.padding(spacingToken.spacing0, spacingToken.spacing44),
    [device.smallLaptop]: {
      ...shorthands.padding(spacingToken.spacing0, spacingToken.spacing12),
    },
  },
  leadingButtons: {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignContent: 'center',
    alignItems: 'center',
  },
  tailingButtons: {
    display: 'flex',
    alignItems: 'center',
  },

  // Microsoft + Jumpstart logo
  logoContainer: {
    display: 'inline-flex',
    width: 'auto',
    height: '23px',
  },
  microsoftButton: {
    backgroundColor: 'transparent',
    ...shorthands.borderColor('transparent'),
    ':hover': {
      backgroundColor: 'transparent',
      ...shorthands.borderColor('transparent'),
    },
    ':hover:active': {
      backgroundColor: 'transparent',
      ...shorthands.borderColor('transparent'),
    },
  },
  jumpstartButton: {
    backgroundColor: 'transparent',
    ...shorthands.borderColor('transparent'),
    ':hover': {
      backgroundColor: 'transparent',
      ...shorthands.borderColor('transparent'),
    },
    ':hover:active': {
      backgroundColor: 'transparent',
      ...shorthands.borderColor('transparent'),
    },
    [device.smallLaptop]: {
      ...shorthands.padding(spacingToken.spacing0, spacingToken.spacing5),
      fontSize: tokens.fontSizeBase200,
    },
  },
  jumpstartText: {
    fontWeight: tokens.fontWeightSemibold,
    letterSpacing: '0.03em',
    fontSize: tokens.fontSizeBase300,
    backgroundColor: tokens.colorNeutralBackground4,
  },

  // Nav buttons
  navButton: {
    height: '48px',
    ...shorthands.padding(spacingToken.spacing0, spacingToken.spacing10),
    fontWeight: '400',
    ...shorthands.border('none'),
    ':hover': {
      backgroundColor: tokens.colorNeutralBackground4Hover,
      ...shorthands.border('none'),
    },
    [device.smallLaptop]: {
      ...shorthands.padding(spacingToken.spacing0, spacingToken.spacing2),
      fontSize: tokens.fontSizeBase200,
    },
  },
  navButtonSelected: {
    backgroundColor: tokens.colorNeutralBackground2Selected,
  },
  navButtonUnselected: {
    backgroundColor: 'transparent',
  },

  // Search overlay
  searchBoxContainer: {
    zIndex: 3,
    display: 'inline-flex',
    width: '100%',
    backgroundColor: tokens.colorNeutralBackground2Selected,
    ...shorthands.padding(
      spacingToken.spacing20,
      spacingToken.spacing24,
      spacingToken.spacing50,
      spacingToken.spacing36
    ),
    position: 'absolute',
    boxSizing: 'border-box',
  },
  searchBar: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('10px'),
    ...shorthands.padding('8px', '16px'),
    ...shorthands.borderRadius('8px'),
    backgroundColor: tokens.colorNeutralBackground1,
    ...shorthands.border('1px', 'solid', tokens.colorNeutralStroke1),
    width: '100%',
    maxWidth: '600px',
  },
  searchInput: {
    ...shorthands.border('none'),
    backgroundColor: 'transparent',
    outline: 'none',
    fontSize: tokens.fontSizeBase300,
    color: tokens.colorNeutralForeground1,
    width: '100%',
  },
  searchResults: {
    marginTop: '16px',
  },
  searchResultItem: {
    display: 'block',
    ...shorthands.padding('8px', '12px'),
    ...shorthands.borderRadius('4px'),
    textDecoration: 'none',
    color: tokens.colorNeutralForeground1,
    fontSize: tokens.fontSizeBase300,
    ':hover': {
      backgroundColor: tokens.colorNeutralBackground1Hover,
    },
  },
  suggestedLabel: {
    fontSize: tokens.fontSizeBase200,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground3,
    marginTop: '12px',
    marginBottom: '4px',
  },

  // PyPI pill
  pypiButton: {
    height: '48px',
    ...shorthands.padding(spacingToken.spacing0, spacingToken.spacing10),
    fontWeight: '400',
    ...shorthands.border('none'),
    backgroundColor: 'transparent',
    ':hover': {
      backgroundColor: tokens.colorNeutralBackground4Hover,
      ...shorthands.border('none'),
    },
  },
});

interface SearchResult {
  title: string;
  slug: string;
}

const Header: React.FC = () => {
  const styles = useStyles();
  const ref = useRef<HTMLDivElement>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);

  const scenarios = useMemo(
    () =>
      (scenariosData as any[]).map((s) => ({
        title: s.title as string,
        slug: s.slug as string,
      })),
    []
  );

  const handleSearch = useCallback(
    (text: string) => {
      setSearchText(text);
      if (!text.trim()) {
        setSearchResults(scenarios.slice(0, 5));
        return;
      }
      const lower = text.toLowerCase();
      setSearchResults(
        scenarios.filter((s) => s.title.toLowerCase().includes(lower))
      );
    },
    [scenarios]
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setSearchOpen(false);
      }
    };
    const handleEsc = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') setSearchOpen(false);
    };
    document.addEventListener('click', handleClickOutside);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('click', handleClickOutside);
      document.removeEventListener('keydown', handleEsc);
    };
  }, []);

  useEffect(() => {
    if (searchOpen) {
      handleSearch('');
    }
  }, [searchOpen, handleSearch]);

  return (
    <div className={styles.headerTopbarWrapper}>
      <header ref={ref} className={styles.header}>
        <div className={styles.headerContainer}>
          {/* Leading: Microsoft logo | Fabric Jumpstart | Scenarios */}
          <div className={styles.leadingButtons}>
            <div className={styles.logoContainer}>
              <Button
                className={styles.microsoftButton}
                onClick={() =>
                  window.open(EXTERNAL_URL.MICROSOFT, '_blank')
                }
              >
                <Icon
                  alt="Microsoft logo"
                  darkThemeIcon={MSLogoRegular}
                  lightThemeIcon={MSLogoLightRegular}
                />
              </Button>
              <Divider vertical />
              <Button
                className={styles.jumpstartButton}
                onClick={() =>
                  (window.location.href = INTERNAL_ROUTE.OVERVIEW)
                }
              >
                <Typography
                  text="Fabric Jumpstart"
                  type="custom"
                  className={styles.jumpstartText}
                />
              </Button>
            </div>
            <Button
              className={mergeClasses(
                styles.navButton,
                styles.navButtonUnselected
              )}
              onClick={() =>
                (window.location.href = INTERNAL_ROUTE.SCENARIOS)
              }
            >
              Scenarios
            </Button>
          </div>

          {/* Trailing: Search | GitHub | PyPI | ThemeToggle */}
          <div className={styles.tailingButtons}>
            <Button
              className={mergeClasses(
                styles.navButton,
                searchOpen
                  ? styles.navButtonSelected
                  : styles.navButtonUnselected
              )}
              icon={<Search16Regular />}
              onClick={() => setSearchOpen(!searchOpen)}
            >
              Search
            </Button>
            <Button
              className={mergeClasses(
                styles.navButton,
                styles.navButtonUnselected
              )}
              icon={
                <Icon
                  alt="GitHub"
                  darkThemeIcon={GithubRegular}
                  lightThemeIcon={GithubLightRegular}
                  height={16}
                  width={16}
                />
              }
              onClick={() =>
                window.open(EXTERNAL_URL.GITHUB_REPO, '_blank')
              }
            />
            <Button
              className={mergeClasses(
                styles.pypiButton
              )}
              icon={
                <Icon
                  alt="PyPI"
                  darkThemeIcon={PythonLogoDark}
                  lightThemeIcon={PythonLogoLight}
                  height={16}
                  width={16}
                />
              }
              onClick={() =>
                window.open(EXTERNAL_URL.PYPI, '_blank')
              }
            />
            <ThemeToggleButton alt="Toggle dark/light theme" />
          </div>
        </div>

        {/* Search expanded panel */}
        {searchOpen && (
          <div className={styles.searchBoxContainer}>
            <div style={{ width: '100%', maxWidth: '600px' }}>
              <div className={styles.searchBar}>
                <Search16Regular />
                <input
                  placeholder="Search scenarios..."
                  className={styles.searchInput}
                  value={searchText}
                  onChange={(e) => handleSearch(e.target.value)}
                  autoFocus
                />
              </div>
              <div className={styles.searchResults}>
                <p className={styles.suggestedLabel}>
                  {searchText.trim() ? 'Results' : 'Quick links'}
                </p>
                {searchResults.map((r) => (
                  <Link
                    key={r.slug}
                    href={`/fabric_jumpstart/${r.slug}/`}
                    className={styles.searchResultItem}
                    onClick={() => setSearchOpen(false)}
                  >
                    {r.title}
                  </Link>
                ))}
                {searchResults.length === 0 && (
                  <p style={{ fontSize: '14px', color: tokens.colorNeutralForeground3 }}>
                    No results found.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </header>
    </div>
  );
};

export default Header;
