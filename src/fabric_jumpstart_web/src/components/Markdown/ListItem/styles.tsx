import { makeStyles } from '@fluentui/react-components';
import { device } from '@styles/breakpoint';

export const useStyles = makeStyles({
  listItem: {
    [device.mobile]: {
      wordBreak: 'break-word',
    },
  },
});
