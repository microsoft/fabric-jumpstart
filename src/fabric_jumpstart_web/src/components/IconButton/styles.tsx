import { makeStyles, tokens } from '@fluentui/react-components';
import spacingToken from '@styles/spacing';

export const useStyles = makeStyles({
  iconButton: {
    border: 0,
    background: 'none',
    fontSize: tokens.fontSizeBase300,
    padding: spacingToken.spacing4,
    '& svg': {
      height: '16px',
    },
  },

  iconButtonNoLabel: {
    padding: '6px',
    maxWidth: '28px',
    '& svg': {
      height: '18px',
    },
  },
});
