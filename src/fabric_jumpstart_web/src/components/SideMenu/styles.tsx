import { makeStyles, tokens } from '@fluentui/react-components';
import { device } from '@styles/breakpoint';
import spacingToken from '@styles/spacing';

export const useStyles = makeStyles({
  sideMenuWrapper: {
    height: '100%',
    position: 'sticky',
    top: '175px',
    [device.mobileAndTablet]: {
      top: '120px',
      zIndex: 2,
    },
  },
  sideMenu: {
    boxShadow: `4px 0px 20px 0px ${tokens.shadow64Brand}`,
    backgroundColor: tokens.colorNeutralForeground4,
    minWidth: '330px',
    borderRadius: '4px',
    maxHeight: 'calc(100vh - 175px)',
    minHeight: 'calc(100vh - 175px)',
    overflowY: 'auto',
    '::-webkit-scrollbar': {
      display: 'none',
    },
    [device.tablet]: {
      position: 'absolute',
      left: 0,
      top: '-20px',
      maxHeight: 'calc(100dvh - 95px)',
      minHeight: 'calc(100dvh - 95px)',
    },
    [device.mobile]: {
      position: 'absolute',
      left: 0,
      top: '-20px',
      maxHeight: 'calc(100dvh - 90px)',
      minHeight: 'calc(100dvh - 90px)',
    },
    [device.smallMobile]: {
      minWidth: '265px',
    },
    [device.extraSmallMobile]: {
      minWidth: '215px',
    },
    [device.largeMobile]: {
      minWidth: '300px',
    },
  },

  menuContainer: {
    padding: spacingToken.spacing20,
    marginBottom: `calc(${spacingToken.spacing50} * 2)`,
    overflowY: 'auto',
    '::-webkit-scrollbar': {
      display: 'none',
    },
    [device.mobileAndTablet]: {
      marginBottom: spacingToken.spacing50,
      height: '100dvh',
    },
  },

  sideMenuClose: {
    display: 'none',
    transition: 'all 1s ease',
    position: 'sticky',
    right: '-330px',
    top: '90dvh',
    [device.mobileAndTablet]: {
      top: '100dvh',
    },
  },

  arrow: {
    height: '30px',
    background: tokens.colorNeutralBackground5Pressed,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    cursor: 'pointer',
    zIndex: 1,

    '& svg': {
      width: '25px',
      height: '25px',
    },

    '&:hover': {
      background: tokens.colorNeutralBackground5Hover,
    },
  },

  closeArrow: {
    width: '53px',
    height: '53px',
    borderRadius: '50%',
    position: 'absolute',
    bottom: '20px',
    right: '20px',
  },

  openArrow: {
    padding: `${spacingToken.spacing10} ${spacingToken.spacing20}`,
    position: 'fixed',
    width: '30px',
    right: '-80px',
    borderRadius: '10px 200px 200px 10px',
    left: 0,
    bottom: '75px',
    boxShadow: `4px 0px 20px 0px ${tokens.shadow64Brand}`,
  },

  footerContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    width: '100%',
    height: '100px',
    background: `linear-gradient(180deg, ${tokens.colorNeutralBackground5} 0%, ${tokens.colorNeutralBackground2} 75%)`,
    [device.mobileAndTablet]: {
      position: 'sticky',
      bottom: 0,
      left: 0,
      right: 0,
    },
  },
});
