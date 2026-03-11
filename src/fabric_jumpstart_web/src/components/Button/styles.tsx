import { makeStyles, tokens } from '@fluentui/react-components';
import { device } from '@styles/breakpoint';
import spacingToken from '@styles/spacing';

export const useStyles = makeStyles({
  btn: {
    padding: '6px 35px',
    fontSize: tokens.fontSizeBase300,
    [device.mobile]: {
      paddingRight: spacingToken.spacing4,
      paddingLeft: spacingToken.spacing4,
    },
  },
  primaryBtn: {
    background: `linear-gradient(90deg, ${tokens.colorBrandBackground} 0%, ${tokens.colorPaletteBlueBorderActive} 100%)`,
    borderLeftColor: 'transparent',
    ':hover': {
      background: `linear-gradient(90deg, ${tokens.colorBrandBackgroundHover} 0%, ${tokens.colorBrandBackground} 100%)`,
      borderLeftColor: 'transparent',
    },
  },
  primaryBtnLightMode: {
    background: `linear-gradient(90deg, ${tokens.colorBrandBackground} 0%, ${tokens.colorPaletteBlueBorderActive} 100%)`,
    borderLeftColor: 'transparent',
    ':hover': {
      background: `linear-gradient(90deg, ${tokens.colorBrandBackgroundHover} 0%, ${tokens.colorBrandBackground} 100%)`,
      borderLeftColor: 'transparent',
    },
  },
});
