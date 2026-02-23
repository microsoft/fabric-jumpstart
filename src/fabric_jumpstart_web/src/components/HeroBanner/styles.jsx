import { makeStyles, tokens } from '@fluentui/react-components';
import { device } from '@styles/breakpoint';
import spacingToken from '@styles/spacing';

export const useStyles = makeStyles({
  bannerContainer: {
    display: 'flex',
    marginBottom: spacingToken.spacing50,
    justifyContent: 'space-between',
    padding: '4% 8.5%',
    boxSizing: 'border-box',
    [device.mobileAndTablet]: {
      padding: `${spacingToken.spacing50} ${spacingToken.spacing0}`,
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
    marginRight: `calc(${spacingToken.spacing50} + ${spacingToken.spacing30})`,
    [device.mobileAndTablet]: {
      marginRight: spacingToken.spacing0,
      width: 'auto',
      maxWidth: '100%',
      minWidth: 'auto',
      marginTop: `calc(${spacingToken.spacing50} + ${spacingToken.spacing40})`,
    },
    [device.tablet]: {
      padding: `${spacingToken.spacing0} calc(${spacingToken.spacing50} + ${spacingToken.spacing30})`,
    },
    [device.mobile]: {
      maxWidth: '100%',
      marginRight: spacingToken.spacing10,
      marginLeft: spacingToken.spacing10,
    },
  },
  imageContainer: {
    display: 'flex',
    justifyContent: 'center',
    transition: 'width 0.3s ease',
    [device.mobile]: {
      width: '95%',
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
    color: tokens.colorPaletteRedForeground1,
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
    minWidth: '75%',
    maxWidth: '60%',
    [device.mobileAndTablet]: {
      minWidth: '100%',
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
    [device.mobile]: {
      maxWidth: '90%',
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
