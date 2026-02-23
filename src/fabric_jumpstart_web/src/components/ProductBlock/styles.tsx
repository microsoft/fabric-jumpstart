import { makeStyles, tokens } from '@fluentui/react-components';
import { device } from '@styles/breakpoint';
import spacingToken from '@styles/spacing';

export const useStyles = makeStyles({
  root: {
    padding: '2% 8%',
    [device.mobileAndTablet]: {
      paddingTop: 0,
    },
    [device.mobile]: {
      padding: `${spacingToken.spacing50} ${spacingToken.spacing0}`,
      width: '100%',
      marginBottom: spacingToken.spacing50,
    },
  },
  cardWrapper: {
    display: 'flex',
    flexWrap: 'wrap',
    margin: '60px 0px',
    [device.mobileAndTablet]: {
      justifyContent: 'center',
      '::after': {
        flex: 'none',
      },
    },
    [device.mobile]: {
      width: '100%',
      maxWidth: '366px',
      margin: 'auto',
    },
  },
  card: {
    border: `1px solid ${tokens.colorPaletteBeigeBorderActive}`,
    borderRadius: tokens.borderRadiusXLarge,
    color: tokens.colorNeutralForeground1,
    backgroundColor: tokens.colorNeutralBackground2,
    width: '366px',
    padding: '25px 30px',
    height: '200px',
    boxSizing: 'border-box',
    margin: '10px',
    textDecoration: 'none',
    position: 'relative',
    '&:hover': {
      backgroundColor: tokens.colorNeutralBackground2Hover,
    },
    '&:focus-visible': {
      backgroundColor: tokens.colorNeutralBackground2Hover,
    },
    [device.mobile]: {
      width: '95%',
      minHeight: '200px',
      height: 'auto',
    },
  },
  headerContainer: {
    display: 'flex',
    '& img': {
      marginTop: '2px',
      marginRight: tokens.spacingHorizontalXXS,
      marginLeft: '-8px',
    },
  },
  footerContainer: {
    display: 'flex',
    color: tokens.colorPaletteBlueForeground2,
    alignItems: 'center',
    position: 'absolute',
    bottom: '32px',
    '& h6': {
      marginBottom: tokens.spacingVerticalXS,
      marginLeft: 0,
      textTransform: 'none',
      letterSpacing: 'normal',
      fontSize: tokens.fontSizeBase400,
      fontWeight: tokens.fontWeightSemibold,
      [device.mobile]: {
        height: '10px',
      },
    },
  },
  linkText: {
    textTransform: 'none',
    letterSpacing: 'normal',
    marginLeft: '4.55px',
  },
});
