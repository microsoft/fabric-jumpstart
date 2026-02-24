import React from 'react';
import { useStyles } from './styles';
import { mergeClasses } from '@fluentui/react-components';
import { useThemeContext } from '@components/Providers/themeProvider';
import { themeType } from '@constants/common';

const Blockquote = (props: React.PropsWithChildren<{}>, disclaimer: string) => {
  const { theme } = useThemeContext();
  const containsText = (
    element: React.ReactNode,
    searchText: string
  ): boolean => {
    if (typeof element === 'string' && element.includes(searchText)) {
      return true;
    }

    if (
      React.isValidElement(element) &&
      (element as React.ReactElement).props.children
    ) {
      return React.Children.toArray(
        (element as React.ReactElement).props.children
      ).some((child) => containsText(child, searchText));
    }

    return false;
  };

  const modifiedChildren =
    React.Children.map(props.children, (child) => {
      return child;
    }) || [];

  const styles = useStyles();
  const isLightMode = theme.key === themeType.light;

  return (
    <blockquote
      className={mergeClasses(
        styles.customBlockquote,
        isLightMode && styles.blockQuoteLightModeIcon,
        containsText(props.children, disclaimer) &&
          styles.customBlockquoteDisclaimer
      )}
    >
      {modifiedChildren.map(
        (child: React.ReactNode) =>
          child && React.isValidElement(child) && child.key && child
      )}
    </blockquote>
  );
};

export default Blockquote;
