import {
  makeStyles,
  tokens,
  typographyStyles,
} from '@fluentui/react-components';

export const useStyle = makeStyles({
  label: {
    color: tokens.colorPaletteBlueForeground2,
    marginBottom: tokens.spacingVerticalXS,
    textTransform: 'uppercase',
    letterSpacing: '2.25px',
  },
  heading: {
    marginBottom: tokens.spacingVerticalS,
  },
  desc: {
    marginBottom: tokens.spacingVerticalL,
    color: tokens.colorNeutralForeground1,
    fontWeight: 350,
  },
  title: {
    marginBottom: tokens.spacingVerticalM,
  },
  paragraph: {
    marginBottom: tokens.spacingVerticalXL,
    lineHeight: tokens.lineHeightBase500,
  },
  link: {
    marginBottom: tokens.spacingVerticalM,
    color: tokens.colorNeutralForeground1,
    textDecoration: 'underline',
  },
  subtitle: {
    marginBottom: tokens.spacingVerticalM,
  },
  caption: {
    lineHeight: tokens.lineHeightBase400,
  },
  customText: {
    ...typographyStyles.title1,
    fontWeight: tokens.fontWeightBold,
  },
});
