import { makeStyles, tokens } from '@fluentui/react-components';
import { device } from '@styles/breakpoint';

export const useStyles = makeStyles({
  exploreSection: {
    padding: '2% 8%',
  },
  exploreWrapper: {
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: '20px',
    padding: '4% 2%',
    [device.mobileAndTablet]: {
      padding: '4% 0%',
    },
    [device.mobile]: {
      gap: '20px',
    },
  },
  exploreLabel: {
    fontSize: tokens.fontSizeBase400,
  },
  exploreTitle: {
    fontSize: tokens.fontSizeBase600,
    lineHeight: tokens.lineHeightBase600,
    fontWeight: tokens.fontWeightBold,
  },
});
