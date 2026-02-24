import { makeStyles, tokens } from '@fluentui/react-components';
import spacingToken from '@styles/spacing';

export const useStyles = makeStyles({
  codeBlockContainer: {
    marginTop: spacingToken.spacing10,
    border: `1px solid ${tokens.colorPalettePlatinumBorderActive}`,
    borderRadius: '5px',
    overflow: 'hidden',
    marginBottom: spacingToken.spacing30,
    backgroundColor: tokens.colorNeutralBackground2Selected,

    '& pre': {
      margin: '0 !important', // Override default margin
      backgroundColor: `${tokens.colorNeutralBackground2Selected} !important`,
    },
    '& code': {
      color: `${tokens.colorNeutralForeground2} !important`,
      backgroundColor: 'transparent !important',
    },
    '& code[class*="language-"]': {
      backgroundColor: 'transparent !important',
    },
    '& pre[class*="language-"]': {
      backgroundColor: `${tokens.colorNeutralBackground2Selected} !important`,
    },
  },
  codeBlockHeader: {
    backgroundColor: tokens.colorPaletteMinkBackground2,
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
