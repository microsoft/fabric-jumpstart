import { makeStyles, tokens } from '@fluentui/react-components';
import { device } from '@styles/breakpoint';
import spacingToken from '@styles/spacing';

export const useStyles = makeStyles({
  link: {
    textDecoration: 'none',
  },
  root: {
    border: `1px solid ${tokens.colorPaletteBeigeBorderActive}`,
    width: '260px',
    height: '421px',
    margin: '0',
    padding: `${spacingToken.spacing50} ${spacingToken.spacing20}`,
    borderRadius: tokens.borderRadiusXLarge,
    color: tokens.colorNeutralForeground1,
    boxSizing: 'border-box',
    transition: 'background-color 0.3s ease',
    backgroundColor: tokens.colorNeutralBackground2,
    '&:hover': {
      backgroundColor: tokens.colorNeutralBackground2Hover,
    },
    [device.mobile]: {
      margin: spacingToken.spacing0,
    },
  },
  wrapper: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerText: {
    color: tokens.colorPaletteBlueForeground2,
    left: '20px',
    marginTop: '40px',
    '& svg': {
      verticalAlign: 'middle',
    },
  },
  desc: {
    display: '-webkit-box',
    '-webkit-line-clamp': 6,
    '-webkit-box-orient': 'vertical',
    overflow: 'hidden',
    'text-overflow': 'ellipsis',
    lineHeight: tokens.lineHeightBase400,
    height: '132px',
  },
  subtitle: {
    marginTop: '2px',
  },
  subtitleScenarios: {
    color: tokens.colorPaletteRedForeground1,
  },
  subtitleAgora: {
    color: tokens.colorPaletteGreenForeground1,
  },
  subtitleArcbox: {
    color: tokens.colorPaletteBerryForeground1,
  },
  subtitleHcibox: {
    color: tokens.colorPaletteRoyalBlueForeground2,
  },
  subtitleDrops: {
    color: tokens.colorPaletteLightTealBackground2,
  },
  subtitleGems: {
    color: tokens.colorPaletteRedBackground1,
  },
});
