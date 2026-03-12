import { makeStyles, shorthands, tokens } from '@fluentui/react-components';
import { device } from '@styles/breakpoint';
import spacingToken from '@styles/spacing';

// Fixed gradient colors so the button looks identical in light and dark mode
const gradientStart = '#117865'; // green
const gradientEnd = '#0078d4';   // blue
// Hover: same gradient, uniformly darkened (light mode) or lightened (dark mode)
const darkerStart = '#0d5e50';
const darkerEnd = '#0060aa';
const lighterStart = '#1a9a82';
const lighterEnd = '#1a92e8';

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
    background: `linear-gradient(90deg, ${gradientStart} 0%, ${gradientEnd} 100%)`,
    ...shorthands.borderColor('transparent'),
    ':hover': {
      background: `linear-gradient(90deg, ${lighterStart} 0%, ${lighterEnd} 100%)`,
      ...shorthands.borderColor('transparent'),
    },
    ':hover:active': {
      background: `linear-gradient(90deg, ${lighterStart} 0%, ${lighterEnd} 100%)`,
      ...shorthands.borderColor('transparent'),
    },
  },
  primaryBtnLightMode: {
    ':hover': {
      background: `linear-gradient(90deg, ${darkerStart} 0%, ${darkerEnd} 100%)`,
    },
    ':hover:active': {
      background: `linear-gradient(90deg, ${darkerStart} 0%, ${darkerEnd} 100%)`,
    },
  },
});
