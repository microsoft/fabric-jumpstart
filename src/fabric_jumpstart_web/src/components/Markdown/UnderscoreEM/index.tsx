import React from 'react';

const UnderscoreEM = ({ children }: { children: React.ReactNode }) => {
  const replaceUnderscoreSpans = (
    children: React.ReactNode
  ): React.ReactNode => {
    return React.Children.map(children, (child) => {
      if (typeof child === 'string') {
        return child.replace(/<span>&#95;<\/span>/g, '_');
      }
      if (React.isValidElement(child) && child.props.children) {
        const newChildren = replaceUnderscoreSpans(child.props.children);
        return React.cloneElement(child, {
          ...child.props,
          children: newChildren,
        });
      }

      return child;
    });
  };

  return <em>{replaceUnderscoreSpans(children)}</em>;
};

export default UnderscoreEM;
