'use client';
import React from 'react';
import { makeStyles, tokens } from '@fluentui/react-components';
import { device } from '@styles/breakpoint';

const useStyles = makeStyles({
  footerWrapper: {
    '& .context-uhf': {
      backgroundColor: `${tokens.colorNeutralBackground1} !important`,
    },
    '& .c-uhff-base': {
      backgroundColor: `${tokens.colorNeutralBackground1} !important`,
      color: `${tokens.colorNeutralForegroundInvertedLink} !important`,
    },
    '& .c-uhff-link': {
      color: `${tokens.colorNeutralForegroundInvertedLink} !important`,
    },
    '& .c-uhff-nav': {
      color: `${tokens.colorNeutralForegroundInvertedLink} !important`,
      [device.desktop]: {
        display: 'flex',
      },
    },
    '& .c-heading-4': {
      color: `${tokens.colorNeutralForegroundInvertedLink} !important`,
    },
    '& ul.c-list li:last-child': {
      color: `${tokens.colorNeutralForegroundInvertedLink} !important`,
    },
    '& .c-uhff-nav .c-uhff-nav-row': {
      [device.desktop]: {
        display: 'flex',
        justifyContent: 'space-around',
        width: '100%',
      },
    },
    '& .c-uhff-nav .c-uhff-nav-row:nth-child(1)': {
      [device.desktop]: {
        flex: 6,
      },
    },
    '& .c-uhff-nav .c-uhff-nav-row:nth-child(2)': {
      [device.desktop]: {
        flex: 4,
      },
    },
    '& .c-uhff-nav .c-uhff-nav-row div': {
      [device.desktop]: {
        width: '33%',
      },
    },
    '& .c-uhff-nav .c-uhff-nav-row .c-uhff-nav-group .c-heading-4': {
      [device.desktop]: {
        width: '100%',
      },
    },
  },
});

export interface UhfData {
  cssIncludes: string;
  javascriptIncludes: string;
  footerHtml: string;
}

const Footer: React.FC<{ uhfData: UhfData }> = ({ uhfData }) => {
  const styles = useStyles();

  if (!uhfData?.footerHtml) return null;

  return (
    <footer className={styles.footerWrapper}>
      <div
        dangerouslySetInnerHTML={{
          __html: `${uhfData.footerHtml} ${uhfData.javascriptIncludes}`,
        }}
      />
    </footer>
  );
};

export default Footer;
