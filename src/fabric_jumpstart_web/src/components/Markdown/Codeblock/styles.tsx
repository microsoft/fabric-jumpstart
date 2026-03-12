import { makeStyles, tokens } from '@fluentui/react-components';
import spacingToken from '@styles/spacing';

export const useStyles = makeStyles({
  codeBlockContainer: {
    marginTop: spacingToken.spacing10,
    border: `1px solid ${tokens.colorNeutralStroke1}`,
    borderRadius: '8px',
    overflow: 'hidden',

    '& code': {
      backgroundColor: 'transparent !important',
    },
    '& code[class*="language-"]': {
      backgroundColor: 'transparent !important',
    },
  },
  codeBlockHeader: {
    backgroundColor: tokens.colorNeutralBackground3,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '6px 12px',
  },
  codeBlockBody: {
    position: 'relative',
    backgroundColor: tokens.colorNeutralBackground1,

    '& pre': {
      backgroundColor: 'transparent !important',
    },
  },
  copyCodeSuccessfullyToast: {
    position: 'absolute',
    right: '0',
    top: '-2px',
  },
});
