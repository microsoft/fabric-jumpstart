import { makeStyles, tokens } from '@fluentui/react-components';
import spacingToken from '@styles/spacing';

export const useStyles = makeStyles({
  codeBlockContainer: {
    marginTop: spacingToken.spacing10,
    border: `1px solid ${tokens.colorNeutralStroke1}`,
    borderRadius: '8px',
    overflow: 'hidden',
    marginBottom: spacingToken.spacing30,

    '& code': {
      backgroundColor: 'transparent !important',
    },
    '& code[class*="language-"]': {
      backgroundColor: 'transparent !important',
    },
  },
  codeBlockHeader: {
    backgroundColor: tokens.colorNeutralBackground4,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: `${spacingToken.spacing2} ${spacingToken.spacing10}`,
    marginBottom: '-8px',
  },
  codeBlockBody: {
    position: 'relative',
    marginTop: spacingToken.spacing8,
  },
  copyCodeSuccessfullyToast: {
    position: 'absolute',
    right: '0',
    top: '-2px',
  },
});
