'use client';
import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { makeStyles, tokens, shorthands } from '@fluentui/react-components';
import { EXTERNAL_URL, INTERNAL_ROUTE } from '@config/urlconfig';
import Logo from '@images/logo.jpg';

const useStyles = makeStyles({
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...shorthands.padding('12px', '32px'),
    backgroundColor: tokens.colorNeutralBackground1,
    ...shorthands.borderBottom('1px', 'solid', tokens.colorNeutralStroke1),
    position: 'sticky',
    top: '0',
    zIndex: 1000,
  },
  logoSection: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('12px'),
    textDecoration: 'none',
    color: tokens.colorNeutralForeground1,
  },
  logoText: {
    fontSize: '18px',
    fontWeight: 700,
  },
  nav: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('24px'),
  },
  navLink: {
    fontSize: '14px',
    fontWeight: 500,
    color: tokens.colorNeutralForeground2,
    textDecoration: 'none',
    ':hover': {
      color: tokens.colorBrandForeground1,
    },
  },
  githubLink: {
    fontSize: '14px',
    fontWeight: 500,
    color: tokens.colorNeutralForeground1,
    textDecoration: 'none',
    ...shorthands.padding('6px', '12px'),
    ...shorthands.borderRadius('6px'),
    backgroundColor: tokens.colorNeutralBackground3,
    ':hover': {
      backgroundColor: tokens.colorNeutralBackground3Hover,
    },
  },
});

const Header: React.FC = () => {
  const styles = useStyles();

  return (
    <header className={styles.header}>
      <Link href={INTERNAL_ROUTE.OVERVIEW} className={styles.logoSection}>
        <Image src={Logo} alt="Fabric Jumpstart" width={32} height={32} style={{ borderRadius: '4px' }} />
        <span className={styles.logoText}>Fabric Jumpstart</span>
      </Link>
      <nav className={styles.nav}>
        <Link href={INTERNAL_ROUTE.SCENARIOS} className={styles.navLink}>
          Scenarios
        </Link>
        <a
          href={EXTERNAL_URL.PYPI}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.navLink}
        >
          PyPI
        </a>
        <a
          href={EXTERNAL_URL.GITHUB_REPO}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.githubLink}
        >
          ⭐ GitHub
        </a>
      </nav>
    </header>
  );
};

export default Header;
