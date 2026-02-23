import { makeStyles, tokens } from '@fluentui/react-components';
import spacingToken from '@styles/spacing';

export const useStyles = makeStyles({
  faqContainer: {
    padding: '2% 8.5%',
  },
  faqTitle: {
    marginLeft: spacingToken.spacing4,
    marginBottom: spacingToken.spacing20,
  },
  faqItem: {
    marginTop: spacingToken.spacing12,
    marginBottom: spacingToken.spacing12,
  },
  openFaqItem: {
    background: tokens.colorNeutralForeground3,
    padding: `${spacingToken.spacing8} ${spacingToken.spacing10} ${spacingToken.spacing20}`,
    lineHeight: '24px', // not present in fluent theme

    '& ul': {
      margin: `${spacingToken.spacing12} ${spacingToken.spacing30}`,
    },
  },
  faqQue: {
    '& button': {
      fontSize: tokens.fontSizeBase400,
      fontWeight: tokens.fontWeightSemibold,
    },
  },
});
