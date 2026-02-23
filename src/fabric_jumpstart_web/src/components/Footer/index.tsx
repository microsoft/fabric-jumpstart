'use client';
import React from 'react';
import { makeStyles, tokens, shorthands } from '@fluentui/react-components';
import { EXTERNAL_URL } from '@config/urlconfig';

const useStyles = makeStyles({
  footer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    ...shorthands.padding('24px', '32px'),
    backgroundColor: tokens.colorNeutralBackground3,
    ...shorthands.borderTop('1px', 'solid', tokens.colorNeutralStroke1),
    ...shorthands.gap('24px'),
    flexWrap: 'wrap',
  },
  link: {
    fontSize: '13px',
    color: tokens.colorNeutralForeground2,
    textDecoration: 'none',
    ':hover': {
      color: tokens.colorBrandForeground1,
    },
  },
  copyright: {
    fontSize: '13px',
    color: tokens.colorNeutralForeground3,
  },
});

const Footer: React.FC = () => {
  const styles = useStyles();
  return (
    <footer className={styles.footer}>
      <span className={styles.copyright}>© {new Date().getFullYear()} Microsoft</span>
      <a href={EXTERNAL_URL.MICROSOFT} target="_blank" rel="noopener noreferrer" className={styles.link}>
        Microsoft Fabric
      </a>
      <a href={EXTERNAL_URL.GITHUB_REPO} target="_blank" rel="noopener noreferrer" className={styles.link}>
        GitHub
      </a>
      <a href={EXTERNAL_URL.PYPI} target="_blank" rel="noopener noreferrer" className={styles.link}>
        PyPI
      </a>
    </footer>
  );
};

export default Footer;
