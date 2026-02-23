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
    borderLeftColor: tokens.colorPaletteMinkBackground2,
    ':hover': {
      borderLeftColor: tokens.colorBrandBackgroundHover,
      background: `linear-gradient(90deg, ${tokens.colorBrandBackgroundHover} 0%, ${tokens.colorBrandBackground2} 72.81%, ${tokens.colorBrandBackground2Hover} 100%)`,
    },
  },
  primaryBtnLightMode: {
    background: `linear-gradient(90deg, ${tokens.colorBrandBackgroundHover} 0%, ${tokens.colorBrandBackground2} 72.81%,  ${tokens.colorBrandBackground2Hover} 100%)`,
    borderLeftColor: tokens.colorPaletteMinkBackground2,
    ':hover': {
      borderLeftColor: tokens.colorBrandBackground,
      background: `linear-gradient(90deg, ${tokens.colorBrandBackground} 0%, ${tokens.colorPaletteBlueBorderActive} 100%)`,
    },
  },
});
