import { makeStyles, tokens } from '@fluentui/react-components';
import { device } from '@styles/breakpoint';
import spacingToken from '@styles/spacing';

export const useStyles = makeStyles({
  pageContainer: {
    padding: '0% 3%',
    [device.mobileAndTablet]: {
      padding: spacingToken.spacing0,
    },
    marginTop: '120px',
    [device.desktop]: {
      maxWidth: '960px',
      marginLeft: 'auto',
      marginRight: 'auto',
    },
  },
  mainPageContainer: {
    padding: '0% 8%',
    [device.mobileAndTablet]: {
      padding: spacingToken.spacing0,
    },
  },
  fullView: {
    padding: '0px 150px 50px',
    [device.mobileAndTablet]: {
      padding: spacingToken.spacing0,
    },
  },
  markDownContainer: {
    borderRadius: '10px',
    border: `1px solid ${tokens.colorPaletteSteelBorderActive}`,
    background: tokens.colorNeutralForeground3,
    padding: `${spacingToken.spacing32} ${spacingToken.spacing50}`,
    minHeight: '80%',
    color: tokens.colorNeutralForeground1,
    fontFamily: tokens.fontFamilyBase,
    fontSize: tokens.fontSizeBase400,
    lineHeight: tokens.lineHeightBase400,
    letterSpacing: '0.48px',

    [device.mobileAndTablet]: {
      margin: spacingToken.spacing20,
      padding: spacingToken.spacing20,
    },
    [device.desktop]: {
      maxWidth: '959px',
    },
  },

  markdownView: {
    '& h1': {
      color: tokens.colorNeutralForeground1,
      fontSize: tokens.fontSizeHero800,
      fontWeight: tokens.fontWeightBold,
      lineHeight: tokens.lineHeightHero800,
      letterSpacing: '-0.305px',
    },

    '& h3': {
      margin: `${spacingToken.spacing20} ${spacingToken.spacing0}`,
    },

    '& p': {
      margin: `${spacingToken.spacing16} ${spacingToken.spacing0}`,
      '& a': {
        fontWeight: tokens.fontWeightSemibold,
      },
    },

    '& ul': {
      paddingLeft: spacingToken.spacing40,
      margin: `${spacingToken.spacing16} ${spacingToken.spacing0}`,
      [device.mobile]: {
        paddingLeft: '4%',
      },
    },

    '& li > em > code': {
      color: tokens.colorPaletteDarkOrangeForeground1,
    },

    '& pre': {
      maxWidth: '100%',
      textWrap: 'balance',
    },
    '& code': {
      overflowWrap: 'anywhere',
      whiteSpace: 'pre-wrap !important', // This is important to keep the code block from overflowing
    },
  },

  faqContainer: {
    border: 0,
    background: 'none',
  },
  horizontalScrollableTableWapper: {
    [device.mobile]: {
      width: '100vw',
    },
  },
});
