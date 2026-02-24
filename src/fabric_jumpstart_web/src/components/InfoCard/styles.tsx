import { makeStyles, tokens } from '@fluentui/react-components';
import { device } from '@styles/breakpoint';

export const useStyles = makeStyles({
  infoCardLabel: {
    fontSize: tokens.fontSizeBase400,
    marginBottom: '8px',
  },
  infoCardTitle: {
    fontSize: tokens.fontSizeBase600,
    lineHeight: tokens.lineHeightBase600,
    fontWeight: tokens.fontWeightBold,
    marginBottom: '12px',
  },
});
