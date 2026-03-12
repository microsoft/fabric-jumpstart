import { makeStyles, tokens } from '@fluentui/react-components';
import { device } from '@styles/breakpoint';
import spacingToken from '@styles/spacing';

export const useStyles = makeStyles({
  bannerContainer: {
    display: 'flex',
    marginBottom: spacingToken.spacing50,
    justifyContent: 'flex-start',
    gap: '40px',
    alignItems: 'flex-start',
    padding: '160px 8.5% 48px',
    boxSizing: 'border-box',
    [device.mobileAndTablet]: {
      padding: '20px 5% 32px',
      flexDirection: 'column-reverse',
      alignItems: 'center',
    },
  },
  containerWithBottomSpace: {
    marginBottom: `calc(${spacingToken.spacing50}*4)`,
  },
  textContainer: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    maxWidth: '48%',
    minWidth: '48%',
    marginRight: spacingToken.spacing0,
    overflow: 'hidden',
    [device.mobileAndTablet]: {
      marginRight: spacingToken.spacing0,
      maxWidth: '100%',
      minWidth: '100%',
    },
  },
  imageContainer: {
    display: 'flex',
    justifyContent: 'center',
    transition: 'width 0.3s ease',
    maxWidth: '650px',
    maxHeight: '650px',
    [device.mobileAndTablet]: {
      maxWidth: '400px',
      maxHeight: '400px',
    },
  },
  headingContainer: {
    display: 'inline',
    paddingBottom: spacingToken.spacing8,
    '& h1': {
      marginRight: spacingToken.spacing8,
      display: 'inline',
    },
  },
  scenariosHeading: {
    color: tokens.colorPaletteRoyalBlueForeground2,
  },
  agoraHeading: {
    color: tokens.colorPaletteGreenForeground1,
  },
  arcboxHeading: {
    color: tokens.colorPaletteBerryForeground1,
  },
  hciboxHeading: {
    color: tokens.colorPaletteRoyalBlueForeground2,
  },
  dropsHeading: {
    color: tokens.colorPaletteLightTealBackground2,
  },
  gemsHeading: {
    color: tokens.colorPaletteRedBackground1,
  },
  badgesHeading: {
    background: 'linear-gradient(to right, #C03BC4, #0078D4)',
    WebkitBackgroundClip: 'text !important',
    WebkitTextFillColor: 'transparent',
  },
  moduleTextContainer: {
    marginTop: '30%',
  },

  contributeTextContainer: {
    minWidth: '45%',
    [device.mobile]: {
      maxWidth: '85%',
    },
  },
  scenariosTextContainer: {
    marginTop: '0',
    maxWidth: '100%',
    [device.mobile]: {
      maxWidth: '98%',
    },
  },
  agoraTextContainer: {
    [device.mobile]: {
      maxWidth: '90%',
    },
  },
  faqTextContainer: {
    [device.mobile]: {
      maxWidth: '80%',
    },
  },
  contributeImageContainer: {},

  image: {
    maxWidth: '100%',
    height: 'auto',
    objectFit: 'contain',
    [device.mobileAndTablet]: {
      maxWidth: '100%',
    },
  },
  desc: {
    maxWidth: '100%',
    [device.mobileAndTablet]: {
      maxWidth: '100%',
    },
  },
  dropsTextContainer: {
    marginTop: '15%',
    maxWidth: '100%',
    [device.mobile]: {
      maxWidth: '90%',
    },
  },
  scenariosImgContainer: {
    width: '20%',
    maxWidth: '380px',
    maxHeight: '380px',
    marginTop: '-3%',
    [device.mobileAndTablet]: {
      display: 'none',
    },
  },
  scenariosBannerContainer: {
    padding: '160px 8.5% 48px',
    marginBottom: spacingToken.spacing10,
    [device.mobileAndTablet]: {
      padding: '80px 5% 32px',
      flexDirection: 'row',
    },
  },
  dropsImgContainer: {
    width: '25%',
    marginTop: '10%',
    [device.mobileAndTablet]: {
      width: '90%',
      marginTop: '15%',
    },
  },
  missionTextContainer: {
    marginRight: spacingToken.spacing0,
    minWidth: '43%',
    marginTop: '25%',
    [device.mobile]: {
      maxWidth: '80%',
    },
  },
  aboutBannerContainer: {
    marginTop: '50px',
    justifyContent: 'normal',
    '& img': {
      [device.desktop]: {
        width: '530px',
      },
    },
  },
  aboutTextContainer: {
    marginRight: '50px',
    marginTop: '15%',
  },
  documentationImgContainer: {
    [device.mobile]: {
      maxWidth: '100%',
    },
  },
  contributeImgContainer: {
    [device.mobile]: {
      maxWidth: '100%',
    },
  },
  agoraImgContainer: {
    [device.mobile]: {
      maxWidth: '90%',
    },
  },
  marginRightText: {
    marginRight: spacingToken.spacing8,
  },
});
