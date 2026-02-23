'use client';
import React from 'react';
import Link from 'next/link';
import {
  makeStyles,
  tokens,
  shorthands,
} from '@fluentui/react-components';
import { EXTERNAL_URL } from '@config/urlconfig';
import { device } from '@styles/breakpoint';

const useStyles = makeStyles({
  footer: {
    backgroundColor: tokens.colorNeutralBackground1,
    borderTopWidth: '1px',
    borderTopStyle: 'solid',
    borderTopColor: tokens.colorNeutralStroke1,
    ...shorthands.padding('40px', '5%', '24px'),
  },
  navSection: {
    display: 'flex',
    flexWrap: 'wrap',
    ...shorthands.gap('48px'),
    marginBottom: '40px',
    [device.mobile]: {
      flexDirection: 'column',
      ...shorthands.gap('24px'),
    },
  },
  navColumn: {
    minWidth: '160px',
  },
  columnHeading: {
    fontSize: '14px',
    fontWeight: 600,
    color: tokens.colorNeutralForegroundInvertedLink,
    marginBottom: '12px',
    marginTop: '0',
  },
  columnList: {
    listStyle: 'none',
    ...shorthands.padding('0'),
    ...shorthands.margin('0'),
  },
  columnLink: {
    display: 'block',
    fontSize: '13px',
    color: tokens.colorNeutralForegroundInvertedLink,
    textDecoration: 'none',
    ...shorthands.padding('4px', '0'),
    opacity: 0.75,
    ':hover': {
      opacity: 1,
      textDecoration: 'underline',
    },
  },
  bottomBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    ...shorthands.gap('16px'),
    borderTopWidth: '1px',
    borderTopStyle: 'solid',
    borderTopColor: tokens.colorNeutralStroke1,
    paddingTop: '16px',
  },
  bottomLinks: {
    display: 'flex',
    flexWrap: 'wrap',
    ...shorthands.gap('16px'),
  },
  bottomLink: {
    fontSize: '12px',
    color: tokens.colorNeutralForegroundInvertedLink,
    textDecoration: 'none',
    opacity: 0.6,
    ':hover': {
      opacity: 1,
      textDecoration: 'underline',
    },
  },
  copyright: {
    fontSize: '12px',
    color: tokens.colorNeutralForegroundInvertedLink,
    opacity: 0.6,
  },
  msLogo: {
    height: '20px',
    opacity: 0.7,
  },
});

const Footer: React.FC = () => {
  const styles = useStyles();

  return (
    <footer className={styles.footer}>
      <div className={styles.navSection}>
        <div className={styles.navColumn}>
          <h4 className={styles.columnHeading}>Fabric Jumpstart</h4>
          <ul className={styles.columnList}>
            <li>
              <Link href="/" className={styles.columnLink}>
                Home
              </Link>
            </li>
            <li>
              <Link href="/fabric_jumpstart" className={styles.columnLink}>
                Scenarios
              </Link>
            </li>
            <li>
              <a
                href={EXTERNAL_URL.PYPI}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.columnLink}
              >
                PyPI Package
              </a>
            </li>
          </ul>
        </div>

        <div className={styles.navColumn}>
          <h4 className={styles.columnHeading}>Developer</h4>
          <ul className={styles.columnList}>
            <li>
              <a
                href={EXTERNAL_URL.GITHUB_REPO}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.columnLink}
              >
                GitHub
              </a>
            </li>
            <li>
              <a
                href={`${EXTERNAL_URL.GITHUB_REPO}/discussions`}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.columnLink}
              >
                Community
              </a>
            </li>
            <li>
              <a
                href={`${EXTERNAL_URL.GITHUB_REPO}/issues`}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.columnLink}
              >
                Issues
              </a>
            </li>
          </ul>
        </div>

        <div className={styles.navColumn}>
          <h4 className={styles.columnHeading}>Microsoft</h4>
          <ul className={styles.columnList}>
            <li>
              <a
                href={EXTERNAL_URL.MICROSOFT}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.columnLink}
              >
                Microsoft Fabric
              </a>
            </li>
            <li>
              <a
                href="https://learn.microsoft.com/en-us/fabric/"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.columnLink}
              >
                Documentation
              </a>
            </li>
            <li>
              <a
                href="https://www.microsoft.com/en-us/privacy/privacystatement"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.columnLink}
              >
                Privacy
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className={styles.bottomBar}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://img-prod-cms-rt-microsoft-com.akamaized.net/cms/api/am/imageFileData/RE1Mu3b?ver=5c31"
          alt="Microsoft"
          className={styles.msLogo}
        />
        <div className={styles.bottomLinks}>
          <a
            href="https://www.microsoft.com/en-us/privacy/privacystatement"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.bottomLink}
          >
            Privacy
          </a>
          <a
            href="https://go.microsoft.com/fwlink/?LinkID=206977"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.bottomLink}
          >
            Terms of Use
          </a>
          <a
            href="https://www.microsoft.com/en-us/legal/intellectualproperty/Trademarks/"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.bottomLink}
          >
            Trademarks
          </a>
          <span className={styles.copyright}>
            © {new Date().getFullYear()} Microsoft
          </span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
