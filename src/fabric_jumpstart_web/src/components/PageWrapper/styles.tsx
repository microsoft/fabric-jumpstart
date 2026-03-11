import { tokens, makeStyles } from '@fluentui/react-components';
import spacingToken from '@styles/spacing';
import { device } from '@styles/breakpoint';

export const useStyles = makeStyles({
  wrapper: {
    backgroundColor: tokens.colorNeutralBackground1,
    display: 'flex',
    height: '100%',
    justifyContent: 'center',
    maxWidth: '100%',
  },
  container: {
    width: '100%',
    height: '100%',
    backgroundColor: 'transparent',
    paddingTop: '10px',
  },
});
