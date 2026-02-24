import { makeStyles, tokens } from '@fluentui/react-components';
import spacingToken from '@styles/spacing';

export const useStyles = makeStyles({
  copyIcon: {
    marginTop: '6px',
    cursor: 'pointer',
    position: 'relative',
  },
  toast: {
    opacity: 0,
    display: 'inline-flex',
    padding: `${spacingToken.spacing4} ${spacingToken.spacing8}`,
    flexDirection: 'column',
    alignItems: 'flex-start',
    borderRadius: '4px',
    background: tokens.colorNeutralBackgroundStatic,
    color: tokens.colorNeutralForegroundStaticInverted,
    textAlign: 'center',
    fontSize: tokens.fontSizeBase200,
    fontWeight: tokens.fontWeightSemibold,
    letterSpacing: '0.36',
    position: 'relative',
    top: '2px',
    width: 'max-content',
  },
  visibleToast: {
    opacity: 1,
  },
});
