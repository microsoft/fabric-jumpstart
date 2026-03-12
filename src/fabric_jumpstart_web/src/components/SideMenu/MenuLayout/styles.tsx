import { makeStyles, tokens } from '@fluentui/react-components';
import { device } from '@styles/breakpoint';
import spacingToken from '@styles/spacing';

export const useStyles = makeStyles({
  layoutWrapper: {
    display: 'flex',
    marginTop: spacingToken.spacing0,
    height: '100%',

    '& section': {
      width: '100%',
    },
  },
});
