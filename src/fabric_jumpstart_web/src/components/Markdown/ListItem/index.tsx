import React from 'react';
import { useStyles } from './styles';

const ListItem = ({ children, ...props }: { children: React.ReactNode }) => {
  // a function like fixedInlineHyphen but recursive
  // this is used to look into children of children
  // and replace the HYPHEN text with a real hyphen
  const styles = useStyles();
  const fixedInlineHyphenRecursive = (
    children: React.ReactNode
  ): React.ReactNode => {
    return React.Children.map(children, (child) => {
      if (typeof child === 'string') {
        return child
          .replace(/HYPHEN/g, '-')
          .replace(/<span>&#95;<\/span>/g, '_')
          .replace(/OptionalPrefix /g, '[Optional] ');
      }
      if (React.isValidElement(child) && child.props.children) {
        const newChildren = fixedInlineHyphenRecursive(child.props.children);
        return React.cloneElement(child, {
          ...child.props,
          children: newChildren,
        });
      }

      return child;
    });
  };

  return (
    <li {...props} className={styles.listItem}>
      {fixedInlineHyphenRecursive(children)}
    </li>
  );
};

export default ListItem;
